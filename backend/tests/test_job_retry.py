"""Retry resumes media failures, rather than replaying a forced replacement."""
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import test_inflight as fixtures
from app.api import jobs
from app.models import Job, utcnow


class RetryTests(unittest.TestCase):
    def setUp(self): fixtures.QueueTests.setUp(self)
    def tearDown(self): fixtures.QueueTests.tearDown(self)

    def test_force_is_removed_and_selected_scene_scope_is_preserved(self):
        job = Job(kind='images', params={'force': True, 'scene_ids': [2, 3], 'follow_overwrite': True, '_after': [1]})
        params = jobs._retry_params(job)
        self.assertEqual(params, {'scene_ids': [2, 3], 'missing_only': True, 'retry_failed': True})
        self.assertTrue(job.params['force'])

    def test_other_job_kinds_keep_their_original_behavior(self):
        job = Job(kind='render', params={'force': True, 'allow_missing': False})
        self.assertEqual(jobs._retry_params(job), job.params)

    def test_retry_api_repoints_streaming_video_and_preserves_completed_media(self):
        with self.scope() as db:
            root = Job(kind='images', status='failed', params={'force': True}, project_id=10, track_id=20)
            db.add(root); db.flush()
            video = Job(kind='videos', status='failed', started_at=utcnow(),
                params={'force': True, 'follow_images': root.id}, project_id=10, track_id=20)
            db.add(video); db.flush()
            render = Job(kind='render', status='cancelled', depends_on_id=video.id,
                params={'_after': [root.id]}, project_id=10, track_id=20)
            db.add(render); db.flush(); root_id = root.id
        calls = []
        def enqueue(kind, **kw):
            job = SimpleNamespace(id=100 + len(calls), kind=kind, **kw); calls.append(job); return job
        with self.scope() as db, patch.object(jobs.runner, 'enqueue', enqueue):
            result = jobs.retry_job(root_id, db)
        self.assertEqual(result, {'job_id': 100, 'resumed': 2})
        image, video, render = calls
        self.assertNotIn('force', image.params)
        self.assertNotIn('force', video.params)
        self.assertTrue(image.params['retry_failed'])
        self.assertEqual(video.params['follow_images'], image.id)
        self.assertEqual(render.depends_on, video.id)
        self.assertEqual(render.params['_after'], [image.id])


if __name__ == '__main__': unittest.main()
