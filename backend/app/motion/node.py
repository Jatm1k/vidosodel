"""Node.js runtime of the renderer: finding node/npm, installing the renderer's packages, running its CLI."""
from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import threading
from pathlib import Path
from typing import Any

from ..config import ROOT_DIR
from ..render.media import CREATE_NO_WINDOW

log = logging.getLogger(__name__)

MOTION_DIR = ROOT_DIR / "backend" / "motion"
_install_lock = threading.Lock()


class MotionUnavailable(RuntimeError):
    """Node.js or the renderer's packages are missing."""


def _tools_node() -> tuple[Path, Path]:
    base = ROOT_DIR / "tools" / "node"
    if os.name == "nt":
        return base / "node.exe", base / "npm.cmd"
    return base / "bin" / "node", base / "bin" / "npm"


def node_bin() -> str:
    found = shutil.which("node")
    if found:
        return found
    node, _ = _tools_node()
    if node.exists():
        return str(node)
    raise MotionUnavailable("Node.js не найден: перезапустите приложение через start.bat — он установит всё нужное")


def npm_bin() -> str:
    found = shutil.which("npm")
    if found:
        return found
    _, npm = _tools_node()
    if npm.exists():
        return str(npm)
    raise MotionUnavailable("npm не найден")


def installed() -> bool:
    return (MOTION_DIR / "node_modules" / "@napi-rs" / "canvas" / "package.json").exists()


def ensure_installed() -> None:
    """Installs the renderer's runtime packages once (bootstrap normally does it at start)."""
    if installed():
        return
    with _install_lock:
        if installed():
            return
        node = node_bin()
        env = dict(os.environ, PATH=str(Path(node).parent) + os.pathsep + os.environ.get("PATH", ""))
        log.info("installing motion renderer packages")
        proc = subprocess.run([npm_bin(), "install", "--omit=dev", "--no-audit", "--no-fund", "--loglevel=error"],
                              cwd=MOTION_DIR, env=env, capture_output=True, shell=os.name == "nt",
                              creationflags=CREATE_NO_WINDOW, timeout=600)
        if proc.returncode != 0 or not installed():
            raise MotionUnavailable("Не удалось установить пакеты моушн-рендера: "
                                    + proc.stderr.decode("utf-8", "replace")[-600:])


def run_cli(*args: str, timeout: float = 120) -> dict[str, Any]:
    """``node cli.mjs …`` → its JSON answer."""
    ensure_installed()
    proc = subprocess.run([node_bin(), str(MOTION_DIR / "cli.mjs"), *args], cwd=MOTION_DIR, capture_output=True,
                          timeout=timeout, creationflags=CREATE_NO_WINDOW)
    out = proc.stdout.decode("utf-8", "replace").strip()
    if proc.returncode != 0 or not out:
        raise RuntimeError("моушн-рендер: " + (proc.stderr.decode("utf-8", "replace")[-1500:] or f"код {proc.returncode}"))
    return json.loads(out)
