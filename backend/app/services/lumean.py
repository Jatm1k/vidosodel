"""Lumean public API client (TTS voice-over).

Key facts (see docs/lumean-api.md):

* The voice is defined by a *template* (``config.tts_settings.voice_id``);
  per-order tweaks go to ``config_override``.
* TTS text is sent in top-level ``input_text``.
* A finished order exposes ``result.files[0]`` (the stitched mp3) and
  ``result.service_files`` (``subtitles.srt``, ``result.json`` with word timings…).
* Files are fetched through ``POST /storage/url`` which returns a temporary URL.
* Billing is pay-as-you-go; ``POST /orders/chunks/preview`` gives a free cost estimate.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any

import httpx

from ..config import get_settings
from ..settings_store import load_config
from .http import ApiError, download_file, request_json

log = logging.getLogger(__name__)

TERMINAL_OK = {"completed", "result_delivered"}
TERMINAL_FAIL = {"failed", "compensated", "cancelled"}


class LumeanClient:
    def __init__(self, api_key: str | None = None):
        key = api_key if api_key is not None else load_config().lumean_api_key
        if not key:
            raise ApiError("Lumean", 401, "не задан API-ключ Lumean (Настройки → Ключи API)")
        self._client = httpx.Client(
            base_url=get_settings().lumean_base_url,
            headers={"X-API-KEY": key, "Accept": "application/json", "Accept-Language": "ru"},
            timeout=httpx.Timeout(30, read=120),
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> LumeanClient:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def _req(self, method: str, path: str, **kw: Any) -> Any:
        body = request_json(self._client, "Lumean", method, path, **kw)
        if isinstance(body, dict) and "data" in body:
            return body["data"]
        return body

    # ------------------------------------------------------------------ account
    def user(self) -> dict[str, Any]:
        return self._req("GET", "/user", params={"include": "wallets"})

    def balance(self) -> dict[str, Any] | None:
        """Main wallet balance converted to the display currency (e.g. RUB)."""
        wallets = self.user().get("wallets") or []
        main = next((w for w in wallets if w.get("purpose") == "main"), wallets[0] if wallets else None)
        if not main:
            return None
        conv = main.get("balance_converted") or {}
        precision = (main.get("asset") or {}).get("precision", 8)
        return {
            "lmc": main.get("balance", 0) / 10**precision,
            "amount": conv.get("amount"),
            "currency": conv.get("currency"),
            "symbol": conv.get("symbol"),
        }

    # ---------------------------------------------------------------- templates
    def templates(self) -> list[dict[str, Any]]:
        """All TTS templates of the account (walks folders via ``browse``)."""
        items: list[dict[str, Any]] = []
        page = 1
        while True:
            data = self._req("GET", "/templates/browse", params={"page": page, "per_page": 100, "service": "elevenlabs"})
            for it in data.get("items", []):
                if it.get("type") == "template":
                    items.append(it)
                elif it.get("type") == "folder":
                    items.extend(self._folder_templates(it["id"]))
            if page >= data.get("last_page", 1):
                break
            page += 1
        # Fall back to root templates if browse returned nothing (older API).
        if not items:
            items = [t for t in self._req("GET", "/templates") if t.get("service_key") == "elevenlabs"]
        return items

    def _folder_templates(self, folder_id: Any) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        page = 1
        while True:
            data = self._req(
                "GET", "/templates/browse",
                params={"page": page, "per_page": 100, "folder_id": folder_id, "service": "elevenlabs"},
            )
            out.extend(it for it in data.get("items", []) if it.get("type") == "template")
            if page >= data.get("last_page", 1):
                return out
            page += 1

    def template(self, template_id: str) -> dict[str, Any]:
        return self._req("GET", f"/templates/{template_id}")

    def create_template(self, name: str, config: dict[str, Any]) -> dict[str, Any]:
        return self._req("POST", "/templates", json={"service_key": "elevenlabs", "name": name, "config": config})

    def update_template(self, template_id: str, patch: dict[str, Any]) -> dict[str, Any]:
        return self._req("PATCH", f"/templates/{template_id}", json=patch)

    def config_options(self, service: str = "elevenlabs") -> dict[str, Any]:
        return self._req("GET", "/templates/config-options", params={"service": service})

    # ------------------------------------------------------------------- voices
    def elevenlabs_voices(self, **params: Any) -> dict[str, Any]:
        params = {k: v for k, v in params.items() if v not in (None, "")}
        return self._req("GET", "/voices/elevenlabs/library", params=params)

    def lum_voices(self, scope: str = "public", **params: Any) -> dict[str, Any]:
        params = {k: v for k, v in params.items() if v not in (None, "")}
        path = {"public": "/voices/public", "library": "/voices/library", "mine": "/voices"}[scope]
        return self._req("GET", path, params=params)

    # ------------------------------------------------------------------- orders
    def estimate(self, template_id: str, text: str, config_override: dict | None = None) -> dict[str, Any]:
        """Free dry-run: chunk count, blocked chunks and cost (``summary``)."""
        body: dict[str, Any] = {"template_id": template_id, "input_text": text}
        if (config_override or {}).get("generation_mode") == "paragraph":
            body["generation_mode"] = "paragraph"
        data = self._req("POST", "/orders/chunks/preview", json=body)
        # Long texts are calculated asynchronously (202 + processing) – poll.
        deadline = time.time() + 180
        while data.get("status") == "processing" and time.time() < deadline:
            time.sleep(3)
            data = self._req("GET", f"/orders/chunks/preview/{data['preview_id']}", params={"per_page": 1})
        return data

    def create_tts_order(
        self, template_id: str, text: str, name: str, config_override: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Create a TTS order.

        Network errors are *not* blindly retried (that could create and pay for
        a duplicate order). Instead we look the order up by its unique ``name``.
        """
        body: dict[str, Any] = {"template_id": template_id, "input_text": text, "name": name}
        if config_override:
            body["config_override"] = config_override
        for attempt in range(6):
            try:
                return self._req("POST", "/orders", json=body, attempts=1, retry_429=False)
            except ApiError as exc:
                if exc.status == 0:
                    found = self.find_order_by_name(name)
                    if found:
                        return found
                    if attempt < 5:
                        time.sleep(5)
                        continue
                if exc.status == 429 and exc.reason in {"rate_limit_exceeded", "concurrency_limit_exceeded",
                                                       "policy_cooldown_active", "token_quota_exceeded"} \
                        and (exc.body or {}).get("window") != "quota" and attempt < 5:
                    wait = float((exc.body or {}).get("retry_after") or 30)
                    log.info("Lumean 429 %s, waiting %.0fs", exc.reason, wait)
                    time.sleep(min(wait, 300))
                    continue
                raise
        raise ApiError("Lumean", 0, "не удалось создать заказ")

    def find_order_by_name(self, name: str) -> dict[str, Any] | None:
        data = self._req("GET", "/orders", params={"per_page": 20, "task_type": "tts"})
        return next((o for o in data.get("items", []) if o.get("name") == name), None)

    def order(self, order_id: str) -> dict[str, Any]:
        return self._req("GET", f"/orders/{order_id}")

    def order_items(self, order_id: str) -> list[dict[str, Any]]:
        return self._req("GET", f"/orders/{order_id}/items")

    def retry_failed_items(self, order_id: str) -> dict[str, Any]:
        return self._req("POST", f"/orders/{order_id}/items/retry-failed")

    def retry_item(self, order_id: str, item_id: str, text: str | None = None) -> dict[str, Any]:
        return self._req("POST", f"/orders/{order_id}/items/{item_id}/retry", json={"text": text} if text else {})

    def item_text(self, order_id: str, item_id: str) -> dict[str, Any]:
        return self._req("GET", f"/orders/{order_id}/items/{item_id}/text")

    def cancel_order(self, order_id: str) -> dict[str, Any]:
        return self._req("POST", f"/orders/{order_id}/cancel")

    # ------------------------------------------------------------------ storage
    def file_url(self, path: str) -> str:
        return self._req("POST", "/storage/url", json={"path": path})["url"]

    def download(self, path: str, dest: Path) -> Path:
        return download_file(self.file_url(path), dest)


def pick_service_file(order: dict[str, Any], basename: str) -> str | None:
    """Find a service file (``subtitles.srt``, ``result.json``…) of a finished order."""
    for path in (order.get("result") or {}).get("service_files") or []:
        if path.rsplit("/", 1)[-1] == basename:
            return path
    return None
