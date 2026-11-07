"""MCP tools of a motion session, at ``/mcp/motion/<token>``.

The motion job registers a :class:`Session` per Claude process (one part of a video) and passes the URL with its
token in ``--mcp-config``; the tools work only on that part of that track. Requests from web pages are refused
(``Origin`` check) and an unknown token gets nothing.
"""
from __future__ import annotations

import base64
import json
import logging
import re
import tempfile
import threading
import time
import traceback
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response
from starlette.concurrency import run_in_threadpool

from ..db import session_scope
from ..models import Track
from ..pipeline.timings import Word
from . import store
from .node import run_cli

log = logging.getLogger(__name__)
router = APIRouter(tags=["motion"])

#: Read-modify-write of ``Track.motion`` from parallel sessions.
WRITE_LOCK = threading.Lock()


@dataclass
class Session:
    token: str
    track_id: int
    mode: str                       # accents | mixed | full | adapt
    lo: int                         # first scene index of the part
    hi: int                         # last scene index (inclusive)
    t0: float                       # time range of the part
    t1: float
    scenes: list[Any]               # light scene records: idx, start, end, text
    words: list[Word]
    duration: float
    lang: str
    width: int
    height: int
    fonts_dir: str | None
    assets: dict[str, str]          # shared by the sessions of a run: cut-outs are added as they are drawn
    safe_bottom: float
    visual_check: bool
    work: Path
    on_progress: Callable[[str], None] = lambda m: None
    planned: bool = False
    submitted: set[str] = field(default_factory=set)
    calls: int = 0
    seed: int = 1
    prompt: str = ""
    #: Targets of the part: motion scenes and overlays to make.
    want_scenes: int = 0
    want_overlays: int = 0
    #: Cut-outs planned for the video (stand-ins in the contact sheets until drawn).
    cutouts: dict[str, Any] = field(default_factory=dict)
    #: Element types outside the language of the video's format (never suggested).
    avoid: set[str] = field(default_factory=set)


SESSIONS: dict[str, Session] = {}


class ToolError(Exception):
    pass


# ------------------------------------------------------------------ helpers
def _motion(track_id: int) -> dict[str, Any]:
    with session_scope() as db:
        t = db.get(Track, track_id)
        return dict(t.motion or {}) if t else {}


def _save(track_id: int, fn: Callable[[dict[str, Any]], None]) -> dict[str, Any]:
    with WRITE_LOCK, session_scope() as db:
        t = db.get(Track, track_id)
        if t is None:
            raise ToolError("дорожка удалена")
        m = json.loads(json.dumps(t.motion or {}))
        fn(m)
        m["updated"] = time.time()
        t.motion = m
        return m


def _scene_at(s: Session, t: float) -> Any:
    best = s.scenes[0]
    for sc in s.scenes:
        if sc.start <= t:
            best = sc
    return best


def _progress_line(s: Session, m: dict[str, Any]) -> str:
    owned = store.slot_owner(m)
    in_range = range(s.lo, s.hi + 1)
    written = sum(1 for i in in_range if owned.get(i))
    ovs = sum(1 for o in store.overlay_items(m) if s.t0 <= float(o["start"]) < s.t1)
    if s.mode == "full":
        left = [i for i in in_range if not owned.get(i)]
        return (f"Part: {len(in_range) - len(left)}/{len(in_range)} scenes covered."
                + (f" NOT DONE — still without a motion scene: {', '.join(f'#{i}' for i in left[:20])}." if left else " Done."))
    if s.mode in ("redo",):
        return "Done if the redone item is ok."
    planned = [i for i in in_range if i in owned]
    todo = []
    if written < len(planned):
        todo.append(f"planned scenes without items: {', '.join(f'#{i}' for i in planned if not owned.get(i))}")
    if ovs < s.want_overlays:
        todo.append(f"overlays {ovs}/{s.want_overlays}")
    return (f"Part: motion scenes {written}/{len(planned)}, overlays {ovs}/{s.want_overlays}."
            + (" NOT DONE — " + "; ".join(todo) + "." if todo else " Done."))


# ------------------------------------------------------------------ tools
def tool_plan(s: Session, args: dict[str, Any]) -> list[dict[str, Any]]:
    if s.mode in ("full", "adapt"):
        return [_text("No plan needed in this mode: submit items.")]
    slots: list[int] = []
    for x in args.get("scenes") or []:
        group = x if isinstance(x, list) else [x]
        for i in group:
            i = int(i)
            if not s.lo <= i <= s.hi:
                raise ToolError(f"сцена #{i} вне вашей части (#{s.lo}–#{s.hi})")
            slots.append(i)
    if s.mode == "accents" and slots:
        raise ToolError("в режиме accents сцены не заменяются — только оверлеи")

    def apply(m: dict[str, Any]) -> None:
        keep = [i for i in m.get("plan_slots") or [] if not s.lo <= int(i) <= s.hi]
        m["plan_slots"] = sorted(set(keep + slots))
        parts = m.setdefault("plan_parts", [])
        if s.token not in parts:
            parts.append(s.token)
        if len(parts) >= int(m.get("plan_total") or 1):
            m["planning"] = False
    _save(s.track_id, apply)
    s.planned = True
    s.on_progress(f"план: {len(slots)} моушн-сцен")
    return [_text(f"Planned {len(slots)} motion scenes. Now submit the items (motion scenes and overlays).")]


def _normalize(s: Session, raw: dict[str, Any], m: dict[str, Any], errors: list[str]) -> dict[str, Any] | None:
    it = json.loads(json.dumps(raw))
    kind = it.get("kind") or ("scene" if it.get("slots") is not None else "overlay")
    it["kind"] = kind
    if kind == "scene":
        if s.mode == "accents":
            errors.append("в режиме accents сцены не заменяются — только overlay"); return None
        slots = sorted(int(x) for x in (it.get("slots") or []))
        if not slots:
            errors.append("нет slots"); return None
        if slots != list(range(slots[0], slots[-1] + 1)):
            errors.append(f"slots {slots} должны идти подряд"); return None
        if slots[0] < s.lo or slots[-1] > s.hi:
            errors.append(f"slots {slots} вне вашей части (#{s.lo}–#{s.hi})"); return None
        it["slots"] = slots
        it["id"] = f"s{slots[0]}"
        for other in store.scene_items(m):
            if other["id"] != it["id"] and set(other["slots"]) & set(slots):
                errors.append(f"slots {slots} пересекаются с {other['id']} {other['slots']}"); return None
        a, b = store.span(s.scenes, slots, s.duration)
        rel_errors: list[str] = []
        store.resolve_times(it, s.words, a, a, b, rel_errors)
        errors.extend(rel_errors)
        it.pop("start", None); it.pop("end", None)
        return it
    if kind != "overlay":
        errors.append(f"kind «{kind}»: нужно scene или overlay"); return None
    # overlay: start / end are video times (numbers or anchors in the part)
    st = it.get("start")
    try:
        start = float(store.resolve_anchor(st, s.words, 0.0, s.t0, s.t1)) if isinstance(st, str) and st.startswith("@") else float(st)
    except (TypeError, ValueError) as e:
        errors.append(f"start: {e}"); return None
    en = it.get("end", "+5")
    try:
        if isinstance(en, str) and en.startswith("+"):
            end = start + float(en[1:])
        elif isinstance(en, str) and en.startswith("@"):
            end = float(store.resolve_anchor(en, s.words, 0.0, start, s.t1 + 10))
        else:
            end = float(en)
    except (TypeError, ValueError) as e:
        errors.append(f"end: {e}"); return None
    if end - start < 1.5:
        end = start + 4.0
    end = min(end, start + 12.0, s.duration)
    if not s.t0 - 1 <= start <= s.t1:
        errors.append(f"start {start:.1f} вне вашей части ({s.t0:.1f}–{s.t1:.1f} с)"); return None
    owned = store.slot_owner(m)  # written and planned motion scenes: an overlay belongs over a picture
    for sc in s.scenes:
        if sc.idx in owned and sc.start < end - 0.3 and sc.end > start + 0.3:
            errors.append(f"оверлей {start:.1f}–{end:.1f} с попадает на моушн-сцену #{sc.idx}"); return None
    it["start"], it["end"] = round(start, 2), round(end, 2)
    it["id"] = it.get("id") if isinstance(it.get("id"), str) and it["id"].startswith("o") else f"o{int(round(start * 10))}"
    rel_errors = []
    store.resolve_times(it.get("els"), s.words, start, start, end, rel_errors, "els.")
    errors.extend(rel_errors)
    return it


def _doc(s: Session, m: dict[str, Any], extra: list[dict[str, Any]] | None, only: set[str] | None) -> Path:
    prev = {}
    for it in [*(extra or []), *store.overlay_items(m)]:
        if it.get("kind") == "overlay":
            sc = _scene_at(s, float(it["start"]))
            if sc.image:
                prev[it["id"]] = sc.image
    replaced = {e["id"] for e in extra or []}
    base = {**m, "items": [x for x in store.items(m) if x["id"] not in replaced]}
    doc = store.build_doc(base, s.scenes, s.duration, width=s.width, height=s.height, lang=s.lang, seed=s.seed,
                          fonts_dir=s.fonts_dir, assets=dict(s.assets), safe_bottom=s.safe_bottom, only=only, extra=extra,
                          preview_bg=prev, cutouts=s.cutouts)
    doc["placeholders"] = True  # pictures still being generated are grey stand-ins while composing
    fd, path = tempfile.mkstemp(suffix=".json", dir=s.work)
    with open(fd, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False)
    return Path(path)


def _sheet(s: Session, m: dict[str, Any], ids: list[str]) -> dict[str, Any] | None:
    if not ids:
        return None
    doc = _doc(s, m, None, {i.split("@")[0] for i in ids})
    out = doc.with_suffix(".jpg")
    try:
        run_cli("sheet", str(doc), str(out), *ids, timeout=120)
        data = base64.b64encode(out.read_bytes()).decode()
    finally:
        doc.unlink(missing_ok=True)
        out.unlink(missing_ok=True)
    return {"type": "image", "data": data, "mimeType": "image/jpeg"}


def tool_submit(s: Session, args: dict[str, Any]) -> list[dict[str, Any]]:
    raw = args.get("items")
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except ValueError as e:
            raise ToolError(f"items: не JSON ({e})") from e
    if not isinstance(raw, list) or not raw:
        raise ToolError("items: нужен непустой список")
    m = _motion(s.track_id)
    lines: list[str] = []
    candidates: list[dict[str, Any]] = []
    for n, r in enumerate(raw):
        errs: list[str] = []
        it = _normalize(s, r if isinstance(r, dict) else {}, m, errs) if isinstance(r, dict) else None
        label = (it or {}).get("id") or f"#{n}"
        if it is None or errs:
            lines.append(f"ERR {label}: " + "; ".join(errs or ["не объект"]))
            continue
        candidates.append(it)
    ok: list[dict[str, Any]] = []
    if candidates:
        doc = _doc(s, m, candidates, {c["id"] for c in candidates})
        try:
            res = run_cli("validate", str(doc), timeout=120)
        finally:
            doc.unlink(missing_ok=True)
        for c in candidates:
            r = (res["scenes"] if c["kind"] == "scene" else res["overlays"]).get(c["id"], {"errors": ["не отрисовался"]})
            if r.get("errors"):
                lines.append(f"ERR {c['id']}: " + "; ".join(r["errors"]))
                continue
            c["settle"] = r.get("settle")
            c["warnings"] = r.get("warnings") or []
            if r.get("sig"):
                c["sig"] = r["sig"]
            ok.append(c)
        _variety(s, m, ok)
        for c in ok:
            lines.append(f"ok {c['id']}" + ("" if not c["warnings"] else " WARN: " + "; ".join(c["warnings"][:5])))
    if ok:
        ids = {c["id"] for c in ok}

        def apply(mm: dict[str, Any]) -> None:
            mm["items"] = [x for x in store.items(mm) if x.get("id") not in ids] + ok
            mm["items"].sort(key=lambda x: (x.get("start") if x.get("kind") == "overlay" else
                                            store.span(s.scenes, x["slots"], s.duration)[0]))
        m = _save(s.track_id, apply)
        s.submitted |= ids
        s.on_progress(f"готово элементов: {len(s.submitted)}")
    lines.append(_progress_line(s, m))
    content = [_text("\n".join(lines))]
    if ok and s.visual_check:
        img = _sheet(s, m, [c["id"] for c in ok][:9])
        if img:
            content.append(img)
    return content


# ------------------------------------------------------------------ variety across the whole video
#: Devices that turn into a tic when they come back in scene after scene.
DEVICES = ("stamp", "scribble", "compare", "iconarray", "list", "flow", "quote", "callout", "title", "filmstrip", "paper")
HEROES_ALL = ("photo", "cutout", "map", "linechart", "bars", "donut", "timeline", "stat", "counter", "ring", "flow",
              "compare", "icon", "text", "iconarray", "image", "document", "portrait", "title", "filmstrip")
ZONES = {"l": "left", "r": "right", "c": "centre", "full": "full frame"}


def _order(s: Session, it: dict[str, Any]) -> int:
    return min(int(x) for x in it.get("slots") or [0])


def _cap(m: dict[str, Any], ok: list[dict[str, Any]]) -> int:
    """How many motion scenes of the video may share a hero or a device: about a fifth of them (written + planned)."""
    ids = {x["id"] for x in store.scene_items(m)} | {c["id"] for c in ok if c["kind"] == "scene"}
    written = {i for x in store.scene_items(m) for i in x["slots"]} | {i for c in ok if c["kind"] == "scene" for i in c["slots"]}
    planned = {int(i) for i in m.get("plan_slots") or []} - written
    return max(2, -(-(len(ids) + len(planned)) // 5))


def _variety(s: Session, m: dict[str, Any], ok: list[dict[str, Any]]) -> None:
    """Warnings for scenes that repeat their neighbours or overuse a device across the video (all parts)."""
    new_ids = {c["id"] for c in ok}
    pool = [x for x in store.scene_items(m) if x.get("sig") and x["id"] not in new_ids] + [c for c in ok if c.get("sig") and c["kind"] == "scene"]
    pool.sort(key=lambda x: _order(s, x))
    cap = _cap(m, ok)
    for c in ok:
        sig = c.get("sig")
        if c["kind"] != "scene" or not sig:
            continue
        i = next(k for k, x in enumerate(pool) if x["id"] == c["id"])
        near = pool[max(0, i - 2):i] + pool[i + 1:i + 3]
        for o in near:
            os_ = o["sig"]
            if os_["hero"] == sig["hero"] and os_["zone"] == sig["zone"]:
                c["warnings"].append(f"повторяет композицию соседней {o['id']} (главный — {sig['hero']}, {ZONES.get(sig['zone'], sig['zone'])}): "
                                     "смените тип главного элемента и раскладку")
                break
        same = next((o for o in pool if o["id"] != c["id"] and len(sig["types"]) >= 3 and o["sig"]["types"] == sig["types"]), None)
        if same:
            c["warnings"].append(f"тот же набор элементов, что в {same['id']} ({'+'.join(sig['types'])})")
        heroes = sum(1 for o in pool if o["sig"]["hero"] == sig["hero"])
        if heroes > cap:
            c["warnings"].append(f"главный элемент {sig['hero']} уже в {heroes} моушн-сценах ролика (не больше {cap}): возьмите другой")
        for d in DEVICES:
            if d in sig["types"] and d != sig["hero"]:
                n = sum(1 for o in pool if d in o["sig"]["types"])
                if n > cap:
                    c["warnings"].append(f"{d} уже в {n} сценах ролика (не больше {cap}) — приём приелся, обойдитесь без него")


def _variety_summary(s: Session, m: dict[str, Any]) -> str:
    pool = [x for x in store.scene_items(m) if x.get("sig")]
    if len(pool) < 3:
        return ""
    from collections import Counter  # noqa: PLC0415
    heroes = Counter(x["sig"]["hero"] for x in pool)
    devices = Counter(d for x in pool for d in DEVICES if d in x["sig"]["types"])
    unused = [h for h in HEROES_ALL if h not in heroes and (h != "cutout" or s.cutouts) and h != "image" and h not in s.avoid]
    return (f"VIDEO SO FAR ({len(pool)} motion scenes, all parts): heroes "
            + ", ".join(f"{k} {v}" for k, v in heroes.most_common())
            + ("; devices " + ", ".join(f"{k} {v}" for k, v in devices.most_common()) if devices else "")
            + (f"; not used yet as a hero: {', '.join(unused[:8])}" if unused else "") + ".")


def tool_look(s: Session, args: dict[str, Any]) -> list[dict[str, Any]]:
    ids = [str(x) for x in args.get("ids") or []][:9]
    times = args.get("at") or []
    if times:
        ids = [f"{i}@{t}" for i in ids for t in times][:9]
    m = _motion(s.track_id)
    img = _sheet(s, m, ids)
    return [img] if img else [_text("nothing to show")]


def _text(t: str) -> dict[str, Any]:
    return {"type": "text", "text": t}


TOOLS: dict[str, tuple[Callable[[Session, dict[str, Any]], list[dict[str, Any]]], str, dict[str, Any]]] = {
    "plan": (tool_plan, "Choose which scenes of your part become full-screen motion scenes (mixed mode). Call once, first.",
             {"type": "object", "properties": {
                 "scenes": {"type": "array", "items": {"anyOf": [{"type": "integer"}, {"type": "array", "items": {"type": "integer"}}]},
                            "description": "scene indices (a sub-list = consecutive scenes merged into one)"}},
              "required": ["scenes"]}),
    "submit": (tool_submit, "Submit motion scenes and overlays (JSON items, see the guide). Answers errors, warnings and a contact sheet.",
               {"type": "object", "properties": {"items": {"type": "array", "items": {"type": "object"}}}, "required": ["items"]}),
    "look": (tool_look, "Contact sheet of submitted items: ids, optionally at = times in seconds of each item.",
             {"type": "object", "properties": {"ids": {"type": "array", "items": {"type": "string"}},
                                               "at": {"type": "array", "items": {"type": "number"}}}, "required": ["ids"]}),
}


# ------------------------------------------------------------------ JSON-RPC
def _handle(s: Session, msg: dict[str, Any]) -> dict[str, Any] | None:
    mid, method, params = msg.get("id"), msg.get("method"), msg.get("params") or {}
    if mid is None:
        return None
    if method == "initialize":
        return {"jsonrpc": "2.0", "id": mid, "result": {
            "protocolVersion": params.get("protocolVersion") or "2025-06-18", "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": {"name": "motion", "version": "1"}}}
    if method == "ping":
        return {"jsonrpc": "2.0", "id": mid, "result": {}}
    if method == "tools/list":
        tools = [{"name": n, "description": d, "inputSchema": sch} for n, (_, d, sch) in TOOLS.items()
                 if not (n == "plan" and s.mode in ("full", "adapt"))]
        return {"jsonrpc": "2.0", "id": mid, "result": {"tools": tools}}
    if method == "tools/call":
        name = str(params.get("name"))
        fn = TOOLS.get(name, (None,))[0]
        s.calls += 1
        try:
            if fn is None:
                raise ToolError(f"нет инструмента {name}")
            content = fn(s, params.get("arguments") or {})
            return {"jsonrpc": "2.0", "id": mid, "result": {"content": content, "isError": False}}
        except ToolError as e:
            return {"jsonrpc": "2.0", "id": mid, "result": {"content": [_text(str(e))], "isError": True}}
        except Exception as e:  # noqa: BLE001
            log.error("motion tool %s failed:\n%s", name, traceback.format_exc())
            return {"jsonrpc": "2.0", "id": mid, "result": {"content": [_text(f"Ошибка: {e}")], "isError": True}}
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"Method not found: {method}"}}


@router.post("/mcp/motion/{token}", include_in_schema=False)
async def motion_mcp(token: str, request: Request) -> Response:
    if request.headers.get("origin"):
        return JSONResponse({"error": "origin not allowed"}, status_code=403)
    s = SESSIONS.get(token)
    if s is None or not re.fullmatch(r"[A-Za-z0-9_-]{16,64}", token):
        return JSONResponse({"jsonrpc": "2.0", "id": None, "error": {"code": -32001, "message": "session ended"}}, status_code=404)
    payload = json.loads(await request.body())
    if isinstance(payload, list):
        out = [a for a in [await run_in_threadpool(_handle, s, x) for x in payload] if a]
        return JSONResponse(out) if out else Response(status_code=202)
    ans = await run_in_threadpool(_handle, s, payload)
    return JSONResponse(ans) if ans else Response(status_code=202)


@router.get("/mcp/motion/{token}", include_in_schema=False)
async def motion_mcp_get(token: str) -> Response:
    return Response(status_code=405, headers={"Allow": "POST"})
