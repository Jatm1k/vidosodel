"""The app asks Claude Code to compose the graphics: ``claude -p`` on the user's subscription.

A session is as lean as it gets: our own short system prompt (``guide.md``) instead of Claude Code's, no built-in
tools, no settings, CLAUDE.md or memory, only the three motion tools over MCP. The prompt carries just what the
part needs (style, scene texts with timings, targets); answers are JSON items, checked and drawn by the app.
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import tempfile
import threading
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

from ..render.media import CREATE_NO_WINDOW

log = logging.getLogger(__name__)

GUIDE = Path(__file__).with_name("guide.md")


class ClaudeError(RuntimeError):
    """Claude Code failed (not installed, not logged in, usage limit…). The message is for the user."""


def claude_bin() -> str:
    found = shutil.which("claude")
    if found:
        return found
    for cand in (Path.home() / ".local" / "bin" / ("claude.exe" if os.name == "nt" else "claude"),
                 Path(os.environ.get("APPDATA", "")) / "npm" / "claude.cmd"):
        if cand.exists():
            return str(cand)
    raise ClaudeError("Claude Code не найден. Установите его (https://claude.com/claude-code) и войдите: claude → /login")


def _limit_text(text: str) -> str | None:
    low = text.lower()
    if "limit" in low and ("usage" in low or "reached" in low or "reset" in low):
        return f"Лимит подписки Claude исчерпан: {text.strip()[:200]}"
    if "login" in low or "authenticat" in low or "api key" in low:
        return f"Claude Code не авторизован: выполните claude → /login ({text.strip()[:160]})"
    return None


def run_claude(prompt: str, *, model: str, effort: str, system_file: Path | None = None, system: str | None = None,
               mcp_url: str | None = None, tools: list[str] | None = None, json_schema: dict | None = None,
               timeout: float = 1800, should_stop: Callable[[], bool] = lambda: False,
               on_event: Callable[[dict[str, Any]], None] = lambda e: None) -> dict[str, Any]:
    """Runs one headless session; returns the final ``result`` event. Raises :class:`ClaudeError`."""
    work = Path(tempfile.mkdtemp(prefix="vidosodel-claude-"))
    try:
        cmd = [claude_bin(), "-p", "--model", model, "--effort", effort, "--tools", "", "--strict-mcp-config",
               "--setting-sources", "", "--disable-slash-commands", "--no-session-persistence",
               "--permission-mode", "dontAsk", "--output-format", "stream-json", "--verbose"]
        if system_file is not None:
            cmd += ["--system-prompt-file", str(system_file)]
        elif system is not None:
            sp = work / "system.md"
            sp.write_text(system, encoding="utf-8")
            cmd += ["--system-prompt-file", str(sp)]
        if mcp_url:
            cfg = work / "mcp.json"
            cfg.write_text(json.dumps({"mcpServers": {"motion": {"type": "http", "url": mcp_url}}}), encoding="utf-8")
            cmd += ["--mcp-config", str(cfg), "--allowedTools", ",".join(f"mcp__motion__{t}" for t in tools or [])]
        if json_schema is not None:
            cmd += ["--json-schema", json.dumps(json_schema)]
        env = dict(os.environ)
        env.pop("CLAUDECODE", None)  # a session started from inside Claude Code must not think it is nested
        proc = subprocess.Popen(cmd, cwd=work, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                env=env, creationflags=CREATE_NO_WINDOW)
        proc.stdin.write(prompt.encode("utf-8"))
        proc.stdin.close()
        err_chunks: list[bytes] = []
        threading.Thread(target=lambda: err_chunks.append(proc.stderr.read()), daemon=True).start()
        killer_done = threading.Event()
        started = time.time()

        def watchdog() -> None:
            while not killer_done.wait(1.0):
                if should_stop() or time.time() - started > timeout:
                    proc.kill()
                    return
        threading.Thread(target=watchdog, daemon=True).start()
        result: dict[str, Any] | None = None
        for raw in proc.stdout:
            line = raw.decode("utf-8", "replace").strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except ValueError:
                continue
            if ev.get("type") == "result":
                result = ev
            else:
                try:
                    on_event(ev)
                except Exception:  # noqa: BLE001 – progress must not break the session
                    log.debug("on_event failed", exc_info=True)
        proc.wait()
        killer_done.set()
        if should_stop():
            raise ClaudeError("остановлено")
        if result is None:
            stderr = b"".join(err_chunks).decode("utf-8", "replace")
            if time.time() - started > timeout:
                raise ClaudeError(f"Claude не уложился в {int(timeout // 60)} мин")
            raise ClaudeError(_limit_text(stderr) or f"Claude Code завершился без ответа: {stderr.strip()[-400:]}")
        if result.get("is_error"):
            text = str(result.get("result") or result.get("subtype") or "")
            raise ClaudeError(_limit_text(text) or f"Claude: {text[:300]}")
        return result
    finally:
        shutil.rmtree(work, ignore_errors=True)


def usage_of(result: dict[str, Any]) -> dict[str, int]:
    """Tokens of the whole session (``modelUsage`` sums every turn; ``usage`` is the last turn only)."""
    out = {"in": 0, "cache_read": 0, "cache_write": 0, "out": 0}
    for u in (result.get("modelUsage") or {}).values():
        out["in"] += int(u.get("inputTokens") or 0)
        out["cache_read"] += int(u.get("cacheReadInputTokens") or 0)
        out["cache_write"] += int(u.get("cacheCreationInputTokens") or 0)
        out["out"] += int(u.get("outputTokens") or 0)
    return out


def tool_events(on_call: Callable[[str], None]) -> Callable[[dict[str, Any]], None]:
    """Stream handler: reports every tool the model calls."""
    def handle(ev: dict[str, Any]) -> None:
        if ev.get("type") != "assistant":
            return
        for block in (ev.get("message") or {}).get("content") or []:
            if block.get("type") == "tool_use":
                on_call(str(block.get("name", "")).replace("mcp__motion__", ""))
    return handle
