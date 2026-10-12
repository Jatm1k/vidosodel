"""Packaging of a video for YouTube: title, thumbnail (headline + picture) and description.

A click is decided by the title and the thumbnail, and the viewer reads them as ONE message. One request
"write me everything" gives an average everything, so the work is split like a human packaging editor does it:

1. :func:`build_brief` – what the video really promises: viewer, pain, hard facts, numbers, search phrases.
2. :func:`make_titles` – many candidates over proven formulas → harsh critic → the best are sharpened →
   critic again. Hard rules (length, caps, duplicates, figurative language) are enforced in code.
3. :func:`make_description` – hook, what the viewer gets, tags, chapters; the layout is assembled by code so
   no stray English headings appear and the first lines carry the keyword.
4. :func:`thumbnail_concepts` – many (headline, picture) pairs for the FIXED title → critic → best ones.
"""
from __future__ import annotations

import logging
import re
from typing import Any

from ..services.fastgen import FastgenClient
from ..services.http import ApiError
from ..settings_schema import LlmSettings, PublishSettings
from .languages import language_name
from .llm_tasks import _niche, strip_timestamps

log = logging.getLogger(__name__)

#: Titles longer than this are cut off in the mobile feed.
TITLE_SOFT_MAX = 60
TITLE_HARD_MAX = 70
TITLE_MIN = 12
#: Headline on a thumbnail: readable at 170 px only when it is this short.
HEADLINE_MAX_WORDS = 5
HEADLINE_MAX_CHARS = 32


def _chat(fg: FastgenClient, system: str, user: str, llm: LlmSettings, temperature: float) -> Any:
    return fg.chat_json([{"role": "system", "content": system}, {"role": "user", "content": user}],
                        model=llm.model, temperature=temperature)


def _clean_line(text: Any) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


# ------------------------------------------------------------------------------ brief
_BRIEF_SYSTEM = """You are a YouTube packaging editor. Before titles and thumbnails are made you read the \
whole video script and write a BRIEF: what this video really gives the viewer, in hard facts.
Write all text values in {language} (the language of the video). Use ONLY what is in the script – never \
invent facts, numbers or names.
The AUTHOR'S TITLE (if given) is the idea the whole script was written from: it defines the video's \
subject and promise. Everything is derived from it; the script only shows how it is covered. A video is \
about its WHOLE idea – never about one chapter, example, quote or episode of it.
Answer ONLY with JSON:
{{"premise": "the one umbrella idea/promise of the WHOLE video, one sentence – the author's title restated \
plainly (or, without an author's title, what the whole script is about)",
"scope": ["3-8 short items: the parts / questions / aspects the video covers, in order – so a title can be \
checked against the whole"],
"topic": "what exactly the video is about, one plain sentence",
"viewer": "who watches it and in which concrete situation they are, one sentence",
"pain": "what bothers this viewer, in their own words, one sentence",
"promise": "the concrete thing the viewer gets / understands / can do after watching, one sentence",
"main_claim": "the central, ideally counter-intuitive statement of the video, one sentence",
"misconception": "the common belief the video overturns, or an empty string",
"stakes": "what happens if the viewer ignores it, or an empty string",
"hard_facts": ["5-8 concrete facts: numbers, names, named effects, specific actions – only SUPPORTING \
details of single parts, not the subject of the video"],
"search_phrases": ["6-10 phrases a person would really type into YouTube search to find this video"],
"main_keyword": "the single most important search phrase, 2-4 words"}}"""


def build_brief(fg: FastgenClient, script: str, language: str, llm: LlmSettings,
                working_title: str = "") -> dict[str, Any]:
    """Facts that titles, thumbnails and the description are built from (one read of the whole script).

    ``working_title`` – the title the author typed for the project; the script was written from it.
    """
    system = _BRIEF_SYSTEM.format(language=language_name(language))
    own = f"AUTHOR'S TITLE: {working_title.strip()}\n\n" if working_title.strip() else ""
    user = f"{_niche(llm)}{own}SCRIPT:\n{script[:100_000]}"
    data = _chat(fg, system, user, llm, 0.3)
    if not isinstance(data, dict):
        raise ValueError("LLM вернул бриф в неверном формате")
    brief: dict[str, Any] = {"working_title": working_title.strip()}
    brief["premise"] = _clean_line(data.get("premise"))
    scope = data.get("scope")
    brief["scope"] = [_clean_line(x) for x in scope if _clean_line(x)][:8] if isinstance(scope, list) else []
    for key in ("topic", "viewer", "pain", "promise", "main_claim", "misconception", "stakes", "main_keyword"):
        brief[key] = _clean_line(data.get(key))
    for key in ("hard_facts", "search_phrases"):
        items = data.get(key)
        brief[key] = [_clean_line(x) for x in items if _clean_line(x)][:10] if isinstance(items, list) else []
    return brief


def _brief_text(brief: dict[str, Any]) -> str:
    lines = []
    if brief.get("working_title"):
        lines.append(f"AUTHOR'S TITLE (the idea of the whole video): {brief['working_title']}")
    if brief.get("premise"):
        lines.append(f"Premise of the WHOLE video: {brief['premise']}")
    if brief.get("scope"):
        lines.append("The video covers: " + "; ".join(brief["scope"]))
    lines += [
        f"Topic: {brief.get('topic', '')}",
        f"Viewer: {brief.get('viewer', '')}",
        f"Viewer's pain: {brief.get('pain', '')}",
        f"Promise: {brief.get('promise', '')}",
        f"Main claim: {brief.get('main_claim', '')}",
    ]
    if brief.get("misconception"):
        lines.append(f"Common misconception it overturns: {brief['misconception']}")
    if brief.get("stakes"):
        lines.append(f"Stakes: {brief['stakes']}")
    if brief.get("hard_facts"):
        lines.append("Supporting facts of single parts (details, NOT the subject of a title):\n" + "\n".join(f"- {f}" for f in brief["hard_facts"]))
    if brief.get("search_phrases"):
        lines.append("Search phrases: " + "; ".join(brief["search_phrases"]))
    if brief.get("main_keyword"):
        lines.append(f"Main keyword: {brief['main_keyword']}")
    return "\n".join(lines)


# ----------------------------------------------------------------------------- titles
_TITLE_RULES = """HARD RULES
0. THE TITLE PROMISES THE WHOLE VIDEO. Start from the AUTHOR'S TITLE / the premise in the brief: your \
title is a sharper, more clickable version of THAT idea, with the same subject and the same scope. Never \
build a title on one chapter, one example, one quote or one fact of the script – the viewer would expect \
only that and find much more (or something else). Facts and numbers may sharpen the title only when they \
describe the whole video (e.g. the total count of reasons/steps the video gives).
1. Concrete, literal, plain speech. NO metaphors, similes, poetic or philosophical wording. Abstract nouns \
(secret, mystery, journey, path, power, magic, essence, truth about, world of, silence of the soul...) must \
not do the work – name the real thing instead: the real symptom, number, object, name, action, consequence.
2. The curiosity comes from a SPECIFIC thing the viewer does not know yet (a number, a reason, a mechanism, \
a consequence), never from vagueness. The viewer must understand in one second what exactly they will learn.
3. Honest: everything the title promises is really covered by the brief. Use real numbers, names, terms.
4. Speak the viewer's own words: the search phrases, their situation; address them directly («you») when it \
sounds natural in the language.
5. Length 35–60 characters, hard max 65. The strongest words and the main keyword are in the first 40 characters.
6. No ALL CAPS words, no emoji, no hashtags, no trailing period, no quotes around the whole title, no clickbait \
filler («shocking», «you won't believe», «TOP»). At most one colon or dash.
7. Natural {language}, as a native YouTuber says it – not a translation from English."""

_TITLE_FORMULAS = """FORMULAS – every candidate uses a different one, at least 7 different formulas overall. \
Examples are Russian ONLY to show the pattern; write in {language}:
- number: a count or quantity from the brief – «5 причин, почему ничего не хочется после 50»
- question: a direct question about the viewer's real situation – «Почему вы устаёте, ничего не делая?»
- myth: the belief and its reversal – «Это не лень: что на самом деле происходит с мозгом»
- consequence: what happens – «Что будет, если годами подавлять эмоции»
- how: a concrete result without the obstacle – «Как вернуть интерес к жизни без силы воли»
- promise: the author's idea as a direct benefit for the viewer – «Почему ничего не хочется после 50 и что с этим делать»
- recognition: the viewer recognises themselves – «Если вам ничего не хочется — это сигнал, а не лень»
- warning: do/stop doing – «Перестаньте так делать, если устаёте без причины»
BAD (abstract, poetic, tells nothing): «Тишина внутри: когда душа молчит», «Тайна пустоты», «Путь к себе», \
«Невидимый груз прошлого», «Магия перемен»."""

_TITLES_SYSTEM = """You are the best YouTube packaging editor in the {language}-speaking segment. People \
click your titles because the title names a concrete thing they care about – not because it sounds clever.
A title wins when in ONE second the viewer thinks «that's about me / that's what I wonder about» AND \
understands exactly what they get.

{rules}

{formulas}

Write {count} candidates. Answer ONLY with JSON:
{{"candidates": [{{"title": "...", "formula": "number|question|myth|consequence|how|promise|recognition|warning"}}]}}"""

_JUDGE_SYSTEM = """You are a ruthless YouTube title critic who knows real click-through data. Score every \
candidate title for the video described in the BRIEF. Be strict: an average decent title gets 5–6, 8+ is rare.
For each give integers 0–10:
- specificity: names a concrete thing, number or situation (0 if the title could fit 10 other videos)
- curiosity: a specific unanswered question the viewer wants closed (0 if vague or if the title gives the answer away)
- clarity: understood in one second, without context, by a stranger
- pull: emotional relevance to THIS viewer – pain, desire, fear, surprise
- honest: 10 if the promise is fully covered by the brief, 0 if it is invented or exaggerated
- coverage: 10 if the title promises the WHOLE video (the author's idea and its full scope); 0 if it \
is built on one part, example or detail so that the viewer would expect only that and the rest of the \
video is not mentioned
and booleans/text:
- figurative: true if the title uses a metaphor, poetry, a philosophical or abstract word instead of the real thing
- weakness: the single most important thing to fix, up to 12 words
Answer ONLY with JSON: {"scores": [{"i": <index>, "specificity": 0, "curiosity": 0, "clarity": 0, "pull": 0, \
"honest": 0, "coverage": 0, "figurative": false, "weakness": "..."}]}"""

_REFINE_SYSTEM = """You sharpen YouTube titles. You get titles with the weakness a critic found in each. \
For every title write 2 improved versions that remove the weakness, keep the same true fact and obey the rules.

{rules}

Answer ONLY with JSON: {{"titles": [{{"from": <index>, "title": "..."}}]}}"""

_EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿️]")


def title_problem(title: str) -> str | None:
    """Why a title is rejected by the hard rules (None when it passes)."""
    if len(title) < TITLE_MIN:
        return "too short"
    if len(title) > TITLE_HARD_MAX:
        return "too long"
    if _EMOJI.search(title) or "#" in title:
        return "emoji or hashtag"
    letters = [w for w in re.findall(r"[^\W\d_]{4,}", title)]
    if letters and sum(1 for w in letters if w.isupper()) / len(letters) > 0.34:
        return "caps"
    return None


def _norm_words(text: str) -> set[str]:
    """Words cut to a 5-letter stem: «причины»/«причин» count as the same word."""
    return {w[:5] for w in re.findall(r"[^\W_]{3,}", text.lower())}


def _similar(a: str, b: str, threshold: float = 0.6) -> bool:
    wa, wb = _norm_words(a), _norm_words(b)
    return bool(wa and wb) and len(wa & wb) / min(len(wa), len(wb)) >= threshold


def _clean_title(raw: Any) -> str:
    t = _clean_line(raw).strip('«»"“” ').rstrip(".")
    return t


def _judge_titles(fg: FastgenClient, brief: dict[str, Any], titles: list[str], llm: LlmSettings) -> list[dict[str, Any]]:
    """Critic pass: ``[{"title", "total", "figurative", "weakness", ...}]`` in the order of ``titles``."""
    listing = "\n".join(f"{i}: {t}" for i, t in enumerate(titles))
    data = _chat(fg, _JUDGE_SYSTEM, f"BRIEF:\n{_brief_text(brief)}\n\nCANDIDATES:\n{listing}", llm, 0.2)
    items = data.get("scores") if isinstance(data, dict) else data
    by_index: dict[int, dict[str, Any]] = {}
    for it in items or []:
        try:
            by_index[int(it["i"])] = it
        except (KeyError, TypeError, ValueError):
            continue
    out: list[dict[str, Any]] = []
    for i, title in enumerate(titles):
        it = by_index.get(i)
        if not it:
            continue

        def num(key: str, it: dict[str, Any] = it) -> float:
            try:
                return max(0.0, min(10.0, float(it.get(key, 0))))
            except (TypeError, ValueError):
                return 0.0
        total = (0.30 * num("specificity") + 0.25 * num("curiosity") + 0.20 * num("clarity")
                 + 0.15 * num("pull") + 0.10 * num("honest"))
        total += 0.15 * (num("coverage") - 6)  # a title about one part loses, a whole-video title gains
        figurative = bool(it.get("figurative")) and str(it.get("figurative")).lower() != "false"
        if figurative:
            total -= 3
        if len(title) > TITLE_SOFT_MAX:
            total -= 1.5
        out.append({"title": title, "total": round(total, 2), "figurative": figurative,
                    "honest": min(num("honest"), num("coverage") + 2), "weakness": _clean_line(it.get("weakness"))[:120]})
    return out


def make_titles(
    fg: FastgenClient, brief: dict[str, Any], language: str, llm: LlmSettings, count: int,
    avoid: list[str] | None = None,
) -> list[dict[str, Any]]:
    """The best ``count`` titles, strongest first: ``[{"text", "score", "formula"}]``.

    Candidates → critic → the top ones are sharpened by their critique → critic again.
    ``avoid``: titles that were already shown (they are not repeated).
    """
    name = language_name(language)
    system = _TITLES_SYSTEM.format(
        language=name, count=max(14, count * 3), rules=_TITLE_RULES.format(language=name),
        formulas=_TITLE_FORMULAS.format(language=name))
    user = f"{_niche(llm)}BRIEF:\n{_brief_text(brief)}\n"
    if avoid:
        user += "\nALREADY SHOWN – do not repeat or paraphrase:\n" + "\n".join(f"- {t}" for t in avoid[:12])
    data = _chat(fg, system, user, llm, 0.9)
    raw = data.get("candidates") if isinstance(data, dict) else data
    formulas: dict[str, str] = {}
    seen_titles = [t.lower() for t in avoid or []]
    for it in raw or []:
        title = _clean_title(it.get("title") if isinstance(it, dict) else it)
        if not title or title_problem(title) or title.lower() in seen_titles or title in formulas:
            continue
        formulas[title] = _clean_line(it.get("formula") if isinstance(it, dict) else "")[:20]
    if not formulas:
        raise ValueError("Модель не предложила ни одного названия")

    titles = list(formulas)
    scored: list[dict[str, Any]] = []
    try:
        scored = _judge_titles(fg, brief, titles, llm)
    except (ApiError, ValueError) as exc:  # no critic → keep the generator's own order
        log.warning("title critic failed: %s", exc)
    if scored:
        # Sharpen the best ones with the critic's own remarks and judge the new versions too.
        top = sorted((s for s in scored if not s["figurative"] and s["honest"] >= 6),
                     key=lambda s: -s["total"])[:4]
        try:
            if top:
                listing = "\n".join(f"{i}: {s['title']}  ← weakness: {s['weakness'] or 'none'}" for i, s in enumerate(top))
                refine = _chat(fg, _REFINE_SYSTEM.format(rules=_TITLE_RULES.format(language=name)),
                               f"BRIEF:\n{_brief_text(brief)}\n\nTITLES:\n{listing}", llm, 0.7)
                known = {s["title"].lower() for s in scored}
                fresh: list[str] = []
                for it in (refine.get("titles") if isinstance(refine, dict) else None) or []:
                    t = _clean_title(it.get("title") if isinstance(it, dict) else "")
                    if t and not title_problem(t) and t.lower() not in known and t.lower() not in seen_titles:
                        known.add(t.lower())
                        fresh.append(t)
                        try:
                            formulas[t] = formulas.get(top[int(it.get("from", 0))]["title"], "")
                        except (IndexError, TypeError, ValueError):
                            formulas[t] = ""
                if fresh:
                    scored += _judge_titles(fg, brief, fresh, llm)
        except (ApiError, ValueError) as exc:
            log.warning("title refinement failed: %s", exc)
    else:
        scored = [{"title": t, "total": 5.0 - 0.01 * i, "figurative": False, "honest": 10.0, "weakness": ""}
                  for i, t in enumerate(titles)]

    pool = [s for s in scored if not s["figurative"] and s["honest"] >= 6] or scored
    pool.sort(key=lambda s: -s["total"])
    picked: list[dict[str, Any]] = []
    for s in pool:  # strongest first, but no near-duplicates
        if all(not _similar(s["title"], p["text"]) for p in picked):
            picked.append({"text": s["title"], "score": s["total"], "formula": formulas.get(s["title"], "")})
        if len(picked) >= count:
            break
    return picked


# -------------------------------------------------------------------------- description
#: Heading of the bullet list – our own words, so no stray English headings in a foreign language video.
BULLET_HEADINGS = {
    "ru": "В этом видео:", "en": "In this video:", "es": "En este vídeo:", "pt": "Neste vídeo:",
    "de": "In diesem Video:", "fr": "Dans cette vidéo :", "it": "In questo video:", "uk": "У цьому відео:",
    "pl": "W tym filmie:", "tr": "Bu videoda:", "nl": "In deze video:", "sv": "I den här videon:",
    "da": "I denne video:", "fi": "Tässä videossa:", "cs": "V tomto videu:", "sk": "V tomto videu:",
    "ro": "În acest videoclip:", "bg": "В това видео:", "hr": "U ovom videu:", "el": "Σε αυτό το βίντεο:",
    "id": "Dalam video ini:", "ms": "Dalam video ini:", "fil": "Sa video na ito:",
}
_NON_LATIN = {"ru", "uk", "bg", "el", "ar", "hi", "ta", "ja", "ko", "zh"}
#: English headings an LLM likes to put into a description of a video in another language.
_ENGLISH_HEADING = re.compile(
    r"^\s*[-•*▪]?\s*(?:key\s*points?|key\s*takeaways?|main\s*points?|highlights?|what\s+you(?:'|’)ll\s+learn|"
    r"in\s+this\s+video|summary|takeaways?)\s*:?\s*$", re.I)

_DESCRIPTION_SYSTEM = """You write the description of a YouTube video and its tags. Write EVERYTHING in \
{language}, the language of the video – not a single English word, heading or label (except brand names \
that are in the script).
Answer ONLY with JSON:
{{"hook": "the first 1–2 sentences, they are shown in search results: the main keyword and the concrete \
promise of the video right away, max 150 characters in the first sentence; no «in this video we will \
consider» clichés, no greeting",
"about": "2–3 sentences: what exactly is analysed, which facts or cases, who it is for",
"bullets": ["3–6 short concrete items – what the viewer will learn or understand, each up to 90 characters, \
no numbering, no dashes"],
"tags": ["{tags} YouTube tags: the main keyword first, then search phrases and long-tail queries people \
type; 1–4 words each, no #"],
"hashtags": ["up to 3 hashtags without #, the most relevant topics"],
"chapters": [{{"t": 0, "title": "chapter title, up to 60 characters, says what is in it"}}]}}
Chapters: pick 5–12 moments ONLY from the candidate list (use their seconds exactly), the first is 0. NEVER \
write time codes or a chapter list into hook, about or bullets."""


def foreign_words(text: str, language: str, known: str = "") -> list[str]:
    """Latin words in a text of a non-Latin-script language that are not in ``known`` (script, title)."""
    if language not in _NON_LATIN:
        return []
    known_l = known.lower()
    out: list[str] = []
    for w in re.findall(r"[A-Za-z]{3,}", re.sub(r"https?://\S+", " ", text)):
        if w.lower() not in known_l and w.lower() not in out:
            out.append(w.lower())
    return out


def localize_headings(text: str, language: str) -> str:
    """English list headings («Key points:») of a non-English description → the heading of its language."""
    if language == "en":
        return text
    heading = BULLET_HEADINGS.get(language)
    lines = []
    for ln in text.splitlines():
        if _ENGLISH_HEADING.match(ln):
            if heading:
                lines.append(heading)
            continue
        lines.append(ln)
    return "\n".join(lines)


def make_description(
    fg: FastgenClient, brief: dict[str, Any], title: str, language: str, chapters: list[tuple[float, str]],
    llm: LlmSettings, publish: PublishSettings, script_head: str = "",
) -> dict[str, Any]:
    """Description parts, tags, hashtags and chapters (the layout is assembled by ``build_description``)."""
    name = language_name(language)
    system = _DESCRIPTION_SYSTEM.format(language=name, tags=publish.tags_count)
    chapter_lines = "\n".join(f"{int(t)}s: {text[:160]}" for t, text in chapters)
    user = (f"{_niche(llm)}VIDEO TITLE: {title}\n\nBRIEF:\n{_brief_text(brief)}\n\n"
            f"CHAPTER CANDIDATES (seconds: paragraph start):\n{chapter_lines}\n\n"
            f"SCRIPT BEGINNING:\n{script_head[:3_000]}")
    data = _chat(fg, system, user, llm, 0.6)
    if not isinstance(data, dict):
        raise ValueError("LLM вернул описание в неверном формате")

    known = f"{script_head} {title} {_brief_text(brief)}"

    def collect(d: dict[str, Any]) -> dict[str, Any]:
        bullets = d.get("bullets")
        return {
            "hook": strip_timestamps(str(d.get("hook") or "")),
            "about": strip_timestamps(str(d.get("about") or "")),
            "bullets": [_clean_line(b).lstrip("-•*▪— ").strip() for b in bullets if _clean_line(b)][:7]
            if isinstance(bullets, list) else [],
        }
    parts = collect(data)
    flat = " ".join([parts["hook"], parts["about"], *parts["bullets"]])
    bad = foreign_words(flat, language, known)
    if bad:  # a foreign word in a Cyrillic text – ask once to rewrite instead of shipping it
        fixed = _chat(
            fg, system,
            user + f"\n\nYour previous answer contained foreign words ({', '.join(bad[:8])}). Rewrite hook, "
                   f"about and bullets entirely in {name}, translating every such word.", llm, 0.4)
        if isinstance(fixed, dict):
            again = collect(fixed)
            flat2 = " ".join([again["hook"], again["about"], *again["bullets"]])
            if again["hook"] and len(foreign_words(flat2, language, known)) < len(bad):
                parts, data = again, {**data, **{k: fixed[k] for k in ("tags", "hashtags") if k in fixed}}

    # Whatever still carries a foreign word after the rewrite is cut: a clean list beats a broken one.
    parts["bullets"] = [b for b in parts["bullets"] if not foreign_words(b, language, known)]

    valid_t = {int(t) for t, _ in chapters}
    chapters_out: list[dict[str, Any]] = []
    for ch in data.get("chapters") or []:
        try:
            t = int(ch["t"])
        except (KeyError, TypeError, ValueError):
            continue
        if t in valid_t or t == 0:
            chapters_out.append({"t": t, "title": _clean_line(ch.get("title"))})
    chapters_out.sort(key=lambda c: c["t"])
    if chapters_out and chapters_out[0]["t"] != 0:
        chapters_out[0]["t"] = 0

    tags: list[str] = []
    for t in data.get("tags") or []:
        t = _clean_line(t).lstrip("#")
        if t and t.lower() not in {x.lower() for x in tags}:
            tags.append(t)
    hashtags = ["".join(w[:1].upper() + w[1:] for w in re.findall(r"[^\W_]+", str(h)))
                for h in data.get("hashtags") or []]
    heading = BULLET_HEADINGS.get(language, "")
    return {
        **parts,
        "bullets_heading": heading,
        "tags": tags[: publish.tags_count],
        "hashtags": [h for h in hashtags if h][:3],
        "chapters": chapters_out,
        # Flat text kept in ``description`` for old consumers; the full text is built from the parts.
        "description": "\n\n".join(p for p in [parts["hook"], parts["about"]] if p),
    }


# ----------------------------------------------------------------------------- thumbnails
_THUMB_SYSTEM = """You are a senior YouTube thumbnail art director. The TITLE is fixed. A thumbnail is seen \
for half a second at 170 px width next to the title, so it has exactly two jobs: ONE short text and ONE \
picture, and together with the title they must read as one thought.

THE TEXT («headline», in {language})
- It ADDS what the title does not say: a number from the brief, a verdict, a contradiction, the stake, the \
consequence, a recognition of the viewer's situation, a pointed short question. Never repeat or paraphrase the title.
- It expresses the core claim / premise of the WHOLE video (the idea of the title): its verdict, contrast, stake or consequence. Never a detail, number or quote of one single part of the script – a number only if it describes the whole video.
- It only states what the BRIEF really says: a fact, number or claim of this video – never an invented detail, never a word the video does not support.
- It is CONCRETE and specific to THIS video. Test: if the same text fits thumbnails of 10 other videos – \
throw it away. Never a single abstract word («Shock», «Truth», «Secret», «Important», «Watch»), never a \
generic hook («This changes everything», «You won't believe it»), never a vague rhetorical question.
- 1–4 words, at most {max_chars} characters in total, native {language}, no emoji, no trailing period, \
written in normal case (capitals are applied later). A strong shape: a verdict «НЕ ЛЕНЬ», a number «7 ПРИЗНАКОВ», \
a contrast «НЕ X — А Y», the cost «−10 ЛЕТ».
- «accent»: the ONE word of the headline that carries the hook (it is highlighted); a number if there is one.

THE PICTURE («prompt», in English, 40–80 words)
- LITERAL. One focal subject doing or showing the thing the headline is about, so the picture alone already \
raises the question: a recognisable person in a recognisable situation with a large readable emotion, or a \
real object in the state that shows the problem.
- NO metaphors and no abstraction: no brains made of gears or circuit boards, no light bulbs, chains, \
hourglasses, glowing orbs, silhouettes filled with objects, surreal collages, floating symbols.
- At most ONE simple universal supporting icon (arrow, red cross, low battery, question mark, clock) and \
only when it states the point directly. At most 3 elements overall, a simple uncluttered background.
- Show the premise of the WHOLE video as in the title – not one chapter, example or anecdote of the script. Use accurate details from the brief (real objects, situations) only to make it concrete.
- The subject sits on ONE side of the frame and fills about half of it; the other ~45% is calm empty \
background, because the headline is placed there. «side» = the side where the SUBJECT is: "left" or "right".
- The art style is FIXED, MANDATORY and added automatically: «{style}». It decides colour, background, \
lighting and rendering. Never name colours, lighting, style, medium or camera words in the prompt and never \
contradict the style: for a cartoon style describe cartoon characters, not real people. The prompt does NOT \
contain the headline text and no letters or numbers on objects.

FINAL CHECK for every concept: a stranger sees only the picture + headline and then reads the title – is it \
one idea about the video's core? If not, redo it.
Candidates must differ from each other in headline hook AND in picture.

Write {count} candidates. Answer ONLY with JSON, fields in this order (the chain of thought):
{{"thumbnails": [{{"hook_type": "number|verdict|contrast|stake|recognition|question", "headline": "...", \
"accent": "...", "adds_to_title": "what the headline says that the title does not, one English sentence", \
"subject": "what the picture shows, 2–8 English words", "side": "left|right", "prompt": "..."}}]}}"""

_THUMB_JUDGE_SYSTEM = """You are a ruthless YouTube thumbnail critic who knows real click-through data. \
Score each candidate (headline text + picture idea) for the given TITLE and BRIEF. Be strict: average = 5–6, \
8+ is rare. Integers 0–10:
- text_specific: the headline is concrete and could ONLY belong to this video (0 if it fits any video)
- text_hook: it makes the viewer want to know more in half a second
- adds: it complements the title with something new instead of repeating it
- picture_literal: the picture shows a real, recognisable subject/situation (0 if metaphor or abstraction)
- picture_instant: understood at 170 px in one second, one focal point, strong emotion or contrast
- grounded: every claim of the headline and every detail of the picture is really in the BRIEF (0 if the headline states something the video does not say, names things that are not in it, or is only a detail of one part of the video instead of its whole premise)
- coherence: picture + headline + title read as ONE thought
and booleans: "abstract" (true if the picture relies on a metaphor, symbol or abstraction), "generic" (true \
if the headline would fit other videos).
Answer ONLY with JSON: {"scores": [{"i": <index>, "text_specific": 0, "text_hook": 0, "adds": 0, \
"picture_literal": 0, "picture_instant": 0, "grounded": 0, "coherence": 0, "abstract": false, "generic": false}]}"""


def _thumb_headline_ok(headline: str) -> bool:
    return bool(headline) and len(headline.split()) <= HEADLINE_MAX_WORDS and len(headline) <= HEADLINE_MAX_CHARS


def thumbnail_concepts(
    fg: FastgenClient, brief: dict[str, Any], script_head: str, language: str, title: str, llm: LlmSettings,
    publish: PublishSettings, count: int, avoid: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """The best ``count`` thumbnail ideas for ``title``.

    Each idea is ``{"prompt", "headline", "accent", "side", "subject", "angle", "title", "title_index", "score"}``.
    ``avoid`` are ideas that were already shown (kept or rejected): new ones differ in headline and picture.
    """
    name = language_name(language)
    wanted = max(count * 3, 6)
    system = _THUMB_SYSTEM.format(language=name, max_chars=HEADLINE_MAX_CHARS, count=wanted,
                                  style=publish.thumbnail_style.strip())
    user = f"{_niche(llm)}TITLE: {title}\n\nBRIEF:\n{_brief_text(brief)}\n"
    shown = [a for a in avoid or [] if a.get("headline") or a.get("prompt")]
    if shown:
        user += ("\nALREADY MADE – a new idea must not repeat or paraphrase their headline or picture:\n"
                 + "\n".join(f"- «{a.get('headline', '')}» / {a.get('subject') or str(a.get('prompt', ''))[:120]}"
                             for a in shown[:12]) + "\n")
    if script_head.strip():
        user += f"\nSCRIPT BEGINNING (only a source of accurate details, not a menu of scenes):\n{script_head[:4_000]}"
    data = _chat(fg, system, user, llm, 0.9)
    items = data.get("thumbnails") if isinstance(data, dict) else data

    avoid_heads = {_clean_line(a.get("headline")).lower() for a in shown}
    cands: list[dict[str, Any]] = []
    for it in items or []:
        if not isinstance(it, dict) or not str(it.get("prompt", "")).strip():
            continue
        headline = re.sub(r"[«»“”\"]", "", re.sub(r"\s+", " ", str(it.get("headline") or ""))).strip().rstrip(".")
        if not _thumb_headline_ok(headline) or headline.lower() in avoid_heads:
            continue
        if _similar(headline, title, 0.8) and len(headline.split()) > 1:
            continue  # repeats the title
        accent = _clean_line(it.get("accent")).strip('"«»“” .')
        side = "left" if str(it.get("side", "")).strip().lower().startswith("l") else "right"
        cands.append({
            "prompt": str(it["prompt"]).strip(),
            "headline": headline,
            "accent": accent if accent and accent.lower() in headline.lower() else "",
            "side": side,
            "subject": _clean_line(it.get("subject"))[:80],
            "angle": _clean_line(it.get("hook_type"))[:30],
            "title": title,
            "title_index": 0,
        })
    if not cands:
        return []

    scores: dict[int, dict[str, Any]] = {}
    try:
        listing = "\n".join(f"{i}: headline «{c['headline']}» / picture: {c['prompt']}" for i, c in enumerate(cands))
        judged = _chat(fg, _THUMB_JUDGE_SYSTEM,
                       f"TITLE: {title}\n\nBRIEF:\n{_brief_text(brief)}\n\nCANDIDATES:\n{listing}", llm, 0.2)
        for s in (judged.get("scores") if isinstance(judged, dict) else judged) or []:
            try:
                scores[int(s["i"])] = s
            except (KeyError, TypeError, ValueError):
                continue
    except (ApiError, ValueError) as exc:
        log.warning("thumbnail critic failed: %s", exc)

    def total(i: int) -> float:
        s = scores.get(i)
        if not s:
            return 5.0 - 0.01 * i  # unjudged: keep the generator's order
        def num(k: str) -> float:
            try:
                return max(0.0, min(10.0, float(s.get(k, 0))))
            except (TypeError, ValueError):
                return 0.0
        value = (0.18 * num("text_specific") + 0.16 * num("text_hook") + 0.08 * num("adds")
                 + 0.16 * num("picture_literal") + 0.12 * num("picture_instant") + 0.12 * num("coherence")
                 + 0.18 * num("grounded"))
        if num("grounded") < 5:  # invented claim – never wins over a grounded idea
            value -= 4
        for flag in ("abstract", "generic"):
            if s.get(flag) is True or str(s.get(flag)).lower() == "true":
                value -= 2.5
        return value

    order = sorted(range(len(cands)), key=lambda i: -total(i))
    picked: list[dict[str, Any]] = []
    for i in order:
        c = cands[i]
        # a different text AND a different picture from the already chosen ones
        if any(_similar(c["headline"], p["headline"], 0.5)
               or (c["subject"] and p["subject"] and _similar(c["subject"], p["subject"], 0.7)) for p in picked):
            continue
        c["score"] = round(total(i), 2)
        picked.append(c)
        if len(picked) >= count:
            break
    return picked
