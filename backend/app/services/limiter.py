"""FastGen image budget: concurrent threads + rolling hourly credit window.

The plan allows N simultaneous image generations and M credits per hour.
Every worker that wants to generate an image calls :meth:`acquire` with the
credit cost; it blocks until a thread slot is free *and* the credits fit
into the budget. Spent credits are written to the ``fastgen_usage`` table so
the window survives restarts, and refunded generations give credits back.

The local ledger is cross-checked with the server's own counter
(``GET /api/v6/usage``) so usage from other tools on the same key is respected.
"""
from __future__ import annotations

import logging
import threading
import time
from contextlib import contextmanager
from collections.abc import Callable, Iterator

from sqlalchemy import delete, func, select

from ..db import session_scope
from ..models import FastgenUsage
from ..settings_store import load_config

log = logging.getLogger(__name__)

WINDOW = 3600.0
_SERVER_SYNC_INTERVAL = 60.0


class Cancelled(Exception):
    """Raised from :meth:`FastgenLimiter.acquire` when the caller asked to stop."""


class FastgenLimiter:
    def __init__(self) -> None:
        self._cond = threading.Condition()
        self._active = 0
        self._reserved = 0  # credits of in-flight generations not yet in the ledger
        self._server_used = 0
        self._server_window_start: float | None = None
        self._last_sync = 0.0
        self.waiting = 0

    # ------------------------------------------------------------------ limits
    @staticmethod
    def _limits() -> tuple[int, int]:
        cfg = load_config()
        budget = int(cfg.fastgen_credits_per_hour * max(0.05, min(cfg.fastgen_budget_ratio, 1.0)))
        return max(1, cfg.fastgen_image_threads), max(1, budget)

    def _ledger_used(self) -> tuple[int, float | None]:
        """Credits spent in the last hour and the timestamp of the oldest entry."""
        cutoff = time.time() - WINDOW
        with session_scope() as db:
            db.execute(delete(FastgenUsage).where(FastgenUsage.ts < cutoff - WINDOW))
            used, oldest = db.execute(
                select(func.coalesce(func.sum(FastgenUsage.credits), 0), func.min(FastgenUsage.ts))
                .where(FastgenUsage.ts >= cutoff)
            ).one()
        return int(used), oldest

    def sync_server(self, force: bool = False) -> None:
        """Refresh the server-side hourly counter (best effort)."""
        if not force and time.time() - self._last_sync < _SERVER_SYNC_INTERVAL:
            return
        self._last_sync = time.time()
        try:
            from .fastgen import FastgenClient

            with FastgenClient() as fg:
                usage = fg.usage()
            stats = ((usage.get("current_usage") or {}).get("hourly_usage") or {}).get("image_generation") or {}
            self._server_used = int(stats.get("current_usage") or 0)
            self._server_window_start = stats.get("window_start")
        except Exception as exc:  # noqa: BLE001 – usage sync must never break generation
            log.debug("FastGen usage sync failed: %s", exc)

    def _used_now(self) -> tuple[int, float]:
        """Effective used credits and the number of seconds until some budget frees up."""
        local, oldest = self._ledger_used()
        used = local
        wait = (oldest + WINDOW - time.time()) if oldest else 30.0
        if self._server_window_start:
            server_reset = self._server_window_start + WINDOW - time.time()
            if server_reset > 0 and self._server_used > used:
                used = self._server_used
                wait = server_reset
        return used + self._reserved, max(5.0, wait)

    # ----------------------------------------------------------------- acquire
    @contextmanager
    def slot(self, credits: int, should_stop: Callable[[], bool] | None = None,
             on_wait: Callable[[str], None] | None = None) -> Iterator[Callable[[int, str | None], None]]:
        """Hold a generation slot. Yields ``commit(actual_credits, generation_id)``.

        If ``commit`` is not called (generation failed before billing or was
        refunded) the reservation is simply released.
        """
        self._acquire(credits, should_stop, on_wait)
        committed = False

        def commit(actual: int, generation_id: str | None = None) -> None:
            nonlocal committed
            if committed:
                return
            committed = True
            with session_scope() as db:
                db.add(FastgenUsage(ts=time.time(), credits=int(actual), operation="image", generation_id=generation_id))

        try:
            yield commit
        finally:
            with self._cond:
                self._active -= 1
                self._reserved -= credits
                self._cond.notify_all()

    def _acquire(self, credits: int, should_stop: Callable[[], bool] | None,
                 on_wait: Callable[[str], None] | None) -> None:
        with self._cond:
            self.waiting += 1
        try:
            while True:
                if should_stop and should_stop():
                    raise Cancelled()
                threads, budget = self._limits()
                self.sync_server()
                with self._cond:
                    used, free_in = self._used_now()
                    if self._active < threads and used + credits <= budget:
                        self._active += 1
                        self._reserved += credits
                        return
                    if self._active >= threads:
                        self._cond.wait(timeout=2.0)
                        continue
                if on_wait:
                    on_wait(f"Лимит FastGen: {used}/{budget} кредитов в час, ожидание ~{int(free_in // 60) + 1} мин")
                # Sleep in small steps so cancellation stays responsive.
                end = time.time() + min(free_in, 60.0)
                while time.time() < end:
                    if should_stop and should_stop():
                        raise Cancelled()
                    time.sleep(1.0)
                self.sync_server(force=True)
        finally:
            with self._cond:
                self.waiting -= 1

    # ------------------------------------------------------------------ status
    def hourly_budget(self) -> int:
        """Credits per rolling hour this app may spend (plan limit × budget ratio)."""
        return self._limits()[1]

    def status(self) -> dict[str, int | float | None]:
        threads, budget = self._limits()
        self.sync_server()
        with self._cond:
            used, free_in = self._used_now()
            return {
                "active": self._active,
                "threads": threads,
                "waiting": self.waiting,
                "used": used,
                "budget": budget,
                "free_in_seconds": free_in if used >= budget else 0,
            }


limiter = FastgenLimiter()
