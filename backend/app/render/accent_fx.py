"""Animated key phrases: the narrator's words that deserve emphasis, built up on screen as they are said.

Every accent (see :mod:`.accents`) has a kind – number, name, quote, term, statement – and gets one of
the styles that suit it:

* **pop** – the words jump in one by one with a little bounce, the key word in the accent colour;
* **marker** – a highlighter stroke sweeps behind the words as the narrator says them;
* **stack** – every word on its own line, the key word big, sliding in from alternating sides;
* **slam** – the phrase hits the screen from big to normal with a short camera shake;
* **underline** – clean words fade up, then a hand-drawn underline or circle marks the key word;
* **type** – typed letter by letter in step with the voice;
* **counter** – a number counts up to its value (with a progress bar for percentages);
* **nameplate** – a name with a line about the person slides out from behind a bar;
* **quote** – big quotation marks, the quotation in italics word by word, the author below.

The styles of a video are picked from the channel's pool by the render seed, never the same one twice in
a row; the video's variant fixes the look (upper case, tilt, colours) so its accents belong together.
"""
from __future__ import annotations

import math
import random
import re
from dataclasses import asdict, dataclass

import cv2
import numpy as np

from .accents import Accent
from .card_kit import (
    MONO, SANS_BLACK, SANS_BOLD, SANS_SEMI, SERIF_ITALIC, Line, bgr, blend, darken, draw_letters, ease_back,
    ease_in_out, ease_out, fit_lines, haze, luma, phase, resolve_font, shadow, stack, text_line, title_font,
    torn_rect, transform,
)

STYLES = ("pop", "marker", "stack", "slam", "underline", "type", "counter", "nameplate", "quote")
STYLE_LABELS = {
    "pop": "Слова с отскоком", "marker": "Маркер", "stack": "Лесенка слов", "slam": "Удар", "underline": "Подчёркивание",
    "type": "Печать", "counter": "Счётчик чисел", "nameplate": "Плашка с именем", "quote": "Цитата",
}
#: Styles that suit every kind of accent, best first.
FOR_KIND = {
    "number": ("counter", "slam", "pop", "marker"),
    "name": ("nameplate", "marker", "underline"),
    "quote": ("quote", "type"),
    "term": ("marker", "underline", "pop", "type", "slam"),
    "statement": ("pop", "stack", "slam", "marker", "underline", "type"),
}
WHITE = (246.0, 246.0, 246.0)
INK = (28.0, 26.0, 26.0)
_NUMBER = re.compile(r"^(?P<pre>\D*?)(?P<num>\d[\d\s .,]*\d|\d)(?P<post>.*)$", re.S)


def assign_styles(accents: list[Accent], pool: list[str] | None, seed: int) -> None:
    """Give every accent a style that suits its kind (in place): varied, never the same one twice in a row."""
    allowed = [s for s in (pool or []) if s in STYLES] or list(STYLES)
    rng = random.Random(seed * 13 + 5)
    prev = ""
    for a in accents:
        fits = [s for s in FOR_KIND.get(a.kind, FOR_KIND["statement"]) if s in allowed]
        if "counter" in fits and not countable(a.text):
            fits.remove("counter")
        if not fits:  # nothing of the pool suits this kind: any generic style of the pool
            fits = [s for s in allowed if s not in ("counter", "nameplate", "quote")] or ["pop"]
        if len(fits) > 1 and len(a.text.split()) > 6:
            fits = [s for s in fits if s != "stack"] or fits
        options = [s for s in fits if s != prev] or fits
        # The style made for the kind comes often, the others keep it from getting monotonous.
        weights = [3.0 if s == fits[0] else 1.0 for s in options]
        a.style = rng.choices(options, weights)[0]
        prev = a.style


def parse_number(src: str) -> tuple[float, int, str, str] | None:
    """(value, decimals, decimal separator, thousands separator) of a number as written, None if it is none."""
    s = src.strip()
    if not s or not s[0].isdigit():
        return None
    m = re.search(r"[.,](\d{1,2})$", s)
    decimals = len(m.group(1)) if m else 0
    int_src = s[:-decimals - 1] if decimals else s
    digits = re.sub(r"\D", "", int_src)
    if not digits:
        return None
    group = next((c for c in (" ", "\u00a0", ",", ".") if c in int_src), "")
    return float(digits + ("." + m.group(1) if decimals else "")), decimals, s[-decimals - 1] if decimals else "", group


def countable(text: str) -> bool:
    """A number worth counting up to (not a year, not a tiny one)."""
    m = _NUMBER.match(text)
    num = parse_number(m.group("num")) if m else None
    if num is None:
        return False
    value, decimals, _, group = num
    year = (decimals == 0 and not group and 1800 <= value <= 2100
            and re.match(r"\s*(год|г\.|year|$)", m.group("post"), re.I) is not None)
    return value >= 3 and not year


def key_index(words: list[str], kind: str) -> int:
    """The word to stress: the number for numbers, else the longest word."""
    if kind == "number":
        for i, w in enumerate(words):
            if any(ch.isdigit() for ch in w):
                return i
    return max(range(len(words)), key=lambda i: len(re.sub(r"\W", "", words[i]))) if words else 0


@dataclass
class _Word:
    line: Line
    x: int
    y: int
    t: float
    row: int


def layout(words: list[str], times: list[float], font: str | None, size: int, max_w: float, gap: float = 1.12,
           align: str = "left", tracking: float = 0.0) -> tuple[list[_Word], int, int]:
    """Words wrapped into lines no wider than ``max_w``: (word boxes relative to the block, width, height)."""
    lines = [text_line(w, font, size, tracking) for w in words]
    space = int(size * 0.28)
    rows: list[list[int]] = [[]]
    width = 0
    for i, ln in enumerate(lines):
        need = ln.w + (space if rows[-1] else 0)
        if rows[-1] and width + need > max_w:
            rows.append([])
            width = 0
            need = ln.w
        rows[-1].append(i)
        width += need
    step = int(size * gap)
    row_w = [sum(lines[i].w for i in r) + space * (len(r) - 1) for r in rows]
    block_w = max(row_w)
    out: list[_Word] = []
    for ri, r in enumerate(rows):
        x = 0 if align == "left" else (block_w - row_w[ri]) // 2 if align == "center" else block_w - row_w[ri]
        for i in r:
            out.append(_Word(lines[i], x, ri * step, times[i], ri))
            x += lines[i].w + space
    height = (len(rows) - 1) * step + lines[0].h
    return out, block_w, height


def fit_wrap(words: list[str], font: str | None, size: int, max_w: float, max_lines: int,
             tracking: float = 0.0) -> int:
    """The largest size ≤ ``size`` at which the words wrap into at most ``max_lines`` lines of ``max_w``."""
    from PIL import ImageFont  # noqa: PLC0415

    while size > 14:
        f = ImageFont.truetype(font, size) if font else ImageFont.load_default(size)
        space, rows, width = size * 0.28, 1, 0.0
        for w in words:
            ww = f.getlength(w) + max(0, len(w) - 1) * tracking * size + 2 * max(2, size // 12)
            if ww > max_w:
                rows = max_lines + 1
                break
            need = ww + (space if width else 0)
            if width and width + need > max_w:
                rows, width = rows + 1, ww
            else:
                width += need
        if rows <= max_lines:
            return size
        size = int(size * 0.93)
    return size


class Fx:
    """Base of a style: placement, timing and the look shared by all the accents of a video."""

    def __init__(self, a: Accent, width: int, height: int, color: str, font: str, variant: int,
                 center_y: float, safe_bottom: float):
        self.a = a
        self.w, self.h = width, height
        self.s = height / 1080
        salt = sum(ord(c) for c in type(self).__name__)
        self.v = random.Random(variant * 31 + salt)                 # per video
        self.rng = random.Random(int(a.start * 1000) + salt)        # per accent
        self.accent = bgr(color, "#FFD84D")
        self.font = font
        xf = a.x if a.x is not None else 0.5
        self.xf = xf
        self.align = "left" if xf < 0.45 else "right" if xf > 0.55 else "center"
        self.max_w = (2 * min(xf, 1 - xf) - 0.1) * width
        self.cy = center_y * height
        self.bottom = safe_bottom * height
        self.words = a.text.split()
        self.times = list(a.times) if len(a.times) == len(self.words) else [a.start + 0.12] * len(self.words)
        self.key = key_index(self.words, a.kind)
        self.upper = self.v.random() < 0.5

    def px(self, v: float) -> int:
        return int(round(v * self.s))

    def block_x(self, block_w: int) -> int:
        """Left edge of a block centred on the accent's column, kept inside the frame."""
        x = int(self.xf * self.w - block_w / 2)
        return max(self.px(50), min(self.w - self.px(50) - block_w, x))

    def fade(self, t: float, length: float = 0.35) -> float:
        return 1 - ease_in_out(phase(t, self.a.end - length, length))

    def make_scrim(self, x: int, y: int, w: int, h: int) -> None:
        """A soft dark cloud behind the block, so white text reads on light pictures too."""
        m = self.px(36)
        self.scrim = np.clip(haze(self.w, self.h, (x - m, y - m // 2, x + w + m, y + h + m // 2), 45 * self.s) * 1.2, 0, 1)

    def draw_scrim(self, frame: np.ndarray, t: float, strength: float = 0.5) -> np.ndarray:
        vis = ease_in_out(phase(t, self.a.start, 0.35)) * self.fade(t)
        return darken(frame, self.scrim, strength * vis) if getattr(self, "scrim", None) is not None else frame

    def text(self, w: str) -> str:
        return w.upper() if self.upper else w

    def draw(self, frame: np.ndarray, t: float) -> np.ndarray:  # pragma: no cover – overridden
        return frame


# ====================================================================== pop
class Pop(Fx):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        words = [self.text(w) for w in self.words]
        fp = title_font(self.font, "Black", " ".join(words), SANS_BLACK)
        size = fit_wrap(words, fp, self.px(96), self.max_w, 3)
        self.boxes, self.bw, self.bh = layout(words, self.times, fp, size, self.max_w, 1.05, self.align)
        tilt = self.v.random() < 0.5
        self.sprites = []
        for i, b in enumerate(self.boxes):
            ang = self.rng.uniform(-4, 4) if tilt else 0.0
            sh, pad = shadow(b.line.mask, 8 * self.s)
            core = np.zeros_like(sh)
            core[pad:pad + b.line.h, pad:pad + b.line.w] = b.line.mask
            (layers, _, _) = transform([(sh, (0, 0, 0), 0.6), (core, self.accent if i == self.key else WHITE, 1.0)], ang)
            self.sprites.append((layers, pad))
        self.x0, self.y0 = self.block_x(self.bw), int(self.cy - self.bh / 2)
        self.make_scrim(self.x0, self.y0, self.bw, self.bh)

    def draw(self, frame, t):
        fade = self.fade(t)
        frame = self.draw_scrim(frame, t)
        for b, (layers, pad) in zip(self.boxes, self.sprites):
            u = phase(t, b.t - 0.05, 0.3)
            if u <= 0:
                continue
            sc = max(0.05, 0.45 + 0.55 * ease_back(u, 2.6))
            cx = self.x0 + b.x + b.line.w / 2
            cy = self.y0 + b.y + b.line.h / 2 + (1 - fade) * self.px(30)
            for mask, color, op in layers:
                m = cv2.resize(mask, None, fx=sc, fy=sc, interpolation=cv2.INTER_LINEAR) if abs(sc - 1) > 0.01 else mask
                blend(frame, m, int(cx - m.shape[1] / 2), int(cy - m.shape[0] / 2), color, op * min(1.0, u * 3) * fade)
        return frame


# ====================================================================== marker
class Marker(Fx):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        words = [self.text(w) for w in self.words]
        fp = title_font(self.font, "Black", " ".join(words), SANS_BLACK)
        size = fit_wrap(words, fp, self.px(82), self.max_w, 3)
        self.boxes, self.bw, self.bh = layout(words, self.times, fp, size, self.max_w, 1.25, self.align)
        self.half = self.v.random() < 0.4  # a highlighter over the lower half of the letters only
        self.text_color = INK if luma(self.accent) > 150 and not self.half else WHITE
        self.x0, self.y0 = self.block_x(self.bw), int(self.cy - self.bh / 2)
        self.bands = []
        rows = sorted({b.row for b in self.boxes})
        for r in rows:
            bs = [b for b in self.boxes if b.row == r]
            x0, x1 = min(b.x for b in bs), max(b.x + b.line.w for b in bs)
            lh = bs[0].line.h
            pad = self.px(14)
            hh = int(lh * (0.45 if self.half else 0.86))
            band = torn_rect(x1 - x0 + 2 * pad, hh + self.px(8), self.rng, self.px(4), rough=0.35)
            y = bs[0].y + (int(lh * 0.5) if self.half else int(lh * 0.08))
            self.bands.append((band, x0 - pad, y, bs[0].t - 0.05, max(b.t for b in bs) + 0.3))
        self.shades = [shadow(b.line.mask, 6 * self.s) for b in self.boxes]
        if self.text_color == WHITE:
            self.make_scrim(self.x0, self.y0, self.bw, self.bh)

    def draw(self, frame, t):
        fade = self.fade(t)
        frame = self.draw_scrim(frame, t, 0.4)
        for band, bx, by, t0, t1 in self.bands:
            p = ease_out(phase(t, t0, max(0.25, t1 - t0)), 2)
            if p <= 0:
                continue
            cols = int(band.shape[1] * p)
            part = band[:, :cols] if self.align != "right" else band[:, band.shape[1] - cols:]
            px = bx if self.align != "right" else bx + band.shape[1] - cols
            blend(frame, part, self.x0 + px, self.y0 + by, self.accent, 0.9 * fade)
        for b, (sm, pad) in zip(self.boxes, self.shades):
            u = ease_out(phase(t, b.t - 0.05, 0.25))
            if u <= 0:
                continue
            dy = int(self.px(10) * (1 - u))
            if self.text_color == WHITE:
                blend(frame, sm, self.x0 + b.x - pad + 2, self.y0 + b.y + dy - pad + 3, (0, 0, 0), 0.5 * u * fade)
            blend(frame, b.line.mask, self.x0 + b.x, self.y0 + b.y + dy, self.text_color, u * fade)
        return frame


# ====================================================================== stack
class Stack(Fx):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        fp = title_font(self.font, "Black", self.a.text, SANS_BLACK)
        big = self.px(118)
        self.rows = []
        y = 0
        for i, w in enumerate(self.words):
            size = big if i == self.key else int(big * self.v.choice((0.46, 0.52)))
            ln = text_line(self.text(w), fp, size)
            if ln.w > self.max_w:
                ln = text_line(self.text(w), fp, int(size * self.max_w / ln.w))
            self.rows.append((ln, y, self.times[i], i == self.key, shadow(ln.mask, 8 * self.s)))
            y += int(ln.h * 0.86)
        self.bh = y
        self.bw = max(r[0].w for r in self.rows)
        self.x0, self.y0 = self.block_x(self.bw), int(self.cy - self.bh / 2)
        self.make_scrim(self.x0, self.y0, self.bw, self.bh)

    def draw(self, frame, t):
        fade = self.fade(t)
        frame = self.draw_scrim(frame, t)
        for i, (ln, y, wt, key, (sm, pad)) in enumerate(self.rows):
            u = ease_out(phase(t, wt - 0.05, 0.3), 4)
            if u <= 0:
                continue
            x = self.x0 + (0 if self.align == "left" else (self.bw - ln.w) // 2 if self.align == "center" else self.bw - ln.w)
            x += int((1 if i % 2 else -1) * self.px(120) * (1 - u))
            blend(frame, sm, x - pad + 3, self.y0 + y - pad + 4, (0, 0, 0), 0.55 * u * fade)
            blend(frame, ln.mask, x, self.y0 + y, self.accent if key else WHITE, min(1.0, u * 1.5) * fade)
        return frame


# ====================================================================== slam
class Slam(Fx):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        text = self.a.text.upper()
        fp = title_font(self.font, "Black", text, SANS_BLACK)
        size, lines = fit_lines(text, fp, self.px(110), self.max_w, max_lines=2)
        self.mask = stack([text_line(ln, fp, size) for ln in lines], int(size * 1.0), "center")
        self.hard = self.v.random() < 0.6  # accent letters with a hard dark offset shadow (pop-art)
        self.fill = self.accent if self.hard else WHITE
        self.sh = shadow(self.mask, 10 * self.s)
        self.bh, self.bw = self.mask.shape
        self.x0, self.y0 = self.block_x(self.bw), int(self.cy - self.bh / 2)
        self.make_scrim(self.x0, self.y0, self.bw, self.bh)
        self.t0 = self.times[0] - 0.05

    def draw(self, frame, t):
        u = phase(t, self.t0, 0.2)
        if u <= 0:
            return frame
        fade = self.fade(t)
        hit = t - (self.t0 + 0.2)
        if 0 <= hit < 0.35:  # camera shake after the hit
            amp = self.px(12) * (1 - hit / 0.35)
            dx, dy = amp * math.sin(hit * 90), amp * math.cos(hit * 70)
            m = np.float32([[1, 0, dx], [0, 1, dy]])
            frame = cv2.warpAffine(frame, m, (self.w, self.h), borderMode=cv2.BORDER_REFLECT)
        frame = self.draw_scrim(frame, t, 0.45)
        sc = 1 + 1.3 * (1 - ease_out(u, 3))
        mask = self.mask
        if sc > 1.01:
            mask = cv2.resize(mask, None, fx=sc, fy=sc, interpolation=cv2.INTER_LINEAR)
            mask = cv2.GaussianBlur(mask, (0, 0), (sc - 1) * 5 * self.s + 0.1)
        x = int(self.x0 + self.bw / 2 - mask.shape[1] / 2)
        y = int(self.y0 + self.bh / 2 - mask.shape[0] / 2)
        op = min(1.0, u * 2) * fade
        if self.hard:
            blend(frame, mask, x + self.px(7), y + self.px(7), (20.0, 18.0, 18.0), op)
        else:
            sm, pad = self.sh
            blend(frame, sm, self.x0 - pad + 3, self.y0 - pad + 4, (0, 0, 0), 0.7 * op * float(sc < 1.01))
        blend(frame, mask, x, y, self.fill, op)
        return frame


# ====================================================================== underline
def _scribble(w: int, h: int, rng: random.Random, kind: str) -> np.ndarray:
    """Points of a hand-drawn underline (``line``) or circle (``circle``) in a w×h box."""
    n = 70
    ts = np.linspace(0, 1, n)
    if kind == "circle":
        a0 = rng.uniform(-0.6, -0.3)
        ang = a0 + ts * (2 * math.pi + 0.5)
        rx, ry = w / 2 * (1 + 0.04 * np.sin(ts * 9)), h / 2 * (1 + 0.06 * np.cos(ts * 7))
        pts = np.stack([w / 2 + rx * np.cos(ang), h / 2 + ry * np.sin(ang) + ts * h * 0.06], 1)
    else:
        wave = np.sin(ts * math.pi * rng.uniform(1.5, 3)) * h * 0.18 + ts * h * rng.uniform(-0.2, 0.2)
        pts = np.stack([ts * w, h / 2 + wave], 1)
    return pts.astype(np.float32)


class Underline(Fx):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        words = [self.text(w) for w in self.words]
        fp = title_font(self.font, "Bold", " ".join(words), SANS_BOLD)
        size = fit_wrap(words, fp, self.px(84), self.max_w, 3)
        self.boxes, self.bw, self.bh = layout(words, self.times, fp, size, self.max_w, 1.2, self.align)
        self.shades = [shadow(b.line.mask, 7 * self.s) for b in self.boxes]
        self.x0, self.y0 = self.block_x(self.bw), int(self.cy - self.bh / 2)
        self.kind = "circle" if self.v.random() < 0.4 else "line"
        kb = self.boxes[self.key]
        pad = self.px(18)
        if self.kind == "circle":
            self.box = (kb.x - pad, kb.y - pad // 2, kb.line.w + 2 * pad, kb.line.h + pad)
        else:
            self.box = (kb.x - pad // 2, kb.y + int(kb.line.h * 0.82), kb.line.w + pad, self.px(30))
        self.pts = _scribble(self.box[2], self.box[3], self.rng, self.kind)
        self.t_draw = max(b.t for b in self.boxes) + 0.15
        self.make_scrim(self.x0, self.y0, self.bw, self.bh)

    def draw(self, frame, t):
        fade = self.fade(t)
        frame = self.draw_scrim(frame, t)
        for b, (sm, pad) in zip(self.boxes, self.shades):
            u = ease_out(phase(t, b.t - 0.05, 0.3))
            if u <= 0:
                continue
            dy = int(self.px(14) * (1 - u))
            blend(frame, sm, self.x0 + b.x - pad + 2, self.y0 + b.y + dy - pad + 3, (0, 0, 0), 0.5 * u * fade)
            blend(frame, b.line.mask, self.x0 + b.x, self.y0 + b.y + dy, WHITE, u * fade)
        p = ease_in_out(phase(t, self.t_draw, 0.45))
        if p > 0:
            bx, by, bw, bh = self.box
            pad = self.px(10)
            m = np.zeros((bh + 2 * pad, bw + 2 * pad), np.float32)
            k = max(2, int(len(self.pts) * p))
            pts = (self.pts[:k] + pad).astype(np.int32)
            cv2.polylines(m, [pts], False, 1.0, max(3, self.px(7)), cv2.LINE_AA)
            blend(frame, m, self.x0 + bx - pad, self.y0 + by - pad, self.accent, 0.95 * fade)
        return frame


# ====================================================================== type
class Type(Fx):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        fp = resolve_font(MONO, self.a.text)
        size = fit_wrap(self.words, fp, self.px(62), self.max_w, 4)
        self.boxes, self.bw, self.bh = layout(self.words, self.times, fp, size, self.max_w, 1.35, self.align)
        self.x0, self.y0 = self.block_x(self.bw), int(self.cy - self.bh / 2)
        self.strip = self.v.random() < 0.45
        ends = [b.t for b in self.boxes[1:]] + [self.boxes[-1].t + 0.4]
        self.spans = [(b.t - 0.03, max(0.12, min(0.6, e - b.t))) for b, e in zip(self.boxes, ends)]

    def draw(self, frame, t):
        fade = self.fade(t)
        cursor = None
        for b, (t0, dur) in zip(self.boxes, self.spans):
            n = len(b.line.starts) - 1
            shown = int(n * phase(t, t0, dur) + 0.999) if t >= t0 else 0
            if shown <= 0:
                continue
            x, y = self.x0 + b.x, self.y0 + b.y
            sw = b.line.starts[shown] if shown < n else b.line.w
            pad = self.px(10)
            if self.strip:
                blend(frame, np.ones((b.line.h + pad, sw + 2 * pad), np.float32), x - pad, y - pad // 2,
                      (236.0, 238.0, 238.0), 0.95 * fade)
            else:
                soft = self.px(24)
                box = np.zeros((b.line.h + 2 * soft, sw + 2 * soft + pad), np.float32)
                box[soft:-soft, soft:-soft] = 1
                blend(frame, cv2.GaussianBlur(box, (0, 0), soft / 2.2), x - soft - pad // 2, y - soft, (0, 0, 0), 0.65 * fade)
            draw_letters(frame, b.line, x, y, INK if self.strip else WHITE,
                         [fade if i < shown else 0 for i in range(n)], [0.0] * n)
            cursor = (x + sw, y, b.line.h)
        if cursor and (t < self.spans[-1][0] + self.spans[-1][1] or int(t * 2.4) % 2 == 0):
            cx, cy, lh = cursor
            blend(frame, np.ones((int(lh * 0.7), max(3, self.px(5))), np.float32), cx + self.px(3), cy + int(lh * 0.15),
                  INK if self.strip else self.accent, 0.9 * fade)
        return frame


# ====================================================================== counter
def _format_like(value: float, num: tuple[float, int, str, str]) -> str:
    """``value`` written like the source number (decimals, decimal and thousands separators)."""
    _, decimals, dec_sep, group = num
    int_part, _, frac = f"{value:.{decimals}f}".partition(".")
    if group and len(int_part) > 3:
        int_part = f"{int(int_part):,}".replace(",", group)
    return int_part + (dec_sep + frac if decimals else "")


class Counter(Fx):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        m = _NUMBER.match(self.a.text)
        self.pre, self.num, self.post = (m.group("pre"), m.group("num"), m.group("post")) if m else ("", "0", self.a.text)
        self.parsed = parse_number(self.num) or (0.0, 0, "", "")
        self.value = self.parsed[0]
        self.font_path = title_font(self.font, "Black", "0123456789" + self.a.text, SANS_BLACK)
        self.size = self.px(180)
        post = self.post.strip()
        short = len(post) <= 4
        self.post_line = text_line(self.text(post), title_font(self.font, "Black", post, SANS_BLACK),
                                   int(self.size * 0.8) if short else self.px(54 if len(post) < 14 else 42)) if post else None
        sub = self.a.sub.strip()
        self.sub_line = text_line(sub, resolve_font(SANS_SEMI, sub), self.px(34)) if sub else None
        self.sub_shadow = shadow(self.sub_line.mask, 5 * self.s) if self.sub_line else None
        self.pct = "%" in self.a.text and 0 < self.value <= 100 and self.v.random() < 0.7
        self.cache: dict[str, tuple[Line, tuple]] = {}
        full = text_line(self.pre + self.num, self.font_path, self.size)
        self.side_by_side = self.post_line is not None and len(post) <= 4
        self.bw = full.w + (self.post_line.w + self.px(16) if self.side_by_side else 0)
        if self.post_line is not None and not self.side_by_side:
            self.bw = max(self.bw, self.post_line.w)
        self.full_h = full.h
        self.x0 = self.block_x(self.bw)
        self.y0 = int(self.cy - full.h * 0.6)
        idx = next((i for i, w in enumerate(self.words) if any(c.isdigit() for c in w)), 0)
        self.t0 = self.times[idx] - 0.08
        extra = (self.post_line.h if self.post_line is not None and not self.side_by_side else 0) + \
            (self.sub_line.h + self.px(20) if self.sub_line else 0) + (self.px(30) if self.pct else 0)
        self.make_scrim(self.x0, self.y0, self.bw, self.full_h + extra)

    def _line(self, s: str) -> tuple[Line, tuple]:
        if s not in self.cache:
            if len(self.cache) > 40:
                self.cache.clear()
            ln = text_line(s, self.font_path, self.size)
            self.cache[s] = (ln, shadow(ln.mask, 10 * self.s))
        return self.cache[s]

    def draw(self, frame, t):
        u = phase(t, self.t0, 0.9)
        if t < self.t0:
            return frame
        fade = self.fade(t)
        frame = self.draw_scrim(frame, t, 0.45)
        p = ease_out(u, 3)
        shown = self.pre + _format_like(self.value * p, self.parsed)
        ln, (sm, pad) = self._line(shown)
        op = min(1.0, phase(t, self.t0, 0.15)) * fade
        x = self.x0 if self.align != "right" else self.x0 + self.bw - ln.w - (self.post_line.w + self.px(16) if self.side_by_side else 0)
        blend(frame, sm, x - pad + 3, self.y0 - pad + 5, (0, 0, 0), 0.55 * op)
        blend(frame, ln.mask, x, self.y0, self.accent, op)
        below = self.y0 + int(self.full_h * 0.92)
        if self.post_line is not None:
            pu = ease_out(phase(t, self.t0 + 0.35, 0.35))
            pl = self.post_line
            if self.side_by_side:
                px, py = x + ln.w + self.px(10), self.y0 + ln.ascent - pl.ascent
            else:
                px = self.x0 if self.align != "right" else self.x0 + self.bw - pl.w
                py = below
                below += pl.h
            ps, ppad = shadow(pl.mask, 6 * self.s)
            blend(frame, ps, px - ppad + 2, py - ppad + 3, (0, 0, 0), 0.5 * pu * fade)
            blend(frame, pl.mask, px, py, WHITE, pu * fade)
        if self.pct:
            bw, bh = max(self.bw, self.px(260)), self.px(10)
            bx = self.x0 if self.align != "right" else self.x0 + self.bw - bw
            blend(frame, np.ones((bh, bw), np.float32), bx, below + self.px(12), WHITE, 0.25 * fade)
            fill = int(bw * self.value / 100 * p)
            if fill > 0:
                blend(frame, np.ones((bh, fill), np.float32), bx, below + self.px(12), self.accent, fade)
            below += self.px(30)
        if self.sub_line is not None:
            su = ease_out(phase(t, self.t0 + 0.5, 0.4))
            sx = self.x0 if self.align != "right" else self.x0 + self.bw - self.sub_line.w
            sm, spad = self.sub_shadow
            blend(frame, sm, sx - spad + 2, below + self.px(14) - spad + 3, (0, 0, 0), 0.6 * su * fade)
            blend(frame, self.sub_line.mask, sx, below + self.px(14), WHITE, su * fade)
        return frame


# ====================================================================== nameplate
class Nameplate(Fx):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        name = self.a.text
        fp = title_font(self.font, "Black", name, SANS_BLACK)
        size, lines = fit_lines(name, fp, self.px(60), self.w * 0.42, max_lines=2)
        self.left = self.align != "right"
        self.name = stack([text_line(ln, fp, size) for ln in lines], int(size * 1.05), "left" if self.left else "right")
        sub = self.a.sub.strip()
        self.sub = text_line(sub.upper(), resolve_font(SANS_SEMI, sub), self.px(24), tracking=0.2) if sub else None
        self.plate = self.v.random() < 0.5  # a dark plate behind the text, else a bar only
        nh, nw = self.name.shape
        self.bh = nh + (self.sub.h + self.px(8) if self.sub else 0)
        self.bw = max(nw, self.sub.w if self.sub else 0)
        self.bar_x = int(self.w * 0.06) if self.left else int(self.w * 0.94) - self.px(9)
        self.y0 = int(self.bottom - self.bh - self.px(20))
        self.t0 = self.times[0] - 0.1

    def draw(self, frame, t):
        if t < self.t0:
            return frame
        fade = self.fade(t)
        bar = ease_out(phase(t, self.t0, 0.3), 3)
        thick = self.px(9)
        gap = self.px(24)
        bh = int((self.bh + self.px(20)) * bar)
        u = ease_out(phase(t, self.t0 + 0.12, 0.5), 4)
        shift = int((1 - u) * (self.bw + gap))
        if self.plate and u > 0:
            pw = int((self.bw + 2 * gap) * u)
            px = self.bar_x + thick if self.left else self.bar_x - pw
            blend(frame, np.ones((self.bh + self.px(20), pw), np.float32), px, self.y0 - self.px(10), (18, 18, 20), 0.72 * fade)
        if bh > 0:
            blend(frame, np.ones((bh, thick), np.float32), self.bar_x, self.y0 - self.px(10), self.accent, fade)
        nh, nw = self.name.shape
        items = [(self.name, self.y0, WHITE)]
        if self.sub is not None:
            items.append((self.sub.mask, self.y0 + nh + self.px(8), (226, 226, 226)))
        for mask, y, color in items:
            w = mask.shape[1]
            if self.left:
                x = self.bar_x + thick + gap - shift
                cut = max(0, self.bar_x + thick - x)
                part, px = (mask[:, cut:] if cut < w else None), x + cut
            else:
                x = self.bar_x - gap - w + shift
                cut = max(0, x + w - self.bar_x)
                part, px = (mask[:, :w - cut] if cut < w else None), x
            if part is not None and part.shape[1]:
                if not self.plate:
                    blend(frame, cv2.GaussianBlur(part, (0, 0), 5 * self.s) * 1.5, px + 2, y + 3, (0, 0, 0), 0.6 * fade)
                blend(frame, part, px, y, color, fade)
        return frame


# ====================================================================== quote
class Quote(Fx):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        fp = resolve_font(SERIF_ITALIC, self.a.text)
        width = max(self.max_w, self.w * 0.5) if self.align != "center" else self.w * 0.7
        size = fit_wrap(self.words, fp, self.px(74), width, 4)
        self.boxes, self.bw, self.bh = layout(self.words, self.times, fp, size, width, 1.22, self.align)
        self.shades = [shadow(b.line.mask, 7 * self.s) for b in self.boxes]
        mark = "«" if self.v.random() < 0.5 and any("а" <= c <= "я" for c in self.a.text.lower()) else "“"
        self.mark = text_line(mark, resolve_font([("Georgia", "Bold"), ("Cambria", "Bold")], mark), self.px(220))
        sub = self.a.sub.strip()
        self.sub = text_line("— " + sub, resolve_font(SANS_SEMI, sub), self.px(30)) if sub else None
        self.x0 = max(self.block_x(self.bw), int(self.mark.w * 0.6) if self.align != "right" else 0)
        if self.align == "right":
            self.x0 = min(self.x0, self.w - self.bw - int(self.mark.w * 0.6))
        self.y0 = int(self.cy - self.bh / 2)
        top = self.y0 - self.px(60)
        self.haze = haze(self.w, self.h, (self.x0 - self.px(40), top, self.x0 + self.bw + self.px(40),
                                          self.y0 + self.bh + (self.sub.h + self.px(50) if self.sub else self.px(30))),
                         60 * self.s)

    def draw(self, frame, t):
        fade = self.fade(t, 0.45)
        vis = ease_in_out(phase(t, self.a.start, 0.4)) * fade
        frame = darken(frame, self.haze, 0.72 * vis)
        mu = ease_back(phase(t, self.a.start, 0.45), 1.8)
        if mu > 0:
            m = self.mark.mask
            sc = max(0.05, mu)
            mm = cv2.resize(m, None, fx=sc, fy=sc) if abs(sc - 1) > 0.01 else m
            mx = self.x0 - int(self.mark.w * 0.55) if self.align != "right" else self.x0 + self.bw - int(self.mark.w * 0.45)
            blend(frame, mm, mx + (m.shape[1] - mm.shape[1]) // 2, self.y0 - int(self.mark.h * 0.42), self.accent,
                  0.9 * min(1.0, mu) * fade)
        for b, (sm, pad) in zip(self.boxes, self.shades):
            u = ease_out(phase(t, b.t - 0.05, 0.35))
            if u <= 0:
                continue
            dy = int(self.px(8) * (1 - u))
            blend(frame, sm, self.x0 + b.x - pad + 2, self.y0 + b.y + dy - pad + 3, (0, 0, 0), 0.5 * u * fade)
            blend(frame, b.line.mask, self.x0 + b.x, self.y0 + b.y + dy, WHITE, u * fade)
        if self.sub is not None:
            su = ease_out(phase(t, max(b.t for b in self.boxes) + 0.25, 0.4))
            sx = self.x0 if self.align != "right" else self.x0 + self.bw - self.sub.w
            blend(frame, self.sub.mask, sx + int(self.px(20) * (1 - su)), self.y0 + self.bh + self.px(22), self.accent,
                  su * fade)
        return frame


FX: dict[str, type[Fx]] = {
    "pop": Pop, "marker": Marker, "stack": Stack, "slam": Slam, "underline": Underline, "type": Type,
    "counter": Counter, "nameplate": Nameplate, "quote": Quote,
}


class AccentRenderer:
    """Draws the accents of a plan (one per worker; a style is built when its accent first shows)."""

    def __init__(self, items: list[dict], width: int, height: int, color: str = "", font: str = "", variant: int = 0,
                 center_y: float = 0.42, safe_bottom: float = 0.86):
        self.items = [Accent(**it) for it in items]
        self.args = (width, height, color, font, variant, center_y, safe_bottom)
        self._built: dict[int, Fx] = {}

    def apply(self, frame: np.ndarray, t: float) -> np.ndarray:
        for k, a in enumerate(self.items):
            if a.start <= t < a.end:
                fx = self._built.get(k)
                if fx is None:
                    fx = FX.get(a.style, Pop)(a, *self.args)
                    self._built = {k: fx}  # accents never overlap: keep only the current one
                return fx.draw(np.ascontiguousarray(frame), t)
        return frame


def to_plan(accents: list[Accent]) -> list[dict]:
    return [asdict(a) for a in accents]
