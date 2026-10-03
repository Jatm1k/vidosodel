"""Persistent background job runner.

* Jobs live in the ``jobs`` table, so the queue survives restarts: jobs that
  were ``running`` when the app stopped are re-queued on start-up. Handlers
  are written to be resumable (e.g. the voice job re-attaches to an existing
  Lumean order, the image job only generates missing images).
* Each job kind belongs to a *lane* with its own concurrency limit, so a long
  render does not block LLM work and image jobs share the FastGen budget.
* ``depends_on`` chains steps of the full pipeline; a failed step cancels the
  rest of the chain.
"""
from __future__ import annotations

import logging
import threading
import time
import traceback
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select

from ..db import session_scope
from ..models import Job, utcnow
from ..services.limiter import Cancelled, job_hooks
from ..settings_store import load_config
from .events import bus

log = logging.getLogger(__name__)


class JobCancelled(Exception):
    """Raised inside handlers when the user cancelled the job."""


class JobError(Exception):
    """A user-facing failure (message is shown as-is in the UI)."""


@dataclass
class JobContext:
    job_id: int
    kind: str
    params: dict[str, Any]
    project_id: int | None
    track_id: int | None
    _cancel: threading.Event = field(default_factory=threading.Event)
    _last_flush: float = 0.0
    _progress: float = 0.0
    _message: str = ""

    def should_stop(self) -> bool:
        return self._cancel.is_set()

    def check(self) -> None:
        if self._cancel.is_set():
            raise JobCancelled()

    def progress(self, value: float | None = None, message: str | None = None, *, force: bool = False) -> None:
        """Report progress (0..1) and/or a status line. Writes are throttled."""
        if value is not None:
            self._progress = max(0.0, min(1.0, value))
        if message is not None:
            self._message = message
        now = time.time()
        if not force and now - self._last_flush < 0.7:
            return
        self._last_flush = now
        with session_scope() as db:
            job = db.get(Job, self.job_id)
            if job:
                job.progress, job.message = self._progress, self._message
        bus.publish({"type": "job", "job": {"id": self.job_id, "kind": self.kind, "status": "running",
                                            "progress": self._progress, "message": self._message,
                                            "track_id": self.track_id, "project_id": self.project_id}})


Handler = Callable[[JobContext], dict[str, Any] | None]

#: kind → (lane, handler, human title)
_REGISTRY: dict[str, tuple[str, Handler, str]] = {}


def register(kind: str, lane: str, title: str) -> Callable[[Handler], Handler]:
    def deco(fn: Handler) -> Handler:
        _REGISTRY[kind] = (lane, fn, title)
        return fn
    return deco


def kind_title(kind: str) -> str:
    return _REGISTRY.get(kind, ("", None, kind))[2]


def _lane_limits() -> dict[str, int]:
    cfg = load_config()
    return {"llm": 3, "voice": max(1, cfg.lumean_parallel_orders), "images": 3,
            "render": max(1, cfg.parallel_renders), "preview": 1, "misc": 4}


def job_to_dict(job: Job) -> dict[str, Any]:
    return {
        "id": job.id, "kind": job.kind, "title": job.title or kind_title(job.kind), "status": job.status,
        "project_id": job.project_id, "track_id": job.track_id, "depends_on_id": job.depends_on_id,
        "params": job.params, "result": job.result, "progress": job.progress, "message": job.message,
        "error": job.error, "created_at": job.created_at.isoformat() if job.created_at else None,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "finished_at": job.finished_at.isoformat() if job.finished_at else None,
    }


class JobRunner:
    def __init__(self) -> None:
        self._running: dict[int, tuple[str, JobContext]] = {}
        self._lock = threading.Lock()
        self._wake = threading.Event()
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    # -------------------------------------------------------------- lifecycle
    def start(self) -> None:
        with session_scope() as db:
            for job in db.scalars(select(Job).where(Job.status == "running")):
                job.status, job.message = "queued", "Возобновление после перезапуска"
        self._thread = threading.Thread(target=self._loop, name="job-runner", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        self._wake.set()
        with self._lock:
            for _, ctx in self._running.values():
                ctx._cancel.set()

    # ---------------------------------------------------------------- public
    def enqueue(self, kind: str, *, project_id: int | None = None, track_id: int | None = None,
                params: dict[str, Any] | None = None, depends_on: int | None = None, title: str | None = None) -> Job:
        if kind not in _REGISTRY:
            raise ValueError(f"unknown job kind {kind}")
        with session_scope() as db:
            job = Job(kind=kind, project_id=project_id, track_id=track_id, params=params or {},
                      depends_on_id=depends_on, title=title or kind_title(kind), status="queued")
            db.add(job)
            db.flush()
            data = job_to_dict(job)
        bus.publish({"type": "job", "job": data})
        self._wake.set()
        return job

    def cancel(self, job_id: int) -> bool:
        with self._lock:
            entry = self._running.get(job_id)
        if entry:
            entry[1]._cancel.set()
            return True
        with session_scope() as db:
            job = db.get(Job, job_id)
            if job and job.status == "queued":
                job.status, job.finished_at, job.message = "cancelled", utcnow(), "Отменено"
                data = job_to_dict(job)
            else:
                return False
        bus.publish({"type": "job", "job": data})
        self._cancel_dependents(job_id)
        return True

    def active_for_track(self, track_id: int, kinds: set[str] | None = None) -> list[int]:
        with session_scope() as db:
            q = select(Job.id).where(Job.track_id == track_id, Job.status.in_(("queued", "running")))
            if kinds:
                q = q.where(Job.kind.in_(kinds))
            return list(db.scalars(q))

    # ------------------------------------------------------------------ loop
    def _loop(self) -> None:
        while not self._stop.is_set():
            try:
                self._schedule()
            except Exception:  # noqa: BLE001 – the scheduler must never die
                log.exception("job scheduler error")
            self._wake.wait(timeout=2.0)
            self._wake.clear()

    def _schedule(self) -> None:
        limits = _lane_limits()
        with self._lock:
            busy: dict[str, int] = {}
            for lane, _ in self._running.values():
                busy[lane] = busy.get(lane, 0) + 1
        to_start: list[tuple[int, str]] = []
        with session_scope() as db:
            queued = list(db.scalars(select(Job).where(Job.status == "queued").order_by(Job.id)))
            for job in queued:
                if job.kind not in _REGISTRY:
                    job.status, job.error = "failed", "неизвестный тип задачи"
                    continue
                # ``depends_on_id`` plus optional extra dependencies in params["_after"].
                dep_ids = [job.depends_on_id] if job.depends_on_id else []
                dep_ids += [int(x) for x in (job.params or {}).get("_after", [])]
                deps = [d for d in (db.get(Job, i) for i in dep_ids) if d is not None]
                if any(d.status in ("queued", "running") for d in deps):
                    continue
                if any(d.status in ("failed", "cancelled") for d in deps):
                    job.status, job.finished_at = "cancelled", utcnow()
                    job.message = "Пропущено: предыдущий шаг не выполнен"
                    bus.publish({"type": "job", "job": job_to_dict(job)})
                    continue
                lane = _REGISTRY[job.kind][0]
                if busy.get(lane, 0) >= limits.get(lane, 1):
                    continue
                # Never run two jobs of the same kind on the same track at once.
                with self._lock:
                    clash = any(
                        c.track_id == job.track_id and c.kind == job.kind and job.track_id is not None
                        for _, c in self._running.values()
                    )
                if clash:
                    continue
                busy[lane] = busy.get(lane, 0) + 1
                job.status, job.started_at, job.error = "running", utcnow(), None
                job.progress, job.message = 0.0, "Запуск"
                to_start.append((job.id, lane))
                bus.publish({"type": "job", "job": job_to_dict(job)})
        for job_id, lane in to_start:
            self._start(job_id, lane)

    def _start(self, job_id: int, lane: str) -> None:
        with session_scope() as db:
            job = db.get(Job, job_id)
            ctx = JobContext(job.id, job.kind, dict(job.params or {}), job.project_id, job.track_id)
        with self._lock:
            self._running[job_id] = (lane, ctx)
        threading.Thread(target=self._execute, args=(ctx,), name=f"job-{job_id}", daemon=True).start()

    def _execute(self, ctx: JobContext) -> None:
        _, handler, _ = _REGISTRY[ctx.kind]
        status, error, result = "done", None, {}
        try:
            # Budget waits deep inside the handler see the cancel flag and report why they wait.
            with job_hooks(ctx.should_stop, lambda msg: ctx.progress(None, msg, force=True)):
                result = handler(ctx) or {}
            if ctx.should_stop():
                status = "cancelled"
        except (JobCancelled, Cancelled):
            status = "cancelled"
        except JobError as exc:
            status, error = "failed", str(exc)
        except InterruptedError:
            status = "cancelled"
        except Exception as exc:  # noqa: BLE001 – report anything to the UI
            log.error("job %s (%s) failed:\n%s", ctx.job_id, ctx.kind, traceback.format_exc())
            status, error = "failed", str(exc) or exc.__class__.__name__
        finally:
            with self._lock:
                self._running.pop(ctx.job_id, None)
        with session_scope() as db:
            job = db.get(Job, ctx.job_id)
            if job:
                job.status, job.error, job.finished_at = status, error, utcnow()
                job.result = result
                if status == "done":
                    job.progress, job.message = 1.0, (result.get("message") if isinstance(result, dict) else None) or "Готово"
                elif status == "cancelled":
                    job.message = "Отменено"
                data = job_to_dict(job)
            else:
                data = None
        if data:
            bus.publish({"type": "job", "job": data})
        if ctx.track_id:
            bus.publish({"type": "track", "track_id": ctx.track_id, "what": ctx.kind})
        if status in ("failed", "cancelled"):
            self._cancel_dependents(ctx.job_id)
        self._wake.set()

    def _cancel_dependents(self, job_id: int) -> None:
        with session_scope() as db:
            pending = [job_id]
            while pending:
                parent = pending.pop()
                for child in db.scalars(select(Job).where(Job.depends_on_id == parent, Job.status == "queued")):
                    child.status, child.finished_at = "cancelled", utcnow()
                    child.message = "Пропущено: предыдущий шаг не выполнен"
                    bus.publish({"type": "job", "job": job_to_dict(child)})
                    pending.append(child.id)


runner = JobRunner()
