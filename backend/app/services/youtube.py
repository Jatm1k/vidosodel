"""YouTube Data API v3 client – read-only research of a niche for packaging.

Quota (free key): 10 000 units a day; ``search.list`` costs 100 units, ``videos.list`` and
``channels.list`` 1 unit per call (up to 50 ids each). One niche study is 2 searches ≈ 200 units.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from ..settings_store import load_config
from .http import ApiError, request_json

log = logging.getLogger(__name__)

BASE_URL = "https://www.googleapis.com/youtube/v3"


class YoutubeClient:
    def __init__(self, api_key: str | None = None):
        key = api_key if api_key is not None else load_config().youtube_api_key
        if not key:
            raise ApiError("YouTube", 401, "не задан ключ YouTube Data API (Настройки → Ключи API)")
        self._key = key
        self._client = httpx.Client(base_url=BASE_URL, headers={"Accept": "application/json"},
                                    timeout=httpx.Timeout(20, read=40))

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> YoutubeClient:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def _get(self, path: str, **params: Any) -> dict[str, Any]:
        return request_json(self._client, "YouTube", "GET", path, attempts=3,
                            params={**params, "key": self._key}) or {}

    def search(self, query: str, *, language: str = "", published_after: str = "", limit: int = 25) -> list[str]:
        """Ids of videos found for ``query`` (100 units)."""
        params: dict[str, Any] = {"part": "id", "q": query, "type": "video", "maxResults": min(50, limit),
                                  "order": "relevance", "safeSearch": "none"}
        if language:
            params["relevanceLanguage"] = language
        if published_after:
            params["publishedAfter"] = published_after
        items = self._get("/search", **params).get("items") or []
        return [it["id"]["videoId"] for it in items if (it.get("id") or {}).get("videoId")]

    def videos(self, ids: list[str]) -> list[dict[str, Any]]:
        """Snippet, statistics and duration of up to 50 videos (1 unit)."""
        if not ids:
            return []
        return self._get("/videos", part="snippet,statistics,contentDetails", id=",".join(ids[:50]),
                         maxResults=50).get("items") or []

    def channels(self, ids: list[str]) -> list[dict[str, Any]]:
        """Statistics of up to 50 channels (1 unit)."""
        if not ids:
            return []
        return self._get("/channels", part="statistics", id=",".join(ids[:50]), maxResults=50).get("items") or []
