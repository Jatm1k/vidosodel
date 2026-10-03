"""Job queue API and the live event stream (Server-Sent Events)."""
from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..jobs.events import bus
from ..jobs.runner import job_to_dict, runner
from ..models import Job, Project, Track

router = APIRouter(prefix="/api", tags=["jobs"])


@router.get("/jobs")
def list_jobs(status: str | None = None, project_id: int | None = None, limit: int = 200,
              db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    q = select(Job).order_by(Job.id.desc()).limit(limit)
    if status == "active":
        q = q.where(Job.status.in_(("queued", "running")))
    elif status:
        q = q.where(Job.status == status)
    if project_id:
        q = q.where(Job.project_id == project_id)
    jobs = list(db.scalars(q))
    # Enrich with project/track names for the queue page.
    names = {p.id: p.name for p in db.scalars(select(Project).where(Project.id.in_({j.project_id for j in jobs if j.project_id})))}
    langs = {t.id: t.language for t in db.scalars(select(Track).where(Track.id.in_({j.track_id for j in jobs if j.track_id})))}
    out = []
    for j in jobs:
        d = job_to_dict(j)
        d["project_name"] = names.get(j.project_id)
        d["language"] = langs.get(j.track_id)
        out.append(d)
    return out


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: int) -> dict[str, bool]:
    if not runner.cancel(job_id):
        raise HTTPException(400, "Задачу нельзя отменить (уже завершена)")
    return {"ok": True}


@router.post("/jobs/{job_id}/retry")
def retry_job(job_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(404, "Задача не найдена")
    if job.status in ("queued", "running"):
        raise HTTPException(400, "Задача ещё выполняется")
    params = {k: v for k, v in (job.params or {}).items() if k != "_after"}
    new = runner.enqueue(job.kind, project_id=job.project_id, track_id=job.track_id, params=params, title=job.title)
    # Resume the rest of the pipeline chain that was skipped because this step failed.
    mapping = {job.id: new.id}
    pending = [job.id]
    resumed = 0
    while pending:
        parent = pending.pop(0)
        children = db.scalars(select(Job).where(Job.depends_on_id == parent, Job.status == "cancelled",
                                                Job.started_at.is_(None)).order_by(Job.id))
        for child in children:
            child_params = {k: v for k, v in (child.params or {}).items() if k != "_after"}
            clone = runner.enqueue(child.kind, project_id=child.project_id, track_id=child.track_id,
                                   params=child_params, depends_on=mapping[parent], title=child.title)
            mapping[child.id] = clone.id
            pending.append(child.id)
            resumed += 1
    return {"job_id": new.id, "resumed": resumed}


@router.post("/jobs/cancel-all")
def cancel_all(db: Session = Depends(get_db)) -> dict[str, int]:
    ids = list(db.scalars(select(Job.id).where(Job.status.in_(("queued", "running")))))
    for i in ids:
        runner.cancel(i)
    return {"cancelled": len(ids)}


@router.delete("/jobs/finished")
def clear_finished(db: Session = Depends(get_db)) -> dict[str, bool]:
    db.execute(delete(Job).where(Job.status.in_(("done", "failed", "cancelled"))))
    db.commit()
    return {"ok": True}


@router.get("/events")
async def events(request: Request) -> StreamingResponse:
    """SSE stream of job/track/scene change events for the UI."""
    queue = bus.subscribe()

    async def stream():
        try:
            yield "retry: 3000\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15)
                    yield f"data: {json.dumps(event, ensure_ascii=False, default=str)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"  # keep-alive through proxies
        finally:
            bus.unsubscribe(queue)

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
