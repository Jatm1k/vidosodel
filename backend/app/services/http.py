"""Shared HTTP helpers: a resilient request wrapper and file downloads."""
from __future__ import annotations

import logging
import random
import time
from pathlib import Path
from typing import Any

import httpx

log = logging.getLogger(__name__)

RETRY_STATUSES = {408, 425, 500, 502, 503, 504}


class ApiError(RuntimeError):
    """Error returned by an external API, with the parsed body when available."""

    def __init__(self, service: str, status: int, message: str, body: Any = None):
        super().__init__(f"{service}: HTTP {status}: {message}")
        self.service = service
        self.status = status
        self.message = message
        self.body = body if body is not None else {}

    @property
    def reason(self) -> str | None:
        """Machine-readable reason code (Lumean ``reason``/``error_code``)."""
        if isinstance(self.body, dict):
            return self.body.get("reason") or self.body.get("error_code")
        return None


def _retry_after(resp: httpx.Response, default: float) -> float:
    value = resp.headers.get("Retry-After")
    try:
        body = resp.json()
        if isinstance(body, dict) and body.get("retry_after"):
            return float(body["retry_after"])
    except Exception:  # noqa: BLE001 – body may not be JSON
        pass
    try:
        return float(value) if value else default
    except ValueError:
        return default


def request_json(
    client: httpx.Client,
    service: str,
    method: str,
    url: str,
    *,
    attempts: int = 5,
    retry_429: bool = True,
    **kwargs: Any,
) -> Any:
    """Send a request and return parsed JSON, retrying transient failures.

    Retries network errors and 5xx with exponential backoff; 429 is retried
    after ``Retry-After`` when ``retry_429`` is set. Other 4xx raise
    :class:`ApiError` immediately.
    """
    delay = 2.0
    for attempt in range(1, attempts + 1):
        try:
            resp = client.request(method, url, **kwargs)
        except (httpx.TransportError, httpx.TimeoutException) as exc:
            if attempt == attempts:
                raise ApiError(service, 0, f"сеть недоступна: {exc}") from exc
            log.warning("%s %s %s: %s, retry in %.0fs", service, method, url, exc, delay)
            time.sleep(delay + random.random())
            delay = min(delay * 2, 60)
            continue

        if resp.status_code < 400:
            if not resp.content:
                return {}
            try:
                return resp.json()
            except ValueError as exc:
                raise ApiError(service, resp.status_code, "ответ не JSON", resp.text[:500]) from exc

        try:
            body = resp.json()
        except ValueError:
            body = {"message": resp.text[:500]}
        message = _error_message(body)

        retryable = resp.status_code in RETRY_STATUSES or (resp.status_code == 429 and retry_429)
        # A depleted quota/pool will not recover by waiting.
        if isinstance(body, dict) and body.get("window") == "quota":
            retryable = False
        if retryable and attempt < attempts:
            wait = _retry_after(resp, delay) if resp.status_code == 429 else delay
            log.warning("%s %s %s → %s (%s), retry in %.0fs", service, method, url, resp.status_code, message, wait)
            time.sleep(min(wait, 300) + random.random())
            delay = min(delay * 2, 60)
            continue
        raise ApiError(service, resp.status_code, message, body)
    raise ApiError(service, 0, "исчерпаны попытки")  # pragma: no cover


def _error_message(body: Any) -> str:
    if not isinstance(body, dict):
        return str(body)[:300]
    msg = body.get("message") or body.get("detail") or body.get("error") or ""
    if isinstance(msg, list):  # FastAPI validation detail
        msg = "; ".join(str(m.get("msg", m)) if isinstance(m, dict) else str(m) for m in msg)
    errors = body.get("errors")
    if isinstance(errors, dict):
        details = "; ".join(f"{k}: {', '.join(map(str, v))}" for k, v in errors.items())
        msg = f"{msg} ({details})" if msg else details
    return str(msg)[:1000]


def download_file(url: str, dest: Path, *, headers: dict[str, str] | None = None, attempts: int = 4) -> Path:
    """Stream ``url`` into ``dest`` atomically (``.part`` file + rename)."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(dest.name + ".part")
    delay = 2.0
    for attempt in range(1, attempts + 1):
        try:
            with httpx.stream("GET", url, headers=headers, timeout=httpx.Timeout(60, read=300), follow_redirects=True) as r:
                r.raise_for_status()
                with open(tmp, "wb") as fh:
                    for chunk in r.iter_bytes(1 << 20):
                        fh.write(chunk)
            tmp.replace(dest)
            return dest
        except (httpx.HTTPError, OSError) as exc:
            if attempt == attempts:
                raise ApiError("download", 0, f"не удалось скачать файл: {exc}") from exc
            time.sleep(delay)
            delay *= 2
    return dest
