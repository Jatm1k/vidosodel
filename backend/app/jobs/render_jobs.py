"""Final video render, quick preview render and YouTube metadata."""
from __future__ import annotations

import random
import shutil
import time
from typing import Any

from ..config import get_settings
from ..db import session_scope
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Project, Track
from ..pipeline import chapters as chapters_mod
from ..pipeline import llm_tasks, packaging
from ..render.engine import RESOLUTIONS, PlanScene, RenderPlan, render_video
from ..render.atmosphere import make_params as atmosphere_params
from ..render.look import random_look
from ..render.media import pick_encoder
from ..render import parallax
from ..render import chapter_cards
from ..render import accent_fx
from ..render.accents import avoid_subject, place as place_accents
from ..render.motion import EFFECTS
from ..render.subtitles import build_cues, write_ass, write_srt
from ..render.transitions import DYNAMIC, TRANSITIONS
from ..services.fastgen import FastgenClient
from ..storage import safe_filename, to_abs, to_rel, track_dir
from .common import TrackCtx, load_timings, load_track, scene_image, text_hash
from .events import track_changed
from .runner import JobContext, JobError, register, runner


def build_plan(tc: TrackCtx, *, preview: bool, start: float = 0.0, length: float | None = None,
               allow_missing: bool = False, seed: int | None = None) -> tuple[RenderPlan, int]:
    """Translate a track into a :class:`RenderPlan`. Returns the plan and the look seed."""
    track, s = tc.track, tc.settings
    if not track.audio_file or not to_abs(track.audio_file).exists():
        raise JobError("Нет озвучки: сгенерируйте её или загрузите аудиофайл.")
    scenes = list(track.scenes)
    if not scenes:
        raise JobError("Нет сцен: выполните разбивку на сцены.")
    images: list[str | None] = []
    missing = []
    for sc in scenes:
        rel = scene_image(sc)
        path = to_abs(rel) if rel else None
        if path is None or not path.exists():
            missing.append(sc.idx + 1)
            images.append(None)
        else:
            images.append(str(path))
    if missing and not allow_missing:
        raise JobError(f"Нет изображений у {len(missing)} сцен (№ {', '.join(map(str, missing[:20]))}"
                       f"{'…' if len(missing) > 20 else ''}). Сгенерируйте их или разрешите рендер с пропусками.")
    # Fill gaps with the nearest available image.
    for i in range(len(images)):
        if images[i] is None:
            images[i] = next((images[j] for j in range(i - 1, -1, -1) if images[j]), None) or \
                next((images[j] for j in range(i + 1, len(images)) if images[j]), None)
    if not any(images):
        raise JobError("Нет ни одного изображения для рендера.")

    look = random_look(s.unique, seed)
    rnd = random.Random(look.seed)
    effects = [e for e in s.render.motion_effects if e in EFFECTS] or ["zoom_in", "zoom_out"]
    transitions = [t for t in s.render.transitions if t in TRANSITIONS] or ["crossfade"]
    duration = track.audio_duration or 0.0
    plan_scenes: list[PlanScene] = []
    prev_effect = None
    for i, (sc, img) in enumerate(zip(scenes, images)):
        ov = sc.overrides or {}
        choices = [e for e in effects if e != prev_effect] or effects
        effect = ov.get("effect") or rnd.choice(choices)
        prev_effect = effect
        if i == 0:
            trans = "cut"
        elif ov.get("transition"):
            trans = ov["transition"]
        elif ((sc.source_scene if sc.source_scene_id and sc.source_scene else sc).image_meta or {}).get("continued_from"):
            trans = "crossfade"  # the same frame with a change: let the change appear smoothly
        else:
            trans = "cut" if rnd.random() < s.render.cut_ratio else rnd.choice(transitions)
            if trans != "cut" and s.render.dynamic_transitions and rnd.random() < s.render.dynamic_ratio:
                trans = rnd.choice(DYNAMIC)
        end = scenes[i + 1].start if i + 1 < len(scenes) else duration
        plan_scenes.append(PlanScene(img, 0.0 if i == 0 else sc.start, max(end, sc.start + 0.1), effect,
                                     rnd.randrange(1, 10**9), trans))

    width, height = RESOLUTIONS["540p" if preview else s.render.resolution]
    fps = 25 if preview else s.render.fps
    if preview:
        length = min(length or 30.0, max(1.0, duration - start))
    plan = RenderPlan(
        width=width, height=height, fps=fps,
        duration=length if preview else duration,
        scenes=plan_scenes, look=look.to_dict(), atmosphere=atmosphere_params(s.atmosphere, look.seed).to_dict(),
        intensity=s.render.motion_intensity,
        transition_duration=s.render.transition_duration,
        fade_in=0.0 if preview and start > 0 else s.render.fade_in,
        fade_out=s.render.fade_out, time_offset=start if preview else 0.0,
        encoder=pick_encoder(s.render.encoder), quality=s.render.quality, preview=preview,
        max_mbps=max(0, s.render.max_bitrate),
        fonts_dir=str(get_settings().fonts_dir),
        extra={"video_end": duration},
    )
    return plan, look.seed


def _render(ctx: JobContext, preview: bool) -> dict[str, Any]:
    start = float(ctx.params.get("start") or 0.0)
    length = float(ctx.params.get("length") or 30.0)
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        plan, seed = build_plan(tc, preview=preview, start=start, length=length,
                                allow_missing=bool(ctx.params.get("allow_missing")) or preview)
        s = tc.settings
        track, project = tc.track, tc.project
        work = track_dir(project.id, track.id, "render", "preview" if preview else "work")
        timings = load_timings(track)
        subs = s.subtitles
        accent_req = chapter_req = None
        cfg_ch = s.chapters
        if cfg_ch.enabled and timings and track.script.strip():
            cands = chapters_mod.candidates(timings)
            chapter_req = {"key": chapters_mod.cache_key(track.script, cands), "cands": cands,
                           "language": track.language, "llm": s.llm, "cached": track.chapters or {},
                           "meta": (track.publish_meta or {}).get("chapters") or []}
        if subs.accents and timings and track.script.strip():
            count = max(1, round((track.audio_duration or timings.duration) / 60 * subs.accents_per_minute))
            accent_req = {"key": f"v2:{text_hash(track.script)}:{count}", "count": count, "script": track.script,
                          "language": track.language, "llm": s.llm, "cached": track.text_accents or {}}
        audio = to_abs(track.audio_file)
        title = ((track.publish_meta or {}).get("titles") or [project.name])[0]
        out_name = "preview.mp4" if preview else f"{safe_filename(project.name, 'video')}_{track.language}.mp4"
        out_path = track_dir(project.id, track.id, "render") / out_name
        track_id, unique = track.id, s.unique
        loudness, workers = s.render.loudness, s.render.workers
        phrase_cuts, depth_of_field, shot_moves = s.render.phrase_cuts, s.render.depth_of_field, s.render.shot_moves
    t0 = time.time()
    accents = []
    if accent_req:
        items = _accent_items(ctx, track_id, accent_req)
        accents = place_accents(items, timings.words, plan.extra["video_end"])
    # Phrase cuts and depth maps for 3D parallax (cached, so only new images cost time).
    base = 0.0
    if any(sc.effect == "parallax" for sc in plan.scenes) or (phrase_cuts and timings):
        base = 0.08
        warning = parallax.prepare(
            plan, timings.words if timings else None, phrase_cuts=phrase_cuts, depth_of_field=depth_of_field,
            shot_moves=shot_moves,
            progress=lambda v, m: ctx.progress(v * base, m), check=ctx.check,
        )
        if warning:
            ctx.progress(base, warning, force=True)
    if chapter_req:
        items = _chapter_items(ctx, track_id, chapter_req)
        cards = chapter_cards.build_cards(
            items, timings.words, plan, duration=cfg_ch.duration, kicker=cfg_ch.kicker,
            language=chapter_req["language"], seed=seed)
        if cards:
            plan.chapter_cards = {"style": chapter_cards.pick_style(cfg_ch.style, seed, cfg_ch.pool),
                                  "variant": seed, "color": cfg_ch.color, "font": cfg_ch.font,
                                  "cards": chapter_cards.to_plan(cards)}
            # No key phrase over a chapter title.
            accents = [a for a in accents if not any(c.start - 1.0 < a.end and a.start < c.start + c.duration
                                                     for c in cards)]
    if accents:
        avoid_subject(accents, plan)  # after the depth pass: its subjects are cached by then
        accent_fx.assign_styles(accents, subs.accent_styles, seed)
        center_y = 0.3 if subs.enabled and subs.position == "middle" else 0.42
        safe_bottom = 0.74 if subs.enabled and subs.position == "bottom" else 0.86
        plan.accents_fx = {"variant": seed, "color": subs.accent_color, "font": subs.accent_font,
                           "center_y": center_y, "safe_bottom": safe_bottom, "items": accent_fx.to_plan(accents)}
    if timings and subs.enabled:
        plan.subtitles_ass = str(write_ass(timings.words, subs, plan.width, plan.height, work / "subs.ass"))
    render_video(
        plan, audio, out_path, work, workers=1 if preview else workers,
        metadata={"title": title} if not preview else None, loudness=loudness,
        audio_eq_seed=seed if unique.enabled and unique.audio_eq and not preview else None,
        strip_metadata=unique.strip_metadata, progress=lambda v, m: ctx.progress(base + v * (1 - base), m),
        should_stop=ctx.should_stop,
    )
    elapsed = time.time() - t0
    with session_scope() as db:
        t = db.get(Track, track_id)
        if preview:
            t.preview_file = to_rel(out_path)
        else:
            old = to_abs(t.video_file)
            if old and old.exists() and old != out_path:
                old.unlink(missing_ok=True)
            t.video_file = to_rel(out_path)
            t.approved_at = None  # a new cut has to be checked again
            # Export subtitles next to the video for YouTube upload.
            if timings:
                write_srt(build_cues(timings.words), out_path.with_suffix(".srt"))
            t.video_meta = {
                "seed": seed, "duration": plan.duration, "resolution": f"{plan.width}x{plan.height}",
                "fps": plan.fps, "encoder": plan.encoder, "size": out_path.stat().st_size,
                "render_seconds": round(elapsed, 1), "rendered_at": time.time(),
                "subtitles": bool(subs.enabled and timings), "accents": len(accents),
                "chapter_cards": len((plan.chapter_cards or {}).get("cards") or []), "srt": to_rel(out_path.with_suffix(".srt")) if timings else None,
            }
    if not preview:
        shutil.rmtree(work, ignore_errors=True)
    track_changed(track_id, "preview" if preview else "video")
    mins = int(elapsed // 60)
    return {"message": f"{'Превью' if preview else 'Видео'} готово за {mins} мин {int(elapsed % 60)} с"}


def _accent_items(ctx: JobContext, track_id: int, req: dict[str, Any]) -> list[dict[str, str]]:
    """Key phrases of the script: cached on the track, asked from the LLM when the script changed."""
    cached = req["cached"]
    if cached.get("key") == req["key"]:
        return cached.get("items") or []
    ctx.progress(0.0, "Подбор ключевых фраз для экрана", force=True)
    try:
        with FastgenClient() as fg:
            items = llm_tasks.text_accents(fg, req["script"], req["language"], req["count"], req["llm"])
    except Exception as e:  # text on screen is a nicety: the video renders without it
        ctx.progress(0.0, f"Ключевые фразы не подобраны: {e}", force=True)
        return cached.get("items") or []
    with session_scope() as db:
        db.get(Track, track_id).text_accents = {"key": req["key"], "items": items}
    return items


def _chapter_items(ctx: JobContext, track_id: int, req: dict[str, Any]) -> list[dict[str, Any]]:
    """Chapters with short titles for the cards: cached on the track, else asked from the LLM.

    Chapters the metadata step already put into the description are kept, only their cards are written.
    """
    items = chapters_mod.cached(req["cached"], req["key"])
    if items and all(c.get("card") for c in items):
        return items
    valid = {int(t) for t, _ in req["cands"]} | {0}
    existing = items or ([{"t": int(c["t"]), "title": c.get("title", "")} for c in req["meta"]]
                         if req["meta"] and all(int(c.get("t", -1)) in valid for c in req["meta"]) else None)
    ctx.progress(0.0, "Названия глав для заставок", force=True)
    try:
        with FastgenClient() as fg:
            items = chapters_mod.make_chapters(fg, req["cands"], req["language"], req["llm"], existing=existing)
    except Exception as e:  # the cards are a nicety: the video renders without them
        ctx.progress(0.0, f"Главы не подобраны: {e}", force=True)
        return items or []
    with session_scope() as db:
        db.get(Track, track_id).chapters = {"key": req["key"], "items": items}
    return items


@register("render", "render", "Рендер видео")
def render_job(ctx: JobContext) -> dict[str, Any]:
    return _render(ctx, preview=False)


@register("preview", "preview", "Быстрое превью")
def preview_job(ctx: JobContext) -> dict[str, Any]:
    return _render(ctx, preview=True)


# -------------------------------------------------------------------------- metadata
@register("metadata", "llm", "Метаданные для YouTube")
def metadata_job(ctx: JobContext) -> dict[str, Any]:
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        track = tc.track
        if not track.script.strip():
            raise JobError("Нет сценария")
        timings = load_timings(track)
        chapters = chapters_mod.candidates(timings)
        chapters_key = chapters_mod.cache_key(track.script, chapters)
        fixed = chapters_mod.cached(track.chapters, chapters_key)  # the video's chapter cards show these
        script, lang, llm, pub, track_id = track.script, track.language, tc.settings.llm, tc.settings.publish, track.id
        old_meta = dict(track.publish_meta or {})
        old_files = list(track.thumbnails or [])
        project_name = tc.project.name
        channel_used = _channel_thumbnails(db, tc.project)
    # Ideas that already have images are the user's to manage (new ideas / redraw buttons);
    # plain "recreate metadata" must not throw them away. A forced pipeline run asks for new ones.
    kept = llm_tasks.thumbnail_files(old_meta, old_files)
    new_ideas = bool(ctx.params.get("ideas")) or not any(c.get("file") for c in kept)
    with FastgenClient() as fg:
        ctx.progress(0.05, "Изучаю сценарий: о чём ролик и что в нём конкретного", force=True)
        brief = packaging.build_brief(fg, script, lang, llm, project_name)
        ctx.progress(0.3, "Подбираю названия: варианты, оценка, доработка лучших", force=True)
        ranked = packaging.make_titles(fg, brief, lang, llm, pub.title_variants,
                                       avoid=list(old_meta.get("titles") or []))
        titles = [r["text"] for r in ranked]
        title = _idea_title(project_name, titles)
        ctx.progress(0.7, "Описание и теги", force=True)
        meta = packaging.make_description(fg, brief, title, lang, chapters, llm, pub, script_head=script[:3000],
                                          fixed_chapters=fixed)
        meta.update({"titles": titles, "title_info": ranked, "brief": brief})
        if new_ideas and pub.thumbnail_count > 0:
            ctx.progress(0.85, "Обложки: текст, картинка и своё название к каждой", force=True)
            meta["thumbnails"] = packaging.thumbnail_concepts(
                fg, brief, script[:6000], lang, None, llm, pub, pub.thumbnail_count, title_ideas=titles,
                channel_used=channel_used)
        else:
            meta["thumbnails"] = kept
    meta["description_full"] = llm_tasks.build_description(meta, pub, lang)
    with session_scope() as db:
        t = db.get(Track, track_id)
        t.publish_meta = meta
        if fixed is None and meta.get("chapters"):  # a later render makes its cards of the same chapters
            t.chapters = {"key": chapters_key, "items": [{**c, "card": None} for c in meta["chapters"]]}
        if new_ideas:  # images of the replaced ideas
            for rel in old_files:
                p = to_abs(rel)
                if p and p.exists():
                    p.unlink(missing_ok=True)
            t.thumbnails = []
    track_changed(track_id, "metadata")
    return {"message": f"Названий: {len(meta['titles'])}, тегов: {len(meta['tags'])}, глав: {len(meta['chapters'])}, "
                       f"идей обложек: {len(meta['thumbnails'])}"}


def _channel_thumbnails(db: Session, project: Project, limit: int = 30) -> list[dict[str, Any]]:
    """Thumbnail ideas of the channel's other projects, newest first: a new video must not look like them."""
    metas = db.execute(
        select(Track.publish_meta).join(Project, Track.project_id == Project.id)
        .where(Project.channel_id == project.channel_id, Project.id != project.id)
        .order_by(Track.updated_at.desc()).limit(40)
    ).scalars()
    out: list[dict[str, Any]] = []
    for meta in metas:
        for c in (meta or {}).get("thumbnails") or []:
            if isinstance(c, dict) and (c.get("headline") or c.get("subject")):
                out.append({"headline": c.get("headline") or "", "subject": c.get("subject") or ""})
    return out[:limit]


def _idea_title(project_name: str, generated: list[str]) -> str:
    """The title the ideas are made for: the one the user typed for the project, else the best generated one."""
    return project_name.strip() or next((t for t in generated if t), "")


@register("thumbnail_ideas", "llm", "Идеи для обложек")
def thumbnail_ideas_job(ctx: JobContext) -> dict[str, Any]:
    """Thumbnail ideas.

    * ``title`` + ``append`` – several new ideas for that title, added to the existing ones (nothing is replaced);
    * ``index`` – replaces only that idea (an idea made for a chosen title keeps it, others get a new title);
    * neither – all ideas are replaced by new packages, each with its own title.
    """
    index, title = ctx.params.get("index"), str(ctx.params.get("title") or "").strip()
    append = bool(ctx.params.get("append")) and bool(title)
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        track = tc.track
        meta = dict(track.publish_meta or {})
        if not track.script.strip():
            raise JobError("Нет сценария")
        concepts = llm_tasks.thumbnail_files(meta, list(track.thumbnails or []))
        script, lang, llm, pub, track_id = track.script, track.language, tc.settings.llm, tc.settings.publish, track.id
        project_id, project_name = tc.project.id, tc.project.name
        channel_used = _channel_thumbnails(db, tc.project)
    if index is not None and not 0 <= int(index) < len(concepts):
        raise JobError("Такой идеи уже нет")
    # ``None`` – a package: the thumbnail and its own title are made together.
    target: str | None
    if append:
        target, count = title, max(1, pub.thumbnail_count)
    elif index is not None:
        idea = concepts[int(index)]
        target, count = (idea.get("title") or None) if idea.get("title_fixed") else None, 1
    else:
        target, count = None, max(1, pub.thumbnail_count)
    # Whatever was shown before (including the idea being replaced) must not come back.
    avoid = [c for c in concepts if c.get("prompt")]
    with FastgenClient() as fg:
        brief = meta.get("brief")
        if not brief or "visual_material" not in brief:  # made before briefs (or their visual material) existed
            ctx.progress(0.1, "Изучаю сценарий", force=True)
            brief = packaging.build_brief(fg, script, lang, llm, project_name)
        ctx.progress(0.4, "Придумываю текст и картинку обложки", force=True)
        fresh = packaging.thumbnail_concepts(fg, brief, script[:6000], lang, target, llm, pub, count, avoid=avoid,
                                             title_ideas=list(meta.get("titles") or []), channel_used=channel_used)
    if not fresh:
        raise JobError("Модель не предложила ни одной идеи — попробуйте ещё раз")
    removed: list[str | None] = []
    if append:
        new_indices = list(range(len(concepts), len(concepts) + len(fresh)))
        concepts = concepts + fresh
    elif index is None:
        removed = [c.get("file") for c in concepts]
        concepts, new_indices = fresh, list(range(len(fresh)))
    else:
        removed = [concepts[int(index)].get("file")]
        concepts[int(index)] = fresh[0]
        new_indices = [int(index)]
    with session_scope() as db:
        t = db.get(Track, track_id)
        t.publish_meta = {**(t.publish_meta or {}), "brief": brief, "thumbnails": concepts}
        t.thumbnails = [c["file"] for c in concepts if c.get("file")]
    for rel in removed:
        p = to_abs(rel)
        if p and p.exists():
            p.unlink(missing_ok=True)
    track_changed(track_id, "metadata")
    if ctx.params.get("draw"):
        runner.enqueue("thumbnails", project_id=project_id, track_id=track_id, params={"indices": new_indices})
    return {"message": f"Идей: {len(fresh)}"}
