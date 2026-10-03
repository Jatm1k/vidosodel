"""FastGen API client: images, LLM chat completions, speech-to-text.

* ``POST /api/v6/generations`` starts an async operation, ``GET
  /api/v6/generations/{id}`` is polled until ``succeeded``/``failed``.
* ``POST /v1/chat/completions`` is OpenAI-compatible (Gemini/GPT models).
* Image results arrive as short-lived ``download_url`` links.
"""
from __future__ import annotations

import base64
import json
import logging
import re
import time
from pathlib import Path
from typing import Any

import httpx

from ..config import get_settings
from ..settings_store import load_config
from .http import ApiError, download_file, request_json

log = logging.getLogger(__name__)


#: Curated image operations shown in the UI. ``watermark`` marks models known to
#: stamp a logo on part of their images (every output is checked anyway, see
#: ``render.media.remove_watermark``).
IMAGE_OPERATIONS: list[dict[str, Any]] = [
    {"id": "nano_banana_2_image_generate", "name": "Nano Banana 2 (Flow)", "short": "NB2", "credits": 4, "upscale": True,
     "refs": True, "note": "Лучший баланс качества и скорости, без водяного знака"},
    {"id": "nano_banana_pro_image_generate", "name": "Nano Banana Pro (Flow)", "short": "Pro", "credits": 4, "upscale": True,
     "refs": True, "note": "Максимальная детализация и точность промпта, умеет текст"},
    {"id": "nano_banana_2_lite_image_generate", "name": "Nano Banana 2 Lite (Flow)", "short": "Lite", "credits": 4, "upscale": True,
     "refs": True, "note": "Облегчённая версия, быстрее"},
    {"id": "openai_image_generate", "name": "OpenAI Image", "short": "OpenAI", "credits": 4, "upscale": False,
     "refs": True, "note": "Хорош для иллюстраций и стилизации"},
    {"id": "gemini_nano_banana_2_image_generate", "name": "Nano Banana 2 (Gemini)", "short": "NB2·G", "credits": 1, "upscale": False,
     "refs": True, "watermark": "gemini_sparkle", "note": "1 кредит, водяной знак удаляется автоматически"},
    {"id": "flower_image_generate", "name": "Flower", "short": "Flower", "credits": 1, "upscale": False,
     "refs": False, "watermark": "gemini_sparkle",
     "note": "1 кредит, самый дешёвый. Иногда ставит водяной знак — удаляется автоматически"},
]

IMAGE_OPS_BY_ID = {op["id"]: op for op in IMAGE_OPERATIONS}

#: How many times a request refused for a limit is retried (each after the limiter's back-off).
_LIMIT_RETRIES = 90

#: Error codes/phrases that mean "the prompt was rejected by a content filter".
_POLICY_PATTERNS = re.compile(r"policy|safety|blocked|moderat|prohibit|content|nsfw|filter|unsafe", re.I)


def image_credits(operation: str, upscale: bool = False) -> int:
    op = IMAGE_OPS_BY_ID.get(operation)
    base = op["credits"] if op else 4
    return base * 2 if upscale and op and op.get("upscale") else base


class GenerationFailed(ApiError):
    """A generation finished with ``status=failed``."""

    @property
    def is_policy(self) -> bool:
        return bool(_POLICY_PATTERNS.search(f"{self.message} {self.reason or ''}"))


class FastgenClient:
    def __init__(self, api_key: str | None = None):
        key = api_key if api_key is not None else load_config().fastgen_api_key
        if not key:
            raise ApiError("FastGen", 401, "не задан API-ключ FastGen (Настройки → Ключи API)")
        self._key = key
        self._client = httpx.Client(
            base_url=get_settings().fastgen_base_url,
            headers={"X-API-Key": key, "Accept": "application/json"},
            timeout=httpx.Timeout(30, read=300),
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> FastgenClient:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def _req(self, method: str, path: str, **kw: Any) -> Any:
        return request_json(self._client, "FastGen", method, path, **kw)

    # ------------------------------------------------------------------ account
    def usage(self) -> dict[str, Any]:
        return self._req("GET", "/api/v6/usage")

    def chat_models(self) -> list[dict[str, Any]]:
        return self._req("GET", "/v1/models").get("data", [])

    # ------------------------------------------------------------- generations
    def start(self, payload: dict[str, Any]) -> dict[str, Any]:
        # 429 is not retried here: the caller holds a budget slot and waits via the limiter instead.
        return self._req("POST", "/api/v6/generations", json=payload, retry_429=False)

    def status(self, generation_id: str) -> dict[str, Any]:
        return self._req("GET", f"/api/v6/generations/{generation_id}")

    def cancel(self, generation_id: str) -> None:
        try:
            self._req("DELETE", f"/api/v6/generations/{generation_id}", attempts=1)
        except ApiError:
            pass

    def wait(self, generation_id: str, *, timeout: float = 600, interval: float = 3.0,
             should_stop: Any = None) -> dict[str, Any]:
        """Poll a generation until it finishes. Raises :class:`GenerationFailed`."""
        deadline = time.time() + timeout
        while True:
            data = self.status(generation_id)
            if data["status"] == "succeeded":
                return data
            if data["status"] == "failed":
                raise GenerationFailed(
                    "FastGen", 200, data.get("error") or "генерация не удалась",
                    {"reason": data.get("error_code"), "usage": data.get("usage")},
                )
            if should_stop and should_stop():
                self.cancel(generation_id)
                raise ApiError("FastGen", 0, "отменено")
            if time.time() > deadline:
                self.cancel(generation_id)
                raise ApiError("FastGen", 0, "превышено время ожидания генерации")
            time.sleep(interval)

    def generate_image(
        self, prompt: str, dest: Path, *, operation: str, aspect_ratio: str = "16:9",
        references: list[str] | None = None, upscale: bool = False, seed: int | None = None,
        should_stop: Any = None, on_started: Any = None,
    ) -> dict[str, Any]:
        """Generate one image and save it to ``dest``. Returns generation metadata."""
        payload: dict[str, Any] = {"operation": operation, "prompt": prompt, "aspect_ratio": aspect_ratio}
        if references:
            payload["inputs"] = references
        if upscale and IMAGE_OPS_BY_ID.get(operation, {}).get("upscale"):
            payload["generation_config"] = {"upscale": {"type": "2x"}}
        if seed is not None and operation.startswith("nano_banana"):
            payload["seed"] = seed
        accepted = self.start(payload)
        if on_started:
            on_started(accepted)
        result = self.wait(accepted["id"], should_stop=should_stop)
        item = next((r for r in result.get("results", []) if r.get("type") == "image"), None)
        if not item:
            raise GenerationFailed("FastGen", 200, "в ответе нет изображения", {})
        if item.get("download_url"):
            download_file(item["download_url"], dest)
        elif item.get("data"):
            dest.write_bytes(base64.b64decode(item["data"].split(",", 1)[-1]))
        else:
            raise GenerationFailed("FastGen", 200, "в ответе нет данных изображения", {})
        return {"generation_id": accepted["id"], "operation": operation,
                "credits": (result.get("usage") or {}).get("credits")}

    def transcribe(self, audio_data_uri: str, *, language: str | None = None,
                   should_stop: Any = None) -> dict[str, Any]:
        """Speech-to-text with word timestamps (Gemini via AI Studio)."""
        payload: dict[str, Any] = {
            "operation": "aistudio_gemini_3.5_transcribe",
            "inputs": [audio_data_uri],
            "word_timestamps": True,
            "diarization": False,
        }
        if language:
            payload["language_codes"] = [language]
        accepted = self.start(payload)
        result = self.wait(accepted["id"], timeout=1800, interval=5, should_stop=should_stop)
        return result

    # -------------------------------------------------------------------- chat
    def chat(self, messages: list[dict[str, str]], *, model: str, temperature: float = 0.7,
             max_tokens: int | None = None) -> str:
        """One chat completion within the hourly token budget (waits when it is used up)."""
        from .limiter import estimate_tokens, is_limit_error, token_limiter  # noqa: PLC0415 – import cycle

        body: dict[str, Any] = {"model": model, "messages": messages, "temperature": temperature}
        if max_tokens:
            body["max_tokens"] = max_tokens
        estimate = estimate_tokens(messages, max_tokens)
        for _ in range(_LIMIT_RETRIES):
            with token_limiter.slot(estimate) as commit:
                try:
                    data = self._req("POST", "/v1/chat/completions", json=body, attempts=4, retry_429=False)
                except ApiError as exc:
                    if not is_limit_error(exc):
                        raise
                    data = None
                if data is not None:
                    commit(int((data.get("usage") or {}).get("total_tokens") or estimate))
                    break
            token_limiter.block()  # over the limit on the server (e.g. another app): wait, then retry
        else:
            raise ApiError("FastGen", 429, "лимит токенов LLM так и не освободился")
        try:
            return data["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError) as exc:
            raise ApiError("FastGen", 200, "пустой ответ LLM", data) from exc

    def chat_json(self, messages: list[dict[str, str]], *, model: str, temperature: float = 0.5,
                  attempts: int = 3) -> Any:
        """Ask for JSON and parse it, re-asking on malformed output."""
        last_err: Exception | None = None
        msgs = list(messages)
        for attempt in range(1, attempts + 1):
            try:
                text = self.chat(msgs, model=model, temperature=temperature)
            except ApiError as exc:  # transient backend failure – treat like a bad answer
                last_err, text = exc, ""
            try:
                return extract_json(text)
            except ValueError as exc:
                last_err = exc
                log.warning("LLM %s: not JSON (attempt %d, %d chars): %r", model, attempt, len(text), text[:400])
                if text.strip():
                    # Show the model its own answer and ask for a fix (keeps the work it did).
                    msgs = messages + [
                        {"role": "assistant", "content": text[:6000]},
                        {"role": "user", "content": "Ответ не является корректным JSON или обрезан. Верни ТОЛЬКО полный валидный JSON без пояснений."},
                    ]
                else:
                    msgs = list(messages)  # empty answer: just ask again
                time.sleep(2 * attempt)
        raise ApiError("FastGen", 200, f"LLM несколько раз вернул ответ не в формате JSON ({last_err}). "
                                       "Повторите шаг или выберите другую модель в настройках канала.")


def extract_json(text: str) -> Any:
    """Parse JSON from an LLM answer that may be wrapped in ```json fences or prose."""
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Fall back to the outermost JSON value: decoding starts at the first '{' or '[' only,
    # so a truncated answer is rejected instead of yielding one of its nested objects.
    decoder = json.JSONDecoder()
    for start in sorted(i for i in (text.find("{"), text.find("[")) if i != -1):
        try:
            return decoder.raw_decode(text, start)[0]
        except json.JSONDecodeError:
            continue
    raise ValueError("JSON не найден в ответе" if text else "пустой ответ")


def file_to_data_uri(path: Path, mime: str | None = None) -> str:
    mime = mime or {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
        ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".ogg": "audio/ogg",
    }.get(path.suffix.lower(), "application/octet-stream")
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"
