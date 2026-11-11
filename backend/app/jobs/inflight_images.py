"""Inflight adapter for existing portrait, thumbnail and series generators."""
from __future__ import annotations

import base64
import hashlib
import shutil

from ..pipeline.llm_tasks import compose_prompt
from ..services.inflight import InflightClient
from ..services import inflight_queue as queue
from ..storage import media_root, to_rel, unique_name


def generate_image(prompt, dest_dir, stem, images, refs, ctx, note, aspect_ratio):
    if aspect_ratio not in ("16:9", "9:16"):
        w, h = map(float, aspect_ratio.split(":"))
        aspect_ratio = "9:16" if h > w else "16:9"
    paths = []
    reference_dir = media_root() / "inflight" / "inputs"
    reference_dir.mkdir(parents=True, exist_ok=True)
    for i, ref in enumerate(refs):
        uri = ref.get("input") if isinstance(ref, dict) else ref
        if not isinstance(uri, str) or not uri.startswith("data:image/"):
            raise ValueError("Неподдерживаемый формат референса")
        data = base64.b64decode(uri.split(",", 1)[1], validate=True)
        digest = hashlib.sha256(data).hexdigest()
        path = reference_dir / (digest + ".jpg")
        if not path.exists():
            path.write_bytes(data)
        label = str(ref.get("name") or f"REF_{i+1}") if isinstance(ref, dict) else f"REF_{i+1}"
        paths.append({"name": label, "path": to_rel(path)})
    with InflightClient() as client:
        payload = {"prompt": note + compose_prompt(prompt, images), "references": paths, "aspect_ratio": aspect_ratio}
        rid = queue.enqueue(client, f"job:{ctx.job_id}:{to_rel(dest_dir / stem)}", "image",
                            "ref2i" if paths else "t2i", payload)
        row = queue.run(client, [rid], ctx)[0]
    if row.state != "ready":
        raise RuntimeError(row.error or f"Inflight: {row.state}")
    dest = dest_dir / unique_name(stem, ".jpg")
    # Copy keeps the durable queue's result available for restart/reconciliation.
    shutil.copyfile(media_root() / row.file, dest)
    return dest, {"provider": "inflight", "task_id": row.remote_id, "mode": row.mode, "prompt_used": prompt,
                  "server_mode": row.result.get("mode"), "request_audit": row.payload.get("_request_audit")}
