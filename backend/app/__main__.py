"""Entry point: ``python -m app`` (run from the ``backend`` folder).

Starts the web server and opens the UI in the default browser.
"""
from __future__ import annotations

import logging
import multiprocessing
import os
import threading
import webbrowser


def main() -> None:
    import uvicorn

    from .config import get_settings

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-7s %(name)s: %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    s = get_settings()
    url = f"http://{'127.0.0.1' if s.host in ('0.0.0.0', '::') else s.host}:{s.port}"
    if os.environ.get("VIDOSODEL_NO_BROWSER") != "1":
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()
    print(f"\n  Vidosodel запущен: {url}\n  Закройте это окно, чтобы остановить.\n", flush=True)
    uvicorn.run("app.main:app", host=s.host, port=s.port, log_level="warning", access_log=False)


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
