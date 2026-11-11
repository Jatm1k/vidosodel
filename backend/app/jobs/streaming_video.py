"""Start each clip when its own first frame is ready, alongside image production."""
from concurrent.futures import ThreadPoolExecutor
from datetime import timezone
import threading

import httpx
from sqlalchemy import select

from ..models import Job, MediaGeneration, Scene
from ..services.http import ApiError
from ..services.limiter import job_hooks
from . import footage_jobs as ft
from .runner import JobCancelled, JobError


class FrameContext:
    """Share cancellation, but keep the frame worker's progress out of the video job."""
    def __init__(self, parent, scene_ids):
        self.parent = parent
        self.params = {**parent.params, "scene_ids": list(scene_ids)}
        self.stop = threading.Event()
        self.message = ""

    def __getattr__(self, name):
        if name == "job_id": return getattr(self.parent, name, 0)
        return getattr(self.parent, name)

    def should_stop(self):
        return self.stop.is_set() or getattr(self.parent, "should_stop", lambda: False)()

    def check(self):
        self.parent.check()
        if self.stop.is_set(): raise JobCancelled()

    def progress(self, value=None, message=None, **kwargs):
        if message: self.message = message

    def set_idle(self, idle): pass


def generate_videos(ctx):
    ft.wait_for_inputs(ctx)
    only = set(ctx.params.get("scene_ids") or [])
    force = bool(ctx.params.get("force")) and not ctx.params.get("missing_only")
    retry_failed = bool(ctx.params.get("retry_failed"))
    with ft.session_scope() as db:
        tc = ft.load_track(db, ctx.track_id)
        if tc.shares_images:
            raise JobError("Эта версия использует видеоряд основного языка")
        skip = ft.motion_store.motion_scene_idxs(tc.track.motion)
        targets = {sc.id for sc in tc.track.scenes if sc.idx not in skip and
                   (sc.id in only if only else ft.wants_video(sc, tc.settings)) and
                   (force or not sc.video_file or retry_failed and sc.video_status == "failed")}
        if not targets: return {"message": "Все выбранные сцены уже готовы"}
        resume = {sid: rid for sid, rid in ft.resumable_videos(tc, force=force, job_id=getattr(ctx, "job_id", None)).items() if sid in targets}
        cast = list(tc.project.characters)
        needed = {cid for sc in tc.track.scenes if sc.id in targets and sc.id not in resume
                  and not ft.uses_first_frame(sc, tc.settings) and tc.settings.videos.character_refs
                  for cid in (sc.characters if sc.characters is not None else ft.chars.mentioned(sc.prompt, cast))}
        for sc in tc.track.scenes:
            if sc.id not in targets: continue
            if only: sc.overrides = {**(sc.overrides or {}), "media_type": "video"}
            sc.video_status, sc.video_error = "queued", None
        provider = tc.settings.images.provider
        project_id = tc.project.id
        follow = ctx.params.get("follow_images")
        if not follow:
            follow = db.scalar(select(Job.id).where(Job.track_id == ctx.track_id, Job.kind == "images",
                Job.status.in_(("queued", "running"))).order_by(Job.id.desc()))
    if needed:
        from .character_jobs import ensure_portraits
        ensure_portraits(project_id, ctx, only=needed, provider="inflight")

    ids = dict(resume)  # scene -> durable video task; never submit twice in this run
    done, failed = set(), set()
    worker, frame_ctx, attempted = None, None, False
    producer_error = None
    errors = 0
    try:
        with ThreadPoolExecutor(max_workers=1) as pool, ft.InflightClient() as client:
            try:
                while len(done) < len(targets):
                    ctx.check()
                    if worker and worker.done():
                        producer_error = worker.exception()
                        if isinstance(producer_error, JobCancelled): ctx.check()
                    with ft.session_scope() as db:
                        tc = ft.load_track(db, ctx.track_id)
                        producer = db.get(Job, int(follow)) if follow else None
                        external_active = bool(producer and producer.status in ("queued", "running"))
                        remaining = [sc for sc in tc.track.scenes if sc.id in targets - done - ids.keys()]
                        missing = {sc.id for sc in remaining if ft.uses_first_frame(sc, tc.settings)
                                   and not (sc.overrides or {}).get("first_frame")
                                   and (not ft.scene_first_frame(sc) or sc.image_status in ("queued", "generating", "failed"))}
                        # FastGen-only image jobs do not prepare video first frames themselves.
                        if missing and not attempted and (not external_active or provider == "fastgen"):
                            if not producer or producer.status not in ("failed", "cancelled"):
                                frame_ctx = FrameContext(ctx, missing)
                                def produce_frames():
                                    with job_hooks(frame_ctx.should_stop, lambda msg: frame_ctx.progress(message=msg)):
                                        return ft.generate_scenes(frame_ctx, False, first_frames=True, skip_scene_ids=set(resume))
                                worker = pool.submit(produce_frames)
                                attempted = True
                        producing = external_active or bool(worker and not worker.done())
                        eligible = []
                        for sc in remaining:
                            explicit_frame = (sc.overrides or {}).get("first_frame")
                            needs_frame = ft.uses_first_frame(sc, tc.settings)
                            frame_ready = bool(ft.scene_first_frame(sc)) and (bool(explicit_frame) or sc.image_status not in ("queued", "generating", "failed"))
                            # A forced image branch may not yet have marked old files queued.
                            # Wait for its fresh frame, rather than racing ahead with the old one.
                            refresh = producer and provider != "fastgen" and (producer.params or {}).get("force") and not sc.video_file and not explicit_frame
                            selected_images = (producer.params or {}).get("scene_ids") if producer else None
                            if refresh and (not selected_images or sc.id in selected_images):
                                started = producer.started_at.replace(tzinfo=timezone.utc).timestamp() if producer.started_at else float("inf")
                                frame_ready = frame_ready and (sc.image_meta or {}).get("generated_at", 0) >= started
                            if not needs_frame or frame_ready:
                                eligible.append(sc.id)
                            elif not producing and (attempted or producer):
                                sc.video_status = "failed"
                                sc.video_error = "Не готов первый кадр: " + (sc.image_error or str(producer_error or "генерация картинок завершилась без кадра"))[:400]
                                failed.add(sc.id); done.add(sc.id)
                        gone = targets - done - {sc.id for sc in tc.track.scenes}
                        done.update(gone); failed.update(gone)

                    # Poll accepted clips before directing the next group of ready frames.
                    try:
                        task_ids = list(ids.values())
                        if task_ids:
                            ft.queue.poll(client, task_ids)
                            ft.queue.collect(client, task_ids)
                            with ft.session_scope() as db:
                                rows = db.scalars(select(MediaGeneration).where(MediaGeneration.id.in_(task_ids))).all()
                            owners = {rid: sid for sid, rid in ids.items()}
                            for row in rows:
                                sid = owners[row.id]
                                if sid in done: continue
                                if row.state in ("unknown", "submitting"):
                                    raise JobError("Отправка клипа не подтверждена. ID сохранены; повторная отправка остановлена.")
                                if row.state in ft.queue.FINAL and (row.state != "ready" or row.file):
                                    ft.save_generation(row, sid, ctx.track_id, video=True)
                                    done.add(sid)
                                    if row.state != "ready": failed.add(sid)
                            ft.queue.admit(client, [rid for sid, rid in ids.items() if sid not in done])
                        if eligible:
                            from .video_prompt_jobs import ensure_video_prompts
                            ready = set(eligible[:6])
                            ensure_video_prompts(ctx, scene_ids=ready)
                            with ft.session_scope() as db:
                                tc = ft.load_track(db, ctx.track_id)
                                for sc in tc.track.scenes:
                                    if sc.id not in ready: continue
                                    mode, payload = ft.scene_payload(sc, tc, True)
                                    if getattr(ctx, "job_id", None) is not None:
                                        payload["_video_job"] = ctx.job_id
                                    ids[sc.id] = ft.queue.enqueue(client, f"scene:{sc.id}:video", "video", mode, payload, force=force, retry_failed=retry_failed)
                            ft.queue.admit(client, [ids[sid] for sid in ready])
                        errors = 0
                    except (ApiError, httpx.HTTPError) as exc:
                        errors += 1
                        if isinstance(exc, ApiError) and exc.status not in (0, 408, 429, 500, 502, 503, 504): raise
                        if errors >= 15: raise
                    ctx.set_idle(not eligible and not any(sid not in done for sid in ids))
                    ctx.progress(len(done) / len(targets),
                        f"Клипы: {len(done) - len(failed)}/{len(targets)} · ожидают первого кадра: {len(targets - done - ids.keys())}")
                    if len(done) < len(targets):
                        for _ in range(10): ctx.check(); ft.time.sleep(.1)
            finally:
                if frame_ctx: frame_ctx.stop.set()
    finally:
        ctx.set_idle(False)
    if failed:
        raise JobError(f"Не готовы {len(failed)}/{len(targets)} сцен. Готовые клипы и принятые ID сохранены; причины — в карточках сцен.")
    return {"message": f"Готово {len(done)} клипов", "task_ids": list(ids.values())}
