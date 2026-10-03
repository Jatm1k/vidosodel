"""Voice-over, transcription and translation jobs (+ timing bookkeeping used by uploads)."""
from __future__ import annotations

import json
import logging
import shutil
import time
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from ..db import session_scope
from ..models import Track
from ..pipeline import llm_tasks
from ..pipeline.align import align_scenes
from ..pipeline.languages import LANGUAGES
from ..pipeline.text import normalize_script, paragraphs
from ..pipeline.timings import Timings, assign_paragraphs, from_lumean, from_stt
from ..render.media import probe_duration, run
from ..render.subtitles import build_cues, write_srt
from ..config import ffmpeg_bin
from ..services.fastgen import FastgenClient, file_to_data_uri
from ..services.http import ApiError
from ..services.lumean import TERMINAL_FAIL, TERMINAL_OK, LumeanClient, pick_service_file
from ..settings_schema import template_for_language
from ..storage import to_abs, to_rel, track_dir
from .common import load_timings, load_track, text_hash
from .events import track_changed
from .runner import JobContext, JobError, register

log = logging.getLogger(__name__)


# ------------------------------------------------------------------ timings commit
def apply_timings(db: Session, track: Track, timings: Timings, *, srt_from_lumean: Path | None = None) -> None:
    """Persist new timings for a track, refresh its SRT and re-time existing scenes.

    Existing scenes keep their prompts/images: boundaries are moved to the same
    *text* positions on the new timeline (e.g. estimate → real voice-over).
    """
    old = load_timings(track)
    tdir = track_dir(track.project_id, track.id, "audio")
    tpath = tdir / "timings.json"
    timings.save(tpath)
    track.timings_file = to_rel(tpath)
    track.timings_origin = timings.source
    srt_path = tdir / "subtitles.srt"
    if srt_from_lumean and srt_from_lumean.exists():
        shutil.copyfile(srt_from_lumean, srt_path)
    else:
        write_srt(build_cues(timings.words), srt_path)
    track.srt_file = to_rel(srt_path)
    scenes = list(track.scenes)
    if old and scenes and old.words and timings.words:
        aligned = align_scenes(old, [(s.id, s.start, s.end) for s in scenes], timings)
        kept = {a.source_scene_id: a for a in aligned}
        for s in scenes:
            a = kept.get(s.id)
            if a is None:
                db.delete(s)  # collapsed (very short) scene
                continue
            s.start, s.end, s.text = a.start, a.end, a.text or s.text
        db.flush()
        for i, s in enumerate(sorted((s for s in scenes if s.id in kept), key=lambda x: x.start)):
            s.idx = i


# ------------------------------------------------------------------------- voice
def voice_config_override(language: str, speed: float | None, paragraph_mode: bool) -> dict[str, Any]:
    """Per-order Lumean ``config_override``: language, speed and paragraph mode on top of the template."""
    tts: dict[str, Any] = {}
    if language in LANGUAGES:
        tts["language_code"] = language
    if speed:
        tts["voice_settings"] = {"speed": max(0.7, min(1.2, float(speed)))}
    override: dict[str, Any] = {"tts_settings": tts} if tts else {}
    if paragraph_mode:
        override["generation_mode"] = "paragraph"
    return override


@register("voice", "voice", "Озвучка (Lumean)")
def voice_job(ctx: JobContext) -> dict[str, Any]:
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        track = tc.track
        script = normalize_script(track.script)
        if not script:
            raise JobError("Сценарий пуст — нечего озвучивать")
        template_id = template_for_language(tc.settings.voice, track.language)
        if not template_id:
            raise JobError(f"Для языка «{track.language}» не выбран голос. Откройте настройки канала → Озвучка.")
        voice = tc.settings.voice
        override = voice_config_override(track.language, voice.speed, voice.paragraph_mode)
        digest = text_hash(script + json.dumps(override, sort_keys=True) + template_id)
        meta = dict(track.voice_meta or {})
        order_id = track.lumean_order_id if meta.get("hash") == digest else None
        project_id, track_id, name = track.project_id, track.id, f"vidosodel #{track.id} {track.language} {digest[:8]}"

    with LumeanClient() as lm:
        if order_id:
            ctx.progress(0.02, "Подключение к существующему заказу Lumean", force=True)
            try:
                order = lm.order(order_id)
                if order["status"] in TERMINAL_FAIL or order.get("files_expired"):
                    order_id = None
            except ApiError:
                order_id = None
        if not order_id:
            ctx.progress(0.02, "Проверка текста и стоимости", force=True)
            est = lm.estimate(template_id, script, override)
            summary = est.get("summary") or {}
            if summary.get("has_blocked_content"):
                raise JobError(f"Lumean заблокирует фрагменты текста №{summary.get('blocked_chunks')} "
                               "(контентная политика). Отредактируйте эти места сценария.")
            if summary.get("caps_ok") is False:
                raise JobError(f"Превышены лимиты пауз в тексте: {summary.get('caps_exceeded')}")
            ctx.check()
            ctx.progress(0.04, "Создание заказа на озвучку", force=True)
            order = lm.create_tts_order(template_id, script, name, override)
            order_id = order["id"]
            with session_scope() as db:
                t = db.get(Track, track_id)
                t.lumean_order_id = order_id
                t.voice_meta = {**(t.voice_meta or {}), "hash": digest, "template_id": template_id,
                                "estimate_rub": ((summary.get("cost_display") or {}).get("amounts") or {}).get("rub", {}).get("amount_formatted"),
                                "chunks": summary.get("chunks_count")}

        retries = 0
        while True:
            if ctx.should_stop():
                try:
                    lm.cancel_order(order_id)
                except ApiError:
                    pass  # already in progress – it will finish and can be re-attached later
                raise JobError("Отменено. Если заказ уже выполнялся, при повторном запуске он будет подхвачен без повторной оплаты.")
            order = lm.order(order_id)
            status = order["status"]
            pct = order.get("progress_percent") or 0
            eta = order.get("eta_seconds")
            msg = f"Озвучка: {order.get('completed_chunks', 0)}/{order.get('total_chunks', 0)} фрагментов"
            if eta:
                msg += f" · ~{max(1, int(eta) // 60)} мин"
            ctx.progress(0.05 + 0.85 * pct / 100, msg)
            if status in TERMINAL_OK:
                break
            if status in TERMINAL_FAIL:
                raise JobError(f"Lumean: заказ завершился со статусом «{status}». Средства по неудачным фрагментам возвращаются.")
            if status == "partially_completed":
                items = lm.order_items(order_id)
                active = [i for i in items if i["status"] in ("pending", "processing")]
                failed = [i for i in items if i["status"] == "failed" and i.get("can_retry")]
                flagged = [i for i in items if i["status"] == "policy_flagged"]
                if not active:
                    if failed and retries < 3:
                        retries += 1
                        ctx.progress(message=f"Повтор неудачных фрагментов ({len(failed)}), попытка {retries}")
                        try:
                            lm.retry_failed_items(order_id)
                        except ApiError as exc:
                            log.warning("retry-failed: %s", exc)
                    elif flagged:
                        texts = []
                        for it in flagged[:3]:
                            try:
                                texts.append((lm.item_text(order_id, it["id"]).get("text") or "")[:160])
                            except ApiError:
                                pass
                        raise JobError(
                            "Lumean отклонил фрагменты по контентной политике. Перефразируйте эти места и "
                            "запустите озвучку снова:\n• " + "\n• ".join(texts))
                    elif failed:
                        raise JobError("Часть фрагментов не озвучилась после 3 попыток. Попробуйте позже.")
            time.sleep(5)

        # ---------------------------------------------------------------- download
        ctx.progress(0.92, "Скачивание аудио и таймингов", force=True)
        adir = track_dir(project_id, track_id, "audio")
        files = (order.get("result") or {}).get("files") or []
        if not files:
            raise JobError("Lumean не вернул аудиофайл")
        audio_path = adir / f"voice{Path(files[0]).suffix or '.mp3'}"
        lm.download(files[0], audio_path)
        result_json_path = pick_service_file(order, "result.json")
        srt_remote = pick_service_file(order, "subtitles.srt")
        timings_raw = None
        if result_json_path:
            lm.download(result_json_path, adir / "lumean_result.json")
            timings_raw = json.loads((adir / "lumean_result.json").read_text(encoding="utf-8"))
        srt_local = None
        if srt_remote:
            srt_local = lm.download(srt_remote, adir / "lumean_subtitles.srt")

    duration = probe_duration(audio_path)
    with session_scope() as db:
        tc = load_track(db, track_id)
        t = tc.track
        t.audio_file = to_rel(audio_path)
        t.audio_duration = duration
        t.audio_origin = "lumean"
        t.voice_meta = {**(t.voice_meta or {}), "cost_rub": order.get("price_formatted"),
                        "tokens": order.get("tokens_spent"), "completed_at": time.time()}
        if timings_raw:
            timings = from_lumean(timings_raw, t.script)
            timings.duration = max(timings.duration, duration)
            apply_timings(db, t, timings, srt_from_lumean=srt_local)
    track_changed(track_id, "voice")
    return {"message": f"Озвучка готова: {int(duration // 60)} мин {int(duration % 60)} с", "order_id": order_id}


# --------------------------------------------------------------------- transcribe
@register("transcribe", "misc", "Распознавание речи (тайминги)")
def transcribe_job(ctx: JobContext) -> dict[str, Any]:
    """Word timings for an uploaded voice-over via FastGen speech-to-text."""
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        audio = to_abs(tc.track.audio_file)
        if not audio or not audio.exists():
            raise JobError("Сначала загрузите или сгенерируйте озвучку")
        language, project_id, track_id = tc.track.language, tc.project.id, tc.track.id
    duration = probe_duration(audio)
    piece = 600.0
    work = track_dir(project_id, track_id, "audio", "stt")
    words = []
    with FastgenClient() as fg:
        n = int(duration // piece) + 1
        for k in range(n):
            ctx.check()
            start = k * piece
            if start >= duration - 0.05:
                break
            part = work / f"part_{k:03d}.mp3"
            run([ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{start}", "-t", f"{piece}",
                 "-i", str(audio), "-ac", "1", "-ar", "24000", "-b:a", "64k", str(part)])
            ctx.progress(k / n, f"Распознавание фрагмента {k + 1}/{n}", force=True)
            result = fg.transcribe(file_to_data_uri(part, "audio/mpeg"), language=language, should_stop=ctx.should_stop)
            item = next((r for r in result.get("results", []) if r.get("transcription")), None)
            segments = (item or {}).get("transcription", {}).get("segments") or []
            words.extend(from_stt(segments, offset=start))
    shutil.rmtree(work, ignore_errors=True)
    if not words:
        raise JobError("Не удалось распознать речь в аудио")
    timings = Timings(words, duration, "stt")
    with session_scope() as db:
        t = db.get(Track, track_id)
        if not t.script.strip():
            # No script yet – reconstruct it from the transcript (paragraph per long pause).
            paras, cur = [], []
            for i, w in enumerate(words):
                cur.append(w.w)
                gap = words[i + 1].s - w.e if i + 1 < len(words) else 0
                if gap > 1.2 and len(cur) > 25:
                    paras.append(" ".join(cur))
                    cur = []
            if cur:
                paras.append(" ".join(cur))
            t.script, t.script_origin = "\n\n".join(paras), "transcribed"
        assign_paragraphs(timings, t.script)
        t.audio_duration = duration
        apply_timings(db, t, timings)
    track_changed(track_id, "timings")
    return {"message": f"Распознано слов: {len(words)}"}


# ---------------------------------------------------------------------- translate
@register("translate", "llm", "Перевод сценария")
def translate_job(ctx: JobContext) -> dict[str, Any]:
    source_id = ctx.params.get("source_track_id")
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        src = db.get(Track, source_id) if source_id else None
        if src is None or src.project_id != tc.project.id:
            raise JobError("Не выбран исходный язык для перевода")
        if not src.script.strip():
            raise JobError("Исходный сценарий пуст")
        paras = paragraphs(src.script)
        target_lang, llm, track_id = tc.track.language, tc.settings.llm, tc.track.id
    with FastgenClient() as fg:
        translated = llm_tasks.translate_script(fg, paras, target_lang, llm,
                                                progress=lambda v: ctx.progress(v, "Перевод абзацев"))
    with session_scope() as db:
        t = db.get(Track, track_id)
        t.script, t.script_origin = "\n\n".join(translated), "translated"
    track_changed(track_id, "script")
    return {"message": f"Переведено абзацев: {len(translated)}"}

