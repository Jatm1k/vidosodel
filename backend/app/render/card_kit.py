"""Toolkit of the chapter cards: fonts, text masks, easing, blending, paper and background treatments.

Everything is drawn as float32 alpha masks (0..1) that are blended into a uint8 BGR frame with a colour;
a "sprite" is a list of such masks of one size, each with its colour, so a card can be rotated, scaled
and moved as one piece. See :mod:`.card_designs` for the designs themselves.
"""
from __future__ import annotations

import math
import random
import sys
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from ..config import get_settings


@dataclass
class Card:
    """One chapter card of a render plan (plain data: it travels to the worker processes)."""

    start: float
    duration: float
    number: int
    title: str
    kicker: str
    #: ``left`` / ``right`` – the text side (away from the hero of the scene).
    side: str
    seed: int


# ================================================================ kicker
#: «Chapter» in the languages of the app; other languages show the number only.
KICKER_WORD = {
    "ru": "Глава", "uk": "Розділ", "be": "Раздзел", "bg": "Глава", "en": "Chapter", "es": "Capítulo",
    "pt": "Capítulo", "fr": "Chapitre", "it": "Capitolo", "de": "Kapitel", "nl": "Hoofdstuk", "pl": "Rozdział",
    "cs": "Kapitola", "sk": "Kapitola", "ro": "Capitolul", "tr": "Bölüm", "sv": "Kapitel", "da": "Kapitel",
    "no": "Kapittel", "fi": "Luku", "hr": "Poglavlje", "sr": "Поглавље", "el": "Κεφάλαιο", "id": "Bab",
    "ms": "Bab", "hu": "Fejezet", "kk": "Тарау",
}
ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV",
         "XVI", "XVII", "XVIII", "XIX", "XX"]


def kicker_text(form: str, number: int, language: str) -> str:
    """«Глава 2», «Глава II» or empty (``form``: ``word`` / ``roman`` / ``none``)."""
    word = KICKER_WORD.get(language.split("-")[0].lower())
    if form == "none":
        return ""
    num = ROMAN[number] if form == "roman" and 0 < number < len(ROMAN) else str(number)
    return f"{word} {num}" if word else num


# ================================================================ fonts
_FONT_DIRS = (Path("C:/Windows/Fonts"), Path.home() / "AppData/Local/Microsoft/Windows/Fonts",
              Path("/Library/Fonts"), Path("/System/Library/Fonts/Supplemental"), Path.home() / "Library/Fonts",
              Path("/usr/share/fonts"), Path("/usr/local/share/fonts"), Path.home() / ".fonts")
_WEIGHTS = ["Light", "Semilight", "Regular", "Semibold", "Bold", "Black"]


@lru_cache
def _font_index() -> dict[str, dict[str, str]]:
    """family (lower case) → style (lower case) → file, for the user's fonts folder and the system ones."""
    index: dict[str, dict[str, str]] = {}
    dirs = [get_settings().fonts_dir, *_FONT_DIRS]
    for d in dirs:
        if not d.exists():
            continue
        files = d.rglob("*") if not sys.platform.startswith("win") or d == dirs[0] else d.iterdir()
        for f in files:
            if f.suffix.lower() not in (".ttf", ".otf"):
                continue
            try:
                family, style = ImageFont.truetype(str(f), 12).getname()
            except Exception:  # noqa: BLE001 – a broken font file is skipped
                continue
            styles = index.setdefault((family or f.stem).lower(), {})
            styles.setdefault((style or "Regular").lower(), str(f))
            # The font list of the UI names the user's own fonts by file name («AmaticSC-Bold.ttf» → AmaticSC).
            alias = index.setdefault("file:" + f.stem.split("-")[0].lower(), {})
            alias.setdefault((style or "Regular").lower(), str(f))
    return index


def _covers(path: str, text: str) -> bool:
    """The font has glyphs for the letters of ``text`` (missing ones render as the same «tofu» box)."""
    letters = {c for c in text if c.isalpha()}
    if not letters:
        return True
    try:
        font = ImageFont.truetype(path, 32)

        def glyph(ch: str) -> bytes:
            img = Image.new("L", (48, 48), 0)
            ImageDraw.Draw(img).text((4, 4), ch, font=font, fill=255)
            return img.tobytes()

        tofu = glyph("\uffff")
        return all(glyph(c) != tofu for c in list(letters)[:40])
    except Exception:  # noqa: BLE001
        return False


def resolve_font(candidates: list[tuple[str, str]], text: str = "") -> str | None:
    """File of the first (family, style) available that has the letters of ``text``.

    A missing style falls back to the nearest weight of the same family.
    """
    index = _font_index()
    for family, style in candidates:
        styles = index.get(family.lower()) or index.get("file:" + family.lower())
        if not styles:
            continue
        want = _WEIGHTS.index(style) if style in _WEIGHTS else 2
        ranked = sorted(styles.items(), key=lambda kv: abs((_WEIGHTS.index(kv[0].title())
                                                             if kv[0].title() in _WEIGHTS else 2) - want))
        exact = styles.get(style.lower())  # e.g. «Italic», which is not a weight
        for _, path in ([("", exact)] if exact else []) + ranked:
            if _covers(path, text):
                return path
    from .thumb_text import find_font  # noqa: PLC0415 – any heavy system font as the last resort

    return find_font()


def title_font(user_family: str, style: str, text: str, fallback: list[tuple[str, str]]) -> str | None:
    """A font of the family chosen by the user, else the design's own."""
    return resolve_font(([(user_family, style), (user_family, "Regular")] if user_family else []) + fallback, text)


SERIF = [("Georgia", "Regular"), ("Constantia", "Regular"), ("Cambria", "Regular"), ("Times New Roman", "Regular")]
SERIF_BOLD = [("Georgia", "Bold"), ("Cambria", "Bold"), ("Constantia", "Bold"), ("Times New Roman", "Bold")]
SANS_BLACK = [("Segoe UI", "Black"), ("Arial Black", "Regular"), ("Arial", "Bold")]
SANS_BOLD = [("Segoe UI", "Bold"), ("Arial", "Bold")]
SANS_SEMI = [("Segoe UI", "Semibold"), ("Arial", "Bold")]
SANS_LIGHT = [("Segoe UI", "Light"), ("Segoe UI", "Semilight"), ("Arial", "Regular")]
CONDENSED = [("Bahnschrift", "Bold"), ("Impact", "Regular"), ("Arial Black", "Regular")]
MONO = [("Courier New", "Bold"), ("Consolas", "Bold"), ("Lucida Console", "Regular")]
SERIF_ITALIC = [("Georgia", "Italic"), ("Constantia", "Italic"), ("Cambria", "Italic"), ("Times New Roman", "Italic")]


# ================================================================ maths
def bgr(color: str, default: str) -> tuple[float, float, float]:
    c = (color or default).lstrip("#")
    try:
        r, g, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
    except (ValueError, IndexError):
        return bgr(default, "#FFFFFF")
    return float(b), float(g), float(r)


def luma(c: tuple[float, float, float]) -> float:
    return 0.114 * c[0] + 0.587 * c[1] + 0.299 * c[2]


def ease_out(u: float, p: float = 3.0) -> float:
    u = min(max(u, 0.0), 1.0)
    return 1 - (1 - u) ** p


def ease_in_out(u: float) -> float:
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def ease_back(u: float, k: float = 1.7) -> float:
    """Ease-out with an overshoot: goes a little past 1 and settles."""
    u = min(max(u, 0.0), 1.0) - 1
    return 1 + (k + 1) * u ** 3 + k * u ** 2


def phase(t: float, start: float, length: float) -> float:
    return min(max((t - start) / length, 0.0), 1.0) if length > 0 else float(t >= start)


def stagger(n: int, u: float, spread: float) -> list[float]:
    """Progress 0..1 of ``n`` items that start one after another over the first ``spread`` of ``u``."""
    if n <= 1:
        return [u]
    return [min(max((u - spread * i / (n - 1)) / max(1e-6, 1 - spread), 0.0), 1.0) for i in range(n)]


# ================================================================ text
@dataclass
class Line:
    """Alpha mask of one line of text and the column where every letter starts."""

    mask: np.ndarray       # float32 0..1, h×w
    starts: list[int]      # x of every letter, plus the width at the end
    ascent: int            # baseline from the top of the mask

    @property
    def w(self) -> int:
        return self.mask.shape[1]

    @property
    def h(self) -> int:
        return self.mask.shape[0]


def _font(path: str | None, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size) if path else ImageFont.load_default(size)


def text_line(text: str, font_path: str | None, size: int, tracking: float = 0.0, stroke: int = 0) -> Line:
    """Render ``text`` letter by letter (``tracking`` – extra space in em) into an alpha mask.

    ``stroke`` > 0 draws only the outline of the letters.
    """
    font = _font(font_path, size)
    pad = stroke + max(2, size // 12)
    track = tracking * size
    xs = [font.getlength(text[:i]) + i * track for i in range(len(text) + 1)]
    ascent, descent = font.getmetrics()
    w = int(math.ceil(xs[-1] - track)) + 2 * pad
    h = ascent + descent + 2 * pad
    img = Image.new("L", (max(1, w), h), 0)
    draw = ImageDraw.Draw(img)
    for i, ch in enumerate(text):
        if stroke:
            draw.text((pad + xs[i], pad), ch, font=font, fill=0, stroke_width=stroke, stroke_fill=255)
        else:
            draw.text((pad + xs[i], pad), ch, font=font, fill=255)
    starts = [int(pad + x) for x in xs[:-1]] + [w]
    if starts:
        starts[0] = 0
    return Line(np.asarray(img, np.float32) / 255.0, starts, ascent + pad)


def _width(font: ImageFont.FreeTypeFont, s: str, tracking: float, size: int) -> float:
    return font.getlength(s) + max(0, len(s) - 1) * tracking * size


def fit_lines(text: str, font_path: str | None, size: int, max_w: float, tracking: float = 0.0,
              max_lines: int = 2) -> tuple[int, list[str]]:
    """The largest size ≤ ``size`` at which ``text`` fits ``max_lines`` balanced lines of ``max_w``."""
    words = text.split()
    while True:
        font = _font(font_path, size)
        lines = [text]
        if _width(font, text, tracking, size) > max_w and len(words) > 1 and max_lines > 1:
            best = float("inf")
            for cut in range(1, len(words)):  # two lines, as even as possible
                a, b = " ".join(words[:cut]), " ".join(words[cut:])
                score = max(_width(font, a, tracking, size), _width(font, b, tracking, size))
                if score < best:
                    best, lines = score, [a, b]
        widest = max(_width(font, ln, tracking, size) for ln in lines)
        if widest <= max_w or size <= 12:
            return size, lines
        size = int(size * 0.92)


def stack(lines: list[Line], gap: int, align: str = "left") -> np.ndarray:
    """Lines of text one under another in one mask (``align``: left / center / right)."""
    w = max(ln.w for ln in lines)
    h = gap * (len(lines) - 1) + lines[-1].h
    out = np.zeros((h, w), np.float32)
    for i, ln in enumerate(lines):
        x = 0 if align == "left" else (w - ln.w) // 2 if align == "center" else w - ln.w
        y = i * gap
        out[y:y + ln.h, x:x + ln.w] = np.maximum(out[y:y + ln.h, x:x + ln.w], ln.mask)
    return out


# ================================================================ blending
def blend(frame: np.ndarray, mask: np.ndarray, x: int, y: int, color, opacity: float) -> None:
    """Paint ``color`` through ``mask`` (0..1) at ``x, y`` into ``frame`` (uint8 BGR, in place, clipped)."""
    if opacity <= 0.003:
        return
    fh, fw = frame.shape[:2]
    mh, mw = mask.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(fw, x + mw), min(fh, y + mh)
    if x1 <= x0 or y1 <= y0:
        return
    a = mask[y0 - y:y1 - y, x0 - x:x1 - x] * opacity
    roi = frame[y0:y1, x0:x1].astype(np.float32)
    if a.ndim == 2:
        a = a[..., None]
    col = np.asarray(color, np.float32)
    roi += (col - roi) * a
    frame[y0:y1, x0:x1] = roi.astype(np.uint8)


def shadow(mask: np.ndarray, radius: float, strength: float = 1.6) -> tuple[np.ndarray, int]:
    """Soft shadow of a mask, padded by its blur radius: (shadow mask, pad)."""
    pad = int(radius * 3) + 1
    big = cv2.copyMakeBorder(mask, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    return np.clip(cv2.GaussianBlur(big, (0, 0), radius) * strength, 0, 1), pad


def draw_letters(frame: np.ndarray, line: Line, x: int, y: int, color, ops: list[float], dys: list[float],
                 shade: tuple[np.ndarray, int] | None = None, shade_op: float = 0.55,
                 dxs: list[float] | None = None) -> None:
    """Every letter of ``line`` with its own opacity and offset (column slices of the mask)."""
    n = len(line.starts) - 1
    for i in range(n):
        a, b = line.starts[i], line.starts[i + 1]
        if b <= a or ops[i] <= 0.003:
            continue
        dy = int(round(dys[i]))
        dx = int(round(dxs[i])) if dxs else 0
        if shade is not None:
            smask, pad = shade  # smask column c lies under mask column c - pad
            sa = a + pad if i > 0 else 0
            sb = b + pad if i < n - 1 else smask.shape[1]
            blend(frame, smask[:, sa:sb], x + dx + sa - pad + 2, y - pad + dy + 3, (0, 0, 0), ops[i] * shade_op)
        blend(frame, line.mask[:, a:b], x + dx + a, y + dy, color, ops[i])


Layer = tuple[np.ndarray, tuple[float, float, float], float]  # (mask, colour, opacity)


def transform(layers: list[Layer], angle: float, scale: float = 1.0) -> tuple[list[Layer], int, int]:
    """Rotate/scale a sprite around its centre on a canvas big enough to hold it: (layers, dx, dy).

    ``dx, dy`` – where the old top-left corner moved, so the sprite stays centred on the same point.
    """
    h, w = layers[0][0].shape[:2]
    m = cv2.getRotationMatrix2D((w / 2, h / 2), angle, scale)
    cos, sin = abs(m[0, 0]), abs(m[0, 1])
    nw, nh = int(h * sin + w * cos) + 4, int(h * cos + w * sin) + 4
    m[0, 2] += nw / 2 - w / 2
    m[1, 2] += nh / 2 - h / 2
    out = [(cv2.warpAffine(mk, m, (nw, nh), flags=cv2.INTER_LINEAR), c, o) for mk, c, o in layers]
    return out, (nw - w) // 2, (nh - h) // 2


def draw_layers(frame: np.ndarray, layers: list[Layer], x: int, y: int, opacity: float = 1.0) -> None:
    for mask, color, op in layers:
        blend(frame, mask, x, y, color, op * opacity)


# ================================================================ backgrounds
def dim(frame: np.ndarray, amount: float, blur: float = 0.0, desat: float = 0.0) -> np.ndarray:
    """Darken (and soften / desaturate) the whole picture under a card."""
    if amount <= 0.003 and blur <= 0.05 and desat <= 0.003:
        return frame
    out = frame
    if blur > 0.05:
        h, w = frame.shape[:2]
        small = cv2.resize(out, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
        small = cv2.GaussianBlur(small, (0, 0), blur / 4)
        soft = cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)
        out = cv2.addWeighted(out, 1 - min(1.0, blur / 6), soft, min(1.0, blur / 6), 0)
    if desat > 0.003:
        gray = cv2.cvtColor(cv2.cvtColor(out, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
        out = cv2.addWeighted(out, 1 - desat, gray, desat, 0)
    if amount > 0.003:
        out = cv2.convertScaleAbs(out, alpha=1 - amount)
    return out


_BOXES: dict[int, tuple[np.ndarray, int, int, int, int]] = {}


def darken(frame: np.ndarray, field: np.ndarray, amount: float) -> np.ndarray:
    """Darken by a 0..1 ``field`` (h×w) times ``amount`` – only where the field is not zero."""
    if amount <= 0.003:
        return frame
    box = _BOXES.get(id(field))
    if box is None or box[0] is not field:
        rows, cols = np.where(field.max(axis=1) > 0.004)[0], np.where(field.max(axis=0) > 0.004)[0]
        if not len(rows):
            return frame
        box = (field, rows[0], rows[-1] + 1, cols[0], cols[-1] + 1)
        if len(_BOXES) > 16:
            _BOXES.clear()
        _BOXES[id(field)] = box
    f, y0, y1, x0, x1 = box
    roi = frame[y0:y1, x0:x1]
    k = f[y0:y1, x0:x1] * np.float32(amount)
    frame[y0:y1, x0:x1] = cv2.blendLinear(roi, np.zeros_like(roi), 1 - k, k)
    return frame


def side_gradient(w: int, h: int, side: str, reach: float) -> np.ndarray:
    """0..1 darkness falling off from one side of the frame (smooth, a little curved)."""
    x = np.linspace(0, 1, w, dtype=np.float32)
    if side == "right":
        x = 1 - x
    g = np.clip(1 - x / reach, 0, 1) ** 1.6
    y = np.linspace(-1, 1, h, dtype=np.float32)[:, None]
    return (g[None, :] * (1 - 0.25 * y ** 2)).astype(np.float32)


def haze(w: int, h: int, box: tuple[int, int, int, int], blur: float) -> np.ndarray:
    """A soft dark cloud around ``box`` (x0, y0, x1, y1): readable text without a visible plate."""
    out = np.zeros((h, w), np.float32)
    cv2.rectangle(out, (int(box[0]), int(box[1])), (int(box[2]), int(box[3])), 1.0, -1)
    return cv2.GaussianBlur(out, (0, 0), blur)


# ================================================================ paper
def torn_rect(w: int, h: int, rng: random.Random, margin: int, rough: float = 1.0) -> np.ndarray:
    """A sheet with torn, fibrous edges inside a ``w``×``h`` canvas (``margin`` – room for the tears)."""
    nrng = np.random.default_rng(rng.randrange(1 << 30))

    def edge(n: int) -> np.ndarray:
        e = np.cumsum(nrng.normal(0, 1, n)).astype(np.float32)
        e = cv2.GaussianBlur(e[None, :], (0, 0), max(2, n / 60))[0]
        e = (e - e.mean()) / (np.abs(e).max() + 1e-6)
        fine = cv2.GaussianBlur(nrng.normal(0, 1, (1, n)).astype(np.float32), (0, 0), 1.5)[0]
        return (e * 0.55 + fine * 0.35) * margin * 0.8 * rough

    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    top, bottom = margin + edge(w), h - margin + edge(w)
    left, right = margin + edge(h), w - margin + edge(h)
    d = np.minimum.reduce([ys - top[None, :], bottom[None, :] - ys, xs - left[:, None], right[:, None] - xs])
    return np.clip(d / 1.5, 0, 1).astype(np.float32)


def paper_texture(w: int, h: int, rng: random.Random) -> np.ndarray:
    """0..1 fibres and blotches for a paper colour (multiply a darker tone through it)."""
    nrng = np.random.default_rng(rng.randrange(1 << 30))
    blotch = cv2.GaussianBlur(nrng.random((h, w)).astype(np.float32), (0, 0), max(w, h) / 25)
    blotch = (blotch - blotch.min()) / (np.ptp(blotch) + 1e-6)
    fibre = cv2.GaussianBlur(nrng.random((h, w)).astype(np.float32), (0, 0), 0.8)
    return np.clip(0.55 * blotch + 0.45 * fibre, 0, 1)


def halftone(w: int, h: int, step: int, strength: np.ndarray | float = 1.0) -> np.ndarray:
    """A dot screen (newsprint), 0..1."""
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    u = (xs + ys) / (step * 1.41)
    v = (xs - ys) / (step * 1.41)
    d = np.sqrt((u - np.round(u)) ** 2 + (v - np.round(v)) ** 2)
    r = 0.35 * np.sqrt(np.clip(strength, 0, 1))
    return np.clip((r - d) * step, 0, 1).astype(np.float32)
