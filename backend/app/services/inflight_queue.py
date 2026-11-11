"""Persistent local queue, batched admission/polling and optional local ceilings.

The admission lock covers all callers (scene footage, images, portraits and
thumbnails). Remote usage accounts for other applications sharing the key.

Throughput: every admission round reads ``/account/usage`` once (its ``free`` already includes turbo hours),
fills every free slot in priority order (``_priority`` – the scene start, so the beginning of a video comes
first) and sends each kind as one all-or-nothing ``POST /jobs``. Reference and first-frame jobs are batched with
``image_role`` + ``images``; if the server ever reports a different mode for a batched job, role batching is
switched off for the key and those modes fall back to their own endpoints.
"""
from __future__ import annotations

import base64
import hashlib
import threading
import time
from datetime import datetime, timezone

import httpx
from sqlalchemy import func, select

from ..db import session_scope
from ..models import MediaGeneration, Scene
from ..settings_store import load_config
from ..storage import media_root, to_rel
from .http import ApiError
from .inflight import BATCH_BYTES, FINAL, MODES, body_bytes, wire_payload

ADMISSION = threading.RLock()
POLL_LOCK = threading.Lock()
COLLECT_LOCK = threading.Lock()
_LAST_POLL: dict[str, float] = {}
_BATCH_LIMIT: dict[tuple[str, str], int] = {}
#: Accounts whose server did not honour ``image_role`` in ``POST /jobs``.
_NO_ROLE_BATCH: set[str] = set()
ACTIVE = ("submitting", "accepted", "running", "unknown")
UNLIMITED = 10 ** 9
#: States that never consumed quota (refusals are free until the refusal limit is reached).
UNCHARGED = ("failed", "cancelled", "declined", "queued")


def enqueue(client, owner: str, kind: str, mode: str, payload: dict, *, force=False, retry_failed=False) -> int:
    with ADMISSION, session_scope() as db:
        old = db.scalar(select(MediaGeneration).where(MediaGeneration.owner == owner,
            MediaGeneration.account == client.account).order_by(MediaGeneration.id.desc()))
        if old and old.state == "queued":
            old.payload, old.kind, old.mode, old.error = payload, kind, mode, None
            return old.id
        clean = lambda p: {k: v for k, v in p.items() if k not in ("_request_audit", "_priority")}
        same = old and clean(old.payload) == clean(payload)
        if old and (old.state not in FINAL or (not force and (old.state == "ready" or old.state == "declined" and not retry_failed) and same)):
            return old.id
        row = MediaGeneration(owner=owner, account=client.account, kind=kind, mode=mode,
                              payload=payload, state="queued")
        db.add(row)
        db.flush()
        return row.id


def _ceilings(cfg):
    return {"video": cfg.inflight_video_daily or UNLIMITED, "image": cfg.inflight_image_daily or UNLIMITED}


def local_remaining(db, account, cfg, now=None):
    """Optional per-UTC-day ceilings set by the user (0 – only the tariff limits)."""
    now = now or time.time()
    day = datetime.fromtimestamp(now, timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    rows = db.scalars(select(MediaGeneration).where(MediaGeneration.account == account,
                     MediaGeneration.submitted_at >= day, MediaGeneration.state.notin_(UNCHARGED))).all()
    return {kind: max(0, limit - sum(1 for r in rows if r.kind == kind or r.mode == "im2v"))
            for kind, limit in _ceilings(cfg).items()}


def active_counts(db, account):
    rows = db.scalars(select(MediaGeneration).where(MediaGeneration.account == account,
        MediaGeneration.provider == "inflight", MediaGeneration.state.in_(ACTIVE))).all()
    return {"shared": len(rows), **{kind: sum(r.kind == kind or r.mode == "im2v" for r in rows)
                                   for kind in ("image", "video")}}


def capacity(usage, local, kind, limit=0, active=0, composite=False):
    """Jobs of ``kind`` that may start now. ``limit`` – the user's own thread cap (0 – all tariff slots)."""
    if usage.get("expired"):
        raise ApiError("Inflight", 402, "Тариф Inflight истёк")
    pools = [kind] if not composite else ["image", "video"]
    active = active if isinstance(active, dict) else {"shared": active, "image": active, "video": active}
    values = []
    # ``slots`` (turbo included) minus what is known to run – the server's view or our own, whichever is
    # larger – bounds a round even if ``free`` lags behind a submission made a moment ago.
    if usage.get("plan") == "parallel":
        for p in pools:
            data = usage.get(p) or {}
            running = max(int(data.get("busy", 0)), active[p])
            for bound in (int(data.get("slots") or 0), limit):
                if bound:
                    values.append(max(0, bound - running))
    else:
        pool = usage.get("pool") or {}
        if pool:
            values.append(int(pool.get("free", 0)))
            busy = int(pool.get("busy", 0))
            slots = int(pool.get("slots") or 0)
        else:
            busy = max(int((usage.get(k) or {}).get("busy", 0)) for k in ("image", "video"))
            slots = max(int((usage.get(k) or {}).get("slots") or 0) for k in ("image", "video"))
        for bound in (slots, limit):
            if bound:
                values.append(max(0, bound - max(busy, active["shared"])))
    for p in pools:
        data = usage.get(p) or {}
        values += [int(data.get("free", 0)), int(data.get("left", 0)), local[p]]
    return max(0, min(values))


def mode_error(expected, result):
    actual = (result or {}).get("mode")
    if actual and actual != expected:
        return (f"Inflight принял режим {actual} вместо {expected}. Референсы/первый кадр не подтверждены; "
                "результат не применён. ID сохранён, автоматическая повторная генерация остановлена.")
    return None


def _priority(row):
    return (float((row.payload or {}).get("_priority", UNLIMITED)), row.id)


def admit(client, ids):
    """Fill all free slots with the given queued tasks, highest priority first."""
    with ADMISSION:
        for _ in range(4):
            if not _admit(client, ids):
                break


def _resolve(db, row):
    """Payload ready to encode, or None while the previous frame it continues is still being made."""
    payload = dict(row.payload)
    previous_id = payload.get("previous_scene_id")
    if previous_id:
        previous = db.get(Scene, previous_id)
        if previous is None or previous.image_status == "failed":
            raise RuntimeError("Не создан предыдущий кадр для продолжения сцены")
        if previous.image_status in ("queued", "generating"):
            return None
        if not previous.image_file:
            raise RuntimeError("Сначала создайте предыдущий кадр для продолжения сцены")
        payload["references"] = [{"name": "REF_PREVIOUS", "path": previous.image_file}] + list(payload.get("references") or [])
        payload["prompt"] = ("Continue REF_PREVIOUS, preserve the setting and identity. Change only: "
            + str(payload.get("continuity_change") or "the action described below") + ". " + payload["prompt"])
    return payload


def _groups(client, usage, chosen):
    """Split chosen rows into submissions: im2v alone; each kind in batches within slot/byte limits."""
    out = []
    role_batch = client.account not in _NO_ROLE_BATCH
    for kind in ("video", "image"):
        rows = [(r, t) for r, t in chosen if r.kind == kind and r.mode != "im2v"]
        batchable = [(r, t) for r, t in rows if role_batch or r.mode in ("t2i", "t2v")]
        out += [[pair] for pair in rows if pair not in batchable]
        slots = int((usage.get("pool") or usage.get(kind) or {}).get("slots") or 0) or len(batchable)
        size = max(1, min(slots, _BATCH_LIMIT.get((client.account, kind), 200)))
        group, total = [], 0
        for pair in batchable:
            weight = body_bytes(pair[1]["body"])
            if group and (len(group) >= size or total + weight > BATCH_BYTES):
                out.append(group)
                group, total = [], 0
            group.append(pair)
            total += weight
        if group:
            out.append(group)
    out += [[(r, t)] for r, t in chosen if r.mode == "im2v"]
    return out


def _admit(client, ids):
    cfg = load_config()
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
        pending = sorted(db.scalars(select(MediaGeneration).where(MediaGeneration.id.in_(ids),
            MediaGeneration.account == client.account, MediaGeneration.provider == "inflight",
            MediaGeneration.state == "queued")).all(), key=_priority)
        if not pending:
            return False
        cap = cfg.inflight_max_threads
        free = {k: capacity(usage, local, k, cap, active) for k in ("image", "video")}
        shared = None if usage.get("plan") == "parallel" else max(free.values())
        if shared is not None and all(r.kind == "image" for r in pending):
            # One pool for both kinds: a clip waiting in another job (its frame is ready) must not
            # sit behind the next batch of images.
            waiting = db.scalar(select(func.count(MediaGeneration.id)).where(
                MediaGeneration.account == client.account, MediaGeneration.provider == "inflight",
                MediaGeneration.kind == "video", MediaGeneration.state == "queued",
                MediaGeneration.id.notin_(ids))) or 0
            if free["video"]:
                shared = max(0, shared - min(waiting, free["video"]))
        chosen = []
        for row in pending:
            pools = ["image", "video"] if row.mode == "im2v" else [row.kind]
            # im2v occupies an image slot first; its video stage only needs remaining quota.
            needs = ["image"] if row.mode == "im2v" else pools
            if any(free[p] <= 0 for p in needs) or shared is not None and shared <= 0:
                continue
            if row.mode == "im2v" and min(int((usage.get("video") or {}).get("left", 0)), local["video"]) <= 0:
                continue
            payload = _resolve(db, row)
            if payload is None:
                continue
            body = wire_payload(row.mode, payload)  # validate/encode before marking anything submitted
            body["client_ref"] = f"vidosodel-{row.id}"
            chosen.append((row, {"mode": row.mode, "body": body}))
            for p in needs:
                free[p] -= 1
            if shared is not None:
                shared -= 1
        if not chosen:
            return False
        groups = _groups(client, usage, chosen)
        for group in groups:
            for r, task in group:
                refs = task["body"].get("reference_images") or []
                r.payload = {**r.payload, "_request_audit": {"mode": r.mode,
                    "endpoint": MODES[r.mode] if len(group) == 1 else "/jobs",
                    "references": [{"name": ref.get("name"), "mime": ref["mime"],
                        "bytes": len(base64.b64decode(ref["image_base64"])),
                        "sha256": hashlib.sha256(base64.b64decode(ref["image_base64"])).hexdigest()} for ref in refs]}}
                r.state, r.submitted_at = "submitting", time.time()
                r.attempts += 1
        plan = [(group[0][0].kind, [r.id for r, _ in group], [t for _, t in group]) for group in groups]
    progressed = False
    for n, (kind, chosen_ids, tasks) in enumerate(plan):
        if _submit(client, kind, chosen_ids, tasks):
            progressed = True
        else:
            # Slots or quota were not there after all; release the rest of this round unsubmitted.
            rest = [rid for _, later, _ in plan[n + 1:] for rid in later]
            with session_scope() as db:
                for rid in rest:
                    row = db.get(MediaGeneration, rid)
                    if row.state == "submitting":
                        row.state, row.submitted_at = "queued", None
                        row.attempts = max(0, row.attempts - 1)
            break
    return progressed


def _submit(client, kind, chosen_ids, tasks) -> bool:
    """Send one submission and record it. False – nothing was accepted and the round should stop."""
    try:
        results = client.submit(kind, tasks)
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
        return False
    except Exception:
        with session_scope() as db:
            for rid in chosen_ids:
                db.get(MediaGeneration, rid).state = "unknown"
        raise
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
                _apply_result(r, result)
    return True


def _apply_result(row, result):
    """Final-state details: mode check, refusal kind, non-retryable outcomes."""
    if error := mode_error(row.mode, result):
        row.state, row.error = "failed", error
        if (row.payload.get("_request_audit") or {}).get("endpoint") == "/jobs" and row.mode not in ("t2i", "t2v"):
            _NO_ROLE_BATCH.add(row.account)
        return
    state = result.get("state", row.state)
    code = result.get("error_code") or result.get("error") or ""
    text = result.get("error_text") or ""
    if state == "declined":
        kind = result.get("refusal_kind") or "other"
        row.error = f"Отказ по содержанию ({kind}): {text}".strip(": ")
    elif state == "failed" and (code == "OUTCOME_UNKNOWN" or result.get("retryable") is False):
        row.error = "Результат операции не подтверждён сервисом (OUTCOME_UNKNOWN); автоматический повтор запрещён"
        row.payload = {**row.payload, "_no_retry": True}
    elif state in ("failed", "cancelled"):
        row.error = " · ".join(str(x) for x in (code, text) if x) or None
    else:
        row.error = None


def poll(client, ids):
    # Coalesce polling across all callers, including portraits/thumbnails.
    with POLL_LOCK:
        if time.monotonic() - _LAST_POLL.get(client.account, 0) < 3:
            return
        with session_scope() as db:
            rows = db.scalars(select(MediaGeneration).where(MediaGeneration.account == client.account,
                              MediaGeneration.state.in_(("accepted", "running")))).all()
            remote = {r.remote_id: r.id for r in rows if r.remote_id}
        keys = list(remote)
        for offset in range(0, len(keys), 200):
            for result in client.poll(keys[offset:offset + 200]):
                rid = remote.get(str(result.get("id")))
                if rid:
                    with session_scope() as db:
                        row = db.get(MediaGeneration, rid)
                        if row.state == "cancelled":
                            continue
                        row.state, row.result = result.get("state", row.state), result
                        _apply_result(row, result)
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
                     f"Inflight: готово {len(emitted)}/{len(ids)} · ожидание генерации, слота или лимита")
        for _ in range(20):
            ctx.check()
            time.sleep(.1)
