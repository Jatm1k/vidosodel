"""Persisted, reviewed shot plans. No Inflight generation is submitted by this job."""
from __future__ import annotations

import time

from ..db import session_scope
from ..models import Scene
from ..motion import store as motion_store
from ..pipeline import characters as chars
from ..pipeline.footage import wants_video
from ..pipeline.video_prompts import VERSION, Shot, signature, direct_shots, compose_video
from ..services.fastgen import FastgenClient
from ..storage import media_root
from .common import load_track, scene_to_dict
from .events import scene_changed, track_changed
from .runner import JobContext, JobError, register


def file_stamp(rel):
    root = media_root().resolve()
    path = (root / rel).resolve() if rel else None
    if path and root not in path.parents:
        raise JobError("Референс находится вне медиатеки приложения")
    if path and path.is_file():
        stat = path.stat()
        return {"path": rel, "size": stat.st_size, "modified": stat.st_mtime_ns}
    return {"path": rel, "missing": True}


def cached_plan_valid(item):
    cache = item["cached"]
    if cache.get("key") != item["key"] or not cache.get("reviewed"):
        return False
    try:
        Shot.model_validate(cache.get("shot"))
        return True
    except ValueError:
        return False


def inputs(tc, scene_ids=None):
    from .footage_jobs import scene_payload
    settings, track = tc.settings, tc.track
    context = {
        "version": VERSION, "title": tc.project.name, "language": track.language,
        "niche": settings.llm.niche, "visual_bible": tc.project.visual_context,
        "channel_style": settings.images.style_prompt, "avoid": settings.images.avoid,
        "direction": settings.videos.direction, "instructions": settings.llm.prompt_instructions,
        "aspect_ratio": settings.videos.aspect_ratio,
        "narrative_context": track.script[:16000] + ("\n…\n" + track.script[-4000:] if len(track.script) > 16000 else ""),
        "storyboard": [{"id": sc.id, "index": sc.idx, "narration": sc.text[:500], "visual": sc.prompt[:500],
                        "manual_direction": (sc.overrides or {}).get("video_prompt", "")}
                       for sc in track.scenes],
        "cast": [{"id": c.id, "name": c.name, "description": c.description, "kind": c.kind}
                 for c in tc.project.characters],
    }
    fingerprint = signature({"context": context, "script": track.script, "model": settings.llm.model})
    skip = motion_store.motion_scene_idxs(track.motion)
    records = []
    ordered = list(track.scenes)
    for position, sc in enumerate(ordered):
        if sc.idx in skip or (scene_ids is not None and sc.id not in scene_ids):
            continue
        if scene_ids is None and not wants_video(sc, settings):
            continue
        if str((sc.overrides or {}).get("video_prompt") or "").strip():
            continue  # the user's own direction is authoritative, never rewritten by the LLM
        if not sc.prompt.strip():
            raise JobError(f"Сначала создайте промпт кадра сцены {sc.idx + 1}")
        mode, payload = scene_payload(sc, tc, True, for_planning=True)
        known = list(tc.project.characters)
        ids = sc.characters if sc.characters is not None else chars.mentioned(sc.prompt, known)
        record = {
            "id": sc.id, "index": sc.idx, "narration": sc.text, "visual": sc.prompt, "mode": mode,
            "first_frame": file_stamp(payload.get("first_frame")),
            "references": [{"name": r["name"], **file_stamp(r["path"])} for r in payload.get("references", [])],
            "reference_roles": payload.get("_reference_notes", ""),
            "cast": [c for c in context["cast"] if c["id"] in ids],
            "previous": ordered[position-1].prompt if position else None,
            "next": ordered[position+1].prompt if position + 1 < len(ordered) else None,
            "continuity": sc.continuity,
        }
        key = signature({"production": fingerprint, "scene": record})
        records.append({"record": record, "key": key, "cached": sc.video_plan or {}})
    return context, records


def previews(records):
    from .image_jobs import image_data_uri
    content = []
    for item in records:
        record = item["record"]
        first = record["first_frame"].get("path")
        pictures = [("FIRST FRAME", first)] if first else []
        pictures += [(r["name"], r.get("path")) for r in record["references"]]
        for label, rel in pictures:
            uri = image_data_uri(rel, 640) if rel else None
            if uri:
                content += [{"type": "text", "text": f"Scene {record['id']}: {label}"},
                            {"type": "image_url", "image_url": {"url": uri}}]
    return content


def prompt_batches(items):
    """Keep all visual references while bounding the number of images in one LLM request."""
    batch, image_count = [], 0
    for item in items:
        record = item["record"]
        pictures = [record["first_frame"], *record["references"]]
        count = sum(bool(p.get("path")) and not p.get("missing", False) for p in pictures)
        if batch and (len(batch) >= 6 or image_count + count > 12):
            yield batch
            batch, image_count = [], 0
        batch.append(item)
        image_count += count
    if batch:
        yield batch


def ensure_video_prompts(ctx: JobContext, *, scene_ids=None, force=False):
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        if tc.shares_images:
            raise JobError("Промпты видеоряда создаются в основном языке")
        context, records = inputs(tc, scene_ids)
        llm, settings, track_id = tc.settings.llm, tc.settings, tc.track.id
    pending = [r for r in records if force or not cached_plan_valid(r)]
    if not pending:
        return {"message": "Режиссура актуальна; ручные промпты сохранены", "written": 0}
    written = 0
    with FastgenClient() as fg:
        for batch in prompt_batches(pending):
            ctx.check()
            ctx.progress(written / len(pending), f"Режиссура и проверка видеопромптов: {written}/{len(pending)}", force=True)
            current_ids = {r["record"]["id"] for r in batch}
            neighbors = [r["cached"]["shot"] for r in records
                         if r["record"]["id"] not in current_ids and cached_plan_valid(r)][-6:]
            production = {**context, "existing_directed_shots": neighbors}
            try:
                shots = direct_shots(fg, production, [r["record"] for r in batch], llm, ctx.check, previews(batch))
                compiled = {r["record"]["id"]: compose_video(r["record"]["mode"], settings,
                    shot=shots[r["record"]["id"]], notes=r["record"]["reference_roles"]) for r in batch}
            except ValueError as exc:
                raise JobError(str(exc)) from exc
            ctx.check()
            with session_scope() as db:
                fresh = load_track(db, track_id)
                _, fresh_inputs = inputs(fresh, {r["record"]["id"] for r in batch})
                keys = {r["record"]["id"]: r["key"] for r in fresh_inputs}
                for item in batch:
                    sid = item["record"]["id"]
                    if keys.get(sid) != item["key"]:
                        raise JobError("Сцены или настройки изменились во время написания видеопромптов. Запустите задачу заново.")
                for item in batch:
                    sid = item["record"]["id"]
                    scene = db.get(Scene, sid)
                    scene.video_plan = {"key": item["key"], "version": VERSION, "shot": shots[sid],
                        "prompt": compiled[sid], "mode": item["record"]["mode"], "model": llm.model,
                        "reviewed": True, "updated_at": time.time()}
                    item["cached"] = scene.video_plan
                    written += 1
                    scene_changed(track_id, scene_to_dict(scene))
            track_changed(track_id, "video_prompts")
    return {"message": f"Написано и проверено видеопромптов: {written}", "written": written}


@register("video_prompts", "footage", "Режиссура и промпты клипов")
def video_prompts_job(ctx: JobContext):
    return ensure_video_prompts(ctx, scene_ids=set(ctx.params.get("scene_ids") or []) or None,
                                force=bool(ctx.params.get("force")))
