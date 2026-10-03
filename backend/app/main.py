"""FastAPI application: API routers, media files and the built single-page UI."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .api import channels, characters, jobs, projects, system
from .config import get_settings
from .db import init_db
from .jobs import runner
from .jobs.events import bus
from .services.http import ApiError
from .services.updates import updates
from .version import __version__

log = logging.getLogger("vidosodel")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    bus.bind_loop(asyncio.get_running_loop())
    runner.start()
    updates.start()
    log.info("Vidosodel %s started, data dir: %s", __version__, get_settings().data_dir)
    yield
    runner.stop()


app = FastAPI(title="Vidosodel", version=__version__, lifespan=lifespan)

for r in (system.router, channels.router, projects.router, characters.router, jobs.router):
    app.include_router(r)


@app.exception_handler(ApiError)
async def api_error_handler(_req: Request, exc: ApiError) -> JSONResponse:
    """External service errors reach the UI as readable messages."""
    return JSONResponse(status_code=502, content={"detail": f"{exc.service}: {exc.message}"})


settings = get_settings()
app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")

_dist = settings.frontend_dist
if (_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=_dist / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def spa(full_path: str):
    """Serve the built UI; unknown paths fall back to index.html (client-side routing)."""
    if full_path.startswith("api/"):
        raise HTTPException(404)
    candidate = (_dist / full_path).resolve()
    if full_path and candidate.is_file() and _dist.resolve() in candidate.parents:
        return FileResponse(candidate)
    index = _dist / "index.html"
    if index.exists():
        return FileResponse(index, headers={"Cache-Control": "no-cache"})
    return JSONResponse({"detail": "Интерфейс не собран. Запустите start.bat (или npm run build в frontend/)."}, 503)
