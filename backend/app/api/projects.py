"""Projects, language tracks, uploads, scene editing and pipeline actions."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..jobs.common import load_timings, scene_to_dict
from ..jobs.events import track_changed
from ..jobs.runner import kind_title, runner
from ..jobs.voice import voice_config_override, apply_timings
from ..models import Channel, Job, Project, Scene, Track
from ..pipeline.image_plan import plan_summary
from ..pipeline.languages import LANGUAGES
from ..pipeline.text import normalize_script
from ..pipeline.timings import Timings, estimate, from_srt, parse_srt
from ..render.media import imread, imwrite, probe_duration
from ..services.http import ApiError
from ..services.limiter import limiter
from ..services.lumean import LumeanClient
from ..settings_schema import effective_settings, template_for_language
from ..storage import project_dir, safe_filename, to_abs, to_rel, track_dir, unique_name
from .pipeline_runner import STEP_ORDER, run_pipeline
from .serializers import project_to_dict, track_summary

router = APIRouter(prefix="/api", tags=["projects"])

AUDIO_EXT = {".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".opus"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
JOB_KINDS = {"voice", "transcribe", "translate", "scenes", "prompts", "images", "render", "preview",
             "metadata", "thumbnails", "watermarks"}


# ============================================================== helpers
def _project(db: Session, project_id: int) -> Project:
    p = db.get(Project, project_id)
    if p is None:
        raise HTTPException(404, "Проект не найден")
    return p


def _track(db: Session, track_id: int) -> Track:
    t = db.get(Track, track_id)
    if t is None:
        raise HTTPException(404, "Языковая версия не найдена")
    return t


def _scene(db: Session, scene_id: int) -> Scene:
    s = db.get(Scene, scene_id)
    if s is None:
        raise HTTPException(404, "Сцена не найдена")
    return s


def _busy(track_id: int, kinds: set[str]) -> None:
    if runner.active_for_track(track_id, kinds):
        raise HTTPException(409, "Для этой версии уже выполняется такая задача — дождитесь её завершения")


async def _save_upload(file: UploadFile, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(dest.name + ".part")
    with open(tmp, "wb") as fh:
        while chunk := await file.read(1 << 20):
            fh.write(chunk)
    tmp.replace(dest)
    return dest


# ============================================================== projects
class ProjectIn(BaseModel):
    channel_id: int
    name: str
    languages: list[str] = ["ru"]
    master_language: str | None = None
    image_mode: str = "shared"
    script: str = ""
    #: Overrides of the channel settings for this project only (partial dict).
    settings: dict[str, Any] = {}


class ProjectPatch(BaseModel):
    name: str | None = None
    image_mode: str | None = None
    master_track_id: int | None = None
    settings: dict[str, Any] | None = None
    visual_context: str | None = None


@router.get("/projects")
def list_projects(channel_id: int | None = None, limit: int = 200, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    q = select(Project).order_by(Project.updated_at.desc()).limit(limit)
    if channel_id:
        q = q.where(Project.channel_id == channel_id)
    return [project_to_dict(db, p) for p in db.scalars(q)]


@router.post("/projects")
def create_project(body: ProjectIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    if db.get(Channel, body.channel_id) is None:
        raise HTTPException(404, "Канал не найден")
    langs = [lang for lang in dict.fromkeys(body.languages) if lang in LANGUAGES] or ["ru"]
    master_lang = body.master_language if body.master_language in langs else langs[0]
    langs.sort(key=lambda lang: lang != master_lang)
    channel = db.get(Channel, body.channel_id)
    try:
        effective_settings(channel.settings, body.settings)
    except ValueError as exc:
        raise HTTPException(422, f"Некорректные настройки проекта: {exc}") from exc
    project = Project(channel_id=body.channel_id, name=body.name.strip() or "Новый проект",
                      image_mode=body.image_mode if body.image_mode in ("shared", "per_language") else "shared",
                      settings=body.settings or {})
    db.add(project)
    db.flush()
    for pos, lang in enumerate(langs):
        t = Track(project_id=project.id, language=lang, position=pos,
                  script=normalize_script(body.script) if lang == master_lang else "")
        db.add(t)
        db.flush()
        if lang == master_lang:
            project.master_track_id = t.id
    db.commit()
    db.refresh(project)
    return project_to_dict(db, project, full=True)


@router.get("/projects/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    project = _project(db, project_id)
    data = project_to_dict(db, project, full=True)
    data["channel"] = {"id": project.channel.id, "name": project.channel.name, "color": project.channel.color}
    data["effective_settings"] = effective_settings(project.channel.settings, project.settings).model_dump()
    return data


@router.patch("/projects/{project_id}")
def update_project(project_id: int, body: ProjectPatch, db: Session = Depends(get_db)) -> dict[str, Any]:
    project = _project(db, project_id)
    if body.name is not None:
        project.name = body.name.strip() or project.name
    if body.image_mode in ("shared", "per_language") and body.image_mode != project.image_mode:
        project.image_mode = body.image_mode
        # Switching modes invalidates the scenes of non-master tracks.
        for t in project.tracks:
            if t.id != project.master_track_id:
                for s in list(t.scenes):
                    db.delete(s)
    if body.master_track_id is not None and any(t.id == body.master_track_id for t in project.tracks):
        project.master_track_id = body.master_track_id
    if body.settings is not None:
        effective_settings(project.channel.settings, body.settings)
        project.settings = body.settings
    if body.visual_context is not None:
        project.visual_context = body.visual_context
    db.commit()
    return get_project(project_id, db)


@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    project = _project(db, project_id)
    for t in project.tracks:
        for job_id in runner.active_for_track(t.id):
            runner.cancel(job_id)
    db.delete(project)
    db.commit()
    shutil.rmtree(project_dir(project_id), ignore_errors=True)
    return {"ok": True}


class RunIn(BaseModel):
    #: ``None`` – every step, except metadata/thumbnails when they are switched off in settings.
    steps: list[str] | None = None
    track_ids: list[int] | None = None
    force: bool = False
    options: dict[str, Any] = {}


@router.post("/projects/{project_id}/run")
def run_project(project_id: int, body: RunIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    project = _project(db, project_id)
    steps = body.steps
    if steps is None:
        publish = effective_settings(project.channel.settings, project.settings).publish.enabled
        steps = [s for s in STEP_ORDER if publish or s not in ("metadata", "thumbnails")]
    ids = run_pipeline(db, project, track_ids=body.track_ids, steps=steps, force=body.force, options=body.options)
    return {"jobs": ids, "message": f"Запущено задач: {len(ids)}" if ids else "Все выбранные шаги уже выполнены"}


@router.post("/projects/{project_id}/cancel")
def cancel_project_jobs(project_id: int, db: Session = Depends(get_db)) -> dict[str, int]:
    """Stop every queued/running job of the project. Finished work is kept."""
    ids = list(db.scalars(select(Job.id).where(Job.project_id == project_id, Job.status.in_(("queued", "running")))))
    for i in ids:
        runner.cancel(i)
    return {"cancelled": len(ids)}


@router.get("/projects/{project_id}/image-plan")
def image_plan(project_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Which image model each scene gets, and what the remaining images will cost."""
    project = _project(db, project_id)
    s = effective_settings(project.channel.settings, project.settings)
    return plan_summary(project, s.images, limiter.hourly_budget())


@router.post("/projects/{project_id}/bible")
def regenerate_bible(project_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    _project(db, project_id)
    job = runner.enqueue("bible", project_id=project_id)
    return {"job_id": job.id}


class TrackIn(BaseModel):
    language: str
    translate: bool = True


@router.post("/projects/{project_id}/tracks")
def add_track(project_id: int, body: TrackIn, db: Session = Depends(get_db)) -> dict[str, Any]:
    project = _project(db, project_id)
    if body.language not in LANGUAGES:
        raise HTTPException(400, "Язык не поддерживается")
    if any(t.language == body.language for t in project.tracks):
        raise HTTPException(409, "Такой язык уже есть в проекте")
    t = Track(project_id=project.id, language=body.language, position=len(project.tracks))
    db.add(t)
    db.flush()
    if project.master_track_id is None:
        project.master_track_id = t.id
    db.commit()
    master = db.get(Track, project.master_track_id)
    if body.translate and master and master.id != t.id and master.script.strip():
        runner.enqueue("translate", project_id=project.id, track_id=t.id, params={"source_track_id": master.id})
    return track_summary(db, t)


# ============================================================== tracks
class TrackPatch(BaseModel):
    script: str | None = None


@router.get("/tracks/{track_id}")
def get_track(track_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    t = _track(db, track_id)
    data = track_summary(db, t)
    data["script"] = t.script
    return data


@router.patch("/tracks/{track_id}")
def update_track(track_id: int, body: TrackPatch, db: Session = Depends(get_db)) -> dict[str, Any]:
    t = _track(db, track_id)
    if body.script is not None:
        t.script = normalize_script(body.script)
        t.script_origin = "manual"
    db.commit()
    return get_track(track_id, db)


@router.delete("/tracks/{track_id}")
def delete_track(track_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    t = _track(db, track_id)
    project = t.project
    if len(project.tracks) <= 1:
        raise HTTPException(400, "Нельзя удалить единственный язык проекта")
    for job_id in runner.active_for_track(track_id):
        runner.cancel(job_id)
    pid = project.id
    db.delete(t)
    db.flush()
    if project.master_track_id == track_id:
        rest = [x for x in project.tracks if x.id != track_id]
        project.master_track_id = rest[0].id if rest else None
        for x in rest[1:]:
            for s in list(x.scenes):
                db.delete(s)  # aligned to the old master → no longer valid
    db.commit()
    shutil.rmtree(track_dir(pid, track_id), ignore_errors=True)
    return {"ok": True}


@router.post("/tracks/{track_id}/jobs/{kind}")
def start_job(track_id: int, kind: str, params: dict[str, Any] | None = None, db: Session = Depends(get_db)) -> dict[str, Any]:
    if kind not in JOB_KINDS:
        raise HTTPException(400, "Неизвестное действие")
    t = _track(db, track_id)
    _busy(track_id, {kind})
    job = runner.enqueue(kind, project_id=t.project_id, track_id=t.id, params=params or {},
                         title=f"{kind_title(kind)} · {t.language.upper()}")
    return {"job_id": job.id}


@router.post("/tracks/{track_id}/estimate-voice")
def estimate_voice(track_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Free Lumean dry-run: price, chunk count, blocked fragments."""
    t = _track(db, track_id)
    s = effective_settings(t.project.channel.settings, t.project.settings)
    template_id = template_for_language(s.voice, t.language)
    if not template_id:
        raise HTTPException(400, f"Для языка «{t.language}» не выбран голос в настройках канала")
    if not t.script.strip():
        raise HTTPException(400, "Сценарий пуст")
    try:
        with LumeanClient() as lm:
            data = lm.estimate(template_id, t.script, voice_config_override(t.language, s.voice.speed, s.voice.paragraph_mode))
    except ApiError as exc:
        raise HTTPException(400, exc.message) from exc
    summary = data.get("summary") or {}
    amounts = (summary.get("cost_display") or {}).get("amounts") or {}
    return {
        "chars": summary.get("voiced_length"), "chunks": summary.get("chunks_count"),
        "cost_rub": (amounts.get("rub") or {}).get("amount_formatted"),
        "cost_usd": (amounts.get("usd") or {}).get("amount_formatted"),
        "cost_lmc": summary.get("cost_lmc"), "blocked_chunks": summary.get("blocked_chunks") or [],
        "caps_ok": summary.get("caps_ok", True),
    }


# ----------------------------------------------------------------- uploads
@router.post("/tracks/{track_id}/upload/audio")
async def upload_audio(track_id: int, file: UploadFile = File(...), transcribe: bool = False,
                       db: Session = Depends(get_db)) -> dict[str, Any]:
    t = _track(db, track_id)
    ext = Path(file.filename or "").suffix.lower()
    if ext not in AUDIO_EXT:
        raise HTTPException(400, f"Неподдерживаемый формат аудио. Допустимо: {', '.join(sorted(AUDIO_EXT))}")
    dest = await _save_upload(file, track_dir(t.project_id, t.id, "audio") / f"voice_upload{ext}")
    try:
        duration = probe_duration(dest)
    except Exception as exc:  # noqa: BLE001
        dest.unlink(missing_ok=True)
        raise HTTPException(400, "Не удалось прочитать аудиофайл") from exc
    old = to_abs(t.audio_file)
    if old and old.exists() and old != dest:
        old.unlink(missing_ok=True)
    t.audio_file, t.audio_duration, t.audio_origin = to_rel(dest), duration, "upload"
    t.lumean_order_id = None
    timings = load_timings(t)
    if timings is not None and timings.source in ("estimate", "lumean"):
        # Timings of another voice-over do not match this audio.
        t.timings_file, t.timings_origin = None, None
    elif timings is not None:
        timings.duration = duration
        timings.save(to_abs(t.timings_file))
    db.commit()
    if transcribe:
        runner.enqueue("transcribe", project_id=t.project_id, track_id=t.id,
                       title=f"{kind_title('transcribe')} · {t.language.upper()}")
    track_changed(t.id, "voice")
    return get_track(track_id, db)


@router.post("/tracks/{track_id}/upload/srt")
async def upload_srt(track_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict[str, Any]:
    t = _track(db, track_id)
    raw = (await file.read()).decode("utf-8-sig", errors="replace")
    timings = from_srt(raw, t.script or None, t.audio_duration)
    if not timings.words:
        raise HTTPException(400, "В файле не найдено субтитров (ожидается SRT или VTT)")
    if not t.script.strip():
        t.script, t.script_origin = "\n".join(c[2] for c in parse_srt(raw)), "transcribed"
    apply_timings(db, t, timings)
    db.commit()
    track_changed(t.id, "timings")
    return get_track(track_id, db)


@router.post("/tracks/{track_id}/timings/estimate")
def estimate_timings(track_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Plan scenes before voice-over: synthetic timings from the script."""
    t = _track(db, track_id)
    if not t.script.strip():
        raise HTTPException(400, "Сценарий пуст")
    apply_timings(db, t, estimate(t.script, t.language))
    db.commit()
    return get_track(track_id, db)


@router.delete("/tracks/{track_id}/audio")
def delete_audio(track_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    t = _track(db, track_id)
    p = to_abs(t.audio_file)
    if p and p.exists():
        p.unlink(missing_ok=True)
    t.audio_file = t.audio_duration = t.audio_origin = t.lumean_order_id = None
    db.commit()
    return get_track(track_id, db)


# ------------------------------------------------------------------ downloads
@router.get("/tracks/{track_id}/download/{what}")
def download(track_id: int, what: str, background: BackgroundTasks, db: Session = Depends(get_db)) -> FileResponse:
    t = _track(db, track_id)
    base = safe_filename(t.project.name, "project")
    lang = t.language
    if what == "images":
        tmp = Path(tempfile.mkstemp(suffix=".zip")[1])
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_STORED) as zf:
            for s in t.scenes:
                rel = s.source_scene.image_file if s.source_scene_id and s.source_scene else s.image_file
                p = to_abs(rel)
                if p and p.exists():
                    zf.write(p, f"{s.idx + 1:04d}_{s.start:08.2f}s{p.suffix}")
        background.add_task(tmp.unlink, missing_ok=True)
        return FileResponse(tmp, filename=f"{base}_{lang}_images.zip", media_type="application/zip")
    if what == "scenes":
        tmp = Path(tempfile.mkstemp(suffix=".json")[1])
        tmp.write_text(json.dumps([{"idx": s.idx + 1, "start": s.start, "end": s.end, "text": s.text,
                                    "prompt": s.prompt} for s in t.scenes], ensure_ascii=False, indent=1), encoding="utf-8")
        background.add_task(tmp.unlink, missing_ok=True)
        return FileResponse(tmp, filename=f"{base}_{lang}_scenes.json", media_type="application/json")
    mapping = {"audio": t.audio_file, "srt": t.srt_file, "timings": t.timings_file, "video": t.video_file,
               "preview": t.preview_file, "video_srt": (t.video_meta or {}).get("srt")}
    rel = mapping.get(what)
    p = to_abs(rel)
    if not p or not p.exists():
        raise HTTPException(404, "Файл ещё не создан")
    suffix = {"video_srt": ".srt"}.get(what, p.suffix)
    return FileResponse(p, filename=f"{base}_{lang}_{what}{suffix}" if what != "video" else p.name)


@router.post("/tracks/{track_id}/reveal/{what}")
def reveal(track_id: int, what: str, db: Session = Depends(get_db)) -> dict[str, bool]:
    """Open the system file manager with the file selected (the app runs locally)."""
    t = _track(db, track_id)
    rel = {"video": t.video_file, "audio": t.audio_file, "preview": t.preview_file}.get(what)
    p = to_abs(rel)
    if not p or not p.exists():
        raise HTTPException(404, "Файл ещё не создан")
    try:
        if sys.platform == "win32":
            subprocess.Popen(["explorer", "/select,", str(p)])
        elif sys.platform == "darwin":
            subprocess.Popen(["open", "-R", str(p)])
        else:
            subprocess.Popen(["xdg-open", str(p.parent)])
    except OSError as exc:
        raise HTTPException(500, f"Не удалось открыть папку: {exc}") from exc
    return {"ok": True}


# ============================================================== scenes
@router.get("/tracks/{track_id}/scenes")
def list_scenes(track_id: int, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    t = _track(db, track_id)
    return [scene_to_dict(s) for s in t.scenes]


class ScenePatch(BaseModel):
    prompt: str | None = None
    text: str | None = None
    overrides: dict[str, Any] | None = None
    #: Characters visible in the scene (ids of project characters).
    characters: list[int] | None = None


@router.patch("/scenes/{scene_id}")
def update_scene(scene_id: int, body: ScenePatch, db: Session = Depends(get_db)) -> dict[str, Any]:
    s = _scene(db, scene_id)
    if body.prompt is not None and body.prompt != s.prompt:
        s.prompt, s.prompt_locked = body.prompt.strip(), True
    if body.text is not None:
        s.text = body.text
    if body.overrides is not None:
        s.overrides = {k: v for k, v in body.overrides.items() if v}
    if body.characters is not None:
        s.characters = list(dict.fromkeys(body.characters))
    db.commit()
    return scene_to_dict(s)


@router.post("/scenes/{scene_id}/image")
async def upload_scene_image(scene_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict[str, Any]:
    s = _scene(db, scene_id)
    if Path(file.filename or "").suffix.lower() not in IMAGE_EXT:
        raise HTTPException(400, "Нужен файл изображения (jpg, png, webp)")
    t = s.track
    out_dir = track_dir(t.project_id, t.id, "images")
    raw = await _save_upload(file, out_dir / unique_name(f"upload_{s.id}", ".bin"))
    try:
        img = imread(raw)
    except ValueError as exc:
        raise HTTPException(400, "Не удалось прочитать изображение") from exc
    finally:
        raw.unlink(missing_ok=True)
    dest = imwrite(out_dir / unique_name(f"scene_{s.id}", ".jpg"), img, quality=95)
    old = to_abs(s.image_file)
    if old and old.exists():
        old.unlink(missing_ok=True)
    s.image_file, s.image_status, s.image_error = to_rel(dest), "done", None
    s.image_meta = {"uploaded": True, "filename": file.filename}
    s.source_scene_id = None  # a manual image overrides the shared one
    db.commit()
    return scene_to_dict(s)


@router.delete("/scenes/{scene_id}/image")
def delete_scene_image(scene_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    s = _scene(db, scene_id)
    p = to_abs(s.image_file)
    if p and p.exists():
        p.unlink(missing_ok=True)
    s.image_file, s.image_status, s.image_meta = None, "none", {}
    db.commit()
    return scene_to_dict(s)


class SplitIn(BaseModel):
    at: float | None = None


def _reindex(track: Track) -> None:
    for i, sc in enumerate(sorted(track.scenes, key=lambda x: x.start)):
        sc.idx = i


@router.post("/scenes/{scene_id}/split")
def split_scene(scene_id: int, body: SplitIn, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """Split a scene in two at ``at`` seconds (default: middle, snapped to a word start)."""
    s = _scene(db, scene_id)
    t = s.track
    at = body.at if body.at is not None else (s.start + s.end) / 2
    timings: Timings | None = load_timings(t)
    words_in = [w for w in (timings.words if timings else []) if s.start < w.s < s.end]
    if words_in:
        w = min(words_in, key=lambda x: abs(x.s - at))
        at = w.s
    if not (s.start + 0.5 < at < s.end - 0.5):
        raise HTTPException(400, "Сцена слишком короткая для разделения")
    first_text = " ".join(w.w for w in words_in if w.s < at) or s.text
    second_text = " ".join(w.w for w in words_in if w.s >= at) or s.text
    new = Scene(track_id=t.id, idx=s.idx + 1, start=at, end=s.end, text=second_text, prompt=s.prompt)
    s.end, s.text = at, first_text
    db.add(new)
    db.flush()
    _reindex(t)
    db.commit()
    track_changed(t.id, "scenes")
    return [scene_to_dict(x) for x in t.scenes]


@router.post("/scenes/{scene_id}/merge-next")
def merge_next(scene_id: int, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    s = _scene(db, scene_id)
    t = s.track
    ordered = sorted(t.scenes, key=lambda x: x.start)
    i = next(k for k, x in enumerate(ordered) if x.id == s.id)
    if i + 1 >= len(ordered):
        raise HTTPException(400, "Это последняя сцена")
    nxt = ordered[i + 1]
    s.end = nxt.end
    s.text = f"{s.text} {nxt.text}".strip()
    p = to_abs(nxt.image_file)
    if p and p.exists():
        p.unlink(missing_ok=True)
    db.delete(nxt)
    db.flush()
    db.refresh(t)
    _reindex(t)
    db.commit()
    track_changed(t.id, "scenes")
    return [scene_to_dict(x) for x in t.scenes]
