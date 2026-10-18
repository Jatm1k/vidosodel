"""The designs of the chapter cards.

Every design has variants – layout, typeface, palette, how the title enters – picked by the variant seed
of the video (``self.v``), so all the chapters of one video match and the next video looks different
even with the same design. Small things (the tilt of a clipping, the shape of a stroke) also vary per
chapter (``self.rng``). A design builds its sprites once in ``__init__``; ``draw`` is called for every
frame of the card with the frame (uint8 BGR) and the absolute time, and returns the frame.
"""
from __future__ import annotations

import math
import random

import cv2
import numpy as np

from .card_kit import (
    MONO, ROMAN, SANS_BLACK, SANS_LIGHT, SANS_SEMI, SERIF, SERIF_BOLD, Card, Layer, Line, blend, bgr, darken,
    dim, draw_layers, draw_letters, ease_back, ease_in_out, ease_out, fit_lines, halftone, haze, luma, paper_texture,
    phase, resolve_font, shadow, side_gradient, stack, stagger, text_line, title_font, torn_rect, transform,
)

WHITE = (246.0, 246.0, 246.0)
INK = (30.0, 28.0, 28.0)


class Design:
    """Base of a design: shared state and the in/out envelope."""

    default_color = "#FFFFFF"

    def __init__(self, card: Card, width: int, height: int, color: str, font: str, variant: int):
        self.c = card
        self.w, self.h = width, height
        self.s = height / 1080
        name_salt = sum(ord(ch) for ch in type(self).__name__)
        self.v = random.Random(variant * 7919 + name_salt)  # per video: the same for every chapter
        self.rng = random.Random(card.seed)                 # per chapter
        self.custom_color = bool(color)
        self.accent = bgr(color, self.default_color)
        self.font = font
        self.left = card.side == "left"

    def envelope(self, t: float, out_len: float = 0.55) -> tuple[float, float]:
        """(time since the card started, 0..1 fade-out at its end)."""
        local = t - self.c.start
        return local, phase(local, self.c.duration - out_len, out_len)

    def px(self, v: float) -> int:
        return int(round(v * self.s))

    def draw(self, frame: np.ndarray, t: float) -> np.ndarray:  # pragma: no cover – overridden
        return frame


# ====================================================================== cinema
class Cinema(Design):
    """Letterbox, a dimmed soft picture, a spaced-out kicker and a title that appears letter by letter."""

    default_color = "#E3C58B"

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        v, c = self.v, self.c
        self.bars = v.choice((0.105, 0.105, 0.065, 0.0))
        self.low = v.random() < 0.35                 # title in the lower third instead of the middle
        self.anim = v.choice(("rise", "track", "blur"))
        self.light = v.random() < 0.3                # light spaced capitals instead of a serif
        self.kicker_below = v.random() < 0.3
        text = c.title.upper() if self.light else c.title
        self.tracking = 0.14 if self.light else 0.0
        fp = title_font(self.font, "Light" if self.light else "Regular", text, SANS_LIGHT if self.light else SERIF)
        size, lines = fit_lines(text, fp, self.px(62 if self.light else 78), self.w * 0.74, self.tracking)
        self.lines = [text_line(ln, fp, size, self.tracking) for ln in lines]
        self.shades = [shadow(ln.mask, 10 * self.s) for ln in self.lines]
        kick = c.kicker.upper()
        self.kicker = text_line(kick, resolve_font(SANS_SEMI, kick), self.px(27), tracking=0.45) if kick else None
        self.gap = int(size * 1.12)

    def draw(self, frame, t):
        local, out = self.envelope(t)
        fade = 1 - ease_in_out(out)
        vis = ease_in_out(phase(local, 0.0, 0.7)) * fade
        frame = dim(frame, 0.42 * vis, blur=5 * self.s * vis, desat=0.35 * vis)
        bar = int(self.h * self.bars * ease_out(phase(local, 0.0, 0.8)) * fade)
        if bar > 0:
            frame[:bar] = 0
            frame[-bar:] = 0
        block_h = len(self.lines) * self.gap
        cy = self.h * (0.68 if self.low else 0.5)
        y = int(cy - block_h / 2 + self.gap * 0.15)
        if self.kicker is not None:
            k = self.kicker
            ku = ease_out(phase(local, 0.25, 0.9))
            ky = y + block_h + self.px(18) if self.kicker_below else y - self.px(70)
            blend(frame, k.mask, int(self.w / 2 - k.w / 2), ky + int(self.px(10) * (1 - ku)), self.accent, ku * fade * 0.95)
            lw = int(self.w * 0.09 * ease_out(phase(local, 0.45, 0.9)))
            if lw > 1:
                ly = ky - self.px(8) if self.kicker_below else ky + k.h + self.px(4)
                blend(frame, np.ones((max(1, self.px(2)), 2 * lw), np.float32), int(self.w / 2 - lw), ly,
                      self.accent, 0.8 * fade)
        for li, (ln, sh) in enumerate(zip(self.lines, self.shades)):
            x, ly = int(self.w / 2 - ln.w / 2), y + li * self.gap
            u = phase(local, 0.45 + 0.18 * li, 1.1)
            n = len(ln.starts) - 1
            if self.anim == "rise":
                prog = stagger(n, u, 0.55)
                draw_letters(frame, ln, x, ly, WHITE, [ease_out(p, 2) * fade for p in prog],
                             [self.px(16) * (1 - ease_out(p, 3)) for p in prog], shade=sh, shade_op=0.6)
            elif self.anim == "track":
                e = ease_out(u, 4)
                mid = (n - 1) / 2
                dxs = [(i - mid) * self.px(9) * (1 - e) for i in range(n)]
                draw_letters(frame, ln, x, ly, WHITE, [min(1.0, u * 1.6) * fade] * n, [0.0] * n, shade=sh,
                             shade_op=0.6, dxs=dxs)
            else:  # blur: the title comes into focus
                e = ease_out(u, 2)
                sigma = self.px(14) * (1 - e)
                mask = cv2.GaussianBlur(ln.mask, (0, 0), sigma) if sigma > 0.4 else ln.mask
                smask, pad = sh
                blend(frame, smask, x - pad + 2, ly - pad + 3, (0, 0, 0), 0.6 * e * fade)
                blend(frame, mask, x, ly, WHITE, min(1.0, u * 1.8) * fade)
        return frame


# ====================================================================== editorial
class Editorial(Design):
    """A huge chapter number off the edge, a heavy title revealed line by line, the free side darkened."""

    default_color = "#F2C14E"

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        v, c = self.v, self.c
        self.number_kind = v.choice(("outline", "solid", "roman", "bar"))
        self.reveal = v.choice(("up", "side"))
        self.upper = v.random() < 0.35
        self.serif = v.random() < 0.3
        self.rule = v.random() < 0.4                 # a rule under the title instead of a bar by the kicker
        text = c.title.upper() if self.upper else c.title
        fp = title_font(self.font, "Bold" if self.serif else "Black", text, SERIF_BOLD if self.serif else SANS_BLACK)
        size, lines = fit_lines(text, fp, self.px(80 if self.upper else 84), self.w * 0.46)
        self.lines = [text_line(ln, fp, size) for ln in lines]
        self.shades = [shadow(ln.mask, 12 * self.s) for ln in self.lines]
        kick = c.kicker.upper()
        self.kicker = text_line(kick, resolve_font(SANS_SEMI, kick), self.px(24), tracking=0.28) if kick else None
        num = ROMAN[c.number] if self.number_kind == "roman" and c.number < len(ROMAN) else f"{c.number:02d}"
        nf = resolve_font(SERIF if self.number_kind == "roman" else SANS_BLACK, "0")
        big = int(self.h * (0.5 if self.number_kind == "roman" else 0.62))
        self.number = text_line(num, nf, big, tracking=-0.02, stroke=max(2, self.px(3)))
        self.number_fill = text_line(num, nf, big, tracking=-0.02)
        self.gap = int(size * 1.08)
        self.grad = side_gradient(self.w, self.h, c.side, 0.9)
        self.drift = self.rng.choice((-1, 1))

    def at(self, width: int) -> int:
        edge = int(self.w * 0.085)
        return edge if self.left else self.w - edge - width

    def draw(self, frame, t):
        local, out = self.envelope(t)
        fade = 1 - ease_in_out(out)
        vis = ease_in_out(phase(local, 0.0, 0.7)) * fade
        frame = darken(frame, self.grad, 0.8 * vis)
        n = self.number
        nu = ease_out(phase(local, 0.0, 1.4))
        if self.number_kind == "bar":
            bh = int(self.h * 0.42 * ease_out(phase(local, 0.0, 0.8), 3))
            bx = int(self.w * 0.045) if self.left else int(self.w * 0.955) - self.px(10)
            blend(frame, np.ones((max(1, bh), self.px(10)), np.float32), bx, int(self.h * 0.52 - bh / 2), self.accent, fade)
        else:
            drift = self.drift * 0.02 * self.w * (local / max(1.0, self.c.duration))
            nx = int(-n.w * 0.28 + drift) if self.left else int(self.w - n.w * 0.72 + drift)
            nx += int((-1 if self.left else 1) * self.px(40) * (1 - nu))
            ny = int(self.h * 0.5 - n.ascent * 0.62)
            fill = 0.24 if self.number_kind == "solid" else 0.12
            blend(frame, self.number_fill.mask, nx, ny, self.accent, fill * nu * fade)
            if self.number_kind != "solid":
                blend(frame, n.mask, nx, ny, self.accent, 0.6 * nu * fade)
        block_h = len(self.lines) * self.gap
        y = int(self.h * 0.52 - block_h / 2)
        if self.kicker is not None:
            k = self.kicker
            ku = ease_out(phase(local, 0.2, 0.7))
            ky = y - self.px(56)
            bar = 0 if self.rule else self.px(62)
            kx = self.at(bar + k.w)
            bw = int(self.px(46) * ease_out(phase(local, 0.1, 0.6)))
            if bar and bw > 0:
                bx = kx if self.left else kx + bar + k.w - bw
                blend(frame, np.ones((max(2, self.px(5)), bw), np.float32), bx, ky + k.ascent // 2 + self.px(4),
                      self.accent, fade)
            tx = kx + bar if self.left else kx
            blend(frame, k.mask, tx + int((-1 if self.left else 1) * self.px(12) * (1 - ku)), ky, self.accent, ku * fade)
        widest = 0
        for li, (ln, sh) in enumerate(zip(self.lines, self.shades)):
            u = ease_out(phase(local, 0.3 + 0.14 * li, 0.75), 4)
            ly, lx = y + li * self.gap, self.at(ln.w)
            widest = max(widest, ln.w)
            smask, pad = sh
            if self.reveal == "up":  # the line rises from under a mask at its baseline
                off = int((1 - u) * ln.h)
                if off >= ln.h:
                    continue
                blend(frame, smask[:smask.shape[0] - off], lx - pad + 3, ly + off - pad + 4, (0, 0, 0), 0.5 * fade * u)
                blend(frame, ln.mask[:ln.h - off], lx, ly + off, (248, 248, 248), fade)
            else:  # the line slides in from the edge of its own column
                off = int((1 - u) * ln.w)
                if off >= ln.w:
                    continue
                part = ln.mask[:, off:] if self.left else ln.mask[:, :ln.w - off]
                px = lx if self.left else lx + off
                blend(frame, cv2.GaussianBlur(part, (0, 0), 6 * self.s) * 1.4, px + 3, ly + 4, (0, 0, 0), 0.5 * fade * u)
                blend(frame, part, px, ly, (248, 248, 248), fade)
        if self.rule:
            rw = int(widest * 0.6 * ease_out(phase(local, 0.6, 0.7), 3))
            if rw > 0:
                rx = self.at(widest) if self.left else self.at(widest) + widest - rw
                blend(frame, np.ones((max(2, self.px(5)), rw), np.float32), rx, y + block_h + self.px(14), self.accent, fade)
        return frame


# ====================================================================== brush
def brush_mask(w: int, h: int, rng: random.Random, arch: float = 0.05, body: float = 0.40) -> np.ndarray:
    """A dry ink stroke: ragged edges, bristle streaks in the dry tail, tapered ends (float 0..1, h×w)."""
    nrng = np.random.default_rng(rng.randrange(1 << 30))
    xs = np.linspace(0, 1, w, dtype=np.float32)
    wob = np.cumsum(nrng.normal(0, 1, w)).astype(np.float32)
    wob = cv2.GaussianBlur(wob[None, :], (0, 0), w / 40)[0]
    wob = (wob - wob.mean()) / (np.abs(wob).max() + 1e-6)
    taper = np.clip(np.minimum(xs / 0.06, (1 - xs) / 0.12), 0, 1) ** 0.6
    half = (body + 0.06 * wob) * taper * h
    centre = h / 2 + arch * h * np.sin(xs * math.pi * rng.uniform(0.6, 1.4) + rng.uniform(0, 6))
    ys = np.arange(h, dtype=np.float32)[:, None]
    edge = cv2.GaussianBlur(nrng.normal(0, 1, (h, w)).astype(np.float32), (0, 0), 1.2) * h * 0.035
    mask = np.clip((half[None, :] - (np.abs(ys - centre[None, :]) + edge)) / (h * 0.025), 0, 1)
    streak = cv2.GaussianBlur(nrng.random((h, 1)).astype(np.float32), (0, 0), 1.2)
    streak = (streak - streak.min()) / (np.ptp(streak) + 1e-6)
    dry = np.clip((xs - 0.6) / 0.4, 0, 1) ** 1.3
    holes = np.clip((0.55 * dry[None, :] - streak) / 0.08, 0, 1)
    mask *= 1 - 0.9 * cv2.GaussianBlur(holes, (0, 0), 1.0)
    grain = cv2.GaussianBlur(nrng.random((h, w)).astype(np.float32), (0, 0), 0.7)
    return np.clip(mask * (0.88 + 0.12 * grain), 0, 1)


class Brush(Design):
    """An ink stroke painted across the frame with the title on it."""

    default_color = "#B8262F"

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        v, c = self.v, self.c
        palette = v.choice(("accent", "accent", "ink", "chalk")) if not self.custom_color else "accent"
        self.stroke_color, self.text_color = {
            "accent": (self.accent, WHITE if luma(self.accent) < 170 else INK),
            "ink": ((24.0, 22.0, 22.0), WHITE),
            "chalk": ((232.0, 234.0, 236.0), INK),
        }[palette]
        self.second = v.random() < 0.35              # a thin second stroke under the main one
        self.second_color = self.accent if palette != "accent" else (24.0, 22.0, 22.0)
        # The kicker takes the colour of the stroke (a white stroke would vanish on light pictures).
        self.kicker_color = self.accent if palette == "chalk" else self.stroke_color
        upper = v.random() < 0.35
        text = c.title.upper() if upper else c.title
        fp = title_font(self.font, "Black", text, SANS_BLACK)
        size, lines = fit_lines(text, fp, self.px(70 if not upper else 62), self.w * 0.5)
        self.title = stack([text_line(ln, fp, size) for ln in lines], int(size * 1.05), "center")
        th, tw = self.title.shape
        sw, sh = int(tw + 300 * self.s), int(th + 130 * self.s)
        arch, body = v.uniform(0.02, 0.09), v.uniform(0.37, 0.43)
        self.stroke = brush_mask(sw, sh, self.rng, arch, body)
        self.thin = brush_mask(int(sw * 0.8), max(8, int(sh * 0.28)), self.rng, arch * 2, 0.36) if self.second else None
        if not self.left:
            self.stroke = self.stroke[:, ::-1].copy()
            if self.thin is not None:
                self.thin = self.thin[:, ::-1].copy()
        lead = int(95 * self.s)  # the title sits on the wet start of the stroke, the dry tail stays free
        canvas = np.zeros((sh, sw), np.float32)
        ty, tx = (sh - th) // 2 + self.px(6), (lead if self.left else sw - tw - lead)
        canvas[ty:ty + th, tx:tx + tw] = self.title
        self.angle = self.rng.uniform(1.2, 3.4) * (1 if self.left else -1) * (1 if v.random() < 0.7 else -1)
        self.rot = cv2.getRotationMatrix2D((sw / 2, sh / 2), self.angle, 1.0)
        self.title_rot = cv2.warpAffine(canvas, self.rot, (sw, sh))
        self.title_shadow = cv2.GaussianBlur(self.title_rot, (0, 0), 3 * self.s)
        kick = c.kicker.upper()
        self.kicker = text_line(kick, resolve_font(SANS_SEMI, kick), self.px(26), tracking=0.3) if kick else None
        self.kicker_below = v.random() < 0.3
        self.sx = int(self.w * 0.07) if self.left else int(self.w * 0.93 - sw)
        self.sy = int(self.h * 0.56 - sh / 2)

    def _paint(self, mask: np.ndarray, on: float, off: float) -> np.ndarray:
        """The part of a stroke painted so far (soft head), minus the part already wiped off."""
        x = np.linspace(0, 1, mask.shape[1], dtype=np.float32)
        if not self.left:
            x = 1 - x
        reveal = np.clip((on * 1.15 - x) / 0.15, 0, 1) * np.clip((x - off * 1.15 + 0.15) / 0.15, 0, 1)
        return mask * reveal[None, :]

    def draw(self, frame, t):
        local, out = self.envelope(t)
        sh, sw = self.stroke.shape
        off = ease_in_out(out)
        if self.thin is not None:
            on2 = ease_out(phase(local, 0.25, 0.5), 2.2)
            th_, tw_ = self.thin.shape
            m = cv2.getRotationMatrix2D((tw_ / 2, th_ / 2), self.angle, 1.0)
            thin = cv2.warpAffine(self._paint(self.thin, on2, off), m, (tw_, th_))
            tx = self.sx + (sw - self.thin.shape[1]) // 2
            blend(frame, thin, tx, self.sy + int(sh * 0.86), self.second_color, 0.95)
        stroke = cv2.warpAffine(self._paint(self.stroke, ease_out(phase(local, 0.05, 0.55), 2.2), off), self.rot, (sw, sh))
        blend(frame, stroke, self.sx, self.sy, self.stroke_color, 0.96)
        fade = 1 - ease_in_out(phase(local, self.c.duration - 0.75, 0.45))
        tu = ease_out(phase(local, 0.35, 0.5))
        dy = int(self.px(10) * (1 - tu))
        blend(frame, self.title_shadow, self.sx + 2, self.sy + dy + 3, (0, 0, 0), 0.35 * tu * fade)
        blend(frame, self.title_rot, self.sx, self.sy + dy, self.text_color, tu * fade)
        if self.kicker is not None:
            k = self.kicker
            ku = ease_out(phase(local, 0.5, 0.6))
            kx = self.sx + self.px(40) if self.left else self.sx + sw - k.w - self.px(40)
            ky = (self.sy + sh - self.px(6) if self.kicker_below else self.sy - k.h + self.px(8)) - int(self.px(8) * (1 - ku))
            if luma(self.kicker_color) > 140:  # a light kicker needs a shadow to read on the picture
                ks, pad = shadow(k.mask, 4 * self.s)
                blend(frame, ks, kx - pad + 1, ky - pad + 2, (0, 0, 0), 0.6 * ku * fade)
            blend(frame, k.mask, kx, ky, self.kicker_color, ku * fade)
        return frame


# ====================================================================== minimal
class Minimal(Design):
    """A thin line grows; the number and the title slide out from behind it."""

    default_color = "#F0F0F0"

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        v, c = self.v, self.c
        self.horizontal = v.random() < 0.4
        self.number_kind = v.choice(("big", "big", "inline", "none"))
        light = v.random() < 0.35
        num = f"{c.number:02d}"
        text = f"{num} — {c.title}" if self.number_kind == "inline" else c.title
        fp = title_font(self.font, "Light" if light else "Semibold", text, SANS_LIGHT if light else SANS_SEMI)
        size, lines = fit_lines(text, fp, self.px(70 if light else 60), self.w * 0.42)
        self.lines = [text_line(ln, fp, size) for ln in lines]
        self.shades = [shadow(ln.mask, 9 * self.s, 2.2 if light else 1.6) for ln in self.lines]
        self.number = text_line(num, resolve_font(SANS_LIGHT, "0"), self.px(120), tracking=0.02) \
            if self.number_kind == "big" else None
        self.num_shadow = shadow(self.number.mask, 9 * self.s) if self.number else None
        self.gap = int(size * 1.15)
        nh = self.number.h if self.number else 0
        self.block_h = nh + len(self.lines) * self.gap
        self.block_w = max([ln.w for ln in self.lines] + [self.number.w if self.number else 0])
        self.lx = int(self.w * (0.09 if self.left else 0.91))
        self.cy = int(self.h * (0.52 if v.random() < 0.6 else 0.62))
        self.grad = side_gradient(self.w, self.h, c.side, 0.75)
        bx = self.lx if self.left else self.lx - self.block_w - self.px(34)
        self.haze = haze(self.w, self.h, (bx, self.cy - self.block_h // 2, bx + self.block_w + self.px(40),
                                          self.cy + self.block_h // 2), 70 * self.s)
        self.dark = np.maximum(0.65 * self.grad, 0.75 * self.haze)

    def draw(self, frame, t):
        local, out = self.envelope(t)
        fade = 1 - ease_in_out(out)
        vis = ease_in_out(phase(local, 0.0, 0.6)) * fade
        if vis > 0.003:
            frame = darken(frame, self.dark, vis)
        items: list[tuple[Line, tuple, int, tuple, int]] = []
        top = self.cy - self.block_h // 2
        if self.number:
            items.append((self.number, self.num_shadow, top, self.accent, 0))
            top += self.number.h
        for li, (ln, sh) in enumerate(zip(self.lines, self.shades)):
            items.append((ln, sh, top + li * self.gap - self.px(6), WHITE, li + 1))
        thick = max(2, self.px(2.5))
        if self.horizontal:
            return self._draw_horizontal(frame, local, fade, items, thick)
        lh = int(self.block_h * 0.62 * ease_out(phase(local, 0.0, 0.7), 3))
        if lh > 0:
            blend(frame, np.ones((2 * lh, thick), np.float32), self.lx, self.cy - lh, self.accent, 0.9 * fade)
        gap = self.px(34)
        for k, (ln, sh, y, color, _) in enumerate(items):
            uk = ease_out(phase(local, 0.3 + 0.1 * k, 0.8), 4)
            shift = int((1 - uk) * self.px(160))
            if self.left:
                x = self.lx + gap - shift
                cut = max(0, self.lx + thick - x)  # columns hidden behind the line
                part, px = (ln.mask[:, cut:] if cut < ln.w else None), x + cut
            else:
                x = self.lx - gap - ln.w + shift
                cut = max(0, x + ln.w - self.lx)
                part, px = (ln.mask[:, :ln.w - cut] if cut < ln.w else None), x
            if part is None or part.shape[1] == 0:
                continue
            smask, pad = sh
            if self.left:
                blend(frame, smask[:, cut + pad:], px + 2, y - pad + 3, (0, 0, 0), 0.45 * uk * fade)
            else:
                blend(frame, smask[:, :smask.shape[1] - cut - pad], px - pad + 2, y - pad + 3, (0, 0, 0), 0.45 * uk * fade)
            blend(frame, part, px, y, color, min(1.0, uk * 1.4) * fade)
        return frame

    def _draw_horizontal(self, frame, local, fade, items, thick):
        """A rule grows along the top of the block; every line drops out from under it."""
        x0 = self.lx if self.left else self.lx - self.block_w
        top = self.cy - self.block_h // 2 - self.px(18)
        rw = int(self.block_w * ease_out(phase(local, 0.0, 0.7), 3))
        if rw > 0:
            blend(frame, np.ones((thick, rw), np.float32), x0 if self.left else x0 + self.block_w - rw, top,
                  self.accent, 0.9 * fade)
        for k, (ln, sh, y, color, _) in enumerate(items):
            uk = ease_out(phase(local, 0.3 + 0.12 * k, 0.8), 4)
            x = x0 if self.left else x0 + self.block_w - ln.w
            yy = int(y - (1 - uk) * (y - top + ln.h))
            cut = max(0, top + thick - yy)  # rows still above the rule are hidden
            if cut >= ln.h:
                continue
            smask, pad = sh
            blend(frame, smask[cut + pad:], x - pad + 2, yy + cut + 3, (0, 0, 0), 0.45 * uk * fade)
            blend(frame, ln.mask[cut:], x, yy + cut, color, min(1.0, uk * 1.4) * fade)
        return frame


# ====================================================================== clipping
_PAPERS = [(232.0, 236.0, 238.0), (200.0, 222.0, 234.0), (214.0, 220.0, 222.0), (226.0, 232.0, 240.0)]


class Clipping(Design):
    """A newspaper clipping with torn edges: a section line and a headline, tossed onto the frame."""

    default_color = "#B3262C"

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        v, c = self.v, self.c
        paper = v.choice(_PAPERS)
        self.entrance = v.choice(("slide", "drop", "pop"))
        serif = v.random() < 0.65
        band = v.random() < 0.35 and bool(c.kicker)   # the kicker on a coloured band at the top
        dots = v.random() < 0.5
        text = c.title if serif else c.title.upper()
        fp = title_font(self.font, "Bold" if serif else "Black", text, SERIF_BOLD if serif else SANS_BLACK)
        size, lines = fit_lines(text, fp, self.px(66 if serif else 58), self.w * 0.4)
        title = stack([text_line(ln, fp, size) for ln in lines], int(size * 1.08), "left")
        kick = c.kicker.upper()
        kf = resolve_font(SERIF if serif else SANS_SEMI, kick)
        kline = text_line(kick, kf, self.px(22), tracking=0.25) if kick else None
        margin, pad = self.px(14), self.px(34)
        head = (kline.h + self.px(18)) if kline else 0
        th, tw = title.shape
        w = max(tw, kline.w if kline else 0) + 2 * pad + 2 * margin
        h = th + head + 2 * pad + 2 * margin + (self.px(8) if band else 0)
        sh_pad = self.px(30)
        W, H = w + 2 * sh_pad, h + 2 * sh_pad
        sheet = np.zeros((H, W), np.float32)
        sheet[sh_pad:sh_pad + h, sh_pad:sh_pad + w] = torn_rect(w, h, self.rng, margin, rough=v.uniform(0.7, 1.2))
        tex = paper_texture(W, H, self.rng) * sheet
        drop = np.roll(np.roll(cv2.GaussianBlur(sheet, (0, 0), self.px(12)), self.px(10), 0), self.px(6), 1)
        layers: list[Layer] = [(drop, (0.0, 0.0, 0.0), 0.5), (sheet, paper, 1.0),
                               (tex, tuple(p * 0.78 for p in paper), 0.35)]
        if dots:
            layers.append((halftone(W, H, self.px(7), 0.25) * sheet, tuple(p * 0.6 for p in paper), 0.35))
        x0, y0 = sh_pad + margin + pad, sh_pad + margin + pad
        ink = np.zeros((H, W), np.float32)
        if kline is not None:
            if band:
                bandm = np.zeros((H, W), np.float32)
                bandm[sh_pad + margin:y0 + kline.h + self.px(6), sh_pad:sh_pad + w] = 1
                layers.append((bandm * sheet, self.accent, 1.0))
                kmask = np.zeros((H, W), np.float32)
                kmask[y0 - self.px(14):y0 - self.px(14) + kline.h, x0:x0 + kline.w] = kline.mask
                ky_end = y0 + kline.h + self.px(14)
            else:
                kmask = np.zeros((H, W), np.float32)
                kmask[y0:y0 + kline.h, x0:x0 + kline.w] = kline.mask
                rule_y = y0 + kline.h + self.px(4)
                ink[rule_y:rule_y + max(1, self.px(2)), x0:x0 + max(tw, kline.w)] = 1
                ky_end = y0 + head
            layers.append((kmask, WHITE if band else self.accent, 1.0))
        else:
            ky_end = y0
        ink[ky_end:ky_end + th, x0:x0 + tw] = np.maximum(ink[ky_end:ky_end + th, x0:x0 + tw], title)
        layers.append((ink * (0.9 + 0.1 * paper_texture(W, H, self.rng)), INK, 1.0))
        self.angle = self.rng.uniform(1.5, 4.0) * self.rng.choice((-1, 1))
        self.layers = layers
        self.rest, _, _ = transform(layers, self.angle)
        rw = self.rest[0][0].shape[1]
        self.x = int(self.w * 0.06) if self.left else int(self.w * 0.94 - rw)
        self.y = int(self.h * 0.5 - self.rest[0][0].shape[0] / 2)

    def draw(self, frame, t):
        local, out = self.envelope(t, 0.45)
        u = phase(local, 0.0, 0.65)
        gone = ease_in_out(out)
        if self.entrance == "pop" and u < 1:
            sc = 0.55 + 0.45 * ease_back(u, 2.2)
            layers, dx, dy = transform(self.layers, self.angle + 6 * (1 - ease_out(u)), max(0.05, sc))
            rh, rw = self.rest[0][0].shape
            lh, lw = layers[0][0].shape
            draw_layers(frame, layers, self.x + (rw - lw) // 2, self.y + (rh - lh) // 2, min(1.0, u * 3) * (1 - gone))
            return frame
        ox = oy = 0
        if self.entrance != "pop" and u < 1:
            e = ease_back(u, 1.4)
            if self.entrance == "slide":
                ox = int((1 - e) * (-1 if self.left else 1) * self.w * 0.45)
            else:  # drop from above
                oy = int((1 - e) * -self.h * 0.6)
        oy += int(gone * self.h * 0.08)
        draw_layers(frame, self.rest, self.x + ox, self.y + oy, 1 - gone)
        return frame


# ====================================================================== tape
class Tape(Design):
    """A coloured label stuck to the frame with strips of masking tape; it pops on with a little bounce."""

    default_color = "#E4572E"

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        v, c = self.v, self.c
        kind = v.choice(("accent", "accent", "white", "black")) if not self.custom_color else "accent"
        label, ink = {"accent": (self.accent, WHITE if luma(self.accent) < 170 else INK),
                      "white": ((240.0, 242.0, 244.0), INK), "black": ((26.0, 24.0, 24.0), WHITE)}[kind]
        upper = v.random() < 0.5
        self.two_tapes = v.random() < 0.5
        kicker_on_tape = v.random() < 0.5 and bool(c.kicker) and not self.two_tapes
        text = c.title.upper() if upper else c.title
        fp = title_font(self.font, "Black", text, SANS_BLACK)
        size, lines = fit_lines(text, fp, self.px(60 if upper else 66), self.w * 0.42)
        title = stack([text_line(ln, fp, size) for ln in lines], int(size * 1.05), "center")
        kick = c.kicker.upper()
        kline = text_line(kick, resolve_font(SANS_SEMI, kick), self.px(22), tracking=0.25) if kick else None
        th, tw = title.shape
        pad, margin = self.px(30), self.px(6)
        head = kline.h + self.px(8) if kline and not kicker_on_tape else 0
        w, h = tw + 2 * pad + 2 * margin, th + head + 2 * pad + 2 * margin
        room = self.px(60)
        W, H = w + 2 * room, h + 2 * room
        sheet = np.zeros((H, W), np.float32)
        sheet[room:room + h, room:room + w] = torn_rect(w, h, self.rng, margin, rough=0.25)
        drop = np.roll(cv2.GaussianBlur(sheet, (0, 0), self.px(10)), self.px(8), 0)
        layers: list[Layer] = [(drop, (0.0, 0.0, 0.0), 0.45), (sheet, label, 1.0),
                               (paper_texture(W, H, self.rng) * sheet, tuple(x * 0.85 for x in label), 0.25)]
        text_m = np.zeros((H, W), np.float32)
        x0, y0 = room + margin + pad, room + margin + pad
        if kline is not None and not kicker_on_tape:
            text_m[y0:y0 + kline.h, x0 + (tw - kline.w) // 2:x0 + (tw - kline.w) // 2 + kline.w] = kline.mask * 0.85
        text_m[y0 + head:y0 + head + th, x0:x0 + tw] = np.maximum(text_m[y0 + head:y0 + head + th, x0:x0 + tw], title)
        layers.append((text_m, ink, 1.0))
        # Tape strips: translucent, with zig-zag torn ends, a little crooked.
        tape_col = (205.0, 222.0, 230.0)
        tapes = np.zeros((H, W), np.float32)
        tape_ink = np.zeros((H, W), np.float32)
        spots = ([(room + self.px(10), room + self.px(4), 35), (room + w - self.px(10), room + self.px(4), -35)]
                 if self.two_tapes else [(room + w // 2, room + self.px(2), self.rng.uniform(-6, 6))])
        for cx, cy, ang in spots:
            tw_, th_ = (self.px(150), self.px(44)) if not kicker_on_tape else (max(self.px(170), kline.w + self.px(40)), self.px(48))
            strip = torn_rect(tw_ + self.px(8), th_ + self.px(8), self.rng, self.px(4), rough=0.4)
            km = np.zeros_like(strip)
            if kicker_on_tape:
                kx, ky = (strip.shape[1] - kline.w) // 2, (strip.shape[0] - kline.h) // 2
                km[ky:ky + kline.h, kx:kx + kline.w] = kline.mask
            rot, _, _ = transform([(strip, tape_col, 1.0), (km, INK, 1.0)], ang)
            rs, rk = rot[0][0], rot[1][0]
            sh_, sw_ = rs.shape
            ya, xa = int(cy - sh_ / 2), int(cx - sw_ / 2)
            ya0, xa0 = max(0, ya), max(0, xa)
            ya1, xa1 = min(H, ya + sh_), min(W, xa + sw_)
            tapes[ya0:ya1, xa0:xa1] = np.maximum(tapes[ya0:ya1, xa0:xa1], rs[ya0 - ya:ya1 - ya, xa0 - xa:xa1 - xa])
            tape_ink[ya0:ya1, xa0:xa1] = np.maximum(tape_ink[ya0:ya1, xa0:xa1], rk[ya0 - ya:ya1 - ya, xa0 - xa:xa1 - xa])
        layers += [(tapes, tape_col, 0.72), (tape_ink, INK, 0.9)]
        self.layers = layers
        self.angle = self.rng.uniform(-3.5, 3.5)
        self.rest, _, _ = transform(layers, self.angle)
        rh, rw = self.rest[0][0].shape
        self.x = int(self.w * 0.07) if self.left else int(self.w * 0.93 - rw)
        self.y = int(self.h * (0.5 if v.random() < 0.6 else 0.36) - rh / 2)

    def draw(self, frame, t):
        local, out = self.envelope(t, 0.4)
        u = phase(local, 0.05, 0.55)
        rh, rw = self.rest[0][0].shape
        if out > 0:
            e = ease_in_out(out)
            layers, _, _ = transform(self.layers, self.angle - 4 * e, max(0.05, 1 - 0.25 * e))
        elif u < 1:
            layers, _, _ = transform(self.layers, self.angle + 8 * (1 - ease_out(u)), max(0.05, 0.4 + 0.6 * ease_back(u, 2.6)))
        else:
            layers = self.rest
        lh, lw = layers[0][0].shape
        op = min(1.0, u * 4) * (1 - ease_in_out(out))
        draw_layers(frame, layers, self.x + (rw - lw) // 2, self.y + (rh - lh) // 2, op)
        return frame


# ====================================================================== typewriter
class Typewriter(Design):
    """The kicker and the title are typed letter by letter, with a cursor and uneven typewriter ink."""

    default_color = "#F4D35E"

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        v, c = self.v, self.c
        self.strip = v.random() < 0.5                # dark letters on paper strips instead of light ones
        self.block = v.random() < 0.5                # block cursor or a bar
        self.centered = v.random() < 0.3
        fp = title_font(self.font, "Bold", c.title, MONO)
        size, lines = fit_lines(c.title, fp, self.px(64), self.w * (0.62 if self.centered else 0.5))
        self.lines = [text_line(ln, fp, size) for ln in lines]
        kick = (c.kicker + ":") if c.kicker else ""
        self.kicker = text_line(kick.upper(), resolve_font(MONO, kick), self.px(28)) if kick else None
        self.gap = int(size * 1.35)
        rows = ([self.kicker] if self.kicker else []) + self.lines
        self.rows = rows
        self.total = sum(len(r.starts) - 1 for r in rows)
        # Uneven ink and slightly misaligned letters, fixed per letter.
        self.ink = [[self.rng.uniform(0.78, 1.0) for _ in r.starts] for r in rows]
        self.jit = [[self.rng.uniform(-1.4, 1.4) * self.s for _ in r.starts] for r in rows]
        self.block_w = max(r.w for r in rows)
        heights = [(self.px(46) if (self.kicker and i == 0) else self.gap) for i in range(len(rows))]
        self.ys = np.cumsum([0] + heights[:-1]).tolist()
        self.block_h = self.ys[-1] + rows[-1].h
        x = (self.w - self.block_w) // 2 if self.centered else (int(self.w * 0.08) if self.left
                                                                 else int(self.w * 0.92 - self.block_w))
        self.x, self.y = x, int(self.h * (0.5 if self.centered else 0.56) - self.block_h / 2)
        self.paper = (236.0, 238.0, 238.0)

    def row_x(self, row: Line) -> int:
        return (self.w - row.w) // 2 if self.centered else self.x

    def draw(self, frame, t):
        local, out = self.envelope(t, 0.45)
        fade = 1 - ease_in_out(out)
        vis = ease_in_out(phase(local, 0.0, 0.4)) * fade
        typing = max(0.8, self.c.duration * 0.45)
        typed = int(self.total * phase(local, 0.25, typing))
        done = 0
        for ri, row in enumerate(self.rows):
            n = len(row.starts) - 1
            shown = max(0, min(n, typed - done))
            done += n
            x = self.row_x(row)
            y = self.y + int(self.ys[ri])
            is_kicker = self.kicker is not None and ri == 0
            if shown:
                sw = row.starts[shown] if shown < n else row.w
                pad = self.px(10)
                if self.strip:
                    blend(frame, np.ones((row.h + pad, sw + 2 * pad), np.float32), x - pad, y - pad // 2,
                          self.accent if is_kicker else self.paper, 0.95 * fade)
                else:  # a soft shadow that grows with the typed text
                    soft = self.px(26)
                    box = np.zeros((row.h + 2 * soft, sw + 2 * soft + pad), np.float32)
                    box[soft:-soft, soft:-soft] = 1
                    blend(frame, cv2.GaussianBlur(box, (0, 0), soft / 2.2), x - soft - pad // 2, y - soft, (0, 0, 0),
                          0.7 * fade)
            color = (self.accent if not self.strip else INK) if is_kicker else (INK if self.strip else WHITE)
            if shown:
                draw_letters(frame, row, x, y, color, [self.ink[ri][i] * fade if i < shown else 0 for i in range(n)],
                             self.jit[ri][:n])
        # The cursor stands right after the last typed letter and blinks once the typing is done.
        ri, left = len(self.rows) - 1, typed
        for i, row in enumerate(self.rows):
            n = len(row.starts) - 1
            if left <= n:
                ri = i
                break
            left -= n
        row = self.rows[ri]
        n = len(row.starts) - 1
        left = min(left, n)
        if typed < self.total or int(local * 2.4) % 2 == 0:
            cx, cy = self.row_x(row) + (row.starts[left] if left < n else row.w), self.y + int(self.ys[ri])
            cw = int(row.h * 0.45) if self.block else max(2, self.px(4))
            blend(frame, np.ones((int(row.h * 0.72), cw), np.float32), cx + self.px(2), cy + int(row.h * 0.14),
                  INK if self.strip else self.accent, 0.85 * fade)
        return frame


# ====================================================================== frame
class Frame(Design):
    """A thin frame is drawn around the title stroke by stroke; the picture inside it dims."""

    default_color = "#F5F1E8"

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        v, c = self.v, self.c
        self.kind = v.choice(("box", "corners", "double"))
        self.centered = v.random() < 0.5
        self.gap_kicker = v.random() < 0.6 and bool(c.kicker)   # the kicker breaks the top line
        serif = v.random() < 0.5
        text = c.title if serif else c.title.upper()
        tr = 0.0 if serif else 0.08
        fp = title_font(self.font, "Regular" if serif else "Semibold", text, SERIF if serif else SANS_SEMI)
        size, lines = fit_lines(text, fp, self.px(64 if serif else 52), self.w * 0.5, tr)
        self.lines = [text_line(ln, fp, size, tr) for ln in lines]
        self.title = stack(self.lines, int(size * 1.12), "center")
        self.title_shadow = shadow(self.title, 8 * self.s)
        kick = c.kicker.upper()
        self.kicker = text_line(kick, resolve_font(SANS_SEMI, kick), self.px(22), tracking=0.4) if kick else None
        th, tw = self.title.shape
        pad = self.px(44)
        self.bw, self.bh = tw + 2 * pad, th + 2 * pad
        self.bx = (self.w - self.bw) // 2 if self.centered else (int(self.w * 0.08) if self.left
                                                                  else int(self.w * 0.92 - self.bw))
        self.by = int(self.h * 0.5 - self.bh / 2)
        self.tx, self.ty = self.bx + pad, self.by + pad
        self.haze = np.clip(haze(self.w, self.h, (self.bx, self.by, self.bx + self.bw, self.by + self.bh),
                                 40 * self.s) * 1.25, 0, 1)

    def _outline(self, p: float, inset: int = 0) -> np.ndarray:
        """The frame drawn up to ``p`` of its perimeter (clockwise from the top-left), as a mask."""
        w, h = self.bw - 2 * inset, self.bh - 2 * inset
        m = np.zeros((self.bh + 4, self.bw + 4), np.float32)
        th = max(1, self.px(2))
        x0, y0 = inset + 2, inset + 2
        pts = [(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h), (x0, y0)]
        if self.kind == "corners":
            arm = int(min(w, h) * 0.22 * p)
            for (cx, cy), (dx, dy) in zip(pts[:4], [(1, 1), (-1, 1), (-1, -1), (1, -1)]):
                if arm > 0:
                    cv2.line(m, (cx, cy), (cx + dx * arm, cy), 1.0, th, cv2.LINE_AA)
                    cv2.line(m, (cx, cy), (cx, cy + dy * arm), 1.0, th, cv2.LINE_AA)
            return m
        total = 2 * (w + h)
        left = p * total
        for a, b in zip(pts, pts[1:]):
            seg = math.dist(a, b)
            if left <= 0:
                break
            f = min(1.0, left / seg)
            cv2.line(m, a, (int(a[0] + (b[0] - a[0]) * f), int(a[1] + (b[1] - a[1]) * f)), 1.0, th, cv2.LINE_AA)
            left -= seg
        return m

    def draw(self, frame, t):
        local, out = self.envelope(t)
        fade = 1 - ease_in_out(out)
        vis = ease_in_out(phase(local, 0.0, 0.6)) * fade
        frame = darken(frame, self.haze, 0.72 * vis)
        p = ease_in_out(phase(local, 0.0, 1.0))
        outline = self._outline(p)
        if self.kind == "double":
            outline = np.maximum(outline, self._outline(ease_in_out(phase(local, 0.2, 1.0)), self.px(9)) * 0.6)
        k = self.kicker
        if k is not None and self.gap_kicker:  # cut the top line where the kicker sits
            kx = (self.bw - k.w) // 2
            outline[:self.px(8), max(0, kx - self.px(14)):kx + k.w + self.px(14)] = 0
        blend(frame, outline, self.bx - 2, self.by - 2, self.accent, 0.95 * fade)
        u = ease_out(phase(local, 0.4, 0.9))
        smask, pad = self.title_shadow
        blend(frame, smask, self.tx - pad + 2, self.ty - pad + 3, (0, 0, 0), 0.5 * u * fade)
        blend(frame, self.title, self.tx, self.ty + int(self.px(8) * (1 - u)), WHITE, u * fade)
        if k is not None:
            ku = ease_out(phase(local, 0.6, 0.7))
            if self.gap_kicker:
                kx, ky = self.bx + (self.bw - k.w) // 2, self.by - k.ascent // 2 - self.px(4)
            else:
                kx, ky = self.bx + (self.bw - k.w) // 2, self.by + self.bh + self.px(16)
            blend(frame, k.mask, kx, ky, self.accent, ku * fade)
        return frame


# ====================================================================== knockout
class Knockout(Design):
    """The picture goes dark except inside huge letters of the title: they are windows onto it."""

    default_color = "#F2C14E"

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        v, c = self.v, self.c
        self.tone = v.choice(("dark", "dark", "tint", "light"))
        self.outline = v.random() < 0.4
        text = c.title.upper()
        fp = title_font(self.font, "Black", text, SANS_BLACK)
        size, lines = fit_lines(text, fp, self.px(220), self.w * 0.86, -0.01)
        ls = [text_line(ln, fp, size, -0.01) for ln in lines]
        block = stack(ls, int(size * 0.98), "center")
        bh, bw = block.shape
        self.mask = np.zeros((self.h, self.w), np.float32)
        y0 = int(self.h * 0.52 - bh / 2)
        x0 = (self.w - bw) // 2
        ya, yb = max(0, y0), min(self.h, y0 + bh)
        xa, xb = max(0, x0), min(self.w, x0 + bw)
        self.mask[ya:yb, xa:xb] = block[ya - y0:yb - y0, xa - x0:xb - x0]
        edge = cv2.morphologyEx(self.mask, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
        self.edge = np.clip(cv2.dilate(edge, np.ones((max(2, self.px(3)),) * 2, np.uint8)), 0, 1)
        self.overlay = {"dark": (14.0, 14.0, 16.0), "light": (236.0, 238.0, 238.0),
                        "tint": tuple(x * 0.16 + 6 for x in self.accent)}[self.tone]
        self.overlay_img = np.empty((self.h, self.w, 3), np.uint8)
        self.overlay_img[:] = np.asarray(self.overlay, np.uint8)
        self.inv = 1 - self.mask
        kick = c.kicker.upper()
        self.kicker = text_line(kick, resolve_font(SANS_SEMI, kick), self.px(26), tracking=0.5) if kick else None
        self.kicker_y = max(self.px(30), y0 - self.px(60))
        self.kicker_color = INK if self.tone == "light" else self.accent

    def draw(self, frame, t):
        local, out = self.envelope(t, 0.6)
        fade = 1 - ease_in_out(out)
        u = phase(local, 0.0, 0.9)
        a = 0.86 * ease_in_out(u) * fade
        inv = self.inv
        if u < 1:  # the letters settle from a little bigger
            sc = 1 + 0.12 * (1 - ease_out(u, 3))
            m = cv2.getRotationMatrix2D((self.w / 2, self.h * 0.52), 0, sc)
            inv = 1 - cv2.warpAffine(self.mask, m, (self.w, self.h), flags=cv2.INTER_LINEAR)
        if a > 0.003:
            k = inv * np.float32(a)
            frame = cv2.blendLinear(frame, self.overlay_img, 1 - k, k)
        if self.outline and u >= 1:
            blend(frame, self.edge, 0, 0, self.accent, 0.8 * fade)
        if self.kicker is not None:
            ku = ease_out(phase(local, 0.5, 0.6))
            blend(frame, self.kicker.mask, (self.w - self.kicker.w) // 2, self.kicker_y, self.kicker_color, ku * fade)
        return frame


DESIGNS: dict[str, type[Design]] = {
    "cinema": Cinema, "editorial": Editorial, "brush": Brush, "minimal": Minimal, "clipping": Clipping,
    "tape": Tape, "typewriter": Typewriter, "frame": Frame, "knockout": Knockout,
}
