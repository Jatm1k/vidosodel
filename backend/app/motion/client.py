"""Frame server client of a render worker.

Each render worker process starts one ``node render.mjs`` with the video's motion document and asks it for
frames over a pipe: an opaque frame of a motion scene, or the overlays at a moment (RGBA, composited here only
inside the bounding box of what was drawn). ~5–10 ms per 1080p frame.
"""
from __future__ import annotations

import json
import struct
import subprocess

import cv2
import numpy as np

from ..render.media import CREATE_NO_WINDOW
from .node import MOTION_DIR, ensure_installed, node_bin


class MotionClient:
    def __init__(self, doc_path: str, width: int, height: int):
        ensure_installed()
        self.w, self.h = width, height
        self._proc = subprocess.Popen([node_bin(), str(MOTION_DIR / "render.mjs"), doc_path, str(width), str(height)],
                                      stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                                      cwd=MOTION_DIR, bufsize=0, creationflags=CREATE_NO_WINDOW)
        self._buf = bytearray(width * height * 4)

    def _ask(self, req: dict) -> np.ndarray | None:
        proc = self._proc
        proc.stdin.write((json.dumps(req) + "\n").encode())
        head = self._read(4)
        n = struct.unpack("<I", head)[0]
        if n == 0:
            return None
        if n != len(self._buf):
            raise RuntimeError(f"моушн-рендер вернул {n} байт вместо {len(self._buf)}")
        view = memoryview(self._buf)
        got = 0
        while got < n:
            k = proc.stdout.readinto(view[got:n])
            if not k:
                raise RuntimeError("моушн-рендер завершился")
            got += k
        return np.frombuffer(self._buf, np.uint8).reshape(self.h, self.w, 4)

    def _read(self, n: int) -> bytes:
        out = b""
        while len(out) < n:
            chunk = self._proc.stdout.read(n - len(out))
            if not chunk:
                raise RuntimeError("моушн-рендер завершился")
            out += chunk
        return out

    def scene(self, scene_id: str, t: float) -> np.ndarray:
        """BGR frame of a motion scene at ``t`` seconds of the scene."""
        rgba = self._ask({"scene": scene_id, "t": round(t, 4)})
        if rgba is None:
            return np.zeros((self.h, self.w, 3), np.uint8)
        return cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGR)

    def overlay(self, frame: np.ndarray, t: float) -> np.ndarray:
        """``frame`` with the overlays active at absolute time ``t`` drawn over it."""
        rgba = self._ask({"overlay": True, "t": round(t, 4)})
        if rgba is None:
            return frame
        alpha = rgba[:, :, 3]
        x, y, w, h = cv2.boundingRect(alpha)
        if w == 0 or h == 0:
            return frame
        out = frame.copy() if not frame.flags.writeable else frame
        a = alpha[y:y + h, x:x + w, None].astype(np.uint16)
        fg = cv2.cvtColor(np.ascontiguousarray(rgba[y:y + h, x:x + w]), cv2.COLOR_RGBA2BGR).astype(np.uint16)
        bg = out[y:y + h, x:x + w].astype(np.uint16)
        out[y:y + h, x:x + w] = ((fg * a + bg * (255 - a) + 127) // 255).astype(np.uint8)
        return out

    def close(self) -> None:
        try:
            self._proc.stdin.close()
            self._proc.wait(timeout=5)
        except Exception:  # noqa: BLE001
            self._proc.kill()
