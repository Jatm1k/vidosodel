"""Building the job chain for "run the pipeline" on a project.

Steps run in this order per track, each depending on the previous one::

    translate → voice → scenes → characters → prompts → images → render → metadata → thumbnails
                                                   ↘ videos ↗
                              ↘ motion ↗ (render waits for it)

``motion`` (graphics composed by Claude, see app.motion) runs next to the picture steps; in the ``mixed`` mode the
image job waits until Claude has marked the scenes that become motion scenes, in ``full`` there are no pictures.

``characters`` (reference portraits) runs only when it is enabled in the image
settings, once per project – on the master track.

``images`` does not wait for all prompts: it starts together with ``prompts``
and draws every scene as soon as its prompt is written. ``metadata`` (heavy on
LLM tokens) needs only the voice-over, but runs as low priority – after the
prompts of every queued project, so it never holds back the images.

Already finished steps are skipped unless ``force`` is set, so the same button
means "continue from where it stopped". With shared images, other languages
wait for the master track (scenes are aligned to the master's scenes, renders
need the master's images).
"""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from ..cleanup import video_removed
from ..jobs.runner import runner
from ..models import Project, Track
from ..motion import store as motion_store
from ..settings_schema import effective_settings
from ..pipeline.footage import wants_video, scene_video, wants_still, scene_first_frame

STEP_ORDER = ["translate", "voice", "scenes", "motion", "characters", "prompts", "images", "videos", "render", "metadata", "thumbnails"]


def _characters_done(project: Project) -> bool:
    return bool(project.characters_scanned_at) and all(c.image_file for c in project.characters)


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
    if step in ("images", "videos"):
        eff = effective_settings(track.project.channel.settings, track.project.settings)
        skip = motion_store.motion_scene_idxs(track.motion)
        wanted = [s for s in scenes if s.idx not in skip and
                  (wants_video(s, eff) if step == "videos" else wants_still(s, eff))]
        return shares or (bool(scenes) and all(scene_video(s) if step == "videos" else
            (scene_first_frame(s) if wants_video(s, eff) else s.image_file) for s in wanted))
    if step == "render":
        return bool(track.video_file) or video_removed(track)
    if step == "metadata":
        return bool(track.publish_meta)
    if step == "thumbnails":
        return bool(track.thumbnails)
    if step == "motion":
        return bool(motion_store.items(track.motion)) and (track.motion or {}).get("key") == motion_store.timeline_key(scenes)
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
    eff = effective_settings(project.channel.settings, project.settings)
    use_characters = eff.images.character_refs or (eff.videos.mode != "off" and eff.videos.character_refs)
    motion_mode = eff.motion.mode
    created: list[int] = []
    master_jobs: dict[str, int] = {}

    for track in tracks:
        is_master = track.id == master_id
        shares = project.image_mode == "shared" and not is_master
        prev: int | None = None
        before_prompts: int | None = None
        before_images: int | None = None
        step_jobs: dict[str, int] = {}
        for step in selected:
            if step == "translate" and (is_master or master is None):
                continue
            if step == "motion" and motion_mode == "off":
                continue
            if step in ("characters", "prompts", "images", "videos") and motion_mode == "full":
                continue  # the whole video is motion graphics: no pictures
            if step in ("prompts", "images", "videos") and shares:
                continue
            if step == "characters":
                if not use_characters or not is_master or (not force and _characters_done(project)):
                    continue
            # A shared-image track must follow the master when the master re-cuts scenes
            # (its aligned scenes get reset) or regenerates images (its video becomes stale).
            follows_master = shares and ((step == "scenes" and "scenes" in master_jobs)
                                         or (step == "render" and any(k in master_jobs for k in ("images", "videos"))))
            redo = force or follows_master or (step == "translate" and options.get("retranslate"))
            if step != "characters" and not redo and _done(track, step, shares):
                continue
            if step in ("thumbnails",) and not force and "metadata" not in selected and not track.publish_meta:
                continue
            params: dict[str, Any] = {}
            after: list[int] = []
            if step == "translate":
                params["source_track_id"] = master.id
                if "translate" in master_jobs:
                    after.append(master_jobs["translate"])
            if step in ("images", "videos") and force:
                params["force"] = True
            if step == "metadata" and force:
                params["ideas"] = True  # redo = new thumbnail ideas too
            if step == "prompts" and force:
                params["overwrite"] = True
            if step == "images" and "prompts" in step_jobs:
                # Draw scenes while the prompts are being written (see the module docstring).
                params["follow"] = step_jobs["prompts"]
                params["_started"] = [step_jobs["prompts"]]
                if force:
                    params["follow_overwrite"] = True
            if step == "render" and "prompts" in step_jobs:
                after.append(step_jobs["prompts"])  # images no longer depend on the prompts directly
            if step == "videos" and "prompts" in step_jobs:
                after.append(step_jobs["prompts"])
            if step == "videos" and "images" in step_jobs:
                params["follow_images"] = step_jobs["images"]
            if shares and step == "render" and "videos" in master_jobs:
                after.append(master_jobs["videos"])
            if step == "render" and "motion" in step_jobs:
                after.append(step_jobs["motion"])
            if step == "render" and "images" in step_jobs:
                after.append(step_jobs["images"])
            if step == "motion" and shares and "motion" in master_jobs:
                after.append(master_jobs["motion"])  # adapts the master's graphics
            if step == "motion" and motion_mode == "mixed" and not shares:
                # the image job holds until Claude marks the motion scenes (cleared by the motion job)
                track.motion = {**(track.motion or {}), "planning": True}
            if step == "metadata":
                params["_low"] = True
            if step == "render" and options.get("allow_missing"):
                params["allow_missing"] = True
            if step == "characters" and force:
                params["rescan"] = True
            if step == "prompts" and not is_master and "characters" in master_jobs:
                after.append(master_jobs["characters"])  # the cast is shared by all languages
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
            elif step == "images" and "prompts" in step_jobs:
                depends = before_prompts
            elif step == "videos" and "images" in step_jobs:
                depends = before_images
            else:
                depends = prev
            if step == "prompts":
                before_prompts = prev
            if step == "images":
                before_images = prev
            job = runner.enqueue(step, project_id=project.id, track_id=track.id, params=params, depends_on=depends)
            step_jobs[step] = job.id
            if step not in ("metadata", "thumbnails", "motion"):
                prev = job.id
            created.append(job.id)
            if is_master:
                master_jobs[step] = job.id
    return created
