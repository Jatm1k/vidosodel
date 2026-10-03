"""Cutting a timed script into scenes (one image per scene).

Two strategies share the same building blocks:

* **auto** – dynamic programming over sentence units. Minimises the deviation
  from a target duration, rewards cuts at paragraph ends and long pauses and
  heavily penalises leaving the ``[min, max]`` bounds. Free and instant.
* **smart** – the LLM groups consecutive sentences by meaning (a new image
  when the subject/visual changes). Its answer is validated and repaired with
  the DP so the bounds always hold.

The first ``intro_seconds`` use shorter bounds: fast cuts help retention.
"""
from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass

from ..settings_schema import LlmSettings, SceneSettings
from .timings import Sentence, Timings, sentences

log = logging.getLogger(__name__)


@dataclass(slots=True)
class SceneSpec:
    start: float
    end: float
    text: str
    first_word: int
    last_word: int


def _bounds(cfg: SceneSettings, t: float) -> tuple[float, float]:
    if t < cfg.intro_seconds:
        return cfg.intro_min_duration, cfg.intro_max_duration
    return cfg.min_duration, cfg.max_duration


def _unit_start(units: list[Sentence], i: int) -> float:
    return 0.0 if i == 0 else units[i].start


def _group_end(units: list[Sentence], i: int, total: float) -> float:
    """End time of a group whose last unit is ``i - 1``."""
    return total if i >= len(units) else units[i].start


def _cost(units: list[Sentence], j: int, i: int, total: float, cfg: SceneSettings) -> float:
    start = _unit_start(units, j)
    dur = _group_end(units, i, total) - start
    lo, hi = _bounds(cfg, start)
    target = (lo + hi) / 2
    cost = ((dur - target) / target) ** 2
    if dur > hi:
        cost += 10 + 50 * ((dur - hi) / hi) ** 2
    elif dur < lo:
        cost += 4 + 30 * ((lo - dur) / lo) ** 2
    last = units[i - 1]
    if i < len(units) and units[i].paragraph != last.paragraph:
        cost -= 0.35  # cutting on a paragraph boundary is natural
    cost -= min(last.pause_after, 1.2) * 0.25
    return cost


def _dp(units: list[Sentence], total: float, cfg: SceneSettings, lo_idx: int = 0, hi_idx: int | None = None) -> list[tuple[int, int]]:
    """Optimal grouping of ``units[lo_idx:hi_idx]`` → list of ``(first, last_exclusive)``."""
    hi_idx = len(units) if hi_idx is None else hi_idx
    n = hi_idx - lo_idx
    if n <= 0:
        return []
    best = [0.0] + [float("inf")] * n
    back = [0] * (n + 1)
    for i in range(1, n + 1):
        gi = lo_idx + i
        for j in range(i - 1, -1, -1):
            gj = lo_idx + j
            start = _unit_start(units, gj)
            dur = _group_end(units, gi, total) - start
            _, hi = _bounds(cfg, start)
            if dur > hi * 2.5 and j < i - 1:
                break  # groups only get longer from here
            c = best[j] + _cost(units, gj, gi, total, cfg)
            if c < best[i]:
                best[i], back[i] = c, j
    groups: list[tuple[int, int]] = []
    i = n
    while i > 0:
        j = back[i]
        groups.append((lo_idx + j, lo_idx + i))
        i = j
    return groups[::-1]


def _to_specs(units: list[Sentence], groups: list[tuple[int, int]], total: float) -> list[SceneSpec]:
    specs: list[SceneSpec] = []
    for a, b in groups:
        specs.append(SceneSpec(
            start=_unit_start(units, a),
            end=_group_end(units, b, total),
            text=" ".join(u.text for u in units[a:b]),
            first_word=units[a].first,
            last_word=units[b - 1].last,
        ))
    return specs


def _units(timings: Timings, cfg: SceneSettings) -> list[Sentence]:
    return sentences(timings, max_unit=max(cfg.intro_max_duration, cfg.max_duration * 0.9))


def split_auto(timings: Timings, cfg: SceneSettings) -> list[SceneSpec]:
    units = _units(timings, cfg)
    if not units:
        return []
    return _to_specs(units, _dp(units, timings.duration, cfg), timings.duration)


# ----------------------------------------------------------------------------- smart
_SPLIT_SYSTEM = """Ты — режиссёр монтажа документальных YouTube-видео. Видео — это закадровый голос и \
последовательность картинок. Твоя задача: разбить пронумерованные фрагменты текста на СЦЕНЫ. \
Каждая сцена — это одна картинка на экране.

Правила:
- Сцена = последовательный диапазон фрагментов [first_id, last_id] включительно, без пропусков и пересечений.
- Новая сцена начинается там, где меняется то, что зритель должен УВИДЕТЬ: новый объект, место, действие, \
персонаж, время, мысль.
- Длительность сцены (сумма dur её фрагментов) должна быть в пределах, указанных у каждого фрагмента \
(min..max секунд). Старайся держаться ближе к середине диапазона.
- Не объединяй разные по смыслу мысли ради длины, лучше разбей.
Ответ — ТОЛЬКО JSON вида {"scenes": [[first_id, last_id], ...]}"""


def split_smart(
    timings: Timings, cfg: SceneSettings, llm: LlmSettings, chat_json: Callable[..., object],
    progress: Callable[[float], None] | None = None, batch_size: int = 220,
) -> list[SceneSpec]:
    """LLM-assisted split. ``chat_json(messages, model=..., temperature=...)`` returns parsed JSON."""
    units = _units(timings, cfg)
    if not units:
        return []
    total = timings.duration
    groups: list[tuple[int, int]] = []
    pos = 0
    while pos < len(units):
        end = min(len(units), pos + batch_size)
        lines = []
        for k in range(pos, end):
            lo, hi = _bounds(cfg, units[k].start)
            dur = _group_end(units, k + 1, total) - _unit_start(units, k)
            lines.append(f"{k}. (dur={dur:.1f}s, сцена {lo:g}..{hi:g}s) {units[k].text}")
        niche = f"Тематика канала: {llm.niche}\n\n" if llm.niche else ""
        try:
            data = chat_json(
                [{"role": "system", "content": _SPLIT_SYSTEM},
                 {"role": "user", "content": niche + "Фрагменты:\n" + "\n".join(lines)}],
                model=llm.model, temperature=0.2,
            )
            batch = _validate(data, pos, end)
        except Exception as exc:  # noqa: BLE001 – any LLM problem falls back to DP
            log.warning("smart split failed for units %d..%d: %s – using auto", pos, end, exc)
            batch = None
        if batch is None:
            batch = _dp(units, total, cfg, pos, end)
        # Keep the last group for the next batch so it can be completed with context,
        # unless this is the final batch.
        if end < len(units) and len(batch) > 1:
            batch = batch[:-1]
        groups.extend(batch)
        pos = batch[-1][1]
        if progress:
            progress(pos / len(units))
    return _to_specs(units, _repair(units, groups, total, cfg), total)


def _validate(data: object, pos: int, end: int) -> list[tuple[int, int]] | None:
    """Convert the LLM answer to ``(first, last_exclusive)`` and check contiguity."""
    raw = data.get("scenes") if isinstance(data, dict) else data
    if not isinstance(raw, list) or not raw:
        return None
    out: list[tuple[int, int]] = []
    expected = pos
    for item in raw:
        try:
            a, b = int(item[0]), int(item[-1])
        except (TypeError, ValueError, IndexError):
            return None
        if a != expected or b < a or b >= end:
            return None
        out.append((a, b + 1))
        expected = b + 1
    return out if expected == end else None


def _repair(units: list[Sentence], groups: list[tuple[int, int]], total: float, cfg: SceneSettings) -> list[tuple[int, int]]:
    """Re-split groups that exceed the max bound; merge groups far below the min bound."""
    fixed: list[tuple[int, int]] = []
    for a, b in groups:
        start = _unit_start(units, a)
        dur = _group_end(units, b, total) - start
        _, hi = _bounds(cfg, start)
        if dur > hi * 1.15 and b - a > 1:
            fixed.extend(_dp(units, total, cfg, a, b))
        else:
            fixed.append((a, b))
    merged: list[tuple[int, int]] = []
    for a, b in fixed:
        start = _unit_start(units, a)
        dur = _group_end(units, b, total) - start
        lo, hi = _bounds(cfg, start)
        if merged and dur < lo * 0.5:
            pa, _ = merged[-1]
            if _group_end(units, b, total) - _unit_start(units, pa) <= hi * 1.15:
                merged[-1] = (pa, b)
                continue
        merged.append((a, b))
    return merged


def estimate_scene_count(duration: float, cfg: SceneSettings) -> int:
    """Rough number of scenes for cost estimates before splitting."""
    intro = min(duration, cfg.intro_seconds)
    rest = max(0.0, duration - intro)
    return int(round(intro / ((cfg.intro_min_duration + cfg.intro_max_duration) / 2)
                     + rest / ((cfg.min_duration + cfg.max_duration) / 2)))
