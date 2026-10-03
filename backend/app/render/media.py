"""ffmpeg/ffprobe helpers and image I/O shared by the render engine and jobs."""
from __future__ import annotations

import json
import logging
import os
import subprocess
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np

from ..config import ffmpeg_bin, ffprobe_bin

log = logging.getLogger(__name__)

#: Hide console windows of child processes on Windows.
CREATE_NO_WINDOW = 0x08000000 if os.name == "nt" else 0


def run(cmd: list[str], *, cwd: Path | None = None, timeout: float | None = None) -> subprocess.CompletedProcess:
    """Run a command, raising ``RuntimeError`` with the stderr tail on failure."""
    proc = subprocess.run(
        cmd, cwd=cwd, capture_output=True, timeout=timeout, creationflags=CREATE_NO_WINDOW,
    )
    if proc.returncode != 0:
        tail = proc.stderr.decode("utf-8", "replace")[-2000:]
        raise RuntimeError(f"{Path(cmd[0]).name} завершился с ошибкой:\n{tail}")
    return proc


def probe_duration(path: Path) -> float:
    out = run([ffprobe_bin(), "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)])
    return float(json.loads(out.stdout)["format"]["duration"])


def ffmpeg_version() -> str | None:
    try:
        out = run([ffmpeg_bin(), "-version"], timeout=15)
        return out.stdout.decode(errors="replace").splitlines()[0]
    except Exception:  # noqa: BLE001
        return None


# ----------------------------------------------------------------------- encoders
#: Candidate H.264 encoders in order of preference.
_HW_ENCODERS = ["h264_nvenc", "h264_qsv", "h264_amf"]


@lru_cache
def available_encoders() -> list[str]:
    """Encoders that actually work on this machine (a 1-frame test encode each)."""
    found = ["libx264"]
    for enc in _HW_ENCODERS:
        try:
            run([ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i",
                 "color=c=black:s=320x240:d=0.1", "-frames:v", "1", "-c:v", enc, "-f", "null", "-"], timeout=30)
            found.append(enc)
        except Exception:  # noqa: BLE001 – encoder missing or no hardware
            continue
    return found


def pick_encoder(preference: str) -> str:
    encs = available_encoders()
    if preference in encs:
        return preference
    if preference == "auto":
        for enc in _HW_ENCODERS:
            if enc in encs:
                return enc
    return "libx264"


#: (crf/cq, x264 preset, nvenc preset)
_QUALITY = {
    "max": (16, "slow", "p7"),
    "high": (18, "medium", "p6"),
    "balanced": (20, "fast", "p5"),
    "fast": (23, "veryfast", "p3"),
}


def encoder_args(encoder: str, quality: str, fps: int, threads: int | None = None, *, preview: bool = False) -> list[str]:
    """Video encoder arguments producing YouTube-friendly H.264 High, yuv420p, BT.709."""
    crf, x264_preset, nv_preset = _QUALITY.get(quality, _QUALITY["high"])
    gop = str(max(1, fps * 2))
    if preview:
        args = ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "26"]
    elif encoder == "h264_nvenc":
        args = ["-c:v", "h264_nvenc", "-preset", nv_preset, "-rc", "vbr", "-cq", str(crf + 1), "-b:v", "0",
                "-maxrate", "24M", "-bufsize", "48M", "-spatial-aq", "1", "-bf", "2"]
    elif encoder == "h264_qsv":
        args = ["-c:v", "h264_qsv", "-preset", "slower", "-global_quality", str(crf + 2), "-look_ahead", "1"]
    elif encoder == "h264_amf":
        args = ["-c:v", "h264_amf", "-quality", "quality", "-rc", "cqp",
                "-qp_i", str(crf), "-qp_p", str(crf + 2), "-qp_b", str(crf + 4)]
    else:
        args = ["-c:v", "libx264", "-preset", x264_preset, "-crf", str(crf),
                "-maxrate", "30M", "-bufsize", "60M", "-tune", "film"]
        if threads:
            args += ["-threads", str(threads)]
    args += ["-profile:v", "high", "-pix_fmt", "yuv420p", "-g", gop,
             "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv"]
    return args


# -------------------------------------------------------------------------- images
def imread(path: Path) -> np.ndarray:
    """Read an image as BGR uint8. Works with non-ASCII Windows paths (cv2.imread does not)."""
    data = np.fromfile(str(path), dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"не удалось прочитать изображение: {path.name}")
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif img.shape[2] == 4:
        alpha = img[:, :, 3:4].astype(np.float32) / 255.0
        img = (img[:, :, :3].astype(np.float32) * alpha).astype(np.uint8)
    return img


def imwrite(path: Path, img: np.ndarray, quality: int = 95) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    ext = path.suffix.lower() or ".jpg"
    params = [cv2.IMWRITE_JPEG_QUALITY, quality] if ext in (".jpg", ".jpeg") else []
    ok, buf = cv2.imencode(ext, img, params)
    if not ok:
        raise ValueError(f"не удалось сохранить изображение {path.name}")
    tmp = path.with_name(path.name + ".tmp")
    buf.tofile(str(tmp))
    tmp.replace(path)
    return path


def cover_fit(img: np.ndarray, width: int, height: int) -> np.ndarray:
    """Scale and center-crop ``img`` to exactly ``width``×``height`` (high quality)."""
    h, w = img.shape[:2]
    scale = max(width / w, height / h)
    nw, nh = max(width, round(w * scale)), max(height, round(h * scale))
    interp = cv2.INTER_AREA if scale < 1 else cv2.INTER_LANCZOS4
    resized = cv2.resize(img, (nw, nh), interpolation=interp)
    if scale > 1.15:
        # Recover some crispness lost by upscaling (gentle unsharp mask).
        blur = cv2.GaussianBlur(resized, (0, 0), sigmaX=1.2)
        resized = cv2.addWeighted(resized, 1.35, blur, -0.35, 0)
    x, y = (nw - width) // 2, (nh - height) // 2
    return np.ascontiguousarray(resized[y:y + height, x:x + width])


# --------------------------------------------------------------------------- watermark
#: Alpha map of the Gemini "sparkle" (64×64 patch around a 48 px star), measured
#: from real generations: a white star blended at ~50% opacity.
_SPARKLE_FILE = Path(__file__).with_name("assets") / "gemini_sparkle_alpha.png"
#: Match score needed at the standard spot / anywhere else in the corner.
_SPARKLE_SCORE_EXPECTED = 0.55
_SPARKLE_SCORE_ELSEWHERE = 0.8


@lru_cache(maxsize=8)
def _sparkle_alpha(scale: float) -> np.ndarray:
    alpha = cv2.imread(str(_SPARKLE_FILE), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255.0
    if scale != 1.0:
        size = max(8, round(alpha.shape[0] * scale))
        alpha = cv2.resize(alpha, (size, size), interpolation=cv2.INTER_LINEAR)
    return alpha


def _unblend_test(gray: np.ndarray, x0: int, y0: int, scale: float) -> bool:
    """Does un-blending the star at this spot make its outline vanish?

    With the watermark present the star rim is brighter than its surroundings,
    and after reversing the alpha blend the rim matches them. Without it, the
    reversal carves a dark star instead. Works on bright/textured backgrounds
    where plain template matching is weak.
    """
    alpha = _sparkle_alpha(scale)
    size = alpha.shape[0]
    if x0 < 0 or y0 < 0 or y0 + size > gray.shape[0] or x0 + size > gray.shape[1]:
        return False
    patch = gray[y0:y0 + size, x0:x0 + size].astype(np.float32)
    k = np.ones((3, 3), np.uint8)
    star = (alpha > 0.3).astype(np.uint8)
    inner = (star - cv2.erode(star, k, iterations=max(1, round(3 * scale)))).astype(bool)
    outer = (cv2.dilate(star, k, iterations=max(2, round(4 * scale)))
             - cv2.dilate(star, k, iterations=max(1, round(scale)))).astype(bool)
    a = np.minimum(alpha, 0.95)
    restored = (patch - a * 255.0) / (1.0 - a)
    before = float(np.median(patch[inner]) - np.median(patch[outer]))
    after = float(np.median(restored[inner]) - np.median(restored[outer]))
    return before > 30 and abs(after) < before * 0.4


def find_sparkle(img: np.ndarray) -> tuple[int, int, float, float] | None:
    """Locate the Gemini sparkle watermark: ``(x0, y0, scale, score)`` of its patch or ``None``.

    Gemini-based models (Nano Banana via Gemini, Flower) stamp it on *some* images:
    a 48 px star 32 px from the bottom-right corner (96 px / 64 px on large images).
    The corner is searched at a few scales so resized outputs are found too.
    """
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.ndim == 3 else img
    best: tuple[int, int, float, float] | None = None
    for scale in (1.0, 2.0, 0.75, 1.5, 1.25, 2.5):
        tpl = _sparkle_alpha(scale)
        size = tpl.shape[0]
        rw, rh = min(w, max(int(w * 0.3), size * 3)), min(h, max(int(h * 0.3), size * 3))
        if size >= rw or size >= rh:
            continue
        region = gray[h - rh:, w - rw:].astype(np.float32)
        res = cv2.matchTemplate(region, tpl, cv2.TM_CCOEFF_NORMED)
        # Standard placement: star centre at (w - 56·s, h - 56·s) → patch corner 88·s from the edge.
        ex, ey = rw - round(88 * scale), rh - round(88 * scale)
        candidates = []
        if scale in (1.0, 2.0) and 0 <= ex < res.shape[1] and 0 <= ey < res.shape[0]:
            win = res[max(0, ey - 3):ey + 4, max(0, ex - 3):ex + 4]
            _, score, _, loc = cv2.minMaxLoc(win)
            x, y = max(0, ex - 3) + loc[0], max(0, ey - 3) + loc[1]
            if score < _SPARKLE_SCORE_EXPECTED and _unblend_test(gray, w - rw + ex, h - rh + ey, scale):
                x, y, score = ex, ey, _SPARKLE_SCORE_EXPECTED  # weak match, but the un-blend test confirms it
            candidates.append((score, x, y, _SPARKLE_SCORE_EXPECTED))
        _, score, _, loc = cv2.minMaxLoc(res)
        candidates.append((score, loc[0], loc[1], _SPARKLE_SCORE_ELSEWHERE))
        for score, x, y, need in candidates:
            if score >= need and (best is None or score > best[3]):
                best = (w - rw + x, h - rh + y, scale, float(score))
        if best and best[3] > 0.9:
            break
    return best


def remove_watermark(img: np.ndarray, method: str = "auto") -> tuple[np.ndarray, bool]:
    """Remove the Gemini sparkle if present. Returns ``(image, removed)``.

    ``auto`` reverses the alpha blending (restores the real pixels under the
    semi-transparent star) and smooths the antialiased rim; ``crop`` cuts the
    corner away keeping 16:9; ``none`` leaves the image untouched.
    """
    if method == "none":
        return img, False
    found = find_sparkle(img)
    if not found:
        return img, False
    x0, y0, scale, _ = found
    h, w = img.shape[:2]
    if method == "crop":
        cut = max(w - x0, h - y0) + 4
        return cover_fit(img[: h - cut, : w - cut], w, h), True
    alpha = _sparkle_alpha(scale)
    size = alpha.shape[0]
    patch = img[y0:y0 + size, x0:x0 + size].astype(np.float32)
    a = np.minimum(alpha[: patch.shape[0], : patch.shape[1], None], 0.95)
    restored = np.clip((patch - a * 255.0) / (1.0 - a), 0, 255).astype(np.uint8)
    out = img.copy()
    out[y0:y0 + size, x0:x0 + size] = restored
    # The soft rim does not invert exactly (JPEG ringing) – let inpainting blend it.
    rim = ((a[..., 0] > 0.04) & (a[..., 0] < 0.4)).astype(np.uint8) * 255
    rim = cv2.dilate(rim, np.ones((3, 3), np.uint8))
    mask = np.zeros((h, w), np.uint8)
    mask[y0:y0 + rim.shape[0], x0:x0 + rim.shape[1]] = rim
    return cv2.inpaint(out, mask, 2, cv2.INPAINT_TELEA), True


def make_thumbnail(src: Path, dest: Path, width: int = 1280, height: int = 720) -> Path:
    """YouTube thumbnail: 1280×720 JPEG under 2 MB."""
    img = cover_fit(imread(src), width, height)
    for q in (92, 85, 78, 70):
        imwrite(dest, img, quality=q)
        if dest.stat().st_size < 2 * 1024 * 1024:
            break
    return dest
