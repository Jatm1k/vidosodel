"""Scene transitions: ``blend(a, b, p) -> frame`` with ``p`` going 0 → 1.

``a`` is the outgoing frame, ``b`` the incoming one; both keep moving during
the transition because the engine renders each scene's own motion.
"""
from __future__ import annotations

import math

import cv2
import numpy as np

TRANSITIONS = ["crossfade", "dip_black", "slide_left", "slide_right", "slide_up", "zoom_blend", "wipe", "blur", "flash"]

TRANSITION_LABELS = {
    "cut": "Склейка", "crossfade": "Растворение", "dip_black": "Через чёрный", "slide_left": "Сдвиг влево",
    "slide_right": "Сдвиг вправо", "slide_up": "Сдвиг вверх", "zoom_blend": "Зум-растворение",
    "wipe": "Шторка", "blur": "Через размытие", "flash": "Вспышка",
}


def _smooth(p: float) -> float:
    p = min(max(p, 0.0), 1.0)
    return p * p * (3 - 2 * p)


def crossfade(a: np.ndarray, b: np.ndarray, p: float) -> np.ndarray:
    p = _smooth(p)
    return cv2.addWeighted(a, 1 - p, b, p, 0)


def dip_black(a: np.ndarray, b: np.ndarray, p: float) -> np.ndarray:
    if p < 0.5:
        return cv2.convertScaleAbs(a, alpha=1 - _smooth(p * 2))
    return cv2.convertScaleAbs(b, alpha=_smooth(p * 2 - 1))


def _slide(a: np.ndarray, b: np.ndarray, p: float, axis: int, sign: int) -> np.ndarray:
    e = _smooth(p)
    size = a.shape[1] if axis == 1 else a.shape[0]
    off = int(round(size * e))
    if off <= 0:
        return a
    if off >= size:
        return b
    out = np.empty_like(a)
    if axis == 1:
        if sign > 0:  # b enters from the right, a leaves to the left
            out[:, :size - off] = a[:, off:]
            out[:, size - off:] = b[:, :off]
        else:
            out[:, off:] = a[:, :size - off]
            out[:, :off] = b[:, size - off:]
    else:  # b enters from the bottom
        out[:size - off] = a[off:]
        out[size - off:] = b[:off]
    return out


def slide_left(a, b, p):
    return _slide(a, b, p, 1, 1)


def slide_right(a, b, p):
    return _slide(a, b, p, 1, -1)


def slide_up(a, b, p):
    return _slide(a, b, p, 0, 1)


def _scale_center(img: np.ndarray, z: float) -> np.ndarray:
    if abs(z - 1) < 1e-3:
        return img
    h, w = img.shape[:2]
    m = cv2.getRotationMatrix2D((w / 2, h / 2), 0, z)
    return cv2.warpAffine(img, m, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)


def zoom_blend(a, b, p):
    e = _smooth(p)
    return cv2.addWeighted(_scale_center(a, 1 + 0.18 * e), 1 - e, _scale_center(b, 1.12 - 0.12 * e), e, 0)


def wipe(a, b, p):
    """Soft-edged horizontal wipe from left to right."""
    h, w = a.shape[:2]
    edge = w * 0.18
    pos = -edge + (w + 2 * edge) * _smooth(p)
    x = np.arange(w, dtype=np.float32)
    alpha = np.clip((pos - x) / edge + 0.5, 0, 1)[None, :, None]
    return (a * (1 - alpha) + b * alpha).astype(np.uint8)


def _blur(img: np.ndarray, amount: float) -> np.ndarray:
    if amount < 0.02:
        return img
    h, w = img.shape[:2]
    small = cv2.resize(img, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigmaX=0.5 + 6 * amount)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)


def blur(a, b, p):
    e = _smooth(p)
    bell = math.sin(math.pi * e)
    return cv2.addWeighted(_blur(a, bell), 1 - e, _blur(b, bell), e, 0)


def flash(a, b, p):
    e = _smooth(p)
    base = cv2.addWeighted(a, 1 - e, b, e, 0)
    glow = math.sin(math.pi * p) ** 2 * 0.75
    return cv2.addWeighted(base, 1 - glow, np.full_like(base, 255), glow, 0)


_FUNCS = {
    "crossfade": crossfade, "dip_black": dip_black, "slide_left": slide_left, "slide_right": slide_right,
    "slide_up": slide_up, "zoom_blend": zoom_blend, "wipe": wipe, "blur": blur, "flash": flash,
}


def blend(name: str, a: np.ndarray, b: np.ndarray, p: float) -> np.ndarray:
    return _FUNCS.get(name, crossfade)(a, b, p)
