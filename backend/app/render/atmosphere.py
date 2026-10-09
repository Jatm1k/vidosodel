"""Atmosphere: subtle life in a still picture.

Six independent effects, each a pure function of time and the render seed
(so segments render in parallel and every render differs a little):

* **line boil** – the picture wobbles by a pixel or two, redrawn "on twos/threes"
  like hand-drawn animation (a cycle of three displacement fields);
* **grain boil** – a coarse, slightly coloured grain that changes at the same
  stepped rate instead of every frame (see :class:`.look.LookProcessor`);
* **idle breathing** – the subject slowly stretches up and back (only the near
  layers in 3D-parallax shots, the whole frame from the bottom edge otherwise);
* **light pulse** – a slow glow of the highlights;
* **vignette breathing** – the vignette slowly deepens and lifts
  (see :class:`.look.LookProcessor`);
* **floating dust** – specks and soft out-of-focus motes drifting in the light.

:class:`Atmosphere` applies line boil, light pulse and dust to a composed frame;
breathing is applied by the cameras, grain and vignette by the look processor.
"""
from __future__ import annotations

import math
import random
from dataclasses import asdict, dataclass

import cv2
import numpy as np

from ..settings_schema import AtmosphereSettings


@dataclass(slots=True)
class AtmosphereParams:
    seed: int = 0
    #: Strengths 0..1; 0 = off.
    line_boil: float = 0.0
    grain_boil: float = 0.0
    breathing: float = 0.0
    light_pulse: float = 0.0
    vignette_breathing: float = 0.0
    dust: float = 0.0
    #: Boil redraws every ``boil_hold`` frames (of 30 fps).
    boil_hold: int = 3
    #: Periods, seconds (randomised per render).
    breath_period: float = 4.2
    pulse_period: float = 6.0
    vignette_period: float = 8.0

    def to_dict(self) -> dict:
        return asdict(self)

    @property
    def any_frame_effect(self) -> bool:
        return self.line_boil > 0 or self.light_pulse > 0 or self.dust > 0


def make_params(cfg: AtmosphereSettings, seed: int) -> AtmosphereParams:
    r = random.Random(seed ^ 0xA7305)

    def level(on: bool, strength: float) -> float:
        return min(max(strength, 0.0), 1.0) if on else 0.0

    return AtmosphereParams(
        seed=seed,
        line_boil=level(cfg.line_boil, cfg.line_boil_strength),
        grain_boil=level(cfg.grain_boil, cfg.grain_boil_strength),
        breathing=level(cfg.breathing, cfg.breathing_strength),
        light_pulse=level(cfg.light_pulse, cfg.light_pulse_strength),
        vignette_breathing=level(cfg.vignette_breathing, cfg.vignette_breathing_strength),
        dust=level(cfg.dust, cfg.dust_strength),
        boil_hold=min(max(cfg.boil_hold, 1), 4),
        breath_period=r.uniform(3.6, 4.8),
        pulse_period=r.uniform(5.0, 7.5),
        vignette_period=r.uniform(7.0, 10.0),
    )


# ================================================================ time curves
def _phase(seed: int, salt: int) -> float:
    return random.Random(seed * 31 + salt).uniform(0, math.tau)


def wave(t: float, period: float, seed: int, salt: int) -> float:
    """Smooth 0..1 oscillation with a slightly irregular rhythm (never mechanical)."""
    ph = _phase(seed, salt)
    x = math.tau * t / period + ph + 0.35 * math.sin(math.tau * t / (period * 2.7) + ph * 1.7)
    return 0.5 - 0.5 * math.cos(x)


def breath(p: AtmosphereParams, t: float) -> float:
    """Current breathing stretch, 0..1 (0 = exhaled); multiply by the camera's amplitude."""
    if p.breathing <= 0:
        return 0.0
    return p.breathing * wave(t, p.breath_period, p.seed, 1)


def boil_step(p: AtmosphereParams, t: float) -> int:
    """Index of the current boil "drawing": changes every ``boil_hold`` frames of 30 fps."""
    return int(math.floor(t * 30.0 / p.boil_hold + 1e-6))


def vignette_level(p: AtmosphereParams, base: float, t: float) -> float:
    """Vignette strength at ``t``: breathes around ``base`` when enabled."""
    s = p.vignette_breathing
    if s <= 0:
        return base
    base = max(base, 0.14 + 0.16 * s)
    amp = 0.25 + 0.4 * s
    return base * (1 + amp * (wave(t, p.vignette_period, p.seed, 3) * 2 - 1))


# ================================================================ per-frame effects
class Atmosphere:
    """Applies line boil, light pulse and floating dust to frames of a fixed size."""

    #: Line boil: displacement fields cycled like a three-drawing boil loop.
    BOIL_DRAWINGS = 3

    def __init__(self, params: AtmosphereParams, width: int, height: int):
        self.p = params
        self.w, self.h = width, height
        self.k = width / 1920  # sizes are tuned for 1080p
        self._boil = self._build_boil() if params.line_boil > 0 else None
        self._dust = _Dust(params, width, height) if params.dust > 0 else None

    @property
    def active(self) -> bool:
        return self.p.any_frame_effect

    # ---------------------------------------------------------------- line boil
    def _build_boil(self) -> list[tuple[np.ndarray, np.ndarray]]:
        rng = np.random.default_rng(self.p.seed ^ 0xB011)
        amp = (0.6 + 1.6 * self.p.line_boil) * self.k   # pixels
        ys, xs = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        maps = []
        for _ in range(self.BOIL_DRAWINGS):
            fields = []
            for _axis in range(2):
                f = np.zeros((self.h, self.w), np.float32)
                # two octaves: wobble of strokes (~25 px) + a little finer jitter (~10 px)
                for cell, weight in ((26, 1.0), (10, 0.45)):
                    c = max(4, round(cell * self.k))
                    n = rng.normal(0, 1, (self.h // c + 2, self.w // c + 2)).astype(np.float32)
                    n = cv2.resize(n, (n.shape[1] * c, n.shape[0] * c), interpolation=cv2.INTER_CUBIC)
                    f += n[:self.h, :self.w] * weight
                f *= amp / max(1e-6, float(f.std()))
                fields.append(f)
            maps.append(cv2.convertMaps(xs + fields[0], ys + fields[1], cv2.CV_16SC2))
        return maps

    def _line_boil(self, frame: np.ndarray, t: float) -> np.ndarray:
        m1, m2 = self._boil[boil_step(self.p, t) % self.BOIL_DRAWINGS]
        return cv2.remap(frame, m1, m2, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT_101)

    # ---------------------------------------------------------------- light pulse
    def _light_pulse(self, frame: np.ndarray, t: float) -> np.ndarray:
        s = self.p.light_pulse
        pulse = wave(t, self.p.pulse_period, self.p.seed, 2)
        sw, sh = max(16, self.w // 4), max(9, self.h // 4)
        small = cv2.resize(frame, (sw, sh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        lum = small.max(axis=2)
        mask = np.clip((lum - 0.55) / 0.4, 0, 1) ** 1.5
        gain = s * (0.15 + 0.55 * pulse)
        glow = cv2.GaussianBlur(small * mask[..., None], (0, 0), sw / 70) * (255 * gain)
        glow = cv2.resize(np.clip(glow, 0, 255).astype(np.uint8), (self.w, self.h), interpolation=cv2.INTER_LINEAR)
        exposure = 1 + 0.025 * s * (pulse * 2 - 1)
        return cv2.addWeighted(frame, exposure, glow, 1.0, 0)  # saturating uint8, one pass

    # ---------------------------------------------------------------- pipeline
    def apply(self, frame: np.ndarray, t: float) -> np.ndarray:
        if self._boil is not None:
            frame = self._line_boil(frame, t)
        if self.p.light_pulse > 0:
            frame = self._light_pulse(frame, t)
        if self._dust is not None:
            frame = self._dust.draw(frame, t)
        return frame


# ================================================================ floating dust
class _Dust:
    """Particles drifting through the frame; positions wrap around, so any ``t`` is drawable directly.

    Three depth bands: far specks (tiny, sharp, slow), mid motes and a few near
    out-of-focus discs (large, very faint, faster). Sprites are pre-rendered
    with sub-pixel phases, so slow motion stays smooth.
    """

    PHASES = 4                 # sub-pixel positions per axis
    COLOR = (225, 240, 255)    # warm white, BGR

    def __init__(self, p: AtmosphereParams, width: int, height: int):
        self.w, self.h = width, height
        k = width / 1920
        r = random.Random(p.seed ^ 0xD057)
        count = round((60 + 160 * p.dust) * (0.6 + 0.4 * min(k, 2.0)))
        self.parts = []
        self.sprites: dict[int, list[np.ndarray]] = {}
        for _ in range(count):
            band = r.random()
            if band < 0.6:      # far: specks
                z, radius, alpha = 0.0, r.uniform(0.9, 1.7), r.uniform(0.5, 0.9)
            elif band < 0.92:   # mid: soft motes
                z, radius, alpha = 0.5, r.uniform(1.8, 3.2), r.uniform(0.3, 0.6)
            else:               # near: bokeh discs
                z, radius, alpha = 1.0, r.uniform(9, 22), r.uniform(0.07, 0.15)
            radius *= k
            speed = (0.006 + 0.03 * z) * r.uniform(0.6, 1.4)          # frame widths per second
            ang = r.uniform(-math.pi * 0.85, -math.pi * 0.15)           # mostly rising
            size_key = max(1, round(radius * 2))
            self.parts.append({
                "x": r.random(), "y": r.random(),
                "vx": math.cos(ang) * speed, "vy": math.sin(ang) * speed * 0.6,
                "sway": r.uniform(0.004, 0.012) * (1 + z), "fs": r.uniform(0.15, 0.45), "ph": r.uniform(0, math.tau),
                "tw": r.uniform(0.3, 1.2), "tph": r.uniform(0, math.tau),
                "alpha": alpha * (0.6 + 0.4 * p.dust), "size": size_key,
            })
            if size_key not in self.sprites:
                self.sprites[size_key] = self._make_sprites(radius, near=z >= 1.0)

    def _make_sprites(self, radius: float, near: bool) -> list[np.ndarray]:
        """``PHASES²`` copies of one particle, shifted by sub-pixel steps."""
        pad = int(math.ceil(radius * 2 + 2))
        n = pad * 2 + 1
        out = []
        for py in range(self.PHASES):
            for px in range(self.PHASES):
                ys, xs = np.mgrid[0:n, 0:n].astype(np.float32)
                d = np.hypot(xs - pad - px / self.PHASES, ys - pad - py / self.PHASES)
                if near:  # out-of-focus disc: flat body, soft rim, slightly brighter edge
                    a = np.clip((radius - d) / max(1.0, radius * 0.25), 0, 1)
                    a *= 0.8 + 0.2 * np.clip(d / radius, 0, 1)
                else:
                    a = np.exp(-(d / max(0.5, radius * 0.6)) ** 2)
                spr = np.stack([a * c for c in self.COLOR], axis=-1)
                out.append(spr.astype(np.float32))
        return out

    def draw(self, frame: np.ndarray, t: float) -> np.ndarray:
        h, w = self.h, self.w
        if not frame.flags.writeable:
            frame = frame.copy()
        for q in self.parts:
            x = (q["x"] + q["vx"] * t + q["sway"] * math.sin(t * q["fs"] * math.tau + q["ph"])) % 1.0
            y = (q["y"] + q["vy"] * t + q["sway"] * 0.7 * math.cos(t * q["fs"] * 4.4 + q["ph"])) % 1.0
            a = q["alpha"] * (0.55 + 0.45 * math.sin(t * q["tw"] * math.tau + q["tph"]))
            if a < 0.01:
                continue
            sprites = self.sprites[q["size"]]
            n = sprites[0].shape[0]
            pad = n // 2
            # wrap with a margin so particles leave and enter smoothly
            fx = x * (w + 2 * n) - n
            fy = y * (h + 2 * n) - n
            ix, iy = int(math.floor(fx)), int(math.floor(fy))
            spr = sprites[int((fy - iy) * self.PHASES) * self.PHASES + int((fx - ix) * self.PHASES)]
            x0, y0 = ix - pad, iy - pad
            sx0, sy0 = max(0, -x0), max(0, -y0)
            x1, y1 = min(w, x0 + n), min(h, y0 + n)
            if x1 <= max(0, x0) or y1 <= max(0, y0):
                continue
            roi = frame[max(0, y0):y1, max(0, x0):x1]
            part = spr[sy0:sy0 + roi.shape[0], sx0:sx0 + roi.shape[1]]
            # screen blend: brightens dark areas, barely touches bright ones
            rf = roi.astype(np.float32)
            roi[:] = np.clip(rf + part * a * (1 - rf / 255), 0, 255).astype(np.uint8)
        return frame
