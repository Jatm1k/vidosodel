"""Chapters of a video: where they start, their YouTube titles and short titles for the screen.

Chapters may only start where a paragraph of the voice-over starts (or every ~45 s when the script has no
paragraphs). The LLM picks the starts and writes two titles for each: the YouTube chapter title for the
description and a short one for the chapter card in the video. Both use the same list, cached on the
track (``Track.chapters``), so the card on screen and the time code in the description always agree –
whichever of the render and the metadata step runs first.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
from typing import Any

from ..services.fastgen import FastgenClient
from ..settings_schema import LlmSettings
from .languages import language_name
from .llm_tasks import _niche
from .timings import Timings

log = logging.getLogger(__name__)

#: Longest short title shown on a chapter card.
CARD_MAX = 40


def candidates(timings: Timings | None) -> list[tuple[float, str]]:
    """Possible chapter starts: ``(seconds, the words that follow)``; the first one is at 0."""
    out: list[tuple[float, str]] = []
    if not timings or not timings.words:
        return out
    words = timings.words
    seen: set[int] = set()
    for i, w in enumerate(words):
        if w.p not in seen and w.p >= 0:
            seen.add(w.p)
            out.append((0.0 if not out else w.s, " ".join(x.w for x in words[i:i + 25])))
    if len(out) < 4:  # no paragraphs – candidates every ~45 s
        out, last = [], -999.0
        for i, w in enumerate(words):
            if w.s - last >= 45:
                out.append((0.0 if not out else w.s, " ".join(x.w for x in words[i:i + 25])))
                last = w.s
    return out


def cache_key(script: str, cands: list[tuple[float, str]]) -> str:
    """Changes when the script or the timing of the paragraphs changes (a new voice-over)."""
    raw = json.dumps([script.strip(), [int(t) for t, _ in cands]], ensure_ascii=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def cached(track_chapters: dict[str, Any] | None, key: str) -> list[dict[str, Any]] | None:
    """Chapters cached on the track for this script and voice-over, else None."""
    c = track_chapters or {}
    return list(c.get("items") or []) if c.get("key") == key and c.get("items") else None


def _clean(text: Any, limit: int) -> str:
    t = re.sub(r"\s+", " ", str(text or "")).strip().strip("«»\"'").rstrip(".")
    return t[:limit].rstrip()


_SYSTEM = """You split a narrated YouTube video into chapters. Write in {language} only.
Answer ONLY with JSON: {{"chapters": [{{"t": 0, "title": "...", "card": "..."}}]}}
- t: a chapter start, ONLY from the candidate list (use its seconds exactly); the first chapter is 0.
- title: the YouTube chapter title in the description, up to 60 characters, says what is in the chapter.
- card: the title shown big on screen when the chapter starts, 2–5 words, up to {card_max} characters. \
It makes the viewer want to watch on: a sharp question, a turn, a promise or a bold claim taken from the \
chapter – never generic words like «Introduction», «Conclusion», «Part two», no numbering, no final period."""


def make_chapters(fg: FastgenClient, cands: list[tuple[float, str]], language: str, llm: LlmSettings,
                  existing: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    """``[{"t", "title", "card"}]`` sorted by ``t``, the first at 0.

    ``existing``: chapters already chosen (e.g. by the metadata step) – kept as they are, only the
    short ``card`` titles are written for them.
    """
    name = language_name(language)
    system = _SYSTEM.format(language=name, card_max=CARD_MAX)
    lines = "\n".join(f"{int(t)}s: {text[:200]}" for t, text in cands)
    if existing:
        keep = "\n".join(f"{int(c['t'])}s: {c.get('title', '')}" for c in existing)
        user = (f"{_niche(llm)}Keep EXACTLY these chapters (same t and title), write a card for each:\n{keep}\n\n"
                f"WHAT IS SAID AT EVERY CANDIDATE START:\n{lines}")
    else:
        count = max(3, min(10, round(cands[-1][0] / 90) + 2)) if cands else 5
        user = (f"{_niche(llm)}Pick about {count} chapters (5–10 for a long video, fewer for a short one).\n\n"
                f"CANDIDATES (seconds: what is said from there):\n{lines}")
    data = fg.chat_json([{"role": "system", "content": system}, {"role": "user", "content": user}],
                        model=llm.model, temperature=0.6)
    valid = {int(t) for t, _ in cands} | {0}
    given = {int(c["t"]): c for c in existing or []}
    out: dict[int, dict[str, Any]] = {}
    for ch in (data.get("chapters") if isinstance(data, dict) else None) or []:
        try:
            t = int(ch["t"])
        except (KeyError, TypeError, ValueError):
            continue
        if t not in valid or (given and t not in given):
            continue
        title = given[t]["title"] if t in given else _clean(ch.get("title"), 80)
        card = _clean(ch.get("card"), CARD_MAX) or None
        if title or card:
            out[t] = {"t": t, "title": title or card, "card": card}
    for t, c in given.items():  # the LLM skipped one: keep it, the card falls back to its title
        out.setdefault(t, {"t": t, "title": c.get("title", ""), "card": None})
    items = sorted(out.values(), key=lambda c: c["t"])
    if items and items[0]["t"] != 0:
        items[0]["t"] = 0
    return items
