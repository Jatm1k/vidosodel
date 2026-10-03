"""Word-level timings – the common currency between voice-over, scenes and subtitles.

Whatever the source (Lumean ``result.json``, an uploaded SRT, speech-to-text
or a pure estimate from text), timings are normalised to::

    {"version": 1, "source": "lumean", "duration": 123.4,
     "words": [{"w": "Hello,", "s": 0.00, "e": 0.42, "p": 0}, ...]}

``p`` is the paragraph index of the word in the script (``-1`` when unknown).
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from .text import ends_clause, ends_sentence, paragraphs, tokenize_words


@dataclass(slots=True)
class Word:
    w: str
    s: float
    e: float
    p: int = -1


@dataclass(slots=True)
class Timings:
    words: list[Word]
    duration: float
    source: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "version": 1, "source": self.source, "duration": round(self.duration, 3),
            "words": [{"w": w.w, "s": round(w.s, 3), "e": round(w.e, 3), "p": w.p} for w in self.words],
        }

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), ensure_ascii=False), encoding="utf-8")

    @classmethod
    def load(cls, path: Path) -> Timings:
        d = json.loads(path.read_text(encoding="utf-8"))
        return cls([Word(x["w"], x["s"], x["e"], x.get("p", -1)) for x in d["words"]], d["duration"], d["source"])

    @property
    def text(self) -> str:
        return " ".join(w.w for w in self.words)


@dataclass(slots=True)
class Sentence:
    """A sentence (or clause of an over-long sentence) on the timeline."""

    first: int  # index of the first word
    last: int   # index of the last word (inclusive)
    start: float
    end: float
    text: str
    paragraph: int
    #: Silence after this unit (seconds) – long pauses are natural scene cuts.
    pause_after: float = 0.0

    @property
    def duration(self) -> float:
        return self.end - self.start


# --------------------------------------------------------------------------- sources
def from_lumean(result: dict[str, Any], script: str | None = None) -> Timings:
    """Parse Lumean ``result.json`` (schema ``el-timestamps/v1``)."""
    words = [Word(w["word"], float(w["start"]), float(w["end"])) for w in result.get("words", []) if w.get("word")]
    duration = float(result.get("duration_seconds") or (words[-1].e if words else 0))
    t = Timings(words, duration, "lumean")
    if script:
        assign_paragraphs(t, script)
    return t


_SRT_TIME = re.compile(r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)")


def parse_srt(text: str) -> list[tuple[float, float, str]]:
    """Return ``(start, end, text)`` cues from SRT or WebVTT content."""
    cues: list[tuple[float, float, str]] = []
    blocks = re.split(r"\n\s*\n", text.replace("\r\n", "\n").replace("﻿", "").strip())
    for block in blocks:
        lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
        for i, line in enumerate(lines):
            m = _SRT_TIME.search(line)
            if not m:
                continue
            g = [int(x) for x in m.groups()]
            start = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 10 ** len(m.group(4))
            end = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 10 ** len(m.group(8))
            body = " ".join(lines[i + 1:])
            body = re.sub(r"<[^>]+>|\{\\[^}]*\}", "", body).strip()  # strip html/ass tags
            if body:
                cues.append((start, end, body))
            break
    return cues


def from_srt(text: str, script: str | None = None, duration: float | None = None) -> Timings:
    """Build word timings from subtitle cues.

    Each cue's time span is shared between its words proportionally to their
    length – precise enough for scene cutting and subtitle re-flow.
    """
    words: list[Word] = []
    for start, end, body in parse_srt(text):
        tokens = body.split()
        total = sum(len(t) + 1 for t in tokens) or 1
        t = start
        for tok in tokens:
            span = (end - start) * (len(tok) + 1) / total
            words.append(Word(tok, t, t + span * 0.92))
            t += span
    dur = duration or (words[-1].e if words else 0.0)
    timings = Timings(words, dur, "srt")
    if script:
        assign_paragraphs(timings, script)
    return timings


def from_stt(segments: list[dict[str, Any]], offset: float = 0.0) -> list[Word]:
    """Words from a FastGen transcription result (``transcription.segments``)."""
    out: list[Word] = []
    for seg in segments:
        seg_words = seg.get("words") or []
        if seg_words:
            for w in seg_words:
                if w.get("start_seconds") is None:
                    continue
                out.append(Word(w["text"].strip(), offset + float(w["start_seconds"]),
                                offset + float(w.get("end_seconds") or w["start_seconds"])))
        elif seg.get("start_seconds") is not None and seg.get("text"):
            # No word timestamps – spread the segment evenly.
            tokens = seg["text"].split()
            s, e = float(seg["start_seconds"]), float(seg.get("end_seconds") or seg["start_seconds"])
            step = (e - s) / max(1, len(tokens))
            out.extend(Word(t, offset + s + i * step, offset + s + (i + 1) * step) for i, t in enumerate(tokens))
    return [w for w in out if w.w]


#: Approximate speaking rate (characters per second) for the estimate mode.
_CHARS_PER_SECOND = {"ru": 14.0, "uk": 14.0, "de": 14.5, "en": 15.5, "es": 16.0, "fr": 15.5, "it": 16.0, "pt": 15.5}


def estimate(script: str, language: str = "en") -> Timings:
    """Synthetic timings from text only – lets the user plan scenes without audio."""
    cps = _CHARS_PER_SECOND.get(language, 15.0)
    words: list[Word] = []
    t = 0.0
    for p_idx, para in enumerate(paragraphs(script)):
        for tok in tokenize_words(para):
            dur = max(0.18, (len(tok) + 1) / cps)
            words.append(Word(tok, t, t + dur, p_idx))
            t += dur
            if ends_sentence(tok):
                t += 0.35
            elif ends_clause(tok):
                t += 0.12
        t += 0.6
    return Timings(words, t, "estimate")


# ----------------------------------------------------------------------- alignment
def _norm(token: str) -> str:
    return re.sub(r"[^\w]", "", token.lower())


def assign_paragraphs(timings: Timings, script: str) -> None:
    """Tag every timed word with the index of the script paragraph it belongs to.

    Uses a diff between script tokens and timed tokens so small differences
    (number normalisation, dropped tags) do not break the mapping.
    """
    script_tokens: list[str] = []
    script_para: list[int] = []
    for p_idx, para in enumerate(paragraphs(script)):
        for tok in tokenize_words(para):
            script_tokens.append(_norm(tok))
            script_para.append(p_idx)
    if not script_tokens or not timings.words:
        return
    timed = [_norm(w.w) for w in timings.words]
    mapping: list[int | None] = [None] * len(timed)
    sm = SequenceMatcher(None, script_tokens, timed, autojunk=False)
    for a, b, size in sm.get_matching_blocks():
        for k in range(size):
            mapping[b + k] = script_para[a + k]
    # Unmatched words inherit from the previous matched word (or the next one at the start).
    last = next((m for m in mapping if m is not None), 0)
    for i, m in enumerate(mapping):
        if m is None:
            mapping[i] = last
        else:
            last = m
    for w, p in zip(timings.words, mapping):
        w.p = int(p or 0)


# ------------------------------------------------------------------------ sentences
def sentences(timings: Timings, max_unit: float | None = None) -> list[Sentence]:
    """Group words into sentences; split sentences longer than ``max_unit`` seconds at clauses/pauses."""
    words = timings.words
    out: list[Sentence] = []
    start_idx = 0
    for i, w in enumerate(words):
        is_last = i == len(words) - 1
        para_change = not is_last and words[i + 1].p != w.p
        if ends_sentence(w.w) or para_change or is_last:
            out.extend(_split_long(words, start_idx, i, max_unit))
            start_idx = i + 1
    for k, s in enumerate(out):
        nxt = words[out[k + 1].first].s if k + 1 < len(out) else timings.duration
        s.pause_after = max(0.0, nxt - s.end)
    return out


def _make(words: list[Word], a: int, b: int) -> Sentence:
    return Sentence(a, b, words[a].s, words[b].e, " ".join(w.w for w in words[a:b + 1]), words[a].p)


def _split_long(words: list[Word], a: int, b: int, max_unit: float | None) -> list[Sentence]:
    if max_unit is None or words[b].e - words[a].s <= max_unit or a == b:
        return [_make(words, a, b)]
    # Best split point: a clause boundary or the longest pause, close to the middle.
    mid = (words[a].s + words[b].e) / 2
    best, best_score = None, float("inf")
    for i in range(a, b):
        gap = words[i + 1].s - words[i].e
        score = abs(words[i].e - mid) - (2.0 if ends_clause(words[i].w) else 0.0) - gap * 4
        if score < best_score:
            best, best_score = i, score
    assert best is not None
    return _split_long(words, a, best, max_unit) + _split_long(words, best + 1, b, max_unit)
