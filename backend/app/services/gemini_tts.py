"""Gemini text-to-speech via Google AI Studio keys (character lines of series).

* ``POST /v1beta/models/<model>:generateContent`` with ``responseModalities: ["AUDIO"]``
  and a prebuilt voice; the answer is raw PCM (16-bit mono, the rate is in the MIME
  type, usually 24 kHz), saved here as WAV.
* The delivery is steered in plain words before the text (see
  :func:`app.pipeline.episode.line_prompt`).
* Free keys allow a few requests per day per Google Cloud project; the limits reset
  at midnight Pacific time. Several keys are used in turn: every request is written
  to ``tts_usage``, so the counters survive restarts, and a key the server reports as
  exhausted is skipped until the next quota day. Keys of the *same* project share one
  quota – the server's answer is what counts, the local counter only plans ahead.
"""
from __future__ import annotations

import base64
import hashlib
import logging
import re
import threading
import time
import wave
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import func, select

from ..db import session_scope
from ..models import TtsUsage
from ..settings_store import load_config
from .http import ApiError

log = logging.getLogger(__name__)

BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

#: Prebuilt voices: name → (usual gender, character of the voice).
VOICES: dict[str, tuple[str, str]] = {
    "Zephyr": ("female", "bright"), "Puck": ("male", "upbeat"), "Charon": ("male", "informative"),
    "Kore": ("female", "firm"), "Fenrir": ("male", "excitable"), "Leda": ("female", "youthful"),
    "Orus": ("male", "firm"), "Aoede": ("female", "breezy"), "Callirrhoe": ("female", "easy-going"),
    "Autonoe": ("female", "bright"), "Enceladus": ("male", "breathy"), "Iapetus": ("male", "clear"),
    "Umbriel": ("male", "easy-going"), "Algieba": ("male", "smooth"), "Despina": ("female", "smooth"),
    "Erinome": ("female", "clear"), "Algenib": ("male", "gravelly"), "Rasalgethi": ("male", "informative"),
    "Laomedeia": ("female", "upbeat"), "Achernar": ("female", "soft"), "Alnilam": ("male", "firm"),
    "Schedar": ("male", "even"), "Gacrux": ("female", "mature"), "Pulcherrima": ("female", "forward"),
    "Achird": ("male", "friendly"), "Zubenelgenubi": ("male", "casual"), "Vindemiatrix": ("female", "gentle"),
    "Sadachbia": ("male", "lively"), "Sadaltager": ("male", "knowledgeable"), "Sulafat": ("female", "warm"),
}


class QuotaExhausted(ApiError):
    """Every key is over its daily limit."""


def key_id(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()[:12]


def _pacific_now(now: datetime | None = None) -> datetime:
    """Current time in US Pacific time (DST from the 2nd Sunday of March to the 1st Sunday of November).

    Computed by hand: Windows Python has no time zone database without the ``tzdata`` package.
    """
    utc = now or datetime.now(timezone.utc)
    year = utc.year

    def nth_sunday(month: int, n: int) -> datetime:
        d = datetime(year, month, 1, tzinfo=timezone.utc)
        d += timedelta(days=(6 - d.weekday()) % 7)
        return d + timedelta(weeks=n - 1)

    dst_start = nth_sunday(3, 2) + timedelta(hours=10)   # 02:00 PST = 10:00 UTC
    dst_end = nth_sunday(11, 1) + timedelta(hours=9)     # 02:00 PDT = 09:00 UTC
    offset = -7 if dst_start <= utc < dst_end else -8
    return utc + timedelta(hours=offset)


def quota_day(now: datetime | None = None) -> str:
    return _pacific_now(now).strftime("%Y-%m-%d")


def quota_reset_at(now: datetime | None = None) -> float:
    """Unix time of the next daily reset (midnight Pacific)."""
    utc = now or datetime.now(timezone.utc)
    local = _pacific_now(utc)
    midnight = (local + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return (utc + (midnight - local)).timestamp()


_lock = threading.Lock()
_models_cache: dict[str, Any] = {}


def usage_status() -> dict[str, Any]:
    """Per-key usage of the current quota day (keys are shown masked)."""
    cfg = load_config()
    day = quota_day()
    limit = max(1, cfg.gemini_tts_daily_limit)
    with session_scope() as db:
        rows = db.execute(
            select(TtsUsage.key_id, TtsUsage.status, func.count()).where(TtsUsage.day == day)
            .group_by(TtsUsage.key_id, TtsUsage.status)
        ).all()
    used: dict[str, int] = {}
    exhausted: set[str] = set()
    for kid, status, n in rows:
        if status == "exhausted":
            exhausted.add(kid)
        else:
            used[kid] = used.get(kid, 0) + n
    keys = []
    for k in cfg.gemini_api_keys:
        kid = key_id(k)
        n = used.get(kid, 0)
        left = 0 if kid in exhausted else max(0, limit - n)
        keys.append({"key": k[:4] + "…" + k[-4:], "id": kid, "used": n, "left": left, "exhausted": kid in exhausted})
    return {"day": day, "limit": limit, "keys": keys, "left": sum(k["left"] for k in keys),
            "resets_at": quota_reset_at(), "model": cfg.gemini_tts_model or _models_cache.get("auto")}


def _record(kid: str, status: str, chars: int = 0) -> None:
    with session_scope() as db:
        db.add(TtsUsage(ts=time.time(), key_id=kid, day=quota_day(), status=status, chars=chars))


def _pick_key(skip: set[str]) -> str | None:
    """The configured key with the most requests left today (``skip`` – failed in this call)."""
    status = usage_status()
    best, best_left = None, 0
    for k in load_config().gemini_api_keys:
        info = next(i for i in status["keys"] if i["id"] == key_id(k))
        if info["id"] in skip or info["left"] <= best_left:
            continue
        best, best_left = k, info["left"]
    return best


def _error_text(resp: httpx.Response) -> tuple[str, dict[str, Any]]:
    try:
        body = resp.json()
    except ValueError:
        return resp.text[:300], {}
    err = body.get("error") if isinstance(body, dict) else None
    if isinstance(err, dict):
        return str(err.get("message") or err.get("status") or resp.status_code), err
    return resp.text[:300], {}


def _retry_delay(err: dict[str, Any]) -> float | None:
    for d in err.get("details") or []:
        if isinstance(d, dict) and str(d.get("@type", "")).endswith("RetryInfo"):
            m = re.match(r"([\d.]+)s", str(d.get("retryDelay") or ""))
            if m:
                return float(m.group(1))
    return None


def _is_daily(message: str, err: dict[str, Any]) -> bool:
    text = message + " " + str(err.get("details") or "")
    return "PerDay" in text or "per day" in text.lower() or "daily" in text.lower()


class GeminiTts:
    def __init__(self) -> None:
        cfg = load_config()
        if not cfg.gemini_api_keys:
            raise ApiError("Gemini", 401, "не заданы ключи Google AI Studio (Настройки → Ключи API → Gemini TTS)")
        self._client = httpx.Client(base_url=BASE_URL, timeout=httpx.Timeout(30, read=180))

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> GeminiTts:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    # ------------------------------------------------------------------ models
    def tts_models(self, key: str | None = None) -> list[str]:
        """TTS-capable models the key can use, newest first (listing is free)."""
        key = key or load_config().gemini_api_keys[0]
        names: list[str] = []
        token = ""
        for _ in range(10):
            params: dict[str, Any] = {"pageSize": 200}
            if token:
                params["pageToken"] = token
            resp = self._client.get("/models", params=params, headers={"x-goog-api-key": key})
            if resp.status_code >= 400:
                msg, _ = _error_text(resp)
                raise ApiError("Gemini", resp.status_code, msg)
            data = resp.json()
            for m in data.get("models") or []:
                name = str(m.get("name", "")).removeprefix("models/")
                if "tts" in name.lower() and "generateContent" in (m.get("supportedGenerationMethods") or []):
                    names.append(name)
            token = data.get("nextPageToken") or ""
            if not token:
                break

        def rank(name: str) -> tuple:
            ver = tuple(int(x) for x in re.findall(r"\d+", name.split("-tts")[0])[:2]) or (0,)
            return (ver, "flash" in name, "preview" not in name, name)

        return sorted(names, key=rank, reverse=True)

    def model(self) -> str:
        cfg = load_config()
        if cfg.gemini_tts_model.strip():
            return cfg.gemini_tts_model.strip()
        with _lock:
            cached = _models_cache.get("auto")
            if cached and time.time() - _models_cache.get("at", 0) < 6 * 3600:
                return cached
        models = self.tts_models()
        if not models:
            raise ApiError("Gemini", 404, "ключу недоступна ни одна TTS-модель Gemini")
        with _lock:
            _models_cache.update(auto=models[0], at=time.time())
        return models[0]

    # -------------------------------------------------------------- synthesis
    def synthesize(self, prompt: str, voice: str, dest: Path, *, should_stop=None) -> dict[str, Any]:
        """Voice ``prompt`` with a prebuilt ``voice`` into a WAV file. Returns request meta.

        Tries the keys in turn; raises :class:`QuotaExhausted` when none has requests left.
        """
        model = self.model()
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
            },
        }
        failed: set[str] = set()
        server_errors = 0
        while True:
            if should_stop and should_stop():
                raise InterruptedError()
            with _lock:
                key = _pick_key(failed)
                if key is None:
                    break
                kid = key_id(key)
                _record(kid, "ok", len(prompt))
            try:
                resp = self._client.post(f"/models/{model}:generateContent", json=body,
                                         headers={"x-goog-api-key": key})
            except (httpx.TransportError, httpx.TimeoutException) as exc:
                server_errors += 1
                if server_errors >= 3:
                    raise ApiError("Gemini", 0, f"сеть недоступна: {exc}") from exc
                time.sleep(5)
                continue
            if resp.status_code == 429:
                msg, err = _error_text(resp)
                delay = _retry_delay(err)
                if not _is_daily(msg, err) and delay is not None and delay <= 90:
                    log.info("Gemini per-minute limit, waiting %.0fs", delay)
                    time.sleep(delay + 1)
                    continue
                log.info("Gemini key %s exhausted: %s", kid, msg[:200])
                _record(kid, "exhausted")
                failed.add(kid)
                continue
            if resp.status_code in (401, 403):
                msg, _ = _error_text(resp)
                log.warning("Gemini key %s rejected: %s", kid, msg[:200])
                failed.add(kid)
                continue
            if resp.status_code >= 500:
                server_errors += 1
                if server_errors >= 3:
                    msg, _ = _error_text(resp)
                    raise ApiError("Gemini", resp.status_code, msg)
                time.sleep(5 * server_errors)
                continue
            if resp.status_code >= 400:
                msg, err = _error_text(resp)
                raise ApiError("Gemini", resp.status_code, msg, err)
            return self._save(resp.json(), dest, model, voice, kid)
        status = usage_status()
        reset = datetime.fromtimestamp(status["resets_at"]).strftime("%H:%M")
        raise QuotaExhausted("Gemini", 429, f"у всех ключей Gemini закончились запросы на сегодня "
                                            f"(сброс в {reset} по местному времени)")

    @staticmethod
    def _save(data: dict[str, Any], dest: Path, model: str, voice: str, kid: str) -> dict[str, Any]:
        cand = (data.get("candidates") or [{}])[0]
        part = next((p for p in (cand.get("content") or {}).get("parts") or [] if p.get("inlineData")), None)
        if part is None:
            reason = cand.get("finishReason") or (data.get("promptFeedback") or {}).get("blockReason") or "нет аудио"
            raise ApiError("Gemini", 422, f"модель не вернула звук ({reason})", data)
        inline = part["inlineData"]
        pcm = base64.b64decode(inline["data"])
        m = re.search(r"rate=(\d+)", inline.get("mimeType", ""))
        rate = int(m.group(1)) if m else 24000
        dest.parent.mkdir(parents=True, exist_ok=True)
        with wave.open(str(dest), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(pcm)
        usage = data.get("usageMetadata") or {}
        return {"provider": "gemini", "model": model, "voice": voice, "key": kid,
                "duration": len(pcm) / 2 / rate, "tokens": usage.get("totalTokenCount")}
