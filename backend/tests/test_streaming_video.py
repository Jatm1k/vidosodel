"""Offline streaming tests: a clip starts while another first frame is unfinished."""
from contextlib import ExitStack, contextmanager
from pathlib import Path
import sys
import threading
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import cv2
import numpy as np
from PIL import Image
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import test_inflight as fixtures
from app import storage
from app.models import Channel, Project, Track, Scene, Job, MediaGeneration, utcnow
from app.jobs import footage_jobs as ft, video_prompt_jobs, hybrid_images as hybrid
from app.jobs.runner import JobCancelled, JobError
from app.services import inflight
from app.api import pipeline_runner


class StreamingTests(unittest.TestCase):
    def setUp(self):
        fixtures.QueueTests.setUp(self)
        self.root = Path(self.tmp.name) / 'media'; self.root.mkdir()
        self.stack = ExitStack()
        self.cancel = threading.Event()
        self.deadline = time.monotonic() + 6
        self.video_started = threading.Event()
        self.video_submissions = []
        def check():
            ft.queue._LAST_POLL.clear()
            if self.cancel.is_set(): raise JobCancelled()
            if time.monotonic() > self.deadline: raise AssertionError('streaming stalled')
        self.ctx = SimpleNamespace(params={}, job_id=100, project_id=None, track_id=None,
            check=check, should_stop=self.cancel.is_set, set_idle=lambda v: None, progress=lambda *a, **k: None)
        outer = self
        class Client:
            def __enter__(self): return outer.client
            def __exit__(self, *a): pass
        for obj, attr, value in [(ft, 'session_scope', self.scope), (ft, 'load_config', lambda: self.cfg),
            (ft, 'InflightClient', Client), (video_prompt_jobs, 'session_scope', self.scope),
            (ft, 'scene_changed', lambda *a: None), (ft, 'track_changed', lambda *a: None),
            (ft, 'time', SimpleNamespace(time=time.time, sleep=lambda s: time.sleep(.001))),
            (ft.queue, 'media_root', lambda: self.root), (storage, 'media_root', lambda: self.root),
            (inflight, 'media_root', lambda: self.root)]:
            self.stack.enter_context(patch.object(obj, attr, value))
        submit = self.client.submit
        def traced_submit(kind, tasks):
            if kind == 'video':
                self.video_submissions.extend(tasks)
                self.video_started.set()
            return submit(kind, tasks)
        self.client.submit = traced_submit
        self.client.poll = lambda ids: [{'id': rid, 'state': 'ready', 'url': 'https://example.invalid/' + rid} for rid in ids]
        def download(url, dest):
            if dest.suffix == '.mp4':
                writer = cv2.VideoWriter(str(dest), cv2.VideoWriter_fourcc(*'mp4v'), 10, (64, 48))
                for _ in range(10): writer.write(np.full((48, 64, 3), 90, np.uint8))
                writer.release()
            else: Image.new('RGB', (64, 48), 'blue').save(dest)
        self.client.download = download

    def tearDown(self):
        self.stack.close()
        fixtures.QueueTests.tearDown(self)

    def project(self):
        with self.scope() as db:
            ch = Channel(name='test'); db.add(ch); db.flush()
            project = Project(name='test', channel_id=ch.id, settings={'videos': {'mode': 'full'}, 'images': {'provider': 'inflight'}})
            db.add(project); db.flush()
            track = Track(project_id=project.id, language='ru'); db.add(track); db.flush()
            ids = []
            for idx in range(2):
                scene = Scene(track_id=track.id, idx=idx, start=idx, end=idx+1, prompt='a landscape', characters=[],
                    overrides={'video_prompt': 'The camera slowly pans across the quiet landscape.'})
                db.add(scene); db.flush(); ids.append(scene.id)
            self.ctx.project_id, self.ctx.track_id = project.id, track.id
        return ids

    def frame(self, sid):
        rel = f'frame-{sid}.jpg'
        Image.new('RGB', (64, 48), 'blue').save(self.root / rel)
        with self.scope() as db:
            sc = db.get(Scene, sid); sc.image_file, sc.image_status = rel, 'done'
            sc.image_meta = {'generated_at': time.time()}

    def test_internal_frame_worker_starts_video_before_second_frame_finishes(self):
        first, second = self.project()
        original = ft.generate_scenes
        def produce(ctx, video, **kw):
            if video: return original(ctx, video, **kw)
            self.frame(first)
            self.assertTrue(self.video_started.wait(2), 'clip must start before all frames finish')
            with self.scope() as db:
                self.assertIsNone(db.get(Scene, second).image_file)
            self.frame(second)
        with patch.object(ft, 'generate_scenes', produce): result = original(self.ctx, True)
        self.assertEqual(len(self.video_submissions), 2)
        self.assertEqual(len(result['task_ids']), 2)
        with self.scope() as db:
            self.assertTrue(all(s.video_status == 'done' for s in db.get(Track, self.ctx.track_id).scenes))

    def test_pipeline_images_can_still_run_when_first_clip_starts(self):
        first, second = self.project(); self.frame(first)
        with self.scope() as db:
            job = Job(kind='images', status='running', track_id=self.ctx.track_id, project_id=self.ctx.project_id)
            db.add(job); db.flush(); jid = job.id
        self.ctx.params = {'follow_images': jid}
        submit = self.client.submit
        def start_clip(kind, tasks):
            if not self.video_submissions:
                with self.scope() as db:
                    self.assertEqual(db.get(Job, jid).status, 'running')
                    self.assertIsNone(db.get(Scene, second).image_file)
                self.frame(second)
                with self.scope() as db: db.get(Job, jid).status = 'done'
            return submit(kind, tasks)
        self.client.submit = start_clip
        result = ft.generate_scenes(self.ctx, True)
        self.assertEqual(len(result['task_ids']), 2)
        self.assertEqual(len(self.video_submissions), 2)

    def test_forced_job_restart_reuses_completed_clips_but_new_job_can_replace(self):
        ids = self.project()
        for sid in ids: self.frame(sid)
        self.ctx.params = {'force': True}
        ft.generate_scenes(self.ctx, True)
        ft.generate_scenes(self.ctx, True)
        self.assertEqual(len(self.video_submissions), 2)
        self.ctx.job_id += 1
        ft.generate_scenes(self.ctx, True)
        self.assertEqual(len(self.video_submissions), 4)

    def test_forced_image_branch_does_not_race_ahead_with_old_first_frames(self):
        ids = self.project()
        for sid in ids: self.frame(sid)
        with self.scope() as db:
            job = Job(kind='images', status='running', track_id=self.ctx.track_id, params={'force': True}, started_at=utcnow())
            db.add(job); db.flush(); jid = job.id
        self.ctx.params = {'follow_images': jid, 'force': True}
        refreshed = []
        def refresh(*args, **kw):
            if not refreshed:
                self.assertFalse(self.video_submissions)
                for sid in ids: self.frame(sid)
                with self.scope() as db: db.get(Job, jid).status = 'done'
                refreshed.append(True)
        self.ctx.progress = refresh
        ft.generate_scenes(self.ctx, True)
        self.assertTrue(refreshed)
        self.assertEqual(len(self.video_submissions), 2)

    def test_t2v_starts_without_waiting_for_unrelated_i2v_frame(self):
        first, second = self.project()
        with self.scope() as db:
            sc = db.get(Scene, first); sc.overrides = {**sc.overrides, 'video_mode': 't2v'}
            job = Job(kind='images', status='running', track_id=self.ctx.track_id)
            db.add(job); db.flush(); jid = job.id
        self.ctx.params = {'follow_images': jid}
        submit = self.client.submit
        def finish_frame(kind, tasks):
            if not self.video_submissions:
                self.assertEqual(tasks[0]['mode'], 't2v')
                self.frame(second)
                with self.scope() as db: db.get(Job, jid).status = 'done'
            return submit(kind, tasks)
        self.client.submit = finish_frame
        ft.generate_scenes(self.ctx, True)
        self.assertEqual({t['mode'] for t in self.video_submissions}, {'t2v', 'i2v'})

    def test_real_hybrid_queue_starts_clip_while_fastgen_frame_is_still_running(self):
        self.project()
        self.cfg.fastgen_api_key = 'fake-fg'
        with self.scope() as db:
            project = db.get(Project, self.ctx.project_id)
            project.settings = {**project.settings, 'images': {'provider': 'both', 'watermark_fix': 'none'}}
        self.client.__exit__ = lambda *a: None
        outer = self
        class FastGen:
            def __init__(self, **kw): pass
            def __enter__(self): return self
            def __exit__(self, *a): pass
            def start(self, body, **kw): return {'id': 'fg-frame'}
            def finish_image(self, remote, dest, **kw):
                outer.assertTrue(outer.video_started.wait(3), 'video must not wait for FastGen frame')
                Image.new('RGB', (64, 48), 'red').save(dest, format='JPEG')
                return {'generation_id': remote, 'credits': 1}
        @contextmanager
        def slot(*a, **kw): yield lambda *args: None
        limiter = SimpleNamespace(hourly_budget=lambda: 1000, slot=slot,
            status=lambda: {'used': 0, 'budget': 1000, 'threads': 1, 'active': 0})
        with ExitStack() as stack:
            for attr, value in [('session_scope', self.scope), ('load_config', lambda: self.cfg),
                ('InflightClient', lambda cfg: self.client), ('FastgenClient', FastGen), ('limiter', limiter),
                ('time', ft.time), ('scene_changed', lambda *a: None), ('track_changed', lambda *a: None)]:
                stack.enter_context(patch.object(hybrid, attr, value))
            ft.generate_scenes(self.ctx, True)
        with self.scope() as db:
            frames = db.scalars(select(MediaGeneration).where(MediaGeneration.kind == 'image')).all()
            self.assertEqual({r.provider for r in frames}, {'fastgen', 'inflight'})
        self.assertEqual(len(self.video_submissions), 2)

    def test_failed_other_frame_does_not_prevent_ready_clip(self):
        first, second = self.project(); self.frame(first)
        with self.scope() as db:
            job = Job(kind='images', status='failed', track_id=self.ctx.track_id, project_id=self.ctx.project_id)
            db.add(job); db.flush(); self.ctx.params = {'follow_images': job.id}
            db.get(Scene, second).image_error = 'reference rejected'
        with self.assertRaises(JobError): ft.generate_scenes(self.ctx, True)
        self.assertEqual(len(self.video_submissions), 1)
        with self.scope() as db:
            self.assertEqual(db.get(Scene, first).video_status, 'done')
            self.assertEqual(db.get(Scene, second).video_status, 'failed')
            self.assertIn('reference rejected', db.get(Scene, second).video_error)

    def test_stale_file_with_failed_status_does_not_stall_or_feed_video(self):
        first, second = self.project(); self.frame(first); self.frame(second)
        with self.scope() as db:
            db.get(Scene, second).image_status = 'failed'
            job = Job(kind='images', status='done', track_id=self.ctx.track_id)
            db.add(job); db.flush(); self.ctx.params = {'follow_images': job.id}
        with self.assertRaises(JobError): ft.generate_scenes(self.ctx, True)
        self.assertEqual(len(self.video_submissions), 1)

    def test_cancel_stops_internal_producer_and_preserves_accepted_clip(self):
        first, second = self.project()
        stopped = threading.Event()
        original = ft.generate_scenes
        def produce(ctx, video, **kw):
            if video: return original(ctx, video, **kw)
            self.frame(first)
            try:
                while not ctx.should_stop(): time.sleep(.005)
                ctx.check()
            finally: stopped.set()
        submit = self.client.submit
        def cancel_after_submit(kind, tasks):
            result = submit(kind, tasks)
            self.cancel.set()
            return result
        self.client.submit = cancel_after_submit
        with patch.object(ft, 'generate_scenes', produce), self.assertRaises(JobCancelled): original(self.ctx, True)
        self.assertTrue(stopped.is_set())
        with self.scope() as db:
            rows = db.scalars(select(MediaGeneration).where(MediaGeneration.kind == 'video')).all()
            self.assertEqual(len(rows), 1)
            self.assertTrue(rows[0].remote_id)
            self.assertEqual(rows[0].state, 'accepted')

    def test_pipeline_video_is_parallel_and_render_waits_for_both_branches(self):
        self.project()
        jobs = []
        def enqueue(kind, **kwargs):
            job = SimpleNamespace(id=len(jobs)+1, kind=kind, **kwargs); jobs.append(job); return job
        with self.scope() as db, patch.object(pipeline_runner.runner, 'enqueue', enqueue):
            pipeline_runner.run_pipeline(db, db.get(Project, self.ctx.project_id), track_ids=None,
                steps=['prompts', 'images', 'videos', 'render'], force=True)
        by_kind = {j.kind: j for j in jobs}
        image, video, render = [by_kind[k] for k in ('images', 'videos', 'render')]
        self.assertNotEqual(video.depends_on, image.id)
        self.assertEqual(video.params['follow_images'], image.id)
        self.assertEqual(video.depends_on, by_kind['prompts'].id)
        self.assertEqual(render.depends_on, video.id)
        self.assertIn(image.id, render.params['_after'])

    def test_waiting_video_keeps_a_slot_from_next_image_batch(self):
        usage = self.client.usage()
        usage['plan'] = 'chain'
        self.client.usage = lambda: usage
        first, second = self.project(); self.frame(first)
        video = ft.queue.enqueue(self.client, 'video', 'video', 'i2v', {'prompt': 'move', 'first_frame': f'frame-{first}.jpg'})
        images = [ft.queue.enqueue(self.client, f'image:{i}', 'image', 't2i', {'prompt': 'still'}) for i in range(20)]
        ft.queue.admit(self.client, images)
        with self.scope() as db:
            self.assertEqual(len(db.scalars(select(MediaGeneration).where(MediaGeneration.state == 'accepted')).all()), 11)
        ft.queue.admit(self.client, [video])
        with self.scope() as db: self.assertEqual(db.get(MediaGeneration, video).state, 'accepted')

    def test_parallel_tariff_allows_twelve_images_and_twelve_videos(self):
        images = [ft.queue.enqueue(self.client, f'image:{i}', 'image', 't2i', {'prompt': 'still'}) for i in range(15)]
        videos = [ft.queue.enqueue(self.client, f'video:{i}', 'video', 't2v', {'prompt': 'move'}) for i in range(15)]
        ft.queue.admit(self.client, images)
        ft.queue.admit(self.client, videos)
        with self.scope() as db:
            counts = ft.queue.active_counts(db, self.client.account)
            self.assertEqual(counts, {'image': 12, 'video': 12, 'shared': 24})
            self.assertEqual(sum(r.state == 'queued' for r in db.scalars(select(MediaGeneration))), 6)

    def test_parallel_composite_requires_room_in_both_pools(self):
        usage = self.client.usage()
        local = {'image': 1000, 'video': 1000}
        active = {'image': 12, 'video': 0, 'shared': 12}
        self.assertEqual(ft.queue.capacity(usage, local, 'video', 12, active), 12)
        self.assertEqual(ft.queue.capacity(usage, local, 'video', 12, active, composite=True), 0)


if __name__ == '__main__': unittest.main()
