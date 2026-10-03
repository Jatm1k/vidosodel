"""Which image model generates which scene.

A project can mix a quality model and a cheap one (``ImageSettings.model_strategy``):

* ``single`` – one model for everything;
* ``intro``  – the quality model for the first N minutes of every video (the
  hook that decides retention), the cheap one after;
* ``budget`` – the quality model for as many scenes as a credit budget allows,
  the cheap one for the rest. The budget covers the whole project: every
  language that generates its own images shares it, proportionally to its
  number of scenes. Quality scenes go to the start of each video.

A model chosen by hand for a scene (``scene.overrides["operation"]``) always
wins and its cost is taken out of the budget first.

The plan is deterministic – the same scene gets the same model on every run –
so regenerating a few images never shuffles models around.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from ..models import Project, Scene, Track
from ..services.fastgen import IMAGE_OPS_BY_ID, image_credits
from ..settings_schema import ImageSettings


@dataclass
class ImagePlan:
    #: scene id → operation, for every scene of the tracks that generate images.
    ops: dict[int, str] = field(default_factory=dict)
    tracks: list[dict[str, Any]] = field(default_factory=list)
    budget: int = 0
    warning: str | None = None


def scene_override(scene: Scene) -> str | None:
    op = (scene.overrides or {}).get("operation")
    return op if op in IMAGE_OPS_BY_ID else None


def generating_tracks(project: Project) -> list[Track]:
    """Tracks that produce their own images (all of them, or only the master in shared mode)."""
    master_id = project.master_track_id or (project.tracks[0].id if project.tracks else None)
    if project.image_mode == "shared":
        return [t for t in project.tracks if t.id == master_id]
    return list(project.tracks)


def plan_project(project: Project, images: ImageSettings, hourly_budget: int) -> ImagePlan:
    premium, economy = images.operation, images.economy_operation
    if economy not in IMAGE_OPS_BY_ID:
        economy = premium
    cost = lambda op: image_credits(op, images.upscale_2x)  # noqa: E731
    strategy = images.model_strategy if premium != economy else "single"
    tracks = generating_tracks(project)
    scenes_by_track = {t.id: sorted(t.scenes, key=lambda s: s.idx) for t in tracks}
    plan = ImagePlan(budget=images.budget_credits or hourly_budget)

    # How many premium scenes each track gets (None = decided per scene by time).
    premium_count: dict[int, int] = {}
    if strategy == "budget":
        free = {tid: [s for s in sc if not scene_override(s)] for tid, sc in scenes_by_track.items()}
        # Languages without scenes yet will need about as many as the others.
        known = [len(v) for v in free.values() if v]
        guess = round(sum(known) / len(known)) if known else 0
        sizes = {tid: len(v) or guess for tid, v in free.items()}
        total = sum(sizes.values())
        pinned = sum(cost(scene_override(s)) for sc in scenes_by_track.values() for s in sc if scene_override(s))
        left = plan.budget - pinned
        cp, ce = cost(premium), cost(economy)
        if cp <= ce:
            k = total
        else:
            k = max(0, min(total, int((left - total * ce) // (cp - ce))))
        if total and left < total * ce:
            plan.warning = (f"Бюджета {plan.budget} кр. не хватает даже на дешёвую модель "
                            f"(нужно ≈ {pinned + total * ce} кр.) — генерация растянется на несколько часов.")
        # Largest-remainder split of k premium scenes between tracks by their size.
        shares = {tid: k * n / total if total else 0 for tid, n in sizes.items()}
        premium_count = {tid: int(v) for tid, v in shares.items()}
        rest = k - sum(premium_count.values())
        for tid in sorted(shares, key=lambda t: shares[t] - premium_count[t], reverse=True)[:rest]:
            premium_count[tid] += 1

    for t in tracks:
        given = 0
        for s in scenes_by_track[t.id]:
            op = scene_override(s)
            if not op:
                if strategy == "single":
                    op = premium
                elif strategy == "intro":
                    op = premium if s.start < images.premium_minutes * 60 else economy
                else:
                    op = premium if given < premium_count.get(t.id, 0) else economy
                    given += op == premium
            plan.ops[s.id] = op

    for t in tracks:
        by_op: dict[str, int] = {}
        credits = remaining = 0
        for s in scenes_by_track[t.id]:
            op = plan.ops[s.id]
            by_op[op] = by_op.get(op, 0) + 1
            credits += cost(op)
            if not (s.image_status == "done" and s.image_file):
                remaining += cost(op)
        plan.tracks.append({"track_id": t.id, "language": t.language, "scenes": len(scenes_by_track[t.id]),
                            "by_operation": by_op, "credits": credits, "remaining_credits": remaining})
    return plan


def plan_summary(project: Project, images: ImageSettings, hourly_budget: int) -> dict[str, Any]:
    """Plan overview for the UI: models per language, credits and time at the hourly limit."""
    plan = plan_project(project, images, hourly_budget)
    remaining = sum(t["remaining_credits"] for t in plan.tracks)
    return {
        "strategy": images.model_strategy, "budget": plan.budget, "hourly_budget": hourly_budget,
        "tracks": plan.tracks, "scene_ops": plan.ops,
        "credits": sum(t["credits"] for t in plan.tracks), "remaining_credits": remaining,
        "hours": round(remaining / hourly_budget, 2) if hourly_budget else None,
        "warning": plan.warning,
    }
