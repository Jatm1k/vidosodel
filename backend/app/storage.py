"""File layout of the media folder and path helpers.

::

    data/media/
      channels/<channel_id>/refs/...           style reference images
      projects/<project_id>/tracks/<track_id>/
          audio/voice.mp3, timings.json, subtitles.srt
          images/scene_<id>_<n>.jpg
          render/<work files>, video.mp4, preview.mp4
          thumbs/thumb_<n>.jpg
"""
from __future__ import annotations

import re
import time
from pathlib import Path

from .config import get_settings


def media_root() -> Path:
    return get_settings().media_dir


def to_rel(path: Path) -> str:
    """Absolute media path → relative posix string stored in the DB."""
    return path.resolve().relative_to(media_root().resolve()).as_posix()


def to_abs(rel: str | None) -> Path | None:
    if not rel:
        return None
    return media_root() / rel


def media_url(rel: str | None) -> str | None:
    """URL served by the app for a media file, with a cache-busting version."""
    if not rel:
        return None
    p = to_abs(rel)
    v = int(p.stat().st_mtime) if p and p.exists() else 0
    return f"/media/{rel}?v={v}"


def track_dir(project_id: int, track_id: int, *parts: str) -> Path:
    d = media_root() / "projects" / str(project_id) / "tracks" / str(track_id)
    d = d.joinpath(*parts) if parts else d
    d.mkdir(parents=True, exist_ok=True)
    return d


def project_dir(project_id: int) -> Path:
    d = media_root() / "projects" / str(project_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def channel_dir(channel_id: int, *parts: str) -> Path:
    d = media_root() / "channels" / str(channel_id)
    d = d.joinpath(*parts) if parts else d
    d.mkdir(parents=True, exist_ok=True)
    return d


def safe_filename(name: str, default: str = "file") -> str:
    name = re.sub(r"[^\w.\- ]+", "_", name, flags=re.U).strip(" ._")
    return name[:120] or default


def unique_name(stem: str, suffix: str) -> str:
    """Time-based unique file name (keeps old versions from being overwritten while in use)."""
    return f"{stem}_{int(time.time() * 1000)}{suffix}"
