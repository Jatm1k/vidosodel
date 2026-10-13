"""Disk usage of the media folder and its clean-up (whole app or one channel)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from .. import cleanup

router = APIRouter(prefix="/api/storage", tags=["storage"])


@router.get("")
async def storage_usage(channel_id: int | None = None) -> dict[str, Any]:
    # Walks the media folder – off the event loop.
    return await run_in_threadpool(cleanup.usage, channel_id)


class CleanupRequest(BaseModel):
    kinds: list[str]
    channel_id: int | None = None


@router.post("/cleanup")
async def storage_cleanup(body: CleanupRequest) -> dict[str, Any]:
    kinds = [k for k in body.kinds if k in cleanup.KINDS]
    if not kinds:
        raise HTTPException(400, "Не выбрано, что очищать")
    result = await run_in_threadpool(cleanup.cleanup, kinds, body.channel_id)
    result["usage"] = await run_in_threadpool(cleanup.usage, body.channel_id)
    return result
