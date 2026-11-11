"""One durable image queue consumed concurrently by FastGen and Inflight.

Only unsubmitted work may move between services. Accepted IDs and ambiguous
submissions stay with their provider, including after a restart.
"""
from __future__ import annotations

import hashlib
import time
from concurrent.futures import ThreadPoolExecutor
import httpx

from sqlalchemy import select

from ..db import session_scope
from ..models import FastgenUsage, MediaGeneration, Scene
from ..motion.store import motion_scene_idxs
from ..pipeline.characters import mentioned
from ..pipeline.footage import wants_video, wants_still, uses_first_frame, scene_first_frame
from ..pipeline.image_plan import plan_project
from ..pipeline.video_prompts import signature
from ..services.fastgen import FastgenClient, IMAGE_OPS_BY_ID, image_credits, GenerationFailed
from ..services.inflight import InflightClient, FINAL, encode_image
from ..services import inflight_queue as queue
from ..services.limiter import limiter, LimitReached, Cancelled, is_limit_error
from ..services.http import ApiError
from ..settings_store import load_config
from ..storage import to_abs, to_rel, track_dir
from .common import load_track, scene_to_dict
from .events import scene_changed, track_changed
from .runner import JobCancelled, JobError

_WORKING: set[int] = set()  # guarded by queue.ADMISSION, across bulk and selected-scene jobs


def fastgen_compatible(payload):
    operation = IMAGE_OPS_BY_ID.get(payload.get("_operation"), {})
    refs = payload.get("references") or []
    return bool(operation) and (not refs or bool(operation.get("refs"))) and len(refs) <= 6


def resolved_payload(db, payload):
    """Freeze the previous frame only after its producer, on either service, finishes."""
    out = dict(payload)
    previous_id = out.pop("previous_scene_id", None)
    change = out.pop("continuity_change", "")
    if previous_id:
        previous = db.get(Scene, previous_id)
        if previous is None or previous.image_status == "failed":
            raise JobError("Не создан предыдущий кадр для продолжения сцены")
        if previous.image_status in ("queued", "generating"):
            return None
        if not previous.image_file:
            raise JobError("Сначала создайте предыдущий кадр для продолжения сцены")
        out["references"] = [{"name": "REF_PREVIOUS", "path": previous.image_file}] + list(out.get("references") or [])
        out["prompt"] = ("Continue REF_PREVIOUS, preserve the setting and identity. Change only: " +
                         str(change or "the action described below") + ". " + out["prompt"])
        out["_continued_from"] = previous_id
    return out


def hybrid_images(ctx, *, first_frames=False, skip_scene_ids=None):
    from .footage_jobs import wait_for_inputs, image_payload
    from .video_prompt_jobs import ensure_routes
    wait_for_inputs(ctx)
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        videos_on = tc.settings.videos.mode != "off" and not tc.shares_images
    if videos_on:
        ensure_routes(ctx.track_id, ctx.check, ctx.progress)  # which scenes are stills, which need a first frame
    cfg = load_config()
    if not (cfg.fastgen_api_key.strip() or cfg.inflight_api_key.strip()):
        raise JobError("Укажите ключ FastGen или Inflight для совместной генерации картинок")
    retry_failed = bool(ctx.params.get("retry_failed"))
    force = bool(ctx.params.get("force")) and not ctx.params.get("missing_only") and not first_frames
    only = set(ctx.params.get("scene_ids") or [])
    targets, frames = [], set()
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        if tc.shares_images:
            raise JobError("Картинки и первые кадры создаются в основном языке")
        skip = motion_scene_idxs(tc.track.motion)
        for sc in tc.track.scenes:
            if sc.idx in skip or sc.id in (skip_scene_ids or set()) or only and sc.id not in only:
                continue
            is_frame = uses_first_frame(sc, tc.settings) and (wants_video(sc, tc.settings) or first_frames and bool(only))
            if first_frames:
                if not is_frame or sc.video_file and not ctx.params.get("force"):
                    continue
            elif not only and not wants_still(sc, tc.settings):
                continue
            existing = scene_first_frame(sc) if is_frame else sc.image_file
            if existing and not force and not (retry_failed and sc.image_status == "failed"):
                continue
            if not sc.prompt.strip():
                raise JobError(f"У сцены {sc.idx + 1} нет промпта кадра")
            targets.append(sc.id)
            if is_frame:
                frames.add(sc.id)
        if not targets:
            return {"message": "Все выбранные изображения уже готовы"}
        project_id, track_id = tc.project.id, tc.track.id
        cast = list(tc.project.characters)
        needed = {cid for sc in tc.track.scenes if sc.id in targets
                  and (tc.settings.videos.character_refs if sc.id in frames else tc.settings.images.character_refs)
                  for cid in (sc.characters if sc.characters is not None else mentioned(sc.prompt, cast))}
    if needed:
        from .character_jobs import ensure_portraits
        ensure_portraits(project_id, ctx, only=needed, provider="both")
    ids, owners = [], {}
    with queue.ADMISSION, session_scope() as db:
        tc = load_track(db, track_id)
        settings = tc.settings
        plan = plan_project(tc.project, settings.images, limiter.hourly_budget())
        for sc in tc.track.scenes:
            if sc.id not in targets:
                continue
            mode, payload = image_payload(sc, tc, first_frame=sc.id in frames)
            operation = plan.ops.get(sc.id, settings.images.operation)
            key = signature({"request": payload, "operation": operation, "upscale": settings.images.upscale_2x})
            owner = f"scene:{sc.id}:{'frame' if sc.id in frames else 'image'}"
            row = db.scalar(select(MediaGeneration).where(MediaGeneration.owner == owner)
                            .order_by(MediaGeneration.id.desc()))
            # Older versions kept FastGen's terminal expiry response as accepted.
            # Keep that ID in history, but allow an explicit retry to create a new task.
            if row and retry_failed and row.provider == "fastgen" and row.state in ("accepted", "running") and "not found or expired" in (row.error or "").lower():
                row.state = "failed"
            same = row and (row.payload.get("_input_key") == key or
                            {k: v for k, v in row.payload.items() if not k.startswith("_")} == payload)
            reusable = row and (row.state in queue.ACTIVE or row.state == "queued" or
                row.state in FINAL and (row.payload.get("_hybrid_job") == ctx.job_id or
                                       (row.state == "ready" or row.state == "declined" and not retry_failed) and not force and same))
            if not reusable:
                row = MediaGeneration(owner=owner, account="", provider="pending", kind="image", mode=mode,
                    state="queued", payload={**payload, "_operation": operation, "_input_key": key,
                        "_hybrid_job": ctx.job_id, "_upscale": settings.images.upscale_2x})
                db.add(row); db.flush()
            elif row.state == "queued" and not row.remote_id and row.id not in _WORKING:
                # Safe to update/reroute only work which has never been accepted.
                row.provider, row.account = "pending", ""
                row.payload = {**payload, "_operation": operation, "_input_key": key,
                               "_hybrid_job": ctx.job_id, "_upscale": settings.images.upscale_2x}
            ids.append(row.id); owners[row.id] = sc.id
            sc.image_status, sc.image_error = "queued", None
    return HybridRun(ctx, cfg, settings, ids, owners, project_id, track_id).run()


class HybridRun:
    def __init__(self, ctx, cfg, settings, ids, owners, project_id, track_id):
        self.ctx, self.cfg, self.settings = ctx, cfg, settings
        self.ids, self.owners = ids, owners
        self.project_id, self.track_id = project_id, track_id
        self.fg_account = hashlib.sha256(("fastgen:" + cfg.fastgen_api_key.strip()).encode()).hexdigest()
        self.inf_account = hashlib.sha256(cfg.inflight_api_key.strip().encode()).hexdigest()
        self.done, self.paused = set(), set()
        self.disabled = set()
        if not cfg.fastgen_api_key.strip(): self.disabled.add("fastgen")
        if not cfg.inflight_api_key.strip(): self.disabled.add("inflight")
        self.inf_usage, self.inf_checked = {}, 0.
        self.inf_backoff = 0.
        self.futures = {}
        self.counts = {"fastgen": 0, "inflight": 0}

    def rows(self):
        with session_scope() as db:
            return db.scalars(select(MediaGeneration).where(MediaGeneration.id.in_(self.ids))
                              .order_by(MediaGeneration.id)).all()

    def set_row(self, rid, **values):
        with queue.ADMISSION, session_scope() as db:
            row = db.get(MediaGeneration, rid)
            for key, value in values.items(): setattr(row, key, value)

    def record_credit(self, amount, ref):
        if not amount: return
        with queue.ADMISSION, session_scope() as db:
            if not db.scalar(select(FastgenUsage.id).where(FastgenUsage.operation == "image", FastgenUsage.generation_id == ref)):
                db.add(FastgenUsage(ts=time.time(), operation="image", credits=int(amount), generation_id=ref))

    def fastgen(self, rid):
        remote, submitted = None, False
        operation, credits = "", 0
        try:
            with session_scope() as db:
                row = db.get(MediaGeneration, rid)
                payload, remote, provider, state = dict(row.payload), row.remote_id, row.provider, row.state
            operation = payload.get("_operation") or self.settings.images.operation
            credits = image_credits(operation, payload.get("_upscale", False))
            if provider == "fastgen" and state == "submitting" and not remote:
                self.set_row(rid, state="unknown", error="Отправка FastGen не подтверждена; повторная генерация остановлена")
                return
            if provider == "fastgen" and remote:
                if row.account != self.fg_account:
                    raise JobError("Для возобновления принятого задания нужен исходный ключ FastGen")
                self.finish_fastgen(rid, remote, operation)
                return
            with limiter.slot(credits, should_stop=self.ctx.should_stop, wait=False):
                with queue.ADMISSION, session_scope() as db:
                    row = db.get(MediaGeneration, rid)
                    if row.provider != "pending" or row.state != "queued": return
                    payload = resolved_payload(db, row.payload)
                    if payload is None or not fastgen_compatible(payload): return
                    row.provider, row.account, row.state = "fastgen", self.fg_account, "submitting"
                    row.payload, row.submitted_at, row.attempts = payload, time.time(), row.attempts + 1
                inputs = [{"name": r["name"], "input": "data:image/jpeg;base64," + encode_image(r["path"])["image_base64"]}
                          for r in payload.get("references") or []]
                body = {"operation": operation, "prompt": payload["prompt"], "aspect_ratio": payload.get("aspect_ratio", "16:9")}
                if inputs: body["inputs"] = inputs
                if payload.get("_upscale") and IMAGE_OPS_BY_ID[operation].get("upscale"):
                    body["generation_config"] = {"upscale": {"type": "2x"}}
                with FastgenClient(api_key=self.cfg.fastgen_api_key.strip()) as client:
                    submitted = True
                    accepted = client.start(body, attempts=1)
                remote = str(accepted["id"])
                self.set_row(rid, remote_id=remote, state="accepted", result=accepted)
                self.finish_fastgen(rid, remote, operation)
        except LimitReached:
            return  # no submission: the other service may claim this scene
        except (Cancelled, JobCancelled):
            if remote: self.record_credit(credits, remote)
            raise
        except GenerationFailed as exc:
            usage = exc.body.get("usage") or {}
            if not usage.get("refunded"): self.record_credit(usage.get("credits") or credits, remote)
            self.set_row(rid, state="declined" if exc.is_policy else "failed", error=exc.message)
        except ApiError as exc:
            if remote:
                self.record_credit(credits, remote)
                terminal = exc.status in (404, 410)
                self.set_row(rid, remote_id=remote, state="failed" if terminal else "accepted", error=exc.message)
                if not terminal: self.paused.add(rid)
            elif 400 <= exc.status < 500 and exc.status != 408 and (is_limit_error(exc) or exc.status in (401, 403)):
                self.set_row(rid, provider="pending", account="", state="queued", submitted_at=None, error=exc.message)
                if exc.status in (401, 403): self.disabled.add("fastgen")
                else: limiter.block()
            else:
                ambiguous = submitted and (exc.status == 0 or exc.status >= 500 or exc.status == 408)
                self.set_row(rid, state="unknown" if ambiguous else "failed", error=exc.message)
                if ambiguous:
                    self.record_credit(credits, f"unknown-hybrid-{rid}")
                    self.disabled.add("fastgen")
        except Exception as exc:
            if remote:
                self.record_credit(credits, remote)
                self.set_row(rid, remote_id=remote, state="accepted", error=str(exc)[:500]); self.paused.add(rid)
            else:
                self.set_row(rid, state="unknown" if submitted else "failed", error=str(exc)[:500])
        finally:
            with queue.ADMISSION: _WORKING.discard(rid)

    def finish_fastgen(self, rid, remote, operation):
        from .image_jobs import postprocess
        folder = track_dir(self.project_id, self.track_id, "images")
        raw, dest = folder / f"hybrid_{rid}.raw", folder / f"hybrid_{rid}.jpg"
        try:
            with FastgenClient(api_key=self.cfg.fastgen_api_key.strip()) as client:
                meta = client.finish_image(remote, raw, operation=operation, should_stop=self.ctx.should_stop)
            removed = postprocess(raw, dest, self.settings.images)
            self.record_credit(meta.get("credits") or image_credits(operation, self.settings.images.upscale_2x), remote)
            self.set_row(rid, state="ready", file=to_rel(dest), result={**meta, "watermark_removed": removed, "watermark_v2": True}, error=None)
        finally:
            raw.unlink(missing_ok=True)

    def save(self, row):
        if row.id in self.done: return
        if row.state == "ready" and not row.file and row.id not in self.paused: return
        with session_scope() as db:
            sc = db.get(Scene, self.owners[row.id])
            if sc:
                if row.state == "ready" and row.file:
                    sc.image_file, sc.image_status, sc.image_error = row.file, "done", None
                    sc.image_meta = {**row.result, "provider": row.provider, "hybrid": True, "task_id": row.remote_id,
                        "operation": row.payload.get("_operation") if row.provider == "fastgen" else None,
                        "mode": row.mode, "prompt_used": row.payload.get("prompt"),
                        "server_mode": row.result.get("mode"), "request_audit": row.payload.get("_request_audit"),
                        "references": row.payload.get("references", []), "continued_from": row.payload.get("_continued_from"),
                        "generated_at": time.time()}
                    self.counts[row.provider] += 1
                else:
                    sc.image_status, sc.image_error = "failed", row.error or f"{row.provider}: {row.state}"
                scene_changed(self.track_id, scene_to_dict(sc))
        self.done.add(row.id)
        track_changed(self.track_id, "images")

    def ready(self, rows):
        out = []
        with queue.ADMISSION, session_scope() as db:
            for item in rows:
                if item.id in self.done or item.id in self.futures or item.provider != "pending" or item.state != "queued": continue
                try:
                    payload = resolved_payload(db, item.payload)
                except JobError as exc:
                    row = db.get(MediaGeneration, item.id); row.state, row.error = "failed", str(exc)
                    continue
                if payload is not None: out.append((item, payload))
        return out

    def run(self):
        client = InflightClient(self.cfg) if "inflight" not in self.disabled else None
        try:
            with ThreadPoolExecutor(max_workers=max(1, self.cfg.fastgen_image_threads)) as pool:
                while len(self.done) < len(self.ids):
                    self.ctx.check()
                    for rid, future in list(self.futures.items()):
                        if future.done():
                            future.result(); del self.futures[rid]
                    rows = self.rows()
                    for row in rows:
                        if row.provider == "inflight" and row.state == "submitting" and not row.remote_id:
                            # Another job may still be recording its response under ADMISSION.
                            with queue.ADMISSION, session_scope() as db:
                                fresh = db.get(MediaGeneration, row.id)
                                if fresh.state == "submitting" and not fresh.remote_id:
                                    fresh.state, fresh.error = "unknown", "Отправка Inflight не подтверждена; повторная генерация остановлена"
                                    self.paused.add(row.id)
                        if row.provider == "inflight" and (row.state not in FINAL or row.state == "ready" and not row.file) and (
                                not client or row.account != self.inf_account):
                            self.set_row(row.id, error="Для возобновления принятого задания нужен исходный ключ Inflight")
                            self.paused.add(row.id)
                    inflight_ids = [r.id for r in rows if r.provider == "inflight" and r.id not in self.done and r.id not in self.paused]
                    if client and inflight_ids:
                        try:
                            queue.poll(client, inflight_ids); queue.collect(client, inflight_ids)
                        except (ApiError, httpx.HTTPError, ValueError, RuntimeError) as exc:
                            # Accepted work stays with its provider; unclaimed scenes can use FastGen.
                            for rid in inflight_ids:
                                self.set_row(rid, error=exc.message if isinstance(exc, ApiError) else "Не удалось скачать существующий результат Inflight")
                                self.paused.add(rid)
                            self.disabled.add("inflight")
                    rows = self.rows()
                    for row in rows:
                        if row.id in self.paused or row.state == "unknown":
                            self.paused.add(row.id); self.save(row)
                        elif row.state in FINAL:
                            self.save(row)
                        elif row.provider == "fastgen" and row.id not in self.futures:
                            with queue.ADMISSION:
                                if row.id not in _WORKING:
                                    _WORKING.add(row.id)
                                    self.futures[row.id] = pool.submit(self.fastgen, row.id)
                    available = self.ready(rows)
                    fg_status = limiter.status() if "fastgen" not in self.disabled else {}
                    fg_free = ("fastgen" not in self.disabled and fg_status.get("used", 0) < fg_status.get("budget", 0)
                               and fg_status.get("active", 0) < fg_status.get("threads", self.cfg.fastgen_image_threads)
                               and len(self.futures) < self.cfg.fastgen_image_threads)
                    # Start FastGen workers before doing any potentially slow Inflight HTTP request.
                    if fg_free and available:
                        count = min(self.cfg.fastgen_image_threads - len(self.futures),
                                    max(1, len(available) // 2) if "inflight" not in self.disabled else len(available))
                        for row, payload in [p for p in available if fastgen_compatible(p[1])][:count]:
                            with queue.ADMISSION:
                                if row.id in _WORKING: continue
                                _WORKING.add(row.id)
                                self.futures[row.id] = pool.submit(self.fastgen, row.id)
                        available = self.ready(self.rows())
                    inf_free = 0
                    if client and "inflight" not in self.disabled and time.time() >= self.inf_backoff:
                        try:
                            if time.time() - self.inf_checked >= 4:
                                self.inf_usage, self.inf_checked = client.usage(), time.time()
                            with session_scope() as db:
                                local = queue.local_remaining(db, client.account, self.cfg)
                                active = queue.active_counts(db, client.account)
                            inf_free = queue.capacity(self.inf_usage, local, "image", self.cfg.inflight_max_threads, active)
                        except ApiError:
                            self.disabled.add("inflight")
                    if available and inf_free:
                        eligible_fg = any(fastgen_compatible(payload) for _, payload in available)
                        count = min(inf_free, max(1, len(available) // 2) if fg_free and eligible_fg else len(available))
                        # Prefer Inflight for requests the chosen FastGen model cannot represent faithfully.
                        chosen = sorted(available, key=lambda pair: fastgen_compatible(pair[1]))[:count]
                        chosen_ids = []
                        with queue.ADMISSION, session_scope() as db:
                            for item, payload in chosen:
                                row = db.get(MediaGeneration, item.id)
                                if row.provider != "pending" or row.state != "queued" or row.id in _WORKING: continue
                                row.provider, row.account, row.payload = "inflight", client.account, payload
                                chosen_ids.append(row.id)
                        if chosen_ids:
                            try:
                                queue.admit(client, chosen_ids)
                            except (ApiError, ValueError, RuntimeError) as exc:
                                if isinstance(exc, ApiError) and (exc.status in (0, 401, 403, 408) or exc.status >= 500):
                                    self.disabled.add("inflight")
                                with queue.ADMISSION, session_scope() as db:
                                    for rid in chosen_ids:
                                        row = db.get(MediaGeneration, rid)
                                        if row.state == "queued" and not isinstance(exc, ApiError):
                                            row.state, row.error = "failed", str(exc)[:500]
                            with queue.ADMISSION, session_scope() as db:
                                for rid in chosen_ids:
                                    row = db.get(MediaGeneration, rid)
                                    if row.state == "queued" or row.state == "failed" and row.remote_id is None and "inflight" in self.disabled:
                                        row.provider, row.account, row.state = "pending", "", "queued"
                                        row.submitted_at = None
                                        self.inf_backoff = time.time() + 5
                    for row, payload in self.ready(self.rows()):
                        if not fg_free or len(self.futures) >= self.cfg.fastgen_image_threads: break
                        if not fastgen_compatible(payload): continue
                        with queue.ADMISSION:
                            if row.id in _WORKING: continue
                            _WORKING.add(row.id)
                            self.futures[row.id] = pool.submit(self.fastgen, row.id)
                    if len(self.disabled) == 2:
                        for row in self.rows():
                            if row.provider == "pending": self.set_row(row.id, state="failed", error="Оба сервиса недоступны: проверьте ключи и тарифы")
                    elif "inflight" in self.disabled:
                        for row, payload in self.ready(self.rows()):
                            if not fastgen_compatible(payload):
                                self.set_row(row.id, state="failed", error="Модель FastGen не поддерживает эти референсы; нужен доступный Inflight")
                    active = bool(self.futures) or any(r.state in ("accepted", "running", "submitting") and r.id not in self.done for r in self.rows())
                    self.ctx.set_idle(not active)
                    self.ctx.progress(len(self.done) / len(self.ids),
                        f"Готово {len(self.done)}/{len(self.ids)} · FastGen: {self.counts['fastgen']} · Inflight: {self.counts['inflight']}")
                    if len(self.done) < len(self.ids):
                        for _ in range(20): self.ctx.check(); time.sleep(.1)
        finally:
            if client: client.__exit__(None, None, None)
            self.ctx.set_idle(False)
        failed = len(self.done) - sum(self.counts.values())
        if failed:
            raise JobError(f"Совместная генерация: готовы {sum(self.counts.values())}/{len(self.ids)}, ошибок {failed}. Подробности — в сценах; принятые ID сохранены.")
        return {"message": f"Картинок: {len(self.ids)} · FastGen: {self.counts['fastgen']} · Inflight: {self.counts['inflight']}", "providers": self.counts}
