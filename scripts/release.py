"""Cut a release: bump the version, close the changelog section, build the UI, commit and tag.

Usage (from the repository root)::

    python scripts/release.py patch          # 1.2.3 → 1.2.4  – fixes only
    python scripts/release.py minor          # 1.2.3 → 1.3.0  – new features
    python scripts/release.py major          # 1.2.3 → 2.0.0  – incompatible changes
    python scripts/release.py 1.4.0          # explicit version
    python scripts/release.py minor --push   # also push the commit and the tag
    python scripts/release.py minor --dry-run

What it does:

1. checks that everything except CHANGELOG.md is committed and that the
   ``## [Unreleased]`` section of CHANGELOG.md describes the changes;
2. moves that text into ``## [X.Y.Z] - YYYY-MM-DD`` and leaves an empty Unreleased;
3. writes ``VERSION`` and the version in ``frontend/package.json``;
4. rebuilds ``frontend/dist`` (it is committed, so users don't need Node.js);
5. commits ``release: vX.Y.Z`` and creates the annotated tag ``vX.Y.Z``;
6. moves the stable branch ``main`` to the release (when run from ``dev``).

Users' copies track ``main``, so only releases reach them: they get one on the
next start (``start.bat`` offers to update) or from the "Доступна версия" badge
in the UI. Day-to-day work happens in ``dev`` – see docs/DEVELOPMENT.md.
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import bootstrap  # noqa: E402 – sibling script, reused for the UI build

version = bootstrap.load_version_module()
CHANGELOG = ROOT / "CHANGELOG.md"
#: Branch that users' copies track; it only ever receives releases.
STABLE_BRANCH = "main"
PACKAGE_JSON = ROOT / "frontend" / "package.json"
UNRELEASED = re.compile(r"^## \[Unreleased\][^\n]*\n(?P<body>.*?)(?=^## \[|\Z)", re.M | re.S)


def git(*args: str, capture: bool = True) -> str:
    proc = subprocess.run(["git", *args], cwd=ROOT, capture_output=capture, text=True, encoding="utf-8")
    if proc.returncode != 0:
        sys.exit(f"git {' '.join(args)}: {(proc.stderr or proc.stdout or '').strip()}")
    return (proc.stdout or "").strip()


def ref_exists(ref: str) -> bool:
    return subprocess.run(["git", "rev-parse", "--verify", "--quiet", ref], cwd=ROOT,
                          capture_output=True).returncode == 0


def next_version(current: str, bump: str) -> str:
    if re.fullmatch(r"\d+\.\d+\.\d+", bump):
        return bump
    major, minor, patch = (list(version.parse_version(current)) + [0, 0, 0])[:3]
    if bump == "major":
        return f"{major + 1}.0.0"
    if bump == "minor":
        return f"{major}.{minor + 1}.0"
    if bump == "patch":
        return f"{major}.{minor}.{patch + 1}"
    sys.exit(f"Неизвестный тип версии: {bump} (patch, minor, major или X.Y.Z)")


def main() -> None:
    # A Windows console defaults to cp1251, which has no "→" used in the output.
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Выпуск новой версии Vidosodel")
    parser.add_argument("bump", help="patch | minor | major | X.Y.Z")
    parser.add_argument("--push", action="store_true", help="отправить коммит и тег на GitHub")
    parser.add_argument("--dry-run", action="store_true", help="только показать, что будет сделано")
    args = parser.parse_args()

    current = version.read_version()
    new = next_version(current, args.bump)
    if version.parse_version(new) <= version.parse_version(current):
        sys.exit(f"Новая версия {new} должна быть больше текущей {current}")
    if git("tag", "--list", f"v{new}"):
        sys.exit(f"Тег v{new} уже существует")
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    if branch != STABLE_BRANCH:
        if not ref_exists(STABLE_BRANCH) and ref_exists(f"origin/{STABLE_BRANCH}"):
            git("branch", STABLE_BRANCH, f"origin/{STABLE_BRANCH}")  # a clone that checked out dev only
        if ref_exists(STABLE_BRANCH) and subprocess.run(
                ["git", "merge-base", "--is-ancestor", STABLE_BRANCH, "HEAD"], cwd=ROOT).returncode != 0:
            sys.exit(f"Ветка {STABLE_BRANCH} содержит коммиты, которых нет в {branch} — сначала влейте их: "
                     f"git merge {STABLE_BRANCH}")

    # git() strips the output, so the first line may lose the leading space of its " M" status.
    changed = [line.split(maxsplit=1)[1] for line in git("status", "--porcelain").splitlines()]
    dirty = [path for path in changed if path != "CHANGELOG.md"]
    if dirty:
        sys.exit("Сначала закоммитьте изменения (кроме CHANGELOG.md):\n  " + "\n  ".join(dirty))

    text = CHANGELOG.read_text("utf-8")
    m = UNRELEASED.search(text)
    if not m or not m["body"].strip():
        sys.exit("Раздел «## [Unreleased]» в CHANGELOG.md пуст — опишите, что изменилось в этой версии.")
    notes = m["body"].strip()
    today = dt.date.today().isoformat()

    print(f"Версия: {current} → {new}\n\n{notes}\n")
    if args.dry_run:
        return

    CHANGELOG.write_text(text[:m.start()] + f"## [Unreleased]\n\n## [{new}] - {today}\n\n{notes}\n\n"
                         + text[m.end():].lstrip("\n"), "utf-8", newline="\n")
    (ROOT / "VERSION").write_text(new + "\n", "utf-8", newline="\n")
    pkg = PACKAGE_JSON.read_text("utf-8")
    PACKAGE_JSON.write_text(re.sub(r'("version":\s*")[^"]+(")', rf"\g<1>{new}\g<2>", pkg, count=1), "utf-8",
                            newline="\n")

    bootstrap.ensure_frontend()

    git("add", "VERSION", "CHANGELOG.md", "frontend/package.json", "frontend/package-lock.json", "frontend/dist")
    git("commit", "--quiet", "-m", f"release: v{new}", "-m", notes)
    git("tag", "-a", f"v{new}", "-m", f"Vidosodel {new}\n\n{notes}")
    branches = [branch]
    if branch != STABLE_BRANCH:
        git("branch", "-f", STABLE_BRANCH, "HEAD")  # fast-forward: checked above that main is an ancestor
        branches.append(STABLE_BRANCH)
    print(f"Готово: коммит и тег v{new}, ветка {STABLE_BRANCH} указывает на релиз.")
    push = ["push", "--follow-tags", "origin", *branches]
    if args.push:
        git(*push, capture=False)
        print("Отправлено на GitHub — пользователи получат обновление при следующем запуске.")
    else:
        print("Отправить на GitHub: git " + " ".join(push))


if __name__ == "__main__":
    main()
