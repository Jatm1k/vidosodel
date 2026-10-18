"""3D parallax camera over a still image, and phrase-timed shot cuts.

A scene is split at phrase boundaries of the voice-over into *shots* of
different sizes (wide, medium, close) aimed at different faces and things of
the picture (see :func:`plan_shots`). Parallax scenes get a 3D camera per shot;
plain 2D scenes keep their camera move and only change the framing.
Consecutive shots of the same image are joined with hard cuts; neighbours
differ enough in size or place to read as a deliberate cut, not a jump.

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
from .motion import SHOT_MOVES

if TYPE_CHECKING:
    from ..pipeline.timings import Word
    from .engine import RenderPlan

log = logging.getLogger(__name__)

#: Source buffer size relative to the output (headroom for camera travel and close-ups).
SOURCE_SCALE = 1.25
#: Height stretch of the near layers at the peak of a breath (idle breathing at full strength).
BREATH_STRETCH = 0.014
#: Shortest shot produced by a phrase cut, seconds.
MIN_SHOT = 1.8
_PUNCT = set(".,!?;:…—–")


# ============================================================== shot planning
def cut_points(words: Sequence[Word], start: float, end: float, min_len: float = MIN_SHOT,
               seed: int | None = None) -> list[float]:
    """Phrase boundaries inside ``[start, end]`` usable as hard cuts.

    With a ``seed`` the shortest length of every next shot varies (``min_len`` … 1.8×),
    so shots do not all last the same couple of seconds.
    """
    rnd = random.Random(seed) if seed is not None else None
    ws = [w for w in words if start < w.e < end]
    cands = []
    for i, w in enumerate(ws[:-1]):
        if w.w[-1:] in _PUNCT or ws[i + 1].s - w.e > 0.25:
            cands.append(ws[i + 1].s - 0.04)  # a frame ahead of the next word feels snappier
    cuts, last = [], start
    need = rnd.uniform(min_len, min_len * 1.8) if rnd else min_len
    for c in cands:
        if c - last >= need and end - c >= min_len:
            cuts.append(c)
            last = c
            need = rnd.uniform(min_len, min_len * 1.8) if rnd else min_len
    return cuts


#: Zoom of each shot size relative to the whole image.
SIZES = {"wide": 1.0, "medium": 1.32, "close": 1.52}
#: Where the eyes of a framed face sit, from the top of the frame (a little above the middle).
EYE_LINE = 0.4


def _targets(subject: dict) -> list[dict]:
    """The hero first, then other faces and near masses of the image (see :func:`.depth.find_points`)."""
    main = {"kind": "face" if subject.get("face") else "figure", "cx": subject["cx"], "cy": subject["cy"],
            "depth": subject.get("depth", 0.5)}
    points = subject.get("points") or []
    if not subject.get("face"):
        # a faceless hero is framed by its silhouette (head room), not by the centre of its mass
        main = next((p for p in points if p["kind"] == "figure"
                     and abs(p["cx"] - main["cx"]) < p["w"] / 2 and abs(p["cy"] - main["cy"]) < p["h"]), main)
    out = [main]
    for p in points:
        if all(abs(p["cx"] - o["cx"]) > 0.08 or abs(p["cy"] - o["cy"]) > 0.1 for o in out):
            out.append(p)
    return out[:4]


def _frame(kind: str, target: dict | None, zoom: float, rnd: random.Random) -> tuple[float, float]:
    """Centre of the window of a shot: the face on the eye line, off-centre towards the open side."""
    if target is None:
        return 0.5, 0.5
    half = 0.5 / zoom
    # rule of thirds: a subject left of centre stays on the left third, looking into the frame
    side = 1 if target["cx"] < 0.5 else -1
    cx = target["cx"] + side * rnd.uniform(0.06, 0.16) / zoom
    if target.get("kind") == "face":
        cy = target["cy"] + (0.5 - EYE_LINE) / zoom
    elif "top" in target:
        cy = target["top"] - (0.03 if kind == "medium" else 0.015) + half  # head room above a figure
    else:
        cy = target["cy"]
    return min(max(cx, half), 1 - half), min(max(cy, half), 1 - half)


def _jump(a: dict, b: dict) -> bool:
    """Would a cut between two framings read as a jump (nearly the same window)?"""
    z = max(a["zoom"], b["zoom"])
    return (abs(math.log(a["zoom"] / b["zoom"])) < 0.15
            and abs(a["cx"] - b["cx"]) * z < 0.25 and abs(a["cy"] - b["cy"]) * z < 0.25)


def plan_shots(n: int, subject: dict, seed: int) -> list[dict]:
    """Sizes and targets of ``n`` consecutive shots of one image.

    Shots vary in size (wide, medium, close) and in what they aim at (the hero,
    the other person, a figure, a detail), so a scene is cut like coverage of a
    real set: a wide shot, a close-up of the hero, a shot of the other person or
    of a prop, a medium shot… Two neighbours always differ enough in size or
    place to read as a new angle and not as a jump; the wide shot comes back
    after two or three closer ones.
    """
    rnd = random.Random(seed ^ 0x2545F491)
    targets = _targets(subject)
    options: list[tuple[str, int | None]] = [("wide", None)]
    for i, t in enumerate(targets):
        if t.get("kind") != "detail":  # a detail is an insert: only close
            options.append(("medium", i))
        if t.get("kind") in ("face", "detail") or "top" in t:  # a figure gets head and shoulders
            options.append(("close", i))

    def shot(kind: str, ti: int | None) -> dict:
        target = None if ti is None else targets[ti]
        zoom = SIZES[kind] * (rnd.uniform(0.97, 1.04) if kind != "wide" else 1.0)
        cx, cy = _frame(kind, target, zoom, rnd)
        return {"kind": kind, "target": ti, "zoom": zoom, "cx": cx, "cy": cy,
                "depth": (target or targets[0]).get("depth", 0.5)}

    out: list[dict] = []
    since_wide = 0
    for i in range(n):
        if i == 0:
            pick = shot("wide", None) if n == 1 or rnd.random() < 0.75 else shot("medium", 0)
        else:
            prev = out[-1]
            cands, weights = [], []
            for kind, ti in options:
                c = shot(kind, ti)
                if kind == "wide":
                    w = 0.4 + 0.8 * since_wide
                else:
                    w = (1.3 if kind == "close" else 1.0) * (1.0 if ti == 0 else 0.9)
                if (kind, ti) == (prev["kind"], prev["target"]) or _jump(c, prev):
                    w = 0.0
                elif len(out) > 1 and (kind, ti) == (out[-2]["kind"], out[-2]["target"]):
                    w *= 0.35  # A-B-A-B is exactly what this replaces
                cands.append(c)
                weights.append(w)
            pick = rnd.choices(cands, weights)[0] if any(weights) else shot("wide", None)
        since_wide = 0 if pick["kind"] == "wide" else since_wide + 1
        out.append(pick)
    return out


def make_shots(start: float, end: float, cuts: list[float], subject: dict, *, seed: int,
               intensity: float, depth_of_field: bool, moves: bool = False) -> list[tuple[float, float, dict]]:
    """``(start, end, shot)`` triples for one scene (sizes and targets from :func:`plan_shots`).

    With ``moves`` the camera of every shot follows its size: a wide shot trucks
    sideways, a medium one arcs in or out, a close-up slowly pushes in.
    """
    rnd = random.Random(seed)
    k = 0.5 + min(max(intensity, 0.0), 1.0)          # 1.0 at the default intensity 0.5
    bounds = [start, *cuts, end]
    n = len(bounds) - 1
    sx, sy = subject["cx"], subject["cy"]
    out = []
    for i, p in enumerate(plan_shots(n, subject, seed)):
        ang = rnd.uniform(0, math.tau)
        kind = p["kind"]
        if kind == "wide":
            zoom = 1.08
            cx, cy = 0.5 + (sx - 0.5) * 0.15, 0.5 + (sy - 0.5) * 0.15
            travel = 0.045
            # a lone shot gets a slow 3D push in (or, sometimes, a pull out)
            dolly = rnd.choice([0.10, 0.10, -0.08]) if n == 1 else rnd.choice([0.06, -0.06])
            dof = 0.25
        else:
            zoom = 1.02 * p["zoom"]  # the 3D wide shot is a little tighter than the 2D one
            cx, cy = p["cx"], p["cy"]
            travel, dolly = (0.03, 0.05) if kind == "close" else (0.04, rnd.choice([0.05, -0.04]))
            dof = 0.75 if kind == "close" else 0.5
        if moves and n > 1:
            if kind == "wide":
                ang = rnd.choice([0.0, math.pi]) + rnd.uniform(-0.2, 0.2)
                travel, dolly = 0.08, 0.0
            elif kind == "medium":
                travel, dolly = 0.035, rnd.choice([0.07, -0.06])
            else:
                travel, dolly = 0.01, 0.12
        out.append((bounds[i], bounds[i + 1], {
            "kind": kind, "zoom": zoom, "cx": cx, "cy": cy,
            "dirx": math.cos(ang), "diry": math.sin(ang) * 0.5,
            "travel": travel * k, "dolly": dolly * k,
            "focus": p["depth"], "dof": dof if depth_of_field else 0.0,
            "seed": rnd.randrange(1 << 30),
        }))
    return out


def make_flat_shots(start: float, end: float, cuts: list[float], subject: dict, *, seed: int,
                    moves: bool = False) -> list[tuple[float, float, dict | None, str | None]]:
    """``(start, end, framing, move)`` for a 2D scene: the wide shot (``None``) and closer ones from
    :func:`plan_shots`. ``move`` is the camera move of the shot (``moves``), else ``None`` – the
    move of the scene runs through the cuts."""
    rnd = random.Random(seed ^ 0x51ED27)
    bounds = [start, *cuts, end]
    out: list[tuple[float, float, dict | None, str | None]] = []
    last = None
    for i, p in enumerate(plan_shots(len(bounds) - 1, subject, seed)):
        framing = None if p["kind"] == "wide" else {"zoom": p["zoom"], "cx": p["cx"], "cy": p["cy"]}
        move = None
        if moves:
            move = rnd.choice([m for m in SHOT_MOVES[p["kind"]] if m != last] or SHOT_MOVES[p["kind"]])
            last = move
        out.append((bounds[i], bounds[i + 1], framing, move))
    return out


def prepare(plan: RenderPlan, words: Sequence[Word] | None, *, phrase_cuts: bool, depth_of_field: bool,
            shot_moves: bool = False, progress: Callable[[float, str], None] | None = None,
            check: Callable[[], None] | None = None) -> str | None:
    """Split scenes of ``plan`` into shots at phrase boundaries (in place).

    Parallax scenes get depth maps and a 3D camera per shot; plain 2D scenes keep
    their camera move through the cuts and only change the framing, or, with
    ``shot_moves``, give every shot a move of its own. Only scenes inside the rendered window are processed (previews
    render a fragment). Returns a warning when depth is unavailable – parallax
    scenes then fall back to the plain 2D drift.
    """
    t0, t1 = plan.time_offset, plan.time_offset + plan.duration
    use_cuts = phrase_cuts and bool(words)
    cuts: dict[int, list[float]] = {}
    for i, s in enumerate(plan.scenes):
        if use_cuts and s.end > t0 and s.start < t1:
            cuts[i] = cut_points(words, s.start, s.end, seed=s.seed)
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
                                                        intensity=plan.intensity, depth_of_field=depth_of_field,
                                                        moves=shot_moves)):
                scenes.append(replace(s, start=a, end=b, shot=shot, transition=s.transition if j == 0 else "cut"))
            continue
        if s.effect == "parallax":
            s = replace(s, effect="drift")
        if subject is None or not scene_cuts:
            scenes.append(s)
            continue
        for j, (a, b, framing, move) in enumerate(make_flat_shots(s.start, s.end, scene_cuts, subject,
                                                                  seed=s.seed, moves=shot_moves)):
            shot = replace(s, start=a, end=b, framing=framing, span=[s.start, s.end],
                           transition=s.transition if j == 0 else "cut")
            if move:
                shot = replace(shot, effect=move, seed=s.seed + 7919 * j, span=None)
            scenes.append(shot)
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
              offset: tuple[float, float] = (0.0, 0.0), breath: float = 0.0) -> np.ndarray:
        """``breath`` 0..1 stretches the near layers up from the bottom edge (idle breathing)."""
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
        b = BREATH_STRETCH * breath
        d = None
        for _ in range(3):  # fixed point: sample depth where the pixel actually comes from
            d = cv2.remap(depth, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) - focus
            Xs, Ys = X, Y
            if b > 1e-5:
                # the subject plane and everything nearer breathes, the background stays
                fg = np.clip((d + 0.12) / 0.24, 0, 1) * b
                Xs = X - X * fg * 0.35
                Ys = Y - (Y - 0.5) * fg
            mx = ((cx + (Xs - tx * d - Xs * k * d) / z) * sw).astype(np.float32)
            my = ((cy + (Ys - ty * d - Ys * k * d) / z) * sh).astype(np.float32)
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
