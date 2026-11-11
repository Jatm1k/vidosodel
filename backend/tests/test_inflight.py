"""Offline API-contract, persistence, quota, pipeline and real clip decoding tests."""
from __future__ import annotations

import base64
import hashlib
from contextlib import contextmanager
import io
import json
from pathlib import Path
import sys
import tempfile
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import cv2
import httpx
import numpy as np
from PIL import Image
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import Base
from app.models import Channel, Project, Track, Scene, Character, MediaGeneration
from app.settings_schema import PipelineSettings, effective_settings
from app.settings_store import AppConfig, mask_secret
from app.services.inflight import InflightClient, encode_image, wire_payload, connection_error
from app.services import inflight_queue as queue
from app.services.http import ApiError
from app.pipeline.footage import wants_video
from app.jobs.footage_jobs import scene_payload, generate_scenes
from app.jobs.common import TrackCtx
from app.jobs.runner import JobError
from app.render.footage import FootageReader


class TransportTests(unittest.TestCase):
    def setUp(self):
        self.cfg = AppConfig(inflight_api_key="mk_test_key_only")
        self.requests = []

    def client(self, response):
        def handle(request):
            self.requests.append(request)
            return response(request)
        return InflightClient(self.cfg, httpx.MockTransport(handle))

    def test_all_six_endpoints_and_native_orientation(self):
        with self.client(lambda r: httpx.Response(200, json={"id": "remote", "state": "accepted"})) as client:
            from app.services.inflight import MODES
            for mode, endpoint in MODES.items():
                result = client.submit("image" if mode.endswith("i") else "video",
                    [{"mode": mode, "body": {"prompt": "hello", "aspect_ratio": "9:16"}}])
                self.assertEqual(result[0]["id"], "remote")
                req = self.requests[-1]
                self.assertTrue(req.url.path.endswith(endpoint))
                self.assertEqual(req.headers["X-API-Key"], self.cfg.inflight_api_key)
                self.assertEqual(json.loads(req.content)["aspect_ratio"], "9:16")

    def test_batch_and_poll_are_grouped(self):
        with self.client(lambda r: httpx.Response(200, json={"jobs": [{"id": "1"}, {"id": "2"}]})) as client:
            result = client.submit("video", [{"mode": "t2v", "body": {"prompt": "a"}},
                                             {"mode": "t2v", "body": {"prompt": "b"}}])
            self.assertEqual(len(result), 2)
            body = json.loads(self.requests[-1].content)
            self.assertTrue(self.requests[-1].url.path.endswith("/jobs"))
            self.assertNotIn("mode", body["jobs"][1])  # /jobs has no mode field
            self.assertNotIn("image_role", body["jobs"][1])
            client.poll(["1", "2"])
            self.assertEqual(self.requests[-1].url.params["ids"], "1,2")

    def test_reference_and_frame_batches_use_image_role_and_ordered_images(self):
        ref = {"name": "REF_A", "image_base64": "QUJD", "mime": "image/jpeg"}
        frame = {"image_base64": "REVG", "mime": "image/jpeg"}
        bodies = {"ref2i": {"reference_images": [ref]}, "ref2v": {"reference_images": [ref]},
                  "i2v": {"image_base64": "REVG", "image_mime": "image/jpeg"},
                  "frames2v": {"first_frame": frame, "last_frame": ref, "duration_seconds": 6},
                  "frame_ref2v": {"first_frame": frame, "last_frame_reference": ref}}
        roles = {"ref2i": "reference", "ref2v": "reference", "i2v": "first_frame",
                 "frames2v": "first_last_frame", "frame_ref2v": "first_frame_last_reference"}
        with self.client(lambda r: httpx.Response(200, json={"jobs": [{"id": "1"}, {"id": "2"}]})) as client:
            for mode, extra in bodies.items():
                with self.subTest(mode=mode):
                    client.submit("image" if mode == "ref2i" else "video", [
                        {"mode": mode, "body": {"prompt": "a", **extra}}, {"mode": mode, "body": {"prompt": "b", **extra}}])
                    job = json.loads(self.requests[-1].content)["jobs"][0]
                    self.assertEqual(job["image_role"], roles[mode])
                    self.assertNotIn("mode", job)
                    self.assertNotIn("reference_images", job)
                    self.assertEqual(job["images"][0]["image_base64"], "REVG" if mode in ("i2v", "frames2v", "frame_ref2v") else "QUJD")
                    if mode == "frames2v":
                        self.assertEqual(job["duration_seconds"], 6)
            with self.assertRaises(ValueError):
                client.submit("video", [{"mode": "im2v", "body": {}}, {"mode": "t2v", "body": {"prompt": "x"}}])

    def test_post_timeout_is_not_retried(self):
        def timeout(req):
            raise httpx.ReadTimeout("timeout", request=req)
        with self.client(timeout) as client, self.assertRaises(ApiError) as cm:
            client.submit("video", [{"mode": "t2v", "body": {"prompt": "x"}}])
        self.assertEqual(len(self.requests), 1)
        self.assertTrue(cm.exception.body["ambiguous"])

    def test_key_check_retries_transient_connection_failure(self):
        def response(req):
            if len(self.requests) == 1:
                raise httpx.ConnectError("connection reset", request=req)
            return httpx.Response(200, json={"plan": "parallel"})
        with self.client(response) as client, patch("app.services.inflight.time.sleep"):
            self.assertEqual(client.account_info()["plan"], "parallel")
        self.assertEqual(len(self.requests), 2)

    def test_connection_diagnostics_distinguish_tls_dns_and_hide_secrets(self):
        tls = connection_error(httpx.ConnectTimeout("_ssl.c:993: The handshake operation timed out"), "api.varag.video")
        self.assertIn("TLS", tls)
        self.assertIn("api.varag.video", tls)
        dns = connection_error(httpx.ConnectError("[Errno 11001] getaddrinfo failed"), "api.varag.video")
        self.assertIn("DNS", dns)
        secret = "mk_never_show_this_key"
        self.assertNotIn(secret, connection_error(httpx.ConnectError(secret), "api.varag.video"))

    def test_pasted_key_whitespace_is_trimmed(self):
        self.cfg.inflight_api_key = "  mk_test_key_only\r\n"
        with self.client(lambda r: httpx.Response(200, json={"plan": "parallel"})) as client:
            client.account_info()
        self.assertEqual(self.requests[-1].headers["X-API-Key"], "mk_test_key_only")

    def test_error_code_and_cancellation(self):
        with self.client(lambda r: httpx.Response(409, json={"detail": {"code": "JOB_RUNNING", "message": "running"}})) as client:
            with self.assertRaises(ApiError) as cm:
                client.cancel("a/b")
            self.assertEqual(cm.exception.body["code"], "JOB_RUNNING")
        with self.client(lambda r: httpx.Response(200, json={"state": "cancelled"})) as client:
            client.cancel("abc", hard=True)
            self.assertEqual(self.requests[-1].method, "POST")
            self.assertTrue(self.requests[-1].url.path.endswith("/hard-cancel"))

    def test_input_compression_enforces_binary_limit(self):
        image = Image.fromarray(np.random.default_rng(1).integers(0, 256, (2200, 2200, 3), dtype=np.uint8))
        output = io.BytesIO()
        image.save(output, "PNG")
        self.assertGreater(len(output.getvalue()), 1_500_000)
        result = encode_image(output.getvalue())
        self.assertLessEqual(len(base64.b64decode(result["image_base64"])), 1_500_000)
        self.assertEqual(result["mime"], "image/jpeg")

    def test_reference_order_names_and_first_frame_distinction(self):
        fake = {"image_base64": "AA==", "mime": "image/jpeg"}
        refs = [{"name": "REF_HERO", "path": "a"}, {"name": "REF_PLACE", "path": "b"}]
        with patch("app.services.inflight.encode_image", return_value=fake):
            payload = wire_payload("ref2v", {"prompt": "x", "references": refs})
            self.assertEqual([r["name"] for r in payload["reference_images"]], ["REF_HERO", "REF_PLACE"])
            first = wire_payload("i2v", {"prompt": "x", "first_frame": "a"})
            self.assertIn("image_base64", first)
            self.assertNotIn("reference_images", first)
        with self.assertRaises(ValueError):
            wire_payload("ref2v", {"prompt": "x", "references": refs * 6})
        with self.assertRaises(ValueError):
            wire_payload("t2v", {"prompt": "x", "aspect_ratio": "1:1"})


class QueueTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.engine = create_engine("sqlite:///" + str(Path(self.tmp.name) / "test.db"))
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        @contextmanager
        def scope():
            with self.sessions() as db:
                try:
                    yield db
                    db.commit()
                except Exception:
                    db.rollback()
                    raise
        self.scope = scope
        self.cfg = AppConfig(inflight_api_key="test", inflight_video_daily=1000, inflight_image_daily=1000)
        self.patches = [patch.object(queue, "session_scope", scope), patch.object(queue, "load_config", return_value=self.cfg)]
        for p in self.patches:
            p.start()
        account = hashlib.sha256(b"test").hexdigest()
        def usage():
            # Like the real server: busy slots are the key's accepted/running jobs.
            with scope() as db:
                active = queue.active_counts(db, account)
            return {"plan": "parallel", **{k: {"slots": 12, "free": max(0, 12 - active[k]), "busy": active[k],
                                              "left": 1000} for k in ("video", "image")}}
        self.client = SimpleNamespace(account=account, usage=usage)
        self.submissions = []
        def submit(kind, tasks):
            self.submissions.append(tasks)
            return [{"id": "remote-" + t["body"]["client_ref"], "client_ref": t["body"]["client_ref"],
                     "state": "accepted"} for t in tasks]
        self.client.submit = submit
        queue._LAST_POLL.clear()
        queue._BATCH_LIMIT.clear()

    def tearDown(self):
        for p in reversed(self.patches):
            p.stop()
        self.engine.dispose()
        self.tmp.cleanup()

    def add(self, owner="scene:1:video", mode="t2v"):
        return queue.enqueue(self.client, owner, "image" if mode == "t2i" else "video", mode,
            {"prompt": "test", "image_prompt": "still", "video_prompt": "move"})

    def test_reference_jobs_are_batched_with_roles_and_fill_all_slots(self):
        from app.services import inflight
        root = Path(self.tmp.name)
        Image.new("RGB", (32, 32), "green").save(root / "hero.jpg")
        requests = []
        def server(req):
            requests.append(req)
            if req.url.path.endswith('/account/usage'):
                return httpx.Response(200, json=self.client.usage())
            body = json.loads(req.content)
            self.assertTrue(req.url.path.endswith('/jobs'))
            self.assertEqual(body['kind'], 'image')
            for job in body['jobs']:
                self.assertEqual(job['image_role'], 'reference')
                self.assertEqual(job['images'][0]['name'], 'REF_HERO')
                self.assertTrue(job['images'][0]['image_base64'])
            return httpx.Response(200, json={'jobs': [{'id': j['client_ref'], 'client_ref': j['client_ref'],
                                                       'state': 'accepted'} for j in body['jobs']]})
        with InflightClient(self.cfg, httpx.MockTransport(server)) as client, patch.object(inflight, 'media_root', return_value=root):
            client.account = self.client.account
            ids = [queue.enqueue(client, f'scene:{i}:image', 'image', 'ref2i', {
                'prompt': 'REF_HERO walks', 'references': [{'name': 'REF_HERO', 'path': 'hero.jpg'}]}) for i in range(15)]
            queue.admit(client, ids)
        posts = [r for r in requests if r.method == 'POST']
        self.assertEqual(len(posts), 1)
        self.assertEqual(len(json.loads(posts[0].content)['jobs']), 12)
        with self.scope() as db:
            rows = db.scalars(select(MediaGeneration)).all()
            self.assertEqual(sum(r.state == 'accepted' for r in rows), 12)
            audit = rows[0].payload['_request_audit']
            self.assertEqual(audit['endpoint'], '/jobs')
            self.assertGreater(audit['references'][0]['bytes'], 0)
            self.assertEqual(len(audit['references'][0]['sha256']), 64)

    def test_server_ignoring_image_role_disables_role_batches(self):
        ids = [queue.enqueue(self.client, f'scene:{i}:video', 'video', 'ref2v', {'prompt': 'x', 'references': []}) for i in range(2)]
        with self.scope() as db:
            for rid in ids:
                row = db.get(MediaGeneration, rid)
                row.state, row.remote_id = 'accepted', f'r{rid}'
                row.payload = {**row.payload, '_request_audit': {'endpoint': '/jobs', 'mode': 'ref2v'}}
        self.client.poll = lambda remote: [{'id': r, 'state': 'ready', 'mode': 't2v'} for r in remote]
        queue.poll(self.client, ids)
        self.assertIn(self.client.account, queue._NO_ROLE_BATCH)
        queue._NO_ROLE_BATCH.discard(self.client.account)

    def test_server_mode_downgrade_is_reported_and_never_applied_or_retried(self):
        rid = self.add(mode='im2v')
        self.client.submit = lambda kind, tasks: [{'id': 'wrong-mode', 'state': 'ready', 'mode': 't2v'}]
        queue.admit(self.client, [rid])
        with self.scope() as db:
            row = db.get(MediaGeneration, rid)
            self.assertEqual(row.state, 'failed')
            self.assertIn('t2v', row.error)
            self.assertIn('im2v', row.error)
            self.assertEqual(row.remote_id, 'wrong-mode')
            self.assertIsNone(row.file)
        queue.admit(self.client, [rid])

    def test_poll_mode_downgrade_is_caught_after_acceptance(self):
        rid = self.add(mode='im2v')
        queue.admit(self.client, [rid])
        self.client.poll = lambda ids: [{'id': ids[0], 'state': 'ready', 'mode': 't2v'}]
        queue.poll(self.client, [rid])
        with self.scope() as db:
            row = db.get(MediaGeneration, rid)
            self.assertEqual(row.state, 'failed')
            self.assertIsNone(row.file)

    def test_restart_reuses_accepted_remote_id(self):
        rid = self.add()
        queue.admit(self.client, [rid])
        again = self.add()
        self.assertEqual(rid, again)
        queue.admit(self.client, [again])
        self.assertEqual(len(self.submissions), 1)
        with self.scope() as db:
            self.assertTrue(db.get(MediaGeneration, rid).remote_id)

    def test_admission_caps_at_twelve_and_budgets_1000(self):
        ids = [self.add(f"scene:{i}:video") for i in range(20)]
        queue.admit(self.client, ids)
        self.assertEqual(len(self.submissions[0]), 12)
        queue.admit(self.client, ids)
        self.assertEqual(len(self.submissions), 1)
        with self.scope() as db:
            left = queue.local_remaining(db, self.client.account, self.cfg)
            self.assertEqual(left, {"video": 988, "image": 1000})

    def test_daily_budget_and_composite_charge_both_pools(self):
        rid = self.add(mode="im2v")
        queue.admit(self.client, [rid])
        with self.scope() as db:
            left = queue.local_remaining(db, self.client.account, self.cfg)
            self.assertEqual(left, {"video": 999, "image": 999})
            row = db.get(MediaGeneration, rid)
            row.submitted_at = time.time() - 86400
        with self.scope() as db:
            self.assertEqual(queue.local_remaining(db, self.client.account, self.cfg), {"video": 1000, "image": 1000})

    def test_ambiguous_submission_blocks_duplicates(self):
        rid = self.add()
        def timeout(*args):
            raise ApiError("Inflight", 0, "timeout")
        self.client.submit = timeout
        with self.assertRaises(ApiError):
            queue.admit(self.client, [rid])
        with self.scope() as db:
            self.assertEqual(db.get(MediaGeneration, rid).state, "unknown")
        self.assertEqual(self.add(), rid)
        with self.assertRaises(RuntimeError):
            queue.admit(self.client, [rid])

    def test_queued_payload_can_be_fixed_and_declined_prompt_is_not_blindly_resent(self):
        rid = self.add()
        same = queue.enqueue(self.client, "scene:1:video", "video", "t2v", {"prompt": "corrected"})
        self.assertEqual(rid, same)
        with self.scope() as db:
            row = db.get(MediaGeneration, rid)
            self.assertEqual(row.payload["prompt"], "corrected")
            row.state = "declined"
        self.assertEqual(queue.enqueue(self.client, "scene:1:video", "video", "t2v", {"prompt": "corrected"}), rid)
        self.assertNotEqual(queue.enqueue(self.client, "scene:1:video", "video", "t2v", {"prompt": "a new idea"}), rid)

    def test_explicit_retry_can_retry_declined_but_keeps_ready_and_unknown_ids(self):
        rid = self.add()
        with self.scope() as db: db.get(MediaGeneration, rid).state = 'declined'
        again = queue.enqueue(self.client, 'scene:1:video', 'video', 't2v',
            {'prompt': 'test', 'image_prompt': 'still', 'video_prompt': 'move'}, retry_failed=True)
        self.assertNotEqual(again, rid)
        with self.scope() as db: db.get(MediaGeneration, again).state = 'ready'
        self.assertEqual(queue.enqueue(self.client, 'scene:1:video', 'video', 't2v',
            {'prompt': 'test', 'image_prompt': 'still', 'video_prompt': 'move'}, retry_failed=True), again)
        with self.scope() as db: db.get(MediaGeneration, again).state = 'unknown'
        self.assertEqual(queue.enqueue(self.client, 'scene:1:video', 'video', 't2v',
            {'prompt': 'test', 'image_prompt': 'still', 'video_prompt': 'move'}, retry_failed=True), again)

    def test_slots_busy_keeps_client_queue_without_charging(self):
        rid = self.add()
        def busy(*args):
            raise ApiError("Inflight", 429, "busy", {"code": "SLOTS_BUSY"})
        self.client.submit = busy
        queue.admit(self.client, [rid])
        with self.scope() as db:
            row = db.get(MediaGeneration, rid)
            self.assertEqual(row.state, "queued")
            self.assertIsNone(row.submitted_at)

    def test_oversized_batch_is_split_without_duplicate_charges(self):
        ids = [self.add(f"scene:{i}:video") for i in range(4)]
        submit = self.client.submit
        def limited(kind, tasks):
            if len(tasks) > 2:
                raise ApiError("Inflight", 413, "too large", {"code": "REQUEST_TOO_LARGE"})
            return submit(kind, tasks)
        self.client.submit = limited
        queue.admit(self.client, ids)
        self.assertFalse(self.submissions)
        queue.admit(self.client, ids)
        self.assertEqual(len(self.submissions[0]), 2)
        with self.scope() as db:
            self.assertEqual(queue.local_remaining(db, self.client.account, self.cfg)["video"], 996)

    def test_server_other_apps_and_chain_pool_are_respected(self):
        usage = self.client.usage()
        usage["image"]["busy"] = 5
        usage["video"]["busy"] = 3
        local = {"video": 1000, "image": 1000}
        self.assertEqual(queue.capacity(usage, local, "video", 12), 9)
        usage["plan"] = "chain"
        self.assertEqual(queue.capacity(usage, local, "video", 12), 7)
        local["image"] = 0
        self.assertEqual(queue.capacity(usage, local, "video", 12, composite=True), 0)

    def test_declined_result_is_terminal_no_automatic_retry(self):
        rid = self.add()
        queue.admit(self.client, [rid])
        with self.scope() as db:
            row = db.get(MediaGeneration, rid)
            row.state, row.error = "declined", "CONTENT_REFUSED"
        ctx = SimpleNamespace(check=lambda: None, set_idle=lambda v: None)
        rows = queue.run(self.client, [rid], ctx)
        self.assertEqual(rows[0].state, "declined")
        self.assertEqual(len(self.submissions), 1)

    def test_group_poll_preserves_remote_ids(self):
        ids = [self.add(f"scene:{i}:video") for i in range(3)]
        queue.admit(self.client, ids)
        calls = []
        def poll(remote):
            calls.append(remote)
            return [{"id": rid, "state": "running"} for rid in remote]
        self.client.poll = poll
        queue.poll(self.client, ids[:1])
        queue.poll(self.client, ids[1:])
        self.assertEqual(len(calls), 1)
        self.assertEqual(len(calls[0]), 3)
        with self.scope() as db:
            self.assertTrue(all(r.state == "running" and r.remote_id for r in db.scalars(select(MediaGeneration))))

    def test_scene_jobs_generate_first_frames_video_and_resume_without_spending_again(self):
        self._scene_generation_fixture()

    def test_mixed_images_and_motion_generate_reference_first_frames_before_clips(self):
        self._scene_generation_fixture(mixed=True)

    def test_previously_accepted_ref2v_is_resumed_without_new_first_frames_or_duplicate_video(self):
        self._scene_generation_fixture(legacy=True)

    def _scene_generation_fixture(self, mixed=False, legacy=False):
        from app.jobs import footage_jobs, video_prompt_jobs, character_jobs
        from app.services import inflight
        from app import storage
        root = Path(self.tmp.name) / "media"
        root.mkdir()
        Image.new("RGB", (64, 48), "red").save(root / "hero.jpg")
        with self.scope() as db:
            ch = Channel(name="test", settings={})
            db.add(ch); db.flush()
            p = Project(channel_id=ch.id, name="test", settings={"videos": {
                "mode": "mixed" if mixed else "full", "generation": "auto", "character_refs": True},
                "images": {"provider": "inflight", "character_refs": True, "scene_continuity": mixed}})
            db.add(p); db.flush()
            hero = Character(project_id=p.id, name="Anna", image_file="hero.jpg", image_status="done", image_origin="upload")
            db.add(hero); db.flush()
            hid = hero.id
            t = Track(project_id=p.id, language="ru", motion={"plan_slots": [3]} if mixed else {})
            db.add(t); db.flush()
            for i in range(4 if mixed else 2):
                sc = Scene(track_id=t.id, idx=i, start=i * 2, end=(i+1) * 2, prompt=f"Anna walks on the shore {i}",
                    characters=[hid], continuity={"change": "Anna looks up"} if mixed and i == 2 else None,
                    overrides={"video_prompt": "Gentle waves roll towards the shore while the camera stays locked."})
                db.add(sc); db.flush()
                if legacy:
                    db.add(MediaGeneration(owner=f"scene:{sc.id}:video", account=self.client.account, kind="video",
                        mode="ref2v", state="accepted", remote_id=f"old-{sc.id}", payload={"prompt": "old accepted request"},
                        submitted_at=time.time()))
            tid, pid = t.id, p.id
        submissions, modes = self.submissions, {}
        fake = self.client
        submit = fake.submit
        def submit_with_modes(kind, items):
            result = submit(kind, items)
            for task, accepted in zip(items, result):
                modes[accepted["id"]] = task["mode"]
            return result
        fake.submit = submit_with_modes
        fake.poll = lambda ids: [{"id": rid, "state": "ready", "url": "https://example.invalid/" + rid} for rid in ids]
        def download(url, dest):
            if dest.suffix == ".mp4":
                writer = cv2.VideoWriter(str(dest), cv2.VideoWriter_fourcc(*"mp4v"), 10, (64, 48))
                for i in range(10):
                    writer.write(np.full((48, 64, 3), 40 + i * 10, np.uint8))
                writer.release()
            else:
                Image.new("RGB", (64, 48), "blue").save(dest)
        fake.download = download
        class ContextClient:
            def __enter__(self): return fake
            def __exit__(self, *args): pass
        ctx = SimpleNamespace(params={}, track_id=tid, project_id=pid,
            check=lambda: None, set_idle=lambda v: None, progress=lambda *a, **k: None)
        real_poll = queue.poll
        def fresh_poll(client, ids):
            queue._LAST_POLL.clear()
            return real_poll(client, ids)
        with patch.object(footage_jobs, "session_scope", self.scope), \
             patch.object(video_prompt_jobs, "session_scope", self.scope), \
             patch.object(character_jobs, "session_scope", self.scope), \
             patch.object(footage_jobs, "load_config", return_value=self.cfg), \
             patch.object(footage_jobs, "InflightClient", ContextClient), \
             patch.object(queue, "media_root", return_value=root), \
             patch.object(storage, "media_root", return_value=root), \
             patch.object(inflight, "media_root", return_value=root), \
             patch.object(queue, "poll", fresh_poll), patch.object(queue.time, "sleep"):
            if mixed:
                generate_scenes(ctx, False)
            generate_scenes(ctx, True)
            expected = 0 if legacy else 4  # Reference first frames and i2v clips, batched with image_role.
            self.assertEqual(sum(map(len, submissions)), expected)
            if not legacy:
                self.assertEqual(set(modes.values()), {"ref2i", "i2v"})
                for batch in submissions:
                    for task in batch:
                        if task["mode"] == "ref2i":
                            refs = task["body"]["reference_images"]
                            self.assertIn(f"REF_CHARACTER_{hid}", [r["name"] for r in refs])
                        else:
                            self.assertIn("image_base64", task["body"])
                            self.assertNotIn("reference_images", task["body"])
                            pixel = Image.open(io.BytesIO(base64.b64decode(task["body"]["image_base64"]))).getpixel((0, 0))
                            self.assertGreater(pixel[2], 200)  # Generated blue frame, not the red portrait.
            generate_scenes(ctx, True)
            self.assertEqual(sum(map(len, submissions)), expected)
            with self.scope() as db:
                for sc in db.get(Track, tid).scenes:
                    if mixed and sc.idx == 3:
                        self.assertFalse(sc.video_file or sc.image_file)  # Motion consumes no image/video quota.
                    elif not mixed or sc.idx == 1:
                        self.assertEqual(sc.video_status, "done")
                        self.assertTrue((root / sc.video_file).is_file())
                        self.assertTrue(sc.video_meta["poster_file"].endswith(".poster.jpg"))
                        if legacy:
                            self.assertFalse(sc.image_file)
                            self.assertEqual(sc.video_meta["mode"], "ref2v")
                        else:
                            self.assertTrue((root / sc.image_file).is_file())
                            self.assertNotEqual(sc.image_file, sc.video_meta["poster_file"])
                            self.assertEqual(sc.image_meta["mode"], "ref2i")
                    else:
                        self.assertTrue(sc.image_file)
                        self.assertFalse(sc.video_file)
            if legacy:
                # Explicit regeneration upgrades completed legacy ref2v clips
                # to reference-built first frames + i2v, rather than reattaching them.
                ctx.params = {"force": True}
                generate_scenes(ctx, True)
                self.assertEqual(sum(map(len, submissions)), 4)
                self.assertEqual(set(modes.values()), {"ref2i", "i2v"})
                with self.scope() as db:
                    self.assertTrue(all(sc.video_meta["mode"] == "i2v" for sc in db.get(Track, tid).scenes))


class PlanningTests(unittest.TestCase):
    def test_application_routes_and_legacy_meta_defaults(self):
        from fastapi.testclient import TestClient
        from app.main import app
        from app.jobs.runner import _REGISTRY
        client = TestClient(app)  # No lifespan: never starts real user jobs.
        response = client.get("/api/meta")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["defaults"]["videos"]["mode"], "off")
        paths = set(client.get("/openapi.json").json()["paths"])
        self.assertIn("/api/inflight/tasks", paths)
        self.assertIn("/api/scenes/{scene_id}/video", paths)
        self.assertIn("videos", _REGISTRY)
        client.close()

    def test_old_settings_and_mixed_selection(self):
        settings = effective_settings({})
        scenes = [SimpleNamespace(idx=i, overrides={}) for i in range(10)]
        self.assertFalse(any(wants_video(s, settings) for s in scenes))
        settings.videos.mode, settings.videos.share = "mixed", .3
        self.assertEqual(sum(wants_video(s, settings) for s in scenes), 3)
        scenes[0].overrides = {"media_type": "video"}
        self.assertTrue(wants_video(scenes[0], settings))
        settings.videos.mode = "full"
        scenes[1].overrides = {"media_type": "image"}
        self.assertFalse(wants_video(scenes[1], settings))

    def test_intro_uses_only_first_n_scenes_and_inherits_count(self):
        settings = effective_settings({"videos": {"mode": "intro", "intro_clips": 3}},
                                      {"videos": {"generation": "t2v"}})
        scenes = [SimpleNamespace(idx=i, overrides={}) for i in range(8)]
        self.assertEqual([wants_video(s, settings) for s in scenes], [True] * 3 + [False] * 5)
        settings.videos.intro_clips = 0
        self.assertFalse(any(wants_video(s, settings) for s in scenes))
        settings.videos.intro_clips = 100
        self.assertTrue(all(wants_video(s, settings) for s in scenes))
        scenes[0].overrides = {"media_type": "image"}
        self.assertFalse(wants_video(scenes[0], settings))
        settings.videos.intro_clips = 3
        scenes[-1].overrides = {"media_type": "video"}
        self.assertTrue(wants_video(scenes[-1], settings))

    def test_auto_routing_with_named_heroes_and_first_frame(self):
        settings = PipelineSettings()
        hero = SimpleNamespace(id=1, name="Alice", kind="character", description="red hair", image_file="alice.jpg")
        scene = SimpleNamespace(idx=0, prompt="Alice walks", overrides={}, characters=[1],
                                image_file="first.jpg", source_scene_id=None, continuity=None)
        tc = SimpleNamespace(settings=settings, project=SimpleNamespace(characters=[hero]))
        mode, payload = scene_payload(scene, tc, True, for_planning=True)
        self.assertEqual(mode, "i2v")
        self.assertEqual(payload["first_frame"], "first.jpg")
        self.assertEqual(payload["references"], [])
        self.assertNotIn("REF_CHARACTER_1", payload["prompt"])
        settings.videos.generation = "ref2v"
        mode, payload = scene_payload(scene, tc, True, for_planning=True)
        self.assertEqual(mode, "ref2v")
        self.assertEqual(payload["references"][0]["name"], "REF_CHARACTER_1")
        settings.videos.generation = "auto"
        scene.image_file = None
        self.assertEqual(scene_payload(scene, tc, True, for_planning=True)[0], "i2v")
        with self.assertRaises(JobError):
            scene_payload(scene, tc, True)

    def test_invalid_im2v_reference_combination_rejected(self):
        settings = PipelineSettings(videos={"generation": "im2v", "references": ["ref.jpg"]})
        scene = SimpleNamespace(prompt="a landscape", overrides={}, characters=[], image_file=None, source_scene_id=None)
        tc = SimpleNamespace(settings=settings, project=SimpleNamespace(characters=[]))
        with self.assertRaises(JobError):
            scene_payload(scene, tc, True, for_planning=True)


class DecoderTests(unittest.TestCase):
    def test_real_clip_freeze_loop_stretch_trim_and_speed(self):
        with tempfile.TemporaryDirectory() as folder:
            path = str(Path(folder) / "clip.mp4")
            writer = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*"mp4v"), 10, (64, 48))
            for i in range(10):
                writer.write(np.full((48, 64, 3), i * 20, dtype=np.uint8))
            writer.release()
            reader = FootageReader(64, 48)
            try:
                first = reader.frame(path, 0, 3).mean()
                frozen = reader.frame(path, 2.5, 3, fit="freeze").mean()
                looped = reader.frame(path, 2, 3, fit="loop").mean()
                stretched = reader.frame(path, 1.5, 3, fit="stretch").mean()
                trimmed = reader.frame(path, 0, 3, offset=.5).mean()
                sped = reader.frame(path, .2, 3, speed=2).mean()
                self.assertGreater(frozen, 160)
                self.assertLess(abs(looped - first), 5)
                self.assertTrue(60 < stretched < 110)
                self.assertTrue(80 < trimmed < 110)
                self.assertTrue(60 < sped < 95)
                # A clip longer than its scene must keep its playback speed in
                # every fit mode, including after trimming the source start.
                for fit in ("freeze", "loop", "stretch"):
                    with self.subTest(fit=fit):
                        cropped = reader.frame(path, .2, .4, fit=fit).mean()
                        self.assertTrue(25 < cropped < 50)
                        cropped_trimmed = reader.frame(path, .2, .4, fit=fit, offset=.5, speed=.5).mean()
                        self.assertTrue(105 < cropped_trimmed < 130)
            finally:
                reader.close()

    def test_mixed_vertical_plan_and_compositor_keep_footage_images_and_motion(self):
        from app import storage
        from app.jobs.render_jobs import build_plan
        from app.render.engine import FrameRenderer, RenderPlan
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "audio.wav").touch()
            Image.new("RGB", (64, 48), "red").save(root / "still.jpg")
            writer = cv2.VideoWriter(str(root / "clip.mp4"), cv2.VideoWriter_fourcc(*"mp4v"), 10, (64, 48))
            for i in range(10):
                writer.write(np.full((48, 64, 3), 80, np.uint8))
            writer.release()
            scenes = [SimpleNamespace(idx=i, id=i+1, start=i, end=i+1, source_scene_id=None, source_scene=None,
                overrides={"media_type": "video" if i == 0 else "image"}, image_file="still.jpg",
                image_meta={}, video_file="clip.mp4" if i == 0 else None) for i in range(3)]
            motion = {"items": [{"id": "motion-2", "kind": "scene", "slots": [2], "els": []}]}
            track = SimpleNamespace(scenes=scenes, audio_file="audio.wav", audio_duration=3, motion=motion, language="ru")
            settings = PipelineSettings(videos={"aspect_ratio": "9:16"},
                render={"cut_ratio": 1., "fade_in": 0., "fade_out": 0.}, unique={"enabled": False})
            tc = SimpleNamespace(track=track, settings=settings)
            with patch.object(storage, "media_root", return_value=root):
                plan, _ = build_plan(tc, preview=True, seed=1)
            self.assertLess(plan.width, plan.height)
            self.assertEqual(plan.scenes[0].video, str(root / "clip.mp4"))
            self.assertIsNone(plan.scenes[1].video)
            self.assertEqual(plan.scenes[2].motion, "motion-2")
            restored = RenderPlan.from_dict(plan.to_dict())
            restored.width, restored.height = 64, 96
            renderer = FrameRenderer(restored)
            class Motion:
                def scene(self, *args): return np.full((96, 64, 3), 140, np.uint8)
            try:
                with patch.object(renderer, "motion_client", return_value=Motion()):
                    frames = [renderer.frame(n) for n in (10, 35, 60)]
                self.assertTrue(all(f.shape == (96, 64, 3) for f in frames))
                self.assertTrue(65 < frames[0].mean() < 95)
                self.assertGreater(frames[1][:, :, 2].mean(), 200)  # red still
                self.assertTrue(125 < frames[2].mean() < 150)
            finally:
                renderer.close()


if __name__ == "__main__":
    unittest.main()
