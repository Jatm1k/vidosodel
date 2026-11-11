"""Reviewed video direction, payload fidelity, caching and protection of manual work."""
from contextlib import contextmanager
import copy
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

from PIL import Image

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import Base
from app.models import Channel, Project, Track, Scene
from app.settings_schema import PipelineSettings
from app.pipeline.video_prompts import compose_video, compose_opening, parse_shots, direct_shots
from app.jobs import video_prompt_jobs as jobs
from app.jobs.footage_jobs import scene_payload
from app.jobs.runner import JobError


def shot(sid=1):
    return {"id": sid, "purpose": "The closing book makes the narrator's decision to stop studying visible.",
        "shot_size": "medium", "camera": "locked",
        "camera_detail": "Keep the camera fixed at the seated woman's eye level, with her hands visible.",
        "opening_frame": "A red-haired woman sits at a wooden desk with an open book beneath her hands.",
        "subject_action": "She slowly closes the open book with both hands, then rests her hands on the cover.",
        "environment_motion": "A thin curtain sways gently beside the desk.",
        "lighting": "Soft late-afternoon window light stays constant throughout the shot.",
        "beats": ["Her hands rest beside the open pages on the desk.",
                  "She brings the covers together in one slow, deliberate movement.",
                  "The book lies closed and her hands settle on its cover."],
        "audio": "Quiet room tone, paper rustling and the soft thud of the closing book.",
        "continuity": "Keep the same desk, red sweater and left-side window as in the neighboring scene."}


class DirectionTests(unittest.TestCase):
    def setUp(self):
        self.settings = PipelineSettings(images={"style_prompt": "flat 2D ink illustration, ochre palette, 16:9 composition",
                                                  "avoid": "logos, captions, photorealism"},
                                         videos={"aspect_ratio": "9:16", "direction": "Calm restrained movement."})

    def test_channel_style_exclusions_direction_and_native_orientation_in_every_mode(self):
        for mode in ("t2v", "i2v", "ref2v", "im2v"):
            with self.subTest(mode=mode):
                prompt = compose_video(mode, self.settings, shot=shot())
                self.assertIn("flat 2D ink illustration", prompt)
                self.assertIn("AVOID: logos, captions, photorealism", prompt)
                self.assertIn("Calm restrained movement.", prompt)
                self.assertIn("9:16 composition", prompt)
                self.assertNotIn("16:9", prompt)
                self.assertIn("- 0–", prompt)  # timed action
                self.assertIn("AUDIO: Quiet room tone", prompt)
                self.assertIn("No dialogue", prompt)
                self.assertLess(prompt.index("STYLE:"), prompt.index("ACTION:"))  # style first
                self.assertLessEqual(len(prompt), 12000)

    def test_first_frame_and_references_have_different_instructions(self):
        animated = compose_video("i2v", self.settings, shot=shot())
        self.assertIn("Keep its subjects", animated)
        self.assertNotIn("SCENE:", animated)
        self.assertNotIn("A red-haired woman sits", animated)
        self.assertIn(shot()["subject_action"], animated)
        ref = compose_video("ref2v", self.settings, shot=shot(), notes="REF_CHARACTER_1 is Anna.")
        self.assertIn("not a required first frame", ref)
        self.assertIn("REF_CHARACTER_1 is Anna", ref)
        self.assertIn("SCENE: A red-haired woman sits", compose_video("t2v", self.settings, shot=shot()))

    def test_manual_direction_is_preserved_and_still_receives_channel_style(self):
        manual = "Keep the view fixed. Let the curtain move while the woman remains still."
        prompt = compose_video("i2v", self.settings, manual=manual, shot={"invalid": True})
        self.assertIn(manual, prompt)
        self.assertIn("flat 2D ink illustration", prompt)
        self.assertNotIn("She slowly closes", prompt)
        with self.assertRaises(ValueError):
            compose_video("t2v", self.settings)
        with self.assertRaises(ValueError):
            compose_video("t2v", self.settings, manual="x" * 12000)

    def test_opening_for_im2v_matches_directed_opening_not_action_end(self):
        opening = compose_opening(shot(), "unrelated old image prompt", self.settings)
        self.assertIn("open book", opening)
        self.assertIn("before the described action begins", opening)
        self.assertNotIn("unrelated", opening)
        self.assertIn("flat 2D ink illustration", opening)

    def test_malformed_missing_and_duplicate_shots_are_rejected(self):
        for data in ({"shots": []}, {"shots": [shot(), shot()]}, {"shots": [shot(2)]},
                     {"shots": [{**shot(), "beats": ["short"]}]}):
            with self.subTest(data=data), self.assertRaises(ValueError):
                parse_shots(data, [1])

    def test_separate_review_pass_corrects_proposed_direction(self):
        reviewed = {**shot(), "camera": "slow_push_in", "camera_detail": "Move slowly towards the closing book without losing the woman's hands."}
        fg = Mock()
        fg.chat_json.side_effect = [{"shots": [shot()]}, {"shots": [reviewed]}]
        result = direct_shots(fg, {"channel_style": "ink drawing"}, [{"id": 1, "mode": "t2v"}],
                              self.settings.llm, lambda: None)
        self.assertEqual(result[1]["camera"], "slow_push_in")
        self.assertEqual(fg.chat_json.call_count, 2)
        first, second = [c.args[0] for c in fg.chat_json.call_args_list]
        self.assertIn("film director", first[0]["content"])
        self.assertIn("supervising director", second[0]["content"])
        self.assertIn("PROPOSED SHOTS", second[1]["content"][-1]["text"])

    def test_schema_repair_is_bounded(self):
        fg = Mock()
        fg.chat_json.side_effect = [{"shots": []}, {"shots": [shot()]}, {"shots": [shot()]}]
        direct_shots(fg, {}, [{"id": 1}], self.settings.llm, lambda: None)
        self.assertEqual(fg.chat_json.call_count, 3)
        fg.chat_json.reset_mock()
        fg.chat_json.side_effect = None
        fg.chat_json.return_value = {"shots": []}
        with self.assertRaises(ValueError):
            direct_shots(fg, {}, [{"id": 1}], self.settings.llm, lambda: None)
        self.assertEqual(fg.chat_json.call_count, 2)

    def test_actual_payload_uses_directed_action_and_style(self):
        self.settings.videos.generation = "t2v"
        scene = SimpleNamespace(idx=0, start=0, end=4, prompt="A woman at a desk.", text="She ends the lesson.",
            overrides={}, characters=[], image_file=None, source_scene_id=None, video_plan={"shot": shot()})
        tc = SimpleNamespace(settings=self.settings, project=SimpleNamespace(characters=[]))
        mode, payload = scene_payload(scene, tc, True)
        self.assertEqual(mode, "t2v")
        self.assertIn("She slowly closes", payload["prompt"])
        self.assertIn("flat 2D ink illustration", payload["prompt"])
        self.assertTrue(payload["_video_plan"]["shot"])
        self.settings.videos.generation = "im2v"
        _, payload = scene_payload(scene, tc, True)
        self.assertIn("open book", payload["image_prompt"])
        self.assertIn("START FRAME", payload["video_prompt"])

    def test_actual_payload_rejects_unplanned_automatic_clip(self):
        self.settings.videos.generation = "t2v"
        scene = SimpleNamespace(idx=0, start=0, end=4, prompt="A woman at a desk.", overrides={}, characters=[],
            image_file=None, source_scene_id=None, video_plan={})
        tc = SimpleNamespace(settings=self.settings, project=SimpleNamespace(characters=[]))
        with self.assertRaises(JobError):
            scene_payload(scene, tc, True)

    def test_visual_previews_keep_first_frame_and_reference_labels(self):
        from app import storage
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            Image.new("RGB", (64, 48), "red").save(root / "first.jpg")
            Image.new("RGB", (64, 48), "blue").save(root / "hero.jpg")
            records = [{"record": {"id": 7, "first_frame": {"path": "first.jpg"},
                        "references": [{"name": "REF_CHARACTER_3", "path": "hero.jpg"}]}}]
            with patch.object(storage, "media_root", return_value=root):
                images = jobs.previews(records)
            self.assertEqual(images[0]["text"], "Scene 7: FIRST FRAME")
            self.assertEqual(images[2]["text"], "Scene 7: REF_CHARACTER_3")
            self.assertTrue(images[1]["image_url"]["url"].startswith("data:image/jpeg;base64,"))
            self.assertTrue(images[3]["image_url"]["url"].startswith("data:image/jpeg;base64,"))
            records[0]["record"]["references"] = [{"name": f"REF_{i}", "path": "hero.jpg"} for i in range(10)]
            with patch.object(storage, "media_root", return_value=root):
                self.assertEqual(sum(p["type"] == "image_url" for p in jobs.previews(records)), 11)
            self.assertEqual(len(list(jobs.prompt_batches(records * 2))), 2)


class PersistenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.engine = create_engine("sqlite:///" + str(Path(self.tmp.name) / "plans.db"))
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
        with scope() as db:
            ch = Channel(name="History", settings={"images": {"style_prompt": "ink illustration"}})
            db.add(ch); db.flush()
            p = Project(channel_id=ch.id, name="Study", settings={"videos": {"mode": "full", "character_refs": False}},
                        visual_context="The same desk in a quiet study.")
            db.add(p); db.flush()
            t = Track(project_id=p.id, language="ru", script="Она закончила читать. Затем отдыхает.")
            db.add(t); db.flush()
            for i in range(2):
                db.add(Scene(track_id=t.id, idx=i, start=i*4, end=(i+1)*4,
                    text="Она закрывает книгу.", prompt="A red-haired woman with an open book in a quiet study."))
            self.tid, self.pid, self.cid = t.id, p.id, ch.id
        self.ctx = SimpleNamespace(track_id=self.tid, project_id=self.pid, params={},
            check=lambda: None, progress=lambda *a, **kw: None)
        self.direct = Mock(side_effect=lambda fg, context, records, *a: {r["id"]: shot(r["id"]) for r in records})
        self.patches = [patch.object(jobs, "session_scope", scope), patch.object(jobs, "direct_shots", self.direct),
                        patch.object(jobs, "FastgenClient"), patch.object(jobs, "previews", return_value=[])]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in reversed(self.patches):
            p.stop()
        self.engine.dispose()
        self.tmp.cleanup()

    def test_plans_persist_and_are_reused_then_invalidate_when_channel_style_changes(self):
        self.assertEqual(jobs.ensure_video_prompts(self.ctx)["written"], 2)
        self.assertEqual(jobs.ensure_video_prompts(self.ctx)["written"], 0)
        self.assertEqual(self.direct.call_count, 1)
        with self.scope() as db:
            plans = [copy.deepcopy(s.video_plan) for s in db.get(Track, self.tid).scenes]
            self.assertTrue(all(p["reviewed"] and p["prompt"] for p in plans))
            db.get(Channel, self.cid).settings = {"images": {"style_prompt": "paper cutout animation"}}
        self.assertEqual(jobs.ensure_video_prompts(self.ctx)["written"], 2)
        with self.scope() as db:
            for sc in db.get(Track, self.tid).scenes:
                self.assertIn("paper cutout animation", sc.video_plan["prompt"])
                self.assertNotEqual(sc.video_plan["key"], plans[sc.idx]["key"])
        context, records = self.direct.call_args.args[1:3]
        self.assertIn("storyboard", context)
        self.assertIn("next", records[0])
        self.assertIn("Она закрывает книгу", records[0]["narration"])

    def test_force_never_overwrites_manual_prompts(self):
        jobs.ensure_video_prompts(self.ctx)
        with self.scope() as db:
            sc = db.get(Track, self.tid).scenes[0]
            saved_plan = copy.deepcopy(sc.video_plan)
            sc.overrides = {"video_prompt": "Only the curtain moves in this locked shot."}
        result = jobs.ensure_video_prompts(self.ctx, force=True)
        self.assertEqual(result["written"], 1)
        with self.scope() as db:
            sc = db.get(Track, self.tid).scenes[0]
            self.assertEqual(sc.video_plan, saved_plan)
            self.assertEqual(sc.overrides["video_prompt"], "Only the curtain moves in this locked shot.")

    def test_concurrent_scene_edit_does_not_save_stale_plan(self):
        def changed(fg, context, records, *args):
            with self.scope() as db:
                db.get(Track, self.tid).scenes[0].prompt = "A different scene with a different object."
            return {r["id"]: shot(r["id"]) for r in records}
        self.direct.side_effect = changed
        with self.assertRaises(JobError):
            jobs.ensure_video_prompts(self.ctx)
        with self.scope() as db:
            self.assertTrue(all(not sc.video_plan for sc in db.get(Track, self.tid).scenes))


if __name__ == "__main__":
    unittest.main()
