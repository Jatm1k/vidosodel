"""Building the job chain for "run the pipeline" on a project.

Steps run in this order per track, each depending on the previous one::

    translate → voice → scenes → prompts → images → render → metadata → thumbnails

Already finished steps are skipped unless ``force`` is set, so the same button
means "continue from where it stopped". With shared images, other languages
wait for the master track (scenes are aligned to the master's scenes, renders
need the master's images).
"""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from ..jobs.runner import runner
from ..models import Project, Track

STEP_ORDER = ["translate", "voice", "scenes", "prompts", "images", "render", "metadata", "thumbnails"]


def _done(track: Track, step: str, shares: bool) -> bool:
    scenes = list(track.scenes)
    if step == "translate":
        return bool(track.script.strip())
    if step == "voice":
        return bool(track.audio_file)
    if step == "scenes":
        return bool(scenes)
    if step == "prompts":
        return shares or (bool(scenes) and all(s.prompt.strip() for s in scenes))
    if step == "images":
        return shares or (bool(scenes) and all(s.image_status == "done" and s.image_file for s in scenes))
    if step == "render":
        return bool(track.video_file)
    if step == "metadata":
        return bool(track.publish_meta)
    if step == "thumbnails":
        return bool(track.thumbnails)
    return False


def run_pipeline(db: Session, project: Project, *, track_ids: list[int] | None, steps: list[str],
                 force: bool = False, options: dict[str, Any] | None = None) -> list[int]:
    """Enqueue the selected steps for the selected tracks. Returns created job ids."""
    options = options or {}
    tracks = [t for t in project.tracks if not track_ids or t.id in track_ids]
    master_id = project.master_track_id or (project.tracks[0].id if project.tracks else None)
    master = next((t for t in project.tracks if t.id == master_id), None)
    # Master first: other languages may depend on it.
    tracks.sort(key=lambda t: (t.id != master_id, t.position))
    selected = [s for s in STEP_ORDER if s in steps]
    created: list[int] = []
    master_jobs: dict[str, int] = {}

    for track in tracks:
        is_master = track.id == master_id
        shares = project.image_mode == "shared" and not is_master
        prev: int | None = None
        step_jobs: dict[str, int] = {}
        for step in selected:
            if step == "translate" and (is_master or master is None):
                continue
            if step in ("prompts", "images") and shares:
                continue
            # A shared-image track must follow the master when the master re-cuts scenes
            # (its aligned scenes get reset) or regenerates images (its video becomes stale).
            follows_master = shares and ((step == "scenes" and "scenes" in master_jobs)
                                         or (step == "render" and "images" in master_jobs))
            redo = force or follows_master or (step == "translate" and options.get("retranslate"))
            if not redo and _done(track, step, shares):
                continue
            if step in ("thumbnails",) and not force and "metadata" not in selected and not track.publish_meta:
                continue
            params: dict[str, Any] = {}
            after: list[int] = []
            if step == "translate":
                params["source_track_id"] = master.id
                if "translate" in master_jobs:
                    after.append(master_jobs["translate"])
            if step == "images" and force:
                params["force"] = True
            if step == "prompts" and force:
                params["overwrite"] = True
            if step == "render" and options.get("allow_missing"):
                params["allow_missing"] = True
            if shares and step == "scenes" and "scenes" in master_jobs:
                after.append(master_jobs["scenes"])
            if shares and step == "render" and "images" in master_jobs:
                after.append(master_jobs["images"])
            if after:
                params["_after"] = after
            # Metadata needs only the script/timings – it must not be skipped when a render fails.
            if step == "metadata":
                depends = step_jobs.get("voice")
            elif step == "thumbnails":
                depends = step_jobs.get("metadata")
            else:
                depends = prev
            job = runner.enqueue(step, project_id=project.id, track_id=track.id, params=params, depends_on=depends)
            step_jobs[step] = job.id
            if step not in ("metadata", "thumbnails"):
                prev = job.id
            created.append(job.id)
            if is_master:
                master_jobs[step] = job.id
    return created
