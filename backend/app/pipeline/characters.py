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


def reference_note(names: Sequence[str]) -> str:
    """Tells the model which reference image shows whom."""
    if not names:
        return ""
    parts = ", ".join(f"{n} (reference image {i + 1})" for i, n in enumerate(names))
    return (f"Keep these people exactly as in the reference images – same face, hair, age and clothing: {parts}. "
            "Use the references only for their appearance, not for pose or background. ")
