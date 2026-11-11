"""Bounded per-worker video decoder (trim, shot window, speed, duration fitting) and clip analysis.

Clip audio is never used: the narration and the app's own sound design are the only soundtrack.
"""
from collections import OrderedDict
from pathlib import Path

import cv2
import numpy as np

from .media import cover_fit


class FootageReader:
    def __init__(self, width, height):
        self.width, self.height = width, height
        self._cache = OrderedDict()

    def frame(self, path, elapsed, duration, *, fit="freeze", offset=0., speed=1., end=None):
        """Frame at ``elapsed`` seconds of a scene of ``duration``. ``offset``/``end`` – the part of the
        clip the scene plays (one shot of a multishot clip); ``end`` None – to the end of the clip."""
        if path not in self._cache:
            cap = cv2.VideoCapture(str(Path(path)), cv2.CAP_FFMPEG)
            if not cap.isOpened():
                cap.release()
                raise ValueError("Не удалось открыть видеоклип")
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.
            count = max(1, int(cap.get(cv2.CAP_PROP_FRAME_COUNT)))
            self._cache[path] = [cap, fps, count, -1, None]
            if len(self._cache) > 4:
                _, old = self._cache.popitem(last=False)
                old[0].release()
        self._cache.move_to_end(path)
        entry = self._cache[path]
        cap, fps, count, last, frame = entry
        first = min(count - 1, max(0, int(offset * fps)))
        stop = count if end is None else max(first + 1, min(count, int(end * fps)))
        available = max(1, stop - first)
        playback_speed = max(.05, speed)
        # Duration fitting may only slow a short clip down. A longer clip keeps
        # its selected speed and is cut at the scene boundary in every mode.
        if fit == "stretch" and available / fps / playback_speed < duration:
            target = first + int(max(0, elapsed) / max(.01, duration) * (available - 1))
        else:
            target = int(max(0, elapsed) * playback_speed * fps)
            target = first + (target % available if fit == "loop" else min(available - 1, target))
        target = min(stop - 1, max(first, target))
        if target != last or frame is None:
            if target != last + 1:
                cap.set(cv2.CAP_PROP_POS_FRAMES, target)
            ok, decoded = cap.read()
            if not ok:
                raise ValueError(f"Не удалось прочитать кадр {target} видеоклипа")
            frame = cover_fit(decoded, self.width, self.height)
            entry[3], entry[4] = target, frame
        return frame.copy()

    def close(self):
        for entry in self._cache.values():
            entry[0].release()
        self._cache.clear()


def frame_at(path, seconds: float):
    """A full-resolution frame of the clip at ``seconds`` (clamped to the last decodable frame)."""
    cap = cv2.VideoCapture(str(Path(path)), cv2.CAP_FFMPEG)
    try:
        if not cap.isOpened():
            raise ValueError("Не удалось открыть видеоклип")
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.
        count = max(1, int(cap.get(cv2.CAP_PROP_FRAME_COUNT)))
        target = max(0, min(count - 1, int(seconds * fps)))
        for index in range(target, max(-1, target - 15), -1):
            cap.set(cv2.CAP_PROP_POS_FRAMES, index)
            ok, frame = cap.read()
            if ok:
                return frame
        raise ValueError("Не удалось прочитать кадр видеоклипа")
    finally:
        cap.release()


def detect_cuts(path, shots: int, expected: list[float]) -> list[float]:
    """Start times of shots 2..``shots`` of a multishot clip.

    Hard cuts are the strongest jumps of the frame difference, at least 0.6 s apart. When the clip does not
    show ``shots - 1`` clear cuts, the requested shot lengths (``expected`` start times) are used.
    """
    if shots < 2:
        return []
    cap = cv2.VideoCapture(str(Path(path)), cv2.CAP_FFMPEG)
    diffs, previous = [], None
    try:
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            small = cv2.cvtColor(cv2.resize(frame, (64, 36), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2HSV)
            hist = cv2.calcHist([small], [0, 1, 2], None, [8, 4, 4], [0, 180, 0, 256, 0, 256]).flatten()
            hist /= max(1., hist.sum())
            if previous is not None:
                diffs.append(float(np.abs(hist - previous[0]).sum()) +
                             float(np.abs(small.astype(np.int16) - previous[1]).mean()) / 64)
            previous = (hist, small.astype(np.int16))
    finally:
        cap.release()
    if len(diffs) < shots * 3:
        return list(expected)
    values = np.array(diffs)
    baseline = float(np.median(values)) + 1e-6
    gap = max(1, int(.6 * fps))
    picked: list[int] = []
    for index in np.argsort(values)[::-1]:
        if values[index] < max(.25, baseline * 4):
            break
        if all(abs(index - p) >= gap for p in picked):
            picked.append(int(index))
        if len(picked) == shots - 1:
            break
    if len(picked) != shots - 1:
        return list(expected)
    return [round((p + 1) / fps, 3) for p in sorted(picked)]
