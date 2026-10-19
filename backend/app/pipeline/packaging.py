"""Packaging of a video for YouTube: title, thumbnail (headline + picture) and description.

A click is decided by the title and the thumbnail, and the viewer reads them as ONE message. One request
"write me everything" gives an average everything, so the work is split like a human packaging editor does it:

1. :func:`build_brief` – what the video really promises: viewer, pain, hard facts, numbers, search phrases.
2. :func:`make_titles` – many candidates over proven formulas → harsh critic → the best are sharpened →
   critic again. Hard rules (length, caps, duplicates, figurative language) are enforced in code.
3. :func:`make_description` – hook, what the viewer gets, tags, chapters; the layout is assembled by code so
   no stray English headings appear and the first lines carry the keyword.
4. :func:`thumbnail_concepts` – packages: the thumbnail (headline + picture) raises a question, its own title
   answers «what is it, why me» → a critic plays the viewer in these two steps → best ones.
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
"hidden_cause": "the non-obvious real reason behind the viewer's problem that the video names, or an empty string",
"viewer_mistake": "what the viewer is doing wrong right now without knowing it, or an empty string",
"emotion": "the strongest emotion this topic touches in the viewer (fear, regret, shame, hope, anger, relief...) \
and why, one sentence",
"curiosity_hooks": ["3-6 things the video reveals that the viewer does NOT expect or cannot guess – surprising, \
counter-intuitive or little-known; each one short sentence, about the main idea, not a side detail"],
"hard_facts": ["5-8 concrete facts: numbers, names, named effects, specific actions – only SUPPORTING \
details of single parts, not the subject of the video"],
"format": "list|story|explanation|other – how the video is built: list = it goes through N separate items \
(things, habits, mistakes, rules, signs...)",
"item_count": "the number of items when format is list, else 0 – digits only",
"after_state": "what concretely changes in the viewer's life or understanding AFTER the video, in the terms \
of THIS video, one sentence",
"confession": "one first-person sentence a character of this video could say about its core change or \
discovery, in the video's own concrete terms",
"visual_material": ["6-10 concrete VISUAL things that only THIS video has and a picture can show: real \
people it is about (with their recognisable look), places, objects, scenes, situations, numbers made \
visible – taken from the script, each a short English phrase. Not generic «a person feeling X»"],
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
    for key in ("topic", "viewer", "pain", "promise", "main_claim", "misconception", "stakes", "hidden_cause",
                "viewer_mistake", "emotion", "main_keyword", "format", "after_state", "confession"):
        brief[key] = _clean_line(data.get(key))
    count = re.search(r"\d+", str(data.get("item_count") or ""))
    brief["item_count"] = int(count.group()) if count and brief["format"].lower() == "list" else 0
    for key in ("curiosity_hooks", "hard_facts", "search_phrases", "visual_material"):
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
    if brief.get("hidden_cause"):
        lines.append(f"Hidden real cause: {brief['hidden_cause']}")
    if brief.get("viewer_mistake"):
        lines.append(f"Mistake the viewer makes without knowing: {brief['viewer_mistake']}")
    if brief.get("emotion"):
        lines.append(f"Viewer's emotion: {brief['emotion']}")
    if brief.get("item_count"):
        lines.append(f"Format: a list of {brief['item_count']} items (the scope above)")
    elif brief.get("format"):
        lines.append(f"Format: {brief['format']}")
    if brief.get("after_state"):
        lines.append(f"Viewer's state after the video: {brief['after_state']}")
    if brief.get("confession"):
        lines.append(f"First-person confession of the core change: {brief['confession']}")
    if brief.get("curiosity_hooks"):
        lines.append("What the viewer does not expect (curiosity hooks):\n" + "\n".join(f"- {f}" for f in brief["curiosity_hooks"]))
    if brief.get("hard_facts"):
        lines.append("Supporting facts of single parts (details, NOT the subject of a title):\n" + "\n".join(f"- {f}" for f in brief["hard_facts"]))
    if brief.get("visual_material"):
        lines.append("Visual material only this video has:\n" + "\n".join(f"- {f}" for f in brief["visual_material"]))
    if brief.get("search_phrases"):
        lines.append("Search phrases: " + "; ".join(brief["search_phrases"]))
    if brief.get("main_keyword"):
        lines.append(f"Main keyword: {brief['main_keyword']}")
    return "\n".join(lines)


# ----------------------------------------------------------------------------- titles
_TITLE_RULES = """HARD RULES
0. THE TITLE'S JOB. The viewer meets the title together with a thumbnail that already raised a question. \
The title tells in one second what the video is AND makes the viewer think «это мне надо»: it names a \
concrete gain or pain of THEIR life (peace, strength, money, health, sleep, relationships, years...) and \
what the video gives about it. A slogan or an abstract topic name gives no reason to click. Never repeat \
the author's title word for word.
1. THE WHOLE VIDEO, NOT A DETAIL. The title is about the whole video, never about one side example, quote \
or episode of it. When the video is a list of N items, the honest count of the whole list is a strong frame: \
the number, what the items do, what the viewer cares about.
2. A REASON TO CLICK. Either a concrete value the viewer wants (the list, the way, the cause of THEIR \
problem) or a sharp open question – one of them is enough. Hold back the details (which things, which \
mistake): the title promises them, the video gives them.
3. HIT AN EMOTION. Touch the viewer's real feeling from the brief: fear of losing something, tiredness, \
regret, hope, the «that's exactly me» recognition, the slight sting of being told they do it wrong. A \
neutral, informative title loses.
4. Plain, concrete speech. NO poetic or philosophical wording, no metaphors. Abstract nouns (secret, mystery, \
journey, path, power, magic, essence, world of...) must not do the work – name the real thing: the real \
symptom, behaviour, number, situation, consequence.
5. Provocative is good, lying is not: everything the title claims or promises is really in the brief.
6. Speak the viewer's own words and situation; address them directly («you») when it sounds natural.
7. Length 35–60 characters, hard max 65. The strongest words are in the first 40 characters.
8. No ALL CAPS words, no emoji, no hashtags, no trailing period, no quotes around the whole title, no empty \
filler («shocking», «you won't believe», «TOP», «MUST WATCH»). Strong words like «никогда», «ошибка», \
«перестаньте», «настоящая причина», «никто не говорит» are fine when a concrete thing follows. At most one \
colon or dash.
9. Natural {language}, as a native top YouTuber says it – not a translation from English."""

_TITLE_FORMULAS = """FORMULAS – every candidate uses a different one, at least 7 different formulas overall. \
The patterns only show the SHAPE: <…> is filled with the concrete words of THIS video, and the wording \
around it is yours in {language} – never copy a pattern word for word:
- hidden_cause: the real reason the viewer does not know – «<the real reason> behind <the viewer's problem>»
- mistake: what the viewer does wrong – «the mistake that makes you <consequence>»
- contrarian: the opposite of the common belief – «the more you <common action>, the <worse result>»
- signs: the viewer checks themselves – «N signs that you <surprising state>»
- warning: stop doing – «stop <concrete action> if you want <gain>»
- question: a sharp question about the viewer's real situation – «why do you <concrete behaviour>?»
- consequence: what really happens – «what happens to <you / your X> when <situation>»
- recognition: the viewer sees themselves – «if you <symptom>, it is not <what they think>»
- number_gap: a count plus an open question – «N things <a group> never does»
- myth: the belief and its reversal – «it is not <the belief>: what really <stops / drives> you»
- list_value: the count of the whole list + what its items do to the viewer's gain or pain – «N <items> \
that <harm or give> your <gain>»
When the video is a list, at least 3 candidates use its exact count.
BAD – an abstract topic, a slogan or a table of contents without the viewer's gain or pain. BAD – poetic \
or philosophical wording that tells nothing concrete."""

_TITLES_SYSTEM = """You are the best YouTube packaging editor in the {language}-speaking segment, the one \
channels hire when their click-through rate is low. Your titles get clicked because in ONE second the \
viewer understands what the video is and thinks «это мне надо» – it is about their own tiredness, fear, \
loss or hope, and the video gives something concrete about it.
You write for a viewer scrolling the home feed among 20 other videos – not for a search engine, not for a \
table of contents.

{rules}

{formulas}

Write {count} candidates. Answer ONLY with JSON:
{{"candidates": [{{"title": "...", "formula": "hidden_cause|mistake|contrarian|signs|warning|question|consequence|recognition|number_gap|myth|list_value"}}]}}"""

_JUDGE_SYSTEM = """You are a ruthless YouTube title critic who knows real click-through data. Score every \
candidate title for the video described in the BRIEF. Be strict: an average decent title gets 5–6, 8+ is rare.
Imagine the viewer from the brief scrolling the home feed: 20 videos, half a second for each.
For each give integers 0–10:
- click: how badly this viewer wants to click it right now (0 = scrolls past, 10 = cannot resist)
- for_me: the viewer thinks «это мне надо» – it names a concrete gain or pain of their own life and \
promises something concrete about it (0 if it is an abstract topic, a slogan or about someone else)
- curiosity: the viewer wants the details the title holds back – which things, which cause, what happens \
(0 if vague or if the title already gives everything away)
- pull: emotional hit for THIS viewer – fear, regret, hope, surprise, «that's me»
- specificity: names a concrete thing, behaviour or situation (0 if it could fit 10 other videos)
- clarity: the topic is understood in one second by a stranger
- honest: 10 if every claim and promise is really in the brief, 0 if it is invented or exaggerated
- coverage: 10 if the title is about the video's main idea; 0 if it is built on a side example or detail \
that the video only touches
and booleans/text:
- boring: true if it reads like an abstract topic name, a slogan, a textbook chapter or a plain restatement \
of the author's title – no gain or pain of the viewer in it. A concrete list of N things with the viewer's \
gain or pain is NOT boring
- figurative: true if it uses a metaphor, poetry, a philosophical or abstract word instead of the real thing
- weakness: the single most important thing that keeps a viewer from clicking, up to 12 words
Answer ONLY with JSON: {"scores": [{"i": <index>, "click": 0, "for_me": 0, "curiosity": 0, "pull": 0, "specificity": 0, \
"clarity": 0, "honest": 0, "coverage": 0, "boring": false, "figurative": false, "weakness": "..."}]}"""

_REFINE_SYSTEM = """You sharpen YouTube titles to raise their click-through rate. You get titles with the \
weakness a critic found in each. For every title write 2 improved versions that remove the weakness and \
make the viewer want to click more – a more concrete gain or pain of the viewer, a stronger emotion, a \
sharper hook – \
keeping the claim true and obeying the rules.

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


def _flag(item: dict[str, Any], key: str) -> bool:
    """A boolean of the critic's JSON, which may come as true, "true" or "false"."""
    value = item.get(key)
    return value is True or str(value).strip().lower() == "true"


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
    own = str(brief.get("working_title") or "")
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
        # The wish to click leads, then «это мне надо»; clarity and facts keep a title from being a riddle.
        total = (0.25 * num("click") + 0.20 * num("for_me") + 0.14 * num("curiosity") + 0.12 * num("pull")
                 + 0.10 * num("specificity") + 0.09 * num("clarity") + 0.10 * num("honest"))
        if num("coverage") < 5:  # built on a side detail – the viewer would expect something else
            total -= 0.4 * (5 - num("coverage"))
        figurative = _flag(it, "figurative")
        if figurative:
            total -= 3
        if _flag(it, "boring"):
            total -= 2
        if own and _similar(title, own, 0.75):  # the author's topic restated is not packaging
            total -= 1.5
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
    # Strongest first, but no near-duplicates; the first pass also wants a different formula each time.
    for distinct_formula in (True, False):
        for s in pool:
            formula = formulas.get(s["title"], "")
            if len(picked) >= count or any(p["text"] == s["title"] for p in picked):
                continue
            if any(_similar(s["title"], p["text"]) or (distinct_formula and formula and formula == p["formula"])
                   for p in picked):
                continue
            picked.append({"text": s["title"], "score": s["total"], "formula": formula})
    picked.sort(key=lambda p: -p["score"])
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
    fixed_chapters: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Description parts, tags, hashtags and chapters (the layout is assembled by ``build_description``).

    ``fixed_chapters`` – chapters already chosen for this voice-over (the chapter cards of the video
    show them): used as they are instead of the LLM's picks.
    """
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
    if fixed_chapters:
        chapters_out = [{"t": int(c["t"]), "title": _clean_line(c.get("title"))} for c in fixed_chapters]
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
#: Schemes of a package: how the thumbnail raises the question and the title answers «what is it, why me».
PACKAGE_SCHEMES = ("confession_result", "hidden_warning", "contrast", "pain_question", "number_hook",
                   "before_after")

_PACKAGE_SYSTEM = """You are a senior YouTube packaging director, the one channels hire when their \
click-through rate is low. You make PACKAGES: a thumbnail (ONE short text + ONE picture) and the title \
that goes with it. The viewer sees them for half a second at 170 px among 20 other videos.

HOW A PACKAGE WORKS – two roles, two steps
1. The THUMBNAIL raises a question. The viewer sees the text and the picture and at once asks something \
they cannot answer themselves – about THIS video's subject. The question comes from the text AND the \
picture together, often from the gap between them.
2. The TITLE finishes the job. The viewer glances at it and thinks «о, это мне надо»: it says what the \
video is and names a concrete gain or pain of the viewer's own life, promising the answer to the \
thumbnail's question without giving it away.

NO TEMPLATES. Every channel dies of look-alike thumbnails. Everything – the text, the scene, the pose, the \
props – is invented for THIS video from its BRIEF and its visual material. There are no model packages to \
imitate here; a thumbnail that could be put on another video of the channel is a failure.

SCHEMES – the mechanism of the question; each candidate uses one, at least 5 different schemes overall:
- confession_result: a first-person confession or discovery about the video's core change, the decisive \
part held back; the picture shows the result in this video's own terms.
- hidden_warning: a warning or a verdict about something from the video, its object held back or shocking.
- contrast: text and picture contradict each other, the brain stops at the mismatch.
- pain_question: the question the viewer secretly asks themselves about the video's problem; the picture \
shows that problem in its concrete form from the video.
- number_hook: a striking number or fact from the video, its meaning held back.
- before_after: two states of the same subject of the video side by side, the reason held back.
Text forms must vary too: first person, an address to the viewer, a quoted line of a person of the video, a \
bare number with a word, a verdict. A held-back object («это», «так») is ONE tool – at most one package \
of the set uses it.

THE TEXT («headline», in {language})
- 2–5 words, at most {max_chars} characters, written in normal case (capitals are applied later), no \
emoji, no trailing period. Native, spoken {language}.
- It raises the question; it never answers it and never names the topic plainly. No truisms, no empty \
words («shock», «the whole truth»).
- It is about the core of the WHOLE video, not a side detail. Provocative is good, false is not: \
everything it says or implies is really in the BRIEF.
- «accent»: the ONE word of the headline that carries the hook (it is highlighted); a number if there is one.

THE PICTURE («prompt», in English, 40–80 words)
- It is built from the VISUAL MATERIAL of the brief («material» = the item you use; every package uses a \
different item): the real person the video is about with their recognisable look, the video's own object, \
place, scene or number made visible – shown at its most striking: exaggerated, broken, piled up, at an odd \
scale, at the tense moment. A stranger should guess the subject area of the video from the picture alone.
- A person in it acts or reacts within the concrete situation of the video – never a generic person just \
showing a feeling. BANNED stock scenes: a person holding a cup or mug, sitting in an armchair or at a \
window, holding their head or resting it on a desk, raising a hand in a «stop» gesture, staring at a phone, \
smiling with closed eyes. No clichés: no gears or circuits in brains, light bulbs, glowing orbs, \
hourglasses, surreal collages, floating symbols.
- The emotion or state is clear and fits the scheme – it can be calm, fear, joy, shock or anything else \
the idea needs; it is readable at 170 px.
- One focal point, at most 3 elements, the subject is BIG, close framing, simple background. The subject \
sits on ONE side and fills about half of the frame; the other ~45% is calm empty background for the \
headline. «side» = the side where the SUBJECT is: "left" or "right".
- The art style is FIXED, MANDATORY and added to the prompt automatically: «{style}». The prompt describes \
ONLY the scene – never copy the style into it, never name colours, lighting, style, medium or camera words \
and never contradict the style: for a cartoon style describe cartoon characters, not real people. No \
text, letters or numbers in the picture.

THE TITLE («title», in {language})
{title_task}

FINAL CHECK for every package: a stranger sees ONLY the thumbnail – which question pops into their head, \
and do they need the answer? Could this thumbnail be put on another video of the channel? Then they read \
the title – do they think «это мне надо»? If anything fails, redo it.
Packages must differ from each other in scheme, text form, material, scene and pose.

Write {count} packages. Answer ONLY with JSON, fields in this order (the chain of thought):
{{"packages": [{{"scheme": "{schemes}", "headline": "...", "accent": "...", "material": "the item of the \
visual material the picture is built from", "subject": "what the picture shows, 2–8 English words", \
"question": "the question the viewer asks at the sight of the thumbnail alone, in {language}", \
"title": "...", "side": "left|right", "prompt": "..."}}]}}"""

_PACKAGE_TITLE_FREE = """Write the title for THIS thumbnail. {title_rules}
- The title does not repeat the words of the headline and does not reveal what the headline holds back \
(it may name the category and the count, not the things themselves).
- It promises exactly what the video is: a list of N things is never «the main reason» or «one simple way».
- The picture may show ONE concrete episode of the video; the title is still about the WHOLE video (its \
premise), never about that episode only.
- Grammatically correct, every part of it agrees with the rest.{ideas}"""

_PACKAGE_TITLE_FIXED = """The title is FIXED: «{title}». Copy it into «title» exactly; build the thumbnail \
so that this title answers «what is it, why me» for the question the thumbnail raises."""

_PACKAGE_JUDGE_SYSTEM = """You are a ruthless YouTube packaging critic who knows real click-through data. \
For every package (thumbnail text + picture + title) of the video in the BRIEF, play the viewer from the \
brief scrolling the home feed, in two steps. Be strict: average = 5–6, 8+ is rare.
STEP 1 – the viewer sees ONLY the thumbnail at 170 px (text + picture, no title):
- question: the question that really pops into their head, in {language}, max 12 words; an empty string \
if none does (a truism, a topic name, a statement that explains itself)
- gap: 0–10, how badly they need the answer to that question (0 if there is none)
- stop: 0–10, does it stand out among 20 thumbnails – a clearly readable state of the character, a \
striking mismatch of text and picture, one focal point (calm is not a minus by itself; a vague, \
nothing-to-read picture is)
- picture_instant: 0–10, the picture is understood in one second at 170 px
- only_this: 0–10, the picture and the text could belong ONLY to this video – its own person, object, place \
or fact (0 if they would fit any video of the channel: a generic person showing a feeling, a stock pose)
STEP 2 – the viewer reads the title:
- for_me: 0–10, they think «это мне надо» – a concrete gain or pain of their own life (0 for an abstract \
topic or a slogan)
- closes: 0–10, the title promises the answer to the thumbnail's question without giving it away and \
without repeating the headline
- clarity: 0–10, it is clear in one second what the video is
- covers: 0–10, the title is about the WHOLE video (its premise); 0 if it is about one episode or item that \
the picture happens to show
- honest: 0–10, every claim of the headline, the picture and the title is really in the BRIEF and about \
the whole video, not a side detail
and booleans: "repeats" (the title repeats the headline's words or idea), "abstract" (the picture relies \
on a cliché symbol or an abstraction that is not understood at once), "stock" (the picture is a stock \
scene: a person with a cup or mug, in an armchair or at a window, holding their head, raising a «stop» \
hand, staring at a phone – or anything else that would fit any video).
Answer ONLY with JSON: {{"scores": [{{"i": <index>, "question": "...", "gap": 0, "stop": 0, \
"picture_instant": 0, "only_this": 0, "for_me": 0, "closes": 0, "clarity": 0, "covers": 0, "honest": 0, \
"repeats": false, "abstract": false, "stock": false}}]}}"""


#: Stock scenes a model falls back to on any topic; they made every thumbnail of a channel look alike.
_STOCK_SCENE = re.compile(
    r"\b(?:mug|teacup|cup of (?:tea|coffee)|armchair|stop gesture|(?:raises?|raising|holds? up|holding up) "
    r"(?:a |one |his |her |their )?(?:hand|palm)|palm (?:facing|out)|(?:holding|clutching) (?:his|her|their) "
    r"head|head (?:in|on) (?:his |her |their )?hands|staring at (?:a |the |his |her )?(?:phone|smartphone))\b",
    re.I)


def _thumb_headline_ok(headline: str) -> bool:
    return bool(headline) and len(headline.split()) <= HEADLINE_MAX_WORDS and len(headline) <= HEADLINE_MAX_CHARS


def thumbnail_concepts(
    fg: FastgenClient, brief: dict[str, Any], script_head: str, language: str, title: str | None,
    llm: LlmSettings, publish: PublishSettings, count: int, avoid: list[dict[str, Any]] | None = None,
    title_ideas: list[str] | None = None, channel_used: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """The best ``count`` packages: a thumbnail (headline + picture) and the title that goes with it.

    Each one is ``{"prompt", "headline", "accent", "side", "subject", "material", "angle", "question", "title",
    "title_fixed", "score"}``. ``title`` – make thumbnails for this fixed title; ``None`` – every package gets
    its own title. ``avoid`` are ideas that were already shown: new ones differ in headline, picture and title.
    ``title_ideas`` – the strongest titles of :func:`make_titles`, a package may take or adapt one of them.
    ``channel_used`` – thumbnail ideas of the channel's other videos: a new one must not look like them.
    """
    name = language_name(language)
    wanted = max(count * 3, 8)
    fixed = (title or "").strip()
    ideas = ("\n- Strong titles already written for this video – take one that fits the thumbnail, adapt it or "
             "write a better one:\n" + "\n".join(f"  «{t}»" for t in title_ideas[:8])) if title_ideas else ""
    title_task = (_PACKAGE_TITLE_FIXED.format(title=fixed) if fixed
                  else _PACKAGE_TITLE_FREE.format(title_rules=_TITLE_RULES.format(language=name), ideas=ideas))
    system = _PACKAGE_SYSTEM.format(language=name, max_chars=HEADLINE_MAX_CHARS, count=wanted,
                                    style=publish.thumbnail_style.strip(), title_task=title_task,
                                    schemes="|".join(PACKAGE_SCHEMES))
    user = f"{_niche(llm)}BRIEF:\n{_brief_text(brief)}\n"
    shown = [a for a in avoid or [] if a.get("headline") or a.get("prompt")]
    if shown:
        user += ("\nALREADY MADE – a new package must not repeat or paraphrase their headline, picture or title:\n"
                 + "\n".join(f"- «{a.get('headline', '')}» / {a.get('subject') or str(a.get('prompt', ''))[:120]}"
                             f" / {a.get('title', '')}" for a in shown[:12]) + "\n")
    used = [a for a in channel_used or [] if a.get("headline") or a.get("subject")]
    if used:
        user += ("\nUSED ON OTHER VIDEOS OF THIS CHANNEL – new thumbnails must not look like any of them: no same "
                 "scene, pose, prop or text structure:\n"
                 + "\n".join(f"- «{a.get('headline', '')}» / {a.get('subject', '')}" for a in used[:30]) + "\n")
    if script_head.strip():
        user += f"\nSCRIPT BEGINNING (only a source of accurate details, not a menu of scenes):\n{script_head[:4_000]}"
    data = _chat(fg, system, user, llm, 0.9)
    items = data.get("packages") if isinstance(data, dict) else data

    avoid_heads = {_clean_line(a.get("headline")).lower() for a in shown}
    style = publish.thumbnail_style.strip().rstrip(".")
    cands: list[dict[str, Any]] = []
    for it in items or []:
        if not isinstance(it, dict) or not str(it.get("prompt", "")).strip():
            continue
        headline = re.sub(r"[«»“”\"]", "", re.sub(r"\s+", " ", str(it.get("headline") or ""))).strip().rstrip(".")
        if not _thumb_headline_ok(headline) or headline.lower() in avoid_heads:
            continue
        own_title = fixed or _clean_title(it.get("title"))
        if not own_title or (not fixed and title_problem(own_title)):
            continue
        if _similar(headline, own_title, 0.8) and len(headline.split()) > 1:
            continue  # the thumbnail only repeats the title
        accent = _clean_line(it.get("accent")).strip('"«»“” .')
        side = "left" if str(it.get("side", "")).strip().lower().startswith("l") else "right"
        prompt = str(it["prompt"]).strip()
        if style:  # the model likes to echo the style, which the drawing adds once more
            prompt = re.sub(re.escape(style) + r"\.?\s*", "", prompt, flags=re.I).strip() or prompt
        cands.append({
            "prompt": prompt,
            "headline": headline,
            "accent": accent if accent and accent.lower() in headline.lower() else "",
            "side": side,
            "subject": _clean_line(it.get("subject"))[:80],
            "material": _clean_line(it.get("material"))[:120],
            "angle": _clean_line(it.get("scheme"))[:30],
            "question": _clean_line(it.get("question"))[:200],
            "title": own_title,
            "title_fixed": bool(fixed),
            "title_index": 0,
        })
    if not cands:
        return []

    for c in cands:
        # The critic does not see the channel: a look-alike of another video is pushed down here.
        c["penalty"] = 2.5 if any(
            (c["subject"] and a.get("subject") and _similar(c["subject"], str(a["subject"]), 0.5))
            or (a.get("headline") and _similar(c["headline"], str(a["headline"]), 0.6)) for a in used) else 0.0
        if _STOCK_SCENE.search(c["prompt"]):
            c["penalty"] += 2
    scores = _judge_packages(fg, brief, cands, llm, name)
    for i, c in enumerate(cands):
        c["score"] = round(_package_score(scores[i], c) if i in scores else 5.0 - 0.01 * i - c["penalty"], 2)
        question = _clean_line((scores.get(i) or {}).get("question"))
        if question:  # the critic's question is the viewer's, the generator's only its intent
            c["question"] = question[:200]

    picked: list[dict[str, Any]] = []
    # Variants for YouTube's A/B test are worth something only when they differ, so the first pass also
    # wants a different scheme; the second pass fills up if there are not enough of them.
    for distinct_scheme in (True, False):
        for c in sorted(cands, key=lambda c: -c["score"]):
            if c in picked or len(picked) >= count:
                continue
            # a different text, picture and title from the already chosen ones
            if any(_similar(c["headline"], p["headline"], 0.5)
                   or (c["subject"] and p["subject"] and _similar(c["subject"], p["subject"], 0.7))
                   or (c["material"] and c["material"].lower() == p["material"].lower())
                   or (not fixed and _similar(c["title"], p["title"], 0.7))
                   or (distinct_scheme and c["angle"] and c["angle"] == p["angle"])
                   for p in picked):
                continue
            picked.append(c)
    if picked and not fixed:
        try:
            _sharpen_package_titles(fg, brief, picked, llm, name, ideas)
        except (ApiError, ValueError) as exc:
            log.warning("package title sharpening failed: %s", exc)
        picked.sort(key=lambda c: -c["score"])
    for c in picked:
        c.pop("penalty", None)
    return picked


def _judge_packages(fg: FastgenClient, brief: dict[str, Any], packs: list[dict[str, Any]], llm: LlmSettings,
                    language_label: str) -> dict[int, dict[str, Any]]:
    """The critic's scores by index of ``packs`` (empty when the critic failed)."""
    scores: dict[int, dict[str, Any]] = {}
    try:
        listing = "\n".join(f"{i}: thumbnail text «{c['headline']}» / picture: {c['prompt']} / title: {c['title']}"
                            for i, c in enumerate(packs))
        judged = _chat(fg, _PACKAGE_JUDGE_SYSTEM.format(language=language_label),
                       f"BRIEF:\n{_brief_text(brief)}\n\nPACKAGES:\n{listing}", llm, 0.2)
        for s in (judged.get("scores") if isinstance(judged, dict) else judged) or []:
            try:
                scores[int(s["i"])] = s
            except (KeyError, TypeError, ValueError):
                continue
    except (ApiError, ValueError) as exc:
        log.warning("package critic failed: %s", exc)
    return scores


def _package_score(s: dict[str, Any], pack: dict[str, Any]) -> float:
    def num(k: str) -> float:
        try:
            return max(0.0, min(10.0, float(s.get(k, 0))))
        except (TypeError, ValueError):
            return 0.0
    # The question of the thumbnail leads, then «это мне надо» of the title and a picture of THIS video.
    value = (0.22 * num("gap") + 0.10 * num("stop") + 0.06 * num("picture_instant") + 0.14 * num("only_this")
             + 0.18 * num("for_me") + 0.12 * num("closes") + 0.06 * num("clarity") + 0.12 * num("honest"))
    value -= float(pack.get("penalty") or 0)
    if num("covers") < 5:  # a title about one episode – the viewer would expect another video
        value -= 0.5 * (5 - num("covers"))
    if num("honest") < 5:  # invented claim – never wins over a grounded idea
        value -= 4
    if not _clean_line(s.get("question")):
        value -= 3  # the thumbnail raises no question at all
    if _flag(s, "stock"):
        value -= 3
    for flag in ("repeats", "abstract"):
        if _flag(s, flag):
            value -= 2
    if not pack.get("title_fixed") and len(pack["title"]) > TITLE_SOFT_MAX:
        value -= 1.5
    return value


_PACKAGE_TITLES_SYSTEM = """You write titles for YouTube thumbnails that are already made. For every \
package you get the thumbnail text, the picture, the question the viewer asks at the sight of it and the \
current title. Write 3 different, better titles for each. The viewer reads the title right after the \
thumbnail and must think «это мне надо»: it says what the video is, names a concrete gain or pain of the \
viewer's own life and promises the answer to the thumbnail's question without giving it away and without \
repeating the headline. It promises exactly what the video is: a list of N things is never «the main \
reason» or «one simple way», and one item of the list is never the title. The picture often shows one \
episode of the video – the title is still about the WHOLE video (its premise), never about that episode. \
When the video is a list, at least one of the 3 uses its exact count.

{rules}{ideas}

Answer ONLY with JSON: {{"titles": [{{"i": <package index>, "title": "..."}}]}}"""


def _sharpen_package_titles(fg: FastgenClient, brief: dict[str, Any], picked: list[dict[str, Any]],
                            llm: LlmSettings, language_label: str, ideas: str) -> None:
    """New titles for the chosen thumbnails; each package keeps the title the critic likes best with it."""
    listing = "\n".join(f"{i}: thumbnail text «{p['headline']}» / picture: {p['subject']} / viewer's question: "
                        f"{p['question']} / title now: {p['title']}" for i, p in enumerate(picked))
    data = _chat(fg, _PACKAGE_TITLES_SYSTEM.format(rules=_TITLE_RULES.format(language=language_label),
                                                   ideas=ideas),
                 f"BRIEF:\n{_brief_text(brief)}\n\nPACKAGES:\n{listing}", llm, 0.7)
    rows: list[tuple[int, dict[str, Any]]] = [(i, p) for i, p in enumerate(picked)]
    for it in (data.get("titles") if isinstance(data, dict) else data) or []:
        try:
            i = int(it["i"])
        except (KeyError, TypeError, ValueError):
            continue
        t = _clean_title(it.get("title"))
        if not 0 <= i < len(picked) or not t or title_problem(t) or any(t.lower() == r["title"].lower() for _, r in rows):
            continue
        if _similar(picked[i]["headline"], t, 0.8):
            continue
        rows.append((i, {**picked[i], "title": t}))
    if len(rows) == len(picked):
        return
    # The originals are judged again in the same call: scores of one call are comparable, of two – not.
    scores = _judge_packages(fg, brief, [r for _, r in rows], llm, language_label)
    if not scores:
        return
    best: dict[int, tuple[float, str]] = {}
    for k, (i, row) in enumerate(rows):
        if k in scores:
            value = _package_score(scores[k], row)
            if i not in best or value > best[i][0]:
                best[i] = (value, row["title"])
    used: list[str] = []
    for i, p in enumerate(picked):
        if i in best and all(not _similar(best[i][1], u, 0.7) for u in used):
            p["score"], p["title"] = round(best[i][0], 2), best[i][1]
        used.append(p["title"])
