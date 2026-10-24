"""Series episodes: screenplay blocks → voice-over track, sound mix and scenes.

An episode is an ordinary project whose single track is *assembled* here instead
of being voiced in one piece:

1. Every text block is voiced into its own clip (narration – the series narrator
   in Lumean, a line – the character's Gemini or Lumean voice). Clips are trimmed
   of leading/trailing silence and levelled (:func:`process_clip`), so the
   timeline can be computed from clip lengths alone (:func:`layout`).
2. :func:`assemble_speech` lays the clips out with pauses between them and builds
   word timings: words of a Lumean clip come from its ``result.json``, words of a
   Gemini clip are spread over the clip by length (the API gives no timings).
3. :func:`mix_episode` puts music beds, ambience and sound effects under the
   speech. Music is ducked under speech by a gain envelope computed from the
   speech itself (:func:`duck_gain`) – precise, unlike a compressor.
4. The mix becomes the track's audio, the timings its timings; scenes are built
   from the blocks (:func:`scene_specs`) and the usual pipeline takes over:
   prompts, images with character/location references, render, packaging.

Series characters and locations reach the image pipeline as ``Character`` rows of
the episode project (``image_origin="series"``), kept in sync by :func:`sync_cast`.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import subprocess
import time
import wave
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from ..config import ffmpeg_bin
from ..models import Character, EpisodeBlock, Project, Series, SeriesCharacter, SoundCue
from ..render.media import CREATE_NO_WINDOW, run
from ..settings_schema import deep_merge
from .languages import LANGUAGES
from .timings import Word

#: Sample rate of clips, the speech track and the mix.
RATE = 48000
#: Rate of the ducking gain envelope (upsampled by ffmpeg).
GAIN_RATE = 1000


class SeriesOptions(BaseModel):
    """Per-series options stored in ``Series.options`` (all optional)."""

    model_config = ConfigDict(extra="ignore")

    #: Lumean template of the narrator; empty – the channel voice for the series language.
    narrator_template_id: str = ""
    #: Narrator speed 0.7–1.2 (empty – the template's).
    narrator_speed: float | None = None
    #: Silence after a block, seconds.
    gap: float = 0.5
    #: Silence between two lines in a row (a dialogue exchange).
    line_gap: float = 0.3
    #: Silence before the first block and after the last one.
    lead_in: float = 0.6
    tail: float = 2.0
    #: Base levels of the sound layers relative to speech, dB (a cue's ``volume`` is added).
    music_volume: float = -16.0
    ambience_volume: float = -22.0
    sfx_volume: float = -6.0
    #: How much music goes down under speech, dB (0 – no ducking).
    duck_db: float = 10.0
    #: Delivery note added to every Gemini line (e.g. accent, era) – optional.
    line_style: str = ""
    #: Subtitles show "Name: line" for character lines.
    speaker_names_in_subtitles: bool = False


def series_options(series: Series) -> SeriesOptions:
    return SeriesOptions.model_validate(series.options or {})


# ===================================================================== voices
def voice_of(character: SeriesCharacter | None) -> dict[str, Any]:
    """Normalised voice settings of a character."""
    v = dict(character.voice or {}) if character else {}
    provider = v.get("provider") if v.get("provider") in ("gemini", "lumean") else "gemini"
    return {"provider": provider, "voice": str(v.get("voice") or "Kore"), "style": str(v.get("style") or ""),
            "template_id": str(v.get("template_id") or "")}


def line_prompt(text: str, direction: str, character: SeriesCharacter | None, language: str,
                extra_style: str = "") -> str:
    """Gemini TTS prompt: a voice profile and director's notes, then the exact words to say."""
    voice = voice_of(character)
    lang = LANGUAGES.get(language, ("", language, ""))[1]
    profile = " ".join(x for x in (voice["style"].strip(), extra_style.strip()) if x)
    notes = [f"Speak {lang}."]
    if direction.strip():
        notes.append(f"Delivery: {direction.strip()}.")
    notes.append("Read only the transcript, word for word; do not read these notes aloud.")
    head = f"# AUDIO PROFILE: {character.name if character else 'Speaker'}\n"
    if profile:
        head += f"{profile}\n"
    return f"{head}\n## DIRECTOR'S NOTES\n{' '.join(notes)}\n\n## TRANSCRIPT\n{text.strip()}"


def block_hash(block: EpisodeBlock, character: SeriesCharacter | None, narrator: str,
               options: SeriesOptions) -> str:
    """What the clip depends on: a change means the block must be voiced again."""
    if block.kind == "narration":
        key = ["n", block.text.strip(), narrator, options.narrator_speed]
    else:
        key = ["l", block.text.strip(), block.direction.strip(), voice_of(character), options.line_style]
    return hashlib.sha256(json.dumps(key, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]


def estimate_seconds(text: str) -> float:
    """Rough speech length (≈14 characters per second) – for planning before voicing."""
    return max(0.8, len(text.strip()) / 14.0)


def needs_voice(block: EpisodeBlock) -> bool:
    return block.kind in ("narration", "line") and bool(block.text.strip())


# ===================================================================== clips
def decode(path: Path) -> np.ndarray:
    """Any audio file → mono float32 at :data:`RATE`."""
    proc = subprocess.run(
        [ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-i", str(path), "-f", "s16le", "-ac", "1",
         "-ar", str(RATE), "-"], capture_output=True, creationflags=CREATE_NO_WINDOW,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"не удалось прочитать аудио {path.name}: {proc.stderr.decode('utf-8', 'replace')[-300:]}")
    return np.frombuffer(proc.stdout, dtype=np.int16).astype(np.float32) / 32768.0


def write_wav(path: Path, samples: np.ndarray, rate: int = RATE) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(data.tobytes())
    return path


def _window_rms(x: np.ndarray, win: int) -> np.ndarray:
    n = len(x) // win
    if n == 0:
        return np.zeros(1, dtype=np.float32)
    return np.sqrt(np.mean(x[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)


def _drop_tail_burst(loud: np.ndarray, rms: np.ndarray, win: int) -> tuple[np.ndarray, int | None]:
    """Cut the noise burst Gemini TTS appends after the speech.

    The burst is a last run of loud windows: shorter than 0.3 s, after at least 0.2 s of
    silence and much louder than the speech. Returns ``loud`` without it and the sample
    where it starts (``None`` – no burst).
    """
    breaks = np.nonzero(np.diff(loud) > 1)[0]
    if not len(breaks):
        return loud, None
    last = breaks[-1]
    start, end = int(loud[last + 1]), int(loud[-1])
    short = (end - start + 1) * win <= 0.3 * RATE
    after_pause = (start - int(loud[last]) - 1) * win >= 0.2 * RATE
    louder = float(rms[start:end + 1].mean()) > 1.5 * float(rms[loud[: last + 1]].mean())
    if short and after_pause and louder:
        return loud[: last + 1], start * win
    return loud, None


def process_clip(raw: Path, dest: Path, words: list[list[Any]] | None) -> tuple[float, list[list[Any]], float]:
    """Trim silence at both ends and level a voiced clip; returns ``(duration, words, trimmed_head)``.

    ``words`` – ``[word, start, end]`` relative to the raw clip (Lumean), shifted to the
    trimmed clip; without them the words are left to the caller.
    """
    x = decode(raw)
    win = RATE // 100
    rms = _window_rms(x, win)
    thr = max(float(rms.max()) * 10 ** (-40 / 20), 10 ** (-52 / 20))
    loud = np.nonzero(rms > thr)[0]
    loud, burst = _drop_tail_burst(loud, rms, win)
    if len(loud):
        a = max(0, loud[0] * win - int(0.05 * RATE))
        b = min(len(x), (loud[-1] + 1) * win + int(0.15 * RATE), burst or len(x))
    else:
        a, b = 0, len(x)
    y = x[a:b]
    active = _window_rms(y, win)
    active = active[active > thr]
    level = float(np.sqrt(np.mean(active ** 2))) if len(active) else 0.0
    if level > 0:
        gain = 10 ** (-20 / 20) / level  # active speech at −20 dBFS RMS
        peak = float(np.max(np.abs(y))) or 1.0
        y = y * min(gain, 10 ** (-1 / 20) / peak)
    write_wav(dest, y)
    head = a / RATE
    dur = len(y) / RATE
    out = [[w, round(max(0.0, s - head), 3), round(min(dur, e - head), 3)] for w, s, e in (words or [])]
    return dur, out, head


def spread_words(text: str, duration: float) -> list[list[Any]]:
    """Word timings spread over a clip by word length (for TTS without timings)."""
    tokens = text.split()
    if not tokens:
        return []
    lead, tail = min(0.08, duration * 0.05), min(0.18, duration * 0.08)
    span = max(0.1, duration - lead - tail)
    weights = [len(t) + 2 for t in tokens]
    total = sum(weights)
    out, t = [], lead
    for tok, wgt in zip(tokens, weights):
        d = span * wgt / total
        out.append([tok, round(t, 3), round(t + d * 0.92, 3)])
        t += d
    return out


# ===================================================================== timeline
@dataclass
class Span:
    block_id: int
    #: Speech of the block (for a pause – the silence itself).
    start: float
    end: float
    kind: str
    #: The block's time including the gap after it (up to the next block).
    until: float = 0.0


def _gap(block: EpisodeBlock, nxt: EpisodeBlock | None, options: SeriesOptions) -> float:
    if nxt is None:
        return 0.0
    if block.gap_after is not None:
        return max(0.0, block.gap_after)
    if block.kind == "pause" or nxt.kind == "pause":
        return 0.0
    if block.kind == "line" and nxt.kind == "line":
        return options.line_gap
    return options.gap


def layout(blocks: list[EpisodeBlock], options: SeriesOptions, *, estimate: bool = True) -> tuple[list[Span], float]:
    """Block positions on the episode timeline and its total length.

    Uses clip lengths; a block without a clip gets an estimate (``estimate=False`` – skipped).
    """
    seq = [b for b in blocks if b.kind == "pause" or needs_voice(b)]
    spans: list[Span] = []
    cursor = options.lead_in
    for i, b in enumerate(seq):
        nxt = seq[i + 1] if i + 1 < len(seq) else None
        if b.kind == "pause":
            dur = max(0.0, b.pause)
        elif b.audio_duration and b.audio_status == "done":
            dur = b.audio_duration
        elif estimate:
            dur = estimate_seconds(b.text)
        else:
            continue
        span = Span(b.id, cursor, cursor + dur, b.kind)
        cursor = span.end + _gap(b, nxt, options)
        span.until = cursor
        spans.append(span)
    total = cursor + options.tail
    if spans:
        spans[-1].until = total
    return spans, total


@dataclass
class Assembled:
    spans: list[Span]
    duration: float
    #: Timed words with ``p`` = index of the block among the text blocks (a "paragraph").
    words: list[Word] = field(default_factory=list)
    #: The track script: text blocks as paragraphs.
    script: str = ""


def subtitle_text(block: EpisodeBlock, names: dict[int, str], options: SeriesOptions) -> str:
    text = " ".join(block.text.split())
    if block.kind == "line" and options.speaker_names_in_subtitles and block.character_id in names:
        return f"{names[block.character_id]}: {text}"
    return text


def assemble_speech(blocks: list[EpisodeBlock], options: SeriesOptions, clip_path, dest: Path,
                    names: dict[int, str]) -> Assembled:
    """Lay the clips out on the timeline into one mono WAV and collect word timings.

    ``clip_path(block)`` → absolute path of the block's processed clip.
    """
    spans, total = layout(blocks, options, estimate=False)
    by_id = {b.id: b for b in blocks}
    track = np.zeros(int(math.ceil(total * RATE)) + RATE, dtype=np.float32)
    words: list[Word] = []
    paragraphs: list[str] = []
    for span in spans:
        b = by_id[span.block_id]
        if b.kind == "pause":
            continue
        clip = decode(clip_path(b))
        a = int(round(span.start * RATE))
        track[a:a + len(clip)] += clip[: max(0, len(track) - a)]
        p = len(paragraphs)
        text = subtitle_text(b, names, options)
        paragraphs.append(text)
        clip_words = (b.audio_meta or {}).get("words") or spread_words(b.text, b.audio_duration or 0)
        if text != " ".join(b.text.split()):  # "Name: " prefix – timed together with the first word
            clip_words = [[w, s, e] for w, s, e in clip_words]
            if clip_words:
                clip_words[0][0] = text[: len(text) - len(" ".join(b.text.split()))] + clip_words[0][0]
        for w, s, e in clip_words:
            words.append(Word(str(w), round(span.start + float(s), 3), round(span.start + float(e), 3), p))
    track = track[: int(math.ceil(total * RATE))]
    write_wav(dest, track)
    return Assembled(spans, total, words, "\n\n".join(paragraphs))


# ===================================================================== sound
@dataclass
class CuePlacement:
    cue_id: int
    kind: str
    start: float
    #: Length on the timeline (music/ambience – the whole window, sfx – the clip or ``duration``).
    length: float
    volume_db: float
    fade_in: float
    fade_out: float
    path: Path
    #: The source is shorter than the window: loop it.
    loop: bool


def cue_window(cue: SoundCue, spans: list[Span], total: float) -> tuple[float, float]:
    """Start and end of a cue on the timeline (end only matters for music/ambience)."""
    by_id = {s.block_id: s for s in spans}
    start_span = by_id.get(cue.start_block_id) if cue.start_block_id else None
    if start_span is None:
        start = 0.0
    else:
        start = start_span.end if cue.anchor == "end" else start_span.start
    start = max(0.0, start + (cue.offset or 0.0))
    end_span = by_id.get(cue.end_block_id) if cue.end_block_id else None
    end = end_span.until if end_span else total
    if cue.kind == "sfx":
        end = start + (cue.duration or cue.audio_duration or 2.0)
    return start, max(start + 0.5, min(end, total))


def wanted_length(cue: SoundCue, spans: list[Span], total: float) -> float:
    """Length to generate: the window of a music bed, a short loop for ambience, ``duration`` for sfx."""
    start, end = cue_window(cue, spans, total)
    if cue.kind == "music":
        return min(300.0, max(10.0, end - start + 1.0))
    if cue.kind == "ambience":
        return 20.0
    return float(cue.duration) if cue.duration else 0.0


def placements(cues: list[SoundCue], spans: list[Span], total: float, options: SeriesOptions, to_abs) -> list[CuePlacement]:
    base = {"music": options.music_volume, "ambience": options.ambience_volume, "sfx": options.sfx_volume}
    out = []
    for c in cues:
        path = to_abs(c.audio_file)
        if c.audio_status != "done" or not path or not path.exists():
            continue
        start, end = cue_window(c, spans, total)
        src = c.audio_duration or 0.0
        if c.kind == "sfx":
            length = min(c.duration or src, src or (c.duration or 2.0), total - start)
            loop = False
        else:
            length = end - start
            loop = src > 0 and src < length - 0.05
        if length <= 0.05:
            continue
        out.append(CuePlacement(c.id, c.kind, start, length, base.get(c.kind, 0.0) + (c.volume or 0.0),
                                max(0.0, c.fade_in), max(0.0, c.fade_out), path, loop))
    return out


def duck_gain(speech: Path, options: SeriesOptions, dest: Path) -> Path:
    """Gain envelope for music: 1 in silence, −``duck_db`` under speech, smooth attack/release."""
    x = decode(speech)
    win = RATE // GAIN_RATE
    rms = _window_rms(x, win)
    talking = rms > 10 ** (-42 / 20)
    # Bridge gaps between words and the usual pauses between blocks, so the music does not
    # pump; it comes up only in longer silences (pause blocks, intro, outro).
    hold = int(0.9 * GAIN_RATE)
    idx = np.nonzero(talking)[0]
    active = np.zeros_like(talking)
    if len(idx):
        active[idx] = True
        gaps = np.nonzero((np.diff(idx) > 1) & (np.diff(idx) <= hold))[0]
        for g in gaps:
            active[idx[g]:idx[g + 1]] = True
    low = 10 ** (-max(0.0, options.duck_db) / 20)
    target = np.where(active, low, 1.0).astype(np.float32)
    attack, release = 0.12, 0.6
    a_up = 1 - math.exp(-1 / (attack * GAIN_RATE))
    a_down = 1 - math.exp(-1 / (release * GAIN_RATE))
    gain = np.empty_like(target)
    g = 1.0
    # Look ahead by the attack time so the music is already down when the word starts.
    shift = int(attack * GAIN_RATE)
    ahead = np.concatenate([target[shift:], np.ones(shift, dtype=np.float32)]) if shift else target
    ahead = np.minimum(ahead, target)
    for i, t in enumerate(ahead):
        g += (t - g) * (a_up if t < g else a_down)
        gain[i] = g
    return write_wav(dest, gain * 0.999, GAIN_RATE)


def mix_episode(speech: Path, gain: Path, cues: list[CuePlacement], total: float, dest: Path,
                stop=None) -> Path:
    """Speech + ducked music + ambience + sfx → FLAC 48 kHz stereo."""
    inputs = ["-i", str(speech), "-i", str(gain)]
    chains = [
        f"[0:a]aformat=sample_fmts=fltp:sample_rates={RATE}:channel_layouts=stereo,apad=whole_dur={total:.3f}[sp]",
        f"[1:a]aresample={RATE},aformat=sample_fmts=fltp:channel_layouts=stereo[g]",
    ]
    groups: dict[str, list[str]] = {"music": [], "ambience": [], "sfx": []}
    for n, c in enumerate(cues, start=2):
        if c.loop:
            inputs += ["-stream_loop", "-1"]
        inputs += ["-i", str(c.path)]
        fi = min(c.fade_in, c.length / 2)
        fo = min(c.fade_out, c.length / 2)
        f = [f"[{n}:a]aformat=sample_fmts=fltp:sample_rates={RATE}:channel_layouts=stereo",
             f"atrim=0:{c.length:.3f}", "asetpts=PTS-STARTPTS"]
        if fi > 0:
            f.append(f"afade=t=in:d={fi:.3f}")
        if fo > 0:
            f.append(f"afade=t=out:st={c.length - fo:.3f}:d={fo:.3f}")
        f.append(f"volume={c.volume_db:.2f}dB")
        if c.start > 0:
            f.append(f"adelay={int(c.start * 1000)}:all=1")
        label = f"c{n}"
        chains.append(",".join(f) + f"[{label}]")
        groups.get(c.kind, groups["sfx"]).append(label)

    def bus(labels: list[str], name: str) -> str | None:
        if not labels:
            return None
        if len(labels) == 1:
            chains.append(f"[{labels[0]}]anull[{name}]")
        else:
            chains.append("".join(f"[{x}]" for x in labels)
                          + f"amix=inputs={len(labels)}:normalize=0:dropout_transition=0[{name}]")
        return name

    finals = ["sp"]
    if bus(groups["music"], "bed"):
        chains.append("[bed]apad[bedp];[bedp][g]amultiply[music]")
        finals.append("music")
    else:
        chains.append("[g]anullsink")
    for kind, name in (("ambience", "amb"), ("sfx", "fx")):
        if bus(groups[kind], name):
            finals.append(name)
    chains.append("".join(f"[{x}]" for x in finals)
                  + f"amix=inputs={len(finals)}:normalize=0:duration=first,alimiter=limit=0.95:level=0:latency=1[out]")
    graph = ";".join(chains)
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(dest.stem + ".part" + dest.suffix)
    script = None
    if len(graph) > 20000:  # keep the command line short on Windows
        script = dest.with_suffix(".filter.txt")
        script.write_text(graph, encoding="utf-8")
        graph_args = ["-/filter_complex", str(script)]
    else:
        graph_args = ["-filter_complex", graph]
    try:
        run([ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y", *inputs, *graph_args, "-map", "[out]",
             "-t", f"{total:.3f}", "-c:a", "flac", "-ar", str(RATE), str(tmp)], stop=stop)
        tmp.replace(dest)
    finally:
        tmp.unlink(missing_ok=True)
        if script:
            script.unlink(missing_ok=True)
    return dest


# ===================================================================== scenes
@dataclass
class ShotSpec:
    start: float
    end: float
    text: str
    block_id: int
    prompt: str
    #: Episode ``Character`` ids (characters + the location) visible in the shot.
    refs: list[int]
    #: The shot continues the previous one (same block): ``{"change": ...}``.
    continuity: dict[str, Any] | None = None


def _split_points(words: list[Word], start: float, end: float, n: int) -> list[float]:
    """``n - 1`` cut times inside ``[start, end]``, moved to the nearest sentence/clause end."""
    inner = [w for w in words if start <= w.s < end]
    cuts = []
    for k in range(1, n):
        target = start + (end - start) * k / n
        best, best_d = target, float("inf")
        for i, w in enumerate(inner[:-1]):
            if not re.search(r"[.!?…;:,—]$", w.w):
                continue
            t = (w.e + inner[i + 1].s) / 2
            d = abs(t - target) * (1.0 if re.search(r"[.!?…]$", w.w) else 1.6)
            if d < best_d and (end - start) / n * 0.45 < t - (cuts[-1] if cuts else start):
                best, best_d = t, d
        if best_d == float("inf") or abs(best - target) > (end - start) / n * 0.6:
            best = target
        cuts.append(best)
    return cuts


def scene_specs(blocks: list[EpisodeBlock], assembled: Assembled, ref_ids: dict[tuple[str, int], int],
                max_duration: float) -> list[ShotSpec]:
    """Scenes of an episode: every block gets ``shots`` scenes (or by ``max_duration``).

    Scenes tile the whole timeline. A pause block without ``visual`` extends the previous
    scene. The location carries over from block to block until another one is set.
    """
    by_id = {b.id: b for b in blocks}
    shots: list[ShotSpec] = []
    location: int | None = None
    spans = assembled.spans
    for i, span in enumerate(spans):
        b = by_id[span.block_id]
        if b.location_id:
            location = b.location_id
        start = 0.0 if i == 0 else span.start
        end = assembled.duration if i == len(spans) - 1 else spans[i + 1].start
        if b.kind == "pause" and not (b.visual or "").strip() and shots:
            shots[-1].end = end
            continue
        refs: list[int] = []
        people = ([b.character_id] if b.kind == "line" and b.character_id else []) + list(b.visible or [])
        for cid in people:
            rid = ref_ids.get(("character", cid))
            if rid and rid not in refs:
                refs.append(rid)
        if location and (rid := ref_ids.get(("location", location))):
            refs.append(rid)
        n = b.shots if b.shots and b.shots > 0 else max(1, math.ceil((end - start) / max(2.0, max_duration)))
        cuts = [start, *_split_points(assembled.words, start, end, n), end]
        for k in range(n):
            a, z = cuts[k], cuts[k + 1]
            text = " ".join(w.w for w in assembled.words if a <= (w.s + w.e) / 2 < z)
            shots.append(ShotSpec(a, z, text, b.id, (b.visual or "").strip(), list(refs)))
    return shots


# ===================================================================== cast
def visual_context(series: Series) -> str:
    """The episode "visual bible" given to the prompt writer: world, style, cast and places."""
    parts = []
    if series.setting.strip():
        parts.append(f"SETTING: {series.setting.strip()}")
    if series.visual_style.strip():
        parts.append(f"VISUAL STYLE: {series.visual_style.strip()}")
    if series.characters:
        parts.append("CHARACTERS:\n" + "\n".join(f"- {c.name}: {c.description.strip()}" for c in series.characters))
    if series.locations:
        parts.append("LOCATIONS:\n" + "\n".join(f"- {loc.name}: {loc.description.strip()}" for loc in series.locations))
    return "\n\n".join(parts)


def episode_settings(series: Series, current: dict[str, Any] | None) -> dict[str, Any]:
    """Project overrides every episode needs: the series settings (the episode's own win),
    references on and the series style."""
    images: dict[str, Any] = {"character_refs": True}
    if series.visual_style.strip():
        images["style_prompt"] = series.visual_style.strip()
    shared = (series.options or {}).get("settings") or {}
    return deep_merge(deep_merge(dict(shared), current or {}), {"images": images})


def sync_cast(db: Session, project: Project) -> dict[tuple[str, int], int]:
    """Mirror series characters and locations into the episode's ``Character`` rows.

    Returns ``(kind, series id) → episode Character id``. Rows the user added to the
    episode by hand are left alone; mirrors of deleted series entries are removed.
    """
    series = db.get(Series, project.series_id) if project.series_id else None
    if series is None:
        return {}
    existing = {(c.kind, c.series_ref_id): c for c in project.characters if c.image_origin == "series"}
    wanted: list[tuple[str, Any]] = [("character", c) for c in series.characters]
    wanted += [("location", loc) for loc in series.locations]
    out: dict[tuple[str, int], int] = {}
    for pos, (kind, src) in enumerate(wanted):
        row = existing.pop((kind, src.id), None)
        if row is None:
            row = Character(project_id=project.id, kind=kind, series_ref_id=src.id, image_origin="series")
            db.add(row)
        row.position, row.name, row.description = pos, src.name, src.description
        row.image_file = src.image_file
        row.image_status = "done" if src.image_file else src.image_status
        row.image_error = src.image_error
        db.flush()
        out[(kind, src.id)] = row.id
    for row in existing.values():
        db.delete(row)
    project.visual_context = visual_context(series)
    project.settings = episode_settings(series, project.settings)
    if not project.characters_scanned_at:
        project.characters_scanned_at = time.time()  # the cast comes from the series: never scan the script
    return out
