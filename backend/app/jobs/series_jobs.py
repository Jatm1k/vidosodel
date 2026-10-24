"""Series jobs: reference images, voicing screenplay blocks, music/sfx and assembling an episode.

All of them are resumable like the other jobs: a block or cue that already has
audio for its current content is skipped, a Lumean order that was running when
the app stopped is re-attached by the id saved in the block/cue meta.
"""
from __future__ import annotations

import hashlib
import json
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from sqlalchemy import delete

from ..config import ffmpeg_bin
from ..db import session_scope
from ..models import Channel, EpisodeBlock, Project, Scene, Series, SeriesCharacter, SeriesLocation, SoundCue, Track
from ..pipeline import episode as ep
from ..pipeline.timings import Timings
from ..render.media import probe_duration, run
from ..services.fastgen import FastgenClient, file_to_data_uri
from ..services.gemini_tts import GeminiTts, QuotaExhausted
from ..services.http import ApiError
from ..services.lumean import TERMINAL_FAIL, TERMINAL_OK, LumeanClient, pick_service_file
from ..settings_schema import effective_settings
from ..storage import to_abs, to_rel, track_dir
from .events import track_changed
from .image_jobs import generate_one
from .runner import JobContext, JobError, register
from .voice import apply_timings, voice_config_override

log = logging.getLogger(__name__)


def _notify(series_id: int | None, what: str, project_id: int | None = None) -> None:
    from ..series_ops import notify  # noqa: PLC0415 – series_ops imports the job runner

    notify(series_id, what, project_id)


# ===================================================================== reference images
def ref_prompt(kind: str, obj: SeriesCharacter | SeriesLocation) -> str:
    desc = " ".join((obj.description or obj.name).split())
    if kind == "character":
        return (f"Character reference sheet of one person: {desc}. On the left a full-body view standing "
                "straight, facing the camera; on the right a large close-up of the face. The same person and "
                "clothes in both views, neutral expression, plain light grey background, even soft lighting.")
    return (f"Establishing wide shot of a location: {desc}. Show the whole place clearly with its "
            "characteristic architecture, layout and details; no people.")


@register("series_refs", "characters", "Референсы сериала")
def series_refs_job(ctx: JobContext) -> dict[str, Any]:
    """Draw reference images of series characters/locations.

    Params: ``series_id``; ``character_ids``/``location_ids`` – draw these (again, even
    when they have an image); both empty – every one without an image;
    ``prompts`` – ``{"character:<id>": "...", "location:<id>": "..."}`` own prompts.
    """
    from ..series_ops import resync_episodes, series_dir  # noqa: PLC0415

    series_id = ctx.params.get("series_id")
    char_ids = set(ctx.params.get("character_ids") or [])
    loc_ids = set(ctx.params.get("location_ids") or [])
    explicit = bool(char_ids or loc_ids)
    custom = ctx.params.get("prompts") or {}
    with session_scope() as db:
        series = db.get(Series, series_id)
        if series is None:
            raise JobError("Сериал не найден (возможно, удалён)")
        channel = db.get(Channel, series.channel_id)
        s = effective_settings(channel.settings if channel else {})
        if series.visual_style.strip():
            s.images.style_prompt = series.visual_style.strip()
        targets: list[tuple[str, int, str]] = []
        for kind, items, ids in (("character", series.characters, char_ids), ("location", series.locations, loc_ids)):
            for obj in items:
                if (obj.id not in ids) if explicit else bool(obj.image_file):
                    continue
                prompt = str(custom.get(f"{kind}:{obj.id}") or "").strip() or ref_prompt(kind, obj)
                targets.append((kind, obj.id, prompt))
                obj.image_status, obj.image_error = "generating", None
    if not targets:
        return {"message": "Все референсы уже есть"}
    _notify(series_id, "refs")
    images = s.images.model_copy(update={"upscale_2x": False})
    out_dir = series_dir(series_id, "refs")
    result = {"done": 0, "failed": 0}
    lock = threading.Lock()
    model = {"character": SeriesCharacter, "location": SeriesLocation}

    def draw(kind: str, obj_id: int, prompt: str) -> None:
        try:
            with FastgenClient() as fg:
                path, _meta = generate_one(fg, prompt, out_dir, f"{kind}_{obj_id}", images, s.llm, [], ctx,
                                           operation=images.character_operation)
            with session_scope() as db:
                obj = db.get(model[kind], obj_id)
                if obj is None:
                    path.unlink(missing_ok=True)
                    return
                old = to_abs(obj.image_file)
                obj.image_file, obj.image_status, obj.image_error, obj.image_origin = to_rel(path), "done", None, "generated"
            if old and old.exists() and old != path:
                old.unlink(missing_ok=True)
            with lock:
                result["done"] += 1
        except Exception as exc:  # noqa: BLE001 – one failed image must not stop the others
            with session_scope() as db:
                obj = db.get(model[kind], obj_id)
                if obj:
                    obj.image_status = "done" if obj.image_file else "failed"
                    obj.image_error = str(exc)[:500]
            with lock:
                result["failed"] += 1
            if ctx.should_stop():
                raise
        finally:
            _notify(series_id, "refs")

    ctx.progress(0.1, f"Референсы: {len(targets)}", force=True)
    with ThreadPoolExecutor(max_workers=min(3, len(targets))) as pool:
        list(pool.map(lambda t: draw(*t), targets))
    with session_scope() as db:
        series = db.get(Series, series_id)
        if series:
            resync_episodes(db, series)
    if result["failed"] and not result["done"]:
        raise JobError(f"Не удалось нарисовать референсы ({result['failed']}). Подробности — в карточках.")
    msg = f"Референсов готово: {result['done']}"
    if result["failed"]:
        msg += f", ошибок: {result['failed']}"
    return {"message": msg}


# ===================================================================== voicing blocks
def _wait_order(lm: LumeanClient, order_id: str, ctx: JobContext, label: str) -> dict[str, Any]:
    while True:
        if ctx.should_stop():
            try:
                lm.cancel_order(order_id)
            except ApiError:
                pass
            raise InterruptedError()
        order = lm.order(order_id)
        status = order["status"]
        if status in TERMINAL_OK:
            return order
        if status in TERMINAL_FAIL:
            raise JobError(f"Lumean: {label} — заказ завершился со статусом «{status}»")
        if status == "partially_completed":
            items = lm.order_items(order_id)
            if not any(i["status"] in ("pending", "processing") for i in items):
                if any(i["status"] == "policy_flagged" for i in items):
                    raise JobError(f"Lumean отклонил {label} по контентной политике — перефразируйте")
                failed = [i for i in items if i["status"] == "failed" and i.get("can_retry")]
                if failed:
                    lm.retry_failed_items(order_id)
                else:
                    raise JobError(f"Lumean: {label} не озвучен")
        time.sleep(4)


def _set_block(block_id: int, **fields: Any) -> None:
    with session_scope() as db:
        b = db.get(EpisodeBlock, block_id)
        if b is None:
            return
        meta = fields.pop("meta", None)
        for k, v in fields.items():
            setattr(b, k, v)
        if meta is not None:
            b.audio_meta = {**(b.audio_meta or {}), **meta}


def _lumean_clip(ctx: JobContext, block_id: int, digest: str, template_id: str, text: str,
                 override: dict[str, Any], raw_dir: Path) -> tuple[Path, list[list[Any]], dict[str, Any]]:
    """Voice one block in Lumean; returns the raw audio, its word timings and meta."""
    with session_scope() as db:
        b = db.get(EpisodeBlock, block_id)
        meta = dict(b.audio_meta or {}) if b else {}
    order_id = meta.get("order_id") if meta.get("order_hash") == digest else None
    name = f"vidosodel block #{block_id} {digest[:8]}"
    with LumeanClient() as lm:
        if order_id:
            try:
                order = lm.order(order_id)
                if order["status"] in TERMINAL_FAIL or order.get("files_expired"):
                    order_id = None
            except ApiError:
                order_id = None
        if not order_id:
            order = lm.create_tts_order(template_id, text, name, override)
            order_id = order["id"]
            _set_block(block_id, meta={"order_id": order_id, "order_hash": digest})
        order = _wait_order(lm, order_id, ctx, f"блок #{block_id}")
        files = (order.get("result") or {}).get("files") or []
        if not files:
            raise JobError(f"Lumean не вернул аудио блока #{block_id}")
        raw = raw_dir / f"block_{block_id}_{digest[:8]}{Path(files[0]).suffix or '.mp3'}"
        lm.download(files[0], raw)
        words: list[list[Any]] = []
        rj = pick_service_file(order, "result.json")
        if rj:
            tmp = raw.with_suffix(".json")
            lm.download(rj, tmp)
            data = json.loads(tmp.read_text(encoding="utf-8"))
            tmp.unlink(missing_ok=True)
            words = [[w["word"], float(w["start"]), float(w["end"])] for w in data.get("words", []) if w.get("word")]
    return raw, words, {"provider": "lumean", "template_id": template_id, "order_id": order_id,
                        "cost": order.get("price_formatted")}


def _plan_blocks(project_id: int, only: set[int], force: bool) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Blocks to voice now with everything needed to voice them outside the session."""
    from ..series_ops import narrator_template  # noqa: PLC0415

    with session_scope() as db:
        project = db.get(Project, project_id)
        series = db.get(Series, project.series_id) if project else None
        if series is None:
            raise JobError("Серия не найдена (возможно, удалена)")
        opts = ep.series_options(series)
        narrator = narrator_template(db, series) or ""
        chars = {c.id: c for c in series.characters}
        tasks = []
        for b in project.blocks:
            if not ep.needs_voice(b) or (only and b.id not in only):
                continue
            character = chars.get(b.character_id) if b.character_id else None
            digest = ep.block_hash(b, character, narrator, opts)
            fresh = b.audio_status == "done" and b.audio_hash == digest and b.audio_file and to_abs(b.audio_file).exists()
            if fresh and not (force and only):
                continue
            voice = ep.voice_of(character)
            if b.kind == "narration":
                if not narrator:
                    raise JobError("Не выбран голос диктора: укажите шаблон Lumean в настройках сериала "
                                   "или голос канала для языка сериала.")
                provider, template = "lumean", narrator
                override = voice_config_override(series.language, opts.narrator_speed, False)
            else:
                provider, template = voice["provider"], voice["template_id"]
                override = voice_config_override(series.language, None, False)
            tasks.append({
                "id": b.id, "digest": digest, "kind": b.kind, "text": b.text.strip(), "provider": provider,
                "template": template, "override": override, "voice": voice["voice"],
                "fallback": voice["template_id"],
                "prompt": ep.line_prompt(b.text, b.direction, character, series.language, opts.line_style)
                if b.kind == "line" else "",
            })
            b.audio_status, b.audio_error = "queued", None
        info = {"series_id": series.id, "language": series.language}
    return tasks, info


def voice_blocks(ctx: JobContext, project_id: int, track_id: int, *, only: set[int], force: bool,
                 share: tuple[float, float] = (0.0, 1.0)) -> dict[str, int]:
    """Voice the blocks that need it: Lumean orders in parallel, Gemini requests one by one."""
    from ..settings_store import load_config  # noqa: PLC0415

    tasks, info = _plan_blocks(project_id, only, force)
    series_id = info["series_id"]
    if not tasks:
        return {"done": 0, "failed": 0, "total": 0}
    _notify(series_id, "blocks", project_id)
    clips = track_dir(project_id, track_id, "blocks")
    raw_dir = track_dir(project_id, track_id, "blocks", "raw")
    stats = {"done": 0, "failed": 0, "total": len(tasks)}
    lock = threading.Lock()
    quota = {"out": False}
    errors: list[str] = []

    def report() -> None:
        n = stats["done"] + stats["failed"]
        ctx.progress(share[0] + (share[1] - share[0]) * n / len(tasks), f"Озвучка блоков: {n}/{len(tasks)}")

    def one(t: dict[str, Any]) -> None:
        bid, digest = t["id"], t["digest"]
        _set_block(bid, audio_status="generating")
        _notify(series_id, "blocks", project_id)
        try:
            ctx.check()
            warning = None
            provider = t["provider"]
            if provider == "gemini" and quota["out"]:
                if not t["fallback"]:
                    raise JobError("закончились запросы Gemini на сегодня, а запасного голоса Lumean у персонажа нет")
                provider = "lumean_fallback"
            if provider == "gemini":
                raw = raw_dir / f"block_{bid}_{digest[:8]}.wav"
                try:
                    with GeminiTts() as g:
                        meta = g.synthesize(t["prompt"], t["voice"], raw, should_stop=ctx.should_stop)
                    words = None
                except QuotaExhausted:
                    quota["out"] = True
                    if not t["fallback"]:
                        raise
                    provider = "lumean_fallback"
            if provider in ("lumean", "lumean_fallback"):
                template = t["template"] if provider == "lumean" else t["fallback"]
                raw, words, meta = _lumean_clip(ctx, bid, digest, template, t["text"], t["override"], raw_dir)
                if provider == "lumean_fallback":
                    meta["fallback"] = True
                    warning = "Озвучено запасным голосом Lumean: у Gemini закончились запросы на сегодня"
            dest = clips / f"block_{bid}_{digest[:8]}.wav"
            dur, words, _head = ep.process_clip(raw, dest, words)
            raw.unlink(missing_ok=True)
            if meta.get("provider") == "gemini":
                words = ep.spread_words(t["text"], dur)
                if dur > ep.estimate_seconds(t["text"]) * 2.3 + 2:
                    warning = ("Реплика намного длиннее ожидаемого — возможно, модель прочитала служебные "
                               "пометки. Проверьте (transcribe_block) и переозвучьте при необходимости.")
            with session_scope() as db:
                b = db.get(EpisodeBlock, bid)
                if b is None:
                    dest.unlink(missing_ok=True)
                    return
                old = to_abs(b.audio_file)
                b.audio_file, b.audio_duration, b.audio_hash = to_rel(dest), round(dur, 3), digest
                b.audio_status, b.audio_error = "done", None
                b.audio_meta = {**{k: v for k, v in (b.audio_meta or {}).items() if k in ("order_id", "order_hash")},
                                **meta, "words": words, "warning": warning, "voiced_at": time.time()}
            if old and old.exists() and old != dest:
                old.unlink(missing_ok=True)
            with lock:
                stats["done"] += 1
        except (InterruptedError,) as exc:
            _set_block(bid, audio_status="none")
            raise exc
        except Exception as exc:  # noqa: BLE001 – a failed block must not stop the others
            if ctx.should_stop():
                _set_block(bid, audio_status="none")
                return
            msg = exc.message if isinstance(exc, ApiError) else str(exc)
            with session_scope() as db:
                b = db.get(EpisodeBlock, bid)
                if b:
                    b.audio_status = "done" if b.audio_file and b.audio_hash else "failed"
                    b.audio_error = msg[:500]
            with lock:
                stats["failed"] += 1
                errors.append(f"блок #{bid}: {msg[:160]}")
        finally:
            _notify(series_id, "blocks", project_id)
            report()

    lumean = [t for t in tasks if t["provider"] == "lumean"]
    gemini = [t for t in tasks if t["provider"] == "gemini"]
    report()

    def run_gemini() -> None:
        for t in gemini:
            if ctx.should_stop():
                break
            one(t)

    workers = max(1, load_config().lumean_parallel_orders)
    with ThreadPoolExecutor(max_workers=workers + 1) as pool:
        futures = [pool.submit(run_gemini)] + [pool.submit(one, t) for t in lumean]
        for f in futures:
            try:
                f.result()
            except InterruptedError:
                pass
    ctx.check()
    if errors:
        stats["errors"] = errors[:5]  # type: ignore[assignment]
    track_changed(track_id, "blocks")
    return stats


@register("episode_voice", "voice", "Озвучка блоков серии")
def episode_voice_job(ctx: JobContext) -> dict[str, Any]:
    """Params: ``block_ids`` – only these; ``force`` – re-voice them even if up to date."""
    with session_scope() as db:
        track = db.get(Track, ctx.track_id)
        if track is None or not track.project.series_id:
            raise JobError("Серия не найдена")
        project_id = track.project_id
    stats = voice_blocks(ctx, project_id, ctx.track_id, only=set(ctx.params.get("block_ids") or []),
                         force=bool(ctx.params.get("force")))
    if not stats["total"]:
        return {"message": "Все блоки уже озвучены"}
    if stats["failed"] and not stats["done"]:
        raise JobError("Не удалось озвучить блоки:\n• " + "\n• ".join(stats.get("errors", [])))
    msg = f"Озвучено блоков: {stats['done']} из {stats['total']}"
    if stats["failed"]:
        msg += ". Ошибки:\n• " + "\n• ".join(stats.get("errors", []))
    return {"message": msg}


@register("transcribe_block", "misc", "Проверка реплики (распознавание)")
def transcribe_block_job(ctx: JobContext) -> dict[str, Any]:
    """What was actually said in a block's clip (FastGen speech-to-text) – to check a TTS take."""
    bid = ctx.params.get("block_id")
    with session_scope() as db:
        b = db.get(EpisodeBlock, bid)
        if b is None or not b.audio_file:
            raise JobError("У блока нет озвучки")
        path = to_abs(b.audio_file)
        language = db.get(Series, b.project.series_id).language
        expected = b.text
    tmp = path.with_suffix(".stt.mp3")
    run([ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y", "-i", str(path), "-ac", "1", "-ar", "24000",
         "-b:a", "64k", str(tmp)])
    try:
        with FastgenClient() as fg:
            result = fg.transcribe(file_to_data_uri(tmp, "audio/mpeg"), language=language, should_stop=ctx.should_stop)
    finally:
        tmp.unlink(missing_ok=True)
    item = next((r for r in result.get("results", []) if r.get("transcription")), None)
    segments = (item or {}).get("transcription", {}).get("segments") or []
    heard = " ".join(str(s.get("text") or "").strip() for s in segments).strip()
    _set_block(bid, meta={"heard": heard})
    return {"message": f"Распознано: {heard[:300]}", "heard": heard, "expected": expected}


# ===================================================================== sound
def _cue_digest(c: SoundCue, length: float) -> str:
    key = [c.kind, c.prompt.strip(), round(length, 0)]
    return hashlib.sha256(json.dumps(key).encode()).hexdigest()[:16]


@register("episode_sounds", "voice", "Музыка и звуки серии")
def episode_sounds_job(ctx: JobContext) -> dict[str, Any]:
    """Generate music beds, ambience loops and sound effects in Lumean.

    Params: ``cue_ids`` – only these; ``force`` – regenerate them. A music bed is generated
    as long as its window on the current timeline (estimated for blocks not voiced yet).
    """
    from ..settings_store import load_config  # noqa: PLC0415

    only = set(ctx.params.get("cue_ids") or [])
    force = bool(ctx.params.get("force"))
    with session_scope() as db:
        track = db.get(Track, ctx.track_id)
        project = track.project if track else None
        series = db.get(Series, project.series_id) if project and project.series_id else None
        if series is None:
            raise JobError("Серия не найдена")
        spans, total = ep.layout(list(project.blocks), ep.series_options(series))
        tasks = []
        for c in project.sound_cues:
            if only and c.id not in only:
                continue
            length = ep.wanted_length(c, spans, total)
            digest = _cue_digest(c, length)
            fresh = c.audio_status == "done" and c.audio_hash == digest and c.audio_file and to_abs(c.audio_file).exists()
            if fresh and not (force and only):
                continue
            if c.kind == "music":
                data = {"prompt": c.prompt, "music_length_ms": int(length * 1000), "force_instrumental": True,
                        "n_variants": 1}
                task_type = "music"
            else:
                data = {"text": c.prompt, "prompt_influence": 0.45}
                if c.kind == "ambience":
                    data.update(loop=True, duration_seconds=length)
                elif length:
                    data["duration_seconds"] = length
                task_type = "sfx"
            tasks.append((c.id, digest, task_type, data))
            c.audio_status, c.audio_error = "queued", None
        project_id, series_id = project.id, series.id
    if not tasks:
        return {"message": "Все звуки уже готовы"}
    _notify(series_id, "cues", project_id)
    out_dir = track_dir(project_id, ctx.track_id, "sound")
    stats = {"done": 0, "failed": 0}
    errors: list[str] = []
    lock = threading.Lock()

    def one(cue_id: int, digest: str, task_type: str, data: dict[str, Any]) -> None:
        with session_scope() as db:
            c = db.get(SoundCue, cue_id)
            if c is None:
                return
            c.audio_status = "generating"
            meta = dict(c.audio_meta or {})
        _notify(series_id, "cues", project_id)
        try:
            with LumeanClient() as lm:
                order_id = meta.get("order_id") if meta.get("order_hash") == digest else None
                if order_id:
                    try:
                        if lm.order(order_id)["status"] in TERMINAL_FAIL:
                            order_id = None
                    except ApiError:
                        order_id = None
                if not order_id:
                    order = lm.create_sound_order(task_type, data, f"vidosodel cue #{cue_id} {digest[:8]}")
                    order_id = order["id"]
                    with session_scope() as db:
                        c = db.get(SoundCue, cue_id)
                        if c:
                            c.audio_meta = {**(c.audio_meta or {}), "order_id": order_id, "order_hash": digest}
                order = _wait_order(lm, order_id, ctx, f"звук #{cue_id}")
                files = (order.get("result") or {}).get("files") or []
                if not files:
                    raise JobError("Lumean не вернул файл")
                dest = out_dir / f"cue_{cue_id}_{digest[:8]}{Path(files[0]).suffix or '.mp3'}"
                lm.download(files[0], dest)
            dur = probe_duration(dest)
            with session_scope() as db:
                c = db.get(SoundCue, cue_id)
                if c is None:
                    dest.unlink(missing_ok=True)
                    return
                old = to_abs(c.audio_file)
                c.audio_file, c.audio_duration, c.audio_hash = to_rel(dest), round(dur, 3), digest
                c.audio_status, c.audio_error = "done", None
                c.audio_meta = {**(c.audio_meta or {}), "cost": order.get("price_formatted"), "made_at": time.time()}
            if old and old.exists() and old != dest:
                old.unlink(missing_ok=True)
            with lock:
                stats["done"] += 1
        except InterruptedError:
            with session_scope() as db:
                c = db.get(SoundCue, cue_id)
                if c:
                    c.audio_status = "done" if c.audio_file else "none"
            raise
        except Exception as exc:  # noqa: BLE001
            msg = exc.message if isinstance(exc, ApiError) else str(exc)
            with session_scope() as db:
                c = db.get(SoundCue, cue_id)
                if c:
                    c.audio_status = "done" if c.audio_file else "failed"
                    c.audio_error = msg[:500]
            with lock:
                stats["failed"] += 1
                errors.append(f"звук #{cue_id}: {msg[:160]}")
        finally:
            _notify(series_id, "cues", project_id)
            n = stats["done"] + stats["failed"]
            ctx.progress(n / len(tasks), f"Звуки: {n}/{len(tasks)}")

    with ThreadPoolExecutor(max_workers=max(1, load_config().lumean_parallel_orders)) as pool:
        for f in [pool.submit(one, *t) for t in tasks]:
            try:
                f.result()
            except InterruptedError:
                pass
    ctx.check()
    if stats["failed"] and not stats["done"]:
        raise JobError("Не удалось создать звуки:\n• " + "\n• ".join(errors[:5]))
    msg = f"Звуков готово: {stats['done']} из {len(tasks)}"
    if errors:
        msg += ". Ошибки:\n• " + "\n• ".join(errors[:5])
    return {"message": msg}


# ===================================================================== assembling
def assemble(ctx: JobContext, project_id: int, track_id: int, *, rebuild_scenes: bool = False,
             share: tuple[float, float] = (0.0, 1.0)) -> dict[str, Any]:
    """Speech track + word timings + sound mix → the track's audio; scenes from the blocks."""
    from ..series_ops import narrator_template  # noqa: PLC0415

    def step(v: float, msg: str) -> None:
        ctx.progress(share[0] + (share[1] - share[0]) * v, msg, force=True)

    with session_scope() as db:
        project = db.get(Project, project_id)
        series = db.get(Series, project.series_id)
        opts = ep.series_options(series)
        narrator = narrator_template(db, series) or ""
        chars = {c.id: c for c in series.characters}
        blocks = list(project.blocks)
        missing = []
        for b in blocks:
            if not ep.needs_voice(b):
                continue
            current = ep.block_hash(b, chars.get(b.character_id), narrator, opts)
            path = to_abs(b.audio_file)
            if b.audio_status != "done" or not path or not path.exists() or b.audio_hash != current:
                missing.append(b.position + 1)
        if not any(ep.needs_voice(b) for b in blocks):
            raise JobError("В сценарии серии нет ни одного блока с текстом")
        if missing:
            raise JobError("Сначала озвучьте все блоки (не озвучены или изменились: №"
                           + ", ".join(map(str, missing[:15])) + ("…" if len(missing) > 15 else "") + ")")
        for b in blocks:
            db.expunge(b)
        cues = list(project.sound_cues)
        for c in cues:
            db.expunge(c)
        names = {c.id: c.name for c in series.characters}
        cfg_max = effective_settings(project.channel.settings, project.settings).scenes.max_duration
        series_id = series.id

    adir = track_dir(project_id, track_id, "audio")
    step(0.1, "Сборка речевой дорожки")
    speech_wav = adir / "speech.wav"
    assembled = ep.assemble_speech(blocks, opts, lambda b: to_abs(b.audio_file), speech_wav, names)
    ctx.check()
    step(0.35, "Огибающая приглушения музыки")
    gain = ep.duck_gain(speech_wav, opts, adir / "duck_gain.wav")
    placed = ep.placements(cues, assembled.spans, assembled.duration, opts, to_abs)
    skipped = sum(1 for c in cues if c.id not in {p.cue_id for p in placed})
    step(0.5, f"Сведение: речь + {len(placed)} звуков")
    stop = threading.Event()

    def watch() -> None:
        while not stop.is_set():
            if ctx.should_stop():
                stop.set()
            time.sleep(0.5)

    watcher = threading.Thread(target=watch, daemon=True)
    watcher.start()
    mix = adir / f"episode_mix_{int(time.time())}.flac"
    try:
        ep.mix_episode(speech_wav, gain, placed, assembled.duration, mix, stop=stop)
        run([ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y", "-i", str(speech_wav), "-c:a", "flac",
             str(adir / "speech.flac")], stop=stop)
    finally:
        stop.set()
    ctx.check()
    speech_wav.unlink(missing_ok=True)
    gain.unlink(missing_ok=True)

    step(0.8, "Тайминги, субтитры и сцены")
    timings = Timings(assembled.words, assembled.duration, "episode")
    built = 0
    with session_scope() as db:
        track = db.get(Track, track_id)
        project = track.project
        old = to_abs(track.audio_file) if track.audio_origin == "episode" else None
        track.audio_file, track.audio_duration, track.audio_origin = to_rel(mix), assembled.duration, "episode"
        track.script, track.script_origin = assembled.script, "manual"
        track.voice_meta = {**(track.voice_meta or {}), "episode": {
            "assembled_at": time.time(), "speech_file": to_rel(adir / "speech.flac"),
            "spans": [[s.block_id, round(s.start, 3), round(s.end, 3), s.kind] for s in assembled.spans],
            "cues": len(placed),
        }}
        refs = ep.sync_cast(db, project)
        rebuild = rebuild_scenes or not track.scenes
        apply_timings(db, track, timings, retime_scenes=not rebuild)
        if rebuild:
            db.execute(delete(Scene).where(Scene.track_id == track_id))
            specs = ep.scene_specs(blocks, assembled, refs, cfg_max)
            for i, sp in enumerate(specs):
                db.add(Scene(track_id=track_id, idx=i, start=sp.start, end=sp.end, text=sp.text,
                             prompt=sp.prompt, prompt_locked=bool(sp.prompt), characters=sp.refs,
                             image_meta={"block_id": sp.block_id}))
            built = len(specs)
    if old and old.exists() and old != mix:
        old.unlink(missing_ok=True)
    track_changed(track_id, "voice")
    if built:
        track_changed(track_id, "scenes")
    _notify(series_id, "assembled", project_id)
    msg = f"Серия собрана: {int(assembled.duration // 60)} мин {int(assembled.duration % 60)} с, звуков в миксе: {len(placed)}"
    if skipped:
        msg += f" (не готовы и пропущены: {skipped})"
    if built:
        msg += f". Сцен: {built}"
    return {"message": msg, "duration": assembled.duration, "scenes": built}


@register("episode_assemble", "misc", "Сборка серии")
def episode_assemble_job(ctx: JobContext) -> dict[str, Any]:
    """Params: ``rebuild_scenes`` – recreate scenes from the blocks (prompts and images are lost)."""
    with session_scope() as db:
        track = db.get(Track, ctx.track_id)
        if track is None or not track.project.series_id:
            raise JobError("Серия не найдена")
        project_id = track.project_id
    return assemble(ctx, project_id, ctx.track_id, rebuild_scenes=bool(ctx.params.get("rebuild_scenes")))


def voice_and_assemble(ctx: JobContext) -> dict[str, Any]:
    """The usual "voice" step on an episode: voice what is missing, then assemble."""
    with session_scope() as db:
        project_id = db.get(Track, ctx.track_id).project_id
    stats = voice_blocks(ctx, project_id, ctx.track_id, only=set(), force=False, share=(0.0, 0.8))
    if stats["failed"]:
        raise JobError("Не все блоки озвучены:\n• " + "\n• ".join(stats.get("errors", [])))
    return assemble(ctx, project_id, ctx.track_id, share=(0.8, 1.0))


def episode_scenes(ctx: JobContext) -> dict[str, Any]:
    """The usual "scenes" step on an episode: scenes come from the screenplay blocks."""
    with session_scope() as db:
        track = db.get(Track, ctx.track_id)
        if track.audio_origin != "episode":
            raise JobError("Сначала соберите серию (озвучка блоков → сборка)")
        project_id = track.project_id
    return assemble(ctx, project_id, ctx.track_id, rebuild_scenes=True)


def is_episode_track(track_id: int | None) -> bool:
    with session_scope() as db:
        track = db.get(Track, track_id) if track_id else None
        return bool(track and track.project.series_id)

