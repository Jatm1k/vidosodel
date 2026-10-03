"""Language-agnostic text helpers: normalisation, paragraphs, sentence detection."""
from __future__ import annotations

import re

#: Characters that end a sentence when they terminate a word (closing quotes/brackets allowed after).
_SENT_END = re.compile(r"[.!?…。！？]+[\"'»”’)\]]*$")
_WORD_CHARS = re.compile(r"[\w]", re.U)
_LUMEAN_PAUSE = re.compile(r"\{\{pause[^}]*\}\}", re.I)
_BRACKET_TAG = re.compile(r"\[[^\[\]\n]+\]")
#: Abbreviations that end with a dot but do not end a sentence.
_ABBREVIATIONS = {
    "т.д.", "т.п.", "т.е.", "т.к.", "др.", "пр.", "г.", "гг.", "в.", "вв.", "им.", "ул.", "стр.", "см.",
    "mr.", "mrs.", "ms.", "dr.", "prof.", "st.", "vs.", "etc.", "e.g.", "i.e.", "jr.", "sr.", "no.",
}


def normalize_script(text: str) -> str:
    """Normalise line breaks/whitespace the same way Lumean does before synthesis."""
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\t", " ")
    text = re.sub(r"[  ]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def spoken_text(text: str) -> str:
    """Script text without markup that is not pronounced (pause tags, [directions])."""
    return _BRACKET_TAG.sub("", _LUMEAN_PAUSE.sub(" ", text))


def paragraphs(text: str) -> list[str]:
    """Split a script into paragraphs (blank line separated; single newlines too if no blank lines)."""
    text = normalize_script(text)
    parts = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    if len(parts) <= 1 and "\n" in text:
        parts = [p.strip() for p in text.split("\n") if p.strip()]
    return parts


def tokenize_words(text: str) -> list[str]:
    """Whitespace tokens that contain at least one letter/digit (as TTS word timings do)."""
    return [t for t in spoken_text(text).split() if _WORD_CHARS.search(t)]


def ends_sentence(word: str) -> bool:
    w = word.strip()
    if not _SENT_END.search(w):
        return False
    return w.lower() not in _ABBREVIATIONS


def ends_clause(word: str) -> bool:
    """Soft boundary inside a sentence: comma, semicolon, colon, dash."""
    return bool(re.search(r"[,;:—–\-][\"'»”’)\]]*$", word.strip()))


def split_sentences(text: str) -> list[str]:
    """Split plain text into sentences using the same word-level rule as timings."""
    sentences: list[str] = []
    current: list[str] = []
    for word in text.split():
        current.append(word)
        if ends_sentence(word):
            sentences.append(" ".join(current))
            current = []
    if current:
        sentences.append(" ".join(current))
    return sentences
