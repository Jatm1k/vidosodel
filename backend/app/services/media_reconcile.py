"""Repair orphaned scene queue flags without submitting or cancelling remote jobs."""
from sqlalchemy import select

from ..db import session_scope
from ..models import Job, MediaGeneration, Scene
from ..storage import to_abs


def reconcile_idle_media(track_id=None):
    changed = set()
    restored = missing = withdrawn = 0
    with session_scope() as db:
        active = db.scalars(select(Job).where(Job.status.in_(("queued", "running")),
                                           Job.kind.in_(("images", "videos")))).all()
        busy_images = {j.track_id for j in active}
        busy_videos = {j.track_id for j in active if j.kind == "videos"}
        query = select(Scene).where((Scene.image_status.in_(("queued", "generating"))) |
                                    (Scene.video_status.in_(("queued", "generating"))))
        if track_id is not None: query = query.where(Scene.track_id == track_id)
        scenes = db.scalars(query).all()
        for sc in scenes:
            for kind, busy in (("image", busy_images), ("video", busy_videos)):
                if sc.track_id in busy or getattr(sc, kind + "_status") not in ("queued", "generating"): continue
                path = to_abs(getattr(sc, kind + "_file"))
                if path and path.is_file():
                    setattr(sc, kind + "_status", "done")
                    setattr(sc, kind + "_error", None)
                    restored += 1
                else:
                    setattr(sc, kind + "_status", "failed")
                    setattr(sc, kind + "_error", "Генерация остановлена до сохранения результата. Продолжите задачу; принятые ID будут использованы повторно.")
                    missing += 1
                changed.add(sc.track_id)
        # Remove only never-submitted local work belonging to stopped jobs.
        # Accepted/unknown IDs remain untouched and can be resumed explicitly.
        owners = {f"scene:{sc.id}:{suffix}" for sc in scenes if sc.track_id not in busy_images for suffix in ("image", "frame")}
        if owners:
            rows = db.scalars(select(MediaGeneration).where(MediaGeneration.owner.in_(owners),
                MediaGeneration.state == "queued", MediaGeneration.remote_id.is_(None))).all()
            jobs = {}
            for row in rows:
                jid = row.payload.get("_hybrid_job")
                if jid is None: continue
                if jid not in jobs: jobs[jid] = db.get(Job, jid)
                job = jobs[jid]
                if job and job.status in ("failed", "cancelled", "done"):
                    row.state, row.error = "cancelled", "Локальная очередь остановленной задачи снята; удалённая генерация не отправлялась"
                    withdrawn += 1
    return {"restored": restored, "missing": missing, "withdrawn": withdrawn, "tracks": sorted(changed)}
