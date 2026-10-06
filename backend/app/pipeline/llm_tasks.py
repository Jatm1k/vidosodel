"""LLM tasks of the pipeline (all through FastGen chat completions).

* :func:`visual_bible` – consistent look of characters/places for the whole video.
* :func:`extract_characters` – recurring people that get reference portraits.
* :func:`scene_prompts` – one English image prompt per scene (and who is in it), in batches.
* :func:`soften_prompt` – rephrase a prompt rejected by a content filter.
* :func:`translate_script` – paragraph-aligned translation of a script.
* :func:`publish_metadata` – titles, description, tags, chapters, thumbnail ideas.
"""
from __future__ import annotations

import json
import logging
import re
import time
from collections.abc import Callable, Sequence
from typing import Any

from ..services.fastgen import FastgenClient
from ..services.http import ApiError
from ..settings_schema import ImageSettings, LlmSettings, PublishSettings
from .languages import language_name

log = logging.getLogger(__name__)

SAFE_RULES = (
    "Images must be safe for YouTube monetization: no gore, blood, nudity, weapons pointed at people, "
    "drugs, hate symbols, real celebrities, politicians, brand logos or readable text. Show difficult "
    "topics through metaphor, atmosphere, body language and symbolism instead of explicit depiction."
)


def _niche(llm: LlmSettings) -> str:
    return f"Channel niche: {llm.niche}\n" if llm.niche.strip() else ""


# ------------------------------------------------------------------- visual bible
def visual_bible(fg: FastgenClient, script: str, llm: LlmSettings, images: ImageSettings) -> str:
    system = (
        "You are the art director of a narrated YouTube video illustrated with AI-generated stills. "
        "Read the script and write a concise VISUAL BIBLE in English that keeps all images consistent. "
        "Include: 1) setting and era; 2) recurring characters – for each a fixed visual description "
        "(gender, age, ethnicity, hair, build, clothing) with a short handle like 'the woman (Anna)'; "
        "3) recurring locations; 4) color palette, lighting and mood. "
        "If the script is abstract/educational, define a consistent visual metaphor language instead. "
        "Max 1800 characters, plain text, no markdown headers."
    )
    user = (
        f"{_niche(llm)}Channel visual style: {images.style_prompt}\n"
        f"{('Additional instructions: ' + llm.prompt_instructions) if llm.prompt_instructions else ''}\n\n"
        f"SCRIPT:\n{script[:120_000]}"
    )
    return fg.chat([{"role": "system", "content": system}, {"role": "user", "content": user}],
                   model=llm.model, temperature=0.5).strip()


# ----------------------------------------------------------------------- characters
def extract_characters(fg: FastgenClient, script: str, bible: str, llm: LlmSettings,
                       limit: int = 6) -> list[dict[str, str]]:
    """Recurring on-screen people of the video: ``[{"name", "description"}]`` (may be empty)."""
    system = (
        "You prepare reference portraits for an illustrated narrated video. From the script and the visual "
        f"bible, list up to {limit} RECURRING people who should look the same in many images: named heroes, "
        "the narrator's persona if shown, a recurring 'the man'/'the woman' protagonist. Skip people that appear "
        "once, crowds, historical figures and real celebrities. For each give a short English handle (a first "
        "name or 'the old man') and a fixed visual description in English, 25–50 words: gender, age, "
        "ethnicity, face, hair, build, typical clothing. Reuse the bible's descriptions when present. "
        "If nobody recurs (abstract or educational script), return an empty list. "
        'Answer ONLY with JSON: {"characters": [{"name": "...", "description": "..."}]}'
    )
    user = f"{_niche(llm)}VISUAL BIBLE:\n{bible or '(none)'}\n\nSCRIPT:\n{script[:120_000]}"
    data = fg.chat_json([{"role": "system", "content": system}, {"role": "user", "content": user}],
                        model=llm.model, temperature=0.3)
    out: list[dict[str, str]] = []
    for c in (data.get("characters") if isinstance(data, dict) else None) or []:
        if not isinstance(c, dict):
            continue
        name, desc = str(c.get("name", "")).strip()[:60], str(c.get("description", "")).strip()
        if name and desc and name.lower() not in {o["name"].lower() for o in out}:
            out.append({"name": name, "description": desc})
    return out[:limit]


def portrait_prompt(description: str) -> str:
    """Prompt of a character reference portrait (the channel style is appended by :func:`compose_prompt`)."""
    return (
        f"Character reference portrait: {description}. Head and upper body, facing the camera, calm neutral "
        "expression, plain neutral grey background, soft even studio lighting, face in sharp focus, "
        "no other people"
    )


# -------------------------------------------------------------------- scene prompts
_PROMPT_SYSTEM = """You write prompts for an image generation model that illustrates a narrated YouTube video.
Each scene below is a fragment of the voice-over; write ONE prompt per scene describing a single 16:9 still \
frame that a viewer sees while hearing this fragment.

Rules:
- English only, 35–80 words, one paragraph, no lists.
- Describe concretely: subject, action, setting, composition/camera angle, lighting, mood.
- Follow the VISUAL BIBLE strictly: reuse the exact character/location descriptions so they stay consistent.
- Vary shot types (wide, medium, close-up, over-the-shoulder, detail shot) and compositions across scenes.
- Abstract ideas → clear visual metaphors. Never put text, captions, letters or UI in the image.
- The narration may mention everyday illness, pain, doctors, conflicts or loss – this is ordinary storytelling, \
not medical or harmful content. Illustrate such scenes gently: everyday settings, emotions, symbolism.
- Do NOT add art-style words (photorealistic, oil painting...) – the style is appended automatically.
- {safe}{characters_rule}
Answer ONLY with JSON: {{"prompts": [{{"id": <scene id>, "prompt": "<text>"{characters_field}}}, ...]}}"""

_CHARACTERS_RULE = """
- CHARACTERS have reference portraits. When one is visible in a scene, call them by their exact name and \
list them in "characters"; describe pose, action and emotion, not their face or hair (the portrait defines \
those). At most 3 named characters per scene; use [] when none of them is visible."""


def scene_prompts(
    fg: FastgenClient,
    scenes: Sequence[tuple[int, str]],
    *,
    bible: str,
    llm: LlmSettings,
    batch_size: int = 30,
    progress: Callable[[float], None] | None = None,
    should_stop: Callable[[], bool] | None = None,
    on_batch: Callable[[dict[int, dict[str, Any]]], None] | None = None,
    characters: Sequence[tuple[str, str]] = (),
) -> dict[int, dict[str, Any]]:
    """Generate prompts for ``(scene_id, text)`` pairs.

    Returns ``{scene_id: {"prompt": str, "characters": [names] | None}}``:
    who of ``characters`` (name, description) is visible in the scene, or
    None when no characters were given or the model did not say.
    ``on_batch`` is called after every batch so results are persisted
    incrementally (a long video is ~50 requests).
    """
    system = _PROMPT_SYSTEM.format(
        safe=SAFE_RULES,
        characters_rule=_CHARACTERS_RULE if characters else "",
        characters_field=', "characters": ["<name>"]' if characters else "",
    )
    result: dict[int, dict[str, Any]] = {}
    previous: list[str] = []
    empty_batches = 0
    for start in range(0, len(scenes), batch_size):
        if should_stop and should_stop():
            break
        batch = list(scenes[start:start + batch_size])
        header = (
            f"{_niche(llm)}"
            f"{('Additional instructions: ' + llm.prompt_instructions + chr(10)) if llm.prompt_instructions else ''}"
            f"VISUAL BIBLE:\n{bible or '(none)'}\n\n"
        )
        if characters:
            header += "CHARACTERS:\n" + "\n".join(f"- {n}: {d}" for n, d in characters) + "\n\n"
        context = "\n".join(f"- {p}" for p in previous[-3:])
        if context:
            header += f"Previous prompts (for continuity, do not repeat):\n{context}\n\n"
        stats = _BatchStats()
        got = _prompts_resilient(fg, system, header, batch, llm, should_stop, stats)
        stats.report(batch, got)
        result.update(got)
        if on_batch and got:
            on_batch(got)
        previous.extend(got[sid]["prompt"] for sid, _ in batch if sid in got)
        if progress:
            progress(min(1.0, (start + len(batch)) / len(scenes)))
        empty_batches = 0 if got else empty_batches + 1
        if empty_batches >= _MAX_EMPTY_BATCHES:
            log.warning("stopping scene prompts: %d batches in a row gave no prompts (LLM unavailable or "
                        "refusing) - %d scenes left without prompts", empty_batches,
                        len(scenes) - len(result))
            break
    return result


#: Canned refusals the chat backend sends instead of an answer (HTTP 200).
_REFUSAL = re.compile(
    r"hard time fulfilling|can(?:'|’|no)t (?:help|assist|fulfil|do that)|unable to (?:help|assist|fulfil|comply)"
    r"|against (?:my|our) (?:policy|policies|guidelines)|something else instead",
    re.I,
)
#: Pause before re-asking once after a canned "something went wrong" answer. The backend sends the same
#: stub for content it filters (illness, injuries...), so a repeated stub is treated like a refusal.
_ERROR_RETRY_DELAY = 5
#: Every request is paid (input tokens) even when it returns a stub - cap the requests per batch.
_MAX_BATCH_CALLS = 24
#: This many stubs in a row before any success in a batch -> the backend is down, stop asking.
_MAX_STUBS_WITHOUT_SUCCESS = 6
#: Stop the whole job after this many batches in a row without a single prompt.
_MAX_EMPTY_BATCHES = 2
_MAX_DEPTH = 6  # 30 → 15 → 8 → 4 → 2 → 1: deep enough to reach single scenes


def _stub_kind(text: str) -> str | None:
    """``"refusal"`` / ``"error"`` for a short canned answer without JSON, else None."""
    t = text.strip()
    if "{" in t or len(t) > 400:
        return None
    return "refusal" if _REFUSAL.search(t) else "error"


class _BatchStats:
    """Request budget of one batch and what went wrong – logged once, not per request."""

    def __init__(self) -> None:
        self.counts: dict[str, int] = {}
        self.samples: dict[str, str] = {}
        self.calls = 0
        self.ok_calls = 0
        self.stubs_in_row = 0
        #: An error stub came back on retry: it is about the content, do not re-ask the same text.
        self.errors_are_content = False

    @property
    def exhausted(self) -> bool:
        return (self.calls >= _MAX_BATCH_CALLS
                or (not self.ok_calls and self.stubs_in_row >= _MAX_STUBS_WITHOUT_SUCCESS))

    def chat(self, fg: FastgenClient, messages: list[dict[str, str]], llm: LlmSettings,
             temperature: float, *, plain: bool = False) -> str:
        """``fg.chat`` that counts the request and canned answers (``plain``: a short text answer is expected)."""
        self.calls += 1
        text = fg.chat(messages, model=llm.model, temperature=temperature)
        kind = _stub_kind(text)
        if plain and kind == "error" and text.strip():
            kind = None
        if kind:
            self.stubs_in_row += 1
            self.note(kind, text)
        else:
            self.stubs_in_row = 0
        return text

    def note(self, kind: str, sample: str) -> None:
        self.counts[kind] = self.counts.get(kind, 0) + 1
        self.samples.setdefault(kind, sample.strip()[:120])

    def report(self, batch: list[tuple[int, str]], got: dict[int, dict[str, Any]]) -> None:
        skipped = [sid for sid, _ in batch if sid not in got]
        if not self.counts and not skipped:
            return
        issues = ", ".join(f"{k} x{n} ({self.samples[k]!r})" for k, n in self.counts.items())
        log.warning("prompts for scenes %d-%d: %d/%d ok, %d requests%s%s%s", batch[0][0], batch[-1][0],
                    len(got), len(batch), self.calls,
                    f"; {issues}" if issues else "",
                    "; request limit reached" if self.exhausted else "",
                    f"; skipped {skipped} (use 'create missing')" if skipped else "")


def _pause(seconds: float, should_stop: Callable[[], bool] | None) -> bool:
    """Sleep in small steps; False when the job was stopped meanwhile."""
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        if should_stop and should_stop():
            return False
        time.sleep(min(1.0, end - time.monotonic()))
    return True


def _prompts_resilient(
    fg: FastgenClient, system: str, header: str, batch: list[tuple[int, str]], llm: LlmSettings,
    should_stop: Callable[[], bool] | None, stats: _BatchStats, depth: int = 0,
) -> dict[int, dict[str, Any]]:
    """Prompts for a batch that never fails as a whole.

    The chat backend occasionally returns an empty, truncated or non-JSON
    answer, or a canned stub instead of an answer when its filter dislikes
    the text. Whatever was parsed is kept; the rest is retried in halves, so
    the offending scenes are isolated. A single scene the model refuses is
    retold neutrally and tried once more. Scenes that still fail (or exceed
    the request budget) are skipped – "create missing" fills them later.
    """
    if not batch or stats.exhausted or (should_stop and should_stop()):
        return {}
    got: dict[int, dict[str, Any]] = {}
    kind: str | None = None
    try:
        got, kind = _prompts_batch(fg, system, header, batch, llm, stats, should_stop)
    except ApiError as exc:
        stats.note("api error", str(exc))
    missing = [(sid, text) for sid, text in batch if sid not in got]
    if not missing:
        return got
    if len(batch) == 1 and kind:
        return got | _prompts_softened(fg, system, header, batch[0], llm, should_stop, stats)
    if depth >= _MAX_DEPTH:
        return got
    if not kind and (len(missing) == 1 or not got and len(missing) <= 2):
        # Single scenes with a broken (not refused) answer: one more plain retry.
        return got | _prompts_resilient(fg, system, header, missing, llm, should_stop, stats, depth + 1)
    mid = (len(missing) + 1) // 2
    for part in (missing[:mid], missing[mid:]):
        got |= _prompts_resilient(fg, system, header, part, llm, should_stop, stats, depth + 1)
    return got


def _prompts_softened(
    fg: FastgenClient, system: str, header: str, scene: tuple[int, str], llm: LlmSettings,
    should_stop: Callable[[], bool] | None, stats: _BatchStats,
) -> dict[int, dict[str, Any]]:
    """Retry a refused scene with its text retold in neutral words."""
    sid, text = scene
    if stats.exhausted:
        return {}
    try:
        soft = stats.chat(fg, soften_scene_messages(text), llm, 0.4, plain=True).strip().strip('"')
        if not soft or _REFUSAL.search(soft):
            return {}
        got, _kind = _prompts_batch(fg, system, header, [(sid, soft)], llm, stats, should_stop)
    except ApiError as exc:
        stats.note("api error", str(exc))
        return {}
    if got:
        stats.note("softened", f"scene {sid}")
    return got


def _prompts_batch(
    fg: FastgenClient, system: str, header: str, batch: list[tuple[int, str]], llm: LlmSettings,
    stats: _BatchStats, should_stop: Callable[[], bool] | None,
) -> tuple[dict[int, dict[str, Any]], str | None]:
    """One LLM request (re-asked once after a pause on a canned "something went wrong").

    Accepts partial/truncated JSON: every complete ``{id, prompt}`` object counts.
    Returns the prompts and the kind of canned answer (``"refusal"``/``"error"``) if that is all we got.
    """
    ids = {sid for sid, _ in batch}
    user = header + "SCENES:\n" + "\n".join(f"[{sid}] {text}" for sid, text in batch)
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    text = stats.chat(fg, messages, llm, llm.temperature)
    kind = _stub_kind(text)
    if kind == "error" and not stats.errors_are_content and not stats.exhausted:
        if not _pause(_ERROR_RETRY_DELAY, should_stop):
            return {}, kind
        text = stats.chat(fg, messages, llm, llm.temperature)
        kind = _stub_kind(text)
        if kind == "error":
            stats.errors_are_content = True
    if kind:
        return {}, kind
    stats.ok_calls += 1
    out: dict[int, dict[str, Any]] = {}
    for it in iter_json_objects(text):
        try:
            sid, prompt = int(it["id"]), str(it["prompt"]).strip()
        except (KeyError, TypeError, ValueError):
            continue
        if sid in ids and prompt:
            names = it.get("characters")
            out[sid] = {"prompt": prompt,
                        "characters": [str(n) for n in names] if isinstance(names, list) else None}
    if not out:
        stats.note("no JSON", text)
    return out, None


def iter_json_objects(text: str) -> list[dict[str, Any]]:
    """All complete JSON objects found anywhere in ``text`` (survives fences, prose and truncation)."""
    decoder = json.JSONDecoder()
    found: list[dict[str, Any]] = []
    pos = text.find("{")
    while pos != -1:
        try:
            obj, end = decoder.raw_decode(text, pos)
        except json.JSONDecodeError:
            pos = text.find("{", pos + 1)
            continue
        if isinstance(obj, dict):
            if isinstance(obj.get("prompts"), list):
                found.extend(o for o in obj["prompts"] if isinstance(o, dict))
            else:
                found.append(obj)
        pos = text.find("{", end)
    return found


def compose_prompt(prompt: str, images: ImageSettings) -> str:
    """Final text sent to the image model: scene prompt + channel style + exclusions."""
    parts = [prompt.strip().rstrip(".")]
    if images.style_prompt.strip():
        parts.append(images.style_prompt.strip())
    text = ". ".join(parts) + "."
    if images.avoid.strip():
        text += f" Avoid: {images.avoid.strip()}."
    return text


def soften_prompt(fg: FastgenClient, prompt: str, llm: LlmSettings) -> str:
    """Rephrase a prompt that a content filter rejected, keeping the meaning."""
    system = (
        "An image generation request was rejected by a content safety filter. Rewrite the prompt so it "
        "passes moderation while keeping the scene's meaning and composition. Remove or soften anything "
        f"violent, sexual, medical-graphic, political or involving real people/brands. {SAFE_RULES} "
        "Answer with the new prompt only."
    )
    return fg.chat([{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                   model=llm.model, temperature=0.4).strip().strip('"')


def soften_scene_messages(text: str) -> list[dict[str, str]]:
    """Chat messages that retell a voice-over fragment the model refused to illustrate, in showable terms."""
    system = (
        "A fragment of a narrated video script needs an illustration, but the illustrator refused it as too "
        "sensitive. Retell the fragment in 1–3 neutral English sentences describing only what can be shown on "
        "screen: turn violence, death, illness, sexual or political details into metaphor, atmosphere and "
        f"body language, keep the people, place and mood. {SAFE_RULES} Answer with the retold fragment only."
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": text}]


# ----------------------------------------------------------------------- translation
def translate_script(
    fg: FastgenClient, paragraphs: list[str], target_lang: str, llm: LlmSettings,
    progress: Callable[[float], None] | None = None, max_chars: int = 8000,
) -> list[str]:
    """Translate paragraph by paragraph (count preserved → images can be shared across languages)."""
    name = language_name(target_lang)
    system = (
        f"You are a professional translator and YouTube voice-over script adapter. Translate into {name}. "
        "Keep the meaning, tone and rhythm; adapt idioms naturally so it sounds native when read aloud by a "
        "narrator. Keep markup like {{pause=1}} and [directions] unchanged. Do not add or drop paragraphs. "
        'Answer ONLY with JSON: {"paragraphs": ["...", ...]} – exactly as many items as given.'
    )
    out: list[str] = []
    batch: list[str] = []
    size = 0

    def flush() -> None:
        nonlocal batch, size
        if not batch:
            return
        user = _niche(llm) + json.dumps({"paragraphs": batch}, ensure_ascii=False)
        for _attempt in range(3):
            data = fg.chat_json([{"role": "system", "content": system}, {"role": "user", "content": user}],
                                model=llm.model, temperature=0.3)
            items = data.get("paragraphs") if isinstance(data, dict) else data
            if isinstance(items, list) and len(items) == len(batch):
                out.extend(str(x).strip() for x in items)
                break
        else:
            # Count mismatch three times – translate one by one (slower but exact).
            for p in batch:
                out.append(fg.chat([{"role": "system", "content": f"Translate into {name}. Answer with the translation only."},
                                    {"role": "user", "content": p}], model=llm.model, temperature=0.3).strip())
        batch, size = [], 0
        if progress:
            progress(len(out) / len(paragraphs))

    for p in paragraphs:
        if size + len(p) > max_chars and batch:
            flush()
        batch.append(p)
        size += len(p)
    flush()
    return out


# ------------------------------------------------------------------------- metadata
def publish_metadata(
    fg: FastgenClient, script: str, language: str, chapters: list[tuple[float, str]],
    llm: LlmSettings, publish: PublishSettings,
) -> dict[str, Any]:
    """YouTube title variants, description, tags, chapters and thumbnail concepts."""
    name = language_name(language)
    chapter_lines = "\n".join(f"{int(t)}s: {text[:160]}" for t, text in chapters)
    system = (
        "You are a YouTube growth strategist. Create upload metadata for a long-form narrated video. "
        f"Write titles, description, tags and chapter titles in {name}. Titles: max 70 characters, curiosity-driven "
        "but honest, no clickbait lies, no ALL CAPS. Description: 2 short hook paragraphs + key points; "
        "no hashtag spam (max 3 hashtags at the end). NEVER put timestamps, time codes or a chapter list "
        "into the description – chapters are added automatically from the \"chapters\" field. "
        "Tags: relevant search phrases. "
        "Chapters: pick 5–12 moments ONLY from the candidate list (use their seconds), first must be 0. "
        "Thumbnail concepts: English image prompts for a 16:9 thumbnail (one strong focal subject, emotion, "
        f"contrast) and a 2–4 word headline in {name}. The thumbnail art style is FIXED and added "
        f"automatically: «{publish.thumbnail_style}». Describe only WHAT is shown (characters, emotion, "
        "action, objects, composition, background) so that it fits this style – e.g. for a cartoon style "
        "describe cartoon characters, not real people. Never use style, medium, camera or quality words "
        "(photo, photorealistic, realistic, cinematic, 8k, detailed skin, lens, illustration, render). "
        'Answer ONLY with JSON: {"titles": [...], "description": "...", "tags": [...], '
        '"chapters": [{"t": 0, "title": "..."}], "thumbnails": [{"prompt": "...", "headline": "..."}]}'
    )
    user = (
        f"{_niche(llm)}Number of titles: {publish.title_variants}. Number of tags: {publish.tags_count}. "
        f"Number of thumbnail concepts: {publish.thumbnail_count}.\n\n"
        f"CHAPTER CANDIDATES (seconds: paragraph start):\n{chapter_lines}\n\nSCRIPT:\n{script[:100_000]}"
    )
    data = fg.chat_json([{"role": "system", "content": system}, {"role": "user", "content": user}],
                        model=llm.model, temperature=0.8)
    if not isinstance(data, dict):
        raise ValueError("LLM вернул метаданные в неверном формате")
    valid_t = {int(t) for t, _ in chapters}
    chapters_out = []
    for ch in data.get("chapters") or []:
        try:
            t = int(ch["t"])
        except (KeyError, TypeError, ValueError):
            continue
        if t in valid_t or t == 0:
            chapters_out.append({"t": t, "title": str(ch.get("title", "")).strip()})
    chapters_out.sort(key=lambda c: c["t"])
    if chapters_out and chapters_out[0]["t"] != 0:
        chapters_out[0]["t"] = 0
    return {
        "titles": [str(t).strip() for t in data.get("titles") or []][: publish.title_variants],
        "description": strip_timestamps(str(data.get("description") or "")),
        "tags": [str(t).strip() for t in data.get("tags") or []][: publish.tags_count],
        "chapters": chapters_out,
        "thumbnails": [t for t in data.get("thumbnails") or [] if isinstance(t, dict) and t.get("prompt")],
    }


#: A line that is a time code entry: "00:00 — Intro", "1:38 Title", "(12:05) - ...".
_TIMESTAMP_LINE = re.compile(r"^\s*[-•*▪]?\s*\(?\d{1,2}:\d{2}(?::\d{2})?\)?(?:\s|[—–:|-]|$)")
_TIMESTAMP_HEADING = re.compile(r"^\s*(таймкоды|тайм-коды|главы|содержание|chapters|timestamps|contents)\s*:?\s*$", re.I)


def strip_timestamps(text: str) -> str:
    """Remove time code lists the LLM may write into a description (real chapters are added separately)."""
    lines = [ln for ln in text.strip().splitlines() if not _TIMESTAMP_LINE.match(ln)]
    lines = [ln for ln in lines if not _TIMESTAMP_HEADING.match(ln)]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


#: Style/medium/quality words that would fight the channel's thumbnail style.
_STYLE_WORDS = re.compile(
    r"\b(?:hyper[- ]?realistic|photo[- ]?realistic|photorealism|realistic(?: skin)? textures?|realistic|"
    r"photograph(?:ic|y)?|photo|cinematic(?: style| lighting| shot| still)?|highly detailed(?: skin texture|"
    r" facial features)?|detailed skin(?: texture)?|skin texture|8k(?: resolution)?|4k|uhd|hdr|dslr|"
    r"35mm|85mm|bokeh|film grain|octane render|unreal engine|3d render|16:9(?: aspect ratio)?)\b",
    re.I,
)


def strip_style_words(prompt: str) -> str:
    """Thumbnail concept without style words, so the configured thumbnail style wins."""
    text = _STYLE_WORDS.sub("", prompt)
    text = re.sub(r"\s*,\s*(?:,\s*)+", ", ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return re.sub(r"(^[\s,.;-]+)|([\s,;-]+$)", "", text).replace(" ,", ",").strip()


def format_timestamp(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60}:{s % 60:02d}"


def build_description(meta: dict[str, Any], publish: PublishSettings) -> str:
    """Full description text: body + chapters (YouTube needs ≥3, first at 0:00) + footer."""
    parts = [strip_timestamps(meta.get("description", ""))]
    chapters = meta.get("chapters") or []
    if publish.with_chapters and len(chapters) >= 3:
        parts.append("\n".join(f"{format_timestamp(c['t'])} {c['title']}" for c in chapters))
    if publish.description_footer.strip():
        parts.append(publish.description_footer.strip())
    return "\n\n".join(p for p in parts if p)
