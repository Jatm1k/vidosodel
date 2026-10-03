"""In-process event bus: background threads publish, SSE clients subscribe.

Events are small JSON dicts telling the UI *what* changed (a job's progress,
a track's data, a scene) so it can refetch or patch its state live.
"""
from __future__ import annotations

import asyncio
import threading
from typing import Any


class EventBus:
    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue] = set()
        self._lock = threading.Lock()
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=1000)
        with self._lock:
            self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        with self._lock:
            self._subscribers.discard(q)

    def publish(self, event: dict[str, Any]) -> None:
        """Thread-safe publish; drops events for clients that fell too far behind."""
        loop = self._loop
        if loop is None or loop.is_closed():
            return
        with self._lock:
            subs = list(self._subscribers)
        for q in subs:
            loop.call_soon_threadsafe(_put_nowait, q, event)


def _put_nowait(q: asyncio.Queue, event: dict[str, Any]) -> None:
    try:
        q.put_nowait(event)
    except asyncio.QueueFull:
        pass


bus = EventBus()


def track_changed(track_id: int, what: str = "track", **extra: Any) -> None:
    bus.publish({"type": "track", "track_id": track_id, "what": what, **extra})


def scene_changed(track_id: int, scene: dict[str, Any]) -> None:
    bus.publish({"type": "scene", "track_id": track_id, "scene": scene})
