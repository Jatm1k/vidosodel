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
from .inflight_queue import UNLIMITED, local_remaining


def turbo_notice(*sources):
    """The newest active turbo notice (``/account/usage`` wins over ``/account``), or None."""
    for source in sources:
        turbo = (source or {}).get("turbo")
        if isinstance(turbo, dict):
            ends = turbo.get("ends_at")
            if turbo.get("active") and (not ends or float(ends) > time.time()):
                return {"message": turbo.get("message") or "", "extra_slots": int(turbo.get("extra_slots") or 0),
                        "ends_at": ends, "ends_at_msk": turbo.get("ends_at_msk")}
            return None
    return None


def quota_snapshot(cfg, local, usage=None, account=None):
    usage, account = usage or {}, account or {}
    out = {}
    for kind in ("video", "image"):
        remote = usage.get(kind) or {}
        bought = (account.get(kind) or {}).get("bought")
        left = remote.get("left")
        own = local[kind] if local[kind] < UNLIMITED else None
        remaining = (min(int(left), own) if own is not None else int(left)) if left is not None else None
        budget = bought or (getattr(cfg, f"inflight_{kind}_daily") or None) or (
            int(left) + int(remote.get("busy") or 0) if left is not None else None)
        out[kind] = {"budget": budget, "remaining": remaining, "local_remaining": own,
                     "used": max(0, budget - remaining) if remaining is not None and budget else None,
                     "active": int(remote.get("busy") or 0), "slots": int(remote.get("slots") or 0),
                     "free": int(remote.get("free") or 0)}
    counts = [out[k]["active"] for k in ("video", "image")]
    pool = usage.get("pool") or {}
    reset = (datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).timestamp()
    parallel = usage.get("plan") == "parallel"
    quota = usage.get("quota") or account.get("quota") or "day"
    return {**out, "plan": usage.get("plan"), "quota": quota,
            "active": sum(counts) if parallel else int(pool.get("busy", max(counts))),
            "threads": sum(out[k]["slots"] for k in ("video", "image")) if parallel else
                       int(pool.get("slots") or max(out[k]["slots"] for k in ("video", "image"))),
            "reset_at": usage.get("resets_at") or (reset if quota == "day" else None),
            "expires": usage.get("expires") or account.get("expires"),
            "expired": bool(usage.get("expired")), "warning": usage.get("warning") or "",
            "warning_code": usage.get("warning_code") or "",
            "refusals_paid": bool(usage.get("refusals_paid")),
            "turbo": turbo_notice(usage, account)}


class InflightStatus:
    def __init__(self, client_factory=None):
        self._factory = client_factory or InflightClient
        self._lock = threading.Lock()
        self._identity = ""
        self._usage = None
        self._account = None
        self._account_at = 0.
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
                self._identity, self._usage, self._account = identity, None, None
                self._updated = self._attempt = self._account_at = 0.
                self._loading, self._error = False, None
            if refresh and not self._loading and time.time() - self._attempt >= 10:
                self._loading, self._attempt = True, time.time()
                self._thread = threading.Thread(target=self._fetch, args=(cfg, identity), daemon=True,
                                                name="inflight-status")
                self._thread.start()
            usage, info, updated, loading, error = self._usage, self._account, self._updated, self._loading, self._error
        with session_scope() as db:
            local = local_remaining(db, account, cfg)
        return {**quota_snapshot(cfg, local, usage, info), "updated_at": updated or None,
                "loading": loading, "stale": bool(error) or not updated or time.time() - updated > 45,
                "error": error}

    def _fetch(self, cfg, identity):
        try:
            with self._factory(cfg) as client:
                usage = client.usage()
                info = None
                # Tariff facts (bought volume, expiry) change rarely.
                if hasattr(client, "account_info") and time.time() - self._account_at > 600:
                    try:
                        info = client.account_info()
                    except ApiError:
                        info = None
            with self._lock:
                if self._identity == identity:
                    self._usage, self._updated, self._error = usage, time.time(), None
                    if info is not None:
                        self._account, self._account_at = info, time.time()
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
