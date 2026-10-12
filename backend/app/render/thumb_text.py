"""Headline on a thumbnail, drawn by the program.

Image models misspell letters outside English and choose weak type. Here the headline is set in a heavy
font with a thick outline on the empty side of the picture: always spelled right, always readable at the
170 px width of the YouTube feed, and the colours are the channel's.
"""
from __future__ import annotations

import logging
import re
import sys
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from ..config import get_settings

log = logging.getLogger(__name__)

#: Scripts the bundled/system heavy fonts cover (Latin, Cyrillic, Greek, punctuation, symbols).
_RENDERABLE = re.compile(r"^[\u0020-\u024F\u0370-\u03FF\u0400-\u052F\u2010-\u2044\u20AC\u2116\u2190-\u21FF\u2212\u00D7]+$")

_FONT_NAMES = (
    "impact.ttf", "ariblk.ttf", "seguibl.ttf", "bahnschrift.ttf", "arialbd.ttf",  # Windows
    "Impact.ttf", "Arial Black.ttf", "Arial Bold.ttf", "HelveticaNeue.ttc",  # macOS
    "DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf", "NotoSans-Black.ttf", "NotoSans-Bold.ttf",  # Linux
)
_FONT_DIRS = (
    Path("C:/Windows/Fonts"), Path("/Library/Fonts"), Path("/System/Library/Fonts/Supplemental"),
    Path.home() / "Library/Fonts", Path("/usr/share/fonts"), Path("/usr/local/share/fonts"), Path.home() / ".fonts",
)


@lru_cache
def find_font() -> str | None:
    """A heavy font: ``data/fonts/thumbnail*.ttf|otf`` of the user first, then the system ones."""
    fonts = get_settings().fonts_dir
    for pat in ("thumbnail*.ttf", "thumbnail*.otf", "thumb*.ttf", "thumb*.otf"):
        for f in sorted(fonts.glob(pat)):
            return str(f)
    for d in _FONT_DIRS:
        if not d.exists():
            continue
        for name in _FONT_NAMES:
            direct = d / name
            if direct.is_file():
                return str(direct)
            if not sys.platform.startswith("win"):  # Linux keeps fonts in vendor sub-folders
                found = next(d.rglob(name), None)
                if found:
                    return str(found)
    return None


def can_render(text: str) -> bool:
    """True when the program can set this text itself (a font is found and covers its letters)."""
    return bool(text.strip()) and bool(_RENDERABLE.match(text)) and find_font() is not None


def _rgb(color: str, default: tuple[int, int, int]) -> tuple[int, int, int]:
    m = re.fullmatch(r"#?([0-9a-fA-F]{6})", (color or "").strip())
    if not m:
        return default
    v = m.group(1)
    return int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16)


def _splits(words: list[str], lines: int) -> list[list[list[str]]]:
    """All ways to break ``words`` into ``lines`` consecutive non-empty lines."""
    if lines == 1:
        return [[words]]
    out = []
    for cut in range(1, len(words) - lines + 2):
        for rest in _splits(words[cut:], lines - 1):
            out.append([words[:cut], *rest])
    return out


def _layout(words: list[str], font_path: str, box_w: int, box_h: int, max_size: int):
    """Biggest font size and the line breaks that fit the box: ``(size, lines)``."""
    best: tuple[float, int, list[list[str]]] | None = None
    for n in range(1, min(3, len(words)) + 1):
        for lines in _splits(words, n):
            lo, hi = 24, max_size
            fit = 0
            while lo <= hi:
                mid = (lo + hi) // 2
                font = ImageFont.truetype(font_path, mid)
                widest = max(font.getlength(" ".join(ln)) for ln in lines)
                height = n * mid * 1.08
                if widest <= box_w and height <= box_h:
                    fit, lo = mid, mid + 1
                else:
                    hi = mid - 1
            # Larger text wins, but a lone number/particle on its own line looks like a mistake.
            lone = n > 1 and any(len(" ".join(ln)) <= 2 for ln in lines)
            value = fit * (0.82 if lone else 1.0)
            if fit and (best is None or value > best[0]):
                best = (value, fit, lines)
    return best[1:] if best else None


def draw_headline(
    img: np.ndarray, text: str, *, side: str = "left", color: str = "#FFFFFF", accent_color: str = "#FFD400",
    accent: str = "",
) -> np.ndarray:
    """Set ``text`` big on the ``side`` ("left"/"right") half of a BGR image; returns a new BGR image.

    ``accent`` – the word that gets ``accent_color`` (the whole last line when it is not found).
    """
    font_path = find_font()
    words: list[str] = []
    for tok in text.upper().split():
        if words and re.fullmatch(r"[-—–]+", words[-1]):  # a dash never ends a line: it leads the next word
            words[-1] = f"{words[-1]} {tok}"
        else:
            words.append(tok)
    if not font_path or not words:
        return img
    h, w = img.shape[:2]
    margin = int(w * 0.045)
    box_w, box_h = int(w * 0.46), int(h * 0.80)
    laid = _layout(words, font_path, box_w, box_h, int(h * 0.34))
    if not laid:
        return img
    size, lines = laid
    font = ImageFont.truetype(font_path, size)
    line_h = int(size * 1.08)
    block_h = line_h * len(lines)
    x0 = margin if side == "left" else w - margin - box_w
    y0 = (h - block_h) // 2

    # Soft dark gradient behind the text side keeps the caption readable on any picture.
    ramp = np.linspace(1.0, 0.0, int(w * 0.62), dtype=np.float32)
    mask = np.zeros((h, w), np.float32)
    if side == "left":
        mask[:, : ramp.size] = ramp
    else:
        mask[:, w - ramp.size:] = ramp[::-1]
    region = img[:, : w // 2] if side == "left" else img[:, w // 2:]
    luma = float(cv2.cvtColor(region, cv2.COLOR_BGR2GRAY).mean())
    strength = 0.50 if luma > 120 else 0.30
    base = img.astype(np.float32) * (1.0 - strength * mask[..., None])
    canvas = Image.fromarray(cv2.cvtColor(np.clip(base, 0, 255).astype(np.uint8), cv2.COLOR_BGR2RGB))

    draw = ImageDraw.Draw(canvas)
    fill, hi = _rgb(color, (255, 255, 255)), _rgb(accent_color, (255, 212, 0))
    stroke = max(3, int(size * 0.085))
    shadow = max(2, int(size * 0.06))
    flat = [wd for ln in lines for wd in ln]
    strip = ".,!?:;«»\"-—"
    # Highlighted: the words of the accent phrase, else a number, else the last word.
    accent_words = {w.strip(strip) for w in accent.upper().split()} - {""}
    hi_set = {i for i, wd in enumerate(flat) if wd.lstrip('-—– ').strip(strip) in accent_words}
    if not hi_set:
        hi_set = {next((i for i, wd in enumerate(flat) if any(c.isdigit() for c in wd)), len(flat) - 1)}
    k = 0
    for row, ln in enumerate(lines):
        x, y = x0, y0 + row * line_h
        for wd in ln:
            part = wd + " "
            col = hi if k in hi_set else fill
            draw.text((x + shadow, y + shadow), wd, font=font, fill=(0, 0, 0), stroke_width=stroke, stroke_fill=(0, 0, 0))
            draw.text((x, y), wd, font=font, fill=col, stroke_width=stroke, stroke_fill=(0, 0, 0))
            x += font.getlength(part)
            k += 1
    return cv2.cvtColor(np.asarray(canvas), cv2.COLOR_RGB2BGR)
