"""Motion graphics and infographics.

* ``backend/motion`` – the renderer (Node + Skia via @napi-rs/canvas): JSON scenes → frames, 5–10 ms per 1080p frame;
* :mod:`.store` – what a track keeps (``Track.motion``): style, motion scenes by scene index, overlays by time;
* :mod:`.client` – a frame server per render worker (the engine asks it for scene frames and overlays);
* :mod:`.agent` – the app asks Claude Code (``claude -p``, the user's subscription) to compose the graphics;
* :mod:`.provider` – selects Claude Code or runs the same tools through the configured backup chat API;
* :mod:`.tools` – the MCP tools that session works with (submit, look, plan), at ``/mcp/motion/<token>``.
"""
