"""Persistent background job runner.

* Jobs live in the ``jobs`` table, so the queue survives restarts: jobs that
  were ``running`` when the app stopped are re-queued on start-up. Handlers
  are written to be resumable (e.g. the voice job re-attaches to an existing
  Lumean order, the image job only generates missing images).
* Each job kind belongs to a *lane* with its own concurrency limit, so a long
  render does not block LLM work and image jobs share the FastGen budget.
* ``depends_on`` chains steps of the full pipeline; a failed step cancels the
  rest of the chain. Extra dependencies live in ``params``:
  ``_after`` – like ``depends_on``; ``_started`` – the job may start once these
  have started (images follow the prompts while they are being written);
  ``_wait`` – wait for these to end, whatever their outcome.
* Bulk prompts and bulk image jobs run one at a time across all projects, so
  the LLM and image budgets each finish one project before the next. A
  ``_low`` job (pipeline metadata) waits until no LLM pipeline work is left.
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


#: A job idle this long (e.g. images waiting while the LLM is over its hourly limit) frees its lane.
IDLE_YIELD = 60.0


@dataclass
class JobContext:
    job_id: int
    kind: str
    params: dict[str, Any]
    project_id: int | None
    track_id: int | None
    #: Set by a handler while it has nothing to do (images waiting for new prompts, 0 – busy).
    #: After ``IDLE_YIELD`` seconds the job stops holding its lane, so another one may run meanwhile.
    idle_since: float = 0.0
    _cancel: threading.Event = field(default_factory=threading.Event)
    _last_flush: float = 0.0
    _progress: float = 0.0
    _message: str = ""

    def set_idle(self, idle: bool) -> None:
        if not idle:
            self.idle_since = 0.0
        elif not self.idle_since:
            self.idle_since = time.time()

    @property
    def yields_lane(self) -> bool:
        return bool(self.idle_since) and time.time() - self.idle_since > IDLE_YIELD

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
    return {"llm": 3, "prompts": 1, "voice": max(1, cfg.lumean_parallel_orders), "images": 1,
            "images_few": 3, "characters": 1, "render": max(1, cfg.parallel_renders), "preview": 1, "misc": 4}


def _job_lane(kind: str, params: dict[str, Any] | None) -> str:
    """Lane of a job: a few scenes picked by hand do not wait behind another project's bulk run."""
    lane = _REGISTRY[kind][0]
    if (params or {}).get("scene_ids"):
        return {"prompts": "llm", "images": "images_few"}.get(lane, lane)
    return lane


#: LLM work of the pipeline that ``_low`` jobs (metadata) let go first.
_LLM_PIPELINE_KINDS = ("translate", "scenes", "bible", "characters", "prompts")


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
            data = self._close_unstarted(job_id)
        if data is None:
            return False
        bus.publish({"type": "job", "job": data})
        self._cancel_dependents(job_id)
        return True

    @staticmethod
    def _close_unstarted(job_id: int) -> dict[str, Any] | None:
        with session_scope() as db:
            job = db.get(Job, job_id)
            # "running" without a worker thread is an orphan (its thread is gone): close it too.
            if job and job.status in ("queued", "running"):
                job.status, job.finished_at, job.message = "cancelled", utcnow(), "Отменено"
                return job_to_dict(job)
        return None

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
            for lane, c in self._running.values():
                if not c.yields_lane:
                    busy[lane] = busy.get(lane, 0) + 1
        to_start: list[tuple[int, str]] = []
        with session_scope() as db:
            queued = list(db.scalars(select(Job).where(Job.status == "queued").order_by(Job.id)))
            llm_pending = any(
                j.kind in _LLM_PIPELINE_KINDS and not (j.params or {}).get("scene_ids")
                for j in queued
            ) or any(j.kind in _LLM_PIPELINE_KINDS for j in db.scalars(select(Job).where(Job.status == "running")))
            for job in queued:
                if job.kind not in _REGISTRY:
                    job.status, job.error = "failed", "неизвестный тип задачи"
                    continue
                params = job.params or {}
                # ``depends_on_id`` plus optional extra dependencies in params["_after"].
                dep_ids = [job.depends_on_id] if job.depends_on_id else []
                dep_ids += [int(x) for x in params.get("_after", [])]
                deps = [d for d in (db.get(Job, i) for i in dep_ids) if d is not None]
                started = [d for d in (db.get(Job, int(i)) for i in params.get("_started", [])) if d is not None]
                waits = [d for d in (db.get(Job, int(i)) for i in params.get("_wait", [])) if d is not None]
                if any(d.status in ("queued", "running") for d in deps + waits) or                         any(d.status == "queued" for d in started):
                    continue
                if any(d.status in ("failed", "cancelled") for d in deps + started):
                    job.status, job.finished_at = "cancelled", utcnow()
                    job.message = "Пропущено: предыдущий шаг не выполнен"
                    bus.publish({"type": "job", "job": job_to_dict(job)})
                    continue
                if params.get("_low") and llm_pending:
                    self._hold(job, "Ждёт конца промптов и других LLM-шагов, чтобы не занимать лимит токенов")
                    continue
                lane = _job_lane(job.kind, params)
                if busy.get(lane, 0) >= limits.get(lane, 1):
                    if lane in ("prompts", "images"):
                        self._hold(job, "В очереди: выполняется другой проект")
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

    @staticmethod
    def _hold(job: Job, message: str) -> None:
        """Explain in the UI why a ready job still waits."""
        if job.message != message:
            job.message = message
            bus.publish({"type": "job", "job": job_to_dict(job)})

    def _start(self, job_id: int, lane: str) -> None:
        # Under the lock: ``cancel`` must see either the worker or the job still without one.
        with self._lock, session_scope() as db:
            job = db.get(Job, job_id)
            if job is None or job.status != "running":
                return  # cancelled right after being picked
            ctx = JobContext(job.id, job.kind, dict(job.params or {}), job.project_id, job.track_id)
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
