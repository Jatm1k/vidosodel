"""Process-level configuration.

Values come from environment variables / the project-root ``.env`` file.
Everything that a user may want to change at runtime (LLM model, limits,
encoder, ...) lives in the database instead – see :mod:`app.settings_store`.
API keys can be set in both places: a key saved from the UI overrides ``.env``.
"""
from __future__ import annotations

import os
import shutil
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

#: Repository root (``vidosodel/``).
ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Static settings read once at start-up."""

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    lumean_api_key: str = ""
    fastgen_api_key: str = ""

    lumean_base_url: str = "https://api.lumean.app/api/public"
    fastgen_base_url: str = "https://api.fast-gen.ai"

    host: str = "127.0.0.1"
    port: int = 8765

    #: Where the database, media files and renders are stored.
    data_dir: Path = ROOT_DIR / "data"
    #: Explicit path to ffmpeg; auto-detected (tools/ffmpeg or PATH) when empty.
    ffmpeg_path: str = ""

    @property
    def db_path(self) -> Path:
        return self.data_dir / "vidosodel.db"

    @property
    def media_dir(self) -> Path:
        """Root of all user media; served read-only under ``/media``."""
        return self.data_dir / "media"

    @property
    def fonts_dir(self) -> Path:
        """Custom fonts for burned-in subtitles (any .ttf/.otf dropped here)."""
        return self.data_dir / "fonts"

    @property
    def frontend_dist(self) -> Path:
        return ROOT_DIR / "frontend" / "dist"


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if not s.data_dir.is_absolute():
        s.data_dir = (ROOT_DIR / s.data_dir).resolve()
    for d in (s.data_dir, s.media_dir, s.fonts_dir):
        d.mkdir(parents=True, exist_ok=True)
    return s


def _find_tool(name: str, explicit: str = "") -> str:
    """Locate an ffmpeg-family binary: explicit path → bundled tools/ → PATH."""
    if explicit and Path(explicit).exists():
        return explicit
    exe = f"{name}.exe" if os.name == "nt" else name
    for candidate in (ROOT_DIR / "tools" / "ffmpeg" / "bin" / exe, ROOT_DIR / "tools" / "ffmpeg" / exe):
        if candidate.exists():
            return str(candidate)
    found = shutil.which(name)
    return found or name


@lru_cache
def ffmpeg_bin() -> str:
    return _find_tool("ffmpeg", get_settings().ffmpeg_path)


@lru_cache
def ffprobe_bin() -> str:
    explicit = get_settings().ffmpeg_path
    probe = str(Path(explicit).with_name(Path(explicit).name.replace("ffmpeg", "ffprobe"))) if explicit else ""
    return _find_tool("ffprobe", probe)
