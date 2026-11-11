"""Scene video/image generation through the durable Inflight queue."""
from __future__ import annotations

import time
import hashlib
from dataclasses import replace
from typing import Any

from ..db import session_scope
from ..models import Scene, MediaGeneration
from sqlalchemy import select
from ..settings_store import load_config
from ..motion import store as motion_store
from ..pipeline import characters as chars
from ..pipeline.footage import (wants_video, generation_mode, scene_first_frame, uses_first_frame, wants_still,
                                route_of, is_member)
from ..pipeline.llm_tasks import compose_prompt
from ..pipeline.video_prompts import compose_video, compose_opening, compose_multishot


def screen_seconds(scene) -> float:
    """How long the scene's clip is on screen (a clip itself is always 10 s)."""
    return round(max(.5, float(scene.end) - float(scene.start)), 2)
from ..services.inflight import InflightClient
from ..services import inflight_queue as queue
from ..storage import media_url
from .common import load_track, scene_image, scene_to_dict
from .events import scene_changed, track_changed
from .runner import JobContext, JobError, register, runner


def scene_payload(scene, tc, video: bool, *, for_planning=False) -> tuple[str, dict]:
    s, ov = tc.settings, scene.overrides or {}
    refs, notes = [], []
    requested = generation_mode(scene, s)
    mode = "i2v" if requested == "auto" else requested
    allow_refs = not video or mode in ("ref2v", "im2v")
    if allow_refs and (s.videos.character_refs if video else s.images.character_refs):
        known = list(tc.project.characters)
        # Up to ten references, retaining stable semantic labels and order.
        ids = scene.characters if scene.characters is not None else chars.mentioned(scene.prompt, known)
        for c in known:
            if c.id in ids:
                if not c.image_file and not for_planning:
                    raise JobError(f"Нет референса героя/локации «{c.name}» — создайте или загрузите его")
                label = f"REF_{c.kind.upper()}_{c.id}"
                refs.append({"name": label, "path": c.image_file or ""})
                notes.append(f"{label} shows {c.name}: {c.description}. Preserve their identity.")
    if video and requested == "t2v" and s.videos.character_refs:
        known = list(tc.project.characters)
        ids = scene.characters if scene.characters is not None else chars.mentioned(scene.prompt, known)
        notes += [f"{c.name}: {c.description}." for c in known if c.id in ids]
    paths = list(ov.get("references") or []) + (s.videos.references if video else [])
    if s.images.use_references:
        paths += s.images.reference_images
    scene_refs = list(ov.get("references") or [])
    for path in dict.fromkeys(paths if allow_refs else []):
        if path not in [r["path"] for r in refs]:
            label = f"REF_{'SCENE' if path in scene_refs else 'STYLE'}_{len(refs) + 1}"
            refs.append({"name": label, "path": path})
            notes.append(f"Use {label} as a visual reference for this scene." if path in scene_refs else
                         f"{label} is a style reference only; follow its art direction, not its subjects.")
    if len(refs) > 10:
        raise JobError("В сцене больше 10 референсов: сократите список")
    still_prompt = compose_prompt(scene.prompt, s.images)
    video_prompt = str(ov.get("video_prompt") or scene.prompt) + "\n" + s.videos.direction
    note = " ".join(notes)
    payload: dict[str, Any] = {"prompt": note + "\n" + (video_prompt if video else still_prompt),
                               "aspect_ratio": s.videos.aspect_ratio, "references": refs}
    if not video:
        previous = chars.continued_from(scene, list(tc.track.scenes)) if s.images.scene_continuity else None
        if previous and previous.idx in motion_store.motion_scene_idxs(tc.track.motion):
            previous = None
        if previous:
            payload["previous_scene_id"] = previous.id
            payload["continuity_change"] = str((scene.continuity or {}).get("change") or "")
        # Stills that are first frames go a little ahead of clips at the same point of the video.
        payload["_priority"] = float(scene.start) - (30 if wants_video(scene, s) else 0)
        return ("ref2i" if refs or previous else "t2i"), payload
    first = scene_first_frame(scene)
    if mode == "i2v":
        if not first and not for_planning:
            raise JobError(f"Сцена {scene.idx + 1}: загрузите первый кадр или выберите другой режим")
        payload["first_frame"] = first
    if mode == "im2v":
        payload.update(image_prompt=note + "\n" + still_prompt, video_prompt=video_prompt)
        if refs:
            raise JobError("Режим «картинка → видео» не принимает референсы в этом API. Выберите ref2v или i2v.")
    if for_planning:
        payload["_reference_notes"] = note
        return mode, payload
    plan = (getattr(scene, "video_plan", None) or {}).get("shot")
    route = route_of(scene)
    try:
        if route.get("shots") and route.get("group") == scene.id:
            # Multishot leader: one clip, one shot per scene of the group.
            members = {sc.id: sc for sc in tc.track.scenes if sc.id in route["shots"]}
            ordered = [members[i] for i in route["shots"] if i in members]
            shots = [(sc.video_plan or {}).get("shot") for sc in ordered]
            if len(ordered) != len(route["shots"]) or not all(shots):
                raise ValueError("Нет режиссуры всех шотов мультишот-клипа")
            directed = compose_multishot(s, shots, [screen_seconds(sc) for sc in ordered], note)
            payload["_multishot"] = {"scenes": route["shots"], "screens": [screen_seconds(sc) for sc in ordered]}
        else:
            directed = compose_video(mode, s, shot=plan, manual=str(ov.get("video_prompt") or ""), notes=note,
                                     screen=screen_seconds(scene), continued=bool(route.get("continue_from")))
        payload["prompt"] = directed
        payload["_priority"] = float(scene.start)
        payload["_video_plan"] = {"manual": bool(str(ov.get("video_prompt") or "").strip()),
                                  "shot": plan if not ov.get("video_prompt") else None}
        payload["_source"] = {"first_frame": first if mode == "i2v" else None,
                              "references": refs, "frame_generation": (getattr(scene, "image_meta", None) or {}) if mode == "i2v" else None}
        if mode == "im2v":
            payload["video_prompt"] = directed
            payload["image_prompt"] = compose_opening(plan, scene.prompt, s)
    except ValueError as exc:
        raise JobError(str(exc)) from exc
    return mode, payload


def image_payload(scene, tc, *, first_frame=False):
    if first_frame:
        images = tc.settings.images
        paths = list(dict.fromkeys((images.reference_images if images.use_references else []) + tc.settings.videos.references))
        frame_settings = tc.settings.model_copy(update={"images": images.model_copy(update={
            "character_refs": tc.settings.videos.character_refs, "reference_images": paths,
            "use_references": bool(paths)})})
        tc = replace(tc, settings=frame_settings)
    return scene_payload(scene, tc, False)


def resumable_videos(tc, *, force=False, job_id=None):
    """Keep accepted IDs/results across routing upgrades and application restarts."""
    account = hashlib.sha256(load_config().inflight_api_key.strip().encode()).hexdigest()
    owners = {f"scene:{sc.id}:video": sc.id for sc in tc.track.scenes}
    with session_scope() as db:
        rows = db.scalars(select(MediaGeneration).where(MediaGeneration.owner.in_(owners),
            MediaGeneration.account == account).order_by(MediaGeneration.id.desc())).all()
    latest = {}
    for row in rows:
        latest.setdefault(row.owner, row)
    needs_result = {sc.id for sc in tc.track.scenes if not sc.video_file}
    return {owners[owner]: row.id for owner, row in latest.items()
            if row.state in queue.ACTIVE or row.state == "ready" and not force and owners[owner] in needs_result
            or job_id is not None and row.payload.get("_video_job") == job_id and row.state in queue.FINAL}


def wait_for_inputs(ctx):
    follow = ctx.params.get("follow")
    # Prompts must be final before a paid Inflight submission.
    while follow:
        from ..models import Job
        ctx.check()
        with session_scope() as db:
            job = db.get(Job, int(follow))
            if not job or job.status not in ("queued", "running"):
                if job and job.status != "done":
                    raise JobError("Генерация промптов не завершена")
                break
        ctx.set_idle(True)
        ctx.progress(message="Ожидание промптов")
        time.sleep(1)
    ctx.set_idle(False)
    while True:
        ctx.check()
        with session_scope() as db:
            tc = load_track(db, ctx.track_id)
            planning = motion_store.planning(tc.track.motion) and runner.active_for_track(tc.track.id, {"motion"})
        if not planning:
            break
        ctx.set_idle(True)
        ctx.progress(message="Ожидание выбора моушн-сцен")
        time.sleep(1)
    ctx.set_idle(False)


def generate_scenes(ctx: JobContext, video: bool, *, first_frames=False, skip_scene_ids=None):
    if video:
        from .streaming_video import generate_videos
        return generate_videos(ctx)
    with session_scope() as db:
        both = load_track(db, ctx.track_id).settings.images.provider == "both"
    if both:
        from .hybrid_images import hybrid_images
        return hybrid_images(ctx, first_frames=first_frames, skip_scene_ids=skip_scene_ids)
    only = set(ctx.params.get("scene_ids") or [])
    retry_failed = bool(ctx.params.get("retry_failed"))
    force = bool(ctx.params.get("force")) and not ctx.params.get("missing_only") and not first_frames
    wait_for_inputs(ctx)
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        videos_on = tc.settings.videos.mode != "off" and not tc.shares_images
    if videos_on:
        from .video_prompt_jobs import ensure_routes
        ensure_routes(ctx.track_id, ctx.check, ctx.progress)  # which scenes are stills, which need a first frame
    prefix = "image"
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        if tc.shares_images:
            raise JobError("Эта версия использует видеоряд основного языка")
        skip = motion_store.motion_scene_idxs(tc.track.motion)
        targets = []
        for sc in tc.track.scenes:
            if skip_scene_ids and sc.id in skip_scene_ids:
                continue
            if sc.idx in skip or (only and sc.id not in only):
                continue
            ov = sc.overrides or {}
            if first_frames:
                if (not only and not wants_video(sc, tc.settings)) or ov.get("first_frame"):
                    continue
                if not uses_first_frame(sc, tc.settings):
                    continue
                if sc.video_file and not ctx.params.get("force"):
                    continue
            elif not only and not wants_still(sc, tc.settings):
                continue
            frame = first_frames or wants_video(sc, tc.settings) and uses_first_frame(sc, tc.settings)
            existing = scene_first_frame(sc) if frame else getattr(sc, prefix + "_file")
            if not force and existing and not (retry_failed and sc.image_status == "failed"):
                continue
            targets.append(sc.id)
        if not targets:
            return {"message": "Все выбранные сцены уже готовы"}
        known = list(tc.project.characters)
        needed_ids = {cid for sc in tc.track.scenes if sc.id in targets
                      and (tc.settings.videos.character_refs if first_frames or wants_video(sc, tc.settings)
                           else tc.settings.images.character_refs)
                      for cid in (sc.characters if sc.characters is not None else chars.mentioned(sc.prompt, known))}
        project_id = tc.project.id
    if needed_ids:
        from .character_jobs import ensure_portraits
        ensure_portraits(project_id, ctx, only=needed_ids, provider="inflight")
    with InflightClient() as client:
        ids, owners = [], {}
        with session_scope() as db:
            tc = load_track(db, ctx.track_id)
            if tc.shares_images:
                raise JobError("Эта версия использует видеоряд основного языка")
            skip = motion_store.motion_scene_idxs(tc.track.motion)
            track_id = tc.track.id
            for sc in tc.track.scenes:
                if sc.id not in targets:
                    continue
                if sc.idx in skip or (only and sc.id not in only):
                    continue
                if first_frames:
                    ov = sc.overrides or {}
                    if (not only and not wants_video(sc, tc.settings)) or ov.get("first_frame"):
                        continue
                    if not uses_first_frame(sc, tc.settings):
                        continue
                elif not only and not wants_still(sc, tc.settings):
                    continue
                frame = first_frames or wants_video(sc, tc.settings) and uses_first_frame(sc, tc.settings)
                existing = scene_first_frame(sc) if frame else getattr(sc, prefix + "_file")
                if not force and existing and not (retry_failed and sc.image_status == "failed"):
                    continue
                if not sc.prompt.strip():
                    raise JobError(f"У сцены {sc.idx + 1} нет промпта")
                mode, payload = image_payload(sc, tc, first_frame=frame)
                # One owner per scene, not per job: resume accepted IDs even after cancellation.
                rid = queue.enqueue(client, f"scene:{sc.id}:{'frame' if frame else prefix}", prefix, mode, payload, force=force, retry_failed=retry_failed)
                ids.append(rid)
                owners[rid] = sc.id
                setattr(sc, prefix + "_status", "queued")
                setattr(sc, prefix + "_error", None)
        if not ids:
            return {"message": "Все выбранные сцены уже готовы"}

        def saved(row):
            save_generation(row, owners[row.id], track_id, video=False)

        rows = queue.run(client, ids, ctx, on_ready=saved)
    failed = sum(r.state != "ready" for r in rows)
    if failed:
        raise JobError(f"Не готовы {failed}/{len(rows)} сцен. Причины — в карточках сцен и списке заданий Inflight.")
    return {"message": f"Готово {len(rows)} сцен", "task_ids": ids}


def save_generation(row, scene_id, track_id, *, video):
    prefix = "video" if video else "image"
    poster, duration = None, None
    if video and row.state == "ready":
        from ..render.footage import FootageReader
        from ..render.media import probe_duration, imwrite
        from ..storage import to_abs, to_rel
        path = to_abs(row.file)
        duration = probe_duration(path)
        reader = FootageReader(1280, 720)
        try:
            frame = reader.frame(str(path), 0, duration)
            poster = to_rel(imwrite(path.with_suffix(".poster.jpg"), frame, quality=90))
        finally:
            reader.close()
    with session_scope() as db:
        sc = db.get(Scene, scene_id)
        if not sc:
            return
        if row.state == "ready":
            setattr(sc, prefix + "_file", row.file)
            setattr(sc, prefix + "_status", "done")
            setattr(sc, prefix + "_meta", {"provider": row.provider, "task_id": row.remote_id,
                "mode": row.mode, "generated_at": time.time(), "duration": duration, "prompt_used": row.payload.get("prompt"),
                "server_mode": row.result.get("mode"), "request_audit": row.payload.get("_request_audit"),
                "director_plan": row.payload.get("_video_plan"), "inputs": row.payload.get("_source"),
                "references": row.payload.get("references", []), "poster_file": poster})
            if video and row.result.get("image_file"):
                sc.image_file, sc.image_status = row.result["image_file"], "done"
        else:
            setattr(sc, prefix + "_status", "failed")
            setattr(sc, prefix + "_error", row.error or f"Inflight: {row.state}")
        scene_changed(track_id, scene_to_dict(sc))
    track_changed(track_id, prefix + "s")



@register("videos", "footage", "Генерация видеоряда")
def videos_job(ctx: JobContext):
    return generate_scenes(ctx, True)
