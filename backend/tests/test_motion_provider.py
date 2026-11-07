"""Run with: python -m unittest discover -s backend/tests -v.

Use a real chat client with a fake HTTP transport. No API credits or project
database changes; the renderer integration test uses an in-memory motion store.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.motion import provider, tools
from app.motion.agent import ClaudeError, usage_of
from app.services.llm_fallback import BackupLlm
from app.settings_schema import MotionSettings
from app.settings_store import AppConfig


def answer(calls=None, text=None, finish="stop"):
    message = {"role": "assistant", "content": text}
    if calls:
        message["tool_calls"] = calls
    return {"choices": [{"message": message, "finish_reason": finish}],
            "usage": {"prompt_tokens": 100, "completion_tokens": 20,
                      "prompt_tokens_details": {"cached_tokens": 30}}}


def call(name, args, cid="call1"):
    return {"id": cid, "type": "function", "function": {"name": name, "arguments": json.dumps(args)},
            "extra_content": {"google": {"thought_signature": "keep-this-signature"}}}


SCHEMA = {"type": "object", "properties": {"brief": {"type": "string"}}, "required": ["brief"]}


class ProviderTests(unittest.TestCase):
    def setUp(self):
        self.requests = []
        self.responses = []
        self.client = BackupLlm(AppConfig(llm_fallback_url="https://backup.invalid/v1",
                                         llm_fallback_model="gemini-3.8-flash-medium"))
        self.client.close()

        def handle(request):
            self.requests.append(json.loads(request.content))
            if not self.responses:
                raise AssertionError("Unexpected extra API request")
            response = self.responses.pop(0)
            if isinstance(response, httpx.Response):
                return response
            return httpx.Response(200, json=response)

        self.client._client = httpx.Client(transport=httpx.MockTransport(handle))
        self.patches = [patch.object(provider, "backup_llm", return_value=self.client),
                        patch.object(provider.backup_usage, "note")]
        for p in self.patches:
            p.start()
            self.addCleanup(p.stop)
        self.addCleanup(self.client.close)
        self.session = SimpleNamespace(track_id=-1, mode="full", lo=0, hi=0, submitted=set(),
                                       visual_check=True, planned=False, want_overlays=0)
        self.motion = {"plan_slots": [0], "items": []}

    def run_backup(self, **kwargs):
        return provider.run_designer("Test graphics", provider="backup", model="opus", effort="medium", **kwargs)

    def test_old_settings_keep_claude_and_both_backends_are_selectable(self):
        self.assertEqual(MotionSettings.model_validate({"mode": "full"}).provider, "claude")
        self.assertEqual(MotionSettings(provider="backup").provider, "backup")
        with patch.object(provider, "run_claude", return_value={"ok": True}) as run:
            self.assertEqual(provider.run_designer("test", session=self.session, model="opus", effort="low"), {"ok": True})
            run.assert_called_once_with("test", model="opus", effort="low")
        with patch.object(provider, "run_claude", side_effect=ClaudeError("login")):
            with self.assertRaisesRegex(provider.MotionError, "login"):
                provider.run_designer("test")

    def test_structured_output_repaired_and_metadata_preserved(self):
        first = call("structured_output", {"json": '{"brief": 123}'})
        self.responses = [answer([first]), answer([call("structured_output", {"json": '{"brief":"ok"}'}, "call2")])]
        result = self.run_backup(json_schema=SCHEMA)
        self.assertEqual(result["structured_output"], {"brief": "ok"})
        replay = self.requests[1]["messages"]
        self.assertEqual(replay[2]["tool_calls"][0], first)
        self.assertIn("ERR", replay[3]["content"])
        self.assertEqual(usage_of(result), {"in": 140, "cache_read": 60, "cache_write": 0, "out": 40})
        self.assertEqual(self.requests[0]["model"], "gemini-3.8-flash-medium")
        self.assertNotIn("effort", self.requests[0])

    def test_tool_errors_and_images_return_to_model_before_completion(self):
        self.responses = [answer([call("submit", {"items": "[]"})]),
                          answer([call("submit", {"items": "[]"}, "call2")]), answer(text="Done")]
        n = 0

        def handle(session, msg):
            nonlocal n
            n += 1
            if n == 1:
                content = [{"type": "text", "text": "ERR: text does not fit"}]
            else:
                session.submitted.add("s0")
                self.motion["items"] = [{"id": "s0", "kind": "scene", "slots": [0]}]
                content = [{"type": "text", "text": "ok s0. Done."},
                           {"type": "image", "mimeType": "image/jpeg", "data": "aGVsbG8="}]
            return {"result": {"content": content}}

        with patch.object(tools, "_handle", side_effect=handle), patch.object(tools, "_motion", return_value=self.motion):
            self.run_backup(session=self.session, tools=["submit", "look"])
        self.assertIn("ERR", self.requests[1]["messages"][-1]["content"])
        image_message = self.requests[2]["messages"][-1]
        self.assertEqual(image_message["role"], "user")
        self.assertEqual(image_message["content"][1]["image_url"]["url"], "data:image/jpeg;base64,aGVsbG8=")
        self.assertEqual(self.requests[2]["messages"][-2]["role"], "tool")

    def test_disallowed_tools_never_execute(self):
        self.responses = [answer([call("plan", {"scenes": [0]})]), answer(text="No"), answer(text="No")]
        with patch.object(tools, "_handle") as execute, patch.object(tools, "_motion", return_value=self.motion):
            with self.assertRaisesRegex(provider.MotionError, "не вызывает инструменты"):
                self.run_backup(session=self.session, tools=["submit"])
            execute.assert_not_called()
        self.assertIn("not allowed", self.requests[1]["messages"][-1]["content"])

    def test_malformed_arguments_are_returned_for_repair(self):
        malformed = call("submit", {})
        malformed["function"]["arguments"] = "{broken"
        self.responses = [answer([malformed]), answer(text="No"), answer(text="No")]
        with patch.object(tools, "_handle") as execute, patch.object(tools, "_motion", return_value=self.motion):
            with self.assertRaises(provider.MotionError):
                self.run_backup(session=self.session, tools=["submit"])
            execute.assert_not_called()
        self.assertIn("Fix and call", self.requests[1]["messages"][-1]["content"])

    def test_visual_check_can_be_disabled(self):
        self.session.visual_check = False
        self.responses = [answer(text="No"), answer(text="No")]
        with patch.object(tools, "_motion", return_value=self.motion):
            with self.assertRaises(provider.MotionError):
                self.run_backup(session=self.session, tools=["submit", "look"])
        self.assertEqual([t["function"]["name"] for t in self.requests[0]["tools"]], ["submit"])

    def test_all_parallel_tool_results_precede_image_message(self):
        self.responses = [answer([call("look", {"ids": ["s0"]}, "a"), call("look", {"ids": ["s0"]}, "b")]),
                          answer(text="Done")]
        self.session.submitted = {"s0"}
        self.motion["items"] = [{"id": "s0", "kind": "scene", "slots": [0]}]
        result = {"result": {"content": [{"type": "text", "text": "sheet"},
                                          {"type": "image", "mimeType": "image/jpeg", "data": "aGVsbG8="}]}}
        with patch.object(tools, "_handle", return_value=result), patch.object(tools, "_motion", return_value=self.motion):
            self.run_backup(session=self.session, tools=["look"])
        replay = self.requests[1]["messages"]
        self.assertEqual([m["role"] for m in replay[-3:]], ["tool", "tool", "user"])
        self.assertEqual([m["tool_call_id"] for m in replay[-3:-1]], ["a", "b"])
        self.assertEqual(len(replay[-1]["content"]), 3)

    def test_mixed_cannot_finish_without_plan_or_with_unwritten_slots(self):
        self.session.mode = "mixed"
        self.session.submitted = {"o0"}
        self.responses = [answer(text="Done"), answer(text="Done")]
        with patch.object(tools, "_motion", return_value=self.motion):
            with self.assertRaises(provider.MotionError):
                self.run_backup(session=self.session, tools=["plan", "submit"])
        self.assertIn("Call plan first", self.requests[1]["messages"][-2]["content"])

    def test_repeated_tool_calls_hit_step_limit(self):
        self.responses = [answer([call("look", {"ids": []}, f"call{i}")]) for i in range(64)]
        result = {"result": {"content": [{"type": "text", "text": "No items yet"}]}}
        with patch.object(tools, "_handle", return_value=result):
            with self.assertRaisesRegex(provider.MotionError, "число шагов"):
                self.run_backup(session=self.session, tools=["look"])
        self.assertEqual(len(self.requests), 64)

    def test_truncated_tool_call_is_not_executed(self):
        self.responses = [answer([call("submit", {})], finish="length")]
        with patch.object(tools, "_handle") as execute:
            with self.assertRaisesRegex(provider.MotionError, "обрезан"):
                self.run_backup(session=self.session, tools=["submit"])
            execute.assert_not_called()

    def test_cancel_and_deadline_stop_before_api_request(self):
        with self.assertRaisesRegex(provider.MotionError, "остановлено"):
            self.run_backup(json_schema=SCHEMA, should_stop=lambda: True)
        self.assertEqual(self.requests, [])
        with self.assertRaisesRegex(provider.MotionError, "не уложилась"):
            self.run_backup(json_schema=SCHEMA, timeout=0)

    def test_missing_backup_settings_are_clear(self):
        with patch.object(provider, "backup_llm", return_value=None):
            with self.assertRaisesRegex(provider.MotionError, "не настроена"):
                provider.check_provider("backup")
            with self.assertRaisesRegex(provider.MotionError, "не настроена"):
                self.run_backup(json_schema=SCHEMA)

    def test_unsupported_gateway_error_explains_required_capabilities(self):
        self.responses = [httpx.Response(400, json={"error": {"message": "tools unsupported"}})]
        with self.assertRaisesRegex(provider.MotionError, "входные изображения"):
            self.run_backup(session=self.session, tools=["submit"])

    def test_ordinary_backup_chat_still_returns_text(self):
        self.responses = [answer(text="ordinary text")]
        self.assertEqual(self.client.chat([{"role": "user", "content": "hello"}], max_tokens=64), "ordinary text")
        self.assertEqual(self.requests[0]["temperature"], 0.7)
        self.assertEqual(self.requests[0]["max_tokens"], 64)

    def test_actual_submit_validates_renders_and_returns_contact_sheet(self):
        scene = SimpleNamespace(idx=0, start=0.0, end=5.0, text="Рост до ста", image=None)
        with tempfile.TemporaryDirectory(prefix="motion-provider-test-") as folder:
            session = tools.Session(token="test", track_id=-1, mode="full", lo=0, hi=0, t0=0, t1=5,
                                    scenes=[scene], words=[], duration=5, lang="ru", width=640, height=360,
                                    fonts_dir=None, assets={}, safe_bottom=0, visual_check=True, work=Path(folder))
            self.motion.update(style={"base": "editorial"}, v=1, mode="full")

            def save(track_id, fn):
                fn(self.motion)
                return copy.deepcopy(self.motion)

            item = {"kind": "scene", "slots": [0], "note": "Рост до ста", "els": [
                {"type": "counter", "value": 100, "x": 960, "y": 480, "size": 260},
                {"type": "text", "text": "Рост", "x": 960, "y": 700, "size": 72}]}
            self.responses = [answer([call("submit", {"items": json.dumps([item])})]), answer(text="Done")]
            with patch.object(tools, "_motion", side_effect=lambda _: copy.deepcopy(self.motion)), \
                    patch.object(tools, "_save", side_effect=save):
                self.run_backup(session=session, tools=["submit", "look"])
            self.assertEqual(session.submitted, {"s0"})
            self.assertEqual(self.motion["items"][0]["id"], "s0")
            self.assertIn("data:image/jpeg;base64,", self.requests[1]["messages"][-1]["content"][1]["image_url"]["url"])


if __name__ == "__main__":
    unittest.main()
