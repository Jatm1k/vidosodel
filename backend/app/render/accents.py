"""Key phrases on screen: LLM picks are pinned to the voice-over timeline.

The LLM returns a quote of the script for every accent; the quote is found in
the word timings, and the text appears when the narrator starts saying it.
Only quotes are cached (see ``Track.text_accents``), so timings may change –
after a new voice-over the accents land at the right moments again.
"""
from __future__ import annotations

import json
import logging
import re
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

from ..pipeline.timings import Word

if TYPE_CHECKING:
    from .engine import RenderPlan

log = logging.getLogger(__name__)

#: No accent in the first seconds (the hook belongs to the narrator) and none too close together.
FIRST_AT = 3.0
MIN_GAP = 6.0
MIN_SHOW, MAX_SHOW = 2.2, 4.0


@dataclass(slots=True)
class Accent:
    text: str
    start: float
    end: float
    #: Horizontal centre of the text as a share of the width; ``None`` → centre of the frame.
    x: float | None = None


def _norm(word: str) -> str:
    return re.sub(r"[^\w%$€₽]", "", word.lower().replace("ё", "е"))


def _find(tokens: list[str], quote: list[str]) -> int | None:
    k = len(quote)
    for i in range(len(tokens) - k + 1):
        if tokens[i:i + k] == quote:
            return i
    return None


def place(items: Sequence[dict], words: Sequence[Word], duration: float) -> list[Accent]:
    """Timed accents for ``[{"quote", "text"}]``; quotes that are not in the timings are dropped."""
    tokens = [_norm(w.w) for w in words]
    found: list[tuple[int, int, str]] = []
    for it in items:
        quote = [t for t in (_norm(x) for x in str(it.get("quote", "")).split()) if t]
        if not quote:
            continue
        i = _find(tokens, quote)
        k = len(quote)
        if i is None and len(quote) > 3:  # the LLM changed a word form at the end: anchor on the beginning
            k = 3
            i = _find(tokens, quote[:3])
        if i is not None:
            found.append((i, i + k - 1, str(it["text"])))
    found.sort()
    out: list[Accent] = []
    for first, last, text in found:
        start = words[first].s
        if start < FIRST_AT or (out and start < out[-1].start + MIN_GAP):
            continue
        end = min(max(start + MIN_SHOW, words[last].e + 0.6), start + MAX_SHOW, duration - 0.5)
        if end - start >= 1.0:
            out.append(Accent(text, start, end))
    return out


def avoid_subject(accents: list[Accent], plan: RenderPlan) -> None:
    """Put every accent on the side of the frame away from the hero of its scene (in place)."""
    from . import depth as depth_mod

    subjects: dict[str, dict | None] = {}
    for k, a in enumerate(accents):
        scene = next((s for s in reversed(plan.scenes) if s.start <= a.start), None)
        if scene is None:
            continue
        if scene.image not in subjects:
            _, meta = depth_mod.cache_paths(Path(scene.image))
            try:
                subjects[scene.image] = (json.loads(meta.read_text(encoding="utf-8")) if meta.exists()
                                         else depth_mod.face_subject(Path(scene.image)))
            except Exception as e:  # noqa: BLE001 – placement is cosmetic
                log.warning("subject of %s: %s", scene.image, e)
                subjects[scene.image] = None
        subj = subjects[scene.image]
        cx = subj["cx"] if subj else 0.5
        # A hero in the middle leaves both sides free: alternate them for rhythm.
        left = cx > 0.55 or (cx >= 0.45 and k % 2 == 0)
        a.x = 0.27 if left else 0.73
