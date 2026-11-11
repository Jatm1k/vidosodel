"""Nonblocking Inflight quota snapshots for the global sidebar."""
from __future__ import annotations

import hashlib
import threading
import time
from datetime import datetime, timedelta, timezone

from ..db import session_scope
from ..settings_store import load_config
from .http import ApiError
from .inflight import InflightClient
from .inflight_queue import local_remaining


def quota_snapshot(cfg, local, usage=None):
    usage = usage or {}
    out = {}
    for kind, budget in (("video", cfg.inflight_video_daily), ("image", cfg.inflight_image_daily)):
        remote = usage.get(kind) or {}
        left = remote.get("left")
        remaining = min(local[kind], max(0, int(left))) if left is not None else None
        out[kind] = {"budget": budget, "remaining": remaining, "local_remaining": local[kind],
                     "used": budget - remaining if remaining is not None else None,
                     "active": int(remote.get("busy") or 0), "slots": min(int(remote.get("slots") or cfg.inflight_threads), cfg.inflight_threads)}
    counts = [out[k]["active"] for k in ("video", "image")]
    reset = (datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).timestamp()
    parallel = usage.get("plan") == "parallel"
    return {**out, "plan": usage.get("plan"), "active": sum(counts) if parallel else max(counts),
            "threads": sum(out[k]["slots"] for k in ("video", "image")) if parallel else cfg.inflight_threads,
            "reset_at": usage.get("resets_at") or reset,
            "expired": bool(usage.get("expired")), "warning": usage.get("warning") or ""}


class InflightStatus:
    def __init__(self, client_factory=None):
        self._factory = client_factory or InflightClient
        self._lock = threading.Lock()
        self._identity = ""
        self._usage = None
        self._updated = 0.
        self._attempt = 0.
        self._loading = False
        self._error = None
        self._thread = None

    def status(self, cfg=None, *, refresh=True):
        cfg = cfg or load_config()
        if not cfg.inflight_api_key.strip():
            return None
        identity = hashlib.sha256((cfg.inflight_base_url + cfg.inflight_api_key.strip()).encode()).hexdigest()
        account = hashlib.sha256(cfg.inflight_api_key.strip().encode()).hexdigest()
        with self._lock:
            if identity != self._identity:
                self._identity, self._usage = identity, None
                self._updated = self._attempt = 0.
                self._loading, self._error = False, None
            if refresh and not self._loading and time.time() - self._attempt >= 15:
                self._loading, self._attempt = True, time.time()
                self._thread = threading.Thread(target=self._fetch, args=(cfg, identity), daemon=True,
                                                name="inflight-status")
                self._thread.start()
            usage, updated, loading, error = self._usage, self._updated, self._loading, self._error
        with session_scope() as db:
            local = local_remaining(db, account, cfg)
        return {**quota_snapshot(cfg, local, usage), "updated_at": updated or None,
                "loading": loading, "stale": bool(error) or not updated or time.time() - updated > 45,
                "error": error}

    def _fetch(self, cfg, identity):
        try:
            with self._factory(cfg) as client:
                usage = client.usage()
            with self._lock:
                if self._identity == identity:
                    self._usage, self._updated, self._error = usage, time.time(), None
        except Exception as exc:
            message = exc.message if isinstance(exc, ApiError) else "Не удалось обновить квоту Inflight"
            with self._lock:
                if self._identity == identity:
                    self._error = message
        finally:
            with self._lock:
                if self._identity == identity:
                    self._loading = False


inflight_status = InflightStatus()
