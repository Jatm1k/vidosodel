"""LLM tasks of the pipeline (all through FastGen chat completions).

* :func:`visual_bible` – consistent look of characters/places for the whole video.
* :func:`scene_prompts` – one English image prompt per scene, in batches.
* :func:`soften_prompt` – rephrase a prompt rejected by a content filter.
* :func:`translate_script` – paragraph-aligned translation of a script.
* :func:`publish_metadata` – titles, description, tags, chapters, thumbnail ideas.
"""
from __future__ import annotations

import json
import logging
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
- Do NOT add art-style words (photorealistic, oil painting...) – the style is appended automatically.
- {safe}
Answer ONLY with JSON: {{"prompts": [{{"id": <scene id>, "prompt": "<text>"}}, ...]}}"""


def scene_prompts(
    fg: FastgenClient,
    scenes: Sequence[tuple[int, str]],
    *,
    bible: str,
    llm: LlmSettings,
    batch_size: int = 30,
    progress: Callable[[float], None] | None = None,
    should_stop: Callable[[], bool] | None = None,
    on_batch: Callable[[dict[int, str]], None] | None = None,
) -> dict[int, str]:
    """Generate prompts for ``(scene_id, text)`` pairs. Returns ``{scene_id: prompt}``.

    ``on_batch`` is called after every batch so results are persisted
    incrementally (a long video is ~50 requests).
    """
    system = _PROMPT_SYSTEM.format(safe=SAFE_RULES)
    result: dict[int, str] = {}
    previous: list[str] = []
    for start in range(0, len(scenes), batch_size):
        if should_stop and should_stop():
            break
        batch = list(scenes[start:start + batch_size])
        header = (
            f"{_niche(llm)}"
            f"{('Additional instructions: ' + llm.prompt_instructions + chr(10)) if llm.prompt_instructions else ''}"
            f"VISUAL BIBLE:\n{bible or '(none)'}\n\n"
        )
        context = "\n".join(f"- {p}" for p in previous[-3:])
        if context:
            header += f"Previous prompts (for continuity, do not repeat):\n{context}\n\n"
        got = _prompts_resilient(fg, system, header, batch, llm, should_stop)
        result.update(got)
        if on_batch and got:
            on_batch(got)
        previous.extend(got[sid] for sid, _ in batch if sid in got)
        if progress:
            progress(min(1.0, (start + len(batch)) / len(scenes)))
    return result


def _prompts_resilient(
    fg: FastgenClient, system: str, header: str, batch: list[tuple[int, str]], llm: LlmSettings,
    should_stop: Callable[[], bool] | None, depth: int = 0,
) -> dict[int, str]:
    """Prompts for a batch that never fails as a whole.

    The chat backend occasionally returns an empty, truncated or non-JSON
    answer. Whatever was parsed is kept; the rest is retried in halves
    (smaller answers are far less likely to break). Scenes that still fail
    are skipped – the job reports them and "create missing" fills them later.
    """
    if not batch or (should_stop and should_stop()):
        return {}
    got: dict[int, str] = {}
    try:
        got = _prompts_batch(fg, system, header, batch, llm)
    except ApiError as exc:
        log.warning("prompt batch of %d failed: %s", len(batch), exc)
    missing = [(sid, text) for sid, text in batch if sid not in got]
    if not missing:
        return got
    if depth >= 4:
        log.warning("skipping %d scenes without prompts after retries", len(missing))
        return got
    if len(missing) == 1 or not got and len(missing) <= 2:
        # Single scenes: one more plain retry.
        return got | _prompts_resilient(fg, system, header, missing, llm, should_stop, depth + 1)
    mid = len(missing) // 2
    for part in (missing[:mid], missing[mid:]):
        got |= _prompts_resilient(fg, system, header, part, llm, should_stop, depth + 1)
    return got


def _prompts_batch(fg: FastgenClient, system: str, header: str, batch: list[tuple[int, str]],
                   llm: LlmSettings) -> dict[int, str]:
    """One LLM request. Accepts partial/truncated JSON: every complete ``{id, prompt}`` object counts."""
    ids = {sid for sid, _ in batch}
    user = header + "SCENES:\n" + "\n".join(f"[{sid}] {text}" for sid, text in batch)
    text = fg.chat([{"role": "system", "content": system}, {"role": "user", "content": user}],
                   model=llm.model, temperature=llm.temperature)
    out: dict[int, str] = {}
    for it in iter_json_objects(text):
        try:
            sid, prompt = int(it["id"]), str(it["prompt"]).strip()
        except (KeyError, TypeError, ValueError):
            continue
        if sid in ids and prompt:
            out[sid] = prompt
    if not out:
        log.warning("LLM answer without usable prompts (%d chars): %r", len(text), text[:400])
    return out


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
        "no hashtag spam (max 3 hashtags at the end). Tags: relevant search phrases. "
        "Chapters: pick 5–12 moments ONLY from the candidate list (use their seconds), first must be 0. "
        "Thumbnail concepts: English image prompts for a 16:9 thumbnail (one strong focal subject, emotion, "
        f"contrast) and a 2–4 word headline in {name}. "
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
        "description": str(data.get("description") or "").strip(),
        "tags": [str(t).strip() for t in data.get("tags") or []][: publish.tags_count],
        "chapters": chapters_out,
        "thumbnails": [t for t in data.get("thumbnails") or [] if isinstance(t, dict) and t.get("prompt")],
    }


def format_timestamp(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60}:{s % 60:02d}"


def build_description(meta: dict[str, Any], publish: PublishSettings) -> str:
    """Full description text: body + chapters (YouTube needs ≥3, first at 0:00) + footer."""
    parts = [meta.get("description", "").strip()]
    chapters = meta.get("chapters") or []
    if publish.with_chapters and len(chapters) >= 3:
        parts.append("\n".join(f"{format_timestamp(c['t'])} {c['title']}" for c in chapters))
    if publish.description_footer.strip():
        parts.append(publish.description_footer.strip())
    return "\n\n".join(p for p in parts if p)
