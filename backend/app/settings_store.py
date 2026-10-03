"""Global, UI-editable application settings stored in the ``app_settings`` table.

These are machine-wide (not per channel): API keys, FastGen limits, the
default encoder... Values saved here override ``.env``.
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict

from .config import get_settings
from .db import session_scope
from .models import AppSetting


class AppConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    lumean_api_key: str = ""
    fastgen_api_key: str = ""
    #: FastGen image credits allowed per rolling hour (plan limit).
    fastgen_credits_per_hour: int = 500
    #: Concurrent FastGen image generations (plan limit).
    fastgen_image_threads: int = 10
    #: Keep this share of the hourly budget free for manual work in other tools.
    fastgen_budget_ratio: float = 1.0
    #: Concurrent Lumean voice orders started by the app.
    lumean_parallel_orders: int = 3
    #: How many renders may run at the same time (each is itself multi-process).
    parallel_renders: int = 1


_SECRET_KEYS = ("lumean_api_key", "fastgen_api_key")


def load_config() -> AppConfig:
    """Effective config: defaults ← .env keys ← DB values."""
    env = get_settings()
    data: dict[str, Any] = {"lumean_api_key": env.lumean_api_key, "fastgen_api_key": env.fastgen_api_key}
    with session_scope() as db:
        for row in db.query(AppSetting).all():
            if row.value not in (None, ""):
                data[row.key] = row.value
    return AppConfig.model_validate(data)


def save_config(patch: dict[str, Any]) -> AppConfig:
    """Persist the given keys. Masked secrets coming back from the UI are ignored."""
    allowed = set(AppConfig.model_fields)
    with session_scope() as db:
        for key, value in patch.items():
            if key not in allowed:
                continue
            if key in _SECRET_KEYS and isinstance(value, str) and "•" in value:
                continue  # the UI sent back the masked placeholder – keep the stored key
            row = db.get(AppSetting, key)
            if row is None:
                db.add(AppSetting(key=key, value=value))
            else:
                row.value = value
    return load_config()


def mask_secret(value: str) -> str:
    if not value:
        return ""
    return value[:4] + "•" * 8 + value[-4:] if len(value) > 10 else "•" * 8


def public_config() -> dict[str, Any]:
    """Config safe to send to the browser (secrets masked)."""
    cfg = load_config().model_dump()
    for key in _SECRET_KEYS:
        cfg[key] = mask_secret(cfg[key])
    return cfg
