"""The clip queue: every clip starts the moment its own inputs are ready.

Inputs of a clip: its shot plan (the director writes plans in parallel in the background – the queue never
waits for an LLM while slots are free), its first frame when it starts from a still (made alongside by the
image step) and, for the endless story, the previous clip. All ready clips are admitted together, so every
free slot of the tariff is used; the queue's priority (scene start) makes the beginning of the video first.

Multishot: the group leader's clip holds the shots of all its scenes; after download the clip is cut at its
detected hard cuts and each scene plays its own shot.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import timezone
import threading

import httpx
from sqlalchemy import select

from ..models import Job, MediaGeneration, Scene
from ..pipeline.footage import route_of, is_member, continues
from ..pipeline.video_prompts import shot_lengths
from ..services.http import ApiError
from ..services.limiter import job_hooks
from . import footage_jobs as ft
from .runner import JobCancelled, JobError


class FrameContext:
    """Share cancellation, but keep a helper worker's progress out of the video job."""
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


def _manual(sc):
    return bool(str((sc.overrides or {}).get("video_prompt") or "").strip())


def chain_frame(sc, previous, tc):
    """The frame where the previous clip leaves the screen becomes this clip's first frame."""
    from ..render.footage import frame_at
    from ..render.media import imwrite
    from ..storage import to_abs, to_rel, track_dir
    meta = previous.video_meta or {}
    leave = float(meta.get("clip_start") or 0) + ft.screen_seconds(previous)
    if meta.get("clip_end"):
        leave = min(leave, float(meta["clip_end"]))
    if meta.get("duration"):
        leave = min(leave, float(meta["duration"]))
    frame = frame_at(to_abs(previous.video_file), max(0., leave - .05))
    dest = track_dir(tc.project.id, tc.track.id, "frames") / f"chain_{sc.id}_{previous.id}.jpg"
    return to_rel(imwrite(dest, frame, quality=95))


def save_clip(row, scene_id, track_id):
    """Store a finished clip on its scene, or on every scene of a multishot group."""
    ft.save_generation(row, scene_id, track_id, video=True)
    multi = row.payload.get("_multishot")
    if not multi:
        return
    from ..render.footage import detect_cuts, frame_at
    from ..render.media import imwrite
    from ..storage import to_abs, to_rel
    scenes, screens = list(multi["scenes"]), list(multi["screens"])
    starts = [0.]
    if row.state == "ready":
        lengths = shot_lengths(screens)
        expected = [round(sum(lengths[:n]), 3) for n in range(1, len(lengths))]
        starts += detect_cuts(to_abs(row.file), len(scenes), expected)
    with ft.session_scope() as db:
        leader = db.get(Scene, scene_id)
        base = dict(leader.video_meta or {}) if leader else {}
        for n, sid in enumerate(scenes):
            sc = db.get(Scene, sid)
            if not sc:
                continue
            if row.state != "ready":
                if n:
                    sc.video_status, sc.video_error = "failed", (leader.video_error if leader else None) or "Мультишот-клип не создан"
                continue
            start, end = starts[n], starts[n + 1] if n + 1 < len(starts) else None
            meta = {**base, "multishot_of": scene_id, "shot": n, "clip_start": start, "clip_end": end}
            if n:
                try:
                    frame = frame_at(to_abs(row.file), start + .3)
                    meta["poster_file"] = to_rel(imwrite(to_abs(row.file).with_name(f"{to_abs(row.file).stem}.shot{n}.poster.jpg"), frame, quality=90))
                except ValueError:
                    meta["poster_file"] = None
                sc.video_file, sc.video_status, sc.video_error = row.file, "done", None
            sc.video_meta = meta
            ft.scene_changed(track_id, ft.scene_to_dict(sc))
    ft.track_changed(track_id, "videos")


def generate_videos(ctx):
    from .video_prompt_jobs import ensure_routes, ensure_video_prompts
    ft.wait_for_inputs(ctx)
    ensure_routes(ctx.track_id, ctx.check, ctx.progress)
    only = set(ctx.params.get("scene_ids") or [])
    force = bool(ctx.params.get("force")) and not ctx.params.get("missing_only")
    retry_failed = bool(ctx.params.get("retry_failed"))
    with ft.session_scope() as db:
        tc = ft.load_track(db, ctx.track_id)
        if tc.shares_images:
            raise JobError("Эта версия использует видеоряд основного языка")
        settings = tc.settings
        skip = ft.motion_store.motion_scene_idxs(tc.track.motion)
        by_id = {sc.id: sc for sc in tc.track.scenes}

        def lead(sc):
            return by_id.get(route_of(sc).get("group"), sc) if is_member(sc) else sc

        def group(sc):
            return [by_id[i] for i in route_of(sc).get("shots") or [sc.id] if i in by_id] if not is_member(sc) else [sc]

        def needs(sc):
            shots = group(sc)
            return force or any(not s.video_file or retry_failed and s.video_status == "failed" for s in shots)

        selected = [sc for sc in tc.track.scenes if sc.idx not in skip and
                    (sc.id in only if only else ft.wants_video(sc, settings))]
        targets = {lead(sc).id for sc in selected if needs(lead(sc))}
        if not targets: return {"message": "Все выбранные сцены уже готовы"}
        members = {s.id for t in targets for s in group(by_id[t])} - targets
        resume = {sid: rid for sid, rid in ft.resumable_videos(tc, force=force, job_id=getattr(ctx, "job_id", None)).items() if sid in targets}
        cast = list(tc.project.characters)
        needed = {cid for sc in tc.track.scenes if sc.id in targets and sc.id not in resume
                  and ft.generation_mode(sc, settings) in ("ref2v", "im2v") and settings.videos.character_refs
                  for cid in (sc.characters if sc.characters is not None else ft.chars.mentioned(sc.prompt, cast))}
        for sc in tc.track.scenes:
            if sc.id not in targets | members: continue
            if only and sc.id in only: sc.overrides = {**(sc.overrides or {}), "media_type": "video"}
            sc.video_status, sc.video_error = "queued", None
        provider = settings.images.provider
        project_id = tc.project.id
        follow = ctx.params.get("follow_images")
        if not follow:
            follow = db.scalar(select(Job.id).where(Job.track_id == ctx.track_id, Job.kind == "images",
                Job.status.in_(("queued", "running"))).order_by(Job.id.desc()))
    if needed:
        from .character_jobs import ensure_portraits
        ensure_portraits(project_id, ctx, only=needed, provider="inflight")

    planned, plan_lock = set(), threading.Lock()

    def on_written(found):
        with plan_lock: planned.update(found)

    ids = dict(resume)  # scene -> durable video task; never submit twice in this run
    done, failed = set(), set()
    rewritten, replan = set(), set()
    worker, frame_ctx, attempted = None, None, False
    director_ctx = FrameContext(ctx, targets | members)
    producer_error = director_error = None
    errors = 0

    def direct():
        with job_hooks(director_ctx.should_stop, lambda msg: director_ctx.progress(message=msg)):
            return ensure_video_prompts(director_ctx, scene_ids=(targets | members) - set(resume), on_written=on_written)

    try:
        with ThreadPoolExecutor(max_workers=2) as pool, ft.InflightClient() as client:
            director = pool.submit(direct)
            try:
                while len(done) < len(targets):
                    ctx.check()
                    if worker and worker.done():
                        producer_error = worker.exception()
                        if isinstance(producer_error, JobCancelled): ctx.check()
                    if director.done() and director_error is None:
                        director_error = director.exception()
                        if isinstance(director_error, JobCancelled): ctx.check()
                    directing = not director.done()
                    with ft.session_scope() as db:
                        tc = ft.load_track(db, ctx.track_id)
                        settings = tc.settings
                        by_id = {sc.id: sc for sc in tc.track.scenes}
                        producer = db.get(Job, int(follow)) if follow else None
                        external_active = bool(producer and producer.status in ("queued", "running"))
                        remaining = [sc for sc in tc.track.scenes if sc.id in targets - done - ids.keys()]
                        missing = {sc.id for sc in remaining if ft.uses_first_frame(sc, settings)
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

                        def fail(sc, message):
                            for s in [by_id[i] for i in route_of(sc).get("shots") or [sc.id] if i in by_id]:
                                s.video_status, s.video_error = "failed", message[:500]
                            failed.add(sc.id); done.add(sc.id)

                        for sc in remaining:
                            shots = [by_id[i] for i in route_of(sc).get("shots") or [sc.id] if i in by_id]
                            with plan_lock:
                                ready_plan = all(s.id in planned or _manual(s) for s in shots)
                            if not ready_plan:
                                if not directing:
                                    fail(sc, "Нет режиссуры клипа: " + str(director_error or "LLM не вернула план")[:400])
                                continue
                            source = continues(sc)
                            if source:
                                previous = by_id.get(source)
                                if previous is None or previous.id in failed or previous.video_status == "failed":
                                    # The chain is broken: the clip is made on its own from text.
                                    route = {**route_of(sc), "mode": "t2v"}
                                    route.pop("continue_from", None); route.pop("chain_frame", None)
                                    sc.video_plan = {**(sc.video_plan or {}), "route": route}
                                    with plan_lock: planned.discard(sc.id)
                                    replan.add(sc.id)
                                    continue
                                if previous.video_status != "done" or not previous.video_file:
                                    continue
                                frame = route_of(sc).get("chain_frame")
                                if not frame or f"_{previous.id}." not in frame or (previous.video_meta or {}).get("generated_at", 0) > (sc.video_plan or {}).get("chain_at", 0):
                                    try:
                                        frame = chain_frame(sc, previous, tc)
                                    except ValueError as exc:
                                        fail(sc, f"Не удалось взять кадр предыдущего клипа: {exc}")
                                        continue
                                    sc.video_plan = {**(sc.video_plan or {}), "route": {**route_of(sc), "chain_frame": frame},
                                                     "chain_at": ft.time.time()}
                                eligible.append(sc.id)
                                continue
                            explicit_frame = (sc.overrides or {}).get("first_frame")
                            needs_frame = ft.uses_first_frame(sc, settings)
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
                                fail(sc, "Не готов первый кадр: " + (sc.image_error or str(producer_error or "генерация картинок завершилась без кадра")))
                        gone = targets - done - set(by_id)
                        done.update(gone); failed.update(gone)
                    if replan:
                        # Rare (a broken endless-story chain): direct these clips again as text-only shots.
                        ensure_video_prompts(director_ctx, scene_ids=set(replan), on_written=on_written)
                        replan.clear()

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
                                if row.state == "declined" and settings.videos.refusal_rewrite and sid not in rewritten \
                                        and not row.payload.get("_rewritten"):
                                    rewritten.add(sid)
                                    if retry_refused(ctx, client, row, sid, ids):
                                        continue
                                if row.state in ft.queue.FINAL and (row.state != "ready" or row.file):
                                    save_clip(row, sid, ctx.track_id)
                                    done.add(sid)
                                    if row.state != "ready": failed.add(sid)
                        if eligible:
                            with ft.session_scope() as db:
                                tc = ft.load_track(db, ctx.track_id)
                                for sc in tc.track.scenes:
                                    if sc.id not in eligible: continue
                                    try:
                                        mode, payload = ft.scene_payload(sc, tc, True)
                                    except JobError as exc:
                                        sc.video_status, sc.video_error = "failed", str(exc)[:500]
                                        failed.add(sc.id); done.add(sc.id)
                                        continue
                                    if getattr(ctx, "job_id", None) is not None:
                                        payload["_video_job"] = ctx.job_id
                                    ids[sc.id] = ft.queue.enqueue(client, f"scene:{sc.id}:video", "video", mode, payload, force=force, retry_failed=retry_failed)
                        waiting = [rid for sid, rid in ids.items() if sid not in done]
                        if waiting:
                            ft.queue.admit(client, waiting)
                        errors = 0
                    except (ApiError, httpx.HTTPError) as exc:
                        errors += 1
                        if isinstance(exc, ApiError) and exc.status not in (0, 408, 429, 500, 502, 503, 504): raise
                        if errors >= 15: raise
                    ctx.set_idle(not eligible and not directing and not any(sid not in done for sid in ids))
                    with plan_lock:
                        directed = len(planned & (targets | members))
                    ctx.progress(len(done) / len(targets),
                        f"Клипы: {len(done) - len(failed)}/{len(targets)} · в работе: {len(set(ids) - done)}"
                        + (f" · режиссура {directed}/{len(targets | members)}" if directing else "")
                        + f" · ждут кадра: {len(targets - done - ids.keys())}")
                    if len(done) < len(targets):
                        for _ in range(10): ctx.check(); ft.time.sleep(.1)
            finally:
                director_ctx.stop.set()
                if frame_ctx: frame_ctx.stop.set()
    finally:
        ctx.set_idle(False)
    if failed:
        raise JobError(f"Не готовы {len(failed)}/{len(targets)} клипов. Готовые клипы и принятые ID сохранены; причины — в карточках сцен.")
    return {"message": f"Готово {len(done)} клипов", "task_ids": list(ids.values())}


def retry_refused(ctx, client, row, sid, ids) -> bool:
    """One LLM rewrite of a refused clip by its refusal kind; False – keep the refusal."""
    from ..pipeline.video_prompts import rewrite_refused
    from ..services.fastgen import FastgenClient
    result = row.result or {}
    key = "video_prompt" if row.mode == "im2v" else "prompt"
    try:
        with ft.session_scope() as db:
            llm = ft.load_track(db, ctx.track_id).settings.llm
        with FastgenClient() as fg:
            prompt = rewrite_refused(fg, row.payload.get(key) or "", result.get("refusal_kind") or "other",
                                     result.get("error_text") or row.error or "", llm)
    except Exception as exc:  # the refusal stays; the reason is in the scene card
        if isinstance(exc, JobCancelled):
            raise
        return False
    payload = {**{k: v for k, v in row.payload.items() if k != "_request_audit"}, key: prompt, "_rewritten": True}
    ids[sid] = ft.queue.enqueue(client, row.owner, row.kind, row.mode, payload, retry_failed=True)
    with ft.session_scope() as db:
        sc = db.get(Scene, sid)
        if sc:
            sc.video_error = f"Отказ ({result.get('refusal_kind') or 'other'}), промпт переписан и отправлен снова"
    return True
