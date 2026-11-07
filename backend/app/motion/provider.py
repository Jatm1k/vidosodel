"""Motion designer backends: Claude Code or the configured backup chat API.

The backup runs the same validated tools locally. Images go in a user message
after all tool responses, because many chat gateways accept text-only tool results.
"""
from __future__ import annotations

import copy
import json
import time
from collections.abc import Callable
from typing import Any

from jsonschema import ValidationError, validate

from ..services.http import ApiError
from ..services.limiter import Cancelled, job_hooks
from ..services.llm_fallback import backup_llm, backup_usage
from .agent import ClaudeError, run_claude


class MotionError(RuntimeError):
    """A designer session failed; safe to display in the job's result."""


def check_provider(provider: str) -> None:
    """Check settings before the job replaces any existing graphics."""
    if provider == "claude":
        return
    if provider != "backup":
        raise MotionError(f"Неизвестный исполнитель моушн-графики: {provider}")
    client = backup_llm()
    if client is None:
        raise MotionError("Резервная LLM выключена или не настроена. Укажите адрес API и модель в настройках приложения.")
    client.close()


def run_designer(prompt: str, *, provider: str = "claude", session: Any = None, **kwargs: Any) -> dict[str, Any]:
    if provider == "claude":
        try:
            return run_claude(prompt, **kwargs)
        except ClaudeError as exc:
            raise MotionError(str(exc)) from exc
    if provider != "backup":
        raise MotionError(f"Неизвестный исполнитель моушн-графики: {provider}")
    return _run_backup(prompt, session=session, **kwargs)


def _functions(names: list[str]) -> list[dict[str, Any]]:
    from .tools import TOOLS

    out = []
    for name in names:
        _, description, schema = TOOLS[name]
        schema = copy.deepcopy(schema)
        if name == "submit":
            # The element vocabulary is open-ended. Gemini rejects empty object
            # schemas; the existing submit tool already accepts a JSON string.
            schema["properties"]["items"] = {
                "type": "string", "description": "JSON-encoded array of scene/overlay items from the guide."}
        elif name == "plan":
            # Grouping is chosen in submit's slots; a flat list plans the same scenes.
            schema["properties"]["scenes"]["items"] = {"type": "integer"}
        out.append({"type": "function", "function": {
            "name": name, "description": description, "parameters": schema}})
    return out


def _run_backup(prompt: str, *, session: Any, model: str, effort: str,
                system_file: Any = None, system: str | None = None,
                mcp_url: str | None = None, tools: list[str] | None = None,
                json_schema: dict[str, Any] | None = None, timeout: float = 1800,
                should_stop: Callable[[], bool] = lambda: False,
                on_event: Callable[[dict[str, Any]], None] = lambda e: None) -> dict[str, Any]:
    # model/effort are Claude settings. The backup's model (including any effort
    # suffix) comes verbatim from global settings; do not send Claude parameters.
    client = backup_llm()
    if client is None:
        raise MotionError("Резервная LLM выключена или не настроена. Укажите адрес API и модель в настройках приложения.")
    deadline = time.monotonic() + timeout

    def stopped() -> bool:
        return should_stop() or time.monotonic() >= deadline

    usage = {"inputTokens": 0, "cacheReadInputTokens": 0, "outputTokens": 0}
    base = system_file.read_text(encoding="utf-8") if system_file else system or ""
    messages: list[dict[str, Any]] = [{"role": "system", "content": base}, {"role": "user", "content": prompt}]
    if json_schema is not None:
        # A string payload also handles dictionaries (palette/font overrides)
        # on providers whose function schema dialect forbids arbitrary objects.
        messages[0]["content"] += "\nCall structured_output with JSON matching this schema:\n" + json.dumps(json_schema)
        functions = [{"type": "function", "function": {
            "name": "structured_output", "description": "Return the requested structured JSON result.",
            "parameters": {"type": "object", "properties": {"json": {"type": "string"}}, "required": ["json"]}}}]
    else:
        if session is None:
            client.close()
            raise MotionError("Не задана сессия моушн-графики")
        tools = [name for name in tools or [] if name != "look" or session.visual_check]
        functions = _functions(tools)
    misses = 0
    try:
        with client, job_hooks(stopped, None):
            for _ in range(3 if json_schema is not None else 64):
                if stopped():
                    raise Cancelled()
                options: dict[str, Any] = {"tools": functions, "max_tokens": 16384}
                if json_schema is not None:
                    options["tool_choice"] = {"type": "function", "function": {"name": "structured_output"}}
                data = client.complete(messages, **options)
                backup_usage.note("моушн-графика")
                u = data.get("usage") or {}
                cached = int((u.get("prompt_tokens_details") or {}).get("cached_tokens") or 0)
                usage["inputTokens"] += max(0, int(u.get("prompt_tokens") or 0) - cached)
                usage["cacheReadInputTokens"] += cached
                usage["outputTokens"] += int(u.get("completion_tokens") or 0)
                try:
                    choice = data["choices"][0]
                    message = choice["message"]
                    if not isinstance(message, dict) or message.get("role") != "assistant":
                        raise ValueError("нет сообщения assistant")
                except (KeyError, IndexError, TypeError, ValueError) as exc:
                    raise MotionError("Резервная LLM вернула некорректный ответ") from exc
                if choice.get("finish_reason") == "length":
                    raise MotionError("Ответ резервной LLM обрезан лимитом токенов. Уменьшите число сцен в одной части.")
                # Preserve extra_content/reasoning/tool-call thought signatures.
                messages.append(copy.deepcopy(message))
                calls = message.get("tool_calls") or []
                if not calls:
                    if json_schema is None:
                        from .tools import _motion, _progress_line

                        status = _progress_line(session, _motion(session.track_id))
                        if session.submitted and "NOT DONE" not in status and (session.mode != "mixed" or session.planned):
                            return {"modelUsage": {client.model: usage}}
                        messages.append({"role": "user", "content": status + (
                            " Call plan first." if session.mode == "mixed" and not session.planned else "")})
                    misses += 1
                    if misses >= 2:
                        raise MotionError("Резервная LLM не вызывает инструменты или не завершила графику. "
                                          "Проверьте поддержку tool calling у выбранной модели и API.")
                    messages.append({"role": "user", "content": "Use the provided tools to finish the task; text alone does not save any work."})
                    continue
                misses = 0
                images = []
                structured = None
                for call in calls:
                    if stopped():
                        raise Cancelled()
                    fn = call.get("function") or {}
                    name = fn.get("name")
                    call_id = call.get("id")
                    if not call_id:
                        raise MotionError("API резервной LLM не вернул id вызова инструмента")
                    try:
                        args = json.loads(fn.get("arguments") or "{}")
                        if not isinstance(args, dict):
                            raise ValueError("arguments must be an object")
                        if json_schema is not None:
                            if name != "structured_output":
                                raise ValueError("call structured_output")
                            structured = json.loads(args["json"])
                            validate(structured, json_schema)
                            content = [{"type": "text", "text": "Accepted."}]
                        else:
                            if name not in (tools or []):
                                raise ValueError(f"Tool {name!r} is not allowed in this session")
                            from .tools import _handle

                            on_event({"type": "assistant", "message": {"content": [{"type": "tool_use", "name": name}]}})
                            result = _handle(session, {"id": call_id, "method": "tools/call",
                                                      "params": {"name": name, "arguments": args}})
                            content = result["result"]["content"]
                    except (ValueError, TypeError, KeyError, ValidationError) as exc:
                        structured = None
                        content = [{"type": "text", "text": f"ERR: {str(exc)[:1500]}. Fix and call the tool again."}]
                    texts = [b["text"] for b in content if b.get("type") == "text"]
                    for b in content:
                        if b.get("type") == "image":
                            images.append({"type": "image_url", "image_url": {
                                "url": f"data:{b['mimeType']};base64,{b['data']}"}})
                    messages.append({"role": "tool", "tool_call_id": call_id, "content": "\n".join(texts)})
                if structured is not None:
                    return {"structured_output": structured, "modelUsage": {client.model: usage}}
                if images:
                    # Retain only the current sheet; older tool text stays available.
                    for old in messages:
                        if old["role"] == "user" and isinstance(old.get("content"), list):
                            old["content"] = [b for b in old["content"] if b.get("type") != "image_url"]
                    messages.append({"role": "user", "content": [
                        {"type": "text", "text": "Contact sheets from the preceding tools. Inspect and fix visible problems once; then finish remaining items."},
                        *images]})
            raise MotionError("Резервная LLM исчерпала число шагов. Уменьшите число сцен в одной части или смените модель.")
    except Cancelled as exc:
        raise MotionError("остановлено" if should_stop() else f"Резервная LLM не уложилась в {int(timeout // 60)} мин") from exc
    except ApiError as exc:
        raise MotionError(f"{exc}. Для моушн-графики API должен поддерживать вызов функций"
                          + (" и входные изображения." if session and session.visual_check else ".")) from exc
