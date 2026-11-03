"""Background removal: a picture of one subject → the subject with a transparent background.

BiRefNet-lite (MIT) in ONNX, downloaded on first use to ``data/models`` (≈ 224 MB) and run with onnxruntime –
on the GPU via DirectML on Windows, otherwise on the CPU. Used for the cut-outs of motion graphics: characters
and objects drawn in the channel's picture style that the graphics place into their scenes.
"""
from __future__ import annotations

import logging
import threading
from collections.abc import Callable
from pathlib import Path

import cv2
import httpx
import numpy as np

from ..config import get_settings

log = logging.getLogger(__name__)

MODEL_URL = "https://huggingface.co/onnx-community/BiRefNet_lite-ONNX/resolve/main/onnx/model.onnx"
MODEL_NAME = "birefnet_lite.onnx"
_SIZE = 1024

_session = None
_lock = threading.Lock()


class MattingUnavailable(RuntimeError):
    """Background removal cannot run here (no onnxruntime or the model failed to download)."""


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
                        progress(f"Загрузка модели вырезания фона: {done >> 20} из {total >> 20} МБ")
        if part.stat().st_size < 50 << 20:
            raise MattingUnavailable("модель вырезания фона скачалась не полностью")
        part.replace(path)
    except httpx.HTTPError as e:
        part.unlink(missing_ok=True)
        raise MattingUnavailable(f"не удалось скачать модель вырезания фона ({str(e).splitlines()[0]})") from e
    return path


def _get_session(progress: Callable[[str], None] | None = None):
    global _session
    with _lock:
        if _session is None:
            try:
                import onnxruntime as ort
            except ImportError as e:
                raise MattingUnavailable("не установлен onnxruntime (перезапустите приложение)") from e
            path = ensure_model(progress)
            providers = [p for p in ("DmlExecutionProvider", "CPUExecutionProvider") if p in ort.get_available_providers()]
            try:
                _session = ort.InferenceSession(str(path), providers=providers)
            except Exception:  # noqa: BLE001 – some graphs fail on DirectML: the CPU always works
                log.warning("matting model failed on %s, falling back to CPU", providers, exc_info=True)
                _session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
            log.info("matting model loaded, providers %s", _session.get_providers())
        return _session


def alpha_of(bgr: np.ndarray, progress: Callable[[str], None] | None = None) -> np.ndarray:
    """Alpha matte (uint8, the picture's size) of the main subject."""
    sess = _get_session(progress)
    h, w = bgr.shape[:2]
    x = cv2.resize(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), (_SIZE, _SIZE), interpolation=cv2.INTER_LINEAR)
    x = (x.astype(np.float32) / 255 - (0.485, 0.456, 0.406)) / (0.229, 0.224, 0.225)
    with _lock:  # one inference at a time: the model takes a lot of GPU memory
        out = sess.run(None, {sess.get_inputs()[0].name: x.transpose(2, 0, 1)[None].astype(np.float32)})
    pred = np.asarray(out[-1] if len(out) > 1 else out[0], dtype=np.float32).reshape(_SIZE, _SIZE)
    if pred.min() < 0 or pred.max() > 1:  # logits
        pred = 1 / (1 + np.exp(-pred))
    a = cv2.resize(pred, (w, h), interpolation=cv2.INTER_LINEAR)
    return np.clip(a * 255, 0, 255).astype(np.uint8)


def _solid_inside(bgr: np.ndarray, a: np.ndarray, keep: np.ndarray) -> np.ndarray:
    """The model sometimes leaves parts of a figure half transparent when their colour is close to the plain
    background (a grey shirt on grey). Inside the figure's outline (holes filled), everything that differs from the
    background colour becomes solid; real gaps of background (between an arm and the body) stay transparent."""
    h, w = a.shape
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    border = np.concatenate([lab[:6].reshape(-1, 3), lab[-6:].reshape(-1, 3), lab[:, :6].reshape(-1, 3), lab[:, -6:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    if np.percentile(np.linalg.norm(border - bg, axis=1), 90) > 14:
        return a  # the background is not plain: nothing to compare with
    hard = ((a > 128) & (keep > 0)).astype(np.uint8)
    # fill the holes of the outline: what the border cannot reach is inside the figure
    outside = np.pad(1 - hard, 1, constant_values=1)  # a ring around: the flood starts outside any figure
    cv2.floodFill(outside, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 2)
    inside = (outside[1:-1, 1:-1] != 2).astype(np.uint8)
    inside = cv2.erode(inside, np.ones((3, 3), np.uint8))
    dist = np.linalg.norm(lab - bg, axis=2)
    key = np.clip((dist - 9) / 14, 0, 1)
    key = cv2.GaussianBlur(key, (3, 3), 0)
    return np.where(inside > 0, np.maximum(a, (key * 255).astype(np.uint8)), a)


def cut_out(src: Path, dest: Path, progress: Callable[[str], None] | None = None, pad: int = 24) -> tuple[int, int]:
    """Saves ``src`` without its background as a PNG cropped to the subject; returns its size.

    Raises :class:`MattingUnavailable` and ``ValueError`` (nothing found on the picture).
    """
    from .media import imread  # noqa: PLC0415

    bgr = imread(src)
    if bgr is None:
        raise ValueError("картинка не читается")
    bgr = bgr[:, :, :3]
    a = alpha_of(bgr, progress)
    # keep the largest blob (stray specks of the background go), soft edges stay
    mask = (a > 128).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if n <= 1:
        raise ValueError("на картинке не нашлось предмета")
    keep = np.zeros_like(mask)
    big = stats[1:, cv2.CC_STAT_AREA].max()
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= big * 0.08:  # several parts of one subject stay
            keep[labels == i] = 1
    keep = cv2.dilate(keep, np.ones((9, 9), np.uint8))
    a = (a.astype(np.float32) * keep).astype(np.uint8)
    a = _solid_inside(bgr, a, keep)
    ys, xs = np.where(a > 12)
    if not len(xs):
        raise ValueError("на картинке не нашлось предмета")
    x0, x1 = max(0, xs.min() - pad), min(bgr.shape[1], xs.max() + pad + 1)
    y0, y1 = max(0, ys.min() - pad), min(bgr.shape[0], ys.max() + pad + 1)
    # the background colour bleeds into soft edges: pull edge pixels towards the subject's own colours
    inner = cv2.erode((a > 200).astype(np.uint8), np.ones((5, 5), np.uint8))
    if inner.any():
        blurred = cv2.blur(bgr * inner[:, :, None], (15, 15)).astype(np.float32)
        weight = cv2.blur(inner.astype(np.float32), (15, 15))[:, :, None]
        fill = np.where(weight > 0.01, blurred / np.maximum(weight, 0.01), bgr).astype(np.uint8)
        edge = ((a > 0) & (a < 230))[:, :, None]
        bgr = np.where(edge, fill, bgr)
    rgba = np.dstack([bgr, a])[y0:y1, x0:x1]
    dest.parent.mkdir(parents=True, exist_ok=True)
    ok, buf = cv2.imencode(".png", rgba)
    if not ok:
        raise ValueError("не удалось сохранить PNG")
    dest.write_bytes(buf.tobytes())
    return rgba.shape[1], rgba.shape[0]
