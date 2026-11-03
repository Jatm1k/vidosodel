"""What a track keeps of its motion graphics, and the render document made of it.

``Track.motion``::

    {"v": 1, "mode": "mixed", "style": {"base": "neon", ...overrides}, "planning": false,
     "key": "<scene timeline hash>", "updated": 1730000000.0,
     "items": [
       {"id": "s12", "kind": "scene", "slots": [12, 13], "note": "…", "bg": …, "cam": […], "els": […]},
       {"id": "o3", "kind": "overlay", "start": 81.4, "end": 86.0, "note": "…", "shade": "left", "els": […]},
     ]}

A scene item replaces the pictures of its scene slots (consecutive scene indices) with one full-screen motion
scene; element times are seconds from the start of the item. Phrase anchors (``"at": "@3 миллиона"``) are resolved
to times when an item is submitted, so the stored items hold plain numbers.
"""
from __future__ import annotations

import hashlib
import re
from collections.abc import Sequence
from typing import Any

from ..pipeline.timings import Word

VERSION = 1
TIME_KEYS = {"at", "until", "t"}


def data(motion: dict[str, Any] | None) -> dict[str, Any]:
    return motion if isinstance(motion, dict) else {}


def items(motion: dict[str, Any] | None) -> list[dict[str, Any]]:
    return [it for it in data(motion).get("items") or [] if isinstance(it, dict)]


def scene_items(motion: dict[str, Any] | None) -> list[dict[str, Any]]:
    return [it for it in items(motion) if it.get("kind") == "scene" and it.get("slots")]


def overlay_items(motion: dict[str, Any] | None) -> list[dict[str, Any]]:
    return [it for it in items(motion) if it.get("kind") == "overlay"]


def slot_owner(motion: dict[str, Any] | None) -> dict[int, str]:
    """Scene index → id of the motion scene that replaces its picture."""
    out: dict[int, str] = {}
    for it in scene_items(motion):
        for idx in it["slots"]:
            out[int(idx)] = it["id"]
    for idx in data(motion).get("plan_slots") or []:  # planned, not written yet: no picture either
        out.setdefault(int(idx), "")
    return out


def motion_scene_idxs(motion: dict[str, Any] | None) -> set[int]:
    return set(slot_owner(motion))


def planning(motion: dict[str, Any] | None) -> bool:
    return bool(data(motion).get("planning"))


def timeline_key(scenes: Sequence[Any]) -> str:
    """Changes when the scenes are re-cut or re-timed (the graphics are then out of step)."""
    raw = ";".join(f"{s.idx}:{s.start:.2f}" for s in scenes)
    return hashlib.sha1(raw.encode()).hexdigest()[:12]


def span(scenes: Sequence[Any], slots: Sequence[int], duration: float) -> tuple[float, float]:
    """Start and end (s) of consecutive scene slots, as the render plan cuts them."""
    first, last = min(slots), max(slots)
    start = 0.0 if first == 0 else scenes[first].start
    end = scenes[last + 1].start if last + 1 < len(scenes) else duration
    return start, max(end, start + 0.1)


# ------------------------------------------------------------------ phrase anchors
def _norm(w: str) -> str:
    return re.sub(r"[^\w]", "", w.lower().replace("ё", "е"))


def _match(token: str, word: str) -> bool:
    """A spoken word matches a written one: same stem (endings may differ – «миллиона» / «миллионов»)."""
    if not token or not word:
        return False
    if token.isdigit() or word.isdigit():
        return token == word
    n = max(3, min(len(token), len(word)) - 2) if min(len(token), len(word)) > 4 else min(len(token), len(word))
    return token[:n] == word[:n] and abs(len(token) - len(word)) <= 4


def find_phrase(words: Sequence[Word], phrase: str, lo: float, hi: float) -> tuple[float, float] | None:
    """(start, end) of the first occurrence of ``phrase`` spoken between ``lo`` and ``hi``."""
    tokens = [_norm(t) for t in phrase.split() if _norm(t)]
    if not tokens:
        return None
    cand = [w for w in words if w.e >= lo - 0.3 and w.s <= hi + 0.3]
    normed = [_norm(w.w) for w in cand]
    for i in range(len(cand) - len(tokens) + 1):
        if all(_match(tokens[k], normed[i + k]) for k in range(len(tokens))):
            return cand[i].s, cand[i + len(tokens) - 1].e
    return None


_ANCHOR = re.compile(r"^@(.+?)(>)?\s*([+-]\s*\d+(?:\.\d+)?)?$")


def resolve_anchor(value: str, words: Sequence[Word], base: float, lo: float, hi: float) -> float:
    """``"@3 миллиона"`` → seconds since ``base`` when the phrase starts; ``"@…>"`` – when it ends; ``+0.4`` shifts."""
    m = _ANCHOR.match(value.strip())
    if not m:
        raise ValueError(f"не понял привязку «{value}» (нужно «@фраза», «@фраза>» или «@фраза+0.5»)")
    found = find_phrase(words, m.group(1), lo, hi)
    if found is None:
        raise ValueError(f"фраза «{m.group(1)}» не звучит в {lo:.1f}–{hi:.1f} с")
    t = found[1] if m.group(2) else found[0]
    if m.group(3):
        t += float(m.group(3).replace(" ", ""))
    return round(t - base, 2)


def resolve_times(obj: Any, words: Sequence[Word], base: float, lo: float, hi: float, errors: list[str],
                  path: str = "") -> Any:
    """Every ``at`` / ``until`` / ``t`` given as a phrase anchor → a number (in place)."""
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if k in TIME_KEYS and isinstance(v, str):
                if v.startswith("@"):
                    try:
                        obj[k] = resolve_anchor(v, words, base, lo, hi)
                    except ValueError as e:
                        errors.append(f"{path}{k}: {e}")
                        obj[k] = 0.0
                else:
                    try:
                        obj[k] = float(v)
                    except ValueError:
                        errors.append(f"{path}{k}: «{v}» — не число и не «@фраза»")
                        obj[k] = 0.0
            else:
                resolve_times(v, words, base, lo, hi, errors, f"{path}{k}.")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            resolve_times(v, words, base, lo, hi, errors, f"{path}{i}.")
    return obj


# ------------------------------------------------------------------ render document
def scene_entry(item: dict[str, Any], dur: float) -> dict[str, Any]:
    return {"id": item["id"], "dur": round(dur, 3), "bg": item.get("bg"), "cam": item.get("cam"), "els": item.get("els") or []}


def overlay_entry(item: dict[str, Any]) -> dict[str, Any]:
    return {"id": item["id"], "start": float(item["start"]), "end": float(item["end"]), "shade": item.get("shade"),
            "els": item.get("els") or []}


def build_doc(motion: dict[str, Any], scenes: Sequence[Any], duration: float, *, width: int, height: int, lang: str,
              seed: int, fonts_dir: str | None, assets: dict[str, str] | None = None, safe_bottom: float = 0.0,
              only: set[str] | None = None, extra: list[dict[str, Any]] | None = None,
              preview_bg: dict[str, str] | None = None, cutouts: dict[str, Any] | None = None) -> dict[str, Any]:
    """The renderer's document for ``motion`` (``only`` – these item ids; ``extra`` – items not stored yet)."""
    doc_scenes, doc_overlays = [], []
    n = len(scenes)
    for it in [*items(motion), *(extra or [])]:
        if only is not None and it.get("id") not in only:
            continue
        if it.get("kind") == "scene":
            slots = [int(x) for x in it.get("slots") or []]
            if not slots or max(slots) >= n:
                continue  # the scenes were re-cut: the slot is gone
            a, b = span(scenes, slots, duration)
            doc_scenes.append(scene_entry(it, b - a))
        elif it.get("kind") == "overlay":
            ov = overlay_entry(it)
            if preview_bg and it["id"] in preview_bg:
                ov["previewBg"] = preview_bg[it["id"]]
            doc_overlays.append(ov)
    from .brief import cutout_assets, cutout_info  # noqa: PLC0415

    assets = {**cutout_assets(motion), **(assets or {})}  # drawn cut-outs of the brief are always available
    return {"width": width, "height": height, "lang": lang, "seed": seed, "fontsDir": fonts_dir,
            "style": data(motion).get("style") or {"base": "editorial"}, "assets": assets, "safeBottom": safe_bottom,
            "scenes": doc_scenes, "overlays": doc_overlays,
            "cutouts": cutouts if cutouts is not None else cutout_info(motion)}
