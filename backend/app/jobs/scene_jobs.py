"""Scene splitting, visual bible and image prompt jobs."""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import delete

from ..db import session_scope
from ..models import Project, Scene, Track
from ..pipeline import llm_tasks
from ..pipeline.align import align_scenes
from ..pipeline.scenes import split_auto, split_smart
from ..pipeline.timings import estimate
from ..services.fastgen import FastgenClient
from ..settings_schema import effective_settings
from .common import load_timings, load_track, master_track, scene_to_dict
from .events import scene_changed, track_changed
from .runner import JobContext, JobError, register
from .voice import apply_timings

log = logging.getLogger(__name__)


@register("scenes", "llm", "Разбивка на сцены")
def scenes_job(ctx: JobContext) -> dict[str, Any]:
    mode_override = ctx.params.get("mode")
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        track = tc.track
        timings = load_timings(track)
        if timings is None:
            if not track.script.strip():
                raise JobError("Нет ни таймингов, ни сценария. Добавьте сценарий, озвучку или SRT.")
            # No audio yet: plan scenes on estimated timings; they are re-timed after voice-over.
            timings = estimate(track.script, track.language)
            apply_timings(db, track, timings)
        track_id, cfg, llm = track.id, tc.settings.scenes, tc.settings.llm

        if tc.shares_images:
            master = master_track(db, tc.project)
            master_t = load_timings(master) if master else None
            if master is None or master_t is None or not master.scenes:
                raise JobError("В режиме общих картинок сначала разбейте на сцены основной язык "
                               f"({master.language.upper() if master else '—'}).")
            aligned = align_scenes(master_t, [(s.id, s.start, s.end) for s in master.scenes], timings)
            db.execute(delete(Scene).where(Scene.track_id == track_id))
            for i, a in enumerate(aligned):
                db.add(Scene(track_id=track_id, idx=i, start=a.start, end=a.end, text=a.text,
                             source_scene_id=a.source_scene_id, image_status="done"))
            count = len(aligned)
            track_changed(track_id, "scenes")
            return {"message": f"Сцены сопоставлены с основным языком: {count}"}

    mode = mode_override or cfg.mode
    if mode == "smart":
        with FastgenClient() as fg:
            specs = split_smart(timings, cfg, llm, fg.chat_json,
                                progress=lambda v: ctx.progress(v * 0.95, "Смысловая разбивка (LLM)"))
    else:
        specs = split_auto(timings, cfg)
    if not specs:
        raise JobError("Не удалось выделить сцены: в таймингах нет слов")
    with session_scope() as db:
        db.execute(delete(Scene).where(Scene.track_id == track_id))
        for i, sp in enumerate(specs):
            db.add(Scene(track_id=track_id, idx=i, start=sp.start, end=sp.end, text=sp.text))
        # Tracks that borrow images from this one must be re-aligned.
        track = db.get(Track, track_id)
        project = track.project
        if project.image_mode == "shared" and project.master_track_id in (None, track_id):
            for other in project.tracks:
                if other.id != track_id:
                    db.execute(delete(Scene).where(Scene.track_id == other.id))
    track_changed(track_id, "scenes")
    durs = [s.end - s.start for s in specs]
    return {"message": f"Сцен: {len(specs)}, средняя длительность {sum(durs) / len(durs):.1f} с"}


# --------------------------------------------------------------------- visual bible
def ensure_bible(project_id: int, fg: FastgenClient, *, force: bool = False) -> str:
    with session_scope() as db:
        project = db.get(Project, project_id)
        if project.visual_context.strip() and not force:
            return project.visual_context
        master = master_track(db, project)
        script = master.script if master else ""
        s = effective_settings(project.channel.settings, project.settings)
    if not script.strip():
        return ""
    bible = llm_tasks.visual_bible(fg, script, s.llm, s.images)
    with session_scope() as db:
        db.get(Project, project_id).visual_context = bible
    return bible


@register("bible", "llm", "Визуальная библия проекта")
def bible_job(ctx: JobContext) -> dict[str, Any]:
    with FastgenClient() as fg:
        ensure_bible(ctx.project_id, fg, force=True)
    return {"message": "Визуальная библия обновлена"}


# -------------------------------------------------------------------------- prompts
@register("prompts", "llm", "Промпты для изображений")
def prompts_job(ctx: JobContext) -> dict[str, Any]:
    only_ids = set(ctx.params.get("scene_ids") or [])
    overwrite = bool(ctx.params.get("overwrite"))
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        if tc.shares_images:
            raise JobError("Этот язык использует картинки основного языка — промпты создаются там.")
        targets = [
            (s.id, s.text) for s in tc.track.scenes
            if (s.id in only_ids) or (not only_ids and (not s.prompt.strip() or (overwrite and not s.prompt_locked)))
        ]
        llm, project_id, track_id = tc.settings.llm, tc.project.id, tc.track.id
    if not targets:
        return {"message": "Все сцены уже имеют промпты"}
    with FastgenClient() as fg:
        ctx.progress(0.02, "Визуальная библия проекта", force=True)
        bible = ensure_bible(project_id, fg)

        def save(batch: dict[int, str]) -> None:
            with session_scope() as db:
                for sid, prompt in batch.items():
                    sc = db.get(Scene, sid)
                    if sc is None:
                        continue
                    sc.prompt = prompt
                    if sid in only_ids:
                        sc.prompt_locked = False
                    scene_changed(track_id, scene_to_dict(sc))

        got = llm_tasks.scene_prompts(
            fg, targets, bible=bible, llm=llm,
            progress=lambda v: ctx.progress(0.05 + 0.95 * v, f"Промпты: {int(v * len(targets))}/{len(targets)}"),
            should_stop=ctx.should_stop, on_batch=save,
        )
    missing = len(targets) - len(got)
    if missing and not got:
        raise JobError("LLM не вернул промпты. Попробуйте ещё раз или смените модель в настройках канала.")
    return {"message": f"Промптов создано: {len(got)}" + (f", пропущено: {missing}" if missing else "")}
