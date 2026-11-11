"""Director routing (clips by meaning, modes, multishot, endless story), prompt timing and multishot clips."""
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.pipeline import video_director as director
from app.pipeline.footage import wants_video, uses_first_frame, generation_mode, is_member
from app.pipeline.video_prompts import compose_multishot, compose_video, shot_lengths, timeline
from app.render.footage import FootageReader, detect_cuts
from app.settings_schema import PipelineSettings
from test_video_prompts import shot


def scenes(lengths, **extra):
    out, t = [], 0.
    for i, length in enumerate(lengths):
        out.append(SimpleNamespace(id=i + 1, idx=i, start=t, end=t + length, text=f"text {i}", prompt=f"prompt {i}",
                                   characters=[], continuity=None, overrides={}, video_plan={}, **extra))
        t += length
    return out


def settings(**videos):
    return PipelineSettings(videos={"mode": "smart", "multishot": False, **videos})


def apply(items, routes):
    for s in items:
        s.video_plan = {"route": routes.get(s.id)}


class RoutingTests(unittest.TestCase):
    def test_smart_puts_clips_on_motion_and_opening_is_all_clips(self):
        items = scenes([6] * 10)
        cfg = settings(intro_seconds=12, share=.25)
        scores = {s.id: {"motion": 0} for s in items}
        scores.update({5: {"motion": 3}, 9: {"motion": 3}, 7: {"motion": 1}})
        routes = director.route_track(items, [], cfg, set(), scores)
        video = {sid for sid, r in routes.items() if r["media"] == "video"}
        # 2 opening scenes + round(.25 * 8) = 2 strongest motion scenes; motion 0 never gets a clip.
        self.assertEqual(video, {1, 2, 5, 9})
        apply(items, routes)
        self.assertEqual([wants_video(s, cfg) for s in items][:3], [True, True, False])
        self.assertTrue(wants_video(items[4], cfg))

    def test_equal_scores_are_spread_and_overrides_win(self):
        items = scenes([5] * 12)
        items[0].overrides = {"media_type": "image"}
        items[11].overrides = {"media_type": "video"}
        routes = director.route_track(items, [], settings(share=1 / 3), set(), {})
        video = sorted(sid for sid, r in routes.items() if r["media"] == "video")
        self.assertNotIn(1, video)
        self.assertIn(12, video)
        gaps = [b - a for a, b in zip(video, video[1:])]
        self.assertGreaterEqual(min(gaps), 2)  # no bunching

    def test_mode_by_what_must_be_preserved(self):
        person = SimpleNamespace(id=10, kind="character", name="Anna")
        place = SimpleNamespace(id=11, kind="location", name="Harbor")
        items = scenes([6, 6, 6])
        items[0].characters, items[1].characters, items[2].characters = [10], [11], []
        cfg = settings(mode="full")
        routes = director.route_track(items, [person, place], cfg, set(), None)
        self.assertEqual([routes[i]["mode"] for i in (1, 2, 3)], ["i2v", "ref2v", "t2v"])
        cfg.videos.style_lock = True
        self.assertEqual(director.route_track(items, [person, place], cfg, set(), None)[3]["mode"], "im2v")
        apply(items, routes)
        self.assertTrue(uses_first_frame(items[0], cfg))       # a still with the face → i2v
        self.assertFalse(uses_first_frame(items[2], cfg))      # text-only clip needs no image step
        self.assertEqual(generation_mode(items[1], cfg), "ref2v")

    def test_short_scenes_share_one_multishot_clip(self):
        items = scenes([2.5, 3, 2.5, 3, 7, 2, 2])
        cfg = settings(mode="full", multishot=True, multishot_max=3)
        routes = director.route_track(items, [], cfg, set(), None)
        self.assertEqual(routes[1]["shots"], [1, 2, 3])
        self.assertEqual([routes[i]["group"] for i in (1, 2, 3)], [1, 1, 1])
        self.assertNotIn("group", routes[4])  # alone: nothing short next to it
        self.assertNotIn("group", routes[5])  # too long
        self.assertEqual(routes[6]["shots"], [6, 7])
        apply(items, routes)
        self.assertTrue(is_member(items[1]))
        self.assertFalse(is_member(items[0]))
        self.assertFalse(uses_first_frame(items[1], cfg))

    def test_endless_story_chains_continuing_scenes(self):
        items = scenes([6] * 6)
        cfg = settings(mode="full", continuation=True)
        scores = {s.id: {"motion": 2, "continues": True} for s in items}
        routes = director.route_track(items, [], cfg, set(), scores)
        chained = [routes[s.id].get("continue_from") for s in items]
        self.assertEqual(chained, [None, 1, 2, 3, None, 5])  # chains are capped, then start fresh
        apply(items, routes)
        self.assertFalse(uses_first_frame(items[1], cfg))
        self.assertEqual(generation_mode(items[1], cfg), "i2v")

    def test_scoring_parses_and_clamps(self):
        fg = Mock()
        fg.chat_json.return_value = {"scenes": [{"id": 1, "motion": 7, "continues": 1, "why": "бег"},
                                                {"id": 99, "motion": 3}, {"id": "x"}]}
        out = director.score_scenes(fg, {}, [{"id": 1}, {"id": 2}], SimpleNamespace(model="m"), lambda: None)
        self.assertEqual(out, {1: {"motion": 3, "continues": True, "why": "бег"}})


class PromptTimingTests(unittest.TestCase):
    def test_action_is_timed_to_the_part_of_the_clip_on_screen(self):
        lines = timeline(["a", "b", "c"], 4)
        self.assertTrue(lines[1].startswith("- 1–3.4s"))
        self.assertIn("Hold this settled state", lines[2])
        prompt = compose_video("t2v", PipelineSettings(), shot=shot(), screen=4)
        self.assertIn("- 0–1s:", prompt)

    def test_multishot_prompt_and_shot_lengths(self):
        self.assertEqual(shot_lengths([2.5, 3, 2.5]), [2.5, 3.0, 4.5])
        prompt = compose_multishot(PipelineSettings(), [shot(1), shot(2), shot(3)], [2.5, 3, 2.5])
        self.assertIn("exactly 3 different full-screen shots", prompt)
        self.assertIn("SHOT 1 (about 2.5 s)", prompt)
        self.assertIn("HARD CUT TO SHOT 3.", prompt)
        self.assertNotIn("One continuous shot", prompt)


class ClipTests(unittest.TestCase):
    def test_cuts_are_detected_and_shot_window_is_played(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "multi.mp4"
            writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), 10, (64, 48))
            for color, frames in (((0, 0, 220), 25), ((0, 200, 0), 30), ((210, 0, 0), 45)):
                for n in range(frames):
                    writer.write(np.full((48, 64, 3), color, np.uint8) + np.uint8(n % 3))
            writer.release()
            cuts = detect_cuts(path, 3, [3.0, 6.0])
            self.assertAlmostEqual(cuts[0], 2.5, delta=.15)
            self.assertAlmostEqual(cuts[1], 5.5, delta=.15)
            self.assertEqual(detect_cuts(path, 4, [1, 2, 3]), [1, 2, 3])  # no 3 clear cuts → requested lengths
            reader = FootageReader(64, 48)
            try:
                # Scene of shot 2 lasts longer than its shot: it holds the shot's last frame, not shot 3.
                frame = reader.frame(str(path), 4.5, 5, offset=cuts[0], end=cuts[1])
                self.assertGreater(int(frame[24, 32, 1]), 150)
            finally:
                reader.close()


class DirectorStreamingTests(unittest.TestCase):
    """The real clip queue with a stubbed LLM director and a fake Inflight server."""
    def setUp(self):
        import test_streaming_video as streaming
        from unittest.mock import patch
        from app.jobs import video_prompt_jobs
        streaming.StreamingTests.setUp(self)
        self.stack.enter_context(patch.object(video_prompt_jobs, "direct_shots",
            lambda fg, context, records, *a, **k: {r["id"]: shot(r["id"]) for r in records}))
        self.stack.enter_context(patch.object(video_prompt_jobs, "FastgenClient"))
        self.stack.enter_context(patch.object(video_prompt_jobs, "previews", return_value=[]))
        self.stack.enter_context(patch.object(video_prompt_jobs, "scene_changed", lambda *a: None))
        self.stack.enter_context(patch.object(video_prompt_jobs, "track_changed", lambda *a: None))

    def tearDown(self):
        import test_streaming_video as streaming
        streaming.StreamingTests.tearDown(self)

    def make(self, videos, lengths, continuity=()):
        from app.models import Channel, Project, Track, Scene
        with self.scope() as db:
            ch = Channel(name="c"); db.add(ch); db.flush()
            project = Project(name="p", channel_id=ch.id, settings={"videos": videos, "images": {"provider": "inflight"}})
            db.add(project); db.flush()
            track = Track(project_id=project.id, language="ru", script="text"); db.add(track); db.flush()
            ids, t = [], 0.
            for idx, length in enumerate(lengths):
                sc = Scene(track_id=track.id, idx=idx, start=t, end=t + length, text=f"Сцена {idx}",
                           prompt=f"a quiet harbor {idx}", characters=[],
                           continuity={"change": "the boat moves on"} if idx in continuity else None)
                db.add(sc); db.flush(); ids.append(sc.id); t += length
            self.ctx.project_id, self.ctx.track_id = project.id, track.id
        return ids

    def test_short_scenes_are_one_multishot_clip_cut_into_shots(self):
        from app.jobs import footage_jobs as ft
        from app.models import Scene
        ids = self.make({"mode": "full", "multishot": True}, [3, 3, 3])
        ft.generate_scenes(self.ctx, True)
        self.assertEqual(len(self.video_submissions), 1)
        task = self.video_submissions[0]
        self.assertEqual(task["mode"], "t2v")
        self.assertIn("exactly 3 different full-screen shots", task["body"]["prompt"])
        with self.scope() as db:
            rows = [db.get(Scene, i) for i in ids]
            self.assertTrue(all(r.video_status == "done" and r.video_file == rows[0].video_file for r in rows))
            starts = [r.video_meta.get("clip_start") for r in rows]
            self.assertEqual(starts[0], 0.)
            self.assertLess(starts[1], starts[2])
            self.assertEqual(rows[1].video_meta["multishot_of"], ids[0])

    def test_endless_story_starts_from_the_previous_clip(self):
        from app.jobs import footage_jobs as ft
        from app.models import Scene
        ids = self.make({"mode": "full", "multishot": False, "continuation": True}, [6, 6], continuity=(1,))
        ft.generate_scenes(self.ctx, True)
        modes = [t["mode"] for t in self.video_submissions]
        self.assertEqual(modes, ["t2v", "i2v"])  # the second waited for the first clip
        self.assertIn("previous shot", self.video_submissions[1]["body"]["prompt"])
        with self.scope() as db:
            second = db.get(Scene, ids[1])
            self.assertIn(f"chain_{ids[1]}_{ids[0]}", second.video_plan["route"]["chain_frame"])
            self.assertFalse(second.image_file)  # no still was made for it


if __name__ == "__main__":
    unittest.main()
