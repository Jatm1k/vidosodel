"""Packaging of a video for YouTube: title, thumbnail (headline + picture) and description.

A click is decided by the title and the thumbnail, and the viewer reads them as ONE message. The package
sells the WHOLE video: the costliest failure is a title or a thumbnail built on one example, story or person
that the video uses in a single part – the viewer clicks for it and gets something else, or does not click
because a side detail says nothing about what the video gives. So the work goes like a packaging editor's:

1. :func:`build_brief` – the WHOLE video (premise, viewer, pain, core tension, the visual world of the topic)
   kept apart from its PARTS (single-part examples and facts, used only by the description and the critics).
2. :func:`make_angles` – the strategy: a few different ways to sell the whole video, each one thought.
3. :func:`make_titles` – candidates over the angles and proven formulas → harsh critic → the best are
   sharpened → critic again. Hard rules (length, caps, duplicates) are enforced in code.
4. :func:`make_description` – hook, what the viewer gets, tags, chapters; the layout is assembled by code so
   no stray English headings appear and the first lines carry the keyword.
5. :func:`thumbnail_concepts` – packages, one angle each: the thumbnail (headline + picture in one of several
   compositions) raises a question, its own title answers «what is it, why me» → a critic plays the viewer.
   A package resting on a single-part example is pushed down in code as well as by the critic.
"""
from __future__ import annotations

import logging
import re
from collections import Counter
from typing import Any

from ..services.fastgen import FastgenClient
from ..services.http import ApiError
from ..settings_schema import LlmSettings, PublishSettings
from .languages import language_name
from .llm_tasks import THUMB_LAYOUTS, _niche, strip_timestamps, thumb_layout

log = logging.getLogger(__name__)

#: Titles longer than this are cut off in the mobile feed.
TITLE_SOFT_MAX = 60
TITLE_HARD_MAX = 70
TITLE_MIN = 12
#: Headline on a thumbnail: readable at 170 px only when it is this short.
HEADLINE_MAX_WORDS = 5
HEADLINE_MAX_CHARS = 32
#: Briefs of another version are made again (their fields fed the old, detail-driven packaging).
BRIEF_VERSION = 2


def packaging_model(llm: LlmSettings) -> str:
    return llm.packaging_model.strip() or llm.model


def sees_images(model: str) -> bool:
    """FastGen passes images to its OpenAI models; Gemini needs a licence capability most keys lack."""
    return model.startswith("openai/")


def _chat(fg: FastgenClient, system: str, user: str, llm: LlmSettings, temperature: float, *,
          creative: bool = True, images: list[str] | None = None) -> Any:
    """``creative`` – packaging work (the packaging model), else reading/description (the channel's model).
    ``images`` – data URIs shown after the text when the model sees images; without them on failure."""
    model = packaging_model(llm) if creative else llm.model
    if images and sees_images(model):
        content = [{"type": "text", "text": user}] + [{"type": "image_url", "image_url": {"url": u}} for u in images]
        try:
            return fg.chat_json([{"role": "system", "content": system}, {"role": "user", "content": content}],
                                model=model, temperature=temperature, attempts=2)
        except ApiError as exc:
            log.warning("packaging with images failed, text only: %s", exc)
    return fg.chat_json([{"role": "system", "content": system}, {"role": "user", "content": user}],
                        model=model, temperature=temperature)


def _clean_line(text: Any) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def _clean_list(items: Any, limit: int) -> list[str]:
    return [_clean_line(x) for x in items if _clean_line(x)][:limit] if isinstance(items, list) else []


# ------------------------------------------------------------------------------ brief
_BRIEF_SYSTEM = """You are a YouTube packaging editor. Before titles and thumbnails are made you read the \
whole video script and write a BRIEF of the WHOLE video.
Write all text values in {language} (the language of the video) unless a field asks for English. Use ONLY \
what is in the script – never invent facts, numbers or names.
The AUTHOR'S TITLE (if given) is the idea the whole script was written from: it defines the video's \
subject and promise. The script only shows how it is covered.
A package sells the WHOLE video. The typical failure is a title or a thumbnail built on one example, case, \
experiment, historical story, named person, number or object that the video uses in only one of its parts: \
the viewer clicks for that and gets a video about something larger, or does not click because a side \
detail says nothing about what the video gives. So this brief keeps the WHOLE (what every part of the \
video serves) apart from the PARTS (the material of single sections).
Answer ONLY with JSON:
{{"premise": "the one umbrella idea/promise of the WHOLE video, one sentence – the author's title restated \
plainly (or, without an author's title, what the whole script is about)",
"scope": ["3-8 short items: the parts / questions / aspects the video covers, in order"],
"topic": "what exactly the video is about, one plain sentence",
"viewer": "who watches it and in which concrete situation of their life they are, one sentence",
"pain": "what bothers this viewer in this topic, in their own words, one sentence",
"desire": "what this viewer wants for themselves in this topic, in their own words, one sentence",
"promise": "what the viewer gets / understands / can do after the WHOLE video, one sentence",
"main_claim": "the central statement the WHOLE video argues – true for all of its parts, one sentence",
"core_tension": "the contradiction or surprise of the WHOLE video: what the viewer believes or does versus \
what the video shows, one sentence",
"misconception": "the common belief the whole video overturns, or an empty string",
"stakes": "what the viewer loses if nothing changes, or an empty string",
"viewer_mistake": "what the viewer does wrong in this topic without knowing it (the whole video's answer, \
not one item), or an empty string",
"emotion": "the strongest emotion this topic touches in the viewer (fear, regret, shame, hope, anger, \
relief...) and why, one sentence",
"format": "list|story|explanation|other – how the video is built: list = it goes through N separate items \
(things, habits, mistakes, rules, signs...)",
"item_count": "the number of items when format is list, else 0 – digits only",
"after_state": "what concretely changes in the viewer's life or understanding after the WHOLE video, one \
sentence",
"hero": "only when the WHOLE video is about one person, thing or place (a biography, the story of one \
event, a review of one object): its name; else an empty string",
"world": ["4-6 English phrases: the visual world of the WHOLE topic – the settings, kinds of people and \
everyday situations a stranger connects with this subject and with the viewer's life in it. Never an example \
from one part"],
"parts": ["every example, case, experiment, historical story, named person, object, place or number that \
the video uses in only ONE of its parts – each 1-4 English words naming it. The hero is not a part"],
"hard_facts": ["5-8 concrete facts of single parts: numbers, names, named effects, specific actions – for \
the description only"],
"search_phrases": ["6-10 phrases a person would really type into YouTube search to find this video"],
"main_keyword": "the single most important search phrase, 2-4 words"}}"""


def build_brief(fg: FastgenClient, script: str, language: str, llm: LlmSettings,
                working_title: str = "") -> dict[str, Any]:
    """What titles, thumbnails and the description are built from (one read of the whole script).

    ``working_title`` – the title the author typed for the project; the script was written from it.
    """
    system = _BRIEF_SYSTEM.format(language=language_name(language))
    own = f"AUTHOR'S TITLE: {working_title.strip()}\n\n" if working_title.strip() else ""
    user = f"{_niche(llm)}{own}SCRIPT:\n{script[:100_000]}"
    data = _chat(fg, system, user, llm, 0.3, creative=False)
    if not isinstance(data, dict):
        raise ValueError("LLM вернул бриф в неверном формате")
    brief: dict[str, Any] = {"v": BRIEF_VERSION, "working_title": working_title.strip()}
    for key in ("premise", "topic", "viewer", "pain", "desire", "promise", "main_claim", "core_tension",
                "misconception", "stakes", "viewer_mistake", "emotion", "main_keyword", "format", "after_state",
                "hero"):
        brief[key] = _clean_line(data.get(key))
    count = re.search(r"\d+", str(data.get("item_count") or ""))
    brief["item_count"] = int(count.group()) if count and brief["format"].lower() == "list" else 0
    brief["scope"] = _clean_list(data.get("scope"), 8)
    brief["world"] = _clean_list(data.get("world"), 6)
    brief["parts"] = [p for p in _clean_list(data.get("parts"), 30)
                      if not (brief["hero"] and _similar(p, brief["hero"], 0.5))]
    for key in ("hard_facts", "search_phrases"):
        brief[key] = _clean_list(data.get(key), 10)
    return brief


def _brief_text(brief: dict[str, Any], parts: bool = False) -> str:
    """The brief for a prompt. Generators get the WHOLE only – a list of details in front of a model is a
    menu it picks from; ``parts`` adds them for the critics and the description."""
    lines = []
    if brief.get("working_title"):
        lines.append(f"AUTHOR'S TITLE (the idea of the whole video): {brief['working_title']}")
    if brief.get("premise"):
        lines.append(f"Premise of the WHOLE video: {brief['premise']}")
    if brief.get("hero"):
        lines.append(f"The whole video is about: {brief['hero']}")
    if brief.get("scope"):
        lines.append("The video covers: " + "; ".join(brief["scope"]))
    if brief.get("item_count"):
        lines.append(f"Format: a list of {brief['item_count']} items (the scope above)")
    elif brief.get("format"):
        lines.append(f"Format: {brief['format']}")
    for key, label in (("topic", "Topic"), ("viewer", "Viewer"), ("pain", "Viewer's pain"),
                       ("desire", "Viewer's desire"), ("promise", "Promise"), ("main_claim", "Main claim"),
                       ("core_tension", "Core tension"), ("misconception", "Common misconception it overturns"),
                       ("stakes", "Stakes"), ("viewer_mistake", "Mistake the viewer makes without knowing"),
                       ("emotion", "Viewer's emotion"), ("after_state", "Viewer's state after the video")):
        if brief.get(key):
            lines.append(f"{label}: {brief[key]}")
    if brief.get("world"):
        lines.append("Visual world of the whole topic: " + "; ".join(brief["world"]))
    if brief.get("search_phrases"):
        lines.append("Search phrases: " + "; ".join(brief["search_phrases"]))
    if brief.get("main_keyword"):
        lines.append(f"Main keyword: {brief['main_keyword']}")
    if parts:
        if brief.get("parts"):
            lines.append("PARTS – examples used in a single part of the video, never what a package is about: "
                         + "; ".join(brief["parts"]))
        if brief.get("hard_facts"):
            lines.append("Facts of single parts:\n" + "\n".join(f"- {f}" for f in brief["hard_facts"]))
    return "\n".join(lines)


_GENERIC_STEMS = {"perso", "peopl", "young", "older", "woman", "women", "their", "with", "from", "into", "over",
                  "under", "small", "large", "giant", "close", "scene", "image", "shows", "showi", "front",
                  "behin", "besid", "next", "table", "hands", "face", "chara", "figur", "looki", "holdi", "stand"}


def part_hit(text: str, parts: list[str]) -> str:
    """The single-part example an English picture description is built on ("" when none)."""
    words = _norm_words(text)
    for part in parts:
        own = {w for w in _norm_words(part) if len(w) >= 4} - _GENERIC_STEMS
        if own and len(own & words) >= max(1, (len(own) + 1) // 2):
            return part
    return ""


# ------------------------------------------------------------------------------ angles
#: Ways to sell the whole video; a package and its title take one of them.
ANGLE_KINDS = ("pain", "paradox", "stakes", "result", "recognition", "value", "hero")

_ANGLES_SYSTEM = """You are the packaging strategist of a YouTube channel. Before any title or thumbnail is \
written you decide HOW to sell the WHOLE video: its ANGLES.
An angle is one thought that makes the viewer of the brief want this video. It is said about the WHOLE \
video – its premise, main claim or core tension – never about one of its parts. Different angles sell the \
same video through different doors («kind»):
- pain: the viewer's own situation in this topic and what it costs them now
- paradox: the core tension – what the viewer believes or does versus what the video shows
- stakes: what the viewer keeps losing if nothing changes
- result: the after-state the whole video leads to
- recognition: the viewer sees themselves – their own behaviour in this topic
- value: what the whole video gives as one thing – the full list, the method, the map of the topic
- hero: only when the brief names who or what the whole video is about – that hero and the idea of the \
whole video
THE WHOLE-VIDEO TEST, for every angle: it stays true and relevant if any one part of the scope is cut out \
of the video. An angle resting on one example, story, person, experiment, number or one item of the scope \
fails.
Every angle speaks the viewer's own words about their own life – not the vocabulary of a textbook.
Write {count} angles, each of a different kind, in {language}. Answer ONLY with JSON:
{{"angles": [{{"kind": "{kinds}", "thought": "the angle in one plain sentence, in the viewer's words", \
"question": "the question it makes the viewer ask themselves", "emotion": "the feeling it hits, one word", \
"covers": "three different scope items it is equally true for, comma-separated"}}]}}"""


def make_angles(fg: FastgenClient, brief: dict[str, Any], language: str, llm: LlmSettings,
                count: int = 6) -> list[dict[str, Any]]:
    """Different ways to sell the whole video: ``[{"kind", "thought", "question", "emotion"}]`` (may be empty)."""
    kinds = [k for k in ANGLE_KINDS if k != "hero" or brief.get("hero")]
    system = _ANGLES_SYSTEM.format(language=language_name(language), count=min(count, len(kinds)),
                                   kinds="|".join(kinds))
    try:
        data = _chat(fg, system, f"{_niche(llm)}BRIEF:\n{_brief_text(brief)}{_market_text(brief)}", llm, 0.7)
    except (ApiError, ValueError) as exc:  # the packages find their angles themselves then
        log.warning("packaging angles failed: %s", exc)
        return []
    out: list[dict[str, Any]] = []
    for it in (data.get("angles") if isinstance(data, dict) else data) or []:
        if not isinstance(it, dict):
            continue
        thought = _clean_line(it.get("thought"))
        kind = _clean_line(it.get("kind")).lower()
        if not thought or kind not in kinds or any(_similar(thought, a["thought"], 0.7) for a in out):
            continue
        out.append({"kind": kind, "thought": thought[:240], "question": _clean_line(it.get("question"))[:200],
                    "emotion": _clean_line(it.get("emotion"))[:40]})
    return out[:count]


def _angles_text(brief: dict[str, Any]) -> str:
    angles = brief.get("angles") or []
    if not angles:
        return ""
    return "ANGLES – the ways to sell this whole video:\n" + "\n".join(
        f"{i}: [{a['kind']}] {a['thought']} (viewer asks: {a.get('question') or '–'}; feeling: "
        f"{a.get('emotion') or '–'})" for i, a in enumerate(angles))


def _market_text(brief: dict[str, Any], with_images: int = 0) -> str:
    """Outliers of the niche (see :mod:`.research`) for a prompt; ``with_images`` – that many thumbnails follow."""
    market = brief.get("market") or []
    if not market:
        return ""
    lines = [f"- «{m['title']}» – {m['views']:,} views, ×{m['ratio']} of the channel's usual".replace(",", " ")
             for m in market]
    note = f" The first {with_images} images attached are their thumbnails, in this order." if with_images else ""
    return ("\n\nMARKET – videos on this topic that got many times more views than usual on their channels: "
            "proof of what this audience clicks now, and the feed the new video will stand in." + note + "\n"
            + "\n".join(lines) + "\nLearn WHY they are clicked (the promise, the emotion, the tension, how text "
            "and picture work together) and beat them. Never reuse their wording, scene or composition: next to "
            "them the new package must look different and stronger.\n")


def market_uris(brief: dict[str, Any], limit: int) -> list[str]:
    """Thumbnails of the niche outliers as data URIs (fetched once per process)."""
    from .research import thumb_uri  # noqa: PLC0415 – network only when there is a market
    out = []
    for m in (brief.get("market") or [])[:limit]:
        uri = thumb_uri(m.get("thumb") or "")
        if uri:
            out.append(uri)
    return out


# ----------------------------------------------------------------------------- titles
_TITLE_RULES = """HARD RULES
0. THE TITLE'S JOB. The viewer meets the title together with a thumbnail that already raised a question. \
The title tells in one second what the video is AND makes the viewer think «это мне надо»: it names a \
concrete gain or pain of THEIR life and what the video gives about it. A slogan or an abstract topic name \
gives no reason to click. Never repeat the author's title word for word.
1. THE WHOLE VIDEO, NOT A PART. The title sells the whole video. It is never built on one example, case, \
experiment, story, person, number or object that the video uses in one part, and never on one item of a \
list: the viewer who clicks must get what the title promised from the first minute to the last. Test: if \
any one part were cut out of the video, would the title stay true? When the video is a list of N items, the \
honest count of the whole list is a strong frame: the number, what the items do, what the viewer cares about.
2. A REASON TO CLICK. Either a concrete value the viewer wants (the list, the way, the cause of THEIR \
problem) or a sharp open question – one of them is enough. Hold back the details (which things, which \
mistake): the title promises them, the video gives them.
3. HIT AN EMOTION. Touch the viewer's real feeling from the brief: fear of losing something, tiredness, \
regret, hope, the «that's exactly me» recognition, the slight sting of being told they do it wrong. A \
neutral, informative title loses.
4. Plain, concrete speech. NO poetic or philosophical wording, no metaphors. Abstract nouns (secret, mystery, \
journey, path, power, magic, essence, world of...) must not do the work – name the real thing of the \
viewer's life: the real symptom, behaviour, situation, consequence.
5. Provocative is good, lying is not: everything the title claims or promises is really in the brief.
6. Speak the viewer's own words and situation; address them directly («you») when it sounds natural.
7. Length 35–60 characters, hard max 65. The strongest words are in the first 40 characters.
8. No ALL CAPS words, no emoji, no hashtags, no trailing period, no quotes around the whole title, no empty \
filler («shocking», «you won't believe», «TOP», «MUST WATCH»). Strong words like «никогда», «ошибка», \
«перестаньте», «настоящая причина», «никто не говорит» are fine when a concrete thing follows. At most one \
colon or dash.
9. Natural {language}, as a native top YouTuber says it – not a translation from English."""

_TITLE_FORMULAS = """FORMULAS – every candidate uses a different one, at least 7 different formulas overall. \
The patterns only show the SHAPE: <…> is filled with the words of THIS video, and the wording around it is \
yours in {language} – never copy a pattern word for word:
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
or philosophical wording that tells nothing concrete. BAD – one example or one item of the video as the \
subject of the title."""

_TITLES_SYSTEM = """You are the best YouTube packaging editor in the {language}-speaking segment, the one \
channels hire when their click-through rate is low. Your titles get clicked because in ONE second the \
viewer understands what the video is and thinks «это мне надо» – it is about their own tiredness, fear, \
loss or hope, and the video gives something concrete about it.
You write for a viewer scrolling the home feed among 20 other videos – not for a search engine, not for a \
table of contents.

{rules}

{formulas}

{angles_rule}
Write {count} candidates. Answer ONLY with JSON:
{{"candidates": [{{"angle": <index of the angle>, "title": "...", "formula": "hidden_cause|mistake|contrarian|signs|warning|question|consequence|recognition|number_gap|myth|list_value"}}]}}"""

_ANGLES_RULE = """Every candidate expresses one of the ANGLES of the user message («angle» = its index), \
at least 2 candidates per angle. The angle gives the thought; the formula gives the shape."""

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
- specificity: names a concrete thing, behaviour or situation of the viewer's life (0 if it could fit 10 \
other videos)
- clarity: the topic is understood in one second by a stranger
- honest: 10 if every claim and promise is really in the brief, 0 if it is invented or exaggerated
- coverage: 10 if the title sells the whole video – its premise, main claim or core tension; 0 if it is \
built on one example, story, person, number or one list item that the video only touches (see PARTS)
and booleans/text:
- part: true if the title rests on an item of PARTS or on one item of the scope
- boring: true if it reads like an abstract topic name, a slogan, a textbook chapter or a plain restatement \
of the author's title – no gain or pain of the viewer in it. A concrete list of N things with the viewer's \
gain or pain is NOT boring
- figurative: true if it uses a metaphor, poetry, a philosophical or abstract word instead of the real thing
- weakness: the single most important thing that keeps a viewer from clicking, up to 12 words
Answer ONLY with JSON: {"scores": [{"i": <index>, "click": 0, "for_me": 0, "curiosity": 0, "pull": 0, "specificity": 0, \
"clarity": 0, "honest": 0, "coverage": 0, "part": false, "boring": false, "figurative": false, "weakness": "..."}]}"""

_REFINE_SYSTEM = """You sharpen YouTube titles to raise their click-through rate. You get titles with the \
weakness a critic found in each. For every title write 2 improved versions that remove the weakness and \
make the viewer want to click more – a more concrete gain or pain of the viewer, a stronger emotion, a \
sharper hook – keeping the claim true, keeping it about the WHOLE video (never narrowing it to one example \
or item) and obeying the rules.

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
    t = _clean_line(str(raw or "").replace("**", "")).strip('«»"“” ').rstrip(".")
    return t[:1].upper() + t[1:]  # models sometimes start a title in lower case


def _judge_titles(fg: FastgenClient, brief: dict[str, Any], titles: list[str], llm: LlmSettings) -> list[dict[str, Any]]:
    """Critic pass: ``[{"title", "total", "figurative", "weakness", ...}]`` in the order of ``titles``."""
    listing = "\n".join(f"{i}: {t}" for i, t in enumerate(titles))
    data = _chat(fg, _JUDGE_SYSTEM, f"BRIEF:\n{_brief_text(brief, parts=True)}\n\nCANDIDATES:\n{listing}", llm, 0.2)
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
        if num("coverage") < 6:  # sells a part – the viewer would expect another video
            total -= 0.6 * (6 - num("coverage"))
        if _flag(it, "part"):
            total -= 3
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
    """The best ``count`` titles, strongest first: ``[{"text", "score", "formula", "angle"}]``.

    Candidates over the angles of the brief → critic → the top ones are sharpened by their critique → critic
    again. ``avoid``: titles that were already shown (they are not repeated).
    """
    name = language_name(language)
    angles = brief.get("angles") or []
    system = _TITLES_SYSTEM.format(
        language=name, count=max(14, count * 3, len(angles) * 2), rules=_TITLE_RULES.format(language=name),
        formulas=_TITLE_FORMULAS.format(language=name), angles_rule=_ANGLES_RULE if angles else "")
    user = f"{_niche(llm)}BRIEF:\n{_brief_text(brief)}\n"
    if angles:
        user += f"\n{_angles_text(brief)}\n"
    user += _market_text(brief)
    if avoid:
        user += "\nALREADY SHOWN – do not repeat or paraphrase:\n" + "\n".join(f"- {t}" for t in avoid[:12])
    data = _chat(fg, system, user, llm, 0.9)
    raw = data.get("candidates") if isinstance(data, dict) else data
    formulas: dict[str, str] = {}
    kinds: dict[str, str] = {}
    seen_titles = [t.lower() for t in avoid or []]
    for it in raw or []:
        title = _clean_title(it.get("title") if isinstance(it, dict) else it)
        if not title or title_problem(title) or title.lower() in seen_titles or title in formulas:
            continue
        formulas[title] = _clean_line(it.get("formula") if isinstance(it, dict) else "")[:20]
        kinds[title] = _angle_kind(angles, it.get("angle") if isinstance(it, dict) else None)
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
                            source = top[int(it.get("from", 0))]["title"]
                        except (IndexError, TypeError, ValueError):
                            source = ""
                        formulas[t], kinds[t] = formulas.get(source, ""), kinds.get(source, "")
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
    # Strongest first, but no near-duplicates; the first pass also wants a different angle and formula.
    for distinct in (True, False):
        for s in pool:
            formula, kind = formulas.get(s["title"], ""), kinds.get(s["title"], "")
            if len(picked) >= count or any(p["text"] == s["title"] for p in picked):
                continue
            if any(_similar(s["title"], p["text"]) or (distinct and (
                    (formula and formula == p["formula"]) or (kind and kind == p["angle"]))) for p in picked):
                continue
            picked.append({"text": s["title"], "score": s["total"], "formula": formula, "angle": kind})
    picked.sort(key=lambda p: -p["score"])
    return picked


def _angle_kind(angles: list[dict[str, Any]], index: Any) -> str:
    try:
        return str(angles[int(index)]["kind"])
    except (IndexError, KeyError, TypeError, ValueError):
        return ""


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
    user = (f"{_niche(llm)}VIDEO TITLE: {title}\n\nBRIEF:\n{_brief_text(brief, parts=True)}\n\n"
            f"CHAPTER CANDIDATES (seconds: paragraph start):\n{chapter_lines}\n\n"
            f"SCRIPT BEGINNING:\n{script_head[:3_000]}")
    data = _chat(fg, system, user, llm, 0.6, creative=False)
    if not isinstance(data, dict):
        raise ValueError("LLM вернул описание в неверном формате")

    known = f"{script_head} {title} {_brief_text(brief, parts=True)}"

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
                   f"about and bullets entirely in {name}, translating every such word.", llm, 0.4, creative=False)
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
_LAYOUT_HELP = """  subject_left / subject_right: one big subject on that side fills about half of the frame, the other \
side is calm empty background for the text – the default, strong for one person or object;
  subject_low: the subject is centred and fills the lower two thirds, the top third is calm for the text – \
for a scene, a figure in its surroundings, something small in something huge;
  subject_high: an extreme close-up – a face or an object fills the upper two thirds, cropped tight, the \
bottom third is calm for the text – for a strong emotion or one telling detail of the viewer's situation;
  split: the frame is divided down the middle into two contrasting states of the same subject (before / \
after, what one believes / what is real), the top quarter is calm for the text – for the paradox and the \
result."""

_PACKAGE_SYSTEM = """You are a senior YouTube packaging director, the one channels hire when their \
click-through rate is low. You make PACKAGES: a thumbnail (ONE short text + ONE picture) and the title \
that goes with it. The viewer sees them for half a second at 170 px among 20 other videos.

HOW A PACKAGE WORKS – two roles, two steps
1. The THUMBNAIL raises a question about the WHOLE video. The viewer sees the text and the picture and at \
once asks something they cannot answer themselves; the question comes from the text AND the picture \
together, often from the gap between them.
2. The TITLE finishes the job. The viewer glances at it and thinks «о, это мне надо»: it says what the \
video is and names a concrete gain or pain of the viewer's own life, promising the answer to the \
thumbnail's question without giving it away.

ONE PACKAGE = ONE ANGLE. {angles_rule} Text, picture and title of a package express the thought of ITS \
angle, and the package sells the WHOLE video: whoever clicks must get what it promised from the first \
minute to the last.
The most common and the most costly mistake is a package built on one example, case, experiment, \
historical story, person, number or object that the video uses in a single part – the click is lost, or \
the viewer leaves disappointed. Test every package: if any one part of the video were cut out, would the \
package stay true and fitting? If not, redo it.

THE TEXT («headline», in {language})
- 2–5 words, at most {max_chars} characters, written in normal case (capitals are applied later), no \
emoji, no trailing period. Native, spoken {language}.
- It turns the angle's thought into a hook: it raises the question, never answers it and never names the \
topic plainly. A hook carries tension inside itself: a claim that goes against what the viewer believes \
about themselves, a verdict aimed at the viewer, the inner voice of someone caught in the problem, a fact \
that does not fit. WEAK: a noun phrase naming the topic, an instruction, a short summary of the angle, the \
question the video's title already asks. No truisms, no empty words («shock», «the whole truth»). \
Provocative is good, false is not.
- Text forms vary across the set: first person, an address to the viewer, a verdict, a question, a bare \
number with a word. A held-back object («это», «так») is ONE tool – at most one package of the set uses it.
- «accent»: the ONE word of the headline that carries the hook (it is highlighted); a number if there is one.

THE PICTURE («prompt», in English, 40–80 words)
- It shows the thought of the angle in one image that the eye reads in a second. Its subject is taken \
from the visual world of the whole topic (see the brief) or is the one the whole video is about: the \
viewer's own situation at its most telling moment, the core tension made visible inside one scene, the \
state before or after, the hero of the whole video at a telling moment – shown at its most striking: \
exaggerated, at an odd scale, at the tense moment. Never an example from one part of the video.
- It is a visual IDEA, not an illustration: a concrete situation with a twist that makes the eye stop – an exaggeration, an absurd scale, a contradiction inside the scene, a consequence shown before its cause, the person doing the opposite of what the situation needs. A person just looking at something with a feeling is not an idea.
- A stranger should guess the subject area of the video from the picture alone.
- A person in it acts or reacts within a concrete situation – never a generic person just showing a \
feeling. BANNED stock scenes: a person holding a cup or mug, sitting in an armchair or at a window, holding \
their head or resting it on a desk, raising a hand in a «stop» gesture, staring at a phone, smiling with \
closed eyes, looking at papers, notes, charts or a screen. No clichés: no gears or circuits in brains, light bulbs, glowing orbs, hourglasses, mazes, \
chess pieces, puppets on strings, surreal collages, floating symbols.
- The emotion or state is clear and fits the idea – calm, fear, joy, shock or anything else; it is \
readable at 170 px. One focal point (two for split), at most 3 elements, the subject is BIG, close \
framing, simple background.
- «layout» – the composition; choose the one that serves the idea, the set uses at least {layouts_min} \
different ones, and the scene in «prompt» is described to fit it:
{layout_help}
- The art style is FIXED, MANDATORY and added to the prompt automatically: «{style}». The prompt describes \
ONLY the scene – never copy the style into it, never name colours, lighting, style, medium or camera words \
and never contradict the style: for a cartoon style describe cartoon characters, not real people. No \
text, letters or numbers in the picture.

THE TITLE («title», in {language})
{title_task}

FINAL CHECK for every package: a stranger sees ONLY the thumbnail – which question pops into their head, \
and do they need the answer? Is it about the whole video, not one of its parts? Then they read the title – \
do they think «это мне надо»? If anything fails, redo it.
Packages must differ from each other in angle, text form, scene, layout and pose.

Write {count} packages. Answer ONLY with JSON, fields in this order (the chain of thought):
{{"packages": [{{"angle": <index of the angle>, "question": "the question the viewer must ask at the sight \
of the thumbnail alone, in {language}", "headline": "...", "accent": "...", "twist": "what in the picture \
makes the eye stop – its exaggeration or contradiction, one English phrase", "subject": "what the picture \
shows, 2–8 English words", "layout": "{layouts}", "prompt": "...", "title": "..."}}]}}"""

_PACKAGE_ANGLES = """The ANGLES of the user message are the ways to sell this video, already chosen: every \
package takes one («angle» = its index), every angle is used, and two packages of the same angle differ in \
everything else."""

_PACKAGE_NO_ANGLES = """First find the angles yourself: different thoughts about the WHOLE video (the \
viewer's pain, the core tension, the stakes, the result, the viewer recognising themselves, the value of the \
whole video); every package takes a different one («angle» = its number, from 0)."""

_PACKAGE_TITLE_FREE = """Write the title for THIS thumbnail, of the same angle. {title_rules}
- The title does not repeat the words of the headline and does not reveal what the headline holds back \
(it may name the category and the count, not the things themselves).
- It promises exactly what the video is: a list of N things is never «the main reason» or «one simple way».
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
- hook: 0–10, the headline alone has tension – it goes against a belief, accuses, confesses or does not fit; 3 or less for a noun phrase naming the topic, an instruction or a summary
- stop: 0–10, does it stand out among 20 thumbnails – a clearly readable state of the character, a \
striking mismatch of text and picture, one focal point (calm is not a minus by itself; a vague, \
nothing-to-read picture is)
- picture_instant: 0–10, the picture is understood in one second at 170 px
- idea: 0–10, the picture has a visual idea – a twist, an exaggeration, a contradiction inside the scene; 3 or less for a plain illustration (a person looking at something with a feeling)
- topic: 0–10, a stranger guesses the subject area of the video from the text and the picture (0 if they \
would fit any video of the channel: a generic person showing a feeling, a stock pose)
- whole: 0–10, the text and the picture are about the WHOLE video – its premise, core tension, its hero or \
the viewer's situation in it; 0 if they rest on one example, case, story, person, number or object that the \
video uses in a single part (see PARTS)
STEP 2 – the viewer reads the title:
- for_me: 0–10, they think «это мне надо» – a concrete gain or pain of their own life (0 for an abstract \
topic or a slogan)
- closes: 0–10, the title promises the answer to the thumbnail's question without giving it away and \
without repeating the headline
- clarity: 0–10, it is clear in one second what the video is
- covers: 0–10, the title sells the WHOLE video; 0 if it is about one part, example or item
- honest: 0–10, every claim of the headline, the picture and the title is really in the BRIEF
and booleans: "part" (the headline, the picture or the title rests on an item of PARTS or on one item of \
the scope), "repeats" (the title repeats the headline's words or idea), "abstract" (the picture relies on \
a cliché symbol or an abstraction that is not understood at once), "stock" (the picture is a stock scene: \
a person with a cup or mug, in an armchair or at a window, holding their head, raising a «stop» hand, \
staring at a phone – or anything else that would fit any video).
Answer ONLY with JSON: {{"scores": [{{"i": <index>, "question": "...", "gap": 0, "stop": 0, \
"hook": 0, "idea": 0, "picture_instant": 0, "topic": 0, "whole": 0, "for_me": 0, "closes": 0, "clarity": 0, "covers": 0, \
"honest": 0, "part": false, "repeats": false, "abstract": false, "stock": false}}]}}"""


#: Stock scenes a model falls back to on any topic; they made every thumbnail of a channel look alike.
_STOCK_SCENE = re.compile(
    r"\b(?:mug|teacup|cup of (?:tea|coffee)|armchair|stop gesture|(?:raises?|raising|holds? up|holding up) "
    r"(?:a |one |his |her |their )?(?:hand|palm)|palm (?:facing|out)|(?:holding|clutching) (?:his|her|their) "
    r"head|head (?:in|on) (?:his |her |their )?hands|staring at (?:a |the |his |her )?(?:phone|smartphone))\b",
    re.I)


def _thumb_headline_ok(headline: str) -> bool:
    return bool(headline) and len(headline.split()) <= HEADLINE_MAX_WORDS and len(headline) <= HEADLINE_MAX_CHARS


def _common_stems(items: list[dict[str, Any]]) -> set[str]:
    """Words most pictures of a channel share (its mascot, its kind of hero): they tell nothing about likeness."""
    subjects = [_norm_words(str(a.get("subject") or "")) for a in items if a.get("subject")]
    counts = Counter(w for words in subjects for w in words)
    return {w for w, k in counts.items() if len(subjects) >= 4 and k / len(subjects) >= 0.3}


def _looks_like(c: dict[str, Any], other: dict[str, Any], ignore: set[str]) -> bool:
    """The picture repeats another one: the same subject (English, so comparable across languages)."""
    skip = _GENERIC_STEMS | ignore
    a = _norm_words(str(c.get("subject") or "")) - skip
    b = _norm_words(str(other.get("subject") or "")) - skip
    return bool(a and b) and len(a & b) / min(len(a), len(b)) >= 0.4


def thumbnail_concepts(
    fg: FastgenClient, brief: dict[str, Any], language: str, title: str | None,
    llm: LlmSettings, publish: PublishSettings, count: int, avoid: list[dict[str, Any]] | None = None,
    title_ideas: list[str] | None = None, channel_used: list[dict[str, Any]] | None = None,
    elsewhere: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """The best ``count`` packages: a thumbnail (headline + picture) and the title that goes with it.

    Each one is ``{"prompt", "headline", "accent", "layout", "side", "subject", "angle", "thought", "question",
    "title", "title_fixed", "score"}``. ``title`` – make thumbnails for this fixed title; ``None`` – every
    package gets its own title. ``avoid`` are ideas that were already shown: new ones differ in headline,
    picture and title. ``title_ideas`` – the strongest titles of :func:`make_titles`, a package may take or
    adapt one of them. ``channel_used`` – thumbnails of the channel's other videos, ``elsewhere`` – recent
    thumbnails of the other channels (often the same topic in another language): a new one must not look
    like them.
    """
    name = language_name(language)
    angles = brief.get("angles") or []
    wanted = max(count * 3, 8, len(angles))
    fixed = (title or "").strip()
    ideas = ("\n- Strong titles already written for this video – take one that fits the thumbnail, adapt it or "
             "write a better one:\n" + "\n".join(f"  «{t}»" for t in title_ideas[:8])) if title_ideas else ""
    title_task = (_PACKAGE_TITLE_FIXED.format(title=fixed) if fixed
                  else _PACKAGE_TITLE_FREE.format(title_rules=_TITLE_RULES.format(language=name), ideas=ideas))
    system = _PACKAGE_SYSTEM.format(language=name, max_chars=HEADLINE_MAX_CHARS, count=wanted,
                                    style=publish.thumbnail_style.strip(), title_task=title_task,
                                    angles_rule=_PACKAGE_ANGLES if angles else _PACKAGE_NO_ANGLES,
                                    layouts="|".join(THUMB_LAYOUTS), layouts_min=min(3, max(1, count)),
                                    layout_help=_LAYOUT_HELP)
    user = f"{_niche(llm)}BRIEF:\n{_brief_text(brief)}\n"
    if angles:
        user += f"\n{_angles_text(brief)}\n"
    market_images = market_uris(brief, 6) if sees_images(packaging_model(llm)) else []
    user += _market_text(brief, len(market_images))
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
    other = [a for a in elsewhere or [] if a.get("subject")]
    if other:
        user += ("\nUSED RECENTLY ON THE AUTHOR'S OTHER CHANNELS (often on the same topic in another language) – "
                 "this channel's thumbnails must look different: another subject, scene and layout:\n"
                 + "\n".join(f"- {a.get('subject', '')} ({a.get('layout') or 'side'})" for a in other[:20]) + "\n")
    avoid_heads = {_clean_line(a.get("headline")).lower() for a in shown}
    style = publish.thumbnail_style.strip().rstrip(".")
    parts = list(brief.get("parts") or [])
    cands: list[dict[str, Any]] = []
    # Models often write fewer packages than asked; a second round adds new ones to choose from.
    for _round in range(2):
        if len(cands) >= max(count * 2, 6):
            break
        more = ("" if not cands else "\nALREADY WRITTEN in this session – write NEW packages, different from "
                "these in headline, scene and layout:\n"
                + "\n".join(f"- «{c['headline']}» / {c['subject']} ({c['layout']})" for c in cands) + "\n")
        data = _chat(fg, system, user + more, llm, 0.9, images=market_images)
        cands += _parse_packages(data.get("packages") if isinstance(data, dict) else data, angles, fixed,
                                 avoid_heads | {c["headline"].lower() for c in cands}, style)
    if not cands:
        return []

    own_common, other_common = _common_stems(used), _common_stems(other)
    for c in cands:
        c["penalty"] = 0.0
        # Code checks what the critic may miss: a single-part example in the picture, a stock scene, a picture
        # of another video of this channel or of the other channels.
        hit = part_hit(f"{c['subject']} {c['prompt']}", parts)
        if hit:
            c["penalty"] += 4
            log.info("thumbnail idea rests on a part (%s): %s", hit, c["subject"])
        if _STOCK_SCENE.search(c["prompt"]):
            c["penalty"] += 2
        if any(_looks_like(c, a, own_common) or (a.get("headline") and _similar(c["headline"], str(a["headline"]), 0.6))
               for a in used):
            c["penalty"] += 2.5
        if any(_looks_like(c, a, other_common) for a in other):
            c["penalty"] += 2
    scores = _judge_packages(fg, brief, cands, llm, name)
    for i, c in enumerate(cands):
        c["score"] = round(_package_score(scores[i], c) if i in scores else 5.0 - 0.01 * i - c["penalty"], 2)
        question = _clean_line((scores.get(i) or {}).get("question"))
        if question:  # the critic's question is the viewer's, the generator's only its intent
            c["question"] = question[:200]

    picked: list[dict[str, Any]] = []
    # Variants for YouTube's A/B test are worth something only when they differ: the first pass wants a
    # different angle AND composition, the second a different angle, the third fills up.
    for strict in (2, 1, 0):
        for c in sorted(cands, key=lambda c: -c["score"]):
            if c in picked or len(picked) >= count:
                continue
            if any(_similar(c["headline"], p["headline"], 0.5)
                   or (c["subject"] and p["subject"] and _similar(c["subject"], p["subject"], 0.6))
                   or (not fixed and _similar(c["title"], p["title"], 0.7))
                   or (strict >= 1 and c["angle"] and c["angle"] == p["angle"])
                   or (strict >= 2 and c["layout"] == p["layout"])
                   for p in picked):
                continue
            picked.append(c)
    if picked:  # a failed idea is worse than one variant less: the user asks for more with a click
        floor = min(4.0, picked[0]["score"] - 3)
        picked = [c for c in picked if c["score"] >= floor] or picked[:1]
    if picked and not fixed:
        try:
            _sharpen_package_titles(fg, brief, picked, llm, name, ideas)
        except (ApiError, ValueError) as exc:
            log.warning("package title sharpening failed: %s", exc)
        picked.sort(key=lambda c: -c["score"])
    for c in picked:
        c.pop("penalty", None)
    return picked


def _parse_packages(items: Any, angles: list[dict[str, Any]], fixed: str, avoid_heads: set[str],
                    style: str) -> list[dict[str, Any]]:
    """Candidate packages of the model's answer that pass the hard rules (not judged yet)."""
    cands: list[dict[str, Any]] = []
    for n, it in enumerate(items or []):
        if not isinstance(it, dict) or not str(it.get("prompt", "")).strip():
            continue
        headline = re.sub(r"[«»“”\"*_]", "", re.sub(r"\s+", " ", str(it.get("headline") or ""))).strip().rstrip(".")
        if not _thumb_headline_ok(headline) or headline.lower() in avoid_heads:
            continue
        own_title = fixed or _clean_title(it.get("title"))
        if not own_title or (not fixed and title_problem(own_title)):
            continue
        if _similar(headline, own_title, 0.8) and len(headline.split()) > 1:
            continue  # the thumbnail only repeats the title
        accent = _clean_line(it.get("accent")).strip('"«»“” .*_')
        prompt = str(it["prompt"]).strip()
        if style:  # the model likes to echo the style, which the drawing adds once more
            prompt = re.sub(re.escape(style) + r"\.?\s*", "", prompt, flags=re.I).strip() or prompt
        layout = thumb_layout({"layout": _clean_line(it.get("layout")).lower(), "side": it.get("side")})
        try:
            k = int(it.get("angle"))
        except (TypeError, ValueError):
            k = -1
        # Without angles of the brief the model numbers its own; their numbers still keep the set diverse.
        angle = (angles[k] if 0 <= k < len(angles) else {}) if angles else {"kind": f"own{k if k >= 0 else n}"}
        cands.append({
            "prompt": prompt,
            "headline": headline,
            "accent": accent if accent and accent.lower() in headline.lower() else "",
            "layout": layout,
            "side": "left" if layout == "subject_left" else "right",
            "subject": _clean_line(it.get("subject"))[:80],
            "angle": str(angle.get("kind") or ""),
            "thought": str(angle.get("thought") or ""),
            "question": _clean_line(it.get("question"))[:200],
            "title": own_title,
            "title_fixed": bool(fixed),
            "title_index": 0,
        })
    return cands


def _judge_packages(fg: FastgenClient, brief: dict[str, Any], packs: list[dict[str, Any]], llm: LlmSettings,
                    language_label: str) -> dict[int, dict[str, Any]]:
    """The critic's scores by index of ``packs`` (empty when the critic failed)."""
    scores: dict[int, dict[str, Any]] = {}
    try:
        listing = "\n".join(f"{i}: thumbnail text «{c['headline']}» / picture ({c.get('layout', '')}): {c['prompt']}"
                            f" / title: {c['title']}" for i, c in enumerate(packs))
        judged = _chat(fg, _PACKAGE_JUDGE_SYSTEM.format(language=language_label),
                       f"BRIEF:\n{_brief_text(brief, parts=True)}\n\nPACKAGES:\n{listing}", llm, 0.2)
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
    # The question of the thumbnail leads, then «это мне надо» of the title; both about the whole video.
    value = (0.15 * num("gap") + 0.11 * num("hook") + 0.10 * num("idea") + 0.05 * num("stop")
             + 0.04 * num("picture_instant") + 0.06 * num("topic") + 0.12 * num("whole") + 0.14 * num("for_me")
             + 0.08 * num("closes") + 0.05 * num("clarity") + 0.10 * num("honest"))
    value -= float(pack.get("penalty") or 0)
    if num("whole") < 6:  # the thumbnail sells one part of the video
        value -= 0.6 * (6 - num("whole"))
    if num("covers") < 6:  # so does the title
        value -= 0.5 * (6 - num("covers"))
    if _flag(s, "part"):
        value -= 3
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
package you get the thumbnail text, the picture, the thought it sells, the question the viewer asks at the \
sight of it and the current title. Write 3 different, better titles for each. The viewer reads the title \
right after the thumbnail and must think «это мне надо»: it says what the video is, names a concrete gain \
or pain of the viewer's own life and promises the answer to the thumbnail's question without giving it away \
and without repeating the headline. It sells the WHOLE video: never one example, story, person or one item \
of a list, and it promises exactly what the video is – a list of N things is never «the main reason» or \
«one simple way». When the video is a list, at least one of the 3 uses its exact count.

{rules}{ideas}

Answer ONLY with JSON: {{"titles": [{{"i": <package index>, "title": "..."}}]}}"""


def _sharpen_package_titles(fg: FastgenClient, brief: dict[str, Any], picked: list[dict[str, Any]],
                            llm: LlmSettings, language_label: str, ideas: str) -> None:
    """New titles for the chosen thumbnails; each package keeps the title the critic likes best with it."""
    listing = "\n".join(f"{i}: thumbnail text «{p['headline']}» / picture: {p['subject']} / sells: "
                        f"{p.get('thought') or '–'} / viewer's question: {p['question']} / title now: {p['title']}"
                        for i, p in enumerate(picked))
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


# ------------------------------------------------------------------------- drawn thumbnails
_VISUAL_JUDGE_SYSTEM = """You are a ruthless YouTube packaging critic. You look at REAL rendered thumbnails as \
they appear in the home feed on a phone – small. The first {count} images are CANDIDATES for one video \
(their headlines and titles are listed in the text, in the same order). The images after them are \
NEIGHBOURS: other videos the viewer sees in the same feed – strong videos of this niche and earlier videos \
of this channel. Be strict: average = 5–6, 8+ is rare.
For every candidate, judging at THIS small size:
- read: 0–10, the headline is read in a glance: big, high contrast, not covered, not cut off
- focus: 0–10, one clear focal point; the subject and its emotion or action are understood in a second; no \
clutter, no muddy contrast
- stop: 0–10, it stands out among the neighbours – the eye would stop on it in this feed
- click: 0–10, together with its title, how badly the viewer of this niche wants to click
- flaws: the concrete visual defects, each a few words in Russian (distorted face or hands, stray letters or \
words drawn in the picture, text over the face, the subject cut off, the picture contradicts the headline, \
looks like the neighbours…); an empty list if none
- verdict: "keep", "weak" or "reject" (reject – a defect a viewer would notice, or it does not work at all)
- note: one sentence in Russian for the author: what works or what to fix
Answer ONLY with JSON: {{"images": [{{"n": <candidate number from 1>, "read": 0, "focus": 0, "stop": 0, \
"click": 0, "flaws": [], "verdict": "keep", "note": "..."}}]}}"""


def judge_drawn_thumbnails(
    fg: FastgenClient, brief: dict[str, Any], items: list[dict[str, Any]], neighbours: list[str],
    llm: LlmSettings,
) -> dict[int, dict[str, Any]]:
    """A vision critic on drawn thumbnails: ``{index in items: {"visual", "verdict", "note", "flaws"}}``.

    ``items`` – ``{"uri", "headline", "title"}``; ``neighbours`` – data URIs of other thumbnails of the feed.
    Empty when the packaging model does not see images or the call failed.
    """
    model = packaging_model(llm)
    if not items or not sees_images(model):
        return {}
    listing = "\n".join(f"{i + 1}: headline «{it.get('headline') or '–'}» / title: {it.get('title') or '–'}"
                        for i, it in enumerate(items))
    text = (f"VIDEO: {brief.get('premise') or brief.get('working_title') or ''}\n\nCANDIDATES:\n{listing}\n\n"
            f"{len(neighbours)} neighbour images follow the candidates.")
    content = [{"type": "text", "text": text}] + [
        {"type": "image_url", "image_url": {"url": u}} for u in [it["uri"] for it in items] + neighbours]
    try:
        data = fg.chat_json([{"role": "system", "content": _VISUAL_JUDGE_SYSTEM.format(count=len(items))},
                             {"role": "user", "content": content}], model=model, temperature=0.2, attempts=2)
    except ApiError as exc:
        log.warning("visual thumbnail critic failed: %s", exc)
        return {}
    out: dict[int, dict[str, Any]] = {}
    for s in (data.get("images") if isinstance(data, dict) else data) or []:
        try:
            i = int(s["n"]) - 1
        except (KeyError, TypeError, ValueError):
            continue
        if not 0 <= i < len(items):
            continue

        def num(k: str, s: dict[str, Any] = s) -> float:
            try:
                return max(0.0, min(10.0, float(s.get(k, 0))))
            except (TypeError, ValueError):
                return 0.0
        verdict = _clean_line(s.get("verdict")).lower()
        visual = 0.2 * num("read") + 0.2 * num("focus") + 0.25 * num("stop") + 0.35 * num("click")
        if verdict == "reject":
            visual -= 4
        flaws = [_clean_line(f) for f in s.get("flaws") or [] if _clean_line(f)][:5] \
            if isinstance(s.get("flaws"), list) else []
        out[i] = {"visual": round(visual, 2), "verdict": verdict or "keep", "note": _clean_line(s.get("note"))[:300],
                  "flaws": flaws}
    return out
