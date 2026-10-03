"""Supported languages (ElevenLabs base set – available on all Lumean TTS models)."""
from __future__ import annotations

#: code → (Russian UI name, English name used in LLM prompts, flag emoji)
LANGUAGES: dict[str, tuple[str, str, str]] = {
    "ru": ("Русский", "Russian", "🇷🇺"),
    "en": ("Английский", "English", "🇺🇸"),
    "es": ("Испанский", "Spanish", "🇪🇸"),
    "pt": ("Португальский", "Portuguese", "🇧🇷"),
    "de": ("Немецкий", "German", "🇩🇪"),
    "fr": ("Французский", "French", "🇫🇷"),
    "it": ("Итальянский", "Italian", "🇮🇹"),
    "uk": ("Украинский", "Ukrainian", "🇺🇦"),
    "pl": ("Польский", "Polish", "🇵🇱"),
    "tr": ("Турецкий", "Turkish", "🇹🇷"),
    "nl": ("Нидерландский", "Dutch", "🇳🇱"),
    "sv": ("Шведский", "Swedish", "🇸🇪"),
    "da": ("Датский", "Danish", "🇩🇰"),
    "fi": ("Финский", "Finnish", "🇫🇮"),
    "cs": ("Чешский", "Czech", "🇨🇿"),
    "sk": ("Словацкий", "Slovak", "🇸🇰"),
    "ro": ("Румынский", "Romanian", "🇷🇴"),
    "bg": ("Болгарский", "Bulgarian", "🇧🇬"),
    "hr": ("Хорватский", "Croatian", "🇭🇷"),
    "el": ("Греческий", "Greek", "🇬🇷"),
    "ar": ("Арабский", "Arabic", "🇸🇦"),
    "hi": ("Хинди", "Hindi", "🇮🇳"),
    "ta": ("Тамильский", "Tamil", "🇮🇳"),
    "id": ("Индонезийский", "Indonesian", "🇮🇩"),
    "ms": ("Малайский", "Malay", "🇲🇾"),
    "fil": ("Филиппинский", "Filipino", "🇵🇭"),
    "ja": ("Японский", "Japanese", "🇯🇵"),
    "ko": ("Корейский", "Korean", "🇰🇷"),
    "zh": ("Китайский", "Chinese", "🇨🇳"),
}


def language_name(code: str) -> str:
    """English language name for LLM prompts."""
    return LANGUAGES.get(code, (code, code, ""))[1]


def language_list() -> list[dict[str, str]]:
    return [{"code": c, "name": ru, "english": en, "flag": flag} for c, (ru, en, flag) in LANGUAGES.items()]
