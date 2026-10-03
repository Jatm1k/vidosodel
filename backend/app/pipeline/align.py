"""Mapping scenes of the master language onto another language track.

In ``shared`` image mode only the master track generates images; other
languages reuse them. Because speech length differs between languages, each
master scene boundary is mapped by *text position* rather than by time:

1. boundary time → word in the master timings → (paragraph, relative char offset);
2. same paragraph in the target (translations keep paragraph count), same
   relative offset → target word, snapped to the nearest sentence start;
3. that word's start time is the boundary in the target track.

If paragraph counts differ, a global relative char offset is used instead.
"""
from __future__ import annotations

import bisect
from dataclasses import dataclass

from .text import ends_sentence
from .timings import Timings

MIN_SCENE = 1.2


@dataclass(slots=True)
class AlignedScene:
    start: float
    end: float
    text: str
    source_scene_id: int


def _char_positions(t: Timings) -> list[int]:
    """Cumulative character offset of each word."""
    pos, acc = [], 0
    for w in t.words:
        pos.append(acc)
        acc += len(w.w) + 1
    return pos


def _paragraph_spans(t: Timings) -> dict[int, tuple[int, int]]:
    spans: dict[int, tuple[int, int]] = {}
    for i, w in enumerate(t.words):
        a, _ = spans.get(w.p, (i, i))
        spans[w.p] = (a, i)
    return spans


def align_scenes(master: Timings, master_scenes: list[tuple[int, float, float]], target: Timings) -> list[AlignedScene]:
    """``master_scenes`` – ``(scene_id, start, end)`` sorted by time."""
    if not master.words or not target.words or not master_scenes:
        return []
    m_pos, t_pos = _char_positions(master), _char_positions(target)
    m_total = m_pos[-1] + len(master.words[-1].w)
    t_total = t_pos[-1] + len(target.words[-1].w)
    m_par, t_par = _paragraph_spans(master), _paragraph_spans(target)
    same_paragraphs = len(m_par) == len(t_par) and len(m_par) > 1 and -1 not in m_par
    m_starts = [w.s for w in master.words]
    sentence_starts = [0] + [i + 1 for i, w in enumerate(target.words[:-1]) if ends_sentence(w.w)]

    def map_boundary(time: float) -> int:
        wi = min(bisect.bisect_left(m_starts, time - 1e-3), len(master.words) - 1)
        if same_paragraphs:
            p = master.words[wi].p
            ma, mb = m_par[p]
            span_m = (m_pos[mb] + len(master.words[mb].w)) - m_pos[ma] or 1
            frac = (m_pos[wi] - m_pos[ma]) / span_m
            ta, tb = t_par.get(p, (0, len(target.words) - 1))
            goal = t_pos[ta] + frac * ((t_pos[tb] + len(target.words[tb].w)) - t_pos[ta])
            lo, hi = ta, tb
        else:
            goal = m_pos[wi] / m_total * t_total
            lo, hi = 0, len(target.words) - 1
        ti = min(max(bisect.bisect_left(t_pos, goal), lo), hi)
        # Snap to the nearest sentence start inside the allowed span when it is close.
        k = bisect.bisect_left(sentence_starts, ti)
        candidates = [s for s in sentence_starts[max(0, k - 1):k + 1] if lo <= s <= hi]
        if candidates:
            best = min(candidates, key=lambda s: abs(t_pos[s] - goal))
            if abs(t_pos[best] - goal) < 120:  # within ~2 short sentences
                ti = best
        return ti

    boundaries = [0] + [map_boundary(start) for _, start, _ in master_scenes[1:]]
    out: list[AlignedScene] = []
    for k, (scene_id, _, _) in enumerate(master_scenes):
        wi = boundaries[k]
        start = 0.0 if k == 0 else target.words[wi].s
        if out and start - out[-1].start < MIN_SCENE:
            continue  # collapsed boundary: previous scene absorbs this one
        if out:
            out[-1].end = start
        out.append(AlignedScene(start, target.duration, "", scene_id))
    # Fill texts from word ranges.
    starts = [w.s for w in target.words]
    for sc in out:
        a = bisect.bisect_left(starts, sc.start - 1e-3)
        b = bisect.bisect_left(starts, sc.end - 1e-3)
        sc.text = " ".join(w.w for w in target.words[a:b])
    return out
