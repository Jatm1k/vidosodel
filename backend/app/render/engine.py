"""Video render engine.

Pipeline::

    plan (scenes, motions, transitions, look)
      └─ N worker processes, each renders a frame range:
           numpy/OpenCV frames ──raw BGR pipe──▶ ffmpeg (+ASS subtitles) ──▶ segment.mp4
      └─ audio: two-pass loudnorm to −14 LUFS (+ subtle EQ for uniqueness) ──▶ audio.m4a
      └─ concat segments (stream copy) + audio ──▶ final.mp4 (faststart, clean metadata)

Any frame is a pure function of the plan and its index, so ranges render
independently and in parallel; segments are joined without re-encoding.
"""
from __future__ import annotations

import json
import logging
import math
import multiprocessing as mp
import os
import random
import shutil
import subprocess
import threading
import time
from collections import OrderedDict
from collections.abc import Callable
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import asdict, dataclass, field
from pathlib import Path

import numpy as np

from ..config import ffmpeg_bin
from .look import LookParams, LookProcessor
from .media import CREATE_NO_WINDOW, cover_fit, encoder_args, imread, run
from . import depth as depth_mod
from .motion import make_motion, max_zoom, render_view
from .parallax import ParallaxRenderer, prepare_layers
from .transitions import blend

log = logging.getLogger(__name__)

RESOLUTIONS = {"1080p": (1920, 1080), "1440p": (2560, 1440), "2160p": (3840, 2160), "360p": (640, 360), "540p": (960, 540)}


@dataclass
class PlanScene:
    image: str          # absolute path
    start: float
    end: float
    effect: str
    seed: int
    #: Transition from the previous scene into this one (``cut`` or a name).
    transition: str = "cut"
    #: Camera of a ``parallax`` shot (see :mod:`.parallax`); ``None`` → plain 2D motion.
    shot: dict | None = None


@dataclass
class RenderPlan:
    width: int
    height: int
    fps: int
    duration: float
    scenes: list[PlanScene]
    look: dict
    intensity: float = 0.5
    transition_duration: float = 0.6
    fade_in: float = 0.6
    fade_out: float = 1.2
    #: Absolute time of frame 0 (used by previews of a fragment).
    time_offset: float = 0.0
    encoder: str = "libx264"
    quality: str = "high"
    preview: bool = False
    subtitles_ass: str | None = None
    fonts_dir: str | None = None
    extra: dict = field(default_factory=dict)

    @property
    def total_frames(self) -> int:
        return max(1, int(math.ceil(self.duration * self.fps)))

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> RenderPlan:
        d = dict(d)
        d["scenes"] = [PlanScene(**s) for s in d["scenes"]]
        return cls(**d)


# ============================================================== frame generation
class FrameRenderer:
    """Renders frames of a plan. One instance per worker process."""

    def __init__(self, plan: RenderPlan):
        self.plan = plan
        self.look = LookProcessor(LookParams(**plan.look), plan.width, plan.height)
        self._zmax = max_zoom(plan.intensity)
        self._cache: OrderedDict[str, np.ndarray] = OrderedDict()
        self._layers_cache: OrderedDict[str, tuple | None] = OrderedDict()
        self._parallax: ParallaxRenderer | None = None
        self._motions = [make_motion(s.effect, plan.intensity, s.seed) for s in plan.scenes]
        self._starts = [s.start for s in plan.scenes]
        # Half of a transition happens before the boundary, half after.
        self._td = [0.0 if (i == 0 or s.transition == "cut") else plan.transition_duration
                    for i, s in enumerate(plan.scenes)]

    def _source(self, path: str) -> np.ndarray:
        """Source image cover-fitted to output size × max zoom (cached, LRU of 4)."""
        img = self._cache.get(path)
        if img is None:
            w = int(self.plan.width * self._zmax)
            h = int(self.plan.height * self._zmax)
            img = cover_fit(imread(Path(path)), w, h)
            self._cache[path] = img
            if len(self._cache) > 4:
                self._cache.popitem(last=False)
        else:
            self._cache.move_to_end(path)
        return img

    def _layers(self, path: str):
        """Parallax layers of an image (LRU of 3), ``None`` when its depth map is missing."""
        if path in self._layers_cache:
            self._layers_cache.move_to_end(path)
            return self._layers_cache[path]
        depth = depth_mod.load(Path(path))
        layers = None if depth is None else prepare_layers(imread(Path(path)), depth, self.plan.width, self.plan.height)
        self._layers_cache[path] = layers
        if len(self._layers_cache) > 3:
            self._layers_cache.popitem(last=False)
        return layers

    def _scene_frame(self, idx: int, t: float) -> np.ndarray:
        s = self.plan.scenes[idx]
        # Motion progress spans the scene plus the transition halves around it.
        lead = self._td[idx] / 2
        tail = self._td[idx + 1] / 2 if idx + 1 < len(self.plan.scenes) else 0.0
        span = max(0.1, (s.end + tail) - (s.start - lead))
        u = (t - (s.start - lead)) / span
        lp = self.look.p
        if s.shot:
            layers = self._layers(s.image)
            if layers is not None:
                if self._parallax is None:
                    self._parallax = ParallaxRenderer(self.plan.width, self.plan.height)
                return self._parallax.frame(layers, s.shot, u, t, extra_zoom=lp.micro_zoom,
                                            offset=(lp.offset_x, lp.offset_y))
        return render_view(self._source(s.image), self._motions[idx](u), self.plan.width, self.plan.height,
                           extra_zoom=lp.micro_zoom, offset=(lp.offset_x, lp.offset_y))

    def _scene_index(self, t: float) -> int:
        lo, hi = 0, len(self._starts) - 1
        while lo < hi:  # last scene whose start <= t
            mid = (lo + hi + 1) // 2
            if self._starts[mid] <= t:
                lo = mid
            else:
                hi = mid - 1
        return lo

    def frame(self, n: int) -> np.ndarray:
        p = self.plan
        t = p.time_offset + n / p.fps
        i = self._scene_index(t)
        frame = None
        # Incoming transition of scene i (t just after its start)?
        td = self._td[i]
        if td and t < p.scenes[i].start + td / 2:
            prog = (t - (p.scenes[i].start - td / 2)) / td
            frame = blend(p.scenes[i].transition, self._scene_frame(i - 1, t), self._scene_frame(i, t), prog)
        # Outgoing transition into scene i+1 (t just before the next start)?
        elif i + 1 < len(p.scenes) and self._td[i + 1]:
            td_n = self._td[i + 1]
            nstart = p.scenes[i + 1].start
            if t >= nstart - td_n / 2:
                prog = (t - (nstart - td_n / 2)) / td_n
                frame = blend(p.scenes[i + 1].transition, self._scene_frame(i, t), self._scene_frame(i + 1, t), prog)
        if frame is None:
            frame = self._scene_frame(i, t)
        fade = 1.0
        if p.fade_in > 0 and t < p.fade_in:
            fade = t / p.fade_in
        end_t = p.extra.get("video_end", p.duration + p.time_offset)
        if p.fade_out > 0 and t > end_t - p.fade_out:
            fade = min(fade, max(0.0, (end_t - t) / p.fade_out))
        return self.look.apply(frame, fade)


# ================================================================ worker process
def _filter_path(path: str, cwd: Path) -> str:
    """Path usable inside an ffmpeg filter graph.

    A relative path avoids the drive colon (``C:``) that the filter parser
    treats as an option separator; across drives the colon is escaped instead.
    """
    try:
        return Path(os.path.relpath(path, cwd)).as_posix()
    except ValueError:  # different drive on Windows
        return "'" + Path(path).as_posix().replace(":", r"\:") + "'"


def _render_segment(plan_dict: dict, first: int, last: int, out_path: str, threads: int,
                    progress_q, cancel_ev) -> str:
    """Render frames ``[first, last)`` into ``out_path``. Runs in a worker process."""
    plan = RenderPlan.from_dict(plan_dict)
    fr = FrameRenderer(plan)
    out = Path(out_path)
    vf = []
    cwd = out.parent
    if plan.subtitles_ass:
        t0 = plan.time_offset + first / plan.fps
        fonts = f":fontsdir={_filter_path(plan.fonts_dir, cwd)}" if plan.fonts_dir else ""
        # Subtitle file is referenced relative to cwd → no Windows path escaping issues.
        vf += [f"setpts=PTS+{t0:.6f}/TB", f"ass={Path(plan.subtitles_ass).name}{fonts}", "setpts=PTS-STARTPTS"]
    vf += ["scale=out_color_matrix=bt709:out_range=tv", "format=yuv420p"]
    cmd = [
        ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{plan.width}x{plan.height}", "-r", str(plan.fps), "-i", "pipe:0",
        "-vf", ",".join(vf), *encoder_args(plan.encoder, plan.quality, plan.fps, threads, preview=plan.preview),
        "-an", out.name,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd,
                            creationflags=CREATE_NO_WINDOW)
    stderr_chunks: list[bytes] = []
    reader = threading.Thread(target=lambda: stderr_chunks.append(proc.stderr.read()), daemon=True)
    reader.start()
    try:
        batch = 0
        for n in range(first, last):
            if cancel_ev.is_set():
                raise RuntimeError("cancelled")
            proc.stdin.write(fr.frame(n).tobytes())
            batch += 1
            if batch >= 12:
                progress_q.put(batch)
                batch = 0
        progress_q.put(batch)
        proc.stdin.close()
    except (BrokenPipeError, OSError):
        pass
    except Exception:
        proc.kill()
        raise
    finally:
        rc = proc.wait()
        reader.join(timeout=5)
    if rc != 0:
        tail = b"".join(stderr_chunks).decode("utf-8", "replace")[-1500:]
        raise RuntimeError(f"ffmpeg (сегмент) завершился с ошибкой:\n{tail}")
    return out_path


# ===================================================================== audio
def prepare_audio(src: Path, dest: Path, *, loudness: float, eq_seed: int | None, start: float = 0.0,
                  duration: float | None = None) -> Path:
    """Two-pass EBU R128 loudness normalisation → AAC 48 kHz stereo.

    ``eq_seed`` adds an inaudible random EQ tilt (±0.6 dB) for uniqueness.
    """
    trim = []
    if start > 0:
        trim += ["-ss", f"{start:.3f}"]
    if duration:
        trim += ["-t", f"{duration:.3f}"]
    eq = ""
    if eq_seed is not None:
        r = random.Random(eq_seed)
        eq = (f"equalizer=f={r.randint(90, 160)}:t=q:w=1:g={r.uniform(-0.6, 0.6):.2f},"
              f"equalizer=f={r.randint(2500, 6000)}:t=q:w=1.2:g={r.uniform(-0.6, 0.6):.2f},")
    target = f"I={loudness}:TP=-1.5:LRA=11"
    measure = run([ffmpeg_bin(), "-hide_banner", "-nostats", *trim, "-i", str(src),
                   "-af", f"{eq}loudnorm={target}:print_format=json", "-f", "null", "-"])
    text = measure.stderr.decode("utf-8", "replace")
    m = json.loads(text[text.rfind("{"):text.rfind("}") + 1])
    second = (f"{eq}loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:"
              "linear=true,aresample=48000")
    dest.parent.mkdir(parents=True, exist_ok=True)
    run([ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y", *trim, "-i", str(src), "-af", second,
         "-ac", "2", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", str(dest)])
    return dest


# ==================================================================== orchestrator
def default_workers(plan: RenderPlan) -> int:
    cpus = os.cpu_count() or 4
    pixels = plan.width * plan.height
    per = 2 if pixels <= 1920 * 1080 else 3  # cores per worker (numpy + x264 threads)
    return max(1, min(8, cpus // per))


def render_video(
    plan: RenderPlan, audio: Path, out_path: Path, work_dir: Path, *,
    workers: int = 0, metadata: dict[str, str] | None = None, loudness: float = -14.0,
    audio_eq_seed: int | None = None, strip_metadata: bool = True,
    progress: Callable[[float, str], None] | None = None, should_stop: Callable[[], bool] | None = None,
) -> Path:
    """Render ``plan`` + ``audio`` into ``out_path``. Returns the output path."""
    work_dir.mkdir(parents=True, exist_ok=True)
    for old in work_dir.glob("seg_*.mp4"):
        old.unlink(missing_ok=True)
    if plan.subtitles_ass:
        local_ass = work_dir / "subs.ass"
        if Path(plan.subtitles_ass) != local_ass:
            shutil.copyfile(plan.subtitles_ass, local_ass)
        plan.subtitles_ass = str(local_ass)

    def report(value: float, msg: str) -> None:
        if progress:
            progress(value, msg)

    # --- audio first (fast; fails early on a broken file) ------------------------
    report(0.01, "Обработка звука (нормализация громкости)")
    audio_out = work_dir / "audio.m4a"
    prepare_audio(audio, audio_out, loudness=loudness, eq_seed=audio_eq_seed,
                  start=plan.time_offset, duration=plan.duration if plan.preview else None)

    # --- video segments ----------------------------------------------------------
    total = plan.total_frames
    n_workers = workers or default_workers(plan)
    seg_len = max(plan.fps * 10, math.ceil(total / (n_workers * 3)))
    ranges = [(a, min(total, a + seg_len)) for a in range(0, total, seg_len)]
    threads = max(1, (os.cpu_count() or 4) // n_workers)
    plan_dict = plan.to_dict()

    manager = mp.Manager()
    progress_q = manager.Queue()
    cancel_ev = manager.Event()
    done_frames = 0
    started = time.time()
    seg_paths = [str(work_dir / f"seg_{k:04d}.mp4") for k in range(len(ranges))]
    try:
        with ProcessPoolExecutor(max_workers=n_workers, mp_context=mp.get_context("spawn")) as pool:
            futures = [pool.submit(_render_segment, plan_dict, a, b, seg_paths[k], threads, progress_q, cancel_ev)
                       for k, (a, b) in enumerate(ranges)]
            pending = set(futures)
            while pending:
                while not progress_q.empty():
                    done_frames += progress_q.get_nowait()
                if should_stop and should_stop():
                    cancel_ev.set()
                    for f in pending:
                        f.cancel()
                    raise InterruptedError("Рендер отменён")
                frac = done_frames / total
                elapsed = time.time() - started
                eta = elapsed / frac * (1 - frac) if frac > 0.02 else None
                speed = done_frames / elapsed / plan.fps if elapsed > 0 else 0
                msg = f"Кадры {done_frames}/{total} · {speed:.2f}x реального времени"
                if eta:
                    msg += f" · осталось ~{_fmt_eta(eta)}"
                report(0.03 + 0.92 * frac, msg)
                finished = {f for f in pending if f.done()}
                for f in finished:
                    f.result()  # re-raise worker errors
                pending -= finished
                time.sleep(0.5)
            for f in as_completed(futures):
                f.result()
    finally:
        manager.shutdown()

    # --- concat + mux --------------------------------------------------------------
    report(0.96, "Сборка финального файла")
    list_file = work_dir / "segments.txt"
    list_file.write_text("".join(f"file '{Path(p).name}'\n" for p in seg_paths), encoding="utf-8")
    meta_args: list[str] = ["-map_metadata", "-1", "-map_chapters", "-1"] if strip_metadata else []
    for k, v in (metadata or {}).items():
        meta_args += ["-metadata", f"{k}={v}"]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_out = work_dir / "final.mp4"
    run([ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y",
         "-f", "concat", "-safe", "0", "-i", list_file.name, "-i", audio_out.name,
         "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-t", f"{plan.duration:.3f}",
         *meta_args, "-movflags", "+faststart", tmp_out.name], cwd=work_dir)
    shutil.move(str(tmp_out), out_path)
    for p in seg_paths:
        Path(p).unlink(missing_ok=True)
    report(1.0, "Готово")
    return out_path


def _fmt_eta(sec: float) -> str:
    sec = int(sec)
    if sec >= 3600:
        return f"{sec // 3600} ч {sec % 3600 // 60} мин"
    if sec >= 60:
        return f"{sec // 60} мин {sec % 60} с"
    return f"{sec} с"
