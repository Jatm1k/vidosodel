"""Motion graphics of a track: the list, preview frames, deleting, and the catalogue of styles."""
from __future__ import annotations

import hashlib
import json
from functools import lru_cache
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..jobs.common import scene_image
from ..jobs.events import track_changed
from ..jobs.runner import runner
from ..models import Track
from ..motion import brief as motion_brief
from ..motion import store
from ..motion.node import MotionUnavailable, run_cli
from ..storage import to_abs, track_dir

router = APIRouter(prefix="/api", tags=["motion"])


def _track(db: Session, track_id: int) -> Track:
    t = db.get(Track, track_id)
    if t is None:
        raise HTTPException(404, "Языковая версия не найдена")
    return t


def _hash(item: dict[str, Any], style: Any) -> str:
    return hashlib.sha1(json.dumps([item, style], sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12]


@router.get("/tracks/{track_id}/motion")
def get_motion(track_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    t = _track(db, track_id)
    mo = t.motion or {}
    scenes = list(t.scenes)
    dur = t.audio_duration or 0.0
    out = []
    for it in store.items(mo):
        row = {"id": it["id"], "kind": it.get("kind"), "note": it.get("note") or "", "warnings": it.get("warnings") or [],
               "still": f"/api/tracks/{track_id}/motion/{it['id']}/still?v={_hash(it, mo.get('style'))}"}
        if it.get("kind") == "scene":
            row["slots"] = it.get("slots")
            if scenes and max(it["slots"]) < len(scenes):
                row["start"], row["end"] = store.span(scenes, it["slots"], dur)
        else:
            row["start"], row["end"] = it.get("start"), it.get("end")
        out.append(row)
    b = motion_brief.brief_of(mo)
    cuts = [{"id": c["id"], "what": c.get("what") or "", "use": c.get("use") or "", "shape": c.get("shape") or "tall",
             "status": c.get("status") or "pending", "error": c.get("error"),
             "url": f"/api/tracks/{track_id}/motion/cutouts/{c['id']}.png?v={c.get('file', '')[-24:]}" if c.get("file") else None}
            for c in motion_brief.cutout_list(mo)]
    lk = b.get("look") or {}
    look_out = {"format": lk.get("format"), "style": (lk.get("style") or {}).get("base"), "grade": lk.get("grade") or "none",
                "film": lk.get("film", 0.0), "why": lk.get("why") or "", "by": lk.get("by") or "auto"} if lk else None
    brief_out = {"text": b.get("text") or "", "by": b.get("by") or "auto",
                 "stale": bool(b.get("key")) and b.get("by") != "user" and bool(scenes) and b.get("key") != motion_brief.script_key(scenes),
                 "cutouts": cuts, "look": look_out} if b else None
    return {"mode": mo.get("mode"), "style": mo.get("style"), "planning": store.planning(mo), "items": out, "brief": brief_out,
            "stale": bool(mo.get("key")) and bool(scenes) and mo.get("key") != store.timeline_key(scenes),
            "updated": mo.get("updated")}


@router.get("/tracks/{track_id}/motion/{item_id}/still")
def motion_still(track_id: int, item_id: str, t: str = "settle", db: Session = Depends(get_db)) -> FileResponse:
    tr = _track(db, track_id)
    mo = tr.motion or {}
    item = next((x for x in store.items(mo) if x.get("id") == item_id), None)
    if item is None:
        raise HTTPException(404, "Нет такого элемента")
    folder = track_dir(tr.project_id, tr.id, "motion", "stills")
    out = folder / f"{item_id}-{_hash(item, mo.get('style'))}-{t}.jpg"
    if not out.exists():
        scenes = list(tr.scenes)
        prev = {}
        if item.get("kind") == "overlay":
            under = [sc for sc in scenes if sc.start <= float(item["start"])]
            rel = scene_image(under[-1]) if under else None
            if rel and to_abs(rel) and to_abs(rel).exists():
                prev[item_id] = str(to_abs(rel))
        doc = store.build_doc(mo, scenes, tr.audio_duration or 0.0, width=1920, height=1080, lang=tr.language, seed=tr.id,
                              fonts_dir=str(get_settings().fonts_dir), only={item_id}, preview_bg=prev,
                              assets={f"img{sc.idx}": str(to_abs(scene_image(sc))) for sc in scenes
                                      if scene_image(sc) and to_abs(scene_image(sc)).exists()})
        for old in folder.glob(f"{item_id}-*.jpg"):
            old.unlink(missing_ok=True)
        doc_path = folder / f"{item_id}.json"
        doc_path.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        try:
            run_cli("still", str(doc_path), item_id, t, str(out), "640", timeout=60)
        except (MotionUnavailable, RuntimeError) as e:
            raise HTTPException(500, str(e)) from e
        finally:
            doc_path.unlink(missing_ok=True)
    return FileResponse(out, media_type="image/jpeg", headers={"Cache-Control": "max-age=86400"})


@router.delete("/tracks/{track_id}/motion/{item_id}")
def delete_item(track_id: int, item_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    t = _track(db, track_id)
    mo = json.loads(json.dumps(t.motion or {}))
    gone = next((x for x in store.items(mo) if x.get("id") == item_id), None)
    if gone is None:
        raise HTTPException(404, "Нет такого элемента")
    mo["items"] = [x for x in store.items(mo) if x.get("id") != item_id]
    if gone.get("kind") == "scene":
        mo["plan_slots"] = [i for i in mo.get("plan_slots") or [] if i not in gone["slots"]]
    t.motion = mo
    db.commit()
    track_changed(track_id, "motion")
    need = 0
    if gone.get("kind") == "scene":
        need = sum(1 for sc in t.scenes if sc.idx in gone["slots"] and not scene_image(sc))
    return {"ok": True, "pictures_needed": need}


class ToPicture(BaseModel):
    scene_ids: list[int]


@router.post("/tracks/{track_id}/motion/to-picture")
def to_picture(track_id: int, body: ToPicture, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Scenes back to pictures: the motion scenes covering them are removed (all their slots), then a prompt and a
    picture are made for every such scene that has none."""
    t = _track(db, track_id)
    if t.project.image_mode == "shared" and t.project.master_track_id not in (None, t.id):
        raise HTTPException(400, "Картинки этого языка берутся из основного — верните картинку там")
    idxs = {sc.idx for sc in t.scenes if sc.id in set(body.scene_ids)}
    mo = json.loads(json.dumps(t.motion or {}))
    slots: set[int] = set(idxs)
    keep = []
    for it in store.items(mo):
        if it.get("kind") == "scene" and set(it.get("slots") or []) & idxs:
            slots |= set(it["slots"])
        else:
            keep.append(it)
    mo["items"] = keep
    mo["plan_slots"] = [i for i in mo.get("plan_slots") or [] if i not in slots]
    t.motion = mo
    need = [sc for sc in t.scenes if sc.idx in slots and not scene_image(sc)]
    db.commit()
    track_changed(track_id, "motion")
    job_ids = []
    if need:
        ids = [sc.id for sc in need]
        no_prompt = [sc.id for sc in need if not sc.prompt.strip()]
        prompts = runner.enqueue("prompts", project_id=t.project_id, track_id=t.id, params={"scene_ids": no_prompt}) if no_prompt else None
        images = runner.enqueue("images", project_id=t.project_id, track_id=t.id, params={"scene_ids": ids},
                                depends_on=prompts.id if prompts else None)
        job_ids = [j.id for j in (prompts, images) if j]
    return {"ok": True, "scenes": len(slots), "jobs": job_ids}


@router.post("/tracks/{track_id}/pictures/missing")
def missing_pictures(track_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Every scene without a picture that is not motion graphics: prompts where missing, then pictures."""
    _track(db, track_id)
    from ..jobs.image_jobs import queue_missing_pictures  # noqa: PLC0415

    return {"queued": queue_missing_pictures(track_id)}


class BriefIn(BaseModel):
    text: str


@router.put("/tracks/{track_id}/motion/brief")
def save_brief(track_id: int, body: BriefIn, db: Session = Depends(get_db)) -> dict[str, bool]:
    """The editor's own art direction of the video: kept for every next generation."""
    t = _track(db, track_id)
    mo = json.loads(json.dumps(t.motion or {}))
    b = mo.setdefault("brief", {})
    b.update(text=body.text.strip()[:6000], by="user", key=motion_brief.script_key(list(t.scenes)))
    t.motion = mo
    db.commit()
    track_changed(track_id, "motion")
    return {"ok": True}


class LookIn(BaseModel):
    format: str | None = None
    style: str | None = None
    grade: str | None = None
    film: float | None = None


@router.put("/tracks/{track_id}/motion/look")
def save_look(track_id: int, body: LookIn, db: Session = Depends(get_db)) -> dict[str, bool]:
    """The editor's choice of the video's format, style, grade or film. The graphics are not composed again: the
    camera, the printing of pictures, the backgrounds and the finish of the format apply at once; compositions made
    for another format are best regenerated."""
    t = _track(db, track_id)
    cat = _catalog()
    mo = json.loads(json.dumps(t.motion or {}))
    b = mo.setdefault("brief", {})
    look = dict(b.get("look") or {"format": "explainer", "style": (mo.get("style") or {"base": "editorial"}), "grade": "none",
                                  "film": 0.6})
    if body.format is not None:
        if body.format not in (cat.get("formats") or {}):
            raise HTTPException(400, f"Нет подачи «{body.format}»")
        look["format"] = body.format
    if body.style is not None:
        if body.style not in (cat.get("styles") or {}):
            raise HTTPException(400, f"Нет стиля «{body.style}»")
        old = look.get("style") or {}
        look["style"] = old if old.get("base") == body.style else {"base": body.style}
    if body.grade is not None:
        if body.grade not in (cat.get("grades") or []):
            raise HTTPException(400, f"Нет тонировки «{body.grade}»")
        look["grade"] = body.grade
    if body.film is not None:
        look["film"] = round(max(0.0, min(1.0, body.film)), 2)
    look["by"] = "user"
    b["look"] = look
    mo["style"] = motion_brief.style_doc(look)
    mo["finish"] = motion_brief.finish_of(look, cat)
    t.motion = mo
    db.commit()
    track_changed(track_id, "motion")
    return {"ok": True}


@router.delete("/tracks/{track_id}/motion/brief")
def reset_brief(track_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    """The next generation writes the art direction anew (drawn cut-outs it asks for again are reused)."""
    t = _track(db, track_id)
    mo = json.loads(json.dumps(t.motion or {}))
    b = motion_brief.brief_of(mo)
    if b:
        mo["brief"] = {"cutouts": [c for c in b.get("cutouts") or [] if c.get("status") == "done"]}
        t.motion = mo
        db.commit()
        track_changed(track_id, "motion")
    return {"ok": True}


@router.get("/tracks/{track_id}/motion/cutouts/{cid}.png")
def cutout_png(track_id: int, cid: str, db: Session = Depends(get_db)) -> FileResponse:
    t = _track(db, track_id)
    c = next((x for x in motion_brief.cutout_list(t.motion) if x["id"] == cid), None)
    path = to_abs(c.get("file")) if c and c.get("file") else None
    if path is None or not path.exists():
        raise HTTPException(404, "Вырезки нет")
    return FileResponse(path, media_type="image/png", headers={"Cache-Control": "max-age=86400"})


@router.delete("/tracks/{track_id}/motion/cutouts/{cid}")
def delete_cutout(track_id: int, cid: str, db: Session = Depends(get_db)) -> dict[str, bool]:
    """Removes a cut-out (the graphics that show it leave it out); the next generation may draw it again."""
    t = _track(db, track_id)
    mo = json.loads(json.dumps(t.motion or {}))
    b = motion_brief.brief_of(mo)
    gone = [c for c in b.get("cutouts") or [] if c.get("id") == cid]
    if not gone:
        raise HTTPException(404, "Вырезки нет")
    b["cutouts"] = [c for c in b.get("cutouts") or [] if c.get("id") != cid]
    b.pop("key", None)  # the brief asked for it: let the next run think again
    t.motion = mo
    db.commit()
    own = track_dir(t.project_id, t.id)
    for c in gone:  # a translation shares the master's cut-outs: only this track's own files are deleted
        if c.get("file") and (p := to_abs(c["file"])) is not None and own in p.parents:
            p.unlink(missing_ok=True)
    track_changed(track_id, "motion")
    return {"ok": True}


@router.delete("/tracks/{track_id}/motion")
def clear_motion(track_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    t = _track(db, track_id)
    b = motion_brief.brief_of(t.motion)
    t.motion = {"brief": b} if b else {}  # the art direction and the drawn cut-outs stay
    db.commit()
    track_changed(track_id, "motion")
    return {"ok": True}


@lru_cache(maxsize=1)
def _catalog() -> dict[str, Any]:
    return run_cli("styles", timeout=60)


@router.get("/motion/styles")
def styles() -> dict[str, Any]:
    try:
        return _catalog()
    except (MotionUnavailable, RuntimeError) as e:
        raise HTTPException(500, str(e)) from e
