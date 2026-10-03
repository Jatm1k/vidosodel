"""Camera motion over still images (Ken Burns and friends).

A motion is a function ``u → View`` where ``u ∈ [0, 1]`` is the scene progress
(slightly beyond the range during transitions) and :class:`View` is the
visible window in normalised source coordinates. Frames are produced with a
single sub-pixel ``cv2.warpAffine`` call, so motion is perfectly smooth – no
integer-rounding jitter like ffmpeg's ``zoompan``.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass

import cv2
import numpy as np


@dataclass(slots=True)
class View:
    zoom: float      # 1 = whole image visible, 1.2 = 1/1.2 of it
    cx: float        # center x in [0, 1]
    cy: float        # center y in [0, 1]
    rot: float = 0.0  # degrees


EFFECTS = [
    "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down",
    "zoom_in_left", "zoom_in_right", "drift", "static",
]

EFFECT_LABELS = {
    "zoom_in": "Наезд", "zoom_out": "Отъезд", "pan_left": "Панорама влево", "pan_right": "Панорама вправо",
    "pan_up": "Панорама вверх", "pan_down": "Панорама вниз", "zoom_in_left": "Наезд со сдвигом влево",
    "zoom_in_right": "Наезд со сдвигом вправо", "drift": "Плавный дрейф", "static": "Без движения",
}


def ease(u: float) -> float:
    """Half linear, half sine ease: no visible stop at scene edges but soft acceleration."""
    u = min(max(u, -0.3), 1.3)
    return 0.5 * u + 0.5 * (0.5 - 0.5 * math.cos(math.pi * min(max(u, 0.0), 1.0)))


def max_zoom(intensity: float) -> float:
    """Largest zoom any effect may use for a given intensity (sizes the source buffer)."""
    return 1.0 + amplitude(intensity) * 1.15 + 0.04


def amplitude(intensity: float) -> float:
    return 0.06 + 0.22 * min(max(intensity, 0.0), 1.0)


def _clamp_center(v: View) -> View:
    half = 0.5 / v.zoom
    # Rotation needs a small extra margin so corners stay inside the image.
    margin = abs(math.radians(v.rot)) * 0.6
    v.cx = min(max(v.cx, half + margin), 1 - half - margin)
    v.cy = min(max(v.cy, half + margin), 1 - half - margin)
    return v


def make_motion(effect: str, intensity: float, seed: int):
    """Return ``f(u) -> View`` for an effect; ``seed`` adds small natural variation."""
    rnd = random.Random(seed)
    a = amplitude(intensity) * rnd.uniform(0.85, 1.15)
    jx, jy = rnd.uniform(-0.06, 0.06), rnd.uniform(-0.05, 0.05)

    def zoom_in(u: float) -> View:
        return View(1 + a * ease(u), 0.5 + jx * ease(u), 0.5 + jy * ease(u))

    def zoom_out(u: float) -> View:
        return View(1 + a * (1 - ease(u)), 0.5 + jx * (1 - ease(u)), 0.5 + jy * (1 - ease(u)))

    def pan(dx: float, dy: float):
        z = 1 + a * 0.9
        travel = (1 - 1 / z) / 2 * 0.92  # max travel that keeps the view inside the image

        def f(u: float) -> View:
            e = ease(u) * 2 - 1
            return View(z, 0.5 + dx * travel * e, 0.5 + dy * travel * e + (jy * 0.5 if dx else 0))
        return f

    def zoom_shift(direction: float):
        def f(u: float) -> View:
            e = ease(u)
            z = 1 + a * e
            travel = (1 - 1 / (1 + a)) / 2 * 0.85
            return View(z, 0.5 + direction * travel * e, 0.5 + jy * e)
        return f

    phase = rnd.uniform(0, math.tau)
    rot_amp = rnd.uniform(0.4, 1.0) * (0.5 + intensity)

    def drift(u: float) -> View:
        e = ease(u)
        z = 1 + a * (0.55 + 0.35 * e)
        return View(z, 0.5 + 0.035 * math.sin(phase + e * 2.2), 0.5 + 0.025 * math.cos(phase + e * 1.7),
                    rot_amp * (e - 0.5))

    def static(_u: float) -> View:
        return View(1 + a * 0.15, 0.5, 0.5)

    table = {
        "zoom_in": zoom_in, "zoom_out": zoom_out,
        "pan_left": pan(1, 0), "pan_right": pan(-1, 0), "pan_up": pan(0, 1), "pan_down": pan(0, -1),
        "zoom_in_left": zoom_shift(-1), "zoom_in_right": zoom_shift(1), "drift": drift, "static": static,
    }
    fn = table.get(effect, zoom_in)
    return lambda u: _clamp_center(fn(u))


def render_view(src: np.ndarray, view: View, out_w: int, out_h: int, extra_zoom: float = 1.0,
                offset: tuple[float, float] = (0.0, 0.0)) -> np.ndarray:
    """Sample the visible window of ``src`` into an ``out_w``×``out_h`` frame.

    ``src`` must already have the output aspect ratio (see ``media.cover_fit``).
    ``extra_zoom``/``offset`` are the global per-render micro-zoom used for
    uniqueness.
    """
    sh, sw = src.shape[:2]
    zoom = view.zoom * extra_zoom
    cx = view.cx + offset[0] / zoom
    cy = view.cy + offset[1] / zoom
    half = 0.5 / zoom
    cx = min(max(cx, half), 1 - half)
    cy = min(max(cy, half), 1 - half)
    # Destination pixel (x, y) → source pixel: scale s, rotation r around the view center.
    s = sw / (out_w * zoom)
    r = math.radians(view.rot)
    cos_r, sin_r = math.cos(r) * s, math.sin(r) * s
    src_cx, src_cy = cx * sw, cy * sh
    dst_cx, dst_cy = out_w / 2, out_h / 2
    m = np.array([
        [cos_r, -sin_r, src_cx - cos_r * dst_cx + sin_r * dst_cy],
        [sin_r, cos_r, src_cy - sin_r * dst_cx - cos_r * dst_cy],
    ], dtype=np.float64)
    return cv2.warpAffine(src, m, (out_w, out_h), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                          borderMode=cv2.BORDER_REFLECT_101)
