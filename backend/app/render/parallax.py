"""3D parallax camera over a still image, and phrase-timed shot cuts.

A scene is split at phrase boundaries of the voice-over into *shots* that
alternate between a wide shot and a close-up of the subject (a face when one
is found). Parallax scenes get a 3D camera per shot; plain 2D scenes keep
their camera move and only change the framing. Consecutive shots of the same image
are joined with hard cuts; the zoom ratio between them is large enough
(≈1.4×) to read as a deliberate cut, not a jump.

Each frame is a backward warp of the source by a per-pixel displacement that
depends on depth: the camera travels a little sideways and pushes in, near
layers move more than far ones, and the plane of the subject stays put. The
fixed-point iteration on depth makes nearer layers win at silhouettes, and the
dilated depth (see :func:`prepare_layers`) leaves a rim of the foreground
around it, so the background stretches slightly instead of tearing.
"""
from __future__ import annotations

import logging
import math
import random
from collections.abc import Callable, Sequence
from dataclasses import replace
from pathlib import Path
from typing import TYPE_CHECKING

import cv2
import numpy as np

from . import depth as depth_mod
from .media import cover_fit

if TYPE_CHECKING:
    from ..pipeline.timings import Word
    from .engine import RenderPlan

log = logging.getLogger(__name__)

#: Source buffer size relative to the output (headroom for camera travel and close-ups).
SOURCE_SCALE = 1.25
#: Shortest shot produced by a phrase cut, seconds.
MIN_SHOT = 1.8
_PUNCT = set(".,!?;:…—–")


# ============================================================== shot planning
def cut_points(words: Sequence[Word], start: float, end: float, min_len: float = MIN_SHOT) -> list[float]:
    """Phrase boundaries inside ``[start, end]`` usable as hard cuts."""
    ws = [w for w in words if start < w.e < end]
    cands = []
    for i, w in enumerate(ws[:-1]):
        if w.w[-1:] in _PUNCT or ws[i + 1].s - w.e > 0.25:
            cands.append(ws[i + 1].s - 0.04)  # a frame ahead of the next word feels snappier
    cuts, last = [], start
    for c in cands:
        if c - last >= min_len and end - c >= min_len:
            cuts.append(c)
            last = c
    return cuts


def make_shots(start: float, end: float, cuts: list[float], subject: dict, *, seed: int,
               intensity: float, depth_of_field: bool) -> list[tuple[float, float, dict]]:
    """``(start, end, shot)`` triples for one scene: wide → close → wide → …"""
    rnd = random.Random(seed)
    k = 0.5 + min(max(intensity, 0.0), 1.0)          # 1.0 at the default intensity 0.5
    bounds = [start, *cuts, end]
    n = len(bounds) - 1
    sx, sy = subject["cx"], subject["cy"]
    out = []
    for i in range(n):
        ang = rnd.uniform(0, math.tau)
        if i % 2 == 0:
            kind, zoom = "wide", 1.08
            cx, cy = 0.5 + (sx - 0.5) * 0.15, 0.5 + (sy - 0.5) * 0.15
            travel = 0.045
            # a lone shot gets a slow 3D push in (or, sometimes, a pull out)
            dolly = rnd.choice([0.10, 0.10, -0.08]) if n == 1 else rnd.choice([0.06, -0.06])
            dof = 0.25
        else:
            kind = "close" if subject.get("face") else "medium"
            zoom = 1.55 if kind == "close" else 1.35
            cx, cy, travel, dolly, dof = sx, sy, 0.03, 0.05, 0.75
        out.append((bounds[i], bounds[i + 1], {
            "kind": kind, "zoom": zoom, "cx": cx, "cy": cy,
            "dirx": math.cos(ang), "diry": math.sin(ang) * 0.5,
            "travel": travel * k, "dolly": dolly * k,
            "focus": subject["depth"], "dof": dof if depth_of_field else 0.0,
            "seed": rnd.randrange(1 << 30),
        }))
    return out


def make_flat_shots(start: float, end: float, cuts: list[float], subject: dict, *,
                    seed: int) -> list[tuple[float, float, dict | None]]:
    """``(start, end, framing)`` for a 2D scene: the wide shot (``None``) alternates with a closer one."""
    rnd = random.Random(seed ^ 0x5F3759DF)
    bounds = [start, *cuts, end]
    out: list[tuple[float, float, dict | None]] = []
    for i in range(len(bounds) - 1):
        framing = None
        if i % 2:
            # ≥1.3× tighter than the wide shot, so the cut reads as a new angle, not a jump
            zoom = rnd.uniform(1.4, 1.55) if subject.get("face") else rnd.uniform(1.3, 1.4)
            half = 0.5 / zoom
            framing = {"zoom": zoom, "cx": min(max(subject["cx"], half), 1 - half),
                       "cy": min(max(subject["cy"], half), 1 - half)}
        out.append((bounds[i], bounds[i + 1], framing))
    return out


def prepare(plan: RenderPlan, words: Sequence[Word] | None, *, phrase_cuts: bool, depth_of_field: bool,
            progress: Callable[[float, str], None] | None = None,
            check: Callable[[], None] | None = None) -> str | None:
    """Split scenes of ``plan`` into shots at phrase boundaries (in place).

    Parallax scenes get depth maps and alternate wide shots and close-ups of the
    subject; plain 2D scenes alternate their wide move with a tighter framing of
    the subject. Only scenes inside the rendered window are processed (previews
    render a fragment). Returns a warning when depth is unavailable – parallax
    scenes then fall back to the plain 2D drift.
    """
    t0, t1 = plan.time_offset, plan.time_offset + plan.duration
    use_cuts = phrase_cuts and bool(words)
    cuts: dict[int, list[float]] = {}
    for i, s in enumerate(plan.scenes):
        if use_cuts and s.end > t0 and s.start < t1:
            cuts[i] = cut_points(words, s.start, s.end)
    todo = [s for i, s in enumerate(plan.scenes)
            if s.end > t0 and s.start < t1 and (s.effect == "parallax" or cuts.get(i))]
    images = list(dict.fromkeys(s.image for s in todo))
    for folder in {Path(img).parent for img in images}:
        depth_mod.prune(folder)
    subjects: dict[str, dict] = {}
    warning = None
    no_depth = False
    for i, img in enumerate(images):
        if check:
            check()  # raises when the job is cancelled
        if progress:
            progress(i / max(1, len(images)), f"Анализ кадров для монтажа: {i + 1} из {len(images)}")
        if not no_depth:
            try:
                subjects[img] = depth_mod.ensure(Path(img), (lambda m: progress(0.0, m)) if progress else None)
                continue
            except depth_mod.DepthUnavailable as e:
                no_depth = True
                if any(s.effect == "parallax" for s in todo):
                    warning = f"3D-параллакс выключен: {e}"
                log.warning("depth unavailable: %s", e)
            except Exception as e:  # a broken image must not kill the whole render
                log.warning("depth failed for %s: %s", img, e)
                continue
        try:  # no depth model: closer shots still aim at a face
            subjects[img] = {**depth_mod.face_subject(Path(img)), "flat_only": True}
        except Exception as e:
            log.warning("subject search failed for %s: %s", img, e)

    scenes = []
    for i, s in enumerate(plan.scenes):
        subject = subjects.get(s.image)
        scene_cuts = cuts.get(i) or []
        if s.effect == "parallax" and subject is not None and not subject.get("flat_only"):
            for j, (a, b, shot) in enumerate(make_shots(s.start, s.end, scene_cuts, subject, seed=s.seed,
                                                        intensity=plan.intensity, depth_of_field=depth_of_field)):
                scenes.append(replace(s, start=a, end=b, shot=shot, transition=s.transition if j == 0 else "cut"))
            continue
        if s.effect == "parallax":
            s = replace(s, effect="drift")
        if subject is None or not scene_cuts:
            scenes.append(s)
            continue
        for j, (a, b, framing) in enumerate(make_flat_shots(s.start, s.end, scene_cuts, subject, seed=s.seed)):
            scenes.append(replace(s, start=a, end=b, framing=framing, span=[s.start, s.end],
                                  transition=s.transition if j == 0 else "cut"))
    plan.scenes = scenes
    return warning


# ============================================================== frames
def prepare_layers(image: np.ndarray, depth: np.ndarray, width: int, height: int):
    """Source, its blurred copy (depth of field) and warp-ready depth at the buffer size."""
    sw, sh = int(width * SOURCE_SCALE), int(height * SOURCE_SCALE)
    src = cover_fit(image, sw, sh)
    # Same crop as cover_fit, but no sharpening (it would leave halos in depth).
    h, w = image.shape[:2]
    scale = max(sw / w, sh / h)
    nw, nh = max(sw, round(w * scale)), max(sh, round(h * scale))
    d = cv2.resize(depth, (nw, nh), interpolation=cv2.INTER_CUBIC).clip(0, 1)
    x, y = (nw - sw) // 2, (nh - sh) // 2
    d = d[y:y + sh, x:x + sw]
    # Grow the foreground a little so its silhouette carries a rim of itself, then soften.
    r = max(3, round(9 * sw / 2400)) | 1
    d = cv2.dilate(d, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (r, r)))
    d = np.ascontiguousarray(cv2.GaussianBlur(d, (0, 0), 3 * sw / 2400))
    blur = cv2.GaussianBlur(src, (0, 0), 6 * sw / 2400)
    return src, blur, d


def _wobble(t: float, seed: int) -> float:
    """Smooth 1D noise in about [−1, 1] (sum of incommensurate sines)."""
    r = random.Random(seed)
    return sum(math.sin(t * f + r.uniform(0, 6.3)) * a for f, a in ((0.9, 0.6), (2.3, 0.3), (5.1, 0.1)))


class ParallaxRenderer:
    def __init__(self, width: int, height: int):
        self.w, self.h = width, height
        # The sampling maps are smooth (depth is blurred), so they are computed on a
        # half-resolution grid and upscaled: ~4× less numpy work per frame. Grid points sit
        # at the centres of 2×2 output blocks, matching cv2.resize's pixel-centre alignment.
        self.gw, self.gh = (width + 1) // 2, (height + 1) // 2
        ys, xs = np.mgrid[0:self.gh, 0:self.gw].astype(np.float32)
        self.X = (xs * 2 + 0.5) / width - 0.5    # fraction of the frame width
        self.Y = (ys * 2 + 0.5) / height - 0.5   # fraction of the frame height

    def frame(self, layers, shot: dict, u: float, t: float, *, extra_zoom: float = 1.0,
              offset: tuple[float, float] = (0.0, 0.0)) -> np.ndarray:
        src, blur, depth = layers
        sh, sw = src.shape[:2]
        aspect = self.w / self.h
        e = u - 0.5                       # linear: the move keeps going through cuts
        seed = shot["seed"]
        # handheld: tiny slow wobble of framing and roll
        hx = _wobble(t * 0.7, seed) * 0.0025
        hy = _wobble(t * 0.6, seed + 1) * 0.002
        roll = math.radians(_wobble(t * 0.5, seed + 2) * 0.25)
        z = shot["zoom"] * (1 + 0.025 * e) * extra_zoom
        tx = shot["dirx"] * shot["travel"] * e
        ty = shot["diry"] * shot["travel"] * e * aspect
        k = shot["dolly"] * (e + 0.5)
        focus = shot["focus"]

        cos_r, sin_r = math.cos(roll), math.sin(roll)
        X = self.X * cos_r - self.Y * (sin_r / aspect)
        Y = self.Y * cos_r + self.X * (sin_r * aspect)
        half = 0.5 / z
        cx = min(max(shot["cx"] + hx + offset[0] / z, half), 1 - half)
        cy = min(max(shot["cy"] + hy + offset[1] / z, half), 1 - half)
        mx = ((cx + X / z) * sw).astype(np.float32)
        my = ((cy + Y / z) * sh).astype(np.float32)
        d = None
        for _ in range(3):  # fixed point: sample depth where the pixel actually comes from
            d = cv2.remap(depth, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) - focus
            mx = ((cx + (X - tx * d - X * k * d) / z) * sw).astype(np.float32)
            my = ((cy + (Y - ty * d - Y * k * d) / z) * sh).astype(np.float32)
        size = (self.w, self.h)
        mx = cv2.resize(mx, size, interpolation=cv2.INTER_LINEAR)
        my = cv2.resize(my, size, interpolation=cv2.INTER_LINEAR)
        # Bicubic only when the source is magnified (close-ups); bilinear is enough otherwise.
        interp = cv2.INTER_CUBIC if z > SOURCE_SCALE else cv2.INTER_LINEAR
        out = cv2.remap(src, mx, my, interp, borderMode=cv2.BORDER_REFLECT_101)
        if shot["dof"] > 0.01:
            # background behind the focus plane goes soft, as with a long lens
            w = np.clip((-d - 0.12) * (2.2 * shot["dof"]), 0, 1)
            if w.max() > 0.01:
                w = cv2.resize(w, size, interpolation=cv2.INTER_LINEAR)
                soft = cv2.remap(blur, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)
                out = cv2.blendLinear(out, soft, 1 - w, w)
        return out
