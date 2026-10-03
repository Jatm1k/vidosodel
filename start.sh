#!/usr/bin/env sh
# Vidosodel launcher for Linux/macOS: needs Python 3.11+ and ffmpeg from the system package manager.
cd "$(dirname "$0")" || exit 1
for candidate in python3.13 python3.12 python3.11 python3; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)'; then
    exec "$candidate" scripts/bootstrap.py "$@"
  fi
done
echo "Нужен Python 3.11+: sudo apt install python3.12 python3.12-venv (или brew install python@3.12)"
exit 1
