"""FastGen hourly budgets: image credits + threads, and LLM tokens.

The plan allows N simultaneous image generations, M image credits and T chat
tokens per hour. Every image generation and every chat request goes through a
limiter here: it blocks until the request fits into the budget, so the app
waits instead of failing when the limit is reached.

FastGen counts usage in fixed windows: every counter starts from zero at the
top of the hour (``window_start`` in ``GET /api/v6/usage``), so the budget is
counted in the same window here:

* the server's counter for the whole API key, so that other people and tools
  using the same key are respected. It is refreshed every minute, and right
  away whenever the limit is close or FastGen refuses a request because of it;
* a local ledger (table ``fastgen_usage``) that survives restarts and covers
  this app's own requests made since the last refresh – or everything, when
  the server could not be reached.

If two apps start at the same moment and FastGen still refuses a request over
the limit, :func:`is_limit_error` recognises it and the caller waits (see
:meth:`BudgetLimiter.block`) instead of reporting an error.
"""
from __future__ import annotations

import logging
import re
import threading
import time
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any

from sqlalchemy import delete, func, select

from ..db import session_scope
from ..models import FastgenUsage
from ..settings_store import load_config

log = logging.getLogger(__name__)

WINDOW = 3600.0
_SYNC_INTERVAL = 60.0
_SYNC_INTERVAL_BUSY = 10.0
#: Server counters older than this (sync keeps failing) are ignored in favour of the local ledger.
_SERVER_TRUST = 600.0
#: How long to back off when FastGen refuses a request because of a limit.
_LIMIT_BACKOFF = 30.0

#: Ledger operation names.
OP_IMAGE = "image"
OP_LLM = "llm"


class Cancelled(Exception):
    """Raised while waiting for budget when the caller asked to stop."""


# ------------------------------------------------------------------ job hooks
_local = threading.local()


@contextmanager
def job_hooks(should_stop: Callable[[], bool] | None, on_wait: Callable[[str], None] | None) -> Iterator[None]:
    """Let limiter waits in this thread see the job's cancel flag and report why it waits.

    Set by the job runner around every handler, so deep calls (e.g. an LLM
    request inside a pipeline helper) wait cancellably without extra arguments.
    """
    prev = getattr(_local, "hooks", None)
    _local.hooks = (should_stop, on_wait)
    try:
        yield
    finally:
        _local.hooks = prev


def _thread_hooks() -> tuple[Callable[[], bool] | None, Callable[[str], None] | None]:
    return getattr(_local, "hooks", None) or (None, None)


_LIMIT_PATTERNS = re.compile(
    r"rate.?limit|quota|limit (?:exceeded|reached)|exceed(?:ed|s)? .*limit|too many|per.?hour|hourly|"
    r"threads?.{0,20}(?:limit|allowed|busy)|concurren|лимит|превыш",
    re.I,
)


def is_limit_error(exc: Exception) -> bool:
    """FastGen refused a request because the key is over its hourly or thread limit."""
    status = getattr(exc, "status", None)
    if status == 429:
        return True
    if status not in (400, 402, 403, 409, 423, 503):
        return False
    text = f"{getattr(exc, 'message', '')} {getattr(exc, 'reason', '') or ''}"
    return bool(_LIMIT_PATTERNS.search(text))


# ------------------------------------------------------------------ server counters
@dataclass
class ServerCounter:
    used: int = 0
    window_start: float | None = None

    def window(self, now: float | None = None) -> tuple[float, float]:
        """Start and end of the current window: the server's one while it lasts, else the clock hour."""
        now = now or time.time()
        if self.window_start and self.window_start <= now < self.window_start + WINDOW:
            return self.window_start, self.window_start + WINDOW
        start = now - now % WINDOW
        return start, start + WINDOW

    def used_in(self, start: float) -> int:
        """Server usage in the window starting at ``start`` (0 once the server's window has passed)."""
        return self.used if self.window_start == start else 0


class UsageSync:
    """Cached ``GET /api/v6/usage`` for the whole key (shared by both limiters)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._last = 0.0
        #: When the counters were last read successfully (0 – never).
        self.synced_at = 0.0
        self.images = ServerCounter()
        self.tokens = ServerCounter()
        #: Image generations running right now on this key (all apps together).
        self.image_threads = 0
        self.limits: dict[str, Any] = {}

    def refresh(self, max_age: float = _SYNC_INTERVAL) -> None:
        """Re-read the server counters when the cached ones are older than ``max_age`` seconds."""
        with self._lock:
            if time.time() - self._last < max_age:
                return
            self._last = time.time()
        try:
            from .fastgen import FastgenClient  # noqa: PLC0415 – avoids an import cycle

            with FastgenClient() as fg:
                usage = fg.usage()
        except Exception as exc:  # noqa: BLE001 – a failed sync must never break generation
            log.debug("FastGen usage sync failed: %s", exc)
            return
        current = usage.get("current_usage") or {}
        hourly = current.get("hourly_usage") or {}
        with self._lock:
            for counter, key in ((self.images, "image_generation"), (self.tokens, "prompt_generation")):
                stats = hourly.get(key) or {}
                counter.used = int(stats.get("current_usage") or 0)
                counter.window_start = stats.get("window_start")
            self.image_threads = int((current.get("active_threads") or {}).get("image_threads") or 0)
            self.limits = usage.get("account_limits") or {}
            self.synced_at = time.time()

    def fresh(self) -> bool:
        """The server counters are recent enough to be trusted over the local ledger."""
        return time.time() - self.synced_at < _SERVER_TRUST


usage_sync = UsageSync()


# ------------------------------------------------------------------ budget limiter
class BudgetLimiter:
    """Rolling-hour budget of one resource (image credits or chat tokens)."""

    #: Ledger operation name and the server counter this budget is checked against.
    operation = OP_IMAGE
    label = "FastGen"
    unit = "кредитов"

    def __init__(self) -> None:
        self._cond = threading.Condition()
        self._reserved = 0  # in-flight requests not yet in the ledger
        self._blocked_until = 0.0  # FastGen refused a request because of the limit
        self.waiting = 0

    # -- subclass API
    def _budget(self) -> int:
        raise NotImplementedError

    def _server(self) -> ServerCounter:
        raise NotImplementedError

    def _can_start(self) -> bool:
        """Extra condition besides the budget (e.g. free threads)."""
        return True

    def _on_start(self) -> None:
        pass

    def _on_finish(self) -> None:
        pass

    # -- accounting
    def _ledger_used(self, since: float) -> int:
        """Spent by this app since ``since`` (epoch seconds)."""
        with session_scope() as db:
            db.execute(delete(FastgenUsage).where(FastgenUsage.ts < time.time() - 2 * WINDOW))
            used = db.execute(
                select(func.coalesce(func.sum(FastgenUsage.credits), 0))
                .where(FastgenUsage.ts >= since, FastgenUsage.operation == self.operation)
            ).scalar_one()
        return int(used)

    def _used_now(self) -> tuple[int, float, float]:
        """Effective usage (incl. reservations), seconds until budget frees up and when the window resets."""
        now = time.time()
        server = self._server()
        start, reset_at = server.window(now)
        used = self._ledger_used(start)
        if usage_sync.fresh():
            # The server knows everything spent on the key up to the last sync; add only our newer requests.
            since_sync = self._ledger_used(max(start, usage_sync.synced_at))
            used = max(used, server.used_in(start) + since_sync)
        wait = reset_at - now
        blocked = self._blocked_until - now
        if blocked > 0:
            used, wait = max(used, self._budget()), min(blocked, wait)
        return used + self._reserved, max(5.0, wait), reset_at

    def block(self, seconds: float | None = None) -> None:
        """FastGen refused a request over the limit: treat the budget as full for a while."""
        seconds = seconds or _LIMIT_BACKOFF
        with self._cond:
            self._blocked_until = max(self._blocked_until, time.time() + seconds)
        usage_sync.refresh(max_age=0)
        log.info("%s limit reached on the server – waiting %.0fs", self.label, seconds)

    def record(self, amount: int, ref: str | None = None) -> None:
        if amount > 0:
            with session_scope() as db:
                db.add(FastgenUsage(ts=time.time(), credits=int(amount), operation=self.operation,
                                    generation_id=ref))

    # -- acquire
    @contextmanager
    def slot(self, amount: int, should_stop: Callable[[], bool] | None = None,
             on_wait: Callable[[str], None] | None = None) -> Iterator[Callable[..., None]]:
        """Reserve ``amount`` until the request is done. Yields ``commit(actual, ref=None)``.

        If ``commit`` is not called (failed before billing, refunded) the
        reservation is simply released.
        """
        hook_stop, hook_wait = _thread_hooks()
        should_stop = should_stop or hook_stop
        on_wait = on_wait or hook_wait
        amount = min(int(amount), self._budget())  # a single huge request must still be able to run
        self._acquire(amount, should_stop, on_wait)
        committed = False

        def commit(actual: int, ref: str | None = None) -> None:
            nonlocal committed
            if not committed:
                committed = True
                self.record(actual, ref)

        try:
            yield commit
        finally:
            with self._cond:
                self._on_finish()
                self._reserved -= amount
                self._cond.notify_all()

    def _acquire(self, amount: int, should_stop: Callable[[], bool] | None,
                 on_wait: Callable[[str], None] | None) -> None:
        with self._cond:
            self.waiting += 1
        try:
            while True:
                if should_stop and should_stop():
                    raise Cancelled()
                budget = self._budget()
                usage_sync.refresh()
                with self._cond:
                    used, free_in, reset_at = self._used_now()
                    if used + amount <= budget and self._can_start():
                        self._on_start()
                        self._reserved += amount
                        return
                    if used + amount <= budget:  # only threads are busy – they free up quickly
                        self._cond.wait(timeout=2.0)
                        if self._waited_long_for_threads():
                            usage_sync.refresh(max_age=_SYNC_INTERVAL_BUSY)
                        continue
                if on_wait:
                    until = (f"до {time.strftime('%H:%M', time.localtime(reset_at))}" if free_in >= reset_at - time.time() - 1
                             else f"~{int(free_in // 60) + 1} мин")
                    on_wait(f"Лимит {self.label}: {fmt_amount(used)}/{fmt_amount(budget)} {self.unit} в час, "
                            f"ожидание {until}")
                # Sleep in small steps so cancellation stays responsive; re-check the server meanwhile.
                end = time.time() + min(free_in, 60.0)
                while time.time() < end:
                    if should_stop and should_stop():
                        raise Cancelled()
                    time.sleep(1.0)
                usage_sync.refresh(max_age=_SYNC_INTERVAL_BUSY)
        finally:
            with self._cond:
                self.waiting -= 1

    def _waited_long_for_threads(self) -> bool:
        return False

    # -- status
    def status(self) -> dict[str, int | float | None]:
        budget = self._budget()
        usage_sync.refresh()
        with self._cond:
            used, free_in, reset_at = self._used_now()
            return {"used": used, "budget": budget, "waiting": self.waiting,
                    "free_in_seconds": free_in if used >= budget else 0,
                    "reset_at": reset_at}


def fmt_amount(n: int) -> str:
    return f"{n / 1000:.0f} тыс." if n >= 10_000 else str(n)


class ImageLimiter(BudgetLimiter):
    """Image credits per hour + concurrent generations (threads are shared by every app on the key)."""

    operation = OP_IMAGE
    label = "FastGen"
    unit = "кредитов"

    def __init__(self) -> None:
        super().__init__()
        self._active = 0
        self._threads_wait_since = 0.0

    @staticmethod
    def _limits() -> tuple[int, int]:
        cfg = load_config()
        budget = int(cfg.fastgen_credits_per_hour * max(0.05, min(cfg.fastgen_budget_ratio, 1.0)))
        return max(1, cfg.fastgen_image_threads), max(1, budget)

    def _budget(self) -> int:
        return self._limits()[1]

    def _server(self) -> ServerCounter:
        return usage_sync.images

    def _threads_allowed(self) -> int:
        """Our thread limit minus generations other apps run on the same key right now."""
        threads = self._limits()[0]
        plan = int(usage_sync.limits.get("img_generation_threads_allowed") or threads)
        others = max(0, usage_sync.image_threads - self._active)
        return max(1, min(threads, plan - others))

    def _can_start(self) -> bool:
        return self._active < self._threads_allowed()

    def _on_start(self) -> None:
        self._active += 1
        self._threads_wait_since = 0.0

    def _on_finish(self) -> None:
        self._active -= 1

    def _waited_long_for_threads(self) -> bool:
        now = time.time()
        if not self._threads_wait_since:
            self._threads_wait_since = now
        return now - self._threads_wait_since > _SYNC_INTERVAL_BUSY

    def hourly_budget(self) -> int:
        """Credits per rolling hour this app may spend (plan limit × budget ratio)."""
        return self._budget()

    def sync_server(self, force: bool = False) -> None:
        usage_sync.refresh(max_age=0 if force else _SYNC_INTERVAL)

    def status(self) -> dict[str, int | float | None]:
        out = super().status()
        out.update(active=self._active, threads=self._threads_allowed())
        return out


class TokenLimiter(BudgetLimiter):
    """Chat (LLM) tokens per hour – prompt and completion together."""

    operation = OP_LLM
    label = "LLM"
    unit = "токенов"

    def _budget(self) -> int:
        cfg = load_config()
        return max(1000, int(cfg.fastgen_tokens_per_hour * max(0.05, min(cfg.fastgen_token_ratio, 1.0))))

    def _server(self) -> ServerCounter:
        return usage_sync.tokens


def estimate_tokens(messages: list[dict[str, Any]], max_tokens: int | None = None) -> int:
    """Rough cost of a chat request before sending it (≈3.5 characters per token + the answer)."""
    chars = sum(len(str(m.get("content", ""))) for m in messages)
    return int(chars / 3.5) + (max_tokens or 3000)


limiter = ImageLimiter()
token_limiter = TokenLimiter()
