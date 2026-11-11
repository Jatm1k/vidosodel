"""Global quota snapshots and scene-specific presentation, without network access."""
import sys
import threading
import time
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api import footage
from app.pipeline.footage import scene_first_frame
from app.services.inflight_status import InflightStatus, quota_snapshot
from app.services.http import ApiError
from app.settings_schema import PipelineSettings
from app.settings_store import AppConfig


class StatusTests(unittest.TestCase):
    def setUp(self):
        self.cfg = AppConfig(inflight_api_key="test-secret-only")
        self.local = {"video": 900, "image": 700}
        self.usage = {"plan": "parallel", "video": {"left": 850, "busy": 2, "slots": 12},
                      "image": {"left": 950, "busy": 3, "slots": 12}, "resets_at": 2000000000}

    def test_quota_snapshot_takes_smaller_local_and_server_budget(self):
        status = quota_snapshot(self.cfg, self.local, self.usage)
        self.assertEqual(status["video"]["remaining"], 850)
        self.assertEqual(status["image"]["remaining"], 700)
        self.assertEqual(status["active"], 5)
        self.assertEqual(status["threads"], 24)
        self.assertEqual(status["plan"], "parallel")
        self.assertEqual(status["reset_at"], 2000000000)
        self.usage["plan"] = "chain"
        self.assertEqual(quota_snapshot(self.cfg, self.local, self.usage)["active"], 3)
        self.assertEqual(quota_snapshot(self.cfg, self.local, self.usage)["threads"], 12)

    def test_unknown_server_quota_is_not_presented_as_full_or_empty(self):
        status = quota_snapshot(self.cfg, self.local)
        self.assertIsNone(status["video"]["remaining"])
        self.assertIsNone(status["image"]["used"])
        self.assertEqual(status["video"]["local_remaining"], 900)

    def test_slow_remote_check_does_not_block_system_status_and_keeps_last_good_snapshot(self):
        gate = threading.Event()
        usage = self.usage
        class Client:
            def __init__(self, cfg): pass
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def usage(self):
                gate.wait(2)
                return usage
        monitor = InflightStatus(Client)
        with patch("app.services.inflight_status.session_scope"), \
             patch("app.services.inflight_status.local_remaining", return_value=self.local):
            start = time.monotonic()
            first = monitor.status(self.cfg)
            self.assertLess(time.monotonic() - start, .5)
            self.assertTrue(first["loading"])
            self.assertIsNone(first["video"]["remaining"])
            gate.set()
            monitor._thread.join(2)
            snapshot = monitor.status(self.cfg, refresh=False)
            self.assertEqual(snapshot["video"]["remaining"], 850)
            self.assertFalse(snapshot["stale"])
            with patch.object(Client, "usage", side_effect=ApiError("Inflight", 0, "TLS unavailable")):
                monitor._fetch(self.cfg, monitor._identity)
            failed = monitor.status(self.cfg, refresh=False)
            self.assertEqual(failed["video"]["remaining"], 850)
            self.assertEqual(failed["error"], "TLS unavailable")
            self.assertTrue(failed["stale"])
            changed = monitor.status(self.cfg.model_copy(update={"inflight_api_key": "different-account"}), refresh=False)
            self.assertIsNone(changed["video"]["remaining"])


class PresentationTests(unittest.TestCase):
    def test_media_plan_distinguishes_clips_images_motion_and_shows_first_frame_and_heroes(self):
        scenes = [SimpleNamespace(id=i+1, idx=i, overrides={"media_type": "image" if i == 0 else "video"},
            source_scene_id=None, source_scene=None, image_file="first.jpg", image_status="done", image_meta={},
            video_file=None, video_status="none", video_meta={}, prompt="Anna walks", characters=[5]) for i in range(3)]
        motion = {"items": [{"id": "motion2", "kind": "scene", "slots": [2]}]}
        tc = SimpleNamespace(track=SimpleNamespace(scenes=scenes, motion=motion),
            settings=PipelineSettings(videos={"mode": "full"}), shares_images=False,
            project=SimpleNamespace(characters=[SimpleNamespace(id=5, name="Anna", image_file="hero.jpg")]))
        with patch.object(footage, "load_track", return_value=tc):
            plan = footage.media_plan(1, db=object())
        self.assertEqual((plan["video"], plan["image"], plan["motion"]), (1, 1, 1))
        image, clip, motion = plan["scenes"]
        self.assertEqual((image["kind"], image["status"]), ("image", "done"))
        self.assertEqual((motion["kind"], motion["status"]), ("motion", "done"))
        self.assertEqual(clip["generation"], "i2v")
        self.assertIn("first.jpg", clip["first_frame_url"])
        self.assertEqual(clip["characters"][0]["name"], "Anna")

    def test_extracted_poster_is_not_reused_as_a_character_first_frame(self):
        scene = SimpleNamespace(source_scene_id=None, overrides={}, image_file="inflight/3.poster.jpg",
                                video_meta={}, image_meta={})
        self.assertIsNone(scene_first_frame(scene))
        scene.image_file = "real-first-frame.jpg"
        self.assertEqual(scene_first_frame(scene), "real-first-frame.jpg")
        scene.overrides = {"first_frame": "explicit.jpg"}
        self.assertEqual(scene_first_frame(scene), "explicit.jpg")


if __name__ == "__main__":
    unittest.main()
