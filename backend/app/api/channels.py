"""Channels: CRUD, pipeline settings and style reference images."""
from __future__ import annotations

from typing import Any

import cv2
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Channel
from ..render.media import imread, imwrite
from ..settings_schema import effective_settings
from ..storage import channel_dir, media_url, to_abs, to_rel, unique_name
from .serializers import channel_to_dict, project_to_dict

router = APIRouter(prefix="/api/channels", tags=["channels"])


class ChannelIn(BaseModel):
    name: str
    description: str = ""
    color: str = "#7c5cff"
    settings: dict[str, Any] | None = None


class ChannelPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    settings: dict[str, Any] | None = None


def _get(db: Session, channel_id: int) -> Channel:
    ch = db.get(Channel, channel_id)
    if ch is None:
        raise HTTPException(404, "Канал не найден")
    return ch


@router.get("")
def list_channels(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    return [channel_to_dict(db, c) for c in db.scalars(select(Channel).order_by(Channel.name))]


@router.post("")
def create_channel(body: ChannelIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    ch = Channel(name=body.name.strip() or "Новый канал", description=body.description, color=body.color,
                 settings=body.settings or {})
    db.add(ch)
    db.commit()
    return channel_to_dict(db, ch)


@router.get("/{channel_id}")
def get_channel(channel_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    ch = _get(db, channel_id)
    data = channel_to_dict(db, ch)
    data["effective_settings"] = effective_settings(ch.settings).model_dump()
    refs = data["effective_settings"]["images"]["reference_images"]
    data["reference_urls"] = [{"path": r, "url": media_url(r)} for r in refs]
    data["projects"] = [project_to_dict(db, p) for p in sorted(ch.projects, key=lambda p: p.updated_at, reverse=True)]
    return data


@router.patch("/{channel_id}")
def update_channel(channel_id: int, body: ChannelPatch, db: Session = Depends(get_db)) -> dict[str, Any]:
    ch = _get(db, channel_id)
    if body.name is not None:
        ch.name = body.name.strip() or ch.name
    if body.description is not None:
        ch.description = body.description
    if body.color is not None:
        ch.color = body.color
    if body.settings is not None:
        # Validate by building effective settings; store the full section values sent by the UI.
        effective_settings(body.settings)
        ch.settings = body.settings
    db.commit()
    return get_channel(channel_id, db)


@router.delete("/{channel_id}")
def delete_channel(channel_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    ch = _get(db, channel_id)
    db.delete(ch)
    db.commit()
    return {"ok": True}


@router.post("/{channel_id}/duplicate")
def duplicate_channel(channel_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    ch = _get(db, channel_id)
    copy = Channel(name=f"{ch.name} (копия)", description=ch.description, color=ch.color,
                   settings=dict(ch.settings or {}))
    db.add(copy)
    db.commit()
    return channel_to_dict(db, copy)


@router.post("/{channel_id}/references")
async def upload_reference(channel_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict[str, Any]:
    """Add a style reference image (normalised to JPEG ≤ 2048 px)."""
    ch = _get(db, channel_id)
    raw = channel_dir(channel_id, "refs") / unique_name("upload", ".bin")
    raw.write_bytes(await file.read())
    try:
        img = imread(raw)
    except ValueError as exc:
        raise HTTPException(400, "Файл не является изображением") from exc
    finally:
        raw.unlink(missing_ok=True)
    h, w = img.shape[:2]
    if max(h, w) > 2048:
        scale = 2048 / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    dest = imwrite(channel_dir(channel_id, "refs") / unique_name("ref", ".jpg"), img, quality=92)
    settings = dict(ch.settings or {})
    images = dict(settings.get("images") or {})
    images["reference_images"] = list(images.get("reference_images") or []) + [to_rel(dest)]
    settings["images"] = images
    ch.settings = settings
    db.commit()
    return get_channel(channel_id, db)


class RefDelete(BaseModel):
    path: str


@router.post("/{channel_id}/references/delete")
def delete_reference(channel_id: int, body: RefDelete, db: Session = Depends(get_db)) -> dict[str, Any]:
    ch = _get(db, channel_id)
    settings = dict(ch.settings or {})
    images = dict(settings.get("images") or {})
    images["reference_images"] = [r for r in images.get("reference_images") or [] if r != body.path]
    settings["images"] = images
    ch.settings = settings
    db.commit()
    p = to_abs(body.path)
    if p and p.exists() and f"channels/{channel_id}/refs/" in body.path:
        p.unlink(missing_ok=True)
    return get_channel(channel_id, db)
