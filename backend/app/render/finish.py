"""The finish of the whole video in the manner of its motion format: one look over pictures and graphics alike.

The format of a video's motion graphics (see ``backend/motion/lib/formats.mjs``) is not only how its graphics
behave but how the whole film looks: an archive story is a sepia print on old film – grain, a little gate weave,
flicker, dust and scratches; a cinematic essay has a teal-orange grade with soft halation. The brief of the video
picks the grade and how strong the film is (``film``); :func:`finish_params` turns that into :class:`FinishParams`
and :class:`FinishProcessor` applies it to every frame of the render (before the look and the subtitles, so the
burned-in subtitles stay clean).

Every effect is a pure function of the frame number and the seed: segments render in parallel and agree.
"""
from __future__ import annotations

import math
import random
from dataclasses import asdict, dataclass, fields
from typing import Any

import cv2
import numpy as np

GRADES = ("none", "warm", "sepia", "mono", "cold", "faded", "teal", "bleach")


@dataclass(slots=True)
class FinishParams:
    seed: int = 1
    grade: str = "none"
    grade_mix: float = 0.5   # 0..1 – share of the graded picture
    grain: float = 0.0       # 0..1 strengths
    weave: float = 0.0
    flicker: float = 0.0
    dust: float = 0.0
    scratches: float = 0.0
    halation: float = 0.0
    vignette: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)

    @property
    def active(self) -> bool:
        return (self.grade != "none" and self.grade_mix > 0.01) or any(
            getattr(self, k) > 0.01 for k in ("grain", "weave", "flicker", "dust", "scratches", "halation", "vignette"))


def finish_params(base: dict[str, Any] | None, *, grade: str | None = None, film: float = 1.0,
                  seed: int = 1) -> dict[str, Any]:
    """The finish of a video: the format's own (``base`` – strengths at full), the brief's grade, scaled by ``film``."""
    base = dict(base or {})
    k = max(0.0, min(1.5, float(film)))
    out = FinishParams(seed=seed)
    g = grade if grade in GRADES else base.get("grade")
    out.grade = g if g in GRADES else "none"
    # the format's own grade keeps its strength; another one chosen by the brief gets a moderate one
    out.grade_mix = 0.0 if out.grade == "none" else float(base.get("grade_mix", 0.45)) if out.grade == base.get("grade") else 0.45
    for f in ("grain", "weave", "flicker", "dust", "scratches", "halation", "vignette"):
        setattr(out, f, round(max(0.0, min(1.0, float(base.get(f, 0.0)) * k)), 3))
    return out.to_dict()


def _noise(x: float, seed: int) -> float:
    """Smooth 1D value noise in −1..1."""
    i = math.floor(x)
    f = x - i

    def r(k: int) -> float:
        v = math.sin((k + seed * 13.37) * 127.1) * 43758.5453
        return (v - math.floor(v)) * 2 - 1
    u = f * f * (3 - 2 * f)
    return r(i) + (r(i + 1) - r(i)) * u


class FinishProcessor:
    """Applies :class:`FinishParams` to BGR frames of a fixed size."""

    def __init__(self, params: FinishParams, width: int, height: int, fps: float):
        self.p = params
        self.w, self.h, self.fps = width, height, fps
        self.k = width / 1920.0  # sizes are given for 1080p
        self._grade = self._build_grade()
        self._vig = self._build_vignette() if params.vignette > 0.01 else None
        self._grain = self._build_grain() if params.grain > 0.01 else None

    @property
    def active(self) -> bool:
        return self.p.active

    # ---------------------------------------------------------------- precomputed
    def _build_grade(self):
        g, m = self.p.grade, self.p.grade_mix
        if g == "none" or m <= 0.01:
            return None
        x = np.arange(256, dtype=np.float32) / 255.0

        def lut(b, gr, r):  # three curves 0..1 → a cv2 LUT (BGR order)
            return (np.clip(np.stack([b, gr, r], axis=-1), 0, 1) * 255).astype(np.uint8).reshape(1, 256, 3)

        def ramp(stops):  # luminance → colour through (pos, (r, g, b)) stops
            pos = np.array([s[0] for s in stops], np.float32)
            cols = np.array([s[1] for s in stops], np.float32) / 255.0
            return [np.interp(x, pos, cols[:, c]) for c in range(3)]
        s_curve = 0.5 + (x - 0.5) * 1.12 / (1 + 0.24 * np.abs(x - 0.5) * 2)
        if g == "mono":
            return ("gray", lut(s_curve, s_curve, s_curve), m)
        if g == "sepia":
            r, gr, b = ramp([(0, (28, 18, 10)), (0.45, (128, 92, 58)), (0.8, (214, 190, 150)), (1, (246, 236, 212))])
            return ("gray", lut(b, gr, r), m)
        if g == "bleach":
            c = np.clip(0.5 + (x - 0.5) * 1.45, 0, 1)
            return ("bleach", lut(c, c, c), m)
        if g == "warm":
            return ("rgb", lut(x * 0.9, x * 1.0 + 0.01, x * 1.05 + 0.025), m)
        if g == "cold":
            return ("rgb", lut(x * 1.05 + 0.03, x * 1.0 + 0.008, x * 0.93), m)
        if g == "faded":
            f = 0.09 + x * 0.83
            return ("faded", lut(f * 0.98, f, f * 1.02), m)
        # teal: shadows to teal, highlights to amber (offsets by luminance)
        sh = np.clip(1 - x / 0.55, 0, 1) ** 1.4
        hi = np.clip((x - 0.45) / 0.55, 0, 1) ** 1.2
        off_b = 0.10 * sh - 0.08 * hi
        off_g = 0.03 * sh + 0.01 * hi
        off_r = -0.07 * sh + 0.08 * hi
        pos = lut(np.clip(off_b, 0, 1), np.clip(off_g, 0, 1), np.clip(off_r, 0, 1))
        neg = lut(np.clip(-off_b, 0, 1), np.clip(-off_g, 0, 1), np.clip(-off_r, 0, 1))
        return ("split", (pos, neg), m)

    def _build_vignette(self) -> np.ndarray:
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        nx = (xx - self.w / 2) / (self.w / 2)
        ny = (yy - self.h / 2) / (self.h / 2)
        d = np.sqrt(nx ** 2 * 0.8 + ny ** 2)
        shape = np.clip((d - 0.35) / 1.0, 0, 1) ** 1.6 * 0.75 * self.p.vignette
        return (shape * 255).astype(np.uint8)[:, :, None].repeat(3, axis=2)

    def _build_grain(self) -> list[tuple[np.ndarray, np.ndarray]]:
        rng = np.random.default_rng(self.p.seed + 17)
        amount = 2.0 + 7.0 * self.p.grain
        gh, gw = max(2, self.h // 2), max(2, self.w // 2)
        tiles = []
        for _ in range(8):
            mono = rng.normal(0, amount, (gh, gw)).astype(np.float32)
            chans = [mono + rng.normal(0, amount * 0.18, (gh, gw)).astype(np.float32) for _c in range(3)]
            n = cv2.resize(cv2.merge(chans), (self.w, self.h), interpolation=cv2.INTER_LINEAR)
            tiles.append((np.clip(n, 0, 255).astype(np.uint8), np.clip(-n, 0, 255).astype(np.uint8)))
        return tiles

    # ---------------------------------------------------------------- per frame
    def apply(self, frame: np.ndarray, t: float) -> np.ndarray:
        p = self.p
        n = int(round(t * self.fps))
        if self._grade is not None:
            frame = self._apply_grade(frame)
        if p.halation > 0.01:
            frame = self._halation(frame)
        if self._vig is not None:
            frame = cv2.subtract(frame, cv2.multiply(frame, self._vig, scale=1 / 255))
        if p.flicker > 0.01:
            k = 1 + p.flicker * (0.035 * _noise(t * 9.0, p.seed) + 0.015 * _noise(t * 23.0, p.seed + 3))
            frame = cv2.convertScaleAbs(frame, alpha=k)
        if p.weave > 0.01:
            dx = p.weave * self.k * (1.4 * _noise(t * 3.1, p.seed + 5) + 0.5 * _noise(t * 11.0, p.seed + 9))
            dy = p.weave * self.k * (1.8 * _noise(t * 2.3, p.seed + 7) + 0.6 * _noise(t * 13.0, p.seed + 11))
            m = np.float32([[1, 0, dx], [0, 1, dy]])
            frame = cv2.warpAffine(frame, m, (self.w, self.h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        if p.scratches > 0.01:
            self._scratches(frame, n)
        if p.dust > 0.01:
            self._dust(frame, n)
        if self._grain is not None:
            pos, neg = self._grain[random.Random(p.seed * 7919 + n).randrange(len(self._grain))]
            frame = cv2.subtract(cv2.add(frame, pos), neg)
        return frame

    def _apply_grade(self, frame: np.ndarray) -> np.ndarray:
        kind, lut, m = self._grade
        if kind == "rgb":
            graded = cv2.LUT(frame, lut)
        elif kind == "split":
            gray = cv2.cvtColor(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
            graded = cv2.subtract(cv2.add(frame, cv2.LUT(gray, lut[0])), cv2.LUT(gray, lut[1]))
        elif kind == "faded":
            gray = cv2.cvtColor(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
            graded = cv2.LUT(cv2.addWeighted(frame, 0.72, gray, 0.28, 0), lut)
        elif kind == "bleach":
            gray = cv2.cvtColor(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
            graded = cv2.addWeighted(frame, 0.45, cv2.LUT(gray, lut), 0.55, 0)
        else:  # gray-based tones: mono, sepia
            gray = cv2.cvtColor(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
            graded = cv2.LUT(gray, lut)
        return cv2.addWeighted(frame, 1 - m, graded, m, 0)

    def _halation(self, frame: np.ndarray) -> np.ndarray:
        """Highlights bleed a warm red glow into their surroundings, like light in the film's base."""
        sw, sh = max(2, self.w // 4), max(2, self.h // 4)
        small = cv2.resize(frame, (sw, sh), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        hi = cv2.subtract(gray, 170)
        glow = cv2.GaussianBlur(hi, (0, 0), 7)
        glow = cv2.resize(glow, (self.w, self.h), interpolation=cv2.INTER_LINEAR)
        a = 1.6 * self.p.halation
        tint = cv2.merge([cv2.convertScaleAbs(glow, alpha=a * 0.35), cv2.convertScaleAbs(glow, alpha=a * 0.6),
                          cv2.convertScaleAbs(glow, alpha=a * 1.0)])
        return cv2.add(frame, tint)

    def _dust(self, frame: np.ndarray, n: int) -> None:
        """Specks and hairs on the film: a few each frame, each frame different."""
        r = random.Random(self.p.seed * 104729 + n)
        count = int(self.p.dust * 6 * r.random() ** 1.5 + (1 if r.random() < self.p.dust * 0.6 else 0))
        for _ in range(count):
            x, y = r.uniform(0, self.w), r.uniform(0, self.h)
            dark = r.random() < 0.7
            col = (18, 16, 14) if dark else (235, 235, 230)
            if r.random() < 0.25:  # a hair: a thin curved line
                pts = []
                ang, length = r.uniform(0, math.tau), r.uniform(18, 70) * self.k
                for i in range(6):
                    u = i / 5
                    ang += r.uniform(-0.5, 0.5)
                    pts.append((x + math.cos(ang) * length * u, y + math.sin(ang) * length * u))
                cv2.polylines(frame, [np.int32(pts)], False, col, max(1, int(1.2 * self.k)), cv2.LINE_AA)
            else:
                rad = max(1, int(r.uniform(0.8, 3.2) * self.k))
                cv2.circle(frame, (int(x), int(y)), rad, col, -1, cv2.LINE_AA)

    def _scratches(self, frame: np.ndarray, n: int) -> None:
        """Long vertical scratches that stay for a while and drift a little."""
        seg = n // 18
        for k in (seg, seg - 1):
            r = random.Random(self.p.seed * 7907 + k)
            if r.random() > self.p.scratches * 0.7:
                continue
            start, life = k * 18 + r.randrange(0, 18), r.randrange(6, 24)
            if not start <= n < start + life:
                continue
            x = r.uniform(0.08, 0.92) * self.w + (n - start) * r.uniform(-0.6, 0.6) * self.k
            bright = r.random() < 0.6
            xi = int(x)
            if not 0 <= xi < self.w - 2:
                continue
            col = frame[:, xi:xi + max(1, int(self.k * 1.5))].astype(np.int16)
            delta = 38 if bright else -38
            y0 = int(r.uniform(0, 0.4) * self.h)
            y1 = int(r.uniform(0.6, 1.0) * self.h)
            col[y0:y1] += delta
            frame[:, xi:xi + col.shape[1]] = np.clip(col, 0, 255).astype(np.uint8)


def processor_for(d: dict[str, Any] | None, width: int, height: int, fps: float) -> FinishProcessor | None:
    if not d:
        return None
    known = {f.name for f in fields(FinishParams)}
    p = FinishParams(**{k: v for k, v in d.items() if k in known})
    proc = FinishProcessor(p, width, height, fps)
    return proc if proc.active else None
