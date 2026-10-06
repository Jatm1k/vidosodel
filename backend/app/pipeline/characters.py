"""Character references: who is in a scene and what to send to the image model.

Each recurring character of a project has a reference portrait. A scene lists
its characters in ``Scene.characters`` (set by the prompt LLM or by hand);
when that is unknown, names mentioned in the prompt are used. The portraits of
the scene's characters go to the image model as reference inputs together
with a short note that tells the model which image is whom.
"""
from __future__ import annotations

import re
from collections.abc import Sequence

from ..models import Character, Scene
from ..services.fastgen import IMAGE_OPS_BY_ID

#: Portraits sent with one scene (more faces → models mix them up).
MAX_PER_SCENE = 3
#: All reference inputs of one request (characters first, then channel style refs).
MAX_INPUTS = 6


def accepts_refs(operation: str) -> bool:
    return bool(IMAGE_OPS_BY_ID.get(operation, {}).get("refs"))


def mentioned(prompt: str, characters: Sequence[Character]) -> list[int]:
    """Characters whose name appears in the prompt as a whole word."""
    out = []
    for c in characters:
        name = c.name.strip()
        if name and re.search(rf"(?<!\w){re.escape(name)}(?!\w)", prompt, re.I):
            out.append(c.id)
    return out


def scene_character_ids(scene: Scene, characters: Sequence[Character]) -> list[int]:
    """Characters visible in the scene (assigned list, or names found in the prompt)."""
    known = {c.id for c in characters}
    if scene.characters is not None:
        ids = [i for i in scene.characters if i in known]
    else:
        ids = mentioned(scene.prompt or "", characters)
    return ids[:MAX_PER_SCENE]


def ids_from_names(names: Sequence[str] | None, characters: Sequence[Character]) -> list[int] | None:
    """Map names returned by the LLM to character ids (case-insensitive)."""
    if names is None:
        return None
    by_name = {c.name.strip().lower(): c.id for c in characters}
    ids = []
    for n in names:
        cid = by_name.get(str(n).strip().lower())
        if cid and cid not in ids:
            ids.append(cid)
    return ids[:MAX_PER_SCENE]


def reference_name(name: str, taken: set[str]) -> str:
    """File name of a portrait input (``Alex.jpg``) – prompts refer to references by it."""
    base = re.sub(r"\W+", "_", name.strip()).strip("_") or "character"
    out, n = f"{base}.jpg", 2
    while out.lower() in taken:
        out, n = f"{base}_{n}.jpg", n + 1
    taken.add(out.lower())
    return out


def reference_note(cast: Sequence[tuple[str, str, str]]) -> str:
    """Tells the model which reference file shows whom: ``(name, file name, description)`` per character.

    The description repeats the look in words, so a character stays recognisable even when
    the model follows the reference image only loosely.
    """
    if not cast:
        return ""
    parts = "; ".join(
        f"{name} = {file}" + (f" ({' '.join(desc.split())[:300]})" if desc.strip() else "")
        for name, file, desc in cast
    )
    return (f"Characters in this image: {parts}. Draw each of them exactly as in their reference image – same "
            "face, hair, age, build and clothing. Use the references only for appearance, not for pose, "
            "background or framing. ")
