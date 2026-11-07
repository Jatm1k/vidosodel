"""Manual live smoke test against the configured backup (uses API credits).

python backend/tests/smoke_motion_backup.py
Only synthetic scene content is sent. Project settings and graphics are not edited.
"""
from __future__ import annotations

import copy
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.motion import brief, tools
from app.motion.agent import GUIDE, usage_of
from app.motion.node import run_cli
from app.motion.provider import run_designer
from app.pipeline.timings import Word


def main():
    scene = SimpleNamespace(idx=0, start=0.0, end=5.0, text="За год показатель вырос с пятидесяти до ста.", image=None)
    catalog = run_cli("styles")
    print("Checking structured art direction...", flush=True)
    b = brief.make_brief(title="Тест графики", lang="ru", niche="инфографика", picture_style="flat illustration",
                         rules="", mode="full", scenes=[scene], characters=[], max_cutouts=0, model="opus",
                         catalog=catalog, format_pin="explainer", style_pin={"base": "editorial"}, recent=[],
                         should_stop=lambda: False, provider="backup")
    assert b["text"] and b["look"]["format"] == "explainer"
    print("Structured art direction OK. Checking tools, Skia rendering and image feedback...", flush=True)
    motion = {"v": 1, "mode": "full", "plan_slots": [0], "items": [], "style": brief.style_doc(b["look"])}

    def save(track_id, fn):
        fn(motion)
        return copy.deepcopy(motion)

    with tempfile.TemporaryDirectory(prefix="motion-backup-live-") as folder:
        session = tools.Session(token="smoke", track_id=-1, mode="full", lo=0, hi=0, t0=0, t1=5,
                                scenes=[scene], words=[Word(w, i * 0.5, (i + 1) * 0.5) for i, w in enumerate(scene.text.split())],
                                duration=5, lang="ru", width=640, height=360, fonts_dir=None, assets={}, safe_bottom=0,
                                visual_check=True, work=Path(folder))
        session.on_progress = lambda msg: print(msg, flush=True)
        prompt = ("Synthetic integration test. Create exactly ONE full-screen scene for slots [0], duration 5 seconds, "
                  "language ru. No assets/cutouts, no overlays. Style editorial, format explainer. "
                  "Show growth from 50 to 100 with a large counter and a short label. Use normal numeric times. "
                  "Call submit, inspect the contact sheet, fix any problems once, then finish.\n"
                  f"SCENE #0 [0-5s]: {scene.text}")
        with patch.object(tools, "_motion", side_effect=lambda _: copy.deepcopy(motion)), patch.object(tools, "_save", side_effect=save):
            result = run_designer(prompt, provider="backup", model="opus", effort="medium", session=session,
                                  system_file=GUIDE, tools=["submit", "look"], timeout=180)
        assert session.submitted == {"s0"}
        print(f"PASS: {len(motion['items'])} rendered scene, {session.calls} tool calls, tokens {usage_of(result)}", flush=True)


if __name__ == "__main__":
    main()
