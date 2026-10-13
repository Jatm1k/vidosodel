"""Disk usage of the media folder and its clean-up.

Everything a video is made of (script, voice-over, scenes, images) is kept: from
it the video can always be rendered again. What can go:

* ``published_videos`` – final videos of versions marked as uploaded to YouTube;
  the track remembers when its video was removed (``video_meta["removed_at"]``);
* ``depth``    – depth maps of the 3D parallax (computed again by the next render);
* ``previews`` – short preview renders;
* ``work``     – leftovers of interrupted renders;
* ``orphans``  – folders and videos no project or version refers to any more.

Versions with queued or running jobs are never touched. With
``cleanup_published_after_days`` in the app settings, videos (and depth maps)
of versions published that many days ago are removed automatically, hourly.
"""
from __future__ import annotations

import logging
import shutil
import threading
import time
from collections.abc import Iterator
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from sqlalchemy import select

from .db import session_scope
from .models import Channel, Job, Project, Track
from .settings_store import load_config
from .storage import media_root, to_abs

log = logging.getLogger(__name__)

KINDS = ("published_videos", "depth", "previews", "work", "orphans")
_DAY = 86400.0


def video_removed(track: Track) -> bool:
    """The published video was deleted to free space (the version still counts as rendered)."""
    return not track.video_file and bool(track.published_at) and bool((track.video_meta or {}).get("removed_at"))


# ------------------------------------------------------------------ scanning
def _files(path: Path) -> Iterator[Path]:
    if path.is_file():
        yield path
    elif path.is_dir():
        for p in path.rglob("*"):
            if p.is_file():
                yield p


def _size(path: Path) -> tuple[int, int]:
    total = count = 0
    for p in _files(path):
        try:
            total += p.stat().st_size
            count += 1
        except OSError:
            pass
    return total, count


@dataclass
class _TrackInfo:
    id: int
    project_id: int
    published_at: float | None
    video: Path | None
    preview: Path | None
    busy: bool


@dataclass
class _Scope:
    """Projects and versions of the whole app or of one channel."""

    channel_id: int | None
    projects: set[int] = field(default_factory=set)
    tracks: dict[int, _TrackInfo] = field(default_factory=dict)
    #: project id → its track ids
    by_project: dict[int, set[int]] = field(default_factory=dict)
    channels: set[int] = field(default_factory=set)


def _scope(channel_id: int | None) -> _Scope:
    sc = _Scope(channel_id)
    with session_scope() as db:
        # Only renders read or write the files cleaned here.
        busy = set(db.scalars(select(Job.track_id).where(Job.status.in_(("queued", "running")),
                                                          Job.kind.in_(("render", "preview")),
                                                          Job.track_id.is_not(None))))
        sc.channels = set(db.scalars(select(Channel.id)))
        q = select(Project)
        if channel_id is not None:
            q = q.where(Project.channel_id == channel_id)
        for project in db.scalars(q):
            sc.projects.add(project.id)
            sc.by_project[project.id] = set()
            for t in project.tracks:
                sc.by_project[project.id].add(t.id)
                sc.tracks[t.id] = _TrackInfo(
                    t.id, project.id, t.published_at, to_abs(t.video_file), to_abs(t.preview_file),
                    busy=t.id in busy,
                )
    return sc


def _track_dirs(sc: _Scope) -> Iterator[tuple[_TrackInfo, Path]]:
    for info in sc.tracks.values():
        d = media_root() / "projects" / str(info.project_id) / "tracks" / str(info.id)
        if d.is_dir():
            yield info, d


def _orphans(sc: _Scope) -> list[Path]:
    """Folders of deleted projects / versions and render videos nothing refers to."""
    out: list[Path] = []
    root = media_root() / "projects"
    if root.is_dir():
        for pdir in root.iterdir():
            if not pdir.is_dir() or not pdir.name.isdigit():
                continue
            pid = int(pdir.name)
            if pid not in sc.projects:
                if sc.channel_id is None:  # a deleted project belongs to no channel any more
                    out.append(pdir)
                continue
            tdir = pdir / "tracks"
            if tdir.is_dir():
                for d in tdir.iterdir():
                    if d.is_dir() and d.name.isdigit() and int(d.name) not in sc.by_project[pid]:
                        out.append(d)
    for info, d in _track_dirs(sc):
        if info.busy:
            continue
        render = d / "render"
        if render.is_dir():
            for f in render.glob("*.mp4"):
                if f != info.video and f != info.preview:
                    out.append(f)
    if sc.channel_id is None:
        cdir = media_root() / "channels"
        if cdir.is_dir():
            out += [d for d in cdir.iterdir() if d.is_dir() and d.name.isdigit() and int(d.name) not in sc.channels]
    return out


def _category(rel: tuple[str, ...]) -> str:
    """Category of a file inside a track folder by its path parts."""
    head = rel[0] if rel else ""
    if head == "images":
        return "depth" if len(rel) > 1 and rel[1] == ".depth" else "images"
    if head == "render":
        if len(rel) > 1 and rel[1] == "work":
            return "work"
        if len(rel) > 1 and rel[1] == "preview":
            return "previews"
        return "videos"
    if head in ("audio", "thumbs"):
        return head
    return "other"


def usage(channel_id: int | None = None) -> dict[str, Any]:
    """Bytes and files per category, and what each clean-up would free."""
    sc = _scope(channel_id)
    cats: dict[str, list[int]] = {}

    def add(cat: str, size: int, count: int = 1) -> None:
        c = cats.setdefault(cat, [0, 0])
        c[0] += size
        c[1] += count

    cleanable = {k: [0, 0] for k in KINDS}
    orphan_set = {p.resolve() for p in _orphans(sc)}
    for p in orphan_set:
        size, count = _size(p)
        cleanable["orphans"][0] += size
        cleanable["orphans"][1] += count if p.is_dir() else 1
        add("orphans", size, count)
    for info, d in _track_dirs(sc):
        if d.resolve() in orphan_set:
            continue
        for f in _files(d):
            if f.resolve() in orphan_set:
                continue
            try:
                size = f.stat().st_size
            except OSError:
                continue
            cat = _category(f.relative_to(d).parts)
            if info.preview and f == info.preview:
                cat = "previews"
            add(cat, size)
            if info.busy:
                continue
            if cat == "videos" and info.video and f == info.video and info.published_at:
                cleanable["published_videos"][0] += size
                cleanable["published_videos"][1] += 1
            elif cat in ("depth", "previews", "work"):
                cleanable[cat][0] += size
                cleanable[cat][1] += 1
    for pid in sc.projects:
        chars = media_root() / "projects" / str(pid) / "characters"
        size, count = _size(chars)
        if count:
            add("characters", size, count)
    if channel_id is not None:
        size, count = _size(media_root() / "channels" / str(channel_id))
    else:
        size, count = _size(media_root() / "channels")
        fx = _size(media_root() / "fx_previews")
        size, count = size + fx[0], count + fx[1]
    if count:
        add("other", size, count)
    return {
        "total": sum(v[0] for v in cats.values()),
        "categories": {k: {"bytes": v[0], "files": v[1]} for k, v in cats.items()},
        "cleanable": {k: {"bytes": v[0], "files": v[1]} for k, v in cleanable.items()},
        "published_versions": sum(1 for t in sc.tracks.values() if t.published_at),
        "auto_days": load_config().cleanup_published_after_days,
    }


# ------------------------------------------------------------------ cleaning
def _remove(path: Path) -> tuple[int, int]:
    size, count = _size(path)
    try:
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink(missing_ok=True)
    except OSError as exc:  # a file open in a player – skip it, report the rest
        log.warning("cannot remove %s: %s", path, exc)
        return 0, 0
    return size, count


def _remove_video(track_id: int) -> tuple[int, int]:
    """Delete the final video of a published version; the version remembers it was removed."""
    with session_scope() as db:
        t = db.get(Track, track_id)
        if t is None or not t.video_file or not t.published_at:
            return 0, 0
        path = to_abs(t.video_file)
        freed = _remove(path) if path and path.exists() else (0, 0)
        if path and path.exists():  # still there (open in a player) – keep the link
            return 0, 0
        t.video_file = None
        t.video_meta = {**(t.video_meta or {}), "removed_at": time.time()}
    return freed


def cleanup(kinds: list[str], channel_id: int | None = None, *,
            published_before: float | None = None) -> dict[str, Any]:
    """Remove what ``kinds`` name. ``published_before`` limits published videos/depth maps by publish time."""
    from .jobs.events import track_changed  # noqa: PLC0415 – the jobs package imports the app modules

    sc = _scope(channel_id)
    freed = files = 0
    touched: set[int] = set()

    def count(result: tuple[int, int]) -> None:
        nonlocal freed, files
        freed += result[0]
        files += result[1]

    if "orphans" in kinds:
        for p in _orphans(sc):
            count(_remove(p))
    for info, d in _track_dirs(sc):
        if info.busy:
            continue
        old_enough = info.published_at is not None and (published_before is None or info.published_at <= published_before)
        if "published_videos" in kinds and old_enough and info.video:
            before = freed
            count(_remove_video(info.id))
            if freed > before:
                touched.add(info.id)
        if "depth" in kinds and (published_before is None or old_enough):
            count(_remove(d / "images" / ".depth"))
        if "work" in kinds:
            count(_remove(d / "render" / "work"))
        if "previews" in kinds:
            count(_remove(d / "render" / "preview"))
            if info.preview and info.preview.exists():
                count(_remove(info.preview))
                with session_scope() as db:
                    t = db.get(Track, info.id)
                    if t is not None:
                        t.preview_file = None
                touched.add(info.id)
    for tid in touched:
        track_changed(tid, "video")
    if freed:
        log.info("storage clean-up %s (channel %s): %.1f GB, %d files", kinds, channel_id, freed / 1e9, files)
    return {"freed": freed, "files": files}


# ------------------------------------------------------------------ automatic
def auto_cleanup() -> dict[str, Any] | None:
    days = load_config().cleanup_published_after_days
    if days <= 0:
        return None
    return cleanup(["published_videos", "depth"], published_before=time.time() - days * _DAY)


def start() -> None:
    """Hourly automatic clean-up in the background (the first one a minute after start)."""
    def loop() -> None:
        time.sleep(60)
        while True:
            try:
                auto_cleanup()
            except Exception:  # noqa: BLE001 – must never stop the app
                log.exception("automatic storage clean-up failed")
            time.sleep(3600)

    threading.Thread(target=loop, name="storage-cleanup", daemon=True).start()
