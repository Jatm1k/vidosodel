"""Effect previews: short clips of one camera move, transition or atmosphere effect."""
from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Project, Scene, Track
from ..render import fx_preview
from ..storage import media_root, media_url, to_abs, to_rel

router = APIRouter(prefix="/api", tags=["previews"])

#: Most recent images of a channel/project considered for previews.
POOL = 40


class PreviewRequest(BaseModel):
    kind: Literal["motion", "transition", "atmosphere"]
    effect: str
    channel_id: int | None = None
    project_id: int | None = None
    #: Which of the recent images to use (the "another picture" button increments it).
    pick: int = 0
    #: The settings being edited (render section values + ``atmosphere``), not the saved ones.
    settings: dict[str, Any] = Field(default_factory=dict)


def _images(db: Session, channel_id: int | None, project_id: int | None) -> list[str]:
    """Recent existing scene images of the project, else of the channel."""
    q = select(Scene.image_file).join(Track, Scene.track_id == Track.id).where(Scene.image_file.is_not(None))
    if project_id:
        q = q.where(Track.project_id == project_id)
    elif channel_id:
        q = q.join(Project, Track.project_id == Project.id).where(Project.channel_id == channel_id)
    else:
        return []
    out: list[str] = []
    for (rel,) in db.execute(q.order_by(Scene.id.desc()).limit(POOL * 3)):
        p = to_abs(rel)
        if p and p.exists() and str(p) not in out:
            out.append(str(p))
        if len(out) >= POOL:
            break
    return out


@router.post("/fx-preview")
async def fx_preview_clip(body: PreviewRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    pool = _images(db, body.channel_id, body.project_id)
    if not pool and body.project_id:  # a fresh project: borrow the channel's images
        project = db.get(Project, body.project_id)
        pool = _images(db, project.channel_id, None) if project else []
    images = [pool[(body.pick + i) % len(pool)] for i in range(min(2, len(pool)))] if pool else []
    out_dir = media_root() / "fx_previews"
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        clip = await run_in_threadpool(fx_preview.render, body.kind, body.effect, images, body.settings, out_dir)
    except fx_preview.PreviewError as e:
        raise HTTPException(400, str(e)) from e
    return {"url": media_url(to_rel(clip)), "own_images": bool(pool), "images": len(pool)}
