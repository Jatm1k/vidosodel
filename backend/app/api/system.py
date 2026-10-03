"""System status, global settings and service catalogues (voices, templates, models)."""
from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import get_settings
from ..pipeline.languages import language_list
from ..render.media import available_encoders, ffmpeg_version
from ..render.motion import EFFECT_LABELS, EFFECTS
from ..render.transitions import TRANSITION_LABELS, TRANSITIONS
from ..services.fastgen import IMAGE_OPERATIONS, FastgenClient
from ..services.http import ApiError
from ..services.limiter import limiter
from ..services.lumean import LumeanClient
from ..services.updates import updates
from ..settings_schema import default_settings
from ..settings_store import load_config, public_config, save_config

router = APIRouter(prefix="/api", tags=["system"])


def _api_error(exc: ApiError) -> HTTPException:
    return HTTPException(status_code=502 if exc.status in (0, 500, 502, 503) else 400, detail=str(exc.message or exc))


@router.get("/meta")
def meta() -> dict[str, Any]:
    """Static catalogues for the UI: languages, effects, transitions, image models, defaults."""
    return {
        "languages": language_list(),
        "effects": [{"id": e, "name": EFFECT_LABELS[e]} for e in EFFECTS],
        "transitions": [{"id": t, "name": TRANSITION_LABELS[t]} for t in TRANSITIONS],
        "image_operations": IMAGE_OPERATIONS,
        "defaults": default_settings(),
        "encoders": available_encoders(),
        "cpu_count": os.cpu_count(),
    }


@router.get("/system/status")
def status() -> dict[str, Any]:
    cfg = load_config()
    return {
        "ffmpeg": ffmpeg_version(),
        "keys": {"lumean": bool(cfg.lumean_api_key), "fastgen": bool(cfg.fastgen_api_key)},
        "fastgen": limiter.status() if cfg.fastgen_api_key else None,
        "data_dir": str(get_settings().data_dir),
    }


@router.get("/system/version")
def version_info() -> dict[str, Any]:
    """Installed version and the last result of the update check."""
    return updates.state()


@router.post("/system/version/check")
def version_check() -> dict[str, Any]:
    updates.check(fetch=True)
    return updates.state()


@router.post("/system/update")
def install_update() -> dict[str, Any]:
    """``git pull`` the new version; the launcher then restarts the server."""
    result = updates.apply_and_restart()
    if not result["ok"]:
        raise HTTPException(409, result["message"])
    return result


@router.get("/system/balance")
def balance() -> dict[str, Any]:
    """Lumean wallet + FastGen hourly usage (slow-ish: calls both APIs)."""
    out: dict[str, Any] = {"lumean": None, "fastgen": None, "errors": {}}
    try:
        with LumeanClient() as lm:
            out["lumean"] = lm.balance()
    except ApiError as exc:
        out["errors"]["lumean"] = exc.message
    try:
        limiter.sync_server(force=True)
        out["fastgen"] = limiter.status()
    except ApiError as exc:
        out["errors"]["fastgen"] = exc.message
    return out


@router.get("/settings")
def get_app_settings() -> dict[str, Any]:
    return public_config()


@router.put("/settings")
def put_app_settings(patch: dict[str, Any]) -> dict[str, Any]:
    save_config(patch)
    return public_config()


class KeyCheck(BaseModel):
    service: str


@router.post("/settings/check")
def check_key(body: KeyCheck) -> dict[str, Any]:
    """Verify that the stored API key works."""
    try:
        if body.service == "lumean":
            with LumeanClient() as lm:
                lm.user()
        else:
            with FastgenClient() as fg:
                usage = fg.usage()
            limits = usage.get("account_limits") or {}
            save_config({
                "fastgen_credits_per_hour": limits.get("img_gen_per_hour_limit") or load_config().fastgen_credits_per_hour,
                "fastgen_image_threads": limits.get("img_generation_threads_allowed") or load_config().fastgen_image_threads,
            })
        return {"ok": True}
    except ApiError as exc:
        return {"ok": False, "error": exc.message}


# ------------------------------------------------------------------- Lumean
@router.get("/lumean/templates")
def lumean_templates() -> list[dict[str, Any]]:
    try:
        with LumeanClient() as lm:
            items = lm.templates()
    except ApiError as exc:
        raise _api_error(exc) from exc
    out = []
    for t in items:
        tts = (t.get("config") or {}).get("tts_settings") or {}
        out.append({
            "id": t["id"], "name": t.get("name"), "voice_id": tts.get("voice_id"), "model_id": tts.get("model_id"),
            "language_code": tts.get("language_code"),
            "speed": (tts.get("voice_settings") or {}).get("speed"),
        })
    return out


class TemplateCreate(BaseModel):
    name: str
    voice_id: str
    model_id: str = "eleven_multilingual_v2"
    language_code: str | None = None
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    speed: float = 1.0


@router.post("/lumean/templates")
def lumean_create_template(body: TemplateCreate) -> dict[str, Any]:
    """Create a TTS template for a chosen voice (so it can be assigned to a channel language)."""
    tts: dict[str, Any] = {
        "mode": "mode_v1", "model_id": body.model_id, "voice_id": body.voice_id,
        "advanced_voice_settings": True, "prev_next_text": True,
        "voice_settings": {"stability": body.stability, "similarity_boost": body.similarity_boost,
                           "style": body.style, "use_speaker_boost": True, "speed": body.speed},
    }
    if body.model_id.startswith("eleven_v3"):
        tts["prev_next_text"] = False
        tts["voice_settings"]["stability"] = min((0.0, 0.5, 1.0), key=lambda v: abs(v - body.stability))
    if body.language_code:
        tts["language_code"] = body.language_code
    try:
        with LumeanClient() as lm:
            t = lm.create_template(body.name, {"tts_settings": tts})
    except ApiError as exc:
        raise _api_error(exc) from exc
    return {"id": t["id"], "name": t.get("name")}


@router.get("/lumean/voices")
def lumean_voices(source: str = "elevenlabs", search: str = "", language: str = "", gender: str = "",
                  page: int = 0) -> dict[str, Any]:
    """Voice catalogue: ``elevenlabs`` (public library) or ``lumean`` (LumVoice public)."""
    try:
        with LumeanClient() as lm:
            if source == "elevenlabs":
                data = lm.elevenlabs_voices(search=search, required_languages=language or None,
                                            gender=gender or None, page=page, page_size=30)
                voices = [{
                    "voice_id": v.get("voice_id"), "name": v.get("name"),
                    "description": v.get("description") or v.get("descriptive"),
                    "gender": v.get("gender"), "age": v.get("age"), "accent": v.get("accent"),
                    "language": v.get("language"), "use_case": v.get("use_case"),
                    "preview_url": v.get("preview_url"),
                } for v in data.get("voices", [])]
                return {"voices": voices, "has_more": data.get("has_more", False), "page": page}
            data = lm.lum_voices("public", search=search, language_code=language or None,
                                 gender=gender or None, per_page=30, page=page + 1)
            voices = [{
                "voice_id": v.get("id"), "name": v.get("display_name"), "description": v.get("description"),
                "gender": v.get("gender"), "accent": v.get("accent"), "language": v.get("default_language_code"),
                "preview_url": next((u for u in (v.get("preview_urls") or {}).values() if u), None),
            } for v in data.get("items", [])]
            return {"voices": voices, "has_more": data.get("current_page", 1) < data.get("last_page", 1), "page": page}
    except ApiError as exc:
        raise _api_error(exc) from exc


# ------------------------------------------------------------------- FastGen
@router.get("/fastgen/chat-models")
def fastgen_chat_models() -> list[dict[str, Any]]:
    try:
        with FastgenClient() as fg:
            models = fg.chat_models()
    except ApiError as exc:
        raise _api_error(exc) from exc
    return [{"id": m["id"], "name": m.get("name") or m["id"], "context": m.get("context_length")} for m in models]


@router.get("/fonts")
def fonts() -> list[str]:
    """Font family names available for subtitles: custom fonts folder + common system fonts."""
    custom = sorted({p.stem.split("-")[0] for p in get_settings().fonts_dir.glob("*.[ot]tf")})
    system = ["Arial", "Arial Black", "Segoe UI", "Segoe UI Black", "Verdana", "Tahoma", "Trebuchet MS",
              "Georgia", "Times New Roman", "Impact", "Calibri", "Bahnschrift", "Montserrat", "Roboto", "Inter"]
    return custom + [f for f in system if f not in custom]
