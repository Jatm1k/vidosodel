"""What clicks in a niche right now: videos on the topic that got many times their channel's usual views.

A video far above its channel's average was carried by its packaging (the channel's audience is the same,
the click-through made the difference), so such «outliers» show the packaging editor what this audience
clicks – and what the feed around the new video looks like. Shorts and tiny videos are left out.
"""
from __future__ import annotations

import base64
import logging
import math
import re
import time
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any

import httpx

from ..services.http import ApiError
from ..services.youtube import YoutubeClient
from ..settings_store import load_config

log = logging.getLogger(__name__)

#: Shorter videos are Shorts or clips – another feed, another packaging.
MIN_SECONDS = 180
MIN_VIEWS = 10_000
#: Views at least this many times the channel's average per video.
MIN_RATIO = 1.5


def available() -> bool:
    return bool(load_config().youtube_api_key)


def _seconds(iso: str) -> int:
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return ((d * 24 + h) * 60 + mi) * 60 + s


def niche_outliers(queries: list[str], language: str, limit: int = 8, years: int = 3) -> list[dict[str, Any]]:
    """The strongest outliers for the search ``queries``, best first (empty without a key or on errors).

    Each is ``{"id", "title", "channel", "views", "ratio", "age_days", "thumb"}``; ``ratio`` – views against the
    channel's average views per video.
    """
    queries = [q.strip() for q in queries if q and q.strip()][:2]
    if not queries or not available():
        return []
    after = (datetime.now(timezone.utc) - timedelta(days=365 * years)).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        with YoutubeClient() as yt:
            ids: list[str] = []
            for q in queries:
                ids += [i for i in yt.search(q, language=language, published_after=after) if i not in ids]
            videos = yt.videos(ids[:50])
            channel_ids = list({v["snippet"]["channelId"] for v in videos if v.get("snippet")})
            channels = {c["id"]: c.get("statistics") or {} for c in yt.channels(channel_ids)}
    except ApiError as exc:
        log.warning("niche research failed: %s", exc)
        return []
    now = time.time()
    out: list[dict[str, Any]] = []
    for v in videos:
        sn, st = v.get("snippet") or {}, v.get("statistics") or {}
        views = int(st.get("viewCount") or 0)
        if views < MIN_VIEWS or _seconds((v.get("contentDetails") or {}).get("duration", "")) < MIN_SECONDS:
            continue
        ch = channels.get(sn.get("channelId"), {})
        count = int(ch.get("videoCount") or 0)
        average = int(ch.get("viewCount") or 0) / count if count else 0
        ratio = views / average if average else 0
        if ratio < MIN_RATIO:
            continue
        try:
            published = datetime.fromisoformat(sn["publishedAt"].replace("Z", "+00:00")).timestamp()
        except (KeyError, ValueError):
            published = now
        thumbs = sn.get("thumbnails") or {}
        thumb = (thumbs.get("medium") or thumbs.get("high") or thumbs.get("default") or {}).get("url", "")
        out.append({"id": v["id"], "title": sn.get("title", ""), "channel": sn.get("channelTitle", ""),
                    "views": views, "ratio": round(ratio, 1), "age_days": int((now - published) // 86400),
                    "thumb": thumb})
    # A tenfold outlier of a small channel and a big hit of a big one both teach; the log keeps both in play.
    out.sort(key=lambda x: -min(x["ratio"], 30) * math.log10(x["views"]))
    return out[:limit]


@lru_cache(maxsize=256)
def thumb_uri(url: str) -> str | None:
    """A YouTube thumbnail as a data URI (vision models get it inline)."""
    if not url.startswith("https://i.ytimg.com/"):
        return None
    try:
        r = httpx.get(url, timeout=15, follow_redirects=True)
        r.raise_for_status()
    except httpx.HTTPError as exc:
        log.warning("thumbnail %s: %s", url, exc)
        return None
    return "data:image/jpeg;base64," + base64.b64encode(r.content).decode()
