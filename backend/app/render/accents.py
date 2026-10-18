"""Key phrases on screen: what the narrator says that deserves emphasis, pinned to the voice-over.

The LLM picks the moments (numbers, names, quotations, terms, strong statements) and returns for each the
quote where it is said and the on-screen text – the narrator's own words, a part of that quote. The quote
is found in the word timings and every on-screen word gets the time the narrator says it, so the text is
built up in sync with the voice (see :mod:`.accent_fx` for how it is drawn). Only quotes are cached (see
``Track.text_accents``), so timings may change – after a new voice-over the accents land right again.
"""
from __future__ import annotations

import json
import logging
import re
from collections.abc import Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

from ..pipeline.timings import Word

if TYPE_CHECKING:
    from .engine import RenderPlan

log = logging.getLogger(__name__)

KINDS = ("number", "name", "quote", "term", "statement")

#: No accent in the first seconds (the hook belongs to the narrator), and a pause between accents.
FIRST_AT = 3.0
MIN_PAUSE = 2.5
MIN_SHOW = 2.2
#: How long the text stays after its last word is said, and the longest an accent may last.
HOLD = 1.3
MAX_SHOW = {"quote": 9.0, "statement": 5.0}
MAX_SHOW_DEFAULT = 4.5


@dataclass(slots=True)
class Accent:
    text: str
    start: float
    end: float
    #: Horizontal centre of the text as a share of the width; ``None`` → centre of the frame.
    x: float | None = None
    kind: str = "statement"
    #: A few words of the narrator that explain it (who said the quote, who the person is).
    sub: str = ""
    #: When each word of ``text`` is said (absolute seconds); empty – the text appears at once.
    times: list[float] = field(default_factory=list)
    #: Animation style, see :mod:`.accent_fx`.
    style: str = ""


def norm(word: str) -> str:
    return re.sub(r"[^\w%$€₽]", "", word.lower().replace("ё", "е"))


def _find(tokens: list[str], quote: list[str], lo: int = 0, hi: int | None = None) -> int | None:
    k = len(quote)
    hi = len(tokens) if hi is None else min(hi, len(tokens))
    for i in range(max(0, lo), hi - k + 1):
        if tokens[i:i + k] == quote:
            return i
    return None


def _word_times(text: str, tokens: list[str], words: Sequence[Word], lo: int, hi: int) -> tuple[list[float], float] | None:
    """Times of the words of ``text`` found as consecutive words in ``tokens[lo:hi]``, and when the last ends.

    ``tokens``/``words`` hold spoken words only (no dashes), see :func:`place`.
    """
    keys = [norm(w) for w in text.split()]
    wanted = [k for k in keys if k]
    if not wanted:
        return None
    i = _find(tokens, wanted, lo, hi)
    if i is None:
        return None
    times, j = [], i
    for k in keys:
        if k:
            times.append(words[j].s)
            j += 1
        else:  # a dash or a sign between words: shows with the word before it
            times.append(times[-1] if times else words[i].s)
    return times, words[i + len(wanted) - 1].e


def place(items: Sequence[dict], words: Sequence[Word], duration: float) -> list[Accent]:
    """Timed accents for ``[{"kind", "quote", "text", "sub"}]``; quotes not found in the timings are dropped."""
    # Dashes and other signs are separate "words" in the timings: leave them out, so phrases match word by word.
    words = [w for w in words if norm(w.w)]
    tokens = [norm(w.w) for w in words]
    found: list[tuple[float, Accent, float]] = []
    for it in items:
        quote = [t for t in (norm(x) for x in str(it.get("quote", "")).split()) if t]
        text = str(it.get("text") or "").strip()
        if not quote or not text:
            continue
        i = _find(tokens, quote)
        k = len(quote)
        if i is None and len(quote) > 3:  # the LLM changed a word form at the end: anchor on the beginning
            k = 3
            i = _find(tokens, quote[:3])
        if i is None:
            continue
        kind = it.get("kind") if it.get("kind") in KINDS else "statement"
        hit = _word_times(text, tokens, words, i - 3, i + k + 8)
        if hit:
            times, said_end = hit
        else:  # e.g. «73%» on screen for «семьдесят три процента»: show it when the quote starts
            times, said_end = [], words[min(len(words) - 1, i + k - 1)].e
        start = max(0.0, (times[0] if times else words[i].s) - 0.12)
        # Long enough for the last word to be said and read, but not lingering.
        limit = max(MAX_SHOW.get(kind, MAX_SHOW_DEFAULT), min(said_end - start + 0.8, MAX_SHOW["quote"]))
        end = min(max(start + MIN_SHOW, said_end + HOLD), start + limit, duration - 0.5)
        found.append((start, Accent(text, start, end, kind=kind, sub=str(it.get("sub") or "").strip(),
                                    times=times), end))
    found.sort(key=lambda f: f[0])
    out: list[Accent] = []
    for start, a, end in found:
        if start < FIRST_AT or end - start < 1.0 or (out and start < out[-1].end + MIN_PAUSE):
            continue
        out.append(a)
    return out


def subject_at(plan: RenderPlan, t: float, cache: dict[str, dict | None]) -> dict | None:
    """Where the hero of the scene shown at ``t`` is (``{"cx", "cy", ...}``), None when unknown."""
    from . import depth as depth_mod

    scene = next((s for s in reversed(plan.scenes) if s.start <= t), None)
    if scene is None:
        return None
    if scene.image not in cache:
        _, meta = depth_mod.cache_paths(Path(scene.image))
        try:
            cache[scene.image] = (json.loads(meta.read_text(encoding="utf-8")) if meta.exists()
                                  else depth_mod.face_subject(Path(scene.image)))
        except Exception as e:  # noqa: BLE001 – placement is cosmetic
            log.warning("subject of %s: %s", scene.image, e)
            cache[scene.image] = None
    return cache[scene.image]


def avoid_subject(accents: list[Accent], plan: RenderPlan) -> None:
    """Put every accent on the side of the frame away from the hero of its scene (in place)."""
    subjects: dict[str, dict | None] = {}
    for k, a in enumerate(accents):
        subj = subject_at(plan, a.start, subjects)
        cx = subj["cx"] if subj else 0.5
        # A hero in the middle leaves both sides free: alternate them for rhythm.
        left = cx > 0.55 or (cx >= 0.45 and k % 2 == 0)
        a.x = 0.27 if left else 0.73
