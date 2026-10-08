"""Final video render, quick preview render and YouTube metadata."""
from __future__ import annotations

import random
import shutil
import time
from typing import Any

from ..config import get_settings
from ..db import session_scope
from ..models import Track
from ..pipeline import llm_tasks
from ..render.engine import RESOLUTIONS, PlanScene, RenderPlan, render_video
from ..render.look import random_look
from ..render.media import pick_encoder
from ..render.motion import EFFECTS
from ..render.subtitles import build_cues, write_ass, write_srt
from ..render.transitions import TRANSITIONS
from ..services.fastgen import FastgenClient
from ..storage import safe_filename, to_abs, to_rel, track_dir
from .common import TrackCtx, load_timings, load_track, scene_image
from .events import track_changed
from .runner import JobContext, JobError, register


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
        else:
            trans = "cut" if rnd.random() < s.render.cut_ratio else rnd.choice(transitions)
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
        scenes=plan_scenes, look=look.to_dict(), intensity=s.render.motion_intensity,
        transition_duration=s.render.transition_duration,
        fade_in=0.0 if preview and start > 0 else s.render.fade_in,
        fade_out=s.render.fade_out, time_offset=start if preview else 0.0,
        encoder=pick_encoder(s.render.encoder), quality=s.render.quality, preview=preview,
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
        if s.subtitles.enabled and timings:
            plan.subtitles_ass = str(write_ass(timings.words, s.subtitles, plan.width, plan.height, work / "subs.ass"))
        audio = to_abs(track.audio_file)
        title = ((track.publish_meta or {}).get("titles") or [project.name])[0]
        out_name = "preview.mp4" if preview else f"{safe_filename(project.name, 'video')}_{track.language}.mp4"
        out_path = track_dir(project.id, track.id, "render") / out_name
        track_id, unique = track.id, s.unique
        loudness, workers = s.render.loudness, s.render.workers
    t0 = time.time()
    render_video(
        plan, audio, out_path, work, workers=1 if preview else workers,
        metadata={"title": title} if not preview else None, loudness=loudness,
        audio_eq_seed=seed if unique.enabled and unique.audio_eq and not preview else None,
        strip_metadata=unique.strip_metadata, progress=ctx.progress,
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
                "subtitles": bool(plan.subtitles_ass), "srt": to_rel(out_path.with_suffix(".srt")) if timings else None,
            }
    if not preview:
        shutil.rmtree(work, ignore_errors=True)
    track_changed(track_id, "preview" if preview else "video")
    mins = int(elapsed // 60)
    return {"message": f"{'Превью' if preview else 'Видео'} готово за {mins} мин {int(elapsed % 60)} с"}


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
        chapters: list[tuple[float, str]] = []
        if timings and timings.words:
            seen: set[int] = set()
            for i, w in enumerate(timings.words):
                if w.p not in seen and w.p >= 0:
                    seen.add(w.p)
                    chapters.append((0.0 if not chapters else w.s,
                                     " ".join(x.w for x in timings.words[i:i + 25])))
            if len(chapters) < 4:  # no paragraphs – candidates every ~45 s
                chapters, last = [], -999.0
                for i, w in enumerate(timings.words):
                    if w.s - last >= 45:
                        chapters.append((0.0 if not chapters else w.s, " ".join(x.w for x in timings.words[i:i + 25])))
                        last = w.s
        script, lang, llm, pub, track_id = track.script, track.language, tc.settings.llm, tc.settings.publish, track.id
    with FastgenClient() as fg:
        ctx.progress(0.1, "Генерация названия, описания и тегов", force=True)
        meta = llm_tasks.publish_metadata(fg, script, lang, chapters, llm, pub)
    meta["description_full"] = llm_tasks.build_description(meta, pub)
    with session_scope() as db:
        db.get(Track, track_id).publish_meta = meta
    track_changed(track_id, "metadata")
    return {"message": f"Названий: {len(meta['titles'])}, тегов: {len(meta['tags'])}, глав: {len(meta['chapters'])}"}
