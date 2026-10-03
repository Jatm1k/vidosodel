"""One-command setup and launch for Vidosodel.

Run by ``start.bat`` / ``start.sh``. Every step is idempotent and skipped when
already done, so the same command is used for the first install and daily start:

0. a check for a newer version on GitHub (``git fetch``) with an offer to update;
1. ``.venv`` with backend dependencies (re-installed when requirements.txt changes);
2. ffmpeg (downloaded into ``tools/ffmpeg`` on Windows if not on PATH);
3. the web UI (rebuilt only when frontend sources changed; Node.js is
   downloaded into ``tools/node`` if missing);
4. ``.env`` created from ``.env.example`` on first run;
5. the server is started and the browser opened. When the server exits with
   ``RESTART_EXIT_CODE`` (an update installed from the UI), the launcher runs
   itself again so new dependencies and UI are picked up.

Flags: ``--no-browser``, ``--no-update-check`` (also ``VIDOSODEL_NO_UPDATE_CHECK=1``).

Only the standard library is used here – it runs before dependencies exist.
"""
from __future__ import annotations

import hashlib
import importlib.util
import os
import platform
import shutil
import subprocess
import sys
import tarfile
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
VENV = ROOT / ".venv"
FRONTEND = ROOT / "frontend"
IS_WIN = os.name == "nt"

FFMPEG_WIN_URL = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
NODE_VERSION = "v22.12.0"


def say(msg: str) -> None:
    print(f"  {msg}", flush=True)


def step(msg: str) -> None:
    print(f"\n» {msg}", flush=True)


def run(cmd: list[str], **kw) -> None:
    subprocess.run(cmd, check=True, **kw)


def download(url: str, dest: Path) -> Path:
    say(f"Скачивание {url.rsplit('/', 1)[-1]} …")
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(url) as resp, open(tmp, "wb") as fh:  # noqa: S310 – fixed https URLs
        total = int(resp.headers.get("Content-Length") or 0)
        done = 0
        while chunk := resp.read(1 << 20):
            fh.write(chunk)
            done += len(chunk)
            if total:
                print(f"\r    {done * 100 // total:3d}%", end="", flush=True)
    print()
    tmp.replace(dest)
    return dest


def file_hash(*paths: Path) -> str:
    """Content hash that is identical on every OS and git line-ending setting.

    Paths are hashed in POSIX form and CRLF is normalised, so the committed
    ``frontend/dist/.build-hash`` matches any checkout and users without
    Node.js never need to rebuild the UI after an update.
    """
    h = hashlib.sha256()
    for base in paths:
        if base.is_dir():
            files = sorted((p for p in base.rglob("*") if p.is_file()), key=lambda p: p.relative_to(base).as_posix())
        else:
            files = [base]
        for p in files:
            if base.is_dir():
                h.update(p.relative_to(base).as_posix().encode())
            if p.exists():
                h.update(p.read_bytes().replace(b"\r\n", b"\n"))
    return h.hexdigest()


# ------------------------------------------------------------------ python env
def venv_python() -> Path:
    return VENV / ("Scripts/python.exe" if IS_WIN else "bin/python")


def ensure_venv() -> Path:
    step("Окружение Python")
    if sys.version_info < (3, 11):
        sys.exit("  Нужен Python 3.11 или новее. Установите его с python.org и запустите снова.")
    py = venv_python()
    if not py.exists():
        say("Создание виртуального окружения .venv")
        run([sys.executable, "-m", "venv", str(VENV)])
    req = ROOT / "requirements.txt"
    marker = VENV / ".requirements.sha256"
    digest = file_hash(req)
    if not marker.exists() or marker.read_text() != digest:
        say("Установка зависимостей (только при первом запуске или после обновления)…")
        run([str(py), "-m", "pip", "install", "--disable-pip-version-check", "-q", "--upgrade", "pip"])
        run([str(py), "-m", "pip", "install", "--disable-pip-version-check", "-q", "-r", str(req)])
        marker.write_text(digest)
    else:
        say("Зависимости актуальны")
    return py


# ---------------------------------------------------------------------- ffmpeg
def ensure_ffmpeg() -> None:
    step("ffmpeg")
    local = TOOLS / "ffmpeg" / "bin" / ("ffmpeg.exe" if IS_WIN else "ffmpeg")
    if local.exists() or shutil.which("ffmpeg"):
        say("Найден")
        return
    if not IS_WIN:
        sys.exit("  ffmpeg не найден. Установите его: sudo apt install ffmpeg  (или brew install ffmpeg) и запустите снова.")
    archive = download(FFMPEG_WIN_URL, TOOLS / "ffmpeg.zip")
    say("Распаковка…")
    with zipfile.ZipFile(archive) as zf:
        top = zf.namelist()[0].split("/")[0]
        zf.extractall(TOOLS)
    target = TOOLS / "ffmpeg"
    shutil.rmtree(target, ignore_errors=True)
    (TOOLS / top).rename(target)
    archive.unlink(missing_ok=True)
    say("ffmpeg установлен в tools/ffmpeg")


# ------------------------------------------------------------------------ node
def node_bin() -> tuple[str, str] | None:
    """(node, npm) executables: PATH first, then tools/node."""
    node, npm = shutil.which("node"), shutil.which("npm")
    if node and npm:
        return node, npm
    base = TOOLS / "node"
    if IS_WIN and (base / "node.exe").exists():
        return str(base / "node.exe"), str(base / "npm.cmd")
    if not IS_WIN and (base / "bin" / "node").exists():
        return str(base / "bin" / "node"), str(base / "bin" / "npm")
    return None


def install_node() -> tuple[str, str]:
    machine = platform.machine().lower()
    arch = "arm64" if machine in ("arm64", "aarch64") else "x64"
    if IS_WIN:
        name = f"node-{NODE_VERSION}-win-{arch}"
        archive = download(f"https://nodejs.org/dist/{NODE_VERSION}/{name}.zip", TOOLS / "node.zip")
        with zipfile.ZipFile(archive) as zf:
            zf.extractall(TOOLS)
    else:
        osname = "darwin" if sys.platform == "darwin" else "linux"
        name = f"node-{NODE_VERSION}-{osname}-{arch}"
        archive = download(f"https://nodejs.org/dist/{NODE_VERSION}/{name}.tar.gz", TOOLS / "node.tar.gz")
        with tarfile.open(archive) as tf:
            tf.extractall(TOOLS)  # noqa: S202 – official Node.js archive
    shutil.rmtree(TOOLS / "node", ignore_errors=True)
    (TOOLS / name).rename(TOOLS / "node")
    archive.unlink(missing_ok=True)
    found = node_bin()
    assert found, "Node.js не установился"
    return found


def ensure_frontend() -> None:
    step("Интерфейс")
    dist = FRONTEND / "dist"
    marker = dist / ".build-hash"
    sources = [FRONTEND / "src", FRONTEND / "index.html", FRONTEND / "package.json",
               FRONTEND / "vite.config.ts", FRONTEND / "public"]
    digest = file_hash(*[p for p in sources if p.exists()])
    if (dist / "index.html").exists() and marker.exists() and marker.read_text() == digest:
        say("Собран и актуален")
        return
    tools = node_bin()
    if tools is None:
        say("Node.js не найден — скачиваю портативную версию (нужна только для сборки интерфейса)")
        tools = install_node()
    node, npm = tools
    env = dict(os.environ)
    env["PATH"] = str(Path(node).parent) + os.pathsep + env.get("PATH", "")
    say("Установка пакетов интерфейса…")
    run([npm, "install", "--no-audit", "--no-fund", "--loglevel=error"], cwd=FRONTEND, env=env, shell=IS_WIN)
    say("Сборка интерфейса…")
    run([npm, "run", "build", "--silent"], cwd=FRONTEND, env=env, shell=IS_WIN)
    marker.write_text(digest)


# ------------------------------------------------------------------------- env
def ensure_env() -> None:
    env, example = ROOT / ".env", ROOT / ".env.example"
    if not env.exists() and example.exists():
        shutil.copyfile(example, env)
        say("Создан файл .env — ключи API можно указать в нём или в интерфейсе (Настройки)")


# --------------------------------------------------------------------- updates
#: Version the user chose to skip (not committed, see .gitignore).
SKIP_FILE = ROOT / ".update-skip"


def load_version_module():
    """``backend/app/version.py`` without importing the app package (no dependencies yet)."""
    spec = importlib.util.spec_from_file_location("vidosodel_version", ROOT / "backend" / "app" / "version.py")
    if spec.name in sys.modules:
        return sys.modules[spec.name]
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module  # dataclasses look the module up while it executes
    spec.loader.exec_module(module)
    return module


def check_updates() -> None:
    """Offer to pull a newer version from GitHub. Never blocks the start on errors."""
    if "--no-update-check" in sys.argv or os.environ.get("VIDOSODEL_NO_UPDATE_CHECK") == "1":
        return
    version = load_version_module()
    step(f"Версия {version.read_version()}")
    if not version.is_git_checkout():
        say("Установлена без git — проверка обновлений пропущена")
        return
    say("Проверка обновлений…")
    info = version.check_for_update(fetch=True)
    if info.error:
        say(info.error)
        return
    if not info.available:
        say("Установлена последняя версия")
        return
    latest = info.latest or "новая"
    if SKIP_FILE.exists() and SKIP_FILE.read_text("utf-8").strip() == latest:
        say(f"Доступна версия {latest} (пропущена по вашему выбору)")
        return
    print(f"\n  Доступна версия {latest} (у вас {info.current}).", flush=True)
    for note in info.notes[:5]:
        print(f"\n  [{note['version']}] {note['date']}")
        for line in note["body"].splitlines()[:25]:
            print(f"    {line}")
    if not info.notes:
        say(f"Новых изменений: {info.behind} (подробности в CHANGELOG.md)")
    if info.blocker:
        say(info.blocker)
        return
    if not sys.stdin or not sys.stdin.isatty():
        say("Обновление можно установить из интерфейса или запустив start.bat в консоли")
        return
    try:
        answer = input("\n  Обновить сейчас? [Д]а / [н]ет / [п]ропустить эту версию: ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        return
    if answer in ("п", "g", "s", "skip"):  # "g" – "п" typed on an English layout
        SKIP_FILE.write_text(latest, "utf-8")
        return
    if answer not in ("", "д", "да", "y", "yes", "l"):  # "l" – "д" typed on an English layout
        return
    ok, out = version.apply_update()
    if not ok:
        say(f"Не удалось обновиться: {out}")
        return
    SKIP_FILE.unlink(missing_ok=True)
    say(f"Обновлено до {latest}. Перезапуск…")
    relaunch()


def relaunch(*extra: str) -> None:
    """Run this (possibly updated) script again and exit with its code."""
    args = dict.fromkeys([*sys.argv[1:], *extra, "--no-update-check"])
    sys.exit(subprocess.run([sys.executable, str(Path(__file__).resolve()), *args]).returncode)


def main() -> None:
    print("\nVidosodel — подготовка к запуску")
    check_updates()
    py = ensure_venv()
    ensure_ffmpeg()
    ensure_frontend()
    ensure_env()
    step("Запуск")
    # SUPERVISED: the server may exit with RESTART_EXIT_CODE to be started again (after an update).
    env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1", VIDOSODEL_SUPERVISED="1")
    if "--no-browser" in sys.argv:
        env["VIDOSODEL_NO_BROWSER"] = "1"
    try:
        proc = subprocess.run([str(py), "-m", "app"], cwd=ROOT / "backend", env=env, check=False)
    except KeyboardInterrupt:
        return
    if proc.returncode == load_version_module().RESTART_EXIT_CODE:
        step("Перезапуск после обновления")
        relaunch("--no-browser")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        sys.exit(f"\n  Ошибка на шаге установки: {exc}. Проверьте подключение к интернету и запустите снова.")
