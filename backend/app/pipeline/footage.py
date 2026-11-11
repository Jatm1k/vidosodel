"""Scene selection and generation-mode routing, shared by jobs and render.

The director's decision for a scene lives in ``scene.video_plan["route"]`` (see :mod:`.video_director`):
``media`` (video/image), ``mode``, multishot ``group``/``shot``, ``continue_from`` (endless story).
Without a route the older positional rules apply.
"""
from __future__ import annotations

import math


def route_of(scene) -> dict:
    return (getattr(scene, "video_plan", None) or {}).get("route") or {}


def in_intro(scene, settings) -> bool:
    seconds = settings.videos.intro_seconds
    return bool(seconds) and float(scene.start or 0) < seconds


def wants_video(scene, settings) -> bool:
    override = (scene.overrides or {}).get("media_type", "auto")
    if override in ("video", "image"):
        return override == "video"
    videos = settings.videos
    if videos.mode == "off":
        return False
    if videos.mode == "full":
        return True
    if videos.mode == "intro":
        return scene.idx < videos.intro_clips
    if in_intro(scene, settings):
        return True
    if videos.mode == "smart":
        route = route_of(scene)
        if route.get("media"):
            return route["media"] == "video"
    # mixed (and smart before the director ran): spread clips evenly.
    return math.floor((scene.idx + 1) * videos.share + 1e-9) > math.floor(scene.idx * videos.share + 1e-9)


def scene_video(scene) -> str | None:
    source = scene.source_scene if scene.source_scene_id and scene.source_scene is not None else scene
    return source.video_file


def generation_mode(scene, settings):
    """Requested mode: per-scene override → project setting → director's route (``auto``)."""
    value = (scene.overrides or {}).get("video_mode")
    if value and value != "inherit":
        return value
    if settings.videos.generation != "auto":
        return settings.videos.generation
    if (scene.overrides or {}).get("first_frame"):
        return "i2v"
    return route_of(scene).get("mode") or "auto"


def is_member(scene) -> bool:
    """A later shot of a multishot clip: it plays a part of its group leader's clip."""
    route = route_of(scene)
    return bool(route.get("group")) and route.get("group") != scene.id


def continues(scene) -> int | None:
    return route_of(scene).get("continue_from")


def scene_first_frame(scene):
    """An intentional source image, never an automatically extracted clip poster."""
    source = scene.source_scene if scene.source_scene_id and scene.source_scene is not None else scene
    explicit = (scene.overrides or {}).get("first_frame") or (source.overrides or {}).get("first_frame")
    if explicit:
        return explicit
    chained = route_of(source).get("chain_frame")
    if continues(source) and chained:
        return chained
    image = source.image_file
    meta = getattr(source, "video_meta", None) or {}
    if image and (image.endswith(".poster.jpg") or image == meta.get("poster_file") or
                  (getattr(source, "image_meta", None) or {}).get("origin") == "video_poster"):
        return None
    return image


def uses_first_frame(scene, settings):
    """The clip starts from a still made by the image step (not from the previous clip or text)."""
    if is_member(scene) or (continues(scene) and not (scene.overrides or {}).get("first_frame")):
        return False
    return generation_mode(scene, settings) in ("auto", "i2v")


def wants_still(scene, settings):
    """Image scenes plus the first frames of not-yet-generated clips that start from a still."""
    return not wants_video(scene, settings) or (uses_first_frame(scene, settings) and not scene.video_file)
