"""Inflight account, durable tasks and per-scene footage controls."""
from __future__ import annotations

from pathlib import Path
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..jobs.common import load_track, scene_to_dict
from ..jobs.events import scene_changed, track_changed
from ..jobs.runner import runner
from ..models import MediaGeneration, Scene
from ..motion import store as motion_store
from ..pipeline.footage import wants_video, scene_first_frame, generation_mode
from ..pipeline import characters as chars
from ..render.media import imread, imwrite, probe_duration
from ..services.inflight import FINAL, InflightClient, media_path
from ..services.inflight_queue import ADMISSION, local_remaining
from ..settings_store import load_config
from ..storage import media_url, to_abs, to_rel, track_dir, unique_name
from .projects import _save_upload, _scene, _track, _busy

router = APIRouter(prefix="/api", tags=["footage"])


@router.get("/inflight/account")
def account():
    with InflightClient() as client:
        return {"account": client.account_info(), "usage": client.usage()}


@router.get("/inflight/tasks")
def tasks(track_id: int | None = None, db: Session = Depends(get_db)):
    with InflightClient() as client:
        q = select(MediaGeneration).where(MediaGeneration.account == client.account, MediaGeneration.provider == "inflight")
        if track_id is not None:
            track = _track(db, track_id)
            owners = [f"scene:{s.id}:{kind}" for s in track.scenes for kind in ("video", "image", "frame")]
            q = q.where(MediaGeneration.owner.in_(owners))
        rows = db.scalars(q.order_by(MediaGeneration.id.desc()).limit(200)).all()
        return {"tasks": [{"id": r.id, "owner": r.owner, "kind": r.kind, "mode": r.mode,
            "state": r.state, "remote_id": r.remote_id, "error": r.error,
            "server_mode": r.result.get("mode"), "request_audit": r.payload.get("_request_audit"),
            "url": media_url(r.file), "submitted_at": r.submitted_at} for r in rows],
            "local_remaining": local_remaining(db, client.account, load_config())}


class CancelTask(BaseModel):
    hard: bool = False


@router.post("/inflight/tasks/{task_id}/cancel")
def cancel(task_id: int, body: CancelTask, db: Session = Depends(get_db)):
    with ADMISSION, InflightClient() as client:
        row = db.get(MediaGeneration, task_id)
        if not row or row.account != client.account or row.provider != "inflight":
            raise HTTPException(404, "Задание не найдено")
        if row.state in FINAL:
            return {"state": row.state}
        if row.state in ("submitting", "unknown") and not row.remote_id:
            raise HTTPException(409, "Сначала укажите ID удалённого задания")
        result = client.cancel(row.remote_id, body.hard) if row.remote_id else {"state": "cancelled"}
        row.state, row.result = result.get("state", row.state), result
        db.commit()
        return result


class AttachTask(BaseModel):
    remote_id: str = Field(min_length=1, max_length=200)


class CancelTasks(BaseModel):
    ids: list[int] = Field(min_length=1, max_length=200)


@router.post("/inflight/cancel-tasks")
def cancel_tasks(body: CancelTasks, db: Session = Depends(get_db)):
    """Hard cancel only named local tasks, never other applications' tasks on this key."""
    with ADMISSION, InflightClient() as client:
        rows = db.scalars(select(MediaGeneration).where(MediaGeneration.id.in_(body.ids),
            MediaGeneration.account == client.account, MediaGeneration.provider == "inflight", MediaGeneration.state.notin_(FINAL))).all()
        remote = [r.remote_id for r in rows if r.remote_id]
        result = client.request("POST", "/tasks/hard-cancel", json={"ids": remote}) if remote else {}
        cancelled = set(result.get("cancelled_ids") or [])
        count = 0
        for row in rows:
            if row.state == "queued" or row.remote_id in cancelled:
                row.state, row.error = "cancelled", "HARD_CANCELLED"
                count += 1
        db.commit()
        return {"cancelled_count": count}


@router.post("/inflight/tasks/{task_id}/attach")
def attach(task_id: int, body: AttachTask, db: Session = Depends(get_db)):
    with ADMISSION, InflightClient() as client:
        row = db.get(MediaGeneration, task_id)
        if not row or row.account != client.account or row.provider != "inflight":
            raise HTTPException(404, "Задание не найдено")
        if row.state not in ("submitting", "unknown"):
            raise HTTPException(409, "ID можно привязать только к неподтверждённой отправке")
        if db.scalar(select(MediaGeneration.id).where(MediaGeneration.remote_id == body.remote_id,
                MediaGeneration.account == client.account, MediaGeneration.id != row.id)):
            raise HTTPException(409, "Это задание уже привязано")
        result = client.request("GET", "/tasks/" + quote(body.remote_id, safe=""))
        if result.get("client_ref") != f"vidosodel-{row.id}":
            raise HTTPException(409, f"client_ref не совпадает с vidosodel-{row.id}")
        row.remote_id, row.state, row.result, row.error = body.remote_id, result["state"], result, None
        db.commit()
        return {"ok": True}


class SceneMedia(BaseModel):
    media_type: Literal["auto", "image", "video"] = "auto"
    video_mode: Literal["inherit", "auto", "t2v", "i2v", "ref2v", "im2v"] = "inherit"
    video_prompt: str = Field(default="", max_length=5800)
    first_frame: str | None = None
    references: list[str] = Field(default_factory=list, max_length=10)
    clip_fit: Literal["loop", "freeze", "stretch"] = "freeze"
    clip_start: float = Field(default=0, ge=0)
    clip_speed: float = Field(default=1, ge=.1, le=4)
    characters: list[int] | None = None


@router.put("/scenes/{scene_id}/media")
def scene_media(scene_id: int, body: SceneMedia, db: Session = Depends(get_db)):
    scene = _scene(db, scene_id)
    if scene.source_scene_id:
        raise HTTPException(409, "Измените видеоряд в основном языке")
    _busy(scene.track_id, {"videos", "video_prompts", "images", "render", "preview"})
    try:
        for path in body.references + ([body.first_frame] if body.first_frame else []):
            media_path(path)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    data = body.model_dump(exclude={"characters"})
    scene.overrides = {**(scene.overrides or {}), **data}
    if body.characters is not None:
        allowed = {c.id for c in scene.track.project.characters}
        if not set(body.characters) <= allowed:
            raise HTTPException(422, "Герой не принадлежит проекту")
        scene.characters = list(dict.fromkeys(body.characters))
    db.commit()
    scene_changed(scene.track_id, scene_to_dict(scene))
    return scene_to_dict(scene)


@router.post("/scenes/{scene_id}/references")
async def upload_reference(scene_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    sc = _scene(db, scene_id)
    dest = track_dir(sc.track.project_id, sc.track_id, "refs") / unique_name("reference", ".jpg")
    raw = await _save_upload(file, dest.with_suffix(".raw"))
    try:
        imwrite(dest, imread(raw), quality=95)
    except Exception as exc:
        raise HTTPException(422, "Не удалось прочитать референс") from exc
    finally:
        raw.unlink(missing_ok=True)
    return {"path": to_rel(dest), "url": media_url(to_rel(dest))}


@router.post("/scenes/{scene_id}/video")
async def upload_video(scene_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    sc = _scene(db, scene_id)
    _busy(sc.track_id, {"videos", "render", "preview"})
    if Path(file.filename or "").suffix.lower() not in (".mp4", ".webm", ".mov", ".mkv"):
        raise HTTPException(422, "Нужен видеоклип mp4, webm, mov или mkv")
    dest = track_dir(sc.track.project_id, sc.track_id, "clips") / unique_name("upload", Path(file.filename).suffix.lower())
    await _save_upload(file, dest)
    try:
        duration = probe_duration(dest)
        if duration <= 0:
            raise ValueError("empty")
        from ..render.footage import FootageReader
        reader = FootageReader(160, 90)
        try:
            reader.frame(str(dest), 0, duration)
        finally:
            reader.close()
    except Exception as exc:
        dest.unlink(missing_ok=True)
        raise HTTPException(422, "Не удалось прочитать видеоклип") from exc
    sc.video_file, sc.video_status, sc.video_error = to_rel(dest), "done", None
    sc.video_meta = {"uploaded": True, "filename": file.filename, "duration": duration}
    sc.overrides = {**(sc.overrides or {}), "media_type": "video"}
    sc.source_scene_id = None
    db.commit()
    track_changed(sc.track_id, "videos")
    return scene_to_dict(sc)


@router.delete("/scenes/{scene_id}/video")
def delete_video(scene_id: int, db: Session = Depends(get_db)):
    sc = _scene(db, scene_id)
    _busy(sc.track_id, {"videos", "render", "preview"})
    sc.video_file, sc.video_status, sc.video_error, sc.video_meta = None, "none", None, {}
    db.commit()
    track_changed(sc.track_id, "videos")
    return scene_to_dict(sc)


@router.get("/tracks/{track_id}/media-plan")
def media_plan(track_id: int, db: Session = Depends(get_db)):
    tc = load_track(db, track_id)
    skip = motion_store.motion_scene_idxs(tc.track.motion)
    def source(s):
        return s.source_scene if s.source_scene_id and s.source_scene else s
    video = [s for s in tc.track.scenes if s.idx not in skip and wants_video(source(s), tc.settings)]
    images = [s for s in tc.track.scenes if s.idx not in skip and not wants_video(source(s), tc.settings)]
    owner = motion_store.slot_owner(tc.track.motion)
    cast = list(tc.project.characters)
    portraits = {c.id: media_url(c.image_file) for c in cast}
    planned = []
    for scene in tc.track.scenes:
        src = source(scene)
        kind = "motion" if scene.idx in skip else ("video" if wants_video(src, tc.settings) else "image")
        requested = generation_mode(src, tc.settings)
        mode = "i2v" if requested == "auto" else requested
        ids = src.characters if src.characters is not None else chars.mentioned(src.prompt, cast)
        enabled = tc.settings.videos.character_refs if kind == "video" else tc.settings.images.character_refs
        planned.append({"id": scene.id, "kind": kind,
            "status": ("done" if owner.get(scene.idx) else "planned") if kind == "motion" else
                      ((src.video_status or "none") if kind == "video" else (src.image_status or "none")),
            "generation": mode if kind == "video" else None,
            "requested_generation": requested if kind == "video" else None,
            "first_frame_url": media_url(scene_first_frame(src)) if kind == "video" and mode == "i2v" else None,
            "character_refs_enabled": enabled,
            "characters": [{"id": c.id, "name": c.name, "url": portraits[c.id]} for c in cast if c.id in ids]})
    return {"video": len(video), "image": len(images), "motion": len(skip),
            "video_missing": sum(not source(s).video_file for s in video),
            "image_missing": sum(not source(s).image_file for s in images),
            "shares_media": tc.shares_images,
            "scenes": planned}
