"""Monocular depth maps and subject detection for the 3D parallax effect.

Depth comes from Depth Anything V2 Small (ONNX, Apache-2.0), run through
onnxruntime – on the GPU via DirectML on Windows, otherwise on the CPU. The
model (~100 MB) is downloaded on first use into ``data/models``.

Results are cached next to each image::

    images/.depth/<stem>.png    16-bit inverse depth (65535 = nearest), at model resolution
    images/.depth/<stem>.json   {"cx", "cy", "depth", "face"} – where the camera should look

Everything here runs in the main render process before frames are drawn;
workers only read the cached files.
"""
from __future__ import annotations

import json
import logging
import threading
from collections.abc import Callable
from pathlib import Path

import cv2
import httpx
import numpy as np

from ..config import get_settings
from .media import imread, imwrite

log = logging.getLogger(__name__)

MODEL_URL = "https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx"
MODEL_NAME = "depth_anything_v2_small.onnx"
_INPUT_H = 518  # model trained at 518 px; width keeps the aspect ratio (multiple of 14)

_session = None
_session_lock = threading.Lock()


class DepthUnavailable(RuntimeError):
    """Depth estimation cannot run here (no onnxruntime or the model failed to download)."""


def model_path() -> Path:
    return get_settings().data_dir / "models" / MODEL_NAME


def ensure_model(progress: Callable[[str], None] | None = None) -> Path:
    path = model_path()
    if path.exists():
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_suffix(".part")
    try:
        with httpx.stream("GET", MODEL_URL, follow_redirects=True, timeout=60) as r:
            r.raise_for_status()
            total = int(r.headers.get("content-length") or 0)
            done, last = 0, -1
            with part.open("wb") as f:
                for chunk in r.iter_bytes(1 << 20):
                    f.write(chunk)
                    done += len(chunk)
                    pct = done * 100 // total if total else 0
                    if progress and pct // 10 != last:
                        last = pct // 10
                        progress(f"Загрузка модели глубины: {done >> 20} из {total >> 20} МБ")
        if part.stat().st_size < 10 << 20:
            raise DepthUnavailable("модель глубины скачалась не полностью")
        part.replace(path)
    except httpx.HTTPError as e:
        part.unlink(missing_ok=True)
        raise DepthUnavailable(f"не удалось скачать модель глубины ({str(e).splitlines()[0]})") from e
    return path


def _get_session(progress: Callable[[str], None] | None = None):
    global _session
    with _session_lock:
        if _session is None:
            try:
                import onnxruntime as ort
            except ImportError as e:
                raise DepthUnavailable("не установлен onnxruntime (перезапустите приложение)") from e
            path = ensure_model(progress)
            providers = [p for p in ("DmlExecutionProvider", "CPUExecutionProvider")
                         if p in ort.get_available_providers()]
            _session = ort.InferenceSession(str(path), providers=providers)
            log.info("depth model loaded, providers %s", _session.get_providers())
        return _session


def estimate(bgr: np.ndarray, progress: Callable[[str], None] | None = None) -> np.ndarray:
    """Inverse depth normalised to [0, 1] (1 = near) at the model's resolution (518 px high)."""
    sess = _get_session(progress)
    h, w = bgr.shape[:2]
    iw = max(14, round(w / h * _INPUT_H / 14) * 14)
    x = cv2.resize(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), (iw, _INPUT_H), interpolation=cv2.INTER_CUBIC)
    x = (x.astype(np.float32) / 255 - (0.485, 0.456, 0.406)) / (0.229, 0.224, 0.225)
    d = sess.run(None, {sess.get_inputs()[0].name: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    lo, hi = np.percentile(d, [2, 98])
    return np.clip((d - lo) / max(float(hi - lo), 1e-6), 0, 1).astype(np.float32)


_face_cascade = None


def find_subject(bgr: np.ndarray, depth: np.ndarray) -> dict:
    """Where a close-up should point: the most prominent face, else the nearest mass."""
    global _face_cascade
    if _face_cascade is None:
        _face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    h, w = bgr.shape[:2]
    gray = cv2.equalizeHist(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY))
    faces = _face_cascade.detectMultiScale(gray, 1.1, 6, minSize=(w // 25, w // 25))
    best, best_score = None, 0.0
    for x, y, fw, fh in faces:
        cx, cy = (x + fw / 2) / w, (y + fh * 0.6) / h
        d = float(depth[min(h - 1, int(cy * h)), min(w - 1, int(cx * w))])
        # Big, near and central wins: a passer-by at the edge is rarely the hero.
        central = 1.25 - min(1.0, abs(cx - 0.5) * 1.6 + abs(cy - 0.45))
        score = fw * fh * (0.3 + d) * central
        if score > best_score:
            best, best_score = {"cx": cx, "cy": cy, "depth": d, "face": True}, score
    if best:
        return best
    # No face: centroid of the nearest fifth of the frame, ignoring the bottom strip (floor/table).
    d = depth.copy()
    d[int(h * 0.85):] = 0
    thr = np.percentile(d, 80)
    ys, xs = np.nonzero(d >= thr)
    if not len(xs):
        return {"cx": 0.5, "cy": 0.45, "depth": 0.5, "face": False}
    return {"cx": float(xs.mean() / w), "cy": float(ys.mean() / h),
            "depth": float(np.median(d[d >= thr])), "face": False}


def face_subject(image: Path) -> dict:
    """Subject without a depth map (depth unavailable): the most prominent face, else the centre."""
    bgr = imread(image)
    return find_subject(bgr, np.full(bgr.shape[:2], 0.5, dtype=np.float32))


def cache_paths(image: Path) -> tuple[Path, Path]:
    d = image.parent / ".depth"
    return d / f"{image.stem}.png", d / f"{image.stem}.json"


def ensure(image: Path, progress: Callable[[str], None] | None = None) -> dict:
    """Depth map + subject for ``image`` (computed once, then read from the cache)."""
    png, meta = cache_paths(image)
    mtime = image.stat().st_mtime
    if png.exists() and meta.exists() and png.stat().st_mtime >= mtime:
        return json.loads(meta.read_text(encoding="utf-8"))
    bgr = imread(image)
    depth = estimate(bgr, progress)
    full = cv2.resize(depth, (bgr.shape[1], bgr.shape[0]), interpolation=cv2.INTER_LINEAR)
    subject = find_subject(bgr, full)
    # Stored small (it is blurred before use anyway): ~0.5 MB instead of ~2 MB per image.
    imwrite(png, (depth * 65535).astype(np.uint16))
    meta.write_text(json.dumps(subject), encoding="utf-8")
    return subject


def prune(image_dir: Path) -> None:
    """Drop cached depth of images that no longer exist (regenerated or deleted)."""
    cache = image_dir / ".depth"
    if not cache.is_dir():
        return
    alive = {p.stem for p in image_dir.iterdir() if p.is_file()}
    for f in cache.iterdir():
        if f.stem not in alive:
            f.unlink(missing_ok=True)


def load(image: Path) -> np.ndarray | None:
    """Cached depth as float32 [0, 1] (model resolution), or ``None``."""
    png, _ = cache_paths(image)
    if not png.exists():
        return None
    d = cv2.imdecode(np.fromfile(png, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    return None if d is None else d.astype(np.float32) / 65535
