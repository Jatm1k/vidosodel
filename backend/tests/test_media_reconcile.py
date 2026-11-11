"""Repair stopped local queues while preserving files and accepted remote IDs."""
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import test_inflight as fixtures
from app import storage
from app.models import Channel, Project, Track, Scene, Job, MediaGeneration
from app.services import media_reconcile as recovery
from app.api.serializers import _scene_stats


class RecoveryTests(unittest.TestCase):
    def setUp(self):
        fixtures.QueueTests.setUp(self)
        self.root = Path(self.tmp.name) / 'media'; self.root.mkdir()
        Image.new('RGB', (32, 32), 'green').save(self.root / 'ready.jpg')

    def tearDown(self): fixtures.QueueTests.tearDown(self)

    def fixture(self, status='cancelled', kind='images'):
        with self.scope() as db:
            channel = Channel(name='test'); db.add(channel); db.flush()
            project = Project(name='test', channel_id=channel.id, settings={'videos': {'mode': 'full'}})
            db.add(project); db.flush()
            track = Track(project_id=project.id, language='ru'); db.add(track); db.flush()
            job = Job(kind=kind, status=status, track_id=track.id); db.add(job); db.flush()
            scenes = [Scene(track_id=track.id, idx=0, start=0, end=1, prompt='test', image_file='ready.jpg', image_status='queued',
                            image_meta={'keep': True}, overrides={'media_type': 'image'}),
                      Scene(track_id=track.id, idx=1, start=1, end=2, prompt='test', image_status='queued')]
            db.add_all(scenes); db.flush()
            pending = MediaGeneration(owner=f'scene:{scenes[0].id}:image', provider='pending', account='', kind='image',
                mode='t2i', state='queued', payload={'_hybrid_job': job.id})
            accepted = MediaGeneration(owner=f'scene:{scenes[1].id}:frame', provider='inflight', account='test', kind='image',
                mode='t2i', state='accepted', remote_id='remote-keep', payload={'_hybrid_job': job.id})
            db.add_all([pending, accepted]); db.flush()
            return track.id, job.id, [s.id for s in scenes], pending.id, accepted.id

    def reconcile(self, tid):
        with patch.object(recovery, 'session_scope', self.scope), patch.object(storage, 'media_root', lambda: self.root):
            return recovery.reconcile_idle_media(tid)

    def test_stopped_queue_restores_files_and_withdraws_only_unsubmitted_work(self):
        tid, jid, ids, pending, accepted = self.fixture()
        result = self.reconcile(tid)
        self.assertEqual(result, {'restored': 1, 'missing': 1, 'withdrawn': 1, 'tracks': [tid]})
        with self.scope() as db:
            self.assertEqual(db.get(Scene, ids[0]).image_status, 'done')
            self.assertEqual(db.get(Scene, ids[0]).image_meta, {'keep': True})
            self.assertEqual(db.get(Scene, ids[0]).image_file, 'ready.jpg')
            self.assertEqual(db.get(Scene, ids[1]).image_status, 'failed')
            self.assertEqual(db.get(MediaGeneration, pending).state, 'cancelled')
            self.assertEqual(db.get(MediaGeneration, accepted).remote_id, 'remote-keep')
            self.assertEqual(db.get(MediaGeneration, accepted).state, 'accepted')
        self.assertTrue((self.root / 'ready.jpg').is_file())
        self.assertEqual(self.reconcile(tid)['restored'], 0)

    def test_active_images_or_video_frame_producer_are_not_reconciled(self):
        for kind in ('images', 'videos'):
            tid, jid, ids, pending, accepted = self.fixture(status='running', kind=kind)
            self.assertEqual(self.reconcile(tid)['restored'], 0)
            with self.scope() as db:
                self.assertEqual(db.get(Scene, ids[0]).image_status, 'queued')
                self.assertEqual(db.get(MediaGeneration, pending).state, 'queued')

    def test_image_and_clip_counts_are_separate(self):
        tid, jid, ids, pending, accepted = self.fixture()
        with self.scope() as db:
            first, second = [db.get(Scene, sid) for sid in ids]
            first.image_status = 'done'
            second.image_file, second.image_status = 'ready.jpg', 'done'
            stats = _scene_stats(db, db.get(Track, tid))
            self.assertEqual((stats['image_files'], stats['image_total']), (2, 2))
            self.assertEqual((stats['videos'], stats['video_total']), (0, 1))
            self.assertEqual(stats['images'], 1)  # Only the still scene is render-ready.


if __name__ == '__main__': unittest.main()
