"""Deterministic scene selection and reference routing, shared by jobs and render."""
from __future__ import annotations

import math


def wants_video(scene, settings) -> bool:
    override = (scene.overrides or {}).get("media_type", "auto")
    if override in ("video", "image"):
        return override == "video"
    videos = settings.videos
    if videos.mode == "intro":
        return scene.idx < videos.intro_clips
    return videos.mode == "full" or (videos.mode == "mixed" and
        math.floor((scene.idx + 1) * videos.share + 1e-9) > math.floor(scene.idx * videos.share + 1e-9))


def scene_video(scene) -> str | None:
    source = scene.source_scene if scene.source_scene_id and scene.source_scene is not None else scene
    return source.video_file


def generation_mode(scene, settings):
    value = (scene.overrides or {}).get("video_mode")
    return settings.videos.generation if not value or value == "inherit" else value


def scene_first_frame(scene):
    """An intentional source image, never an automatically extracted clip poster."""
    source = scene.source_scene if scene.source_scene_id and scene.source_scene is not None else scene
    explicit = (scene.overrides or {}).get("first_frame") or (source.overrides or {}).get("first_frame")
    if explicit:
        return explicit
    image = source.image_file
    meta = getattr(source, "video_meta", None) or {}
    if image and (image.endswith(".poster.jpg") or image == meta.get("poster_file") or
                  (getattr(source, "image_meta", None) or {}).get("origin") == "video_poster"):
        return None
    return image


def uses_first_frame(scene, settings):
    return generation_mode(scene, settings) in ("auto", "i2v")


def wants_still(scene, settings):
    """Image scenes plus the first frames of not-yet-generated automatic clips."""
    return not wants_video(scene, settings) or (uses_first_frame(scene, settings) and not scene.video_file)
