"""Short looping clips that show one camera move, transition or atmosphere effect.

A preview is rendered in-process (no worker pool, no audio) at 540p from the
channel's own images, so the user sees how an effect looks in *their* style
before using it. Clips are cached by everything that affects their pixels.
When the channel has no images yet, a procedural placeholder is drawn
(:func:`sample_image`) – nothing third-party is shipped with the app.
"""
from __future__ import annotations

import hashlib
import json
import logging
import subprocess
import threading
from pathlib import Path

import cv2
import numpy as np

from ..config import ffmpeg_bin
from ..settings_schema import AtmosphereSettings
from . import depth as depth_mod
from .atmosphere import make_params
from .engine import FrameRenderer, PlanScene, RenderPlan
from .media import CREATE_NO_WINDOW, imwrite
from .motion import EFFECTS
from .parallax import make_shots
from .transitions import TRANSITIONS

log = logging.getLogger(__name__)

WIDTH, HEIGHT, FPS = 960, 540, 25
#: Bump when preview rendering changes, so cached clips are re-rendered.
VERSION = 1
#: Cached clips kept on disk.
KEEP = 80
ATMOSPHERE_EFFECTS = ("line_boil", "grain_boil", "breathing", "light_pulse", "vignette_breathing", "dust")
KINDS = ("motion", "transition", "atmosphere")

_lock = threading.Lock()


class PreviewError(ValueError):
    pass


# ================================================================ placeholder
def sample_image(dest: Path, variant: int = 0) -> Path:
    """A simple drawn landscape with a figure: outlines (for line boil), highlights, darks and depth."""
    if dest.exists():
        return dest
    w, h = 1376, 768
    rng = np.random.default_rng(1234 + variant)
    if variant % 2 == 0:  # dusk
        top, bottom, sun, hills = (70, 40, 40), (120, 170, 245), (190, 235, 255), [(95, 80, 70), (70, 60, 52), (45, 38, 34)]
    else:                 # blue day
        top, bottom, sun, hills = (200, 140, 70), (240, 220, 190), (225, 250, 255), [(130, 150, 110), (90, 120, 80), (55, 80, 50)]
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    img = (np.array(top, np.float32) * (1 - y) + np.array(bottom, np.float32) * y).repeat(w, axis=1)
    img = np.ascontiguousarray(img.astype(np.uint8))
    # sun with a soft glow
    sx, sy = int(w * 0.68), int(h * 0.38)
    glow = np.zeros((h, w), np.float32)
    cv2.circle(glow, (sx, sy), 70, 1.0, -1)
    glow = cv2.GaussianBlur(glow, (0, 0), 60)[..., None]
    img = np.clip(img + glow * 160, 0, 255).astype(np.uint8)
    cv2.circle(img, (sx, sy), 58, sun, -1, cv2.LINE_AA)
    # three hill layers, each with a dark outline
    xs = np.arange(0, w + 8, 8)
    for i, color in enumerate(hills):
        base = h * (0.55 + 0.13 * i)
        amp = 40 - i * 6
        ph = rng.uniform(0, 6.3)
        ys = base - amp * np.sin(xs / (160 + 70 * i) + ph) - amp * 0.4 * np.sin(xs / 53 + ph * 2)
        pts = np.array([[0, h], *zip(xs, ys.astype(int)), [w, h]], np.int32)
        cv2.fillPoly(img, [pts], color, cv2.LINE_AA)
        cv2.polylines(img, [pts[1:-1]], False, (25, 20, 20), 3, cv2.LINE_AA)
    # a house on the middle hill
    hx, hy = int(w * 0.2), int(h * 0.66)
    house = np.array([[hx, hy], [hx + 110, hy], [hx + 110, hy - 70], [hx + 55, hy - 120], [hx, hy - 70]], np.int32)
    cv2.fillPoly(img, [house], (60, 70, 120), cv2.LINE_AA)
    cv2.polylines(img, [house], True, (20, 18, 18), 3, cv2.LINE_AA)
    cv2.rectangle(img, (hx + 40, hy - 50), (hx + 70, hy - 25), (120, 220, 255), -1)
    cv2.rectangle(img, (hx + 40, hy - 50), (hx + 70, hy - 25), (20, 18, 18), 2, cv2.LINE_AA)
    # a figure in the foreground (the "hero" for close-ups and breathing)
    fx, fy = int(w * 0.5), int(h * 0.98)
    body = np.array([[fx - 95, fy], [fx - 75, fy - 230], [fx - 30, fy - 270], [fx + 30, fy - 270],
                     [fx + 75, fy - 230], [fx + 95, fy]], np.int32)
    cv2.fillPoly(img, [body], (60, 45, 40), cv2.LINE_AA)
    cv2.polylines(img, [body], False, (15, 12, 12), 4, cv2.LINE_AA)
    cv2.ellipse(img, (fx, fy - 330), (52, 62), 0, 0, 360, (150, 175, 210), -1, cv2.LINE_AA)
    cv2.ellipse(img, (fx, fy - 330), (52, 62), 0, 0, 360, (15, 12, 12), 4, cv2.LINE_AA)
    cv2.ellipse(img, (fx, fy - 360), (56, 36), 0, 180, 360, (30, 25, 25), -1, cv2.LINE_AA)
    # paper texture
    tex = rng.normal(0, 6, (h // 2, w // 2)).astype(np.float32)
    tex = cv2.resize(tex, (w, h))[..., None]
    img = np.clip(img.astype(np.float32) + tex, 0, 255).astype(np.uint8)
    dest.parent.mkdir(parents=True, exist_ok=True)
    imwrite(dest, img, quality=92)
    return dest


# ================================================================ plans
def _subject(image: str) -> dict | None:
    try:
        return depth_mod.ensure(Path(image))
    except depth_mod.DepthUnavailable as e:
        log.info("preview without depth: %s", e)
    except Exception as e:  # a broken image must not break the preview
        log.warning("preview depth failed for %s: %s", image, e)
    return None


def _still_shot(subject: dict, duration: float) -> dict:
    """A parallax shot with a locked camera: only the atmosphere moves."""
    _a, _b, shot = make_shots(0, duration, [], subject, seed=11, intensity=0.5, depth_of_field=False)[0]
    return {**shot, "travel": 0.0, "dolly": 0.0}


def _plan(kind: str, effect: str, images: list[str], settings: dict) -> RenderPlan:
    intensity = float(settings.get("motion_intensity", 0.5))
    look = {"seed": 7}
    atmo: dict = {}
    if kind == "motion":
        duration = 4.0
        scene = PlanScene(images[0], 0, duration, effect, seed=3)
        if effect == "parallax":
            subject = _subject(images[0])
            if subject:
                scene.shot = make_shots(0, duration, [], subject, seed=3, intensity=intensity,
                                        depth_of_field=bool(settings.get("depth_of_field", True)))[0][2]
            else:
                scene.effect = "drift"
        scenes = [scene]
    elif kind == "transition":
        duration = 4.4
        scenes = [PlanScene(images[0], 0, 2.2, "zoom_in", seed=3),
                  PlanScene(images[1], 2.2, duration, "zoom_out", seed=4, transition=effect)]
    else:
        cfg = dict(settings.get("atmosphere") or {})
        if effect == "all":
            duration = 8.0
            if not any(cfg.get(e) for e in ATMOSPHERE_EFFECTS):
                raise PreviewError("Включите хотя бы один эффект атмосферы")
        else:
            duration = 6.0
            cfg = {**{e: False for e in ATMOSPHERE_EFFECTS}, **{k: v for k, v in cfg.items() if k.endswith("_strength")
                                                                or k == "boil_hold"}, effect: True}
        atmo = make_params(AtmosphereSettings.model_validate(cfg), 7).to_dict()
        scene = PlanScene(images[0], 0, duration, "static", seed=3)
        subject = _subject(images[0])
        if subject:
            scene.shot = _still_shot(subject, duration)
        scenes = [scene]
    return RenderPlan(WIDTH, HEIGHT, FPS, duration, scenes, look=look, atmosphere=atmo, intensity=intensity,
                      transition_duration=float(settings.get("transition_duration", 0.6)), fade_in=0, fade_out=0,
                      encoder="libx264", quality="fast", preview=True)


def _cache_key(kind: str, effect: str, images: list[str], settings: dict) -> str:
    relevant = {"motion": ("motion_intensity", "depth_of_field"), "transition": ("transition_duration",),
                "atmosphere": ("atmosphere",)}[kind]
    stamp = [(p, Path(p).stat().st_mtime) for p in images]
    raw = json.dumps([VERSION, kind, effect, stamp, {k: settings.get(k) for k in relevant}], sort_keys=True)
    return hashlib.sha1(raw.encode()).hexdigest()[:20]


# ================================================================ render
def render(kind: str, effect: str, images: list[str], settings: dict, out_dir: Path) -> Path:
    """Render (or reuse) the preview clip; returns its path inside ``out_dir``."""
    if kind not in KINDS:
        raise PreviewError(f"Неизвестный тип превью: {kind}")
    valid = {"motion": EFFECTS, "transition": TRANSITIONS, "atmosphere": (*ATMOSPHERE_EFFECTS, "all")}[kind]
    if effect not in valid:
        raise PreviewError(f"Неизвестный эффект: {effect}")
    need = 2 if kind == "transition" else 1
    images = images[:need]
    while len(images) < need:
        images.append(str(sample_image(out_dir / f"_sample_{len(images)}.jpg", len(images))))
    out = out_dir / f"{kind}_{effect}_{_cache_key(kind, effect, images, settings)}.mp4"
    with _lock:
        if out.exists():
            return out
        plan = _plan(kind, effect, images, settings)
        fr = FrameRenderer(plan)
        tmp = out.with_suffix(".part.mp4")
        cmd = [ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y",
               "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "pipe:0",
               "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
               "-movflags", "+faststart", "-an", tmp.name]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE, cwd=out_dir,
                                creationflags=CREATE_NO_WINDOW)
        try:
            for n in range(plan.total_frames):
                proc.stdin.write(fr.frame(n).tobytes())
            proc.stdin.close()
        except Exception:
            proc.kill()
            raise
        finally:
            err = proc.stderr.read()
            rc = proc.wait()
        if rc != 0:
            raise RuntimeError("ffmpeg (превью эффекта): " + err.decode("utf-8", "replace")[-800:])
        tmp.replace(out)
        _prune(out_dir)
    return out


def _prune(out_dir: Path) -> None:
    clips = sorted(out_dir.glob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
    for old in clips[KEEP:]:
        old.unlink(missing_ok=True)
