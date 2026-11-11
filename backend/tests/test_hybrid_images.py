"""Offline two-provider scheduling tests, with durable SQLite rows and real admission."""
from contextlib import contextmanager, ExitStack
import hashlib
from pathlib import Path
import sys
import tempfile
import threading
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from PIL import Image
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import storage
from app.db import Base
from app.models import Channel, Project, Track, Scene, MediaGeneration, FastgenUsage
from app.jobs import hybrid_images as h, footage_jobs
from app.jobs.runner import JobError
from app.settings_store import AppConfig
from app.services.http import ApiError
from app.services import inflight
from app.services.limiter import BudgetLimiter, LimitReached, usage_sync
from app.settings_schema import PipelineSettings


class HybridTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.engine = create_engine('sqlite:///' + str(self.root / 'test.db'))
        Base.metadata.create_all(self.engine)
        sessions = sessionmaker(self.engine, expire_on_commit=False)
        @contextmanager
        def scope():
            with sessions() as db:
                try:
                    yield db
                    db.commit()
                except Exception:
                    db.rollback()
                    raise
        self.scope = scope
        self.cfg = AppConfig(fastgen_api_key='fake-fg', inflight_api_key='fake-inf', fastgen_image_threads=2)
        self.fg, self.inf, self.finished = [], [], []
        self.fg_available, self.inf_available = True, True
        self.overlap = False
        self.fg_started, self.inf_started = threading.Event(), threading.Event()
        self.deadline = time.monotonic() + 8
        def check():
            h.queue._LAST_POLL.clear()
            if time.monotonic() > self.deadline:
                raise AssertionError('scheduler stalled')
        self.ctx = SimpleNamespace(params={}, job_id=100, check=check, should_stop=lambda: False,
                                   set_idle=lambda v: None, progress=lambda *a, **k: None)
        @contextmanager
        def slot(*a, **kw):
            if not self.fg_available: raise LimitReached()
            yield lambda *args: None
        limiter = SimpleNamespace(slot=slot, hourly_budget=lambda: 1000, block=lambda: None,
            status=lambda: {'used': 0 if self.fg_available else 1000, 'budget': 1000, 'active': 0, 'threads': 2})
        outer = self
        class FastGen:
            def __init__(self, **kw): pass
            def __enter__(self): return self
            def __exit__(self, *a): pass
            def start(self, body, *, attempts):
                outer.assertEqual(attempts, 1)
                outer.fg.append(body)
                outer.fg_started.set()
                return {'id': 'fg-' + str(len(outer.fg))}
            def finish_image(self, remote, dest, **kw):
                outer.finished.append(remote)
                if outer.overlap:
                    outer.assertTrue(outer.inf_started.wait(2), 'Inflight must start before FastGen finishes')
                Image.new('RGB', (32, 32), 'red').save(dest, format='JPEG')
                return {'credits': 1, 'generation_id': remote}
        class Inflight:
            account = hashlib.sha256(b'fake-inf').hexdigest()
            def __init__(self, cfg): pass
            def __exit__(self, *a): pass
            def usage(self):
                return {'plan': 'parallel', 'image': {'free': 12, 'busy': 0, 'left': 1000 if outer.inf_available else 0},
                        'video': {'free': 12, 'busy': 0, 'left': 1000}}
            def submit(self, kind, tasks):
                if outer.overlap:
                    outer.assertTrue(outer.fg_started.wait(2), 'FastGen must start concurrently')
                outer.inf.extend(tasks)
                outer.inf_started.set()
                return [{'id': t['body']['client_ref'], 'client_ref': t['body']['client_ref'], 'state': 'accepted'} for t in tasks]
            def poll(self, ids):
                return [{'id': rid, 'state': 'ready', 'url': 'https://example.invalid/' + rid} for rid in ids]
            def download(self, url, dest): Image.new('RGB', (32, 32), 'blue').save(dest)
        self.stack = ExitStack()
        for obj, attr, value in [(h, 'session_scope', scope), (h.queue, 'session_scope', scope),
            (h.queue, 'load_config', lambda: self.cfg), (h, 'load_config', lambda: self.cfg),
            (h, 'limiter', limiter), (h, 'FastgenClient', FastGen), (h, 'InflightClient', Inflight),
            (h, 'time', SimpleNamespace(time=time.time, sleep=lambda s: time.sleep(.001))),
            (footage_jobs, 'wait_for_inputs', lambda ctx: None), (storage, 'media_root', lambda: self.root),
            (h.queue, 'media_root', lambda: self.root),
            (inflight, 'media_root', lambda: self.root),
            (h, 'scene_changed', lambda *a: None), (h, 'track_changed', lambda *a: None)]:
            self.stack.enter_context(patch.object(obj, attr, value))
        h._WORKING.clear()
        h.queue._LAST_POLL.clear()

    def tearDown(self):
        self.stack.close()
        self.engine.dispose()
        self.tmp.cleanup()

    def project(self, count=4, videos=False):
        with self.scope() as db:
            ch = Channel(name='test'); db.add(ch); db.flush()
            p = Project(channel_id=ch.id, name='test', settings={'images': {'provider': 'both', 'watermark_fix': 'none'},
                       'videos': {'mode': 'full' if videos else 'off'}})
            db.add(p); db.flush()
            t = Track(project_id=p.id, language='ru'); db.add(t); db.flush()
            ids = []
            for i in range(count):
                sc = Scene(track_id=t.id, idx=i, start=i, end=i+1, prompt=f'landscape {i}', characters=[])
                db.add(sc); db.flush(); ids.append(sc.id)
            self.ctx.track_id = t.id
        return ids

    def rows(self):
        with self.scope() as db: return db.scalars(select(MediaGeneration)).all()

    def test_both_services_work_concurrently_without_duplicate_scenes(self):
        ids = self.project()
        self.overlap = True
        result = h.hybrid_images(self.ctx)
        self.assertGreater(result['providers']['fastgen'], 0)
        self.assertGreater(result['providers']['inflight'], 0)
        rows = self.rows()
        self.assertEqual(len(rows), len(ids))
        self.assertEqual(len(self.fg) + len(self.inf), len(ids))
        self.assertTrue(all(r.state == 'ready' and r.remote_id and r.file for r in rows))
        h.hybrid_images(self.ctx)
        self.assertEqual(len(self.fg) + len(self.inf), len(ids))
        with self.scope() as db:
            self.assertEqual(len(db.scalars(select(FastgenUsage)).all()), len(self.fg))

    def test_fastgen_limit_routes_everything_to_inflight(self):
        self.project(); self.fg_available = False
        self.assertEqual(h.hybrid_images(self.ctx)['providers'], {'fastgen': 0, 'inflight': 4})

    def test_inflight_limit_routes_everything_to_fastgen(self):
        self.project(); self.inf_available = False
        self.assertEqual(h.hybrid_images(self.ctx)['providers'], {'fastgen': 4, 'inflight': 0})

    def test_video_first_frames_also_use_both_providers(self):
        self.project(videos=True); self.overlap = True
        h.hybrid_images(self.ctx, first_frames=True)
        self.assertEqual({r.provider for r in self.rows()}, {'fastgen', 'inflight'})
        self.assertTrue(all(r.owner.endswith(':frame') for r in self.rows()))

    def test_named_hero_references_are_sent_to_both_services(self):
        self.project(); self.overlap = True
        Image.new('RGB', (32, 32), 'green').save(self.root / 'hero.jpg')
        original = footage_jobs.image_payload
        def payload(*args, **kw):
            mode, body = original(*args, **kw)
            return 'ref2i', {**body, 'references': [{'name': 'REF_CHARACTER_7', 'path': 'hero.jpg'}]}
        with patch.object(footage_jobs, 'image_payload', payload): h.hybrid_images(self.ctx)
        self.assertTrue(self.fg and self.inf)
        self.assertTrue(all(r['inputs'][0]['name'] == 'REF_CHARACTER_7' for r in self.fg))
        self.assertTrue(all(r['body']['reference_images'][0]['name'] == 'REF_CHARACTER_7' for r in self.inf))

    def test_manually_selected_image_scene_gets_first_frame_for_video(self):
        ids = self.project(2)
        self.ctx.params = {'scene_ids': [ids[1]]}
        h.hybrid_images(self.ctx, first_frames=True)
        self.assertEqual([r.owner for r in self.rows()], [f'scene:{ids[1]}:frame'])

    def test_unsupported_reference_count_goes_entirely_to_inflight(self):
        self.project()
        Image.new('RGB', (32, 32), 'green').save(self.root / 'hero.jpg')
        original = footage_jobs.image_payload
        def payload(*args, **kw):
            mode, body = original(*args, **kw)
            return 'ref2i', {**body, 'references': [{'name': f'REF_{i}', 'path': 'hero.jpg'} for i in range(7)]}
        with patch.object(footage_jobs, 'image_payload', payload): h.hybrid_images(self.ctx)
        self.assertFalse(self.fg)
        self.assertEqual(len(self.inf), 4)

    def test_ambiguous_fastgen_post_is_not_repeated_or_rerouted(self):
        self.project(2)
        def timeout(*args, **kw): raise ApiError('FastGen', 0, 'timeout')
        with patch.object(h.FastgenClient, 'start', side_effect=timeout) as start:
            with self.assertRaises(JobError): h.hybrid_images(self.ctx)
            with self.assertRaises(JobError): h.hybrid_images(self.ctx)
            self.assertEqual(start.call_count, 1)
        self.assertEqual(len(self.rows()), 2)
        self.assertEqual(sum(r.state == 'unknown' for r in self.rows()), 1)

    def test_previous_frame_crosses_provider_boundary(self):
        ids = self.project(2)
        with self.scope() as db:
            previous, current = db.get(Scene, ids[0]), db.get(Scene, ids[1])
            previous.image_status = 'queued'
            payload = {'prompt': 'next', 'previous_scene_id': previous.id, 'continuity_change': 'turn left'}
            self.assertIsNone(h.resolved_payload(db, payload))
            previous.image_file, previous.image_status = 'fg-frame.jpg', 'done'
            resolved = h.resolved_payload(db, payload)
            self.assertEqual(resolved['references'][0], {'name': 'REF_PREVIOUS', 'path': 'fg-frame.jpg'})
            self.assertEqual(resolved['_continued_from'], previous.id)
            self.assertNotIn('previous_scene_id', resolved)

    def seed(self, provider, state, remote=None):
        sid = self.project(1)[0]
        with self.scope() as db:
            row = MediaGeneration(owner=f'scene:{sid}:image', provider=provider, account=hashlib.sha256(
                b'fastgen:fake-fg' if provider == 'fastgen' else b'fake-inf').hexdigest(),
                kind='image', mode='t2i', state=state, remote_id=remote,
                payload={'prompt': 'existing', '_operation': PipelineSettings().images.operation, '_hybrid_job': self.ctx.job_id})
            db.add(row); db.flush()
        return row.id

    def test_restart_resumes_fastgen_id_without_new_submission(self):
        self.seed('fastgen', 'accepted', 'old-remote')
        h.hybrid_images(self.ctx)
        self.assertEqual(self.finished, ['old-remote'])
        self.assertFalse(self.fg or self.inf)

    def test_restart_resumes_inflight_id_without_new_submission(self):
        self.seed('inflight', 'accepted', 'old-remote')
        h.hybrid_images(self.ctx)
        self.assertFalse(self.fg or self.inf)
        self.assertEqual(self.rows()[0].state, 'ready')

    def test_interrupted_submission_never_falls_back_to_other_service(self):
        for provider in ('fastgen', 'inflight'):
            with self.subTest(provider=provider):
                rid = self.seed(provider, 'submitting')
                with self.assertRaises(JobError): h.hybrid_images(self.ctx)
                self.assertEqual(next(r for r in self.rows() if r.id == rid).state, 'unknown')
                self.assertFalse(self.fg or self.inf)

    def test_missing_download_does_not_stall_or_resubmit(self):
        rid = self.seed('inflight', 'ready', 'old-remote')
        with self.scope() as db: db.get(MediaGeneration, rid).result = {'url': 'https://example.invalid/image'}
        def broken(*a): raise ApiError('Inflight', 0, 'download failed')
        with patch.object(h.InflightClient, 'download', broken), self.assertRaises(JobError):
            h.hybrid_images(self.ctx)
        self.assertEqual(self.rows()[0].state, 'ready')
        self.assertFalse(self.fg or self.inf)

    def test_force_restart_same_job_does_not_regenerate_completed_work(self):
        self.project(2); self.ctx.params = {'force': True}
        h.hybrid_images(self.ctx)
        h.hybrid_images(self.ctx)
        self.assertEqual(len(self.fg) + len(self.inf), 2)
        self.ctx.job_id += 1
        h.hybrid_images(self.ctx)
        self.assertEqual(len(self.fg) + len(self.inf), 4)

    def test_reference_incompatible_model_is_never_used(self):
        payload = {'_operation': 'flower_image_generate', 'references': [{'name': 'hero', 'path': 'hero.jpg'}]}
        self.assertFalse(h.fastgen_compatible(payload))
        payload['_operation'] = 'nano_banana_2_image_generate'
        self.assertTrue(h.fastgen_compatible(payload))
        payload['references'] *= 7
        self.assertFalse(h.fastgen_compatible(payload))

    def test_retry_keeps_ready_frames_and_retries_both_providers_including_old_failed_file(self):
        ids = self.project(4)
        from app.jobs.common import load_track
        with self.scope() as db:
            tc = load_track(db, self.ctx.track_id)
            for i, sid in enumerate(ids):
                sc = db.get(Scene, sid)
                mode, payload = footage_jobs.image_payload(sc, tc)
                key = h.signature({'request': payload, 'operation': tc.settings.images.operation, 'upscale': tc.settings.images.upscale_2x})
                state = 'ready' if i < 2 else 'failed' if i == 2 else 'declined'
                provider = 'fastgen' if i % 2 == 0 else 'inflight'
                db.add(MediaGeneration(owner=f'scene:{sid}:image', provider=provider, account='old-account', kind='image', mode=mode,
                    state=state, payload={**payload, '_input_key': key, '_hybrid_job': 90}, remote_id=f'old-{sid}'))
                if i != 2:
                    sc.image_file = f'old-{sid}.jpg'
                    Image.new('RGB', (32, 32), 'green').save(self.root / sc.image_file)
                sc.image_status = 'done' if i < 2 else 'failed'
                sc.image_meta = {'original': True, 'provider': provider}
        self.ctx.params = {'force': True, 'missing_only': True, 'retry_failed': True}
        self.fg_available = False
        h.hybrid_images(self.ctx)
        self.assertEqual(len(self.inf), 2)
        self.assertEqual(len(self.rows()), 6)
        with self.scope() as db:
            for sid in ids[:2]:
                sc = db.get(Scene, sid)
                self.assertEqual(sc.image_file, f'old-{sid}.jpg')
                self.assertTrue(sc.image_meta['original'])
            for sid in ids[2:]: self.assertEqual(db.get(Scene, sid).image_status, 'done')

    def test_retry_replaces_legacy_expired_fastgen_task_and_keeps_old_id(self):
        rid = self.seed('fastgen', 'accepted', 'expired-remote')
        with self.scope() as db:
            row = db.get(MediaGeneration, rid); row.error = 'Operation expired-remote not found or expired'
        self.ctx.job_id += 1
        self.ctx.params = {'retry_failed': True, 'missing_only': True}
        h.hybrid_images(self.ctx)
        self.assertEqual(len(self.rows()), 2)
        old = next(r for r in self.rows() if r.id == rid)
        self.assertEqual((old.state, old.remote_id), ('failed', 'expired-remote'))
        self.assertNotIn('expired-remote', self.finished)

    def test_retry_never_resends_unknown_submission(self):
        self.seed('inflight', 'unknown')
        self.ctx.job_id += 1
        self.ctx.params = {'retry_failed': True, 'missing_only': True}
        with self.assertRaises(JobError): h.hybrid_images(self.ctx)
        self.assertEqual(len(self.rows()), 1)
        self.assertFalse(self.fg or self.inf)

    def test_remote_fastgen_expiry_is_terminal_not_left_accepted_forever(self):
        rid = self.seed('fastgen', 'accepted', 'expired-remote')
        with patch.object(h.FastgenClient, 'finish_image', side_effect=ApiError('FastGen', 404, 'not found or expired')):
            with self.assertRaises(JobError): h.hybrid_images(self.ctx)
        self.assertEqual(next(r for r in self.rows() if r.id == rid).state, 'failed')


class LimiterTests(unittest.TestCase):
    def test_nonblocking_busy_thread_yields_to_other_provider(self):
        limiter = BudgetLimiter()
        with patch.object(limiter, '_budget', return_value=100), patch.object(limiter, '_used_now', return_value=(0, 5, 0)), \
             patch.object(limiter, '_can_start', return_value=False), patch.object(usage_sync, 'refresh'), \
             patch.object(limiter._cond, 'wait', side_effect=AssertionError('must not block')):
            with self.assertRaises(LimitReached):
                with limiter.slot(1, wait=False): pass
        self.assertEqual(limiter.waiting, 0)


if __name__ == '__main__': unittest.main()
