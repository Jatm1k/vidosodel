"""Series domain operations shared by the REST API and the MCP server.

Every function takes a session and plain data, validates it and raises
:class:`OpError` with a user-facing message (the REST layer turns it into an HTTP
error, the MCP layer into a tool error). Characters and locations in screenplay
data may be referred to by id *or* by name – an agent writes names more reliably.
"""
from __future__ import annotations

import shutil
import time
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from .jobs.events import bus, track_changed
from .jobs.runner import kind_title, runner
from .models import (
    Channel, EpisodeBlock, Job, Project, Series, SeriesCharacter, SeriesLocation, SoundCue, Track,
)
from .pipeline import episode as ep
from .pipeline.languages import LANGUAGES
from .services.gemini_tts import VOICES
from .settings_schema import effective_settings, template_for_language
from .storage import media_root, media_url, project_dir, to_abs

BLOCK_KINDS = ("narration", "line", "pause")
CUE_KINDS = ("music", "ambience", "sfx")


class OpError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def series_dir(series_id: int, *parts: str) -> Path:
    d = media_root() / "series" / str(series_id)
    d = d.joinpath(*parts) if parts else d
    d.mkdir(parents=True, exist_ok=True)
    return d


def notify(series_id: int | None, what: str, project_id: int | None = None) -> None:
    """Tell the UI that series data changed (it refetches)."""
    bus.publish({"type": "series", "series_id": series_id, "project_id": project_id, "what": what})


# ===================================================================== lookups
def get_series(db: Session, series_id: int) -> Series:
    s = db.get(Series, series_id)
    if s is None:
        raise OpError(f"Сериал #{series_id} не найден", 404)
    return s


def get_episode(db: Session, project_id: int) -> Project:
    p = db.get(Project, project_id)
    if p is None or not p.series_id:
        raise OpError(f"Серия #{project_id} не найдена", 404)
    return p


def episode_track(project: Project) -> Track:
    track = next((t for t in project.tracks if t.id == project.master_track_id), None) or \
        (project.tracks[0] if project.tracks else None)
    if track is None:
        raise OpError("У серии нет дорожки (повреждённый проект)", 500)
    return track


def _get(db: Session, model, obj_id: int, what: str):
    obj = db.get(model, obj_id)
    if obj is None:
        raise OpError(f"{what} #{obj_id} не найден", 404)
    return obj


def _resolve(items: list, ref: Any, what: str) -> int | None:
    """Id of a character/location given by id or name (``None``/empty → None)."""
    if ref in (None, "", 0):
        return None
    if isinstance(ref, int) or (isinstance(ref, str) and ref.strip().isdigit()):
        rid = int(ref)
        if any(i.id == rid for i in items):
            return rid
    name = str(ref).strip().lower()
    for i in items:
        if i.name.strip().lower() == name:
            return i.id
    known = ", ".join(i.name for i in items) or "нет ни одного"
    raise OpError(f"{what} «{ref}» не найден(а) в сериале. Известные: {known}")


# ===================================================================== serialisers
def ref_to_dict(r: SeriesCharacter | SeriesLocation) -> dict[str, Any]:
    d = {"id": r.id, "name": r.name, "description": r.description, "position": r.position,
         "image_url": media_url(r.image_file), "image_path": str(to_abs(r.image_file)) if r.image_file else None,
         "image_status": r.image_status, "image_error": r.image_error, "image_origin": r.image_origin}
    if isinstance(r, SeriesCharacter):
        d.update(role=r.role, personality=r.personality, voice=ep.voice_of(r))
    return d


def narrator_template(db: Session, series: Series) -> str | None:
    opts = ep.series_options(series)
    if opts.narrator_template_id:
        return opts.narrator_template_id
    channel = db.get(Channel, series.channel_id)
    voice = effective_settings(channel.settings if channel else {}).voice
    return template_for_language(voice, series.language)


def block_to_dict(b: EpisodeBlock, series: Series, narrator: str | None, opts: ep.SeriesOptions) -> dict[str, Any]:
    chars = {c.id: c for c in series.characters}
    locs = {loc.id: loc for loc in series.locations}
    character = chars.get(b.character_id) if b.character_id else None
    current = ep.block_hash(b, character, narrator or "", opts) if ep.needs_voice(b) else None
    meta = b.audio_meta or {}
    return {
        "id": b.id, "position": b.position, "kind": b.kind,
        "character_id": b.character_id, "character": character.name if character else None,
        "text": b.text, "direction": b.direction,
        "location_id": b.location_id, "location": locs[b.location_id].name if b.location_id in locs else None,
        "visible": [chars[i].name for i in (b.visible or []) if i in chars],
        "gap_after": b.gap_after, "pause": b.pause, "shots": b.shots, "visual": b.visual,
        "audio_url": media_url(b.audio_file), "audio_duration": b.audio_duration,
        "audio_status": b.audio_status, "audio_error": b.audio_error,
        "audio_stale": bool(current and b.audio_status == "done" and b.audio_hash != current),
        "audio_provider": meta.get("provider"), "audio_warning": meta.get("warning"),
    }


def cue_to_dict(c: SoundCue, window: tuple[float, float] | None = None) -> dict[str, Any]:
    return {
        "id": c.id, "kind": c.kind, "prompt": c.prompt, "start_block_id": c.start_block_id, "anchor": c.anchor,
        "offset": c.offset, "end_block_id": c.end_block_id, "duration": c.duration, "volume": c.volume,
        "fade_in": c.fade_in, "fade_out": c.fade_out,
        "audio_url": media_url(c.audio_file), "audio_duration": c.audio_duration,
        "audio_status": c.audio_status, "audio_error": c.audio_error,
        "window": [round(window[0], 2), round(window[1], 2)] if window else None,
    }


def episode_summary_dict(db: Session, p: Project) -> dict[str, Any]:
    track = episode_track(p)
    blocks = list(p.blocks)
    voiced = [b for b in blocks if ep.needs_voice(b)]
    scenes = list(track.scenes)
    return {
        "id": p.id, "series_id": p.series_id, "number": p.episode_number, "title": p.name,
        "synopsis": p.synopsis, "summary": p.episode_summary, "track_id": track.id,
        "blocks": len(blocks), "voiced": sum(1 for b in voiced if b.audio_status == "done"),
        "to_voice": len(voiced),
        "cues": len(p.sound_cues), "cues_ready": sum(1 for c in p.sound_cues if c.audio_status == "done"),
        "assembled": track.audio_origin == "episode" and bool(track.audio_file),
        "duration": track.audio_duration,
        "scenes": len(scenes), "images": sum(1 for s in scenes if s.image_status == "done"),
        "video_url": media_url(track.video_file), "updated_at": p.updated_at.isoformat(),
    }


def episode_to_dict(db: Session, p: Project) -> dict[str, Any]:
    series = get_series(db, p.series_id)
    opts = ep.series_options(series)
    narrator = narrator_template(db, series)
    blocks = list(p.blocks)
    spans, total = ep.layout(blocks, opts)
    span_by = {s.block_id: s for s in spans}
    out = episode_summary_dict(db, p)
    out["blocks"] = []
    for b in blocks:
        d = block_to_dict(b, series, narrator, opts)
        s = span_by.get(b.id)
        d["start"], d["end"] = (round(s.start, 2), round(s.end, 2)) if s else (None, None)
        out["blocks"].append(d)
    out["cues"] = [cue_to_dict(c, ep.cue_window(c, spans, total)) for c in p.sound_cues]
    out["estimated_duration"] = round(total, 1)
    out["timeline_estimated"] = any(ep.needs_voice(b) and b.audio_status != "done" for b in blocks)
    track = episode_track(p)
    out["audio_url"] = media_url(track.audio_file) if track.audio_origin == "episode" else None
    out["jobs"] = active_jobs(db, p.id)
    return out


def series_to_dict(db: Session, s: Series, *, full: bool = False) -> dict[str, Any]:
    d: dict[str, Any] = {
        "id": s.id, "channel_id": s.channel_id, "name": s.name, "language": s.language,
        "logline": s.logline, "updated_at": s.updated_at.isoformat(),
        "episodes_count": db.query(Project).filter(Project.series_id == s.id).count(),
        "cover_url": next((media_url(c.image_file) for c in s.characters if c.image_file), None),
    }
    if full:
        d.update(
            setting=s.setting, bible=s.bible, visual_style=s.visual_style,
            options=ep.series_options(s).model_dump(), narrator_template_id=narrator_template(db, s),
            characters=[ref_to_dict(c) for c in s.characters],
            locations=[ref_to_dict(loc) for loc in s.locations],
            episodes=[episode_summary_dict(db, p) for p in _episodes(db, s.id)],
        )
    return d


def _episodes(db: Session, series_id: int) -> list[Project]:
    return list(db.scalars(select(Project).where(Project.series_id == series_id)
                           .order_by(Project.episode_number, Project.id)))


def active_jobs(db: Session, project_id: int | None = None, series_id: int | None = None) -> list[dict[str, Any]]:
    q = select(Job).where(Job.status.in_(("queued", "running")))
    if project_id:
        q = q.where(Job.project_id == project_id)
    jobs = list(db.scalars(q.order_by(Job.id)))
    if series_id:
        jobs = [j for j in jobs if (j.params or {}).get("series_id") == series_id]
    return [{"id": j.id, "kind": j.kind, "title": j.title, "status": j.status, "progress": round(j.progress, 2),
             "message": j.message} for j in jobs]


# ===================================================================== series
_SERIES_FIELDS = ("name", "logline", "setting", "bible", "visual_style")


def create_series(db: Session, data: dict[str, Any]) -> Series:
    channel_id = data.get("channel_id")
    if channel_id is None or db.get(Channel, channel_id) is None:
        raise OpError("Укажите существующий канал (channel_id): серии будут проектами этого канала")
    language = data.get("language") or "ru"
    if language not in LANGUAGES:
        raise OpError(f"Неизвестный язык «{language}»")
    s = Series(channel_id=channel_id, name=str(data.get("name") or "Новый сериал").strip()[:300], language=language)
    db.add(s)
    update_series(db, s, {k: v for k, v in data.items() if k != "name"})
    db.flush()
    return s


def update_series(db: Session, s: Series, data: dict[str, Any]) -> Series:
    for key in _SERIES_FIELDS:
        if data.get(key) is not None:
            setattr(s, key, str(data[key]).strip())
    if data.get("language") is not None:
        if data["language"] not in LANGUAGES:
            raise OpError(f"Неизвестный язык «{data['language']}»")
        s.language = data["language"]
    if data.get("options") is not None:
        merged = {**(s.options or {}), **data["options"]}
        s.options = ep.SeriesOptions.model_validate(merged).model_dump(exclude_defaults=True)
    db.flush()
    if any(data.get(k) is not None for k in ("setting", "visual_style", "language")):
        resync_episodes(db, s)
    return s


def delete_series(db: Session, s: Series) -> None:
    for p in _episodes(db, s.id):
        _drop_episode(db, p)
    series_id = s.id
    db.delete(s)
    db.flush()
    shutil.rmtree(media_root() / "series" / str(series_id), ignore_errors=True)


def resync_episodes(db: Session, s: Series) -> None:
    """Push series cast, style and language to every episode."""
    for p in _episodes(db, s.id):
        ep.sync_cast(db, p)
        for t in p.tracks:
            t.language = s.language
    db.flush()


# ===================================================================== characters & locations
def _next_pos(items: list) -> int:
    return max((i.position for i in items), default=-1) + 1


def _check_voice(voice: dict[str, Any]) -> dict[str, Any]:
    v = ep.voice_of(None) | {k: v for k, v in (voice or {}).items() if v not in (None,)}
    if v["provider"] not in ("gemini", "lumean"):
        raise OpError("voice.provider: gemini или lumean")
    if v["provider"] == "gemini" and v["voice"] not in VOICES:
        raise OpError(f"Неизвестный голос Gemini «{v['voice']}». Доступны: {', '.join(VOICES)}")
    if v["provider"] == "lumean" and not v.get("template_id"):
        raise OpError("Для голоса Lumean укажите voice.template_id (шаблон Lumean)")
    return {k: v[k] for k in ("provider", "voice", "style", "template_id")}


def upsert_character(db: Session, series: Series, data: dict[str, Any], char_id: int | None = None) -> SeriesCharacter:
    if char_id:
        c = _get(db, SeriesCharacter, char_id, "Персонаж")
        if c.series_id != series.id:
            raise OpError("Персонаж из другого сериала")
    else:
        name = str(data.get("name") or "").strip()
        if not name:
            raise OpError("У персонажа должно быть имя")
        if any(x.name.strip().lower() == name.lower() for x in series.characters):
            raise OpError(f"Персонаж «{name}» уже есть — измените его по id")
        c = SeriesCharacter(series_id=series.id, position=_next_pos(series.characters), name=name)
        db.add(c)
    for key in ("name", "description", "role", "personality"):
        if data.get(key) is not None:
            setattr(c, key, str(data[key]).strip()[:100] if key == "name" else str(data[key]).strip())
    if data.get("voice") is not None:
        c.voice = _check_voice({**(c.voice or {}), **data["voice"]})
    elif not c.voice:
        c.voice = _check_voice({})
    db.flush()
    db.refresh(series)
    resync_episodes(db, series)
    return c


def upsert_location(db: Session, series: Series, data: dict[str, Any], loc_id: int | None = None) -> SeriesLocation:
    if loc_id:
        loc = _get(db, SeriesLocation, loc_id, "Локация")
        if loc.series_id != series.id:
            raise OpError("Локация из другого сериала")
    else:
        name = str(data.get("name") or "").strip()
        if not name:
            raise OpError("У локации должно быть название")
        if any(x.name.strip().lower() == name.lower() for x in series.locations):
            raise OpError(f"Локация «{name}» уже есть — измените её по id")
        loc = SeriesLocation(series_id=series.id, position=_next_pos(series.locations), name=name)
        db.add(loc)
    for key in ("name", "description"):
        if data.get(key) is not None:
            setattr(loc, key, str(data[key]).strip()[:100] if key == "name" else str(data[key]).strip())
    db.flush()
    db.refresh(series)
    resync_episodes(db, series)
    return loc


def delete_ref(db: Session, obj: SeriesCharacter | SeriesLocation) -> None:
    series = obj.series
    old = to_abs(obj.image_file)
    db.delete(obj)
    db.flush()
    db.refresh(series)
    resync_episodes(db, series)
    if old and old.exists():
        old.unlink(missing_ok=True)


def set_ref_image(db: Session, obj: SeriesCharacter | SeriesLocation, src: Path, origin: str = "upload") -> None:
    """Store an image (a file on this computer) as the reference of a character/location."""
    from .render.media import imread, imwrite  # noqa: PLC0415 – cv2 import only when needed

    if not src.exists() or not src.is_file():
        raise OpError(f"Файл не найден: {src}")
    try:
        img = imread(src)
    except Exception as exc:  # noqa: BLE001 – any decoder error means "not an image"
        raise OpError(f"Не удалось прочитать изображение: {exc}") from exc
    kind = "characters" if isinstance(obj, SeriesCharacter) else "locations"
    dest = series_dir(obj.series_id, kind) / f"{kind[:-1]}_{obj.id}_{int(time.time() * 1000)}.jpg"
    imwrite(dest, img, quality=95)
    old = to_abs(obj.image_file)
    from .storage import to_rel  # noqa: PLC0415

    obj.image_file, obj.image_status, obj.image_error, obj.image_origin = to_rel(dest), "done", None, origin
    db.flush()
    resync_episodes(db, obj.series)
    if old and old.exists() and old != dest:
        old.unlink(missing_ok=True)


# ===================================================================== episodes
def create_episode(db: Session, series: Series, data: dict[str, Any]) -> Project:
    number = data.get("number")
    if number is None:
        number = max((p.episode_number or 0 for p in _episodes(db, series.id)), default=0) + 1
    title = str(data.get("title") or f"Серия {number}").strip()[:300]
    p = Project(channel_id=series.channel_id, name=title, series_id=series.id, episode_number=int(number),
                synopsis=str(data.get("synopsis") or "").strip(), image_mode="shared", settings={})
    db.add(p)
    db.flush()
    t = Track(project_id=p.id, language=series.language, position=0)
    db.add(t)
    db.flush()
    p.master_track_id = t.id
    ep.sync_cast(db, p)
    db.flush()
    return p


def update_episode(db: Session, p: Project, data: dict[str, Any]) -> Project:
    if data.get("title") is not None:
        p.name = str(data["title"]).strip()[:300] or p.name
    if data.get("number") is not None:
        p.episode_number = int(data["number"])
    if data.get("synopsis") is not None:
        p.synopsis = str(data["synopsis"]).strip()
    if data.get("summary") is not None:
        p.episode_summary = str(data["summary"]).strip()
    db.flush()
    return p


def _drop_episode(db: Session, p: Project) -> None:
    for t in p.tracks:
        for job_id in runner.active_for_track(t.id):
            runner.cancel(job_id)
    pid = p.id
    db.delete(p)
    db.flush()
    shutil.rmtree(project_dir(pid), ignore_errors=True)


def delete_episode(db: Session, p: Project) -> None:
    _drop_episode(db, p)


# ===================================================================== screenplay
def _block_fields(series: Series, data: dict[str, Any], b: EpisodeBlock) -> None:
    kind = data.get("kind", b.kind or "narration")
    if kind not in BLOCK_KINDS:
        raise OpError(f"kind блока: {', '.join(BLOCK_KINDS)} (получено «{kind}»)")
    b.kind = kind
    if "character" in data or "character_id" in data:
        b.character_id = _resolve(series.characters, data.get("character", data.get("character_id")), "Персонаж")
    if "location" in data or "location_id" in data:
        b.location_id = _resolve(series.locations, data.get("location", data.get("location_id")), "Локация")
    if "visible" in data:
        ids = []
        for ref in data.get("visible") or []:
            rid = _resolve(series.characters, ref, "Персонаж")
            if rid and rid not in ids:
                ids.append(rid)
        b.visible = ids
    for key in ("text", "direction", "visual"):
        if data.get(key) is not None:
            setattr(b, key, str(data[key]).strip())
    if "gap_after" in data:
        b.gap_after = None if data["gap_after"] is None else max(0.0, min(10.0, float(data["gap_after"])))
    if data.get("pause") is not None:
        b.pause = max(0.1, min(30.0, float(data["pause"])))
    if "shots" in data:
        b.shots = None if not data["shots"] else max(1, min(12, int(data["shots"])))
    if b.kind == "line" and not b.character_id:
        raise OpError(f"У реплики должен быть персонаж: «{b.text[:60]}»")
    if b.kind != "line":
        b.character_id = None
    if b.kind in ("narration", "line") and not b.text.strip():
        raise OpError("У блока диктора или реплики должен быть текст")


def _voice_key(b: EpisodeBlock) -> tuple:
    return (b.kind, b.character_id, b.text.strip(), b.direction.strip())


def set_screenplay(db: Session, p: Project, blocks: list[dict[str, Any]]) -> dict[str, int]:
    """Replace the whole screenplay.

    A block keeps its voice-over when it is passed with its ``id`` or when an old block
    has the same kind, speaker, text and direction – rewriting the screenplay does not
    re-voice unchanged lines. Old blocks that are not reused are deleted.
    """
    series = get_series(db, p.series_id)
    old = {b.id: b for b in p.blocks}
    by_key: dict[tuple, list[EpisodeBlock]] = {}
    for b in old.values():
        by_key.setdefault(_voice_key(b), []).append(b)
    used: set[int] = set()
    result: list[EpisodeBlock] = []
    for pos, data in enumerate(blocks):
        bid = data.get("id")
        b = old.get(int(bid)) if bid else None
        if bid and b is None:
            raise OpError(f"Блок #{bid} не принадлежит этой серии")
        if b is None:
            probe = EpisodeBlock(project_id=p.id, kind="narration", text="", direction="", visible=[])
            _block_fields(series, data, probe)
            twin = next((x for x in by_key.get(_voice_key(probe), []) if x.id not in used), None)
            if twin is not None:
                b = twin
            else:
                b = probe
                db.add(b)
        if b.id in used:
            raise OpError(f"Блок #{b.id} указан дважды")
        _block_fields(series, data, b)
        b.position = pos
        db.flush()
        used.add(b.id)
        result.append(b)
    removed = 0
    for b in old.values():
        if b.id not in used:
            _drop_block_audio(b)
            db.delete(b)
            removed += 1
    db.flush()
    db.refresh(p)
    kept = sum(1 for b in result if b.audio_status == "done")
    return {"blocks": len(result), "kept_audio": kept, "removed": removed}


def insert_blocks(db: Session, p: Project, blocks: list[dict[str, Any]], after_block_id: int | None) -> list[EpisodeBlock]:
    series = get_series(db, p.series_id)
    current = list(p.blocks)
    if after_block_id:
        idx = next((i for i, b in enumerate(current) if b.id == after_block_id), None)
        if idx is None:
            raise OpError(f"Блок #{after_block_id} не найден в серии")
        insert_at = idx + 1
    else:
        insert_at = 0 if after_block_id == 0 else len(current)
    new = []
    for data in blocks:
        b = EpisodeBlock(project_id=p.id, kind="narration", text="", direction="", visible=[])
        _block_fields(series, data, b)
        db.add(b)
        new.append(b)
    ordered = current[:insert_at] + new + current[insert_at:]
    for pos, b in enumerate(ordered):
        b.position = pos
    db.flush()
    db.refresh(p)
    return new


def update_block(db: Session, b: EpisodeBlock, data: dict[str, Any]) -> EpisodeBlock:
    series = get_series(db, b.project.series_id)
    _block_fields(series, {"kind": b.kind, **data}, b)
    if data.get("position") is not None:
        blocks = [x for x in b.project.blocks if x.id != b.id]
        blocks.insert(max(0, min(len(blocks), int(data["position"]))), b)
        for pos, x in enumerate(blocks):
            x.position = pos
    db.flush()
    return b


def _drop_block_audio(b: EpisodeBlock) -> None:
    path = to_abs(b.audio_file)
    if path and path.exists():
        path.unlink(missing_ok=True)


def delete_blocks(db: Session, p: Project, ids: list[int]) -> int:
    n = 0
    for b in list(p.blocks):
        if b.id in ids:
            _drop_block_audio(b)
            db.delete(b)
            n += 1
    db.flush()
    db.refresh(p)
    for pos, b in enumerate(p.blocks):
        b.position = pos
    db.flush()
    return n


# ===================================================================== sound cues
def _cue_fields(p: Project, data: dict[str, Any], c: SoundCue) -> None:
    block_ids = {b.id for b in p.blocks}
    kind = data.get("kind", c.kind or "sfx")
    if kind not in CUE_KINDS:
        raise OpError(f"kind звука: {', '.join(CUE_KINDS)} (получено «{kind}»)")
    c.kind = kind
    if data.get("prompt") is not None:
        c.prompt = str(data["prompt"]).strip()
    for key in ("start_block_id", "end_block_id"):
        if key in data:
            v = data[key]
            if v and int(v) not in block_ids:
                raise OpError(f"{key}: блока #{v} нет в этой серии")
            setattr(c, key, int(v) if v else None)
    if data.get("anchor") is not None:
        if data["anchor"] not in ("start", "end"):
            raise OpError("anchor: start или end")
        c.anchor = data["anchor"]
    if data.get("offset") is not None:
        c.offset = float(data["offset"])
    if "duration" in data:
        c.duration = None if not data["duration"] else max(0.5, min(30.0, float(data["duration"])))
    for key, lo, hi in (("volume", -40.0, 12.0), ("fade_in", 0.0, 20.0), ("fade_out", 0.0, 20.0)):
        if data.get(key) is not None:
            setattr(c, key, max(lo, min(hi, float(data[key]))))
    if not c.prompt:
        raise OpError("У звука должно быть описание (prompt, по-английски)")


def set_cues(db: Session, p: Project, cues: list[dict[str, Any]]) -> list[SoundCue]:
    """Replace all sound cues. A cue passed with its ``id`` keeps its generated audio
    (unless its prompt or length changed – then it is generated again on request)."""
    old = {c.id: c for c in p.sound_cues}
    keep: list[SoundCue] = []
    for data in cues:
        cid = data.get("id")
        c = old.get(int(cid)) if cid else None
        if cid and c is None:
            raise OpError(f"Звук #{cid} не принадлежит этой серии")
        if c is None:
            c = SoundCue(project_id=p.id)
            db.add(c)
        _cue_fields(p, data, c)
        keep.append(c)
    keep_ids = {id(c) for c in keep}
    for c in old.values():
        if id(c) not in keep_ids:
            path = to_abs(c.audio_file)
            if path and path.exists():
                path.unlink(missing_ok=True)
            db.delete(c)
    db.flush()
    db.refresh(p)
    return keep


def add_cue(db: Session, p: Project, data: dict[str, Any]) -> SoundCue:
    c = SoundCue(project_id=p.id)
    _cue_fields(p, data, c)
    db.add(c)
    db.flush()
    return c


def update_cue(db: Session, c: SoundCue, data: dict[str, Any]) -> SoundCue:
    _cue_fields(c.project, {"kind": c.kind, **data}, c)
    db.flush()
    return c


def delete_cue(db: Session, c: SoundCue) -> None:
    path = to_abs(c.audio_file)
    if path and path.exists():
        path.unlink(missing_ok=True)
    db.delete(c)
    db.flush()


# ===================================================================== actions
def _busy(track_id: int, kinds: set[str]) -> None:
    if runner.active_for_track(track_id, kinds):
        raise OpError("Для этой серии уже выполняется такая задача — дождитесь её завершения", 409)


def start_episode_job(db: Session, p: Project, kind: str, params: dict[str, Any] | None = None) -> int:
    """Queue an episode job (``episode_voice``, ``episode_sounds``, ``episode_assemble`` or a
    usual track job – ``prompts``, ``images``, ``render``, ``preview``, ``metadata``, ``thumbnails``…)."""
    track = episode_track(p)
    exclusive = {"episode_voice", "episode_assemble", "voice"}
    _busy(track.id, {kind} | (exclusive if kind in exclusive else set()))
    title = f"{kind_title(kind)} · {p.name}"
    job = runner.enqueue(kind, project_id=p.id, track_id=track.id, params={**(params or {}), "series_id": p.series_id},
                         title=title)
    track_changed(track.id, "jobs")
    return job.id


def start_refs_job(db: Session, series: Series, params: dict[str, Any]) -> int:
    running = [j for j in active_jobs(db, series_id=series.id) if j["kind"] == "series_refs"]
    if running:
        raise OpError("Референсы этого сериала уже рисуются — дождитесь завершения задачи", 409)
    job = runner.enqueue("series_refs", params={**params, "series_id": series.id},
                         title=f"{kind_title('series_refs')} · {series.name}")
    return job.id


def series_context(db: Session, s: Series) -> dict[str, Any]:
    """Everything a writer needs before the next episode: world, cast, places and what happened so far."""
    d = series_to_dict(db, s, full=True)
    d["story_so_far"] = [
        {"number": p.episode_number, "title": p.name, "synopsis": p.synopsis, "summary": p.episode_summary}
        for p in _episodes(db, s.id)
    ]
    return d
