"""The brief of one video's graphics and its cut-outs.

* **Brief** – before the composing sessions, one short structured call reads the whole script and writes the art
  direction of *this* video: its visual thread and metaphors, which devices suit which part of the story, how
  to keep the video varied, and the cut-outs it needs. Parallel sessions see only their part of the script; the
  brief is what makes the parts one film and keeps them from repeating each other. Kept in ``Track.motion["brief"]``
  and reused while the script is the same; the editor may rewrite it (``by: "user"`` – then it is never replaced).
* **Look** – the same call picks the format of the video's graphics (how they behave and what they are made of,
  see ``backend/motion/lib/formats.mjs``), its style, the grade and the film texture of the whole video, from the
  script, the channel's picture style and what its recent videos looked like (a channel may pin a format or a style).
  Kept in ``brief["look"]``; the editor may change it (``by: "user"``).
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
from .provider import run_designer

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


# ------------------------------------------------------------------ the look of the video
def look_prompt(catalog: dict[str, Any], *, format_pin: str, style_pin: dict[str, Any] | None,
                recent: list[dict[str, Any]]) -> str:
    """What the brief is told to choose the format and the look of this video from."""
    fmts = catalog.get("formats") or {}
    lines = ["FORMATS — how the graphics of a video behave and what they are made of:"]
    lines += [f"- {n}: {f['about']}. Suits: {f['suits']}. Good styles: {', '.join(f.get('styles') or [])}"
              for n, f in fmts.items()]
    lines.append("STYLES — palette, type, textures:")
    lines += [f"- {n}: {st['about']} (fonts {st['fonts']['display']} / {st['fonts']['body']})"
              for n, st in (catalog.get("styles") or {}).items()]
    lines.append(f"Font families: {', '.join(catalog.get('families') or [])}. Grades of the whole video: "
                 f"{', '.join(catalog.get('grades') or [])}.")
    if format_pin in fmts:
        lines.append(f"The channel fixed the format: {format_pin} (use it).")
    if style_pin:
        lines.append(f"The channel fixed its look: {json.dumps(style_pin, ensure_ascii=False)} (use this style; no palette or "
                     "font changes).")
    if recent:
        lines.append("Recent videos of this channel looked like this: " + "; ".join(
            f"{r.get('format')} + {(r.get('style') or {}).get('base')}" for r in recent[:3])
            + ". Keep the channel recognisable — stay close to it unless this video's subject clearly asks for another "
              "format.")
    return "\n".join(lines)


def look_schema(catalog: dict[str, Any]) -> dict[str, Any]:
    return {"type": "object", "required": ["format", "style", "grade", "film", "why"], "properties": {
        "format": {"type": "string", "enum": list(catalog.get("formats") or {"explainer": 1})},
        "style": {"type": "string", "enum": list(catalog.get("styles") or {"editorial": 1})},
        "palette": {"type": "object", "additionalProperties": {"type": "string"}},
        "fonts": {"type": "object", "additionalProperties": {"type": "object", "properties": {
            "family": {"type": "string"}, "weight": {"type": "integer"}}}},
        "grade": {"type": "string", "enum": list(catalog.get("grades") or ["none"])},
        "film": {"type": "number"},
        "why": {"type": "string"}}}


LOOK_TASK = (
    "look — choose how THIS video is told in graphics. format: the one whose language fits the subject, the mood and "
    "the audience of this script (the picture style matters too: an oil-painting channel about the past reads as an "
    "archive or a cinematic essay, a flat cartoon channel as an explainer). style: a base style that suits the format; "
    "palette overrides only to tune it to this video and its pictures (roles bg, bg2, ink, muted, accent, accent2, accent3, "
    "panel; ink must be very readable on bg, the accent must pop) and fonts overrides only if a family from the list "
    "fits clearly better (roles display, body, label, book, caps, script). grade: the colour treatment of the whole "
    "video (pictures too) — the format's own is a good default, none keeps the pictures as they are. film: 0–1, how "
    "much film texture (grain, dust, weave, flicker) the whole video gets — 0 clean, 0.5 subtle, 1 the full format. "
    "why: one sentence in Russian for the editor.")


def parse_look(out: dict[str, Any], catalog: dict[str, Any], *, format_pin: str,
               style_pin: dict[str, Any] | None) -> dict[str, Any]:
    fmts, styles = catalog.get("formats") or {}, catalog.get("styles") or {}
    fmt = format_pin if format_pin in fmts else out.get("format") if out.get("format") in fmts else "explainer"
    own_grade = (fmts.get(fmt, {}).get("finish") or {}).get("grade", "none")
    film = out.get("film")
    look: dict[str, Any] = {
        "format": fmt,
        "grade": out.get("grade") if out.get("grade") in (catalog.get("grades") or []) else own_grade,
        "film": round(max(0.0, min(1.0, float(film))), 2) if isinstance(film, (int, float)) else 0.7,
        "why": str(out.get("why") or "").strip()[:300], "by": "auto"}
    if style_pin:
        look["style"] = dict(style_pin)
    else:
        base = out.get("style") if out.get("style") in styles else (fmts.get(fmt, {}).get("styles") or ["editorial"])[0]
        look["style"] = {"base": base, **{k: out[k] for k in ("palette", "fonts") if isinstance(out.get(k), dict) and out[k]}}
    return look


def style_doc(look: dict[str, Any]) -> dict[str, Any]:
    """The renderer's style of a look: the base style, its overrides and the format."""
    st = dict(look.get("style") or {"base": "editorial"})
    st["format"] = look.get("format") or "explainer"
    return st


def finish_of(look: dict[str, Any], catalog: dict[str, Any]) -> dict[str, Any]:
    from ..render.finish import finish_params  # noqa: PLC0415

    base = ((catalog.get("formats") or {}).get(look.get("format") or "") or {}).get("finish") or {}
    return finish_params(base, grade=look.get("grade"), film=float(look.get("film", 0.7)))


def make_look(*, title: str, niche: str, picture_style: str, scenes: list[Any], catalog: dict[str, Any],
              format_pin: str, style_pin: dict[str, Any] | None, recent: list[dict[str, Any]], model: str,
              should_stop: Callable[[], bool], provider: str = "claude") -> dict[str, Any]:
    """Only the look (the brief stays): one small structured call over the start of the script."""
    sample = " ".join(" ".join(sc.text.split()) for sc in scenes)[:3000]
    prompt = (f"VIDEO: «{title}» · niche: {niche or 'infer from the script'}\nPicture style of the channel: {picture_style}\n"
              f"SCRIPT (start): {sample}\n\n{look_prompt(catalog, format_pin=format_pin, style_pin=style_pin, recent=recent)}"
              f"\n\n{LOOK_TASK}")
    res = run_designer(prompt, provider=provider, model=model, effort="low", system="You are the art director of a YouTube channel's motion "
                     "graphics. Answer only with the structured output.", json_schema=look_schema(catalog), timeout=300,
                     should_stop=should_stop)
    return parse_look(res.get("structured_output") or {}, catalog, format_pin=format_pin, style_pin=style_pin)


# ------------------------------------------------------------------ the brief
def make_brief(*, title: str, lang: str, niche: str, picture_style: str, rules: str, mode: str, scenes: list[Any],
               characters: list[tuple[str, str]], max_cutouts: int, model: str, catalog: dict[str, Any],
               format_pin: str, style_pin: dict[str, Any] | None, recent: list[dict[str, Any]],
               should_stop: Callable[[], bool], provider: str = "claude") -> dict[str, Any]:
    """One structured call over the whole script: the look of the video, its art direction and its cut-outs.
    Raises :class:`~app.motion.provider.MotionError`."""
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
        f"Graphics mode: {mode}.\nPicture style of the channel: {picture_style}\n"
        + (f"Channel rules for graphics (always apply): {rules.strip()}\n" if rules.strip() else "")
        + (f"Recurring characters of the pictures:\n{cast}\n" if cast else "")
        + "\nSCRIPT:\n" + "\n".join(lines) + "\n\n"
        + look_prompt(catalog, format_pin=format_pin, style_pin=style_pin, recent=recent) + "\n\n"
        "Decide the look of this video, then write its art direction for motion designers who each see only a part of "
        "the script.\n"
        + LOOK_TASK + "\n"
        "brief — 6–12 short lines in English, in the language of the chosen format: the visual thread of this video (one "
        "or two recurring metaphors or motifs born from its topic, how they come back and evolve); which materials and "
        "devices suit which stretches of the story (name scene ranges); where the video goes big and where it stays "
        "calm; concrete devices NOT to lean on for this topic; a variety rule: across the video the hero of a scene "
        "should change type — no device in more than about a fifth of the scenes.\n"
        f"cutouts — up to {max_cutouts} characters or objects the graphics will need as cut-out figures, drawn by an "
        "image model in the channel's picture style: the protagonist (and others) in poses that the story needs, "
        "key objects that carry an idea. Prefer few strong recurring ones over many single-use ones. Each: id (latin "
        "snake_case), what (English, the subject only: who/what, the full look — for a listed character repeat their "
        "appearance —, clothes, pose, expression; no background, no text), shape (tall for standing figures, square, "
        "wide), character (name from the list when it is one of them, else empty), use (where and how it appears, "
        "1 line). Empty list if the video has no use for them."
    )
    schema = {"type": "object", "required": ["look", "brief", "cutouts"], "properties": {
        "look": look_schema(catalog),
        "brief": {"type": "string"},
        "cutouts": {"type": "array", "items": {"type": "object", "required": ["id", "what", "shape"], "properties": {
            "id": {"type": "string"}, "what": {"type": "string"}, "shape": {"type": "string", "enum": list(SHAPES)},
            "character": {"type": "string"}, "use": {"type": "string"}}}}}}
    res = run_designer(prompt, provider=provider, model=model, effort="low", system="You are the art director of a YouTube channel's motion "
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
    return {"text": str(out.get("brief") or "").strip()[:4000], "cutouts": cuts, "key": script_key(scenes), "by": "auto",
            "look": parse_look(out.get("look") or {}, catalog, format_pin=format_pin, style_pin=style_pin)}


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

