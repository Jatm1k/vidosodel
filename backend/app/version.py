"""Application version and self-update through git.

The single source of the version is the ``VERSION`` file in the repository root
(Semantic Versioning: ``MAJOR.MINOR.PATCH``). Release notes live in
``CHANGELOG.md`` (Keep a Changelog format); ``scripts/release.py`` bumps both.

Updates are ``git pull --ff-only`` from the branch the checkout tracks. They are
offered only when it is safe: the program files have no local edits and there
are no local commits that would conflict.

This module uses only the standard library: ``scripts/bootstrap.py`` loads it
by path before the virtual environment exists.
"""
from __future__ import annotations

import re
import shutil
import subprocess
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
VERSION_FILE = ROOT / "VERSION"
CHANGELOG_FILE = ROOT / "CHANGELOG.md"
#: Exit code the server uses to ask the launcher for a restart (after an update).
RESTART_EXIT_CODE = 75

_NO_WINDOW = 0x08000000 if hasattr(subprocess, "STARTUPINFO") else 0


def read_version(text: str | None = None) -> str:
    raw = text if text is not None else (VERSION_FILE.read_text("utf-8") if VERSION_FILE.exists() else "0.0.0")
    return raw.strip() or "0.0.0"


__version__ = read_version()


def parse_version(v: str) -> tuple[int, ...]:
    """``"1.10.2"`` → ``(1, 10, 2)``; anything unparsable sorts first."""
    parts = re.findall(r"\d+", v.split("-")[0])
    return tuple(int(p) for p in parts[:3]) if parts else (0,)


# --------------------------------------------------------------------------- changelog
_SECTION = re.compile(r"^## \[(?P<version>[^\]]+)\](?:\s*[-–—]\s*(?P<date>\S+))?", re.M)


def changelog_sections(text: str) -> list[dict[str, str]]:
    """Split a Keep a Changelog file into ``{version, date, body}`` entries (newest first)."""
    matches = list(_SECTION.finditer(text))
    out = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[m.end():end].strip()
        # Drop link reference definitions that may trail the last section.
        body = re.sub(r"^\[[^\]]+\]:\s*\S+\s*$", "", body, flags=re.M).strip()
        out.append({"version": m["version"], "date": m["date"] or "", "body": body})
    return out


def notes_between(changelog: str, current: str) -> list[dict[str, str]]:
    """Released sections newer than ``current``."""
    cur = parse_version(current)
    return [s for s in changelog_sections(changelog)
            if s["version"].lower() != "unreleased" and parse_version(s["version"]) > cur]


# --------------------------------------------------------------------------- git
def _git(*args: str, timeout: float = 20) -> tuple[int, str]:
    exe = shutil.which("git")
    if not exe:
        return 127, "git не установлен"
    try:
        proc = subprocess.run([exe, *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8",
                              errors="replace", timeout=timeout, creationflags=_NO_WINDOW)
    except (OSError, subprocess.TimeoutExpired) as exc:
        return 1, str(exc)
    return proc.returncode, (proc.stdout or proc.stderr).strip()


def is_git_checkout() -> bool:
    return (ROOT / ".git").exists() and shutil.which("git") is not None


@dataclass
class UpdateInfo:
    current: str
    latest: str | None = None
    #: Commits on the remote branch that are not here yet.
    behind: int = 0
    #: Local commits not on the remote (a development checkout).
    ahead: int = 0
    #: Tracked program files changed locally.
    dirty: bool = False
    branch: str | None = None
    remote: str | None = None
    notes: list[dict[str, str]] = field(default_factory=list)
    #: Why an update cannot be applied automatically (None when it can).
    blocker: str | None = None
    error: str | None = None

    @property
    def available(self) -> bool:
        return self.behind > 0

    @property
    def can_apply(self) -> bool:
        return self.available and self.blocker is None

    def to_dict(self) -> dict[str, Any]:
        return {**asdict(self), "available": self.available, "can_apply": self.can_apply}


def check_for_update(fetch: bool = True) -> UpdateInfo:
    """Compare the checkout with its upstream branch (``git fetch`` first when ``fetch``)."""
    info = UpdateInfo(current=read_version())
    if not is_git_checkout():
        info.error = "Программа установлена не через git — автообновление недоступно"
        return info
    code, upstream = _git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
    if code != 0:
        info.error = "У ветки нет удалённого репозитория (git remote / upstream не настроен)"
        return info
    info.branch = upstream
    info.remote = _git("remote", "get-url", upstream.split("/", 1)[0])[1] or None
    if fetch:
        code, out = _git("fetch", "--quiet", "--tags", timeout=30)
        if code != 0:
            info.error = f"Не удалось проверить обновления: {out.splitlines()[-1] if out else 'нет связи'}"
            return info
    code, counts = _git("rev-list", "--left-right", "--count", f"HEAD...{upstream}")
    if code != 0:
        info.error = counts
        return info
    ahead, behind = (int(x) for x in counts.split())
    info.ahead, info.behind = ahead, behind
    info.dirty = bool(_git("status", "--porcelain", "--untracked-files=no")[1])
    if behind:
        code, remote_version = _git("show", f"{upstream}:VERSION")
        info.latest = read_version(remote_version) if code == 0 else None
        code, remote_log = _git("show", f"{upstream}:CHANGELOG.md")
        if code == 0:
            info.notes = notes_between(remote_log, info.current)
        if info.dirty:
            info.blocker = ("Файлы программы изменены локально — обновите вручную: "
                            "git stash, git pull, git stash pop")
        elif ahead:
            info.blocker = "Есть локальные коммиты — обновите вручную: git pull --rebase"
    return info


def apply_update() -> tuple[bool, str]:
    """Fast-forward to the upstream branch. Returns ``(ok, git output)``."""
    info = check_for_update(fetch=False)
    if not info.can_apply:
        return False, info.blocker or info.error or "Обновлений нет"
    code, out = _git("pull", "--ff-only", "--quiet", timeout=120)
    return code == 0, out
