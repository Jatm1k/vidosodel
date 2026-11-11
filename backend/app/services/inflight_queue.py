"""Persistent local queue, batched admission/polling and per-UTC-day ceilings.

The admission lock covers all callers (scene footage, images, portraits and
thumbnails). Remote usage accounts for other applications sharing the key.
"""
from __future__ import annotations

import threading
import time
import base64
import hashlib
from datetime import datetime, timezone

import httpx
from sqlalchemy import select

from ..db import session_scope
from ..models import MediaGeneration, Scene
from ..settings_store import load_config
from ..storage import media_root, to_rel
from .http import ApiError
from .inflight import FINAL, MODES, InflightClient, wire_payload

ADMISSION = threading.RLock()
POLL_LOCK = threading.Lock()
COLLECT_LOCK = threading.Lock()
_LAST_POLL: dict[str, float] = {}
_BATCH_LIMIT: dict[tuple[str, str], int] = {}
ACTIVE = ("submitting", "accepted", "running", "unknown")


def enqueue(client, owner: str, kind: str, mode: str, payload: dict, *, force=False, retry_failed=False) -> int:
    with ADMISSION, session_scope() as db:
        old = db.scalar(select(MediaGeneration).where(MediaGeneration.owner == owner,
            MediaGeneration.account == client.account).order_by(MediaGeneration.id.desc()))
        if old and old.state == "queued":
            old.payload, old.kind, old.mode, old.error = payload, kind, mode, None
            return old.id
        same = old and {k: v for k, v in old.payload.items() if k != "_request_audit"} == payload
        if old and (old.state not in FINAL or (not force and (old.state == "ready" or old.state == "declined" and not retry_failed) and same)):
            return old.id
        row = MediaGeneration(owner=owner, account=client.account, kind=kind, mode=mode,
                              payload=payload, state="queued")
        db.add(row)
        db.flush()
        return row.id


def local_remaining(db, account, cfg, now=None):
    now = now or time.time()
    day = datetime.fromtimestamp(now, timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    rows = db.scalars(select(MediaGeneration).where(MediaGeneration.account == account,
                     MediaGeneration.submitted_at >= day)).all()
    return {kind: max(0, limit - sum(1 for r in rows if r.kind == kind or r.mode == "im2v"))
            for kind, limit in (("video", cfg.inflight_video_daily), ("image", cfg.inflight_image_daily))}


def active_counts(db, account):
    rows = db.scalars(select(MediaGeneration).where(MediaGeneration.account == account,
        MediaGeneration.provider == "inflight", MediaGeneration.state.in_(ACTIVE))).all()
    return {"shared": len(rows), **{kind: sum(r.kind == kind or r.mode == "im2v" for r in rows)
                                   for kind in ("image", "video")}}


def capacity(usage, local, kind, limit, active=0, composite=False):
    if usage.get("expired"):
        raise ApiError("Inflight", 402, "Тариф Inflight истёк")
    pools = [kind] if not composite else ["image", "video"]
    active = active if isinstance(active, dict) else {"shared": active, "image": active, "video": active}
    if usage.get("plan") == "parallel":
        values = [max(0, limit - max(int((usage.get(pool) or {}).get("busy", 0)), active[pool])) for pool in pools]
    else:
        busy = max(int((usage.get(k) or {}).get("busy", 0)) for k in ("image", "video"))
        values = [max(0, limit - max(busy, active["shared"]))]
    for pool in pools:
        data = usage.get(pool) or {}
        values += [int(data.get("free", 0)), int(data.get("left", 0)), local[pool]]
    return max(0, min(values))


def admit(client, ids):
    # Fill the available slots, keeping each paid request independently durable.
    # Reference jobs cannot safely use the server's generic batch endpoint.
    with ADMISSION:
        for _ in range(12):
            if not _admit(client, ids):
                break


def mode_error(expected, result):
    actual = result.get("mode")
    if actual and actual != expected:
        return (f"Inflight принял режим {actual} вместо {expected}. Референсы/первый кадр не подтверждены; "
                "результат не применён. ID сохранён, автоматическая повторная генерация остановлена.")
    return None


def _admit(client, ids):
    cfg = load_config()
    with ADMISSION:
        usage = client.usage()
        with session_scope() as db:
            # A crash between submission and recording its response is ambiguous.
            unknown = db.scalars(select(MediaGeneration).where(MediaGeneration.account == client.account,
                                     MediaGeneration.state.in_(("submitting", "unknown")),
                                     MediaGeneration.id.in_(ids))).all()
            if unknown:
                raise RuntimeError("Есть задание с неизвестным результатом отправки. Укажите его ID из сервиса "
                                   "в списке заданий Inflight; автоматическая повторная отправка остановлена.")
            active = active_counts(db, client.account)
            local = local_remaining(db, client.account, cfg)
            pending = db.scalars(select(MediaGeneration).where(MediaGeneration.id.in_(ids), MediaGeneration.account == client.account,
                                      MediaGeneration.provider == "inflight", MediaGeneration.state == "queued").order_by(MediaGeneration.id)).all()
            ready_payloads = {}
            for row in pending:
                payload = dict(row.payload)
                previous_id = payload.get("previous_scene_id")
                if previous_id:
                    previous = db.get(Scene, previous_id)
                    if previous is None or previous.image_status == "failed":
                        raise RuntimeError("Не создан предыдущий кадр для продолжения сцены")
                    if previous.image_status in ("queued", "generating"):
                        continue
                    if not previous.image_file:
                        raise RuntimeError("Сначала создайте предыдущий кадр для продолжения сцены")
                    payload["references"] = [{"name": "REF_PREVIOUS", "path": previous.image_file}] + list(payload.get("references") or [])
                    payload["prompt"] = ("Continue REF_PREVIOUS, preserve the setting and identity. Change only: "
                        + str(payload.get("continuity_change") or "the action described below") + ". " + payload["prompt"])
                ready_payloads[row.id] = payload
            pending = [r for r in pending if r.id in ready_payloads]
            if not pending:
                return
            first = pending[0]
            n = capacity(usage, local, first.kind, cfg.inflight_threads, active, first.mode == "im2v")
            if first.kind == "image" and usage.get("plan") != "parallel":
                # A completed first frame must not sit behind the next image batch.
                waiting_video = db.scalars(select(MediaGeneration.id).where(MediaGeneration.account == client.account,
                    MediaGeneration.provider == "inflight", MediaGeneration.kind == "video", MediaGeneration.state == "queued")).all()
                if capacity(usage, local, "video", cfg.inflight_threads, active):
                    n = max(0, n - len(waiting_video))
            if not n:
                return
            chosen = [r for r in pending if r.kind == first.kind and r.mode in ("t2i", "t2v")] if first.mode in ("t2i", "t2v") else [first]
            chosen = chosen[:min(n, _BATCH_LIMIT.get((client.account, first.kind), 12))]
            tasks = []
            for r in chosen:
                # Validate/encode before marking any request as submitted.
                body = wire_payload(r.mode, ready_payloads[r.id])
                body["client_ref"] = f"vidosodel-{r.id}"
                tasks.append({"mode": r.mode, "body": body})
                refs = body.get("reference_images") or []
                r.payload = {**r.payload, "_request_audit": {"mode": r.mode,
                    "endpoint": MODES[r.mode] if len(chosen) == 1 else "/jobs",
                    "references": [{"name": ref.get("name"), "mime": ref["mime"],
                        "bytes": len(base64.b64decode(ref["image_base64"])),
                        "sha256": hashlib.sha256(base64.b64decode(ref["image_base64"])).hexdigest()} for ref in refs]}}
            chosen_ids = [r.id for r in chosen]
            kind = first.kind
            for r in chosen:
                r.state, r.submitted_at = "submitting", time.time()
                r.attempts += 1
        try:
            results = client.submit(kind, tasks)
            by_ref = {r.get("client_ref"): r for r in results}
            with session_scope() as db:
                for rid in chosen_ids:
                    r = db.get(MediaGeneration, rid)
                    result = by_ref.get(f"vidosodel-{rid}")
                    if result is None and len(chosen_ids) == 1 and len(results) == 1:
                        result = results[0]
                    if not result or not result.get("id"):
                        r.state, r.error = "unknown", "API не вернул ID принятого задания"
                    else:
                        r.remote_id, r.state, r.result = str(result["id"]), result.get("state", "accepted"), result
                        if error := mode_error(r.mode, result):
                            r.state, r.error = "failed", error
            return True
        except ApiError as exc:
            definite = 400 <= exc.status < 500 and exc.status != 408
            split = len(chosen_ids) > 1 and (exc.status == 413 or exc.body.get("code") == "LIST_OVER_SLOTS")
            if split:
                _BATCH_LIMIT[(client.account, kind)] = max(1, len(chosen_ids) // 2)
            wait = split or exc.body.get("code") in ("SLOTS_BUSY", "DAILY_QUOTA", "QUOTA_EXHAUSTED", "TOO_MANY_REQUESTS")
            with session_scope() as db:
                for rid in chosen_ids:
                    r = db.get(MediaGeneration, rid)
                    r.state = "queued" if wait else ("failed" if definite else "unknown")
                    r.error = exc.message
                    if definite:
                        r.submitted_at = None
            if not wait:
                raise
        except Exception:
            with session_scope() as db:
                for rid in chosen_ids:
                    db.get(MediaGeneration, rid).state = "unknown"
            raise


def poll(client, ids):
    # Coalesce polling across all callers, including portraits/thumbnails.
    with POLL_LOCK:
        if time.monotonic() - _LAST_POLL.get(client.account, 0) < 3.5:
            return
        with session_scope() as db:
            rows = db.scalars(select(MediaGeneration).where(MediaGeneration.account == client.account,
                              MediaGeneration.state.in_(("accepted", "running")))).all()
            remote = {r.remote_id: r.id for r in rows if r.remote_id}
        for offset in range(0, len(remote), 200):
            for result in client.poll(list(remote)[offset:offset + 200]):
                rid = remote.get(str(result.get("id")))
                if rid:
                    with session_scope() as db:
                        row = db.get(MediaGeneration, rid)
                        if row.state == "cancelled":
                            continue
                        row.state, row.result = result.get("state", row.state), result
                        row.error = str(result.get("error") or result.get("error_code") or "") or None
                        if error := mode_error(row.mode, result):
                            row.state, row.error = "failed", error
        _LAST_POLL[client.account] = time.monotonic()


def collect(client, ids):
    with COLLECT_LOCK:
        _collect(client, ids)


def _collect(client, ids):
    with session_scope() as db:
        rows = db.scalars(select(MediaGeneration).where(MediaGeneration.id.in_(ids), MediaGeneration.account == client.account,
                          MediaGeneration.provider == "inflight", MediaGeneration.state == "ready")).all()
    out_dir = media_root() / "inflight"
    out_dir.mkdir(parents=True, exist_ok=True)
    for row in rows:
        if error := mode_error(row.mode, row.result):
            with session_scope() as db:
                fresh = db.get(MediaGeneration, row.id)
                fresh.state, fresh.error = "failed", error
            continue
        if row.file and (media_root() / row.file).is_file():
            continue
        url = row.result.get("url")
        if not url:
            # An accepted response may already say ready without its download fields.
            result = client.request("GET", "/tasks/" + row.remote_id)
            url = result.get("url")
            if not url:
                raise RuntimeError("Готовое задание не содержит ссылки на результат")
            row.result = result
        dest = out_dir / f"{row.id}{'.mp4' if row.kind == 'video' else '.jpg'}"
        client.download(url, dest)
        if row.mode == "im2v" and row.result.get("image_url"):
            image = out_dir / f"{row.id}_first.jpg"
            client.download(row.result["image_url"], image)
            row.result = {**row.result, "image_file": to_rel(image)}
        with session_scope() as db:
            fresh = db.get(MediaGeneration, row.id)
            fresh.file, fresh.result = to_rel(dest), row.result


def run(client, ids, ctx, on_ready=None):
    """Resume a set of durable tasks. Pending quota waits yield the job lane."""
    emitted = set()
    errors = 0
    while True:
        ctx.check()
        try:
            poll(client, ids)
            collect(client, ids)
            admit(client, ids)
            errors = 0
        except ApiError as exc:
            if exc.status not in (0, 408, 429, 500, 502, 503, 504):
                raise
            errors += 1
            if errors >= 15:
                raise
        except httpx.HTTPError:
            errors += 1
            if errors >= 15:
                raise
        with session_scope() as db:
            rows = db.scalars(select(MediaGeneration).where(MediaGeneration.id.in_(ids))).all()
        for row in rows:
            if row.id not in emitted and row.state in FINAL and (row.state != "ready" or row.file):
                if on_ready:
                    on_ready(row)
                emitted.add(row.id)
        if len(emitted) == len(ids):
            ctx.set_idle(False)
            return rows
        if any(r.state in ("unknown", "submitting") for r in rows):
            raise RuntimeError("Отправка не подтверждена. Привяжите ID задания в разделе Inflight; повторная генерация не отправлена.")
        ctx.set_idle(all(r.state == "queued" for r in rows))
        ctx.progress(len(emitted) / max(1, len(ids)),
                     f"Inflight: готово {len(emitted)}/{len(ids)} · ожидание генерации, слота или суточного лимита")
        for _ in range(40):
            ctx.check()
            time.sleep(.1)
