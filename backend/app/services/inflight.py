"""Inflight API transport. Submission is deliberately never retried automatically.

Polling and downloading are safe to repeat; an ambiguous POST must be reconciled
with its remote ID rather than spending the user's quota a second time.
"""
from __future__ import annotations

import base64
import hashlib
import io
import time
from collections import OrderedDict
from pathlib import Path
from urllib.parse import quote, urlparse

import httpx
from PIL import Image, ImageOps

from ..settings_store import load_config
from ..storage import media_root
from .http import ApiError

MODES = {"t2i": "/image/generate", "ref2i": "/image/reference-to-image",
         "t2v": "/video/text-to-video", "i2v": "/video/image-to-video",
         "ref2v": "/video/reference-to-video", "im2v": "/video/image-then-video",
         "frames2v": "/video/first-last-frame-to-video",
         "frame_ref2v": "/video/first-frame-to-last-reference"}
#: ``image_role`` of a ``POST /jobs`` item; text modes have none. im2v is never batched.
ROLES = {"i2v": "first_frame", "ref2v": "reference", "ref2i": "reference",
         "frames2v": "first_last_frame", "frame_ref2v": "first_frame_last_reference"}
FINAL = {"ready", "failed", "declined", "cancelled"}
IMAGE_LIMIT = 1_500_000
PROMPT_LIMIT = 12_000
IMAGE_ASPECTS = ("16:9", "9:16", "1:1", "4:5")
VIDEO_ASPECTS = ("16:9", "9:16")
#: A batch stays well below the documented 200 MB request limit.
BATCH_BYTES = 120_000_000
_ENCODED: OrderedDict = OrderedDict()


def connection_error(exc: httpx.HTTPError, host: str) -> str:
    """Readable transport diagnostics without exposing headers, keys or proxy URLs."""
    causes = []
    current = exc
    while current is not None and len(causes) < 8:
        causes.append(str(current).lower())
        current = current.__cause__
    detail = " ".join(causes)
    if "certificate_verify_failed" in detail or "certificate verify failed" in detail:
        return f"Не удалось проверить сертификат HTTPS сервера {host}. Проверьте дату компьютера и доверенные сертификаты VPN/прокси."
    if "getaddrinfo" in detail or "name or service not known" in detail:
        return f"DNS не смог определить адрес {host}. Проверьте подключение и настройки DNS."
    if isinstance(exc, httpx.ProxyError):
        return f"Не удалось подключиться к {host} через прокси. Проверьте настройки прокси."
    if "handshake" in detail or "winerror 10054" in detail or "forcibly closed" in detail:
        return (f"Не удалось установить защищённое HTTPS-соединение с {host}: тайм-аут TLS или сброс соединения. "
                "Ответа о правильности ключа ещё нет. Проверьте доступность сервиса; попробуйте другое подключение или VPN.")
    if isinstance(exc, httpx.ConnectTimeout):
        return f"Сервер {host} не отвечает при подключении. Проверьте доступность сервиса и подключение к интернету/VPN."
    if isinstance(exc, httpx.TimeoutException):
        return f"Истекло время ожидания ответа от {host}."
    return f"Не удалось соединиться с {host} ({type(exc).__name__}). Проверьте доступность сервиса, интернет и VPN/прокси."


def media_path(rel: str) -> Path:
    root = media_root().resolve()
    path = (root / rel).resolve()
    if root not in path.parents or not path.is_file():
        raise ValueError("Референс не найден в медиатеке")
    return path


def encode_image(source: str | bytes) -> dict:
    """JPEG base64 of at most 1.5 MB. Library files are cached: one portrait goes with many scenes."""
    if isinstance(source, bytes):
        return _encode(source)
    path = media_path(source)
    stat = path.stat()
    key = (str(path), stat.st_size, stat.st_mtime_ns)
    if key in _ENCODED:
        _ENCODED.move_to_end(key)
        return dict(_ENCODED[key])
    encoded = _encode(path.read_bytes())
    _ENCODED[key] = encoded
    while len(_ENCODED) > 64:
        _ENCODED.popitem(last=False)
    return dict(encoded)


def _encode(raw: bytes) -> dict:
    with Image.open(io.BytesIO(raw)) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        image.thumbnail((2048, 2048))
        while True:
            for quality in (90, 80, 65, 45):
                output = io.BytesIO()
                image.save(output, format="JPEG", quality=quality, optimize=True)
                data = output.getvalue()
                if len(data) <= IMAGE_LIMIT:
                    return {"image_base64": base64.b64encode(data).decode("ascii"), "mime": "image/jpeg"}
            if min(image.size) <= 32:
                raise ValueError("Не удалось сжать референс до 1 500 000 байт")
            image.thumbnail((max(1, int(image.width * .75)), max(1, int(image.height * .75))))


def wire_payload(mode: str, payload: dict) -> dict:
    """Body of the mode's own endpoint (validated and encoded before anything is marked submitted)."""
    if mode not in MODES:
        raise ValueError("Неизвестный режим генерации")
    out = {"aspect_ratio": payload.get("aspect_ratio", "16:9")}
    allowed = IMAGE_ASPECTS if mode in ("t2i", "ref2i") else VIDEO_ASPECTS
    if out["aspect_ratio"] not in allowed:
        raise ValueError("Допустимые пропорции: " + ", ".join(allowed))
    for key in (("image_prompt", "video_prompt") if mode == "im2v" else ("prompt",)):
        value = str(payload.get(key) or "").strip()
        if not value or len(value) > PROMPT_LIMIT:
            raise ValueError(f"Промпт должен содержать от 1 до {PROMPT_LIMIT} символов")
        out[key] = value
    if mode == "im2v":
        out["return_image_url"] = True
    if mode == "i2v":
        encoded = encode_image(payload.get("first_frame") or "")
        out.update(image_base64=encoded["image_base64"], image_mime=encoded["mime"])
    if mode in ("frames2v", "frame_ref2v"):
        out["first_frame"] = encode_image(payload.get("first_frame") or "")
        out["last_frame" if mode == "frames2v" else "last_frame_reference"] = encode_image(payload.get("last_frame") or "")
        duration = int(payload.get("duration_seconds") or (8 if mode == "frames2v" else 10))
        if (mode == "frames2v" and duration not in (5, 6, 7, 8)) or (mode == "frame_ref2v" and duration != 10):
            raise ValueError("Длительность перехода между кадрами: 5–8 с (без звука) или 10 с (со звуком)")
        out["duration_seconds"] = duration
    if mode in ("ref2i", "ref2v"):
        refs = payload.get("references") or []
        if not 1 <= len(refs) <= 10:
            raise ValueError("Нужны от 1 до 10 референсов")
        out["reference_images"] = [{"name": r["name"], **encode_image(r["path"])} for r in refs]
    return out


def batch_item(mode: str, body: dict) -> dict:
    """The ``POST /jobs`` form of a single-endpoint body: roles come from ``image_role`` + ordered ``images``.

    Batch items have no ``mode`` field. Sending ``mode`` with ``reference_images`` (an earlier version did)
    makes the server ignore the images and silently produce a text-only result.
    """
    item = {k: body[k] for k in ("prompt", "aspect_ratio", "client_ref", "duration_seconds") if k in body}
    if mode == "i2v":
        item["images"] = [{"image_base64": body["image_base64"], "mime": body.get("image_mime", "image/png")}]
    elif mode in ("ref2v", "ref2i"):
        item["images"] = [dict(r) for r in body["reference_images"]]
    elif mode == "frames2v":
        item["images"] = [body["first_frame"], body["last_frame"]]
    elif mode == "frame_ref2v":
        item["images"] = [body["first_frame"], body["last_frame_reference"]]
    if mode in ROLES:
        item["image_role"] = ROLES[mode]
    return item


def body_bytes(body: dict) -> int:
    """Approximate JSON size of a submission (base64 dominates)."""
    images = list(body.get("reference_images") or []) + [
        body[k] for k in ("first_frame", "last_frame", "last_frame_reference") if isinstance(body.get(k), dict)]
    return (len(body.get("image_base64") or "") + sum(len(i.get("image_base64") or "") for i in images)
            + len(body.get("prompt") or "") + 2_000)


class InflightClient:
    def __init__(self, cfg=None, transport=None):
        cfg = cfg or load_config()
        key = cfg.inflight_api_key.strip()
        if not key:
            raise ApiError("Inflight", 401, "Укажите ключ Inflight в настройках")
        self.account = hashlib.sha256(key.encode()).hexdigest()
        self.base = cfg.inflight_base_url.strip().rstrip("/")
        self._client = httpx.Client(headers={"X-API-Key": key}, timeout=httpx.Timeout(120, connect=10),
                                    transport=transport)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._client.close()

    def request(self, method, path, **kwargs):
        # Read-only checks can be retried; paid submissions must never be repeated
        # after a transport failure because the server may already have accepted them.
        for attempt in range(2 if method == "GET" else 1):
            try:
                response = self._client.request(method, self.base + path, **kwargs)
                break
            except httpx.HTTPError as exc:
                if method == "GET" and attempt == 0 and isinstance(exc, (httpx.ConnectError, httpx.TimeoutException)):
                    time.sleep(.5)
                    continue
                message = connection_error(exc, urlparse(self.base).hostname or "Inflight")
                raise ApiError("Inflight", 0, message, {"ambiguous": method == "POST"}) from exc
        try:
            data = response.json()
        except ValueError:
            data = {}
        if not response.is_success:
            detail = data.get("detail", {}) if isinstance(data, dict) else {}
            message = detail.get("message") if isinstance(detail, dict) else str(detail)
            code = detail.get("code", "") if isinstance(detail, dict) else ""
            extra = {k: v for k, v in detail.items() if k not in ("message",)} if isinstance(detail, dict) else {}
            raise ApiError("Inflight", response.status_code, message or "Ошибка API", {**extra, "code": code})
        return data

    def account_info(self):
        return self.request("GET", "/account")

    def usage(self):
        return self.request("GET", "/account/usage")

    def submit(self, kind: str, tasks: list[dict]) -> list[dict]:
        """One task – its own endpoint; several – one all-or-nothing ``POST /jobs``."""
        if len(tasks) == 1:
            task = tasks[0]
            return [self.request("POST", MODES[task["mode"]], json=task["body"])]
        if any(t["mode"] == "im2v" for t in tasks):
            raise ValueError("Составной режим отправляется отдельно")
        data = self.request("POST", "/jobs", json={"kind": kind, "jobs": [
            batch_item(t["mode"], t["body"]) for t in tasks]})
        return self.task_list(data)

    @staticmethod
    def task_list(data) -> list[dict]:
        if isinstance(data, list):
            return data
        for key in ("jobs", "tasks", "items"):
            if isinstance(data.get(key), list):
                return data[key]
        if data.get("id"):
            return [data]
        raise ApiError("Inflight", 502, "Неизвестный формат списка заданий")

    def poll(self, ids: list[str]):
        return self.task_list(self.request("GET", "/tasks", params={"ids": ",".join(ids)}))

    def cancel(self, remote_id: str, hard=False):
        path = "/tasks/" + quote(remote_id, safe="")
        return self.request("POST" if hard else "DELETE", path + ("/hard-cancel" if hard else ""))

    def hard_cancel(self, remote_ids: list[str] | None = None, *, everything=False):
        return self.request("POST", "/tasks/hard-cancel",
                            json={"all": True} if everything else {"ids": list(remote_ids or [])[:200]})

    def download(self, url: str, dest: Path):
        # Signed URLs are public: a separate client keeps the API key out of file requests.
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.hostname:
            raise ValueError("API вернул некорректную ссылку на файл")
        temp = dest.with_suffix(dest.suffix + ".part")
        try:
            with httpx.stream("GET", url, timeout=180, follow_redirects=True) as response:
                response.raise_for_status()
                with temp.open("wb") as output:
                    for chunk in response.iter_bytes():
                        output.write(chunk)
            if not temp.stat().st_size:
                raise ValueError("API вернул пустой файл")
            temp.replace(dest)
        finally:
            temp.unlink(missing_ok=True)
