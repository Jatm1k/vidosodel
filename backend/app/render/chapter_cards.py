"""Chapter title cards: an animated title over the picture when a new chapter of the video starts.

The narration never stops, so a card is an overlay of a few seconds on top of the running scene, not a
separate slate. Every design also treats the picture under it (darkening, blur, letterbox, a gradient on
the free side) so the title belongs to the frame instead of floating on it. The designs live in
:mod:`.card_designs`, the drawing toolkit in :mod:`.card_kit`.

Variety comes on three levels: the design (``auto`` picks one per video from the channel's pool), the
variant of the design (layout, typeface, palette, entrance – from the video's seed, the same for all of
its chapters) and per-chapter details (tilt, stroke shape, side away from the hero). Sprites are drawn
once per worker with Pillow; a frame only blends a few regions, so cards cost next to nothing outside
their few seconds.
"""
from __future__ import annotations

import random
from dataclasses import asdict

import numpy as np

from .card_designs import DESIGNS, Design
from .card_kit import Card, kicker_text

__all__ = ["STYLES", "Card", "CardRenderer", "build_cards", "kicker_text", "pick_style", "to_plan"]

STYLES = tuple(DESIGNS)


def pick_style(style: str, seed: int, pool: list[str] | None = None) -> str:
    """The design of a video: the chosen one, or (``auto``) one of ``pool`` picked by the render seed."""
    if style in STYLES:
        return style
    choices = [s for s in (pool or []) if s in STYLES] or list(STYLES)
    return random.Random(seed * 7 + 3).choice(choices)


class CardRenderer:
    """Draws the chapter cards of a plan (one per worker; a design is built when its card first shows)."""

    def __init__(self, cards: list[dict], style: str, width: int, height: int, color: str = "", font: str = "",
                 variant: int = 0):
        self.cards = [Card(**c) for c in cards]
        self.style = style if style in DESIGNS else "cinema"
        self.width, self.height = width, height
        self.color, self.font, self.variant = color, font, variant
        self._built: dict[int, Design] = {}

    def apply(self, frame: np.ndarray, t: float) -> np.ndarray:
        for k, card in enumerate(self.cards):
            if card.start <= t < card.start + card.duration:
                design = self._built.get(k)
                if design is None:
                    design = DESIGNS[self.style](card, self.width, self.height, self.color, self.font, self.variant)
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
