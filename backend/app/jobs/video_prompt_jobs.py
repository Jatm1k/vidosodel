"""The video director: routes (which scenes are clips and how they are made) and reviewed shot plans.

No Inflight generation is submitted here. Routes are computed once per track before any image or clip is
made; shot plans are written in parallel LLM batches (the clip queue starts each scene as soon as its own
plan is stored, see :mod:`.streaming_video`).
"""
from __future__ import annotations

import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from ..db import session_scope
from ..models import Scene
from ..motion import store as motion_store
from ..pipeline import characters as chars
from ..pipeline import video_director as director
from ..pipeline.footage import wants_video, route_of
from ..pipeline.video_prompts import VERSION, Shot, signature, direct_shots, compose_video
from ..services.fastgen import FastgenClient
from ..storage import media_root
from .common import load_track, scene_to_dict
from .events import scene_changed, track_changed
from .runner import JobContext, JobError, register

_ROUTE_LOCKS: dict[int, threading.Lock] = {}
_ROUTE_GUARD = threading.Lock()
#: Parallel LLM batches of shot direction.
WORKERS = 3


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


def _route_context(tc):
    s = tc.settings
    return {"title": tc.project.name, "language": tc.track.language, "niche": s.llm.niche,
            "channel_style": s.images.style_prompt, "instructions": s.llm.prompt_instructions}


def ensure_routes(track_id: int, check=lambda: None, progress=lambda *a, **k: None) -> dict:
    """Route every scene of the track; the LLM scoring runs only when something it depends on changed."""
    with _ROUTE_GUARD:
        lock = _ROUTE_LOCKS.setdefault(track_id, threading.Lock())
    with lock:
        with session_scope() as db:
            tc = load_track(db, track_id)
            if tc.shares_images or tc.settings.videos.mode == "off":
                return {"routed": 0}
            scenes = list(tc.track.scenes)
            context = _route_context(tc)
            key = director.route_key(context, scenes, tc.settings)
            if scenes and all((s.video_plan or {}).get("route_key") == key for s in scenes):
                return {"routed": 0}
            skip = motion_store.motion_scene_idxs(tc.track.motion)
            smart = tc.settings.videos.mode == "smart"
            cached = {s.id: (s.video_plan or {}).get("score") for s in scenes}
            # Scores depend on the narration only: image prompts written later must not move clips around
            # after the image step has already decided which scenes get stills.
            score_key = signature({"context": context, "scenes": [[s.id, s.text] for s in scenes]})
            reuse = all((s.video_plan or {}).get("score_key") == score_key and cached[s.id] for s in scenes
                        if s.idx not in skip)
            listing = [{"id": s.id, "start": round(float(s.start), 1), "seconds": round(float(s.end) - float(s.start), 1),
                        "narration": s.text[:400], "visual": s.prompt[:300]} for s in scenes if s.idx not in skip]
            llm = tc.settings.llm
        scores = None
        warning = ""
        if smart:
            if reuse:
                scores = {sid: score for sid, score in cached.items() if score}
            else:
                progress(message="Режиссёр: где нужно движение", force=True)
                try:
                    with FastgenClient() as fg:
                        scores = director.score_scenes(fg, context, listing, llm, check)
                except JobError:
                    raise
                except Exception as exc:  # the routing still works, clips are spread evenly
                    if type(exc).__name__ == "JobCancelled":
                        raise
                    scores, warning = {}, f"Оценка движения не получена ({str(exc)[:160]}); клипы распределены равномерно"
        with session_scope() as db:
            tc = load_track(db, track_id)
            scenes = list(tc.track.scenes)
            if director.route_key(_route_context(tc), scenes, tc.settings) != key:
                raise JobError("Сцены изменились во время планирования видеоряда. Запустите задачу заново.")
            routes = director.route_track(scenes, list(tc.project.characters), tc.settings,
                                          motion_store.motion_scene_idxs(tc.track.motion), scores)
            for s in scenes:
                plan = dict(s.video_plan or {})
                old = plan.get("route") or {}
                route = routes.get(s.id)
                if route is not None and route.get("continue_from") and route.get("continue_from") == old.get("continue_from"):
                    if old.get("chain_frame"):
                        route["chain_frame"] = old["chain_frame"]
                plan.update(route=route, route_key=key)
                if scores is not None and s.id in scores:
                    plan.update(score=scores[s.id], score_key=score_key)
                s.video_plan = plan
                scene_changed(track_id, scene_to_dict(s))
        track_changed(track_id, "video_routes")
        return {"routed": len(routes), "warning": warning}


def screen_seconds(scene) -> float:
    return round(max(.5, float(scene.end) - float(scene.start)), 2)


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
                        "media": route_of(sc).get("media"), "manual_direction": (sc.overrides or {}).get("video_prompt", "")}
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
        route = route_of(sc)
        record = {
            "id": sc.id, "index": sc.idx, "narration": sc.text, "visual": sc.prompt,
            "mode": "multishot" if route.get("group") else mode,
            "screen_seconds": screen_seconds(sc),
            "multishot_group": route.get("group"), "shot_in_group": route.get("shot"),
            "continues_previous": bool(route.get("continue_from")),
            "first_frame": file_stamp(payload.get("first_frame")) if not route.get("continue_from") else {"path": None},
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
    """Bounded LLM requests (scenes and images); the shots of one multishot clip stay together."""
    units, by_group = [], {}
    for item in items:
        group = item["record"].get("multishot_group")
        if group:
            if group not in by_group:
                by_group[group] = []
                units.append(by_group[group])
            by_group[group].append(item)
        else:
            units.append([item])
    batch, image_count = [], 0
    for unit in units:
        count = sum(sum(bool(p.get("path")) and not p.get("missing", False)
                        for p in [i["record"]["first_frame"], *i["record"]["references"]]) for i in unit)
        if batch and (len(batch) + len(unit) > 6 or image_count + count > 12):
            yield batch
            batch, image_count = [], 0
        batch.extend(unit)
        image_count += count
    if batch:
        yield batch


def ensure_video_prompts(ctx: JobContext, *, scene_ids=None, force=False, on_written=None):
    """Direct every clip lacking a valid plan; ``on_written(ids)`` reports scenes whose plan is ready
    (immediately for valid cached plans and manual prompts)."""
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        if tc.shares_images:
            raise JobError("Промпты видеоряда создаются в основном языке")
        context, records = inputs(tc, scene_ids)
        llm, settings, track_id = tc.settings.llm, tc.settings, tc.track.id
        wanted = {sc.id for sc in tc.track.scenes if (scene_ids is None and wants_video(sc, settings)) or
                  (scene_ids is not None and sc.id in scene_ids)}
    pending = [r for r in records if force or not cached_plan_valid(r)]
    pending_ids = {r["record"]["id"] for r in pending}
    if on_written:
        on_written(wanted - pending_ids)
    if not pending:
        return {"message": "Режиссура актуальна; ручные промпты сохранены", "written": 0}
    written = 0
    lock = threading.Lock()

    def direct(batch):
        ctx.check()
        current_ids = {r["record"]["id"] for r in batch}
        neighbors = [r["cached"]["shot"] for r in records
                     if r["record"]["id"] not in current_ids and cached_plan_valid(r)][-6:]
        production = {**context, "existing_directed_shots": neighbors}
        try:
            with FastgenClient() as fg:
                shots = direct_shots(fg, production, [r["record"] for r in batch], llm, ctx.check, previews(batch))
            compiled = {r["record"]["id"]: compose_video(
                "t2v" if r["record"]["mode"] == "multishot" else r["record"]["mode"], settings,
                shot=shots[r["record"]["id"]], notes=r["record"]["reference_roles"],
                screen=r["record"]["screen_seconds"], continued=r["record"]["continues_previous"]) for r in batch}
        except ValueError as exc:
            raise JobError(str(exc)) from exc
        ctx.check()
        with session_scope() as db:
            fresh = load_track(db, track_id)
            _, fresh_inputs = inputs(fresh, current_ids)
            keys = {r["record"]["id"]: r["key"] for r in fresh_inputs}
            if any(keys.get(i["record"]["id"]) != i["key"] for i in batch):
                raise JobError("Сцены или настройки изменились во время написания видеопромптов. Запустите задачу заново.")
            for item in batch:
                sid = item["record"]["id"]
                scene = db.get(Scene, sid)
                scene.video_plan = {**(scene.video_plan or {}), "key": item["key"], "version": VERSION,
                    "shot": shots[sid], "prompt": compiled[sid], "mode": item["record"]["mode"], "model": llm.model,
                    "reviewed": True, "updated_at": time.time()}
                item["cached"] = scene.video_plan
                scene_changed(track_id, scene_to_dict(scene))
        return current_ids

    batches = list(prompt_batches(pending))
    ctx.progress(0, f"Режиссура и проверка видеопромптов: 0/{len(pending)}", force=True)
    errors = []
    with ThreadPoolExecutor(max_workers=min(WORKERS, len(batches))) as pool:
        futures = [pool.submit(direct, b) for b in batches]  # scene order: the opening is directed first
        for future in as_completed(futures):
            try:
                done = future.result()
            except Exception as exc:
                errors.append(exc)
                if type(exc).__name__ == "JobCancelled":
                    for f in futures:
                        f.cancel()
                continue
            with lock:
                written += len(done)
            if on_written:
                on_written(done)
            ctx.progress(written / len(pending), f"Режиссура и проверка видеопромптов: {written}/{len(pending)}")
    track_changed(track_id, "video_prompts")
    if errors:
        raise errors[0]
    return {"message": f"Написано и проверено видеопромптов: {written}", "written": written}


@register("video_prompts", "footage", "Режиссура и промпты клипов")
def video_prompts_job(ctx: JobContext):
    ensure_routes(ctx.track_id, ctx.check, ctx.progress)
    return ensure_video_prompts(ctx, scene_ids=set(ctx.params.get("scene_ids") or []) or None,
                                force=bool(ctx.params.get("force")))
