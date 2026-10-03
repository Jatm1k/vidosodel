"""Background check for a newer version (git upstream) and update from the UI.

The result is cached and refreshed every few hours so the UI can show an
"update available" badge without hitting the network on every request.
"""
from __future__ import annotations

import logging
import os
import threading
import time
from typing import Any

from .. import version

log = logging.getLogger(__name__)

CHECK_INTERVAL = 6 * 3600
FIRST_CHECK_DELAY = 10


class UpdateChecker:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._info: version.UpdateInfo | None = None
        self._checked_at: float | None = None
        self._thread: threading.Thread | None = None

    @property
    def supervised(self) -> bool:
        """Started by the launcher, which restarts the server after an update."""
        return os.environ.get("VIDOSODEL_SUPERVISED") == "1"

    def check(self, fetch: bool = True) -> version.UpdateInfo:
        info = version.check_for_update(fetch=fetch)
        with self._lock:
            self._info, self._checked_at = info, time.time()
        if info.available:
            log.info("Update available: %s → %s", info.current, info.latest)
        return info

    def state(self) -> dict[str, Any]:
        with self._lock:
            info, checked = self._info, self._checked_at
        return {
            "version": version.read_version(),
            "supervised": self.supervised,
            "checked_at": checked,
            "update": info.to_dict() if info else None,
        }

    def start(self) -> None:
        if self._thread or not version.is_git_checkout():
            return

        def loop() -> None:
            time.sleep(FIRST_CHECK_DELAY)
            while True:
                try:
                    self.check()
                except Exception as exc:  # noqa: BLE001 – a failed check must never affect the app
                    log.debug("update check failed: %s", exc)
                time.sleep(CHECK_INTERVAL)

        self._thread = threading.Thread(target=loop, name="update-check", daemon=True)
        self._thread.start()

    def apply_and_restart(self) -> dict[str, Any]:
        """Pull the update; when supervised, exit so the launcher restarts with the new code."""
        ok, out = version.apply_update()
        if not ok:
            return {"ok": False, "message": out}
        self.check(fetch=False)
        if not self.supervised:
            return {"ok": True, "restarting": False,
                    "message": "Обновление скачано. Перезапустите Vidosodel, чтобы оно применилось."}
        log.info("Update installed, restarting")
        # Let the HTTP response go out first; unfinished jobs resume after the restart.
        threading.Timer(1.0, lambda: os._exit(version.RESTART_EXIT_CODE)).start()
        return {"ok": True, "restarting": True, "message": "Обновление установлено, перезапуск…"}


updates = UpdateChecker()
