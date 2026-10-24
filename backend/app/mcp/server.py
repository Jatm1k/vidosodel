"""A minimal MCP server (Streamable HTTP transport, JSON responses) mounted at ``/mcp``.

An AI agent (Claude Code, Claude Desktop…) connects to the running app::

    claude mcp add --transport http vidosodel http://127.0.0.1:8765/mcp

Only what tools need is implemented: ``initialize``, ``ping``, ``tools/list`` and
``tools/call``. Every POST carries one JSON-RPC message (or a batch) and gets a
plain JSON answer; there is no server-initiated stream, so ``GET`` answers 405 as
the specification allows. The server is stateless – no session ids.

Requests from web pages of other sites are refused (``Origin`` check), so a page
open in the browser cannot drive the app through a local port.
"""
from __future__ import annotations

import json
import logging
import traceback
from typing import Any
from urllib.parse import urlparse

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response
from starlette.concurrency import run_in_threadpool

from ..version import __version__
from .tools import INSTRUCTIONS, TOOLS, ToolError

log = logging.getLogger(__name__)

router = APIRouter(tags=["mcp"])

PROTOCOL_VERSIONS = ("2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05")


def _error(msg_id: Any, code: int, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": code, "message": message}}


def _result(msg_id: Any, result: dict[str, Any]) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": msg_id, "result": result}


def tool_list() -> list[dict[str, Any]]:
    return [{"name": t.name, "title": t.title, "description": t.description, "inputSchema": t.schema(),
             "annotations": t.annotations()} for t in TOOLS.values()]


def call_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    tool = TOOLS.get(name)
    if tool is None:
        return {"content": [{"type": "text", "text": f"Неизвестный инструмент: {name}"}], "isError": True}
    try:
        content = tool.run(arguments or {})
        return {"content": content, "isError": False}
    except ToolError as exc:
        return {"content": [{"type": "text", "text": str(exc)}], "isError": True}
    except Exception as exc:  # noqa: BLE001 – the agent gets the error instead of a broken session
        log.error("MCP tool %s failed:\n%s", name, traceback.format_exc())
        return {"content": [{"type": "text", "text": f"Ошибка: {exc}"}], "isError": True}


def handle(message: dict[str, Any]) -> dict[str, Any] | None:
    """Answer one JSON-RPC message (``None`` for notifications)."""
    if not isinstance(message, dict) or message.get("jsonrpc") != "2.0":
        return _error(None, -32600, "Invalid Request")
    method = message.get("method")
    msg_id = message.get("id")
    params = message.get("params") or {}
    if msg_id is None:
        return None  # notification (initialized, cancelled…) or a response – nothing to answer
    if method == "initialize":
        asked = params.get("protocolVersion")
        version = asked if asked in PROTOCOL_VERSIONS else PROTOCOL_VERSIONS[0]
        return _result(msg_id, {
            "protocolVersion": version,
            "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": {"name": "vidosodel", "title": "Vidosodel", "version": __version__},
            "instructions": INSTRUCTIONS,
        })
    if method == "ping":
        return _result(msg_id, {})
    if method == "tools/list":
        return _result(msg_id, {"tools": tool_list()})
    if method == "tools/call":
        return _result(msg_id, call_tool(str(params.get("name")), params.get("arguments") or {}))
    if method in ("resources/list", "prompts/list"):
        return _result(msg_id, {method.split("/")[0]: []})
    return _error(msg_id, -32601, f"Method not found: {method}")


def _origin_ok(request: Request) -> bool:
    origin = request.headers.get("origin")
    if not origin:
        return True  # not a browser
    host = (urlparse(origin).hostname or "").lower()
    return host in ("localhost", "127.0.0.1", "::1", "[::1]") or host == (request.url.hostname or "").lower()


@router.post("/mcp", include_in_schema=False)
async def mcp_post(request: Request) -> Response:
    if not _origin_ok(request):
        return JSONResponse(_error(None, -32600, "Origin not allowed"), status_code=403)
    try:
        payload = json.loads(await request.body())
    except ValueError:
        return JSONResponse(_error(None, -32700, "Parse error"), status_code=400)
    if isinstance(payload, list):
        answers = [a for a in [await run_in_threadpool(handle, m) for m in payload] if a is not None]
        return JSONResponse(answers) if answers else Response(status_code=202)
    answer = await run_in_threadpool(handle, payload)
    if answer is None:
        return Response(status_code=202)
    return JSONResponse(answer)


@router.get("/mcp", include_in_schema=False)
async def mcp_get() -> Response:
    return Response(status_code=405, headers={"Allow": "POST"})


@router.delete("/mcp", include_in_schema=False)
async def mcp_delete() -> Response:
    return Response(status_code=405, headers={"Allow": "POST"})
