"""Project characters: reference portraits that keep recurring people consistent."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..jobs.character_jobs import portrait_path_unique
from ..jobs.common import master_track
from ..jobs.events import track_changed
from ..jobs.runner import runner
from ..models import Character, Project
from ..render.media import cover_fit, imread, imwrite
from ..storage import media_url, to_abs, to_rel, unique_name

router = APIRouter(prefix="/api", tags=["characters"])

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def character_to_dict(c: Character) -> dict[str, Any]:
    return {
        "id": c.id, "name": c.name, "description": c.description, "position": c.position,
        "image_url": media_url(c.image_file), "image_status": c.image_status,
        "image_error": c.image_error, "image_origin": c.image_origin,
    }


def _character(db: Session, char_id: int) -> Character:
    c = db.get(Character, char_id)
    if c is None:
        raise HTTPException(404, "Персонаж не найден")
    return c


def _changed(db: Session, project: Project) -> None:
    master = master_track(db, project)
    if master:
        track_changed(master.id, "characters")


@router.get("/projects/{project_id}/characters")
def list_characters(project_id: int, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(404, "Проект не найден")
    return [character_to_dict(c) for c in project.characters]


class CharacterIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = ""


@router.post("/projects/{project_id}/characters")
def add_character(project_id: int, body: CharacterIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(404, "Проект не найден")
    pos = max((c.position for c in project.characters), default=-1) + 1
    c = Character(project_id=project_id, position=pos, name=body.name.strip(), description=body.description.strip())
    db.add(c)
    db.commit()
    _changed(db, project)
    return character_to_dict(c)


class CharacterPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None


@router.patch("/characters/{char_id}")
def update_character(char_id: int, body: CharacterPatch, db: Session = Depends(get_db)) -> dict[str, Any]:
    c = _character(db, char_id)
    if body.name is not None:
        c.name = body.name.strip()
    if body.description is not None:
        c.description = body.description.strip()
    db.commit()
    _changed(db, c.project)
    return character_to_dict(c)


@router.delete("/characters/{char_id}")
def delete_character(char_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    c = _character(db, char_id)
    project = c.project
    path = to_abs(c.image_file)
    db.delete(c)
    db.commit()
    if path and path.exists():
        path.unlink(missing_ok=True)
    _changed(db, project)
    return {"ok": True}


@router.post("/characters/{char_id}/image")
async def upload_portrait(char_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict[str, Any]:
    """Own photo or drawing of the character; it is never replaced automatically."""
    c = _character(db, char_id)
    if Path(file.filename or "").suffix.lower() not in IMAGE_EXT:
        raise HTTPException(400, "Нужен файл изображения (jpg, png, webp)")
    dest = portrait_path_unique(c.project_id, c.id)
    raw = dest.with_name(unique_name(f"upload_{c.id}", ".bin"))
    raw.write_bytes(await file.read())
    try:
        img = imread(raw)
    except ValueError as exc:
        raise HTTPException(400, "Не удалось прочитать изображение") from exc
    finally:
        raw.unlink(missing_ok=True)
    h, w = img.shape[:2]
    if max(h, w) > 2048:  # references are downscaled anyway; keep files small
        scale = 2048 / max(h, w)
        img = cover_fit(img, int(w * scale), int(h * scale))
    imwrite(dest, img, quality=92)
    old = to_abs(c.image_file)
    c.image_file, c.image_status, c.image_error, c.image_origin = to_rel(dest), "done", None, "upload"
    db.commit()
    if old and old.exists() and old != dest:
        old.unlink(missing_ok=True)
    _changed(db, c.project)
    return character_to_dict(c)


class CharactersRun(BaseModel):
    #: Search the script again (adds people that are not in the list yet).
    rescan: bool = False
    #: Redraw the portraits of these characters (with ``force``) or draw missing ones.
    character_ids: list[int] | None = None
    force: bool = False


@router.post("/projects/{project_id}/characters/run")
def run_characters(project_id: int, body: CharactersRun, db: Session = Depends(get_db)) -> dict[str, Any]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(404, "Проект не найден")
    master = master_track(db, project)
    if master is None:
        raise HTTPException(400, "В проекте нет языковых версий")
    if runner.active_for_track(master.id, {"characters"}):
        raise HTTPException(409, "Персонажи уже обрабатываются — дождитесь завершения")
    job = runner.enqueue("characters", project_id=project_id, track_id=master.id,
                         params=body.model_dump(exclude_none=True))
    return {"job_id": job.id}
