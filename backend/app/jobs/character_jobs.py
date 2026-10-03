"""Character references: find recurring people in the script and draw their portraits.

Runs once per project (on the master track) when ``images.character_refs`` is
on. Both steps are idempotent: a scanned project is not scanned again unless
asked, and only characters without a portrait get one. Portraits uploaded by
the user are never replaced automatically.
"""
from __future__ import annotations

import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from ..db import session_scope
from ..models import Character, Project
from ..pipeline import llm_tasks
from ..services.fastgen import FastgenClient
from ..settings_schema import effective_settings
from ..storage import project_dir, to_abs, to_rel, unique_name
from .common import master_track
from .events import track_changed
from .image_jobs import generate_one
from .runner import JobContext, JobError, register
from .scene_jobs import ensure_bible


def _notify(project_id: int) -> None:
    with session_scope() as db:
        project = db.get(Project, project_id)
        master = master_track(db, project) if project else None
        master_id = master.id if master else None
    if master_id:
        track_changed(master_id, "characters")


def ensure_scanned(project_id: int, fg: FastgenClient, *, force: bool = False) -> int:
    """Find recurring characters in the script (once). Returns how many were added.

    A repeated scan only adds people that are not in the list yet: edits,
    uploads and deletions made by the user stay as they are.
    """
    with session_scope() as db:
        project = db.get(Project, project_id)
        if project.characters_scanned_at and not force:
            return 0
        master = master_track(db, project)
        script = master.script if master else ""
        llm = effective_settings(project.channel.settings, project.settings).llm
    if not script.strip():
        raise JobError("Нет сценария — персонажей искать не в чем.")
    bible = ensure_bible(project_id, fg)
    found = llm_tasks.extract_characters(fg, script, bible, llm)
    added = 0
    with session_scope() as db:
        project = db.get(Project, project_id)
        existing = {c.name.strip().lower() for c in project.characters}
        pos = max((c.position for c in project.characters), default=-1)
        for c in found:
            if c["name"].lower() in existing:
                continue
            pos += 1
            db.add(Character(project_id=project_id, position=pos, name=c["name"], description=c["description"]))
            added += 1
        project.characters_scanned_at = time.time()
    _notify(project_id)
    return added


def ensure_portraits(project_id: int, ctx: JobContext, *, only: set[int] | None = None,
                     force: bool = False) -> tuple[int, int]:
    """Draw missing portraits (or the ``only`` ones when ``force``). Returns ``(done, failed)``."""
    def wanted(c: Character) -> bool:
        missing = not c.image_file or c.image_status == "failed"
        if only is not None:
            return c.id in only and (force or missing)
        return missing and c.image_origin != "upload"

    with session_scope() as db:
        project = db.get(Project, project_id)
        s = effective_settings(project.channel.settings, project.settings)
        targets = [(c.id, c.description or c.name) for c in project.characters if wanted(c)]
        for c in project.characters:
            if wanted(c):
                c.image_status, c.image_error = "generating", None
    if not targets:
        return 0, 0
    _notify(project_id)
    images = s.images.model_copy(update={"upscale_2x": False})
    out_dir = project_dir(project_id) / "characters"
    out_dir.mkdir(parents=True, exist_ok=True)
    result = {"done": 0, "failed": 0}
    lock = threading.Lock()

    def draw(char_id: int, description: str) -> None:
        try:
            with FastgenClient() as fg:
                path, meta = generate_one(fg, llm_tasks.portrait_prompt(description), out_dir, f"character_{char_id}",
                                          images, s.llm, [], ctx, operation=images.character_operation)
            with session_scope() as db:
                c = db.get(Character, char_id)
                if c is None:
                    path.unlink(missing_ok=True)
                    return
                old = to_abs(c.image_file)
                c.image_file, c.image_status, c.image_error, c.image_origin = to_rel(path), "done", None, "generated"
            if old and old.exists() and old != path:
                old.unlink(missing_ok=True)
            with lock:
                result["done"] += 1
        except Exception as exc:  # noqa: BLE001 – one failed portrait must not stop the others
            with session_scope() as db:
                c = db.get(Character, char_id)
                if c:
                    c.image_status = "done" if c.image_file else "failed"
                    c.image_error = str(exc)[:500]
            with lock:
                result["failed"] += 1
            if ctx.should_stop():
                raise
        finally:
            _notify(project_id)

    ctx.progress(0.3, f"Портреты персонажей: {len(targets)}")
    with ThreadPoolExecutor(max_workers=min(3, len(targets))) as pool:
        list(pool.map(lambda t: draw(*t), targets))
    return result["done"], result["failed"]


@register("characters", "images", "Персонажи")
def characters_job(ctx: JobContext) -> dict[str, Any]:
    """Params: ``rescan`` – search the script again; ``character_ids`` + ``force`` – redraw these portraits."""
    project_id = ctx.project_id
    if project_id is None:
        raise JobError("Задача не привязана к проекту")
    only = set(ctx.params.get("character_ids") or []) or None
    added = 0
    if not only:
        ctx.progress(0.05, "Поиск персонажей в сценарии", force=True)
        with FastgenClient() as fg:
            added = ensure_scanned(project_id, fg, force=bool(ctx.params.get("rescan")))
    done, failed = ensure_portraits(project_id, ctx, only=only, force=bool(ctx.params.get("force")))
    with session_scope() as db:
        total = len(db.get(Project, project_id).characters)
    if failed and not done:
        raise JobError(f"Не удалось нарисовать портреты ({failed}). Подробности — в карточках персонажей.")
    if not total:
        return {"message": "Повторяющихся персонажей в сценарии нет — референсы не нужны"}
    parts = [f"Персонажей: {total}"]
    if added:
        parts.append(f"найдено новых: {added}")
    if done:
        parts.append(f"портретов: {done}")
    if failed:
        parts.append(f"ошибок: {failed}")
    return {"message": ", ".join(parts)}


def portrait_path_unique(project_id: int, char_id: int, suffix: str = ".jpg"):
    """Destination for an uploaded portrait."""
    d = project_dir(project_id) / "characters"
    d.mkdir(parents=True, exist_ok=True)
    return d / unique_name(f"character_{char_id}", suffix)
