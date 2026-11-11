"""Bounded per-worker video decoder, supporting trim, speed and duration fitting."""
from collections import OrderedDict
from pathlib import Path

import cv2

from .media import cover_fit


class FootageReader:
    def __init__(self, width, height):
        self.width, self.height = width, height
        self._cache = OrderedDict()

    def frame(self, path, elapsed, duration, *, fit="freeze", offset=0., speed=1.):
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
        available = max(1, count - first)
        playback_speed = max(.05, speed)
        # Duration fitting may only slow a short clip down. A longer clip keeps
        # its selected speed and is cut at the scene boundary in every mode.
        if fit == "stretch" and available / fps / playback_speed < duration:
            target = first + int(max(0, elapsed) / max(.01, duration) * (available - 1))
        else:
            target = int(max(0, elapsed) * playback_speed * fps)
            target = first + (target % available if fit == "loop" else min(available - 1, target))
        target = min(count - 1, max(first, target))
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
