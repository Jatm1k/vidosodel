"""Motion graphics job: the app asks Claude Code to compose the graphics of a track.

* the channel's look – picked once for the niche (``style: auto``) by a short structured call and saved to
  the channel, so every video of the channel shares it;
* the brief of the video – its own art direction and cut-outs, written for its script (see :mod:`app.motion.brief`);
  the cut-outs are drawn while the sessions compose;
* a long video is cut into parts of ``chunk_scenes`` scenes; ``parallel`` Claude sessions work on them at once,
  each with only its part of the script in the prompt;
* ``mixed``: each session first marks the scenes it turns into motion (``plan``) – the image job skips them
  and waits for that mark, so no picture is drawn for nothing;
* ``redo`` – single items again with the user's comment; ``adapt`` – a language that shares the master's
  pictures gets the master's graphics with its own texts and timings.
"""
from __future__ import annotations

import json
import logging
import secrets
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from ..config import get_settings
from ..db import session_scope
from ..models import Channel, Character, Track
from ..motion import brief, store
from ..motion.agent import GUIDE, ClaudeError, run_claude, tool_events, usage_of
from ..motion.node import MotionUnavailable, ensure_installed, run_cli
from ..motion.tools import SESSIONS, WRITE_LOCK, Session
from ..render.engine import RESOLUTIONS
from ..settings_schema import MotionSettings
from ..storage import to_abs, track_dir
from .common import TrackCtx, load_timings, load_track, master_track, scene_image
from .events import track_changed
from .runner import JobCancelled, JobContext, JobError, register, runner

log = logging.getLogger(__name__)

MODE_TEXT = {
    "full": ("Every scene of your part becomes a full-screen motion scene (merge 2–3 consecutive short scenes with "
             "\"slots\":[a,b] when one visual idea spans them). No overlays."),
    "mixed": ("Pictures are generated for most scenes. First call plan with the ~{k} scenes of your part that are best "
              "shown as graphics (numbers, dates, maps, comparisons, lists, processes, definitions). Then submit those "
              "motion scenes and ~{o} overlays over the remaining picture scenes."),
    "accents": ("The pictures stay. Add ~{o} overlays where the narration has numbers, places, names, dates, sources or "
                "key terms worth showing."),
}


# ------------------------------------------------------------------ style of the channel
def _catalog() -> dict[str, Any]:
    return run_cli("styles", timeout=60)


def ensure_style(ctx: JobContext, tc: TrackCtx, ms: MotionSettings) -> dict[str, Any]:
    """The style document ``{"base": …, **overrides}``; picks and saves the channel's look when ``auto``."""
    if ms.style != "auto":
        return {"base": ms.style, **(ms.style_overrides or {})}
    with session_scope() as db:
        ch = db.get(Channel, tc.channel.id)
        saved = ((ch.settings or {}).get("motion") or {})
        if saved.get("style") and saved.get("style") != "auto":
            return {"base": saved["style"], **(saved.get("style_overrides") or {})}
        niche, cname, image_style = tc.settings.llm.niche, ch.name, tc.settings.images.style_prompt
    ctx.progress(0.02, "Claude подбирает визуальный язык канала под нишу", force=True)
    cat = _catalog()
    styles = "\n".join(f"- {n}: {s['about']} (bg {s['bg']}; fonts {s['fonts']['display']} / {s['fonts']['body']}; "
                       f"palette {json.dumps(s['palette'])})" for n, s in cat["styles"].items())
    with session_scope() as db:
        script = (db.get(Track, tc.track.id).script or "")[:1800]
    prompt = (f"Channel «{cname}». Niche: {niche or 'unknown — infer from the script'}. Picture style of the channel: "
              f"{image_style}.\nScript sample:\n{script}\n\nBase styles:\n{styles}\n\nFont families: "
              f"{', '.join(cat['families'])}.\n\nChoose the base style that fits this niche and audience, and tune it "
              "into the channel's own look: palette overrides (keep contrast: ink on bg must be very readable; the "
              "accent must pop on bg), optionally fonts overrides ({role: {family, weight}} from the list, roles "
              "display/body/label). Keep it coherent with the picture style.")
    schema = {"type": "object", "required": ["base"], "properties": {
        "base": {"type": "string", "enum": list(cat["styles"])},
        "palette": {"type": "object", "additionalProperties": {"type": "string"}},
        "fonts": {"type": "object", "additionalProperties": {"type": "object", "properties": {
            "family": {"type": "string"}, "weight": {"type": "integer"}}}}}}
    try:
        res = run_claude(prompt, model=ms.model, effort="low", system="You are an art director of motion graphics. "
                         "Answer only with the structured output.", json_schema=schema, timeout=300,
                         should_stop=ctx.should_stop)
    except ClaudeError as e:
        raise JobError(str(e)) from e
    out = res.get("structured_output") or {}
    base = out.get("base") if out.get("base") in cat["styles"] else "editorial"
    overrides = {k: out[k] for k in ("palette", "fonts") if isinstance(out.get(k), dict) and out[k]}
    with session_scope() as db:
        ch = db.get(Channel, tc.channel.id)
        st = json.loads(json.dumps(ch.settings or {}))
        mo = st.setdefault("motion", {})
        mo.update({"style": base, "style_overrides": overrides})
        ch.settings = st
    return {"base": base, **overrides}


# ------------------------------------------------------------------ parts
def _light_scenes(track: Track) -> list[Any]:
    out = []
    for sc in track.scenes:
        rel = scene_image(sc)
        path = to_abs(rel) if rel else None
        out.append(SimpleNamespace(idx=sc.idx, start=sc.start, end=sc.end, text=sc.text,
                                   image=str(path) if path is not None and path.exists() else None))
    return out


def _parts(n: int, size: int) -> list[tuple[int, int]]:
    size = max(6, size)
    count = max(1, round(n / size))
    step = n / count
    bounds = [round(i * step) for i in range(count + 1)]
    return [(bounds[i], bounds[i + 1] - 1) for i in range(count) if bounds[i + 1] > bounds[i]]


def _scene_lines(scenes: list[Any], lo: int, hi: int, duration: float, motion: dict[str, Any] | None = None) -> str:
    owned = store.slot_owner(motion) if motion else {}
    lines = []
    for sc in scenes[lo:hi + 1]:
        end = scenes[sc.idx + 1].start if sc.idx + 1 < len(scenes) else duration
        mark = " [motion]" if sc.idx in owned else ""
        lines.append(f"#{sc.idx} [{sc.start:.1f}–{end:.1f} · {end - sc.start:.1f}s]{mark} {sc.text.strip()}")
    return "\n".join(lines)


def _assets_line(scenes: list[Any], lo: int, hi: int, mode: str) -> str:
    """Pictures a photo may show. In mixed mode they are still being drawn: any scene of the part that stays a
    picture scene will have one (grey stand-ins in the contact sheets)."""
    if mode == "full":
        have = [sc.idx for sc in scenes if sc.image]
        return f"ASSETS: pictures img<N> exist for scenes {', '.join(map(str, have[:80]))}" if have else ""
    if mode != "mixed":
        return ""
    return (f"ASSETS: img<N> = the picture of scene #N (#{max(0, lo - 3)}-#{min(len(scenes) - 1, hi + 3)}); never use the "
            "picture of a scene you turn into motion. Pictures not drawn yet show as grey stand-ins.")


def _head(tc: TrackCtx, style: dict[str, Any], ms: MotionSettings, duration: float, subs_bottom: bool,
          brief_m: dict[str, Any] | None = None) -> str:
    title = ((tc.track.publish_meta or {}).get("titles") or [tc.project.name])[0]
    lines = [f"VIDEO: «{title}» · language: {tc.track.language} · {int(duration // 60)}:{int(duration % 60):02d}"
             + (f" · niche: {tc.settings.llm.niche}" if tc.settings.llm.niche else ""),
             f"STYLE: {json.dumps(style, ensure_ascii=False)}"]
    if ms.direction.strip():
        lines.append(f"CHANNEL RULES: {ms.direction.strip()}")
    if subs_bottom:
        lines.append("SUBTITLES: burned in at the bottom — overlays stay above y=860.")
    extra = brief.prompt_lines(brief_m)
    return "\n".join(lines) + (f"\n\n{extra}" if extra else "")


def _ensure_brief(ctx: JobContext, tc: TrackCtx, ms: MotionSettings, scenes: list[Any], style: dict[str, Any],
                  mode: str, old: dict[str, Any], adapt_brief: dict[str, Any] | None) -> dict[str, Any]:
    """The brief for this run: the master's (a translation), the editor's, the current one while the script is the
    same, or a new one. Cut-outs already drawn with the same id and description are kept."""
    if adapt_brief:
        return json.loads(json.dumps(adapt_brief))
    if old.get("by") == "user" or (old.get("text") and old.get("key") == brief.script_key(scenes)):
        return old
    characters = []
    with session_scope() as db:
        title = ((db.get(Track, tc.track.id).publish_meta or {}).get("titles") or [tc.project.name])[0]
        for c in db.query(Character).filter(Character.project_id == tc.project.id):
            if (c.kind or "character") == "character":
                characters.append((c.name, c.description or ""))
    ctx.progress(0.03, "Claude пишет арт-дирекцию этого ролика", force=True)
    try:
        new = brief.make_brief(title=title, lang=tc.track.language, niche=tc.settings.llm.niche,
                               picture_style=tc.settings.images.style_prompt, style=style, rules=ms.direction, mode=mode,
                               scenes=scenes, characters=characters, max_cutouts=max(0, ms.cutouts), model=ms.model,
                               should_stop=ctx.should_stop)
    except ClaudeError as e:
        if ctx.should_stop():
            raise JobCancelled() from e
        log.warning("brief failed: %s", e)
        return old or {}
    drawn = {c["id"]: c for c in old.get("cutouts") or [] if c.get("status") == "done" and c.get("file")}
    new["cutouts"] = [drawn[c["id"]] if c["id"] in drawn and drawn[c["id"]].get("what") == c["what"] else c
                      for c in new["cutouts"]]
    return new


# ------------------------------------------------------------------ the job
@register("motion", "motion", "Моушн-графика (Claude)")
def motion_job(ctx: JobContext) -> dict[str, Any]:
    """Params: ``ids`` + ``comment`` – redo these items; ``mode`` – override the channel's mode;
    ``range`` – ``[first, last]`` scene indices: only that part (the rest is kept)."""
    try:
        return _motion_job(ctx)
    finally:  # whatever happened, the image job must not wait for a plan any more
        if ctx.track_id:
            try:
                _save(ctx.track_id, lambda m: m.update(planning=False) if m.get("planning") else None)
            except JobError:
                pass


def _motion_job(ctx: JobContext) -> dict[str, Any]:
    try:
        ensure_installed()
    except MotionUnavailable as e:
        raise JobError(str(e)) from e
    redo_ids = [str(x) for x in ctx.params.get("ids") or []]
    with session_scope() as db:
        tc = load_track(db, ctx.track_id)
        track = tc.track
        ms = tc.settings.motion.model_copy(deep=True)
        mode = ctx.params.get("mode") or ms.mode
        if mode == "off" and not redo_ids:
            raise JobError("Моушн-графика выключена в настройках канала (Моушн → режим)")
        timings = load_timings(track)
        if timings is None or not track.audio_file:
            raise JobError("Нужна озвучка: графика привязывается к словам диктора")
        if not track.scenes:
            raise JobError("Сначала разбейте ролик на сцены")
        scenes = _light_scenes(track)
        duration = track.audio_duration or timings.duration
        key = store.timeline_key(track.scenes)
        # scenes that are motion now: they have no pictures, so a new plan should keep them
        had_motion = {i for i in store.motion_scene_idxs(track.motion) if i < len(scenes) and not scenes[i].image}
        adapt_from = None
        if tc.shares_images and not redo_ids:
            master = master_track(db, tc.project)
            if master is not None and store.items(master.motion):
                adapt_from = {"lang": master.language, "items": store.items(master.motion), "style": (master.motion or {}).get("style"),
                              "brief": brief.brief_of(master.motion),
                              "master_scenes": [(sc.idx, sc.start) for sc in master.scenes]}
                mode = "adapt"
        subs = tc.settings.subtitles
        subs_bottom = subs.enabled and subs.position == "bottom"
        render = tc.settings.render
        track_id, lang = track.id, track.language
        old_brief = brief.brief_of(track.motion)
    style = (adapt_from or {}).get("style") or ensure_style(ctx, tc, ms)
    the_brief = old_brief if redo_ids else _ensure_brief(ctx, tc, ms, scenes, style, mode, old_brief,
                                                         (adapt_from or {}).get("brief"))
    width, height = RESOLUTIONS[render.resolution]
    words = timings.words
    work = track_dir(tc.project.id, track_id, "motion")
    ctx.check()

    # ---- what each session does
    if redo_ids:
        tasks = _redo_tasks(track_id, scenes, duration, redo_ids, str(ctx.params.get("comment") or ""))
    else:
        rng = ctx.params.get("range")
        lo_r, hi_r = (max(0, int(rng[0])), min(len(scenes) - 1, int(rng[1]))) if rng else (0, len(scenes) - 1)
        if hi_r < lo_r:
            raise JobError("Пустой диапазон сцен")
        tasks = _full_tasks(scenes, duration, mode, ms, adapt_from, lo_r, hi_r, keep=had_motion)
    partial = bool(ctx.params.get("range")) and not redo_ids

    def init(m: dict[str, Any]) -> None:
        if partial:  # only the range is made again
            t_lo = 0.0 if tasks[0][0] == 0 else scenes[tasks[0][0]].start
            t_hi = scenes[tasks[-1][1] + 1].start if tasks[-1][1] + 1 < len(scenes) else duration
            m["items"] = [it for it in store.items(m) if not (
                (it.get("kind") == "scene" and tasks[0][0] <= min(it["slots"]) <= tasks[-1][1])
                or (it.get("kind") == "overlay" and t_lo <= float(it["start"]) < t_hi))]
            m["plan_slots"] = [i for i in m.get("plan_slots") or [] if not tasks[0][0] <= i <= tasks[-1][1]]
            m["mode"] = mode
            m["plan_parts"], m["plan_total"], m["planning"] = [], len(tasks), mode == "mixed"
            if mode == "full":
                m["plan_slots"] = sorted(set(m["plan_slots"]) | set(range(tasks[0][0], tasks[-1][1] + 1)))
        elif not redo_ids:
            m.clear()
            m.update({"v": store.VERSION, "mode": mode if mode != "adapt" else "adapt", "items": [], "plan_slots": [],
                      "plan_parts": [], "plan_total": len(tasks), "planning": mode == "mixed"})
            if mode == "full":
                m["plan_slots"] = [sc.idx for sc in scenes]
            if mode == "adapt":
                m["plan_slots"] = sorted(store.motion_scene_idxs({"items": adapt_from["items"]}))
        m["style"] = style
        m["key"] = key
        if the_brief:
            m["brief"] = the_brief
    m_now = _save(track_id, init)
    track_changed(track_id, "motion")

    # cut-outs are drawn while Claude composes; every session sees each one as soon as it is ready
    assets = {f"img{sc.idx}": sc.image for sc in scenes if sc.image}
    assets.update(brief.cutout_assets(m_now))
    cut_info = brief.cutout_info(m_now)
    maker = None
    pending = [c for c in brief.cutout_list(m_now) if f"cut:{c['id']}" not in assets and c.get("status") != "failed"]
    if pending and not redo_ids and mode != "adapt":
        maker = brief.CutoutMaker(ctx, tc.project.id, track_id, tc, lambda fn: _save(track_id, fn),
                                  lambda cid, path: assets.__setitem__(f"cut:{cid}", path),
                                  lambda cid: cut_info.pop(cid, None))  # a failed one is not offered any more
        maker.start(pending)

    head = _head(tc, style, ms, duration, subs_bottom, m_now)
    port = get_settings().port
    sessions: list[Session] = []
    for lo, hi, body, want_k, want_o in tasks:
        token = secrets.token_urlsafe(24)
        t0 = 0.0 if lo == 0 else scenes[lo].start
        t1 = scenes[hi + 1].start if hi + 1 < len(scenes) else duration
        s = Session(token=token, track_id=track_id, mode=mode if not redo_ids else "redo", lo=lo, hi=hi, t0=t0, t1=t1,
                    scenes=scenes, words=words, duration=duration, lang=lang, width=width, height=height,
                    fonts_dir=str(get_settings().fonts_dir),
                    assets=assets, cutouts=cut_info, safe_bottom=0.8 if subs_bottom else 0.0,
                    visual_check=ms.visual_check, work=work, seed=track_id * 7919 + lo,
                    want_scenes=want_k, want_overlays=want_o)
        s.prompt = f"{head}\n\n{body}"  # type: ignore[attr-defined]
        sessions.append(s)
    done_parts = {"n": 0}
    usage = {"in": 0, "cache_read": 0, "cache_write": 0, "out": 0}
    status: dict[str, str] = {}

    def report() -> None:
        live = " · ".join(v for v in status.values() if v)
        ctx.progress(0.05 + 0.9 * done_parts["n"] / max(1, len(sessions)),
                     f"Claude: частей {done_parts['n']}/{len(sessions)}" + (f" · {live}" if live else ""))

    def run(s: Session) -> dict[str, Any]:
        label = f"#{s.lo}–#{s.hi}"

        def on_progress(msg: str) -> None:
            status[s.token] = f"{label}: {msg}"
            report()
        s.on_progress = on_progress
        SESSIONS[s.token] = s
        try:
            tools = ["submit", "look"] + (["plan"] if s.mode == "mixed" else [])
            res = run_claude(s.prompt, model=ms.model, effort=ms.effort, system_file=GUIDE,
                             mcp_url=f"http://127.0.0.1:{port}/mcp/motion/{s.token}", tools=tools,
                             timeout=40 * 60, should_stop=lambda: ctx.should_stop() or halt["on"],
                             on_event=tool_events(lambda name: on_progress(f"{name}…")))
            return usage_of(res)
        finally:
            SESSIONS.pop(s.token, None)
            status.pop(s.token, None)
            if s.mode == "mixed" and not s.planned:  # the plan never came: let the pictures go on
                _save(track_id, lambda m: _part_planned(m, s.token))

    errors: list[str] = []
    halt = {"on": False}  # a usage limit or a login problem stops the other parts too
    report()
    with ThreadPoolExecutor(max_workers=max(1, min(ms.parallel, len(sessions)))) as pool:
        futures = {pool.submit(run, s): s for s in sessions}
        for fut in as_completed(futures):
            s = futures[fut]
            try:
                for k, v in fut.result().items():
                    usage[k] += v
            except ClaudeError as e:
                errors.append(f"#{s.lo}–#{s.hi}: {e}")
                if "Лимит" in str(e) or "авторизован" in str(e):
                    halt["on"] = True
            done_parts["n"] += 1
            report()
    cut_errors: list[str] = []
    if maker is not None:
        ctx.progress(0.97, "Дорисовываются вырезки для графики", force=True)
        maker.wait()
        cut_errors = maker.errors
    m, dropped = _finish(track_id, scenes)
    dropped |= had_motion - store.motion_scene_idxs(m)  # were motion, are not any more: they need pictures
    track_changed(track_id, "motion")
    if ctx.should_stop() and not errors:
        raise JobCancelled()
    written = len(store.items(m))
    missing_pictures = _pictures_needed(track_id, dropped)
    tokens = f"токены: вход {usage['in'] + usage['cache_write']:,}, кэш {usage['cache_read']:,}, выход {usage['out']:,}".replace(",", " ")
    if errors and not written:
        raise JobError("; ".join(errors)[:900])
    msg = (f"Моушн-сцен: {len(store.scene_items(m))}, оверлеев: {len(store.overlay_items(m))} · {tokens}"
           + (f" · сцен вернулось к картинкам: {missing_pictures}" if missing_pictures else ""))
    cuts = brief.cutout_list(m)
    if cuts:
        msg += f" · вырезок: {sum(1 for c in cuts if c.get('status') == 'done')}/{len(cuts)}"
    if cut_errors:
        msg += " · не вышли вырезки: " + "; ".join(cut_errors)[:300]
    if errors:
        msg += " · ошибки: " + "; ".join(errors)[:400]
    return {"message": msg, "usage": usage}


def _save(track_id: int, fn) -> dict[str, Any]:
    with WRITE_LOCK, session_scope() as db:
        t = db.get(Track, track_id)
        if t is None:
            raise JobError("Дорожка удалена")
        m = json.loads(json.dumps(t.motion or {}))
        fn(m)
        m["updated"] = time.time()
        t.motion = m
        return m


def _part_planned(m: dict[str, Any], token: str) -> None:
    parts = m.setdefault("plan_parts", [])
    if token not in parts:
        parts.append(token)
    if len(parts) >= int(m.get("plan_total") or 1):
        m["planning"] = False


def _finish(track_id: int, scenes: list[Any]) -> tuple[dict[str, Any], set[int]]:
    """Planned scenes nobody wrote go back to pictures; the plan is over. Returns the motion and those scenes."""
    dropped: set[int] = set()

    def apply(m: dict[str, Any]) -> None:
        written = {i for it in store.scene_items(m) for i in it["slots"]}
        planned = {int(i) for i in m.get("plan_slots") or []}
        dropped.update(planned - written)
        m["plan_slots"] = sorted(planned & written)
        m["planning"] = False
        m.pop("plan_parts", None)
        m.pop("plan_total", None)
    return _save(track_id, apply), dropped


def _pictures_needed(track_id: int, dropped: set[int]) -> int:
    """Scenes that stopped being motion (dropped from the plan, or motion before this run) get prompts and pictures.
    The image job never draws a picture twice, so a running pipeline image job is no problem."""
    from .image_jobs import queue_missing_pictures  # noqa: PLC0415 – image_jobs imports the motion store

    return queue_missing_pictures(track_id, dropped) if dropped else 0

def _full_tasks(scenes: list[Any], duration: float, mode: str, ms: MotionSettings,
                adapt_from: dict[str, Any] | None, first: int, last: int,
                keep: set[int] | None = None) -> list[tuple[int, int, str]]:
    tasks = []
    for a, b in _parts(last - first + 1, ms.chunk_scenes):
        lo, hi = first + a, first + b
        t0 = 0.0 if lo == 0 else scenes[lo].start
        t1 = scenes[hi + 1].start if hi + 1 < len(scenes) else duration
        n = hi - lo + 1
        k = o = 0
        if mode == "adapt":
            src = [it for it in adapt_from["items"]
                   if (it.get("kind") == "scene" and lo <= min(it["slots"]) <= hi)
                   or (it.get("kind") == "overlay" and _overlay_scene(scenes, it, adapt_from) in range(lo, hi + 1))]
            body = (f"TASK: this video is the {adapt_from['lang']} original translated. Adapt the original's graphics of "
                    f"your part: same items (same kind, slots, layout, data, style), on-screen text translated to this "
                    f"language, and every time re-anchored to this narration with @phrases (overlays: start at the same "
                    f"moment of the story, in the same scene index). Submit all of them.\n"
                    f"YOUR PART: scenes #{lo}–#{hi} ({t0:.1f}–{t1:.1f} s).\n\nORIGINAL ITEMS:\n"
                    f"{json.dumps(src, ensure_ascii=False)}\n\nSCENES OF THIS LANGUAGE:\n{_scene_lines(scenes, lo, hi, duration)}")
        else:
            kept = sorted(i for i in (keep or set()) if lo <= i <= hi) if mode == "mixed" else []
            k = max(1, round(n * ms.scene_share), len(kept)) if mode == "mixed" else 0
            o = max(1, round((t1 - t0) / 60 * ms.overlays_per_minute)) if mode in ("mixed", "accents") else 0
            keep_line = (f"KEEP: scenes {', '.join(f'#{i}' for i in kept)} are motion scenes already and have NO pictures — "
                         "plan them as motion scenes again (make them better); choose other scenes only on top of them.\n"
                         if kept else "")
            body = (f"TASK: {MODE_TEXT[mode].format(k=k, o=o)}\n" + keep_line
                    + f"YOUR PART: scenes #{lo}–#{hi} ({t0:.1f}–{t1:.1f} s)" + ("" if (lo, hi) == (first, last) else
                                                                           " — other parts are done by other sessions") + "\n"
                    + (_assets_line(scenes, lo, hi, mode) + "\n" if _assets_line(scenes, lo, hi, mode) else "")
                    + f"\nSCENES (#index [start–end in video seconds · duration] narration):\n{_scene_lines(scenes, lo, hi, duration)}")
        tasks.append((lo, hi, body, k if mode != "adapt" else 0, o if mode != "adapt" else 0))
    return tasks


def _overlay_scene(scenes: list[Any], it: dict[str, Any], adapt_from: dict[str, Any]) -> int:
    """Scene index of an original overlay (the master's scenes have the same indices)."""
    t = float(it.get("start") or 0)
    idx = 0
    for sc in adapt_from.get("master_scenes") or []:
        if sc[1] <= t:
            idx = sc[0]
    if not adapt_from.get("master_scenes"):
        # without the master's timings: proportional position
        idx = min(len(scenes) - 1, int(t / max(1.0, scenes[-1].end) * len(scenes)))
    return idx


def _redo_tasks(track_id: int, scenes: list[Any], duration: float, ids: list[str], comment: str) -> list[tuple[int, int, str]]:
    with session_scope() as db:
        m = db.get(Track, track_id).motion or {}
    tasks = []
    for it in store.items(m):
        if it.get("id") not in ids:
            continue
        if it.get("kind") == "scene":
            lo, hi = min(it["slots"]), max(it["slots"])
        else:
            st = float(it["start"])
            lo = hi = max(sc.idx for sc in scenes if sc.start <= st + 0.01) if any(sc.start <= st + 0.01 for sc in scenes) else 0
        clean = {k: v for k, v in it.items() if k not in ("settle", "warnings")}
        body = (f"TASK: redo item {it['id']} — the editor's request: «{comment or 'make it better'}». Keep its kind"
                + (" and slots" if it.get("kind") == "scene" else " and timing unless asked") + ", submit it again "
                f"(same id).\nYOUR PART: scenes #{lo}–#{hi}.\nCURRENT ITEM (times already in seconds):\n"
                f"{json.dumps(clean, ensure_ascii=False)}\n\nSCENES:\n{_scene_lines(scenes, max(0, lo - 1), min(len(scenes) - 1, hi + 1), duration, m)}")
        tasks.append((lo, hi, body, 0, 0))
    if not tasks:
        raise JobError("Этих элементов уже нет")
    return tasks
