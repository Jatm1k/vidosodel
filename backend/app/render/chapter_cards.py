"""Chapter title cards: an animated title over the picture when a new chapter of the video starts.

The narration never stops, so a card is an overlay of a few seconds on top of the running scene, not a
separate slate. Every design also treats the picture under it (darkening, blur, letterbox, a gradient on
the text side) so the title belongs to the frame instead of floating on it:

* **cinema** – letterbox bars slide in, the picture dims and softens; a spaced-out kicker («ГЛАВА 2»),
  a hairline and a serif title whose letters rise one by one;
* **editorial** – a huge outlined chapter number half off the edge, the lines of a heavy title slide up
  from under a mask, the side of the frame away from the hero darkens;
* **brush** – an ink stroke is painted across the frame and the title sits on it, slightly tilted;
* **minimal** – a thin line grows and the number and title slide out from behind it.

A video gets one design (``auto`` picks it from the render seed), and small things vary per video and per
chapter (side, kicker form, the stroke's shape), so two videos of a channel do not look stamped out.
Sprites are drawn once per worker with Pillow; a frame only blends a few small regions, so cards cost
next to nothing outside their few seconds.
"""
from __future__ import annotations

import logging
import math
import random
import sys
from dataclasses import asdict, dataclass
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from ..config import get_settings

log = logging.getLogger(__name__)

STYLES = ("cinema", "editorial", "brush", "minimal")
STYLE_LABELS = {"auto": "Разные для каждого ролика", "cinema": "Кино", "editorial": "Журнал",
                "brush": "Кисть", "minimal": "Минимализм"}

#: «Chapter» in the languages of the app; other languages show the number only.
KICKER_WORD = {
    "ru": "Глава", "uk": "Розділ", "be": "Раздзел", "bg": "Глава", "en": "Chapter", "es": "Capítulo",
    "pt": "Capítulo", "fr": "Chapitre", "it": "Capitolo", "de": "Kapitel", "nl": "Hoofdstuk", "pl": "Rozdział",
    "cs": "Kapitola", "sk": "Kapitola", "ro": "Capitolul", "tr": "Bölüm", "sv": "Kapitel", "da": "Kapitel",
    "no": "Kapittel", "fi": "Luku", "hr": "Poglavlje", "sr": "Поглавље", "el": "Κεφάλαιο", "id": "Bab",
    "ms": "Bab", "hu": "Fejezet", "kk": "Тарау",
}
_ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV",
          "XVI", "XVII", "XVIII", "XIX", "XX"]

#: Default accent of every design (BGR is derived from it); the channel may set its own.
DEFAULT_COLORS = {"cinema": "#E3C58B", "editorial": "#F2C14E", "brush": "#B8262F", "minimal": "#F0F0F0"}

#: Fonts of every design: (family, style) candidates, the first one found is used.
_FONTS = {
    "cinema": {"title": [("Georgia", "Regular"), ("Constantia", "Regular"), ("Cambria", "Regular"),
                         ("Times New Roman", "Regular")],
               "kicker": [("Segoe UI", "Semibold"), ("Arial", "Regular")]},
    "editorial": {"title": [("Segoe UI", "Black"), ("Arial Black", "Regular"), ("Arial", "Bold")],
                  "kicker": [("Segoe UI", "Semibold"), ("Arial", "Bold")],
                  "number": [("Segoe UI", "Black"), ("Arial Black", "Regular")]},
    "brush": {"title": [("Segoe UI", "Black"), ("Impact", "Regular"), ("Arial Black", "Regular")],
              "kicker": [("Segoe UI", "Semibold"), ("Arial", "Bold")]},
    "minimal": {"title": [("Segoe UI", "Semibold"), ("Arial", "Regular")],
                "number": [("Segoe UI", "Light"), ("Segoe UI", "Semilight"), ("Arial", "Regular")]},
}
_WEIGHTS = ["Light", "Semilight", "Regular", "Semibold", "Bold", "Black"]


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


# ================================================================ fonts
_FONT_DIRS = (Path("C:/Windows/Fonts"), Path.home() / "AppData/Local/Microsoft/Windows/Fonts",
              Path("/Library/Fonts"), Path("/System/Library/Fonts/Supplemental"), Path.home() / "Library/Fonts",
              Path("/usr/share/fonts"), Path("/usr/local/share/fonts"), Path.home() / ".fonts")


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
        for _, path in ranked:
            if _covers(path, text):
                return path
    from .thumb_text import find_font  # noqa: PLC0415 – any heavy system font as the last resort

    return find_font()


def family_font(family: str, style: str, text: str, fallback: list[tuple[str, str]]) -> str | None:
    """A font of the family chosen by the user, else the design's own."""
    return resolve_font(([(family, style), (family, "Regular")] if family else []) + fallback, text)


# ================================================================ drawing helpers
def _bgr(color: str, default: str) -> tuple[float, float, float]:
    c = (color or default).lstrip("#")
    try:
        r, g, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
    except (ValueError, IndexError):
        return _bgr(default, "#FFFFFF")
    return float(b), float(g), float(r)


def _ease_out(u: float, p: float = 3.0) -> float:
    u = min(max(u, 0.0), 1.0)
    return 1 - (1 - u) ** p


def _ease_in_out(u: float) -> float:
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def _phase(t: float, start: float, length: float) -> float:
    return min(max((t - start) / length, 0.0), 1.0) if length > 0 else float(t >= start)


@dataclass
class _Line:
    """Alpha mask of one line of text and the column where every letter starts."""

    mask: np.ndarray       # float32 0..1, h×w
    starts: list[int]      # x of every letter (len = letters), plus the width at the end
    ascent: int            # baseline from the top of the mask

    @property
    def w(self) -> int:
        return self.mask.shape[1]

    @property
    def h(self) -> int:
        return self.mask.shape[0]


def _text_line(text: str, font_path: str | None, size: int, tracking: float = 0.0, stroke: int = 0) -> _Line:
    """Render ``text`` letter by letter (``tracking`` – extra space in em) into an alpha mask."""
    font = ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default(size)
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
    return _Line(np.asarray(img, np.float32) / 255.0, starts, ascent + pad)


def _wrap(text: str, font_path: str | None, size: int, max_w: float, tracking: float = 0.0,
          max_lines: int = 2) -> list[str]:
    """Split ``text`` into at most ``max_lines`` balanced lines that fit ``max_w``."""
    font = ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default(size)

    def width(s: str) -> float:
        return font.getlength(s) + max(0, len(s) - 1) * tracking * size

    words = text.split()
    if width(text) <= max_w or len(words) < 2:
        return [text]
    best, best_score = [text], float("inf")
    for cut in range(1, len(words)):  # two lines, as even as possible
        a, b = " ".join(words[:cut]), " ".join(words[cut:])
        score = max(width(a), width(b))
        if score < best_score:
            best, best_score = [a, b], score
    return best[:max_lines]


def _fit_size(text: str, font_path: str | None, size: int, max_w: float, tracking: float = 0.0,
              max_lines: int = 2) -> tuple[int, list[str]]:
    """The largest size ≤ ``size`` at which ``text`` fits ``max_lines`` lines of ``max_w``."""
    while True:
        lines = _wrap(text, font_path, size, max_w, tracking, max_lines)
        font = ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default(size)
        widest = max(font.getlength(ln) + max(0, len(ln) - 1) * tracking * size for ln in lines)
        if widest <= max_w or size <= 12:
            return size, lines
        size = int(size * 0.92)


def _blend(frame: np.ndarray, mask: np.ndarray, x: int, y: int, color: tuple[float, float, float],
           opacity: float) -> None:
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
    roi += (np.array(color, np.float32) - roi) * a[..., None]
    frame[y0:y1, x0:x1] = roi.astype(np.uint8)


def _shadow(mask: np.ndarray, radius: float) -> tuple[np.ndarray, int]:
    """Soft shadow of a mask, padded by its blur radius: (shadow mask, pad)."""
    pad = int(radius * 3) + 1
    big = cv2.copyMakeBorder(mask, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    return np.clip(cv2.GaussianBlur(big, (0, 0), radius) * 1.6, 0, 1), pad


def _draw_letters(frame: np.ndarray, line: _Line, x: int, y: int, color, ops: list[float], dys: list[float],
                  shadow: tuple[np.ndarray, int] | None = None, shadow_op: float = 0.55) -> None:
    """Every letter of ``line`` with its own opacity and vertical offset (column slices of the mask)."""
    n = len(line.starts) - 1
    for i in range(n):
        a, b = line.starts[i], line.starts[i + 1]
        if b <= a or ops[i] <= 0.003:
            continue
        dy = int(round(dys[i]))
        if shadow is not None:
            smask, pad = shadow  # smask column c lies under mask column c - pad
            sa = a + pad if i > 0 else 0
            sb = b + pad if i < n - 1 else smask.shape[1]
            _blend(frame, smask[:, sa:sb], x + sa - pad + 2, y - pad + dy + 3, (0, 0, 0), ops[i] * shadow_op)
        _blend(frame, line.mask[:, a:b], x + a, y + dy, color, ops[i])


def _stagger(n: int, u: float, spread: float) -> list[float]:
    """Progress 0..1 of ``n`` items that start one after another over the first ``spread`` of ``u``."""
    if n <= 1:
        return [u]
    out = []
    for i in range(n):
        start = spread * i / (n - 1)
        out.append(min(max((u - start) / max(1e-6, 1 - spread), 0.0), 1.0))
    return out


def _dim(frame: np.ndarray, amount: float, blur: float = 0.0, desat: float = 0.0) -> np.ndarray:
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


def _side_gradient(w: int, h: int, side: str, reach: float) -> np.ndarray:
    """0..1 darkness falling off from one side of the frame (smooth, a little curved)."""
    x = np.linspace(0, 1, w, dtype=np.float32)
    if side == "right":
        x = 1 - x
    g = np.clip(1 - x / reach, 0, 1) ** 1.6
    y = np.linspace(-1, 1, h, dtype=np.float32)[:, None]
    return (g[None, :] * (1 - 0.25 * y ** 2)).astype(np.float32)


# ================================================================ designs
class _Design:
    """Base of a card design: sprites are made once, ``draw`` is called for every frame of the card."""

    def __init__(self, card: Card, width: int, height: int, color: str, font: str, default_color: str):
        self.c = card
        self.w, self.h = width, height
        self.s = height / 1080
        self.rng = random.Random(card.seed)
        self.accent = _bgr(color, default_color)
        self.font = font

    def envelope(self, t: float) -> tuple[float, float]:
        """(time since the card started, 0..1 fade-out at its end)."""
        local = t - self.c.start
        out = _phase(local, self.c.duration - 0.55, 0.55)
        return local, out

    def draw(self, frame: np.ndarray, t: float) -> np.ndarray:  # pragma: no cover – overridden
        return frame


class _Cinema(_Design):
    def __init__(self, card: Card, width: int, height: int, color: str, font: str):
        super().__init__(card, width, height, color, font, DEFAULT_COLORS["cinema"])
        f = _FONTS["cinema"]
        title_font = family_font(font, "Regular", card.title, f["title"])
        kicker_font = resolve_font(f["kicker"], card.kicker)
        size, lines = _fit_size(card.title, title_font, int(78 * self.s), width * 0.74)
        self.lines = [_text_line(ln, title_font, size) for ln in lines]
        self.shadows = [_shadow(ln.mask, 10 * self.s) for ln in self.lines]
        self.kicker = _text_line(card.kicker.upper(), kicker_font, int(27 * self.s), tracking=0.45) \
            if card.kicker else None
        self.gap = int(size * 1.12)
        self.bar = int(height * 0.105)

    def draw(self, frame: np.ndarray, t: float) -> np.ndarray:
        local, out = self.envelope(t)
        inn = _ease_in_out(_phase(local, 0.0, 0.7))
        vis = inn * (1 - _ease_in_out(out))
        frame = _dim(frame, 0.42 * vis, blur=5 * self.s * vis, desat=0.35 * vis)
        bar = int(self.bar * _ease_out(_phase(local, 0.0, 0.8)) * (1 - _ease_in_out(out)))
        if bar > 0:
            frame[:bar] = 0
            frame[-bar:] = 0
        fade = 1 - _ease_in_out(out)
        block_h = len(self.lines) * self.gap
        y = int(self.h * 0.5 - block_h / 2 + self.gap * 0.15)
        if self.kicker is not None:
            ku = _ease_out(_phase(local, 0.25, 0.9))
            k = self.kicker
            ky = y - int(70 * self.s)
            _blend(frame, k.mask, int(self.w / 2 - k.w / 2), ky + int(10 * self.s * (1 - ku)), self.accent,
                   ku * fade * 0.95)
            lw = int(self.w * 0.09 * _ease_out(_phase(local, 0.45, 0.9)))
            if lw > 1:
                line = np.ones((max(1, int(2 * self.s)), 2 * lw), np.float32)
                _blend(frame, line, int(self.w / 2 - lw), ky + k.h + int(4 * self.s), self.accent, 0.8 * fade)
        for li, (ln, sh) in enumerate(zip(self.lines, self.shadows)):
            u = _phase(local, 0.45 + 0.18 * li, 1.1)
            n = len(ln.starts) - 1
            prog = _stagger(n, u, 0.55)
            ops = [_ease_out(p, 2) * fade for p in prog]
            dys = [16 * self.s * (1 - _ease_out(p, 3)) for p in prog]
            _draw_letters(frame, ln, int(self.w / 2 - ln.w / 2), y + li * self.gap, (245, 245, 245), ops, dys,
                          shadow=sh, shadow_op=0.6)
        return frame


class _Editorial(_Design):
    def __init__(self, card: Card, width: int, height: int, color: str, font: str):
        super().__init__(card, width, height, color, font, DEFAULT_COLORS["editorial"])
        f = _FONTS["editorial"]
        title_font = family_font(font, "Black", card.title, f["title"])
        size, lines = _fit_size(card.title, title_font, int(84 * self.s), width * 0.46)
        self.lines = [_text_line(ln, title_font, size) for ln in lines]
        self.shadows = [_shadow(ln.mask, 12 * self.s) for ln in self.lines]
        kick = card.kicker.upper() if card.kicker else ""
        self.kicker = _text_line(kick, resolve_font(f["kicker"], kick), int(24 * self.s), tracking=0.28) \
            if kick else None
        num_font = resolve_font(f["number"], "0")
        self.number = _text_line(f"{card.number:02d}", num_font, int(height * 0.62), tracking=-0.02,
                                 stroke=max(2, int(3 * self.s)))
        self.number_fill = _text_line(f"{card.number:02d}", num_font, int(height * 0.62), tracking=-0.02)
        self.gap = int(size * 1.08)
        self.grad = _side_gradient(width, height, card.side, 0.9)
        self.drift = self.rng.choice((-1, 1))

    def draw(self, frame: np.ndarray, t: float) -> np.ndarray:
        local, out = self.envelope(t)
        fade = 1 - _ease_in_out(out)
        vis = _ease_in_out(_phase(local, 0.0, 0.7)) * fade
        if vis > 0.003:
            frame = cv2.convertScaleAbs(frame.astype(np.float32) * (1 - 0.8 * vis * self.grad[..., None]))
        left = self.c.side == "left"
        # Huge outlined number half off the edge of the text side, drifting slowly.
        n = self.number
        nu = _ease_out(_phase(local, 0.0, 1.4))
        drift = self.drift * 0.02 * self.w * (local / max(1.0, self.c.duration))
        nx = int(-n.w * 0.28 + drift) if left else int(self.w - n.w * 0.72 + drift)
        ny = int(self.h * 0.5 - n.ascent * 0.62)
        nx += int((-1 if left else 1) * 40 * self.s * (1 - nu))
        _blend(frame, self.number_fill.mask, nx, ny, self.accent, 0.13 * nu * fade)
        _blend(frame, n.mask, nx, ny, self.accent, 0.6 * nu * fade)
        edge = int(self.w * 0.085)

        def at(width: int) -> int:  # left-aligned on the left side, right-aligned on the right one
            return edge if left else self.w - edge - width

        block_h = len(self.lines) * self.gap
        y = int(self.h * 0.52 - block_h / 2)
        if self.kicker is not None:
            ku = _ease_out(_phase(local, 0.2, 0.7))
            bw = int(46 * self.s * _ease_out(_phase(local, 0.1, 0.6)))
            ky = y - int(56 * self.s)
            k = self.kicker
            full = int(62 * self.s) + k.w
            kx = at(full)
            bar_x = kx if left else kx + full - bw
            text_x = kx + int(62 * self.s) if left else kx
            if bw > 0:
                _blend(frame, np.ones((max(2, int(5 * self.s)), bw), np.float32), bar_x,
                       ky + k.ascent // 2 + int(4 * self.s), self.accent, fade)
            _blend(frame, k.mask, text_x + int((-12 if left else 12) * self.s * (1 - ku)), ky, self.accent,
                   ku * fade)
        for li, (ln, sh) in enumerate(zip(self.lines, self.shadows)):
            u = _ease_out(_phase(local, 0.3 + 0.14 * li, 0.75), 4)
            # The line rises from under a mask at its own baseline.
            off = int((1 - u) * ln.h)
            ly = y + li * self.gap
            visible = ln.mask[:ln.h - off] if off < ln.h else None
            if visible is None:
                continue
            smask, pad = sh
            lx = at(ln.w)
            _blend(frame, smask[:smask.shape[0] - off], lx - pad + 3, ly + off - pad + 4, (0, 0, 0), 0.5 * fade * u)
            _blend(frame, visible, lx, ly + off, (248, 248, 248), fade)
        return frame


def _brush_mask(w: int, h: int, rng: random.Random) -> np.ndarray:
    """A dry ink stroke: ragged edges, streaks of the bristles, tapered ends (float 0..1, h×w)."""
    nrng = np.random.default_rng(rng.randrange(1 << 30))
    xs = np.linspace(0, 1, w, dtype=np.float32)
    # Thickness along the stroke: swells in the middle, tapers at the ends, wobbles.
    wob = np.cumsum(nrng.normal(0, 1, w)).astype(np.float32)
    wob = cv2.GaussianBlur(wob[None, :], (0, 0), w / 40)[0]
    wob = (wob - wob.mean()) / (np.abs(wob).max() + 1e-6)
    taper = np.clip(np.minimum(xs / 0.06, (1 - xs) / 0.12), 0, 1) ** 0.6
    half = (0.40 + 0.06 * wob) * taper * h
    centre = h / 2 + 0.05 * h * np.sin(xs * math.pi * rng.uniform(0.6, 1.4) + rng.uniform(0, 6))
    ys = np.arange(h, dtype=np.float32)[:, None]
    edge = nrng.normal(0, 1, (h, w)).astype(np.float32)
    edge = cv2.GaussianBlur(edge, (0, 0), 1.2) * h * 0.035
    d = np.abs(ys - centre[None, :]) + edge
    mask = np.clip((half[None, :] - d) / (h * 0.025), 0, 1)
    # Bristle streaks: horizontal lines of less ink, more of them towards the dry tail.
    streak = cv2.GaussianBlur(nrng.random((h, 1)).astype(np.float32), (0, 0), 1.2)
    streak = (streak - streak.min()) / (np.ptp(streak) + 1e-6)
    dry = np.clip((xs - 0.6) / 0.4, 0, 1) ** 1.3
    holes = np.clip((0.55 * dry[None, :] - streak) / 0.08, 0, 1)
    mask *= 1 - 0.9 * cv2.GaussianBlur(holes, (0, 0), 1.0)
    grain = cv2.GaussianBlur(nrng.random((h, w)).astype(np.float32), (0, 0), 0.7)
    mask *= 0.88 + 0.12 * grain
    return np.clip(mask, 0, 1)


class _Brush(_Design):
    def __init__(self, card: Card, width: int, height: int, color: str, font: str):
        super().__init__(card, width, height, color, font, DEFAULT_COLORS["brush"])
        f = _FONTS["brush"]
        title_font = family_font(font, "Black", card.title, f["title"])
        size, lines = _fit_size(card.title, title_font, int(70 * self.s), width * 0.5)
        line_imgs = [_text_line(ln, title_font, size) for ln in lines]
        gap = int(size * 1.05)
        tw = max(ln.w for ln in line_imgs)
        th = gap * (len(line_imgs) - 1) + line_imgs[-1].h
        title = np.zeros((th, tw), np.float32)
        for i, ln in enumerate(line_imgs):
            x = (tw - ln.w) // 2
            y = i * gap
            title[y:y + ln.h, x:x + ln.w] = np.maximum(title[y:y + ln.h, x:x + ln.w], ln.mask)
        self.angle = self.rng.uniform(-3.2, -1.2) * (1 if card.side == "left" else -1)
        sw, sh = int(tw + 300 * self.s), int(th + 130 * self.s)
        self.stroke = _brush_mask(sw, sh, self.rng)
        if card.side == "right":
            self.stroke = self.stroke[:, ::-1].copy()
        self.title = title
        self.title_shadow = _shadow(title, 6 * self.s)
        kick = card.kicker.upper() if card.kicker else ""
        self.kicker = _text_line(kick, resolve_font(f["kicker"], kick), int(26 * self.s), tracking=0.3) \
            if kick else None
        # Everything is rotated together around the stroke centre.
        self.rot = cv2.getRotationMatrix2D((sw / 2, sh / 2), self.angle, 1.0)
        self.sx = int(width * 0.07) if card.side == "left" else int(width * 0.93 - sw)
        self.sy = int(height * 0.56 - sh / 2)

    def _rotated(self, mask: np.ndarray) -> np.ndarray:
        return cv2.warpAffine(mask, self.rot, (mask.shape[1], mask.shape[0]), flags=cv2.INTER_LINEAR)

    def draw(self, frame: np.ndarray, t: float) -> np.ndarray:
        local, out = self.envelope(t)
        sh, sw = self.stroke.shape
        # Paint on: a wipe along the stroke with a soft, slightly ragged head; paint off the same way.
        on = _ease_out(_phase(local, 0.05, 0.55), 2.2)
        off = _ease_in_out(out)
        x = np.linspace(0, 1, sw, dtype=np.float32)
        if self.c.side == "right":
            x = 1 - x
        reveal = np.clip((on * 1.15 - x) / 0.15, 0, 1) * np.clip((x - off * 1.15 + 0.15) / 0.15, 0, 1)
        stroke = self._rotated(self.stroke * reveal[None, :])
        _blend(frame, stroke, self.sx, self.sy, self.accent, 0.96)
        fade = 1 - _ease_in_out(_phase(local, self.c.duration - 0.75, 0.45))
        tu = _ease_out(_phase(local, 0.35, 0.5))
        canvas = np.zeros((sh, sw), np.float32)
        th, tw = self.title.shape
        lead = int(95 * self.s)  # the title sits on the wet start of the stroke, the dry tail stays free
        ty = (sh - th) // 2 + int(6 * self.s)
        tx = lead if self.c.side == "left" else sw - tw - lead
        canvas[ty:ty + th, tx:tx + tw] = self.title
        title = self._rotated(canvas)
        dy = int(10 * self.s * (1 - tu))
        _blend(frame, cv2.GaussianBlur(title, (0, 0), 3 * self.s), self.sx + 2, self.sy + dy + 3, (0, 0, 0),
               0.35 * tu * fade)
        _blend(frame, title, self.sx, self.sy + dy, (250, 250, 250), tu * fade)
        if self.kicker is not None:
            ku = _ease_out(_phase(local, 0.5, 0.6))
            k = self.kicker
            kx = self.sx + int(40 * self.s) if self.c.side == "left" else self.sx + sw - k.w - int(40 * self.s)
            ky = self.sy - k.h + int(8 * self.s) - int(8 * self.s * (1 - ku))
            ks, pad = _shadow(k.mask, 4 * self.s)
            _blend(frame, ks, kx - pad + 1, ky - pad + 2, (0, 0, 0), 0.6 * ku * fade)
            _blend(frame, k.mask, kx, ky, (245, 245, 245), ku * fade)
        return frame


class _Minimal(_Design):
    def __init__(self, card: Card, width: int, height: int, color: str, font: str):
        super().__init__(card, width, height, color, font, DEFAULT_COLORS["minimal"])
        f = _FONTS["minimal"]
        title_font = family_font(font, "Semibold", card.title, f["title"])
        size, lines = _fit_size(card.title, title_font, int(60 * self.s), width * 0.42)
        self.lines = [_text_line(ln, title_font, size) for ln in lines]
        self.shadows = [_shadow(ln.mask, 9 * self.s) for ln in self.lines]
        self.number = _text_line(f"{card.number:02d}", resolve_font(f["number"], "0"), int(120 * self.s),
                                 tracking=0.02)
        self.num_shadow = _shadow(self.number.mask, 9 * self.s)
        self.gap = int(size * 1.15)
        self.grad = _side_gradient(width, height, card.side, 0.75)
        # A soft dark haze behind the text block: readable on light pictures without a visible box.
        block_w = max([ln.w for ln in self.lines] + [self.number.w])
        block_h = self.number.h + len(self.lines) * self.gap
        lx = int(width * (0.09 if card.side == "left" else 0.91))
        bx = lx if card.side == "left" else lx - block_w - int(34 * self.s)
        haze = np.zeros((height, width), np.float32)
        cy = int(height * 0.52)
        cv2.rectangle(haze, (bx, cy - block_h // 2), (bx + block_w + int(40 * self.s), cy + block_h // 2), 1.0, -1)
        self.haze = cv2.GaussianBlur(haze, (0, 0), 70 * self.s)

    def draw(self, frame: np.ndarray, t: float) -> np.ndarray:
        local, out = self.envelope(t)
        fade = 1 - _ease_in_out(out)
        vis = _ease_in_out(_phase(local, 0.0, 0.6)) * fade
        if vis > 0.003:
            dark = np.maximum(0.65 * self.grad, 0.6 * self.haze)
            frame = cv2.convertScaleAbs(frame.astype(np.float32) * (1 - vis * dark[..., None]))
        left = self.c.side == "left"
        block_h = self.number.h + len(self.lines) * self.gap
        lx = int(self.w * (0.09 if left else 0.91))
        cy = int(self.h * 0.52)
        lh = int(block_h * 0.62 * _ease_out(_phase(local, 0.0, 0.7), 3))
        thick = max(2, int(2.5 * self.s))
        if lh > 0:
            _blend(frame, np.ones((2 * lh, thick), np.float32), lx, cy - lh, self.accent, 0.9 * fade)
        # Content slides out from behind the line: only the part beyond it is visible.
        gap = int(34 * self.s)
        items = [(self.number, self.num_shadow, cy - block_h // 2, self.accent, 1.0)]
        for li, (ln, sh) in enumerate(zip(self.lines, self.shadows)):
            items.append((ln, sh, cy - block_h // 2 + self.number.h + li * self.gap - int(6 * self.s),
                          (245, 245, 245), 1.0))
        for k, (ln, sh, y, color, op) in enumerate(items):
            uk = _ease_out(_phase(local, 0.3 + 0.1 * k, 0.8), 4)
            shift = int((1 - uk) * 160 * self.s)
            if left:
                x = lx + gap - shift
                cut = max(0, lx + thick - x)  # columns hidden behind the line
                part = ln.mask[:, cut:] if cut < ln.w else None
                px = x + cut
            else:
                x = lx - gap - ln.w + shift
                cut = max(0, x + ln.w - lx)
                part = ln.mask[:, :ln.w - cut] if cut < ln.w else None
                px = x
            if part is None or part.shape[1] == 0:
                continue
            smask, pad = sh
            if left:
                _blend(frame, smask[:, cut + pad:], px + 2, y - pad + 3, (0, 0, 0), 0.45 * uk * fade)
            else:
                _blend(frame, smask[:, :smask.shape[1] - cut - pad], px - pad + 2, y - pad + 3, (0, 0, 0),
                       0.45 * uk * fade)
            _blend(frame, part, px, y, color, op * min(1.0, uk * 1.4) * fade)
        return frame


_DESIGNS = {"cinema": _Cinema, "editorial": _Editorial, "brush": _Brush, "minimal": _Minimal}


# ================================================================ plan → frames
def pick_style(style: str, seed: int) -> str:
    return style if style in STYLES else random.Random(seed * 7 + 3).choice(STYLES)


def kicker_text(form: str, number: int, language: str) -> str:
    """«ГЛАВА 2», «CHAPTER II» or empty (``form``: ``word`` / ``roman`` / ``none``)."""
    word = KICKER_WORD.get(language.split("-")[0].lower())
    if form == "none":
        return ""
    num = _ROMAN[number] if form == "roman" and 0 < number < len(_ROMAN) else str(number)
    return f"{word} {num}" if word else num


class CardRenderer:
    """Draws the chapter cards of a plan (one per worker; sprites are built when a card first shows)."""

    def __init__(self, cards: list[dict], style: str, width: int, height: int, color: str = "", font: str = ""):
        self.cards = [Card(**c) for c in cards]
        self.style = style
        self.width, self.height = width, height
        self.color, self.font = color, font
        self._built: dict[int, _Design] = {}

    def apply(self, frame: np.ndarray, t: float) -> np.ndarray:
        for k, card in enumerate(self.cards):
            if card.start <= t < card.start + card.duration:
                design = self._built.get(k)
                if design is None:
                    design = _DESIGNS[self.style](card, self.width, self.height, self.color, self.font)
                    self._built = {k: design}  # cards never overlap: keep only the current one
                return design.draw(np.ascontiguousarray(frame), t)
        return frame


def build_cards(items: list[dict], words: list, plan, *, duration: float, kicker: str, language: str,
                seed: int) -> list[Card]:
    """Cards for the chapters ``[{"t", "title", "card"}]`` of a plan (the first chapter – the intro – has none).

    A card starts with the first word of its chapter and never runs into the next card or the end.
    """
    from .accents import subject_at  # noqa: PLC0415 – accents imports the engine, which imports this module

    end = plan.extra.get("video_end", plan.duration)
    starts: list[tuple[float, dict]] = []
    for it in sorted(items, key=lambda c: c["t"]):
        if it["t"] <= 0:
            continue
        w = next((w for w in words if w.s >= it["t"] - 0.05), None)
        if w is not None:
            starts.append((max(0.0, w.s - 0.2), it))
    subjects: dict[str, dict | None] = {}
    rng = random.Random(seed)
    cards: list[Card] = []
    for k, (start, it) in enumerate(starts):
        nxt = starts[k + 1][0] if k + 1 < len(starts) else end
        length = min(duration, nxt - start - 0.5, end - start - 1.0)
        title = (it.get("card") or it.get("title") or "").strip()
        if length < 2.0 or not title:
            continue
        subj = subject_at(plan, start + 0.5, subjects)
        cx = subj["cx"] if subj else 0.5
        side = "right" if cx < 0.45 else "left" if cx > 0.55 else rng.choice(("left", "right"))
        number = k + 1
        cards.append(Card(start=round(start, 3), duration=round(length, 3), number=number, title=title,
                          kicker=kicker_text(kicker, number, language), side=side, seed=seed + 97 * number))
    return cards


def to_plan(cards: list[Card]) -> list[dict]:
    return [asdict(c) for c in cards]
