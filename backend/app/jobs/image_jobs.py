"""Image generation for scenes and thumbnails (FastGen, shared hourly budget)."""
from __future__ import annotations

import base64
import logging
import threading
import time
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from pathlib import Path
from typing import Any

import cv2

from ..db import session_scope
from ..models import Character, Scene, Track
from ..pipeline import characters as chars
from ..pipeline import llm_tasks
from ..pipeline.image_plan import plan_project
from ..render.media import imread, imwrite, make_thumbnail, remove_watermark
from ..services.fastgen import IMAGE_OPS_BY_ID, FastgenClient, GenerationFailed, image_credits
from ..services.http import ApiError
from ..services.limiter import Cancelled, limiter
from ..settings_schema import ImageSettings, LlmSettings
from ..storage import to_abs, to_rel, track_dir, unique_name
from .common import load_track, scene_to_dict
from .events import scene_changed, track_changed
from .runner import JobCancelled, JobContext, JobError, register

log = logging.getLogger(__name__)


def reference_inputs(images: ImageSettings, operations: set[str] | None = None) -> list[str]:
    """Channel style references as compact JPEG data URIs (≤1280 px, well under the 5 MB limit).

    Loaded when references are on and at least one of ``operations`` accepts them.
    """
    ops = operations or {images.operation}
    if not images.use_references or not any(IMAGE_OPS_BY_ID.get(op, {}).get("refs") for op in ops):
        return []
    return [uri for rel in images.reference_images[:6] if (uri := image_data_uri(rel))]


def image_data_uri(rel: str | None, max_side: int = 1280) -> str | None:
    """A stored image as a compact JPEG data URI for the ``inputs`` of a generation."""
    path = to_abs(rel)
    if not path or not path.exists():
        return None
    img = imread(path)
    h, w = img.shape[:2]
    scale = min(1.0, max_side / max(h, w))
    if scale < 1:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 88])
    return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode() if ok else None


def postprocess(raw: Path, dest: Path, images: ImageSettings) -> bool:
    """Remove the provider watermark (if the image has one) and store as high-quality JPEG.

    Every model's output is checked: Gemini-based models stamp the sparkle on
    only part of their images. Returns True when a watermark was removed.
    """
    img, removed = remove_watermark(imread(raw), _watermark_method(images))
    imwrite(dest, img, quality=95)
    raw.unlink(missing_ok=True)
    return removed


def _watermark_method(images: ImageSettings) -> str:
    return "auto" if images.watermark_fix == "inpaint" else images.watermark_fix


def generate_one(
    fg: FastgenClient, prompt: str, dest_dir: Path, stem: str, images: ImageSettings, llm: LlmSettings,
    refs: list[str], ctx: JobContext, on_wait=None, operation: str | None = None,
    on_prompt_fixed=None, note: str = "",
) -> tuple[Path, dict[str, Any]]:
    """Generate a single image with retries, budget control and prompt auto-fixing.

    ``note`` is put before the prompt (e.g. which reference image shows which character).
    """
    operation = operation or images.operation
    credits = image_credits(operation, images.upscale_2x)
    attempts = max(1, images.max_attempts)
    current = prompt
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        ctx.check()
        raw = dest_dir / f"{stem}.raw"
        try:
            with limiter.slot(credits, should_stop=ctx.should_stop, on_wait=on_wait) as commit:
                started: dict[str, Any] = {}
                try:
                    meta = fg.generate_image(
                        note + llm_tasks.compose_prompt(current, images), raw, operation=operation,
                        references=refs if IMAGE_OPS_BY_ID.get(operation, {}).get("refs") else None,
                        upscale=images.upscale_2x, should_stop=ctx.should_stop,
                        on_started=started.update,
                    )
                    commit(meta.get("credits") or credits, meta.get("generation_id"))
                except GenerationFailed as exc:
                    usage = (exc.body or {}).get("usage") or {}
                    if not usage.get("refunded"):
                        commit(usage.get("credits") or credits, started.get("id"))
                    raise
            dest = dest_dir / unique_name(stem, ".jpg")
            meta["watermark_removed"] = postprocess(raw, dest, images)
            meta.update({"attempts": attempt, "prompt_used": current})
            return dest, meta
        except (Cancelled, JobCancelled):
            raise
        except GenerationFailed as exc:
            last_error = exc
            if exc.is_policy and images.auto_fix_rejected and attempt < attempts:
                try:
                    current = llm_tasks.soften_prompt(fg, current, llm)
                    if on_prompt_fixed:
                        on_prompt_fixed(current)
                except ApiError as llm_exc:
                    log.warning("prompt softening failed: %s", llm_exc)
            time.sleep(2 * attempt)
        except ApiError as exc:
            last_error = exc
            if exc.status in (401, 403, 422):
                break  # configuration problem – retrying will not help
            time.sleep(5 * attempt)
        finally:
            (dest_dir / f"{stem}.raw").unlink(missing_ok=True)
    raise last_error or RuntimeError("не удалось сгенерировать изображение")


@register("images", "images", "Генерация изображений")
def images_job(ctx: JobContext) -> dict[str, Any]:
    only_ids = set(ctx.params.get("scene_ids") or [])
    force = bool(ctx.params.get("force"))
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        if tc.shares_images:
            raise JobError("Этот язык использует картинки основного языка — генерируйте их там.")
        scenes = [s for s in tc.track.scenes if (s.id in only_ids) or
                  (not only_ids and (force or s.image_status != "done" or not s.image_file))]
        no_prompt = [s.idx + 1 for s in scenes if not s.prompt.strip()]
        scenes = [s for s in scenes if s.prompt.strip()]
        if no_prompt and not scenes:
            raise JobError(f"У сцен нет промптов (№ {', '.join(map(str, no_prompt[:15]))}"
                           f"{'…' if len(no_prompt) > 15 else ''}). Сначала создайте промпты.")
        images, llm = tc.settings.images, tc.settings.llm
        plan = plan_project(tc.project, images, limiter.hourly_budget())
        jobs = [(s.id, s.prompt, plan.ops.get(s.id, images.operation)) for s in scenes]
        cast = list(tc.project.characters) if images.character_refs else []
        # scene id → characters in it (only when the scene's model can take reference images)
        scene_cast = {s.id: chars.scene_character_ids(s, cast) for s in scenes} if cast else {}
        for s in scenes:
            s.image_status, s.image_error = "queued", None
        project_id, track_id = tc.project.id, tc.track.id
    if not jobs:
        return {"message": "Все изображения уже готовы"}
    track_changed(track_id, "images")

    out_dir = track_dir(project_id, track_id, "images")
    if any(scene_cast.values()):
        from .character_jobs import ensure_portraits  # noqa: PLC0415 – avoids an import cycle

        ensure_portraits(project_id, ctx)
    portraits: dict[int, tuple[str, str]] = {}
    if scene_cast:
        with session_scope() as db:
            for c in db.query(Character).filter(Character.project_id == project_id):
                if c.image_file and (uri := image_data_uri(c.image_file, 1024)):
                    portraits[c.id] = (c.name, uri)
    refs = reference_inputs(images, {op for _, _, op in jobs})

    def scene_inputs(scene_id: int, operation: str) -> tuple[list[str], str]:
        """Reference inputs and the note for one scene: its characters first, then the style refs."""
        if not chars.accepts_refs(operation):
            return refs, ""
        cast_here = [portraits[c] for c in scene_cast.get(scene_id, []) if c in portraits]
        inputs = [uri for _, uri in cast_here] + refs
        return inputs[:chars.MAX_INPUTS], chars.reference_note([name for name, _ in cast_here])

    by_op: dict[str, int] = {}
    for _, _, op in jobs:
        by_op[op] = by_op.get(op, 0) + 1
    done = failed = 0
    lock = threading.Lock()
    wait_msg = {"text": ""}

    def on_wait(msg: str) -> None:
        wait_msg["text"] = msg

    def work(scene_id: int, prompt: str, operation: str) -> None:
        nonlocal done, failed
        with session_scope() as db:
            sc = db.get(Scene, scene_id)
            if sc is None:
                return
            sc.image_status = "generating"
            scene_changed(track_id, scene_to_dict(sc))

        def prompt_fixed(new_prompt: str) -> None:
            with session_scope() as db:
                sc = db.get(Scene, scene_id)
                if sc:
                    sc.image_meta = {**(sc.image_meta or {}), "original_prompt": prompt}
                    sc.prompt = new_prompt

        try:
            inputs, note = scene_inputs(scene_id, operation)
            with FastgenClient() as fg:
                path, meta = generate_one(fg, prompt, out_dir, f"scene_{scene_id}", images, llm, inputs, ctx,
                                          on_wait=on_wait, operation=operation, on_prompt_fixed=prompt_fixed,
                                          note=note)
            if note:
                meta["characters"] = scene_cast.get(scene_id, [])
            with session_scope() as db:
                sc = db.get(Scene, scene_id)
                if sc is None:
                    path.unlink(missing_ok=True)
                    return
                old = to_abs(sc.image_file)
                sc.image_file, sc.image_status, sc.image_error = to_rel(path), "done", None
                sc.image_meta = {**(sc.image_meta or {}), **meta, "generated_at": time.time()}
                scene_changed(track_id, scene_to_dict(sc))
            if old and old.exists() and old != path:
                old.unlink(missing_ok=True)
            with lock:
                done += 1
        except (Cancelled, JobCancelled):
            with session_scope() as db:
                sc = db.get(Scene, scene_id)
                if sc and sc.image_status in ("queued", "generating"):
                    sc.image_status = "done" if sc.image_file else "none"
                    scene_changed(track_id, scene_to_dict(sc))
        except Exception as exc:  # noqa: BLE001 – record per-scene failures, continue with others
            with session_scope() as db:
                sc = db.get(Scene, scene_id)
                if sc:
                    sc.image_status = "failed" if not sc.image_file else "done"
                    sc.image_error = str(exc)[:500]
                    scene_changed(track_id, scene_to_dict(sc))
            with lock:
                failed += 1

    workers = max(1, limiter.status()["threads"])
    with ThreadPoolExecutor(max_workers=workers) as pool:
        pending = {pool.submit(work, sid, prompt, op) for sid, prompt, op in jobs}
        while pending:
            # Wake up regularly so the status line stays fresh while workers wait for budget.
            _, pending = wait(pending, timeout=3, return_when=FIRST_COMPLETED)
            msg = f"Готово {done}/{len(jobs)}" + (f", ошибок {failed}" if failed else "")
            if wait_msg["text"] and limiter.waiting:
                msg += f" · {wait_msg['text']}"
            ctx.progress((done + failed) / len(jobs), msg)
    if ctx.should_stop():
        return {"message": f"Остановлено: готово {done}"}
    track_changed(track_id, "images")
    if failed and not done:
        raise JobError(f"Не удалось создать ни одного изображения ({failed} ошибок). Подробности — в карточках сцен.")
    return {"message": f"Изображений: {done}" + (f", ошибок: {failed} (можно перезапустить)" if failed else "")
            + (f", пропущено без промпта: {len(no_prompt)}" if no_prompt else "")
            + (" (" + ", ".join(f"{IMAGE_OPS_BY_ID.get(op, {}).get('name', op)}: {n}" for op, n in by_op.items()) + ")"
               if len(by_op) > 1 else "")}


# ------------------------------------------------------------------------ thumbnails
@register("thumbnails", "images", "Превью (обложки)")
def thumbnails_job(ctx: JobContext) -> dict[str, Any]:
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        concepts = (tc.track.publish_meta or {}).get("thumbnails") or []
        if not concepts:
            raise JobError("Сначала сгенерируйте метаданные — в них есть идеи для обложек.")
        pub, images, llm = tc.settings.publish, tc.settings.images, tc.settings.llm
        project_id, track_id = tc.project.id, tc.track.id
    out_dir = track_dir(project_id, track_id, "thumbs")
    thumb_images = images.model_copy(update={
        "style_prompt": pub.thumbnail_style,
        "avoid": "watermark, logo, signature, blurry, low quality" + ("" if pub.thumbnail_text else ", text, letters"),
        "upscale_2x": False,
    })
    results: list[str] = []
    with FastgenClient() as fg:
        for k, concept in enumerate(concepts[: pub.thumbnail_count]):
            ctx.progress(k / max(1, pub.thumbnail_count), f"Обложка {k + 1}")
            prompt = concept["prompt"]
            if pub.thumbnail_text and concept.get("headline"):
                prompt += (f'. Large bold readable headline text "{concept["headline"]}" with strong contrast, '
                           "placed on the side, not covering the main subject")
            path, _ = generate_one(fg, prompt, out_dir, f"thumb_src_{k}", thumb_images, llm, [], ctx,
                                   operation=pub.thumbnail_operation)
            final = make_thumbnail(path, out_dir / unique_name(f"thumb_{k}", ".jpg"))
            path.unlink(missing_ok=True)
            results.append(to_rel(final))
    with session_scope() as db:
        t = db.get(Track, track_id)
        for old in t.thumbnails or []:
            p = to_abs(old)
            if p and p.exists() and old not in results:
                p.unlink(missing_ok=True)
        t.thumbnails = results
    track_changed(track_id, "thumbnails")
    return {"message": f"Обложек: {len(results)}"}



# ------------------------------------------------------------------------ watermark clean-up
@register("watermarks", "misc", "Удаление водяных знаков")
def watermarks_job(ctx: JobContext) -> dict[str, Any]:
    """Check the track's ready images for the Gemini sparkle and clean them in place."""
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        if tc.shares_images:
            raise JobError("Этот язык использует картинки основного языка — очистите их там.")
        items = [(s.id, s.image_file) for s in tc.track.scenes if s.image_file]
        method = _watermark_method(tc.settings.images)
        track_id = tc.track.id
    if method == "none":
        raise JobError("Удаление водяных знаков выключено в настройках изображений.")
    cleaned = 0
    for k, (scene_id, rel) in enumerate(items):
        ctx.check()
        ctx.progress(k / max(1, len(items)), f"Проверено {k}/{len(items)}, очищено {cleaned}")
        path = to_abs(rel)
        if not path or not path.exists():
            continue
        img, removed = remove_watermark(imread(path), method)
        if not removed:
            continue
        imwrite(path, img, quality=95)
        cleaned += 1
        with session_scope() as db:
            sc = db.get(Scene, scene_id)
            if sc:
                sc.image_meta = {**(sc.image_meta or {}), "watermark_removed": True}
                scene_changed(track_id, scene_to_dict(sc))
    track_changed(track_id, "images")
    if not cleaned:
        return {"message": f"Проверено {len(items)} картинок — водяных знаков нет"}
    return {"message": f"Водяной знак удалён с {cleaned} из {len(items)} картинок. Соберите видео заново, "
                       "чтобы изменения попали в ролик."}
