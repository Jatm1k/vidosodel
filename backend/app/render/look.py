"""Per-frame post-processing: colour grade, vignette, film grain, fades.

Vignette breathing and grain boil (see :mod:`.atmosphere`) live here too.

Every render draws a fresh random :class:`LookParams` (when uniqueness is on),
so two renders of the same project differ at pixel level – colour balance,
grain pattern, micro zoom, vignette – while looking the same to a viewer.
All heavy work is precomputed once per process (LUTs, masks, noise tiles).
"""
from __future__ import annotations

import random
from dataclasses import asdict, dataclass

import cv2
import numpy as np

from ..settings_schema import UniqueSettings
from .atmosphere import AtmosphereParams, boil_step, vignette_level


@dataclass(slots=True)
class LookParams:
    seed: int
    brightness: float = 0.0     # −0.05..0.05 (fraction of full range)
    contrast: float = 1.0       # 0.94..1.08
    saturation: float = 1.0     # 0.92..1.10
    temperature: float = 0.0    # −0.04..0.04 (warm > 0)
    gamma: float = 1.0
    vignette: float = 0.0       # 0..0.45 darkening at corners
    grain: float = 0.0          # 0..6 noise amplitude (8-bit levels)
    micro_zoom: float = 1.0     # 1.0..1.035
    offset_x: float = 0.0       # −0.01..0.01
    offset_y: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


def random_look(cfg: UniqueSettings, seed: int | None = None) -> LookParams:
    seed = seed if seed is not None else random.randrange(1, 2**31)
    if not cfg.enabled:
        return LookParams(seed=seed)
    r = random.Random(seed)
    k = 0.4 + 1.2 * min(max(cfg.strength, 0.0), 1.0)
    p = LookParams(seed=seed)
    if cfg.color_jitter:
        p.brightness = r.uniform(-0.02, 0.025) * k
        p.contrast = 1 + r.uniform(-0.03, 0.05) * k
        p.saturation = 1 + r.uniform(-0.05, 0.07) * k
        p.temperature = r.uniform(-0.025, 0.025) * k
        p.gamma = 1 + r.uniform(-0.04, 0.04) * k
    if cfg.vignette:
        p.vignette = r.uniform(0.12, 0.28) * k
    if cfg.film_grain:
        p.grain = r.uniform(1.8, 3.2) * k
    if cfg.micro_zoom:
        p.micro_zoom = 1 + r.uniform(0.008, 0.025) * k
        p.offset_x = r.uniform(-0.006, 0.006) * k
        p.offset_y = r.uniform(-0.005, 0.005) * k
    return p


class LookProcessor:
    """Applies :class:`LookParams` to BGR frames of a fixed size."""

    def __init__(self, params: LookParams, width: int, height: int, atmo: AtmosphereParams | None = None):
        self.p = params
        self.a = atmo or AtmosphereParams()
        self.w, self.h = width, height
        self._lut = self._build_lut()
        breathing = self.a.vignette_breathing > 0
        self._vignette = self._build_vignette() if params.vignette > 0.01 or breathing else None
        if self.a.grain_boil > 0:  # boiling grain replaces the per-frame one
            self._grain = self._build_grain(2.2 + 4.5 * self.a.grain_boil, scale=3, chroma=0.35)
        else:
            self._grain = self._build_grain(params.grain) if params.grain > 0.3 else None
        self._grain_idx = 0

    def _build_lut(self) -> np.ndarray | None:
        p = self.p
        if (abs(p.brightness) < 1e-4 and abs(p.contrast - 1) < 1e-4 and abs(p.temperature) < 1e-4
                and abs(p.gamma - 1) < 1e-4):
            return None
        x = np.arange(256, dtype=np.float32) / 255.0
        x = np.power(x, 1 / p.gamma)
        x = (x - 0.5) * p.contrast + 0.5 + p.brightness
        b = np.clip(x - p.temperature, 0, 1)
        g = np.clip(x + p.temperature * 0.15, 0, 1)
        r = np.clip(x + p.temperature, 0, 1)
        lut = np.stack([b, g, r], axis=-1) * 255
        return np.clip(lut, 0, 255).astype(np.uint8).reshape(1, 256, 3)

    def _build_vignette(self) -> np.ndarray:
        """Shape of the vignette at full strength (darkening × 255); scaled per frame."""
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        nx = (xx - self.w / 2) / (self.w / 2)
        ny = (yy - self.h / 2) / (self.h / 2)
        d = np.sqrt(nx**2 * 0.85 + ny**2 * 1.0)
        shape = (np.clip((d - 0.45) / 0.95, 0, 1) ** 1.8 * 255).astype(np.uint8)
        return cv2.merge([shape, shape, shape])

    def _build_grain(self, amount: float, scale: int = 2, chroma: float = 0.0) -> list[tuple[np.ndarray, np.ndarray]]:
        """A few noise tiles (generated at 1/``scale`` resolution and upscaled → filmic grain).

        ``chroma`` adds a little independent noise per colour channel.
        """
        rng = np.random.default_rng(self.p.seed)
        gh, gw = self.h // scale, self.w // scale
        tiles = []
        for _ in range(6):
            mono = rng.normal(0, amount, (gh, gw)).astype(np.float32)
            chans = [mono + rng.normal(0, amount * chroma, (gh, gw)).astype(np.float32) if chroma else mono
                     for _c in range(3)]
            n = cv2.resize(cv2.merge(chans), (self.w, self.h), interpolation=cv2.INTER_LINEAR)
            tiles.append((np.clip(n, 0, 255).astype(np.uint8), np.clip(-n, 0, 255).astype(np.uint8)))
        return tiles

    def _grain_tile(self, t: float) -> tuple[np.ndarray, np.ndarray]:
        if self.a.grain_boil <= 0:
            self._grain_idx += 1
            return self._grain[self._grain_idx % len(self._grain)]
        # held for a few frames, then a random other tile (pure function of the step)
        step = boil_step(self.a, t)
        n = len(self._grain)
        idx = random.Random(self.p.seed * 7919 + step).randrange(n)
        if idx == random.Random(self.p.seed * 7919 + step - 1).randrange(n):
            idx = (idx + 1) % n
        return self._grain[idx]

    def apply(self, frame: np.ndarray, fade: float = 1.0, t: float = 0.0) -> np.ndarray:
        """Grade a frame in place-ish; ``fade`` < 1 darkens (fade in/out from black)."""
        if self._lut is not None:
            frame = cv2.LUT(frame, self._lut)
        if abs(self.p.saturation - 1) > 1e-3:
            gray = cv2.cvtColor(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
            frame = cv2.addWeighted(frame, self.p.saturation, gray, 1 - self.p.saturation, 0)
        if self._vignette is not None:
            k = vignette_level(self.a, self.p.vignette, t)
            frame = cv2.subtract(frame, cv2.multiply(frame, self._vignette, scale=k / 255))
        if self._grain is not None:
            pos, neg = self._grain_tile(t)
            frame = cv2.subtract(cv2.add(frame, pos), neg)
        if fade < 0.999:
            frame = cv2.convertScaleAbs(frame, alpha=max(0.0, fade))
        return frame
