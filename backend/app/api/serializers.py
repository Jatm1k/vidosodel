"""Model → JSON conversion for the API (incl. per-stage pipeline status of a track)."""
from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..jobs.common import scene_to_dict
from ..jobs.runner import job_to_dict
from ..models import Channel, Job, Project, Scene, Track
from ..pipeline.languages import LANGUAGES
from ..pipeline.llm_tasks import build_description
from ..settings_schema import effective_settings
from ..storage import media_url
from .characters import character_to_dict


def channel_to_dict(db: Session, ch: Channel) -> dict[str, Any]:
    projects = db.scalar(select(func.count(Project.id)).where(Project.channel_id == ch.id)) or 0
    return {
        "id": ch.id, "name": ch.name, "description": ch.description, "color": ch.color,
        "settings": ch.settings or {}, "projects_count": projects,
        "created_at": ch.created_at.isoformat(), "updated_at": ch.updated_at.isoformat(),
    }


def _scene_stats(db: Session, track: Track) -> dict[str, int]:
    rows = db.execute(
        select(Scene.image_status, Scene.prompt != "", Scene.source_scene_id.isnot(None), func.count())
        .where(Scene.track_id == track.id)
        .group_by(Scene.image_status, Scene.prompt != "", Scene.source_scene_id.isnot(None))
    ).all()
    stats = {"total": 0, "prompts": 0, "images": 0, "failed": 0, "generating": 0, "shared": 0}
    for status, has_prompt, shared, n in rows:
        stats["total"] += n
        if has_prompt:
            stats["prompts"] += n
        if shared:
            stats["shared"] += n
        if status == "done":
            stats["images"] += n
        elif status == "failed":
            stats["failed"] += n
        elif status in ("queued", "generating"):
            stats["generating"] += n
    return stats


def _publish_meta(track: Track) -> dict[str, Any]:
    """Metadata with the full description rebuilt from the current settings (footer, chapters)."""
    meta = dict(track.publish_meta or {})
    if meta.get("description") is not None:
        project = track.project
        publish = effective_settings(project.channel.settings, project.settings).publish
        meta["description_full"] = build_description(meta, publish)
    return meta


#: Production statuses of a language version, from the earliest to the last one.
STATUS_ORDER = ["draft", "voiced", "storyboard", "video", "ready", "published"]


def _status(track: Track, stages: dict[str, str]) -> str:
    """Where the version is on the channel board: derived from its data, plus the user's marks."""
    if track.published_at:
        return "published"
    if stages["video"] == "done":
        return "ready" if track.approved_at else "video"
    if stages["images"] == "done":
        return "storyboard"
    if stages["voice"] == "done":
        return "voiced"
    return "draft"


def track_summary(db: Session, track: Track) -> dict[str, Any]:
    """Compact track info with the status of every pipeline stage."""
    stats = _scene_stats(db, track)
    project = track.project
    is_master = project.master_track_id in (None, track.id)
    shares = project.image_mode == "shared" and not is_master
    active = [job_to_dict(j) for j in db.scalars(
        select(Job).where(Job.track_id == track.id, Job.status.in_(("queued", "running"))).order_by(Job.id))]
    # Latest job of each kind; if it failed, the UI shows its error next to the stage.
    latest: dict[str, Job] = {}
    for j in db.scalars(select(Job).where(Job.track_id == track.id).order_by(Job.id)):
        latest[j.kind] = j
    failed = [job_to_dict(j) for j in latest.values() if j.status == "failed"]
    lang = LANGUAGES.get(track.language, (track.language, track.language, ""))

    def stage(done: bool, partial: bool = False) -> str:
        return "done" if done else ("partial" if partial else "empty")

    total = stats["total"]
    stages = {
        "script": stage(bool((track.script or "").strip())),
        "voice": stage(bool(track.audio_file)),
        "timings": stage(bool(track.timings_file) and track.timings_origin != "estimate",
                         track.timings_origin == "estimate"),
        "scenes": stage(total > 0),
        "prompts": stage(shares and total > 0 or (total > 0 and stats["prompts"] == total), stats["prompts"] > 0),
        "images": stage(total > 0 and (shares or stats["images"] == total), stats["images"] > 0),
        "video": stage(bool(track.video_file)),
        "publish": stage(bool(track.publish_meta), bool(track.thumbnails)),
    }
    return {
        "id": track.id, "project_id": track.project_id, "language": track.language,
        "language_name": lang[0], "flag": lang[2], "position": track.position,
        "is_master": is_master, "shares_images": shares,
        "script_chars": len(track.script or ""), "script_origin": track.script_origin,
        "audio_url": media_url(track.audio_file), "audio_duration": track.audio_duration,
        "audio_origin": track.audio_origin, "timings_origin": track.timings_origin,
        "srt_url": media_url(track.srt_file), "voice_meta": track.voice_meta or {},
        "video_url": media_url(track.video_file), "video_meta": track.video_meta or {},
        "video_srt_url": media_url((track.video_meta or {}).get("srt")),
        "preview_url": media_url(track.preview_file),
        "thumbnails": [media_url(t) for t in track.thumbnails or []],
        "publish_meta": _publish_meta(track),
        "scene_stats": stats,
        "stages": stages,
        "status": _status(track, stages),
        "approved_at": track.approved_at, "published_at": track.published_at,
        "active_jobs": active,
        "failed_jobs": failed,
        "updated_at": track.updated_at.isoformat(),
    }


def project_to_dict(db: Session, project: Project, *, full: bool = False) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": project.id, "channel_id": project.channel_id, "name": project.name,
        "image_mode": project.image_mode, "master_track_id": project.master_track_id,
        "created_at": project.created_at.isoformat(), "updated_at": project.updated_at.isoformat(),
        "languages": [t.language for t in project.tracks],
    }
    cover = db.scalar(
        select(Scene.image_file).join(Track, Track.id == Scene.track_id)
        .where(Track.project_id == project.id, Scene.image_file.isnot(None)).order_by(Scene.idx).limit(1)
    )
    data["cover_url"] = media_url(cover)
    summaries = [track_summary(db, t) for t in project.tracks]
    data["progress"] = _project_progress(summaries)
    data.update(_project_status(summaries))
    if full:
        data["settings"] = project.settings or {}
        data["visual_context"] = project.visual_context
        data["characters"] = [character_to_dict(c) for c in project.characters]
        data["tracks"] = summaries
    return data


def _project_status(tracks: list[dict[str, Any]]) -> dict[str, Any]:
    """Board column of the project: the least advanced language decides it."""
    per_track = [{
        "id": t["id"], "language": t["language"], "status": t["status"],
        "running": bool(t["active_jobs"]), "failed": bool(t["failed_jobs"]),
        "has_script": t["stages"]["script"] == "done", "published_at": t["published_at"],
    } for t in tracks]
    status = min((t["status"] for t in per_track), key=STATUS_ORDER.index, default="draft")
    return {"status": status, "tracks_status": per_track}


def _project_progress(tracks: list[dict[str, Any]]) -> dict[str, Any]:
    order = ["script", "voice", "scenes", "prompts", "images", "video"]
    if not tracks:
        return {"percent": 0, "label": "Пусто", "videos": 0}
    done = sum(sum(1 for k in order if t["stages"][k] == "done") for t in tracks)
    videos = sum(1 for t in tracks if t["stages"]["video"] == "done")
    running = any(t["active_jobs"] for t in tracks)
    percent = int(done / (len(order) * len(tracks)) * 100)
    label = "В работе" if running else ("Готово" if videos == len(tracks) else "Черновик")
    return {"percent": percent, "label": label, "videos": videos, "running": running}


__all__ = ["channel_to_dict", "project_to_dict", "scene_to_dict", "track_summary"]
