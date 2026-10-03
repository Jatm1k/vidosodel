"""Per-frame post-processing: colour grade, vignette, film grain, fades.

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

    def __init__(self, params: LookParams, width: int, height: int):
        self.p = params
        self.w, self.h = width, height
        self._lut = self._build_lut()
        self._vignette = self._build_vignette() if params.vignette > 0.01 else None
        self._grain = self._build_grain() if params.grain > 0.3 else None
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
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        nx = (xx - self.w / 2) / (self.w / 2)
        ny = (yy - self.h / 2) / (self.h / 2)
        d = np.sqrt(nx**2 * 0.85 + ny**2 * 1.0)
        mask = 1 - self.p.vignette * np.clip((d - 0.45) / 0.95, 0, 1) ** 1.8
        mask = (mask * 255).astype(np.uint8)
        return cv2.merge([mask, mask, mask])

    def _build_grain(self) -> list[tuple[np.ndarray, np.ndarray]]:
        """A few monochrome noise tiles (half resolution, upscaled → filmic grain)."""
        rng = np.random.default_rng(self.p.seed)
        tiles = []
        for _ in range(6):
            n = rng.normal(0, self.p.grain, (self.h // 2, self.w // 2)).astype(np.float32)
            n = cv2.resize(n, (self.w, self.h), interpolation=cv2.INTER_LINEAR)
            pos = np.clip(n, 0, 255).astype(np.uint8)
            neg = np.clip(-n, 0, 255).astype(np.uint8)
            tiles.append((cv2.merge([pos, pos, pos]), cv2.merge([neg, neg, neg])))
        return tiles

    def apply(self, frame: np.ndarray, fade: float = 1.0) -> np.ndarray:
        """Grade a frame in place-ish; ``fade`` < 1 darkens (fade in/out from black)."""
        if self._lut is not None:
            frame = cv2.LUT(frame, self._lut)
        if abs(self.p.saturation - 1) > 1e-3:
            gray = cv2.cvtColor(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
            frame = cv2.addWeighted(frame, self.p.saturation, gray, 1 - self.p.saturation, 0)
        if self._vignette is not None:
            frame = cv2.multiply(frame, self._vignette, scale=1 / 255)
        if self._grain is not None:
            pos, neg = self._grain[self._grain_idx % len(self._grain)]
            self._grain_idx += 1
            frame = cv2.subtract(cv2.add(frame, pos), neg)
        if fade < 0.999:
            frame = cv2.convertScaleAbs(frame, alpha=max(0.0, fade))
        return frame
