"""The brief of one video's graphics and its cut-outs.

* **Brief** – before the composing sessions, one short structured call reads the whole script and writes the art
  direction of *this* video: its visual thread and metaphors, which devices suit which part of the story, how
  to keep the video varied, and the cut-outs it needs. Parallel sessions see only their part of the script; the
  brief is what makes the parts one film and keeps them from repeating each other. Kept in ``Track.motion["brief"]``
  and reused while the script is the same; the editor may rewrite it (``by: "user"`` – then it is never replaced).
* **Cut-outs** – characters and objects drawn by the image model in the channel's picture style on a plain
  background, then cut out (:mod:`app.render.matting`) into PNGs with transparency, which the graphics place into
  their scenes (element ``cutout``, ``src: "cut:<id>"``). They are drawn while Claude composes; until then the
  contact sheets show grey silhouettes.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
import threading
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from ..db import session_scope
from ..models import Character
from ..storage import to_abs, to_rel, track_dir
from .agent import run_claude

log = logging.getLogger(__name__)

SHAPES = {"tall": "3:4", "square": "1:1", "wide": "4:3"}


def script_key(scenes: list[Any]) -> str:
    return hashlib.sha1("\n".join(sc.text.strip() for sc in scenes).encode()).hexdigest()[:12]


def brief_of(motion: dict[str, Any] | None) -> dict[str, Any]:
    b = (motion or {}).get("brief")
    return b if isinstance(b, dict) else {}


def cutout_list(motion: dict[str, Any] | None) -> list[dict[str, Any]]:
    return [c for c in brief_of(motion).get("cutouts") or [] if isinstance(c, dict) and c.get("id")]


def cutout_assets(motion: dict[str, Any] | None) -> dict[str, str]:
    """``cut:<id>`` → absolute PNG path of every drawn cut-out."""
    out = {}
    for c in cutout_list(motion):
        path = to_abs(c.get("file")) if c.get("file") else None
        if path is not None and path.exists():
            out[f"cut:{c['id']}"] = str(path)
    return out


def cutout_info(motion: dict[str, Any] | None) -> dict[str, dict[str, str]]:
    """What the renderer needs for stand-ins of cut-outs not drawn yet."""
    return {c["id"]: {"shape": c.get("shape") or "tall", "what": c.get("what") or ""} for c in cutout_list(motion)
            if c.get("status") != "failed"}


def prompt_lines(motion: dict[str, Any] | None) -> str:
    """The brief and the cut-outs as the composing sessions read them."""
    b = brief_of(motion)
    lines = []
    if (b.get("text") or "").strip():
        lines.append(f"VIDEO BRIEF (art direction of this video — follow it):\n{b['text'].strip()}")
    cuts = [c for c in cutout_list(motion) if c.get("status") != "failed"]
    if cuts:
        lines.append("CUTOUTS (drawn in the channel's picture style, transparent background; element "
                     "{\"type\":\"cutout\",\"src\":\"cut:<id>\"}):\n"
                     + "\n".join(f"- cut:{c['id']} ({c.get('shape') or 'tall'}) — {c.get('use') or c.get('what')}" for c in cuts))
    return "\n\n".join(lines)


# ------------------------------------------------------------------ the brief
def make_brief(*, title: str, lang: str, niche: str, picture_style: str, style: dict[str, Any], rules: str,
               mode: str, scenes: list[Any], characters: list[tuple[str, str]], max_cutouts: int, model: str,
               should_stop: Callable[[], bool]) -> dict[str, Any]:
    """One structured call over the whole script. Raises :class:`ClaudeError`."""
    lines, size = [], 0
    for sc in scenes:
        line = f"#{sc.idx} [{sc.start:.0f}s] {' '.join(sc.text.split())}"
        size += len(line)
        if size > 26000:  # a very long script: the rest is summarised by its scene count
            lines.append(f"… and {len(scenes) - len(lines)} more scenes")
            break
        lines.append(line)
    cast = "\n".join(f"- {n}: {d[:240]}" for n, d in characters) if characters else ""
    prompt = (
        f"VIDEO: «{title}» · language {lang} · {len(scenes)} scenes · niche: {niche or 'infer from the script'}\n"
        f"Graphics mode: {mode}. Motion style of the channel: {json.dumps(style, ensure_ascii=False)}\n"
        f"Picture style of the channel: {picture_style}\n"
        + (f"Channel rules for graphics (always apply): {rules.strip()}\n" if rules.strip() else "")
        + (f"Recurring characters of the pictures:\n{cast}\n" if cast else "")
        + "\nSCRIPT:\n" + "\n".join(lines) + "\n\n"
        "Write the art direction of THIS video's motion graphics, for motion designers who each see only a part of "
        "the script.\n"
        "brief — 6–12 short lines in English: the visual thread of this video (one or two recurring metaphors or "
        "motifs born from its topic, how they come back and evolve); which visual devices suit which stretches of the "
        "story (name scene ranges); where the video goes big and where it stays calm; concrete devices NOT to lean on "
        "for this topic; a variety rule: across the video the hero of a scene should change type (photo, cut-out "
        "character, chart, map, big number, diagram, kinetic type, camera journey…) — no device in more than about a "
        "fifth of the scenes.\n"
        f"cutouts — up to {max_cutouts} characters or objects the graphics will need as cut-out figures, drawn by an "
        "image model in the channel's picture style: the protagonist (and others) in poses that the story needs, "
        "key objects that carry an idea. Prefer few strong recurring ones over many single-use ones. Each: id (latin "
        "snake_case), what (English, the subject only: who/what, the full look — for a listed character repeat their "
        "appearance —, clothes, pose, expression; no background, no text), shape (tall for standing figures, square, wide), character (name from the list when it is one "
        "of them, else empty), use (where and how it appears, 1 line). Empty list if the video has no use for them."
    )
    schema = {"type": "object", "required": ["brief", "cutouts"], "properties": {
        "brief": {"type": "string"},
        "cutouts": {"type": "array", "items": {"type": "object", "required": ["id", "what", "shape"], "properties": {
            "id": {"type": "string"}, "what": {"type": "string"}, "shape": {"type": "string", "enum": list(SHAPES)},
            "character": {"type": "string"}, "use": {"type": "string"}}}}}}
    res = run_claude(prompt, model=model, effort="low", system="You are the art director of a YouTube channel's motion "
                     "graphics. Answer only with the structured output.", json_schema=schema, timeout=600,
                     should_stop=should_stop)
    out = res.get("structured_output") or {}
    cuts, seen = [], set()
    for c in out.get("cutouts") or []:
        cid = re.sub(r"[^a-z0-9_]+", "_", str(c.get("id") or "").lower()).strip("_")[:32]
        if not cid or cid in seen or not str(c.get("what") or "").strip():
            continue
        seen.add(cid)
        cuts.append({"id": cid, "what": str(c["what"]).strip()[:600], "shape": c.get("shape") if c.get("shape") in SHAPES else "tall",
                     "character": str(c.get("character") or "").strip()[:100], "use": str(c.get("use") or "").strip()[:300],
                     "status": "pending"})
        if len(cuts) >= max_cutouts:
            break
    return {"text": str(out.get("brief") or "").strip()[:4000], "cutouts": cuts, "key": script_key(scenes), "by": "auto"}


# ------------------------------------------------------------------ cut-outs
def cutout_prompt(c: dict[str, Any], picture_style: str) -> str:
    return (f"{c['what'].rstrip('.')}. One single isolated subject, shown whole and uncropped, centered, filling most of the "
            "frame, on a plain flat solid light-grey background with nothing else: no scenery, no floor, no cast shadow, "
            f"no frame, no text. Drawn in this style: {picture_style.strip()}")


class CutoutMaker:
    """Draws the brief's cut-outs in the background; ``on_ready(id, abs_path)`` for each one finished."""

    def __init__(self, ctx: Any, project_id: int, track_id: int, tc: Any, save: Callable[[Callable[[dict], None]], dict],
                 on_ready: Callable[[str, str], None], on_failed: Callable[[str], None] = lambda cid: None):
        self.ctx, self.project_id, self.track_id, self.tc = ctx, project_id, track_id, tc
        self.save, self.on_ready, self.on_failed = save, on_ready, on_failed
        self.pool = ThreadPoolExecutor(max_workers=3, thread_name_prefix="cutout")
        self.futures: list[Any] = []
        self.errors: list[str] = []
        self.done = 0
        self.lock = threading.Lock()

    def start(self, cuts: list[dict[str, Any]]) -> None:
        for c in cuts:
            if c.get("status") == "done" and c.get("file") and to_abs(c["file"]) and to_abs(c["file"]).exists():
                continue
            self.futures.append(self.pool.submit(self._one, dict(c)))

    def wait(self) -> None:
        for f in self.futures:
            try:
                f.result()
            except Exception:  # noqa: BLE001 – reported in self.errors
                pass
        self.pool.shutdown(wait=True)

    def _set(self, cid: str, **fields: Any) -> None:
        def apply(m: dict[str, Any]) -> None:
            for c in brief_of(m).get("cutouts") or []:
                if c.get("id") == cid:
                    c.update(fields)
        self.save(apply)

    def _one(self, c: dict[str, Any]) -> None:
        from ..jobs.image_jobs import generate_one, image_data_uri  # noqa: PLC0415 – image_jobs imports the motion store
        from ..pipeline import characters as chars  # noqa: PLC0415
        from ..render.matting import cut_out  # noqa: PLC0415
        from ..services.fastgen import FastgenClient  # noqa: PLC0415

        images = self.tc.settings.images
        cid = c["id"]
        self._set(cid, status="generating", error=None)
        folder = track_dir(self.project_id, self.track_id, "motion", "cutouts")
        try:
            refs: list[Any] = []
            note = ""
            what = c
            if c.get("character"):  # a character of the pictures: their look in words, and their portrait as a reference
                with session_scope() as db:
                    ch = db.query(Character).filter(Character.project_id == self.project_id,
                                                    Character.name == c["character"]).first()
                    if ch is not None:
                        if (ch.description or "").strip():
                            what = {**c, "what": f"{ch.name} ({' '.join(ch.description.split())[:400]}): {c['what']}"}
                        if chars.accepts_refs(images.operation) and ch.image_file and (uri := image_data_uri(ch.image_file, 1024)):
                            file = chars.reference_name(ch.name, set())
                            refs.append({"name": file, "input": uri})
                            note = chars.reference_note([(ch.name, file, ch.description or "")])
            # the plain image op: our own prompt (the channel's scene style asks for a full 16:9 scene)
            plain = images.model_copy(update={"style_prompt": "", "avoid": "text, letters, watermark, logo, frame, border, "
                                              "background scenery, other objects, cast shadow, cropped subject"})
            with FastgenClient() as fg:
                raw, meta = generate_one(fg, cutout_prompt(what, images.style_prompt), folder, f"{cid}_src", plain,
                                         self.tc.settings.llm, refs, self.ctx, note=note, aspect_ratio=SHAPES.get(c.get("shape"), "3:4"))
            dest = folder / f"{cid}.png"
            w, h = cut_out(raw, dest, progress=lambda msg: self.ctx.progress(None, msg))
            raw.unlink(missing_ok=True)
            self._set(cid, status="done", file=to_rel(dest), size=[w, h], credits=meta.get("credits"))
            self.on_ready(cid, str(dest))
            with self.lock:
                self.done += 1
        except Exception as e:  # noqa: BLE001 – a failed cut-out is left out of the graphics, nothing else stops
            if self.ctx.should_stop():
                self._set(cid, status="pending")
                return
            log.warning("cutout %s failed", cid, exc_info=True)
            msg = str(e).splitlines()[0][:200] if str(e) else type(e).__name__
            self._set(cid, status="failed", error=msg)
            self.on_failed(cid)
            with self.lock:
                self.errors.append(f"{cid}: {msg}")

