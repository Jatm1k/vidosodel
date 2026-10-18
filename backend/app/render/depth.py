"""Monocular depth maps and subject detection for the 3D parallax effect.

Depth comes from Depth Anything V2 Small (ONNX, Apache-2.0), run through
onnxruntime – on the GPU via DirectML on Windows, otherwise on the CPU. The
model (~100 MB) is downloaded on first use into ``data/models``.

Results are cached next to each image::

    images/.depth/<stem>.png    16-bit inverse depth (65535 = nearest), at model resolution
    images/.depth/<stem>.json   {"cx", "cy", "depth", "face", "points"} – the hero and other
                                things worth a closer shot (see :func:`find_points`)

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


_cascades: dict[str, cv2.CascadeClassifier] = {}


def _cascade(name: str) -> cv2.CascadeClassifier:
    if name not in _cascades:
        _cascades[name] = cv2.CascadeClassifier(cv2.data.haarcascades + name)
    return _cascades[name]


def _faces(gray: np.ndarray, depth: np.ndarray) -> list[dict]:
    """Frontal faces and profiles (both directions), biggest first, without duplicates."""
    h, w = gray.shape
    flat = float(depth.max() - depth.min()) < 1e-3
    found = []
    for name, flip, neighbours, size in (("haarcascade_frontalface_default.xml", False, 6, w // 30),
                                         ("haarcascade_profileface.xml", False, 12, w // 18),
                                         ("haarcascade_profileface.xml", True, 12, w // 18)):
        g = cv2.flip(gray, 1) if flip else gray
        for x, y, fw, fh in _cascade(name).detectMultiScale(g, 1.1, neighbours, minSize=(size, size)):
            if flip:
                x = w - x - fw
            found.append(((x + fw / 2) / w, (y + fh * 0.55) / h, fw / w, fh / h, not name.endswith("profileface.xml")))
    near = float(np.percentile(depth, 70))
    out: list[dict] = []
    for cx, cy, fw, fh, frontal in sorted(found, key=lambda f: (not f[4], -f[2])):
        if cy > 0.88 or any(abs(cx - o["cx"]) < max(fw, o["w"]) * 0.7 and abs(cy - o["cy"]) < max(fh, o["h"]) * 0.7
                            for o in out):
            continue
        px, py = min(w - 1, int(cx * w)), min(h - 1, int(cy * h))
        d = float(depth[py, px])
        if not flat:
            if not frontal and d < near:
                continue  # a profile on a far layer is a pattern in the background
            # A real head stands out from what is behind it; a "face" in a wall pattern does not.
            r = int(fw * w * 1.5)
            ring = depth[max(0, py - r):py + r, max(0, px - r):px + r]
            if out and d - float(np.percentile(ring, 20)) < 0.06:
                continue
        if out and fw < out[0]["w"] * 0.5:
            continue  # much smaller than the hero: a passer-by or a false hit
        out.append({"kind": "face", "cx": cx, "cy": cy, "w": fw, "h": fh, "depth": d})
    return out


def _figures(depth: np.ndarray) -> list[dict]:
    """Separate near masses (a person without a visible face, a prop), biggest and nearest first."""
    h, w = depth.shape
    sm = cv2.resize(depth, (192, max(1, round(192 * h / w))), interpolation=cv2.INTER_AREA)
    H, W = sm.shape
    u8 = (sm * 255).astype(np.uint8)
    t, _ = cv2.threshold(u8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    mask = (u8 >= max(t, np.percentile(u8, 55))).astype(np.uint8)
    mask[int(H * 0.97):] = 0
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask)
    out = []
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        # too small to frame, or so big it is the floor / the whole foreground
        if not H * W * 0.03 <= area <= H * W * 0.3 or bw > W * 0.6:
            continue
        out.append({"kind": "figure", "cx": float((x + bw / 2) / W), "cy": float((y + bh * 0.3) / H),
                    "w": bw / W, "h": bh / H, "top": y / H, "depth": float(np.median(sm[lab == i])),
                    "area": area / (H * W)})
    out.sort(key=lambda o: -o["area"] * o["depth"])
    return out[:3]


def _detail(gray: np.ndarray, depth: np.ndarray, away: float) -> dict | None:
    """The busiest near spot at least a third of the frame away from ``away`` (x of the hero)."""
    h, w = gray.shape
    W, H = 160, max(1, round(160 * h / w))
    edges = cv2.Canny(cv2.resize(gray, (W, H), interpolation=cv2.INTER_AREA), 60, 160).astype(np.float32) / 255
    near = cv2.resize(depth, (W, H), interpolation=cv2.INTER_AREA)
    # what a medium shot (≈¾ of the frame) would hold around each point
    score = cv2.blur(edges * (0.3 + near), (int(W * 0.35) | 1, int(H * 0.35) | 1))
    xs = np.arange(W) / W
    hero = float(score[:, int(min(max(away, 0), 0.999) * W)].max())
    score[:, np.abs(xs - away) < 0.33] = 0
    score[:int(H * 0.15)] = score[int(H * 0.85):] = 0  # the window must fit
    y, x = np.unravel_index(int(np.argmax(score)), score.shape)
    if score[y, x] < hero * 0.6 or score[y, x] <= 0:
        return None  # nothing there but background
    return {"kind": "detail", "cx": round((x + 0.5) / W, 4), "cy": round((y + 0.5) / H, 4),
            "depth": round(float(near[y, x]), 4)}


def find_points(bgr: np.ndarray, depth: np.ndarray, hero: dict | None = None) -> list[dict]:
    """Things worth a closer shot: every face, near masses that hold no face, and a detail.

    Each point is ``{"kind": "face"|"figure"|"detail", "cx", "cy", "depth", ...}`` in
    normalised image coordinates; ``cy`` of a figure sits in its upper part (where a head
    would be) and ``top`` is its upper edge. A detail (the busiest spot away from ``hero``) is
    added only when the picture has fewer than two faces or figures.
    """
    gray = cv2.equalizeHist(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY))
    points = _faces(gray, depth)
    if float(depth.max() - depth.min()) < 1e-3:
        return points
    for f in _figures(depth):
        x0, x1 = f["cx"] - f["w"] / 2, f["cx"] + f["w"] / 2
        if any(x0 <= p["cx"] <= x1 and f["top"] - 0.05 <= p["cy"] <= f["top"] + f["h"] for p in points):
            continue  # its face is already a point
        if any(abs(f["cx"] - p["cx"]) < 0.12 and abs(f["cy"] - p["cy"]) < 0.15 for p in points):
            continue
        points.append({k: round(v, 4) if isinstance(v, float) else v for k, v in f.items() if k != "area"})
    if len(points) < 2:
        hx = hero["cx"] if hero else points[0]["cx"] if points else 0.5
        detail = _detail(gray, depth, hx)
        if detail:
            points.append(detail)
    return points


def face_subject(image: Path) -> dict:
    """Subject without a depth map (depth unavailable): the most prominent face, else the centre."""
    bgr = imread(image)
    flat = np.full(bgr.shape[:2], 0.5, dtype=np.float32)
    subject = find_subject(bgr, flat)
    return {**subject, "points": find_points(bgr, flat, subject)}


def cache_paths(image: Path) -> tuple[Path, Path]:
    d = image.parent / ".depth"
    return d / f"{image.stem}.png", d / f"{image.stem}.json"


def ensure(image: Path, progress: Callable[[str], None] | None = None) -> dict:
    """Depth map + subject for ``image`` (computed once, then read from the cache)."""
    png, meta = cache_paths(image)
    mtime = image.stat().st_mtime
    if png.exists() and meta.exists() and png.stat().st_mtime >= mtime:
        subject = json.loads(meta.read_text(encoding="utf-8"))
        if "points" in subject:
            return subject
        depth = load(image)  # cached before points existed: only the cheap part is redone
    else:
        depth = None
    bgr = imread(image)
    if depth is None:
        depth = estimate(bgr, progress)
        # Stored small (it is blurred before use anyway): ~0.5 MB instead of ~2 MB per image.
        imwrite(png, (depth * 65535).astype(np.uint16))
    full = cv2.resize(depth, (bgr.shape[1], bgr.shape[0]), interpolation=cv2.INTER_LINEAR)
    subject = find_subject(bgr, full)
    subject["points"] = find_points(bgr, full, subject)
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
