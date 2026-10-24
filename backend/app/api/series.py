"""Series, their cast and places, episodes, screenplay blocks and sound cues (UI API).

The same operations are available to an AI agent through the MCP server; both call
:mod:`app.series_ops`.
"""
from __future__ import annotations

import hashlib
import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import series_ops as ops
from ..db import get_db
from ..models import EpisodeBlock, Series, SeriesCharacter, SeriesLocation, SoundCue
from ..pipeline import episode as ep
from ..services import gemini_tts
from ..services.http import ApiError
from ..storage import media_root, media_url, to_rel

router = APIRouter(prefix="/api", tags=["series"])

EPISODE_JOBS = {"episode_voice", "episode_sounds", "episode_assemble", "transcribe_block", "prompts", "images",
                "render", "preview", "metadata", "thumbnails"}


def _http(exc: ops.OpError) -> HTTPException:
    return HTTPException(exc.status, exc.message)


class _Ops:
    """Context manager: commit on success, OpError → HTTP error."""

    def __init__(self, db: Session):
        self.db = db

    def __enter__(self) -> Session:
        return self.db

    def __exit__(self, exc_type, exc, _tb) -> bool:
        if exc is None:
            self.db.commit()
            return False
        self.db.rollback()
        if isinstance(exc, ops.OpError):
            raise _http(exc) from exc
        return False


def _series(db: Session, series_id: int) -> Series:
    try:
        return ops.get_series(db, series_id)
    except ops.OpError as exc:
        raise _http(exc) from exc


def _episode(db: Session, project_id: int):
    try:
        return ops.get_episode(db, project_id)
    except ops.OpError as exc:
        raise _http(exc) from exc


def _changed(series_id: int | None, what: str, project_id: int | None = None) -> None:
    ops.notify(series_id, what, project_id)


# ===================================================================== series
@router.get("/series")
def list_series(channel_id: int | None = None, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    q = select(Series).order_by(Series.updated_at.desc())
    if channel_id:
        q = q.where(Series.channel_id == channel_id)
    return [ops.series_to_dict(db, s) for s in db.scalars(q)]


@router.post("/series")
def create_series(body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    with _Ops(db):
        s = ops.create_series(db, body)
    return ops.series_to_dict(db, s, full=True)


@router.get("/series/{series_id}")
def get_series(series_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    return ops.series_to_dict(db, _series(db, series_id), full=True)


@router.patch("/series/{series_id}")
def update_series(series_id: int, body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    s = _series(db, series_id)
    with _Ops(db):
        ops.update_series(db, s, body)
    _changed(series_id, "series")
    return ops.series_to_dict(db, s, full=True)


@router.delete("/series/{series_id}")
def delete_series(series_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    s = _series(db, series_id)
    with _Ops(db):
        ops.delete_series(db, s)
    return {"ok": True}


@router.post("/series/{series_id}/refs")
def generate_refs(series_id: int, body: dict[str, Any] | None = None, db: Session = Depends(get_db)) -> dict[str, Any]:
    s = _series(db, series_id)
    body = body or {}
    with _Ops(db):
        job_id = ops.start_refs_job(db, s, {"character_ids": body.get("character_ids") or [],
                                            "location_ids": body.get("location_ids") or [],
                                            "prompts": body.get("prompts") or {}})
    return {"job_id": job_id}


# ===================================================================== characters & locations
def _ref(db: Session, kind: str, ref_id: int) -> SeriesCharacter | SeriesLocation:
    obj = db.get(SeriesCharacter if kind == "characters" else SeriesLocation, ref_id)
    if obj is None:
        raise HTTPException(404, "Не найдено")
    return obj


@router.post("/series/{series_id}/characters")
def add_character(series_id: int, body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    return _add_ref(db, series_id, "characters", body)


@router.post("/series/{series_id}/locations")
def add_location(series_id: int, body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    return _add_ref(db, series_id, "locations", body)


def _add_ref(db: Session, series_id: int, kind: str, body: dict[str, Any]) -> dict[str, Any]:
    s = _series(db, series_id)
    with _Ops(db):
        obj = ops.upsert_character(db, s, body) if kind == "characters" else ops.upsert_location(db, s, body)
    _changed(series_id, kind)
    return ops.ref_to_dict(obj)


@router.patch("/series-refs/{kind}/{ref_id}")
def update_ref(kind: str, ref_id: int, body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    if kind not in ("characters", "locations"):
        raise HTTPException(404)
    obj = _ref(db, kind, ref_id)
    s = obj.series
    with _Ops(db):
        if kind == "characters":
            obj = ops.upsert_character(db, s, body, ref_id)
        else:
            obj = ops.upsert_location(db, s, body, ref_id)
    _changed(s.id, kind)
    return ops.ref_to_dict(obj)


@router.delete("/series-refs/{kind}/{ref_id}")
def delete_ref(kind: str, ref_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    if kind not in ("characters", "locations"):
        raise HTTPException(404)
    obj = _ref(db, kind, ref_id)
    series_id = obj.series_id
    with _Ops(db):
        ops.delete_ref(db, obj)
    _changed(series_id, kind)
    return {"ok": True}


@router.post("/series-refs/{kind}/{ref_id}/image")
async def upload_ref_image(kind: str, ref_id: int, file: UploadFile = File(...),
                           db: Session = Depends(get_db)) -> dict[str, Any]:
    if kind not in ("characters", "locations"):
        raise HTTPException(404)
    obj = _ref(db, kind, ref_id)
    suffix = Path(file.filename or "img.jpg").suffix.lower() or ".jpg"
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / f"upload{suffix}"
        src.write_bytes(await file.read())
        with _Ops(db):
            ops.set_ref_image(db, obj, src)
    _changed(obj.series_id, kind)
    return ops.ref_to_dict(obj)


# ===================================================================== episodes
@router.post("/series/{series_id}/episodes")
def create_episode(series_id: int, body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    s = _series(db, series_id)
    with _Ops(db):
        p = ops.create_episode(db, s, body)
    _changed(series_id, "episodes")
    return ops.episode_summary_dict(db, p)


@router.get("/episodes/{project_id}")
def get_episode(project_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    return ops.episode_to_dict(db, _episode(db, project_id))


@router.patch("/episodes/{project_id}")
def update_episode(project_id: int, body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    p = _episode(db, project_id)
    with _Ops(db):
        ops.update_episode(db, p, body)
    _changed(p.series_id, "episodes", project_id)
    return ops.episode_to_dict(db, p)


@router.delete("/episodes/{project_id}")
def delete_episode(project_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    p = _episode(db, project_id)
    series_id = p.series_id
    with _Ops(db):
        ops.delete_episode(db, p)
    _changed(series_id, "episodes")
    return {"ok": True}


class BlocksIn(BaseModel):
    blocks: list[dict[str, Any]]
    after_block_id: int | None = None


@router.put("/episodes/{project_id}/screenplay")
def set_screenplay(project_id: int, body: BlocksIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    p = _episode(db, project_id)
    with _Ops(db):
        ops.set_screenplay(db, p, body.blocks)
    _changed(p.series_id, "blocks", project_id)
    return ops.episode_to_dict(db, p)


@router.post("/episodes/{project_id}/blocks")
def insert_blocks(project_id: int, body: BlocksIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    p = _episode(db, project_id)
    with _Ops(db):
        ops.insert_blocks(db, p, body.blocks, body.after_block_id)
    _changed(p.series_id, "blocks", project_id)
    return ops.episode_to_dict(db, p)


@router.patch("/blocks/{block_id}")
def update_block(block_id: int, body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    b = db.get(EpisodeBlock, block_id)
    if b is None:
        raise HTTPException(404, "Блок не найден")
    p = b.project
    with _Ops(db):
        ops.update_block(db, b, body)
    _changed(p.series_id, "blocks", p.id)
    return ops.episode_to_dict(db, p)


@router.delete("/blocks/{block_id}")
def delete_block(block_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    b = db.get(EpisodeBlock, block_id)
    if b is None:
        raise HTTPException(404, "Блок не найден")
    p = b.project
    with _Ops(db):
        ops.delete_blocks(db, p, [block_id])
    _changed(p.series_id, "blocks", p.id)
    return ops.episode_to_dict(db, p)


class CuesIn(BaseModel):
    cues: list[dict[str, Any]]


@router.put("/episodes/{project_id}/cues")
def set_cues(project_id: int, body: CuesIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    p = _episode(db, project_id)
    with _Ops(db):
        ops.set_cues(db, p, body.cues)
    _changed(p.series_id, "cues", project_id)
    return ops.episode_to_dict(db, p)


@router.post("/episodes/{project_id}/cues")
def add_cue(project_id: int, body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    p = _episode(db, project_id)
    with _Ops(db):
        ops.add_cue(db, p, body)
    _changed(p.series_id, "cues", project_id)
    return ops.episode_to_dict(db, p)


@router.patch("/cues/{cue_id}")
def update_cue(cue_id: int, body: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    c = db.get(SoundCue, cue_id)
    if c is None:
        raise HTTPException(404, "Звук не найден")
    p = c.project
    with _Ops(db):
        ops.update_cue(db, c, body)
    _changed(p.series_id, "cues", p.id)
    return ops.episode_to_dict(db, p)


@router.delete("/cues/{cue_id}")
def delete_cue(cue_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    c = db.get(SoundCue, cue_id)
    if c is None:
        raise HTTPException(404, "Звук не найден")
    p = c.project
    with _Ops(db):
        ops.delete_cue(db, c)
    _changed(p.series_id, "cues", p.id)
    return ops.episode_to_dict(db, p)


@router.post("/episodes/{project_id}/jobs/{kind}")
def start_job(project_id: int, kind: str, params: dict[str, Any] | None = None,
              db: Session = Depends(get_db)) -> dict[str, Any]:
    if kind not in EPISODE_JOBS:
        raise HTTPException(400, "Неизвестное действие")
    p = _episode(db, project_id)
    with _Ops(db):
        job_id = ops.start_episode_job(db, p, kind, params or {})
    return {"job_id": job_id}


# ===================================================================== Gemini TTS
@router.get("/gemini/status")
def gemini_status() -> dict[str, Any]:
    return gemini_tts.usage_status()


@router.get("/gemini/voices")
def gemini_voices() -> list[dict[str, str]]:
    return [{"voice": n, "gender": g, "character": c} for n, (g, c) in gemini_tts.VOICES.items()]


@router.get("/gemini/models")
def gemini_models() -> list[str]:
    try:
        with gemini_tts.GeminiTts() as g:
            return g.tts_models()
    except ApiError as exc:
        raise HTTPException(400, exc.message) from exc


class PreviewIn(BaseModel):
    voice: str
    style: str = ""
    text: str
    language: str = "ru"
    direction: str = ""


@router.post("/gemini/preview")
def gemini_preview(body: PreviewIn) -> dict[str, Any]:
    """Voice a sample line (spends one Gemini request; the same sample is cached)."""
    if body.voice not in gemini_tts.VOICES:
        raise HTTPException(400, "Неизвестный голос")
    probe = SeriesCharacter(name="Speaker", voice={"provider": "gemini", "voice": body.voice, "style": body.style})
    prompt = ep.line_prompt(body.text[:300], body.direction, probe, body.language)
    digest = hashlib.sha256(f"{body.voice}|{prompt}".encode()).hexdigest()[:16]
    dest = media_root() / "voice_previews" / f"gemini_{digest}.wav"
    if not dest.exists():
        try:
            with gemini_tts.GeminiTts() as g:
                g.synthesize(prompt, body.voice, dest)
        except ApiError as exc:
            raise HTTPException(400, exc.message) from exc
    return {"url": media_url(to_rel(dest))}
