"""Helpers shared by job handlers: loading entities, serialising scenes, timings I/O."""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from ..models import Channel, Project, Scene, Track
from ..pipeline.timings import Timings
from ..settings_schema import PipelineSettings, effective_settings
from ..storage import media_url, to_abs
from .runner import JobError


@dataclass
class TrackCtx:
    track: Track
    project: Project
    channel: Channel
    settings: PipelineSettings

    @property
    def is_master(self) -> bool:
        return self.project.master_track_id in (None, self.track.id)

    @property
    def shares_images(self) -> bool:
        """True when this track borrows images from the master track."""
        return self.project.image_mode == "shared" and not self.is_master


def load_track(db: Session, track_id: int | None) -> TrackCtx:
    track = db.get(Track, track_id) if track_id else None
    if track is None:
        raise JobError("Языковая версия не найдена (возможно, удалена)")
    project = track.project
    channel = project.channel
    return TrackCtx(track, project, channel, effective_settings(channel.settings, project.settings))


def master_track(db: Session, project: Project) -> Track | None:
    if project.master_track_id:
        return db.get(Track, project.master_track_id)
    return project.tracks[0] if project.tracks else None


def text_hash(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()[:16]


def load_timings(track: Track) -> Timings | None:
    path = to_abs(track.timings_file)
    if path and path.exists():
        return Timings.load(path)
    return None


def scene_image(scene: Scene) -> str | None:
    """Image of a scene, following ``source_scene`` in shared mode."""
    if scene.source_scene_id and scene.source_scene is not None:
        return scene.source_scene.image_file
    return scene.image_file


def scene_to_dict(scene: Scene) -> dict[str, Any]:
    src = scene.source_scene if scene.source_scene_id else None
    image = src.image_file if src is not None else scene.image_file
    return {
        "id": scene.id, "idx": scene.idx, "start": round(scene.start, 3), "end": round(scene.end, 3),
        "text": scene.text, "prompt": src.prompt if src is not None else scene.prompt,
        "prompt_locked": scene.prompt_locked,
        "image_url": media_url(image),
        "image_status": src.image_status if src is not None else scene.image_status,
        "image_error": scene.image_error, "image_meta": scene.image_meta or {},
        "source_scene_id": scene.source_scene_id, "overrides": scene.overrides or {},
        "characters": src.characters if src is not None else scene.characters,
        "shared": src is not None,
    }
