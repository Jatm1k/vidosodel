"""Backup LLM: any OpenAI-compatible chat API (OpenRouter, OpenAI, DeepSeek, Ollama...).

:meth:`FastgenClient.chat` hands a request over to it when FastGen cannot
answer: the hourly token budget is used up, the request failed, or a canned
stub came back instead of an answer. The backup's own limits are not tracked:
its 429s are retried after ``Retry-After`` like any other request.
"""
from __future__ import annotations

import logging
import re
import threading
import time
from typing import Any

import httpx

from ..settings_store import AppConfig, load_config
from .http import ApiError, request_json

log = logging.getLogger(__name__)

SERVICE = "Резервный LLM"

#: Canned answers FastGen sends with HTTP 200 instead of a real one (also its content-filter answer).
_FASTGEN_STUB = re.compile(r"something went wrong|hard time fulfilling", re.I)


def is_fastgen_stub(text: str) -> bool:
    """An empty answer or a short canned FastGen stub without JSON."""
    t = text.strip()
    return not t or ("{" not in t and len(t) <= 400 and bool(_FASTGEN_STUB.search(t)))


def chat_url(base_url: str) -> str:
    """``…/v1`` or a full ``…/chat/completions`` URL → the chat completions endpoint."""
    base = base_url.strip().rstrip("/")
    return base if base.endswith("/chat/completions") else f"{base}/chat/completions"


class BackupLlm:
    def __init__(self, cfg: AppConfig):
        self.model = cfg.llm_fallback_model.strip()
        self._url = chat_url(cfg.llm_fallback_url)
        headers = {"Accept": "application/json"}
        if cfg.llm_fallback_api_key:
            headers["Authorization"] = f"Bearer {cfg.llm_fallback_api_key}"
        self._client = httpx.Client(headers=headers, timeout=httpx.Timeout(30, read=300))

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> BackupLlm:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def chat(self, messages: list[dict[str, str]], *, temperature: float = 0.7,
             max_tokens: int | None = None) -> str:
        body: dict[str, Any] = {"model": self.model, "messages": messages, "temperature": temperature}
        if max_tokens:
            body["max_tokens"] = max_tokens
        data = request_json(self._client, SERVICE, "POST", self._url, json=body, attempts=4)
        try:
            return data["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError, TypeError) as exc:
            raise ApiError(SERVICE, 200, "пустой ответ", data) from exc


def _configured(cfg: AppConfig) -> bool:
    return bool(cfg.llm_fallback_enabled and cfg.llm_fallback_url.strip() and cfg.llm_fallback_model.strip())


def backup_llm() -> BackupLlm | None:
    """The configured backup, or None when it is off or not filled in."""
    cfg = load_config()
    return BackupLlm(cfg) if _configured(cfg) else None


class _Usage:
    """When and why the backup answered last (shown in the sidebar)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.calls = 0
        self.last_at = 0.0
        self.last_reason = ""

    def note(self, reason: str) -> None:
        with self._lock:
            self.calls += 1
            self.last_at = time.time()
            self.last_reason = reason

    def status(self) -> dict[str, Any] | None:
        cfg = load_config()
        if not _configured(cfg):
            return None
        with self._lock:
            return {"model": cfg.llm_fallback_model.strip(), "calls": self.calls,
                    "last_at": self.last_at or None, "last_reason": self.last_reason or None}


backup_usage = _Usage()
