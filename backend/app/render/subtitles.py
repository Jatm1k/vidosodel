"""Subtitles from word timings: ASS for burning in, SRT for YouTube upload."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ..pipeline.text import ends_clause, ends_sentence
from ..pipeline.timings import Word
from ..settings_schema import SubtitleSettings
from .accents import Accent


@dataclass(slots=True)
class Cue:
    start: float
    end: float
    lines: list[list[Word]]

    @property
    def words(self) -> list[Word]:
        return [w for line in self.lines for w in line]


def build_cues(words: list[Word], max_chars: int = 42, max_lines: int = 2, max_duration: float = 6.0) -> list[Cue]:
    """Group words into readable cues: break at sentence ends, long pauses and size limits."""
    cues: list[Cue] = []
    lines: list[list[Word]] = [[]]

    def line_len(line: list[Word]) -> int:
        return sum(len(w.w) for w in line) + max(0, len(line) - 1)

    def flush() -> None:
        nonlocal lines
        ws = [w for ln in lines for w in ln]
        if ws:
            cues.append(Cue(ws[0].s, ws[-1].e, [ln for ln in lines if ln]))
        lines = [[]]

    for i, w in enumerate(words):
        cur = lines[-1]
        if cur and line_len(cur) + 1 + len(w.w) > max_chars:
            if len(lines) >= max_lines:
                flush()
            else:
                lines.append([])
        lines[-1].append(w)
        first = next(x for ln in lines for x in ln)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt.s - w.e) if nxt else 0
        too_long = w.e - first.s > max_duration
        full = len(lines) == max_lines and line_len(lines[-1]) > max_chars * 0.6
        if nxt is None or ends_sentence(w.w) or gap > 0.7 or too_long or (full and ends_clause(w.w)):
            flush()
    # Extend cues slightly so they do not flash: until the next cue (max +0.5 s), min 0.8 s.
    for k, c in enumerate(cues):
        limit = cues[k + 1].start - 0.02 if k + 1 < len(cues) else c.end + 0.5
        c.end = max(min(c.end + 0.5, limit), min(c.start + 0.8, limit))
    return cues


# ---------------------------------------------------------------------------- SRT
def _srt_time(t: float) -> str:
    ms = int(round(max(0.0, t) * 1000))
    return f"{ms // 3600000:02d}:{ms % 3600000 // 60000:02d}:{ms % 60000 // 1000:02d},{ms % 1000:03d}"


def write_srt(cues: list[Cue], path: Path) -> Path:
    blocks = []
    for i, c in enumerate(cues, 1):
        text = "\n".join(" ".join(w.w for w in ln) for ln in c.lines)
        blocks.append(f"{i}\n{_srt_time(c.start)} --> {_srt_time(c.end)}\n{text}\n")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(blocks), encoding="utf-8")
    return path


# ---------------------------------------------------------------------------- ASS
def _ass_color(hex_color: str, alpha: float = 0.0) -> str:
    """``#RRGGBB`` → ``&HAABBGGRR`` (ASS alpha: 00 opaque, FF transparent)."""
    h = hex_color.lstrip("#")
    if len(h) != 6:
        h = "FFFFFF"
    r, g, b = h[0:2], h[2:4], h[4:6]
    a = int(round(min(max(alpha, 0), 1) * 255))
    return f"&H{a:02X}{b}{g}{r}".upper()


def _ass_time(t: float) -> str:
    cs = int(round(max(0.0, t) * 100))
    return f"{cs // 360000}:{cs % 360000 // 6000:02d}:{cs % 6000 // 100:02d}.{cs % 100:02d}"


def _esc(text: str) -> str:
    return text.replace("\\", "\\\\").replace("{", "(").replace("}", ")")


def _accent_style(cfg: SubtitleSettings, scale: float) -> str:
    """Big bold text for key phrases: centre of the frame, or the top when subtitles sit in the middle."""
    size = round(cfg.size * 1.8 * scale)
    align = 8 if cfg.enabled and cfg.position == "middle" else 5
    margin = round(160 * scale)
    return (
        f"Style: Accent,{cfg.accent_font or cfg.font},{size},{_ass_color(cfg.accent_color)},{_ass_color('#FFFFFF')},"
        f"{_ass_color('#000000')},{_ass_color('#000000', 0.45)},-1,0,0,0,100,100,0,0,1,"
        f"{round(4 * scale, 1)},{round(3 * scale, 1)},{align},{margin},{margin},{margin},1"
    )


def _accent_event(a: Accent, width: int, scale: float) -> str:
    # Pops in slightly over-scaled, settles, fades out; \q0 lets a long phrase wrap.
    anim = r"{\q0\fad(120,280)\fscx72\fscy72\t(0,170,\fscx108\fscy108)\t(170,300,\fscx100\fscy100)}"
    ml = mr = 0  # 0 → margins of the style
    if a.x is not None:
        # A column centred at x, as wide as the frame allows on that side.
        m = round(70 * scale)
        half = min(a.x, 1 - a.x) * width - m
        ml, mr = max(m, round(a.x * width - half)), max(m, round(width - a.x * width - half))
    return f"Dialogue: 1,{_ass_time(a.start)},{_ass_time(a.end)},Accent,,{ml},{mr},0,,{anim}{_esc(a.text.upper())}"


def write_ass(words: list[Word], cfg: SubtitleSettings, width: int, height: int, path: Path,
              accents: list[Accent] | None = None) -> Path:
    """Burned-in text: subtitles (when enabled in ``cfg``) and key-phrase ``accents``."""
    scale = height / 1080
    size = round(cfg.size * scale)
    align = {"bottom": 2, "middle": 5, "top": 8}[cfg.position]
    karaoke = cfg.style == "karaoke"
    box = cfg.style == "box"
    primary = _ass_color(cfg.highlight_color if karaoke else cfg.primary_color)
    secondary = _ass_color(cfg.primary_color)
    outline_col = _ass_color(cfg.box_color, 1 - cfg.box_opacity) if box else _ass_color(cfg.outline_color)
    border_style = 3 if box else 1
    outline = round((size * 0.25 if box else cfg.outline) * (1 if box else scale), 1)
    style = (
        f"Style: Default,{cfg.font},{size},{primary},{secondary},{outline_col},{_ass_color('#000000', 0.5)},"
        f"{-1 if cfg.bold else 0},0,0,0,100,100,0,0,{border_style},{outline},{round(cfg.shadow * scale, 1)},"
        f"{align},{round(80 * scale)},{round(80 * scale)},{round(cfg.margin_v * scale)},1"
    )
    header = (
        "[Script Info]\nScriptType: v4.00+\nWrapStyle: 2\nScaledBorderAndShadow: yes\n"
        f"PlayResX: {width}\nPlayResY: {height}\nYCbCr Matrix: TV.709\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, "
        "Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"{style}\n{_accent_style(cfg, scale)}\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    events = [_accent_event(a, width, scale) for a in accents or []]
    for cue in build_cues(words, cfg.max_chars_per_line, cfg.max_lines) if cfg.enabled else []:
        parts = []
        cue_words = cue.words
        for li, line in enumerate(cue.lines):
            tokens = []
            for w in line:
                text = _esc(w.w.upper() if cfg.uppercase else w.w)
                if karaoke:
                    idx = cue_words.index(w)
                    nxt = cue_words[idx + 1].s if idx + 1 < len(cue_words) else w.e
                    start = cue.start if idx == 0 else w.s
                    cs = max(1, int(round((nxt - start) * 100)))
                    tokens.append(f"{{\\kf{cs}}}{text}")
                else:
                    tokens.append(text)
            parts.append(" ".join(tokens))
            if li < len(cue.lines) - 1:
                parts.append("\\N")
        events.append(f"Dialogue: 0,{_ass_time(cue.start)},{_ass_time(cue.end)},Default,,0,0,0,,{''.join(parts)}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(header + "\n".join(events) + "\n", encoding="utf-8-sig")
    return path
