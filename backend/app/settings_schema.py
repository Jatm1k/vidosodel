"""Pipeline settings: defaults → channel overrides → project overrides.

Channels and projects store only *partial* dictionaries; the effective
settings for a project are obtained with :func:`effective_settings`, which
deep-merges ``defaults ← channel.settings ← project.settings`` and validates
the result. Unknown keys are ignored, so old databases keep working when
settings evolve.
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class _Base(BaseModel):
    model_config = ConfigDict(extra="ignore")


class VoiceSettings(_Base):
    """Lumean voice-over."""

    #: Language code → Lumean template UUID (voice, model, stability...).
    templates: dict[str, str] = Field(default_factory=dict)
    #: Language the scripts are written in: new projects get it as the main
    #: language, the others are translated from it. ``None`` – first language.
    master_language: str | None = None
    #: Template used when a language has no dedicated one.
    default_template_id: str | None = None
    #: Speech speed override (0.7–1.2); ``None`` keeps the template value.
    speed: float | None = None
    #: Lumean paragraph mode: each paragraph is synthesised separately.
    paragraph_mode: bool = False


class SceneSettings(_Base):
    """How the timeline is cut into scenes (one image per scene)."""

    #: ``smart`` – LLM groups sentences by meaning within the bounds;
    #: ``auto`` – deterministic grouping by sentences/pauses only (free, instant).
    mode: Literal["smart", "auto"] = "smart"
    min_duration: float = 4.0
    max_duration: float = 10.0
    #: Faster cuts at the start of the video keep viewer retention high.
    intro_seconds: float = 45.0
    intro_min_duration: float = 2.5
    intro_max_duration: float = 5.0
    #: ``duration`` – scenes follow the duration bounds above;
    #: ``count`` – at most ``max_images`` scenes per video: when the bounds above
    #: would give more, all durations (intro included) stretch proportionally.
    limit_mode: Literal["duration", "count"] = "duration"
    max_images: int = 150


class ImageSettings(_Base):
    """FastGen image generation."""

    #: Main (quality) model.
    operation: str = "nano_banana_2_image_generate"
    #: How models are distributed over the scenes (see ``pipeline.image_plan``):
    #: ``single`` – ``operation`` for every scene;
    #: ``intro`` – ``operation`` for the first ``premium_minutes`` of each video,
    #: ``economy_operation`` after that;
    #: ``budget`` – as many scenes in ``operation`` as ``budget_credits`` allows
    #: (counted over every language that has its own images), starting from the
    #: beginning of each video; the rest in ``economy_operation``.
    model_strategy: Literal["single", "intro", "budget"] = "single"
    economy_operation: str = "flower_image_generate"
    premium_minutes: float = 2.0
    #: Credits for all images of a project; 0 = one hour of the FastGen plan.
    budget_credits: int = 0
    upscale_2x: bool = False
    #: Appended to every prompt: the visual identity of the channel.
    style_prompt: str = (
        "cinematic still, dramatic natural lighting, rich detail, shallow depth of field, "
        "professional color grading, 16:9 composition"
    )
    #: Things that must not appear in images.
    avoid: str = "text, captions, letters, watermark, logo, signature, frame, border, collage, split screen"
    #: Character references: recurring people get a reference portrait that is
    #: sent with every scene they appear in (needs a model that accepts references).
    character_refs: bool = False
    #: Model that draws the reference portraits.
    character_operation: str = "nano_banana_pro_image_generate"
    #: Style reference images (relative media paths), sent with every request.
    reference_images: list[str] = Field(default_factory=list)
    use_references: bool = False
    #: What to do with the Gemini sparkle some models put on part of the images
    #: (``inpaint`` is a legacy alias of ``auto``).
    watermark_fix: Literal["auto", "inpaint", "crop", "none"] = "auto"
    #: Ask the LLM to rephrase a prompt rejected by the content filter.
    auto_fix_rejected: bool = True
    max_attempts: int = 3


class LlmSettings(_Base):
    """Text LLM (FastGen chat completions) used for scenes, prompts, translation, metadata."""

    model: str = "google/gemini-3.6-flash"
    #: Niche/topic of the channel – gives the LLM context for every task.
    niche: str = ""
    #: Extra instructions for image prompt writing (characters look, setting...).
    prompt_instructions: str = ""
    temperature: float = 0.7


class RenderSettings(_Base):
    resolution: Literal["1080p", "1440p", "2160p"] = "1080p"
    fps: int = 30
    #: Ken Burns style camera moves picked per scene (see render.motion.EFFECTS).
    motion_effects: list[str] = Field(
        default_factory=lambda: [
            "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down",
            "zoom_in_left", "zoom_in_right", "drift", "parallax",
        ]
    )
    #: 0 – barely moving, 1 – dynamic.
    motion_intensity: float = 0.5
    #: 3D-parallax scenes cut between a wide shot and a close-up at phrase boundaries.
    phrase_cuts: bool = True
    #: Background behind the subject goes soft in parallax shots (stronger on close-ups).
    depth_of_field: bool = True
    #: Transitions picked between scenes (see render.transitions.TRANSITIONS).
    transitions: list[str] = Field(
        default_factory=lambda: ["crossfade", "dip_black", "slide_left", "slide_right", "zoom_blend", "wipe", "blur"]
    )
    transition_duration: float = 0.6
    #: Share of hard cuts among scene changes (0..1).
    cut_ratio: float = 0.3
    fade_in: float = 0.6
    fade_out: float = 1.2
    #: ``auto`` picks a hardware encoder when available, otherwise libx264.
    encoder: str = "auto"
    quality: Literal["max", "high", "balanced", "fast"] = "high"
    #: Parallel render processes; 0 = automatic.
    workers: int = 0
    #: Target integrated loudness (YouTube normalises to −14 LUFS).
    loudness: float = -14.0


class SubtitleSettings(_Base):
    """Burned-in subtitles (an .srt file is always exported regardless)."""

    enabled: bool = False
    style: Literal["plain", "karaoke", "box"] = "plain"
    font: str = "Arial"
    #: Font size at 1080p; scaled for other resolutions.
    size: int = 56
    bold: bool = True
    uppercase: bool = False
    primary_color: str = "#FFFFFF"
    highlight_color: str = "#FFD84D"
    outline_color: str = "#000000"
    box_color: str = "#000000"
    box_opacity: float = 0.55
    outline: float = 3.0
    shadow: float = 1.0
    position: Literal["bottom", "middle", "top"] = "bottom"
    margin_v: int = 70
    max_chars_per_line: int = 40
    max_lines: int = 2


class UniqueSettings(_Base):
    """Per-render variations that make every upload technically unique."""

    enabled: bool = True
    #: 0..1 – how strong the random variations are.
    strength: float = 0.5
    color_jitter: bool = True
    film_grain: bool = True
    vignette: bool = True
    micro_zoom: bool = True
    audio_eq: bool = True
    strip_metadata: bool = True


class PublishSettings(_Base):
    """YouTube metadata and thumbnails."""

    #: Create metadata and thumbnails as part of "run the pipeline". When off they
    #: can still be generated by hand on the publish stage of any video.
    enabled: bool = True
    title_variants: int = 5
    tags_count: int = 15
    #: Appended to every generated description (links, socials, disclaimers).
    description_footer: str = ""
    with_chapters: bool = True
    thumbnail_count: int = 2
    #: Let the image model draw a short headline on the thumbnail.
    thumbnail_text: bool = True
    thumbnail_style: str = "bold high-contrast YouTube thumbnail, expressive, eye-catching, clean composition"
    thumbnail_operation: str = "nano_banana_pro_image_generate"


class PipelineSettings(_Base):
    voice: VoiceSettings = Field(default_factory=VoiceSettings)
    scenes: SceneSettings = Field(default_factory=SceneSettings)
    images: ImageSettings = Field(default_factory=ImageSettings)
    llm: LlmSettings = Field(default_factory=LlmSettings)
    render: RenderSettings = Field(default_factory=RenderSettings)
    subtitles: SubtitleSettings = Field(default_factory=SubtitleSettings)
    unique: UniqueSettings = Field(default_factory=UniqueSettings)
    publish: PublishSettings = Field(default_factory=PublishSettings)


def deep_merge(base: dict[str, Any], override: dict[str, Any] | None) -> dict[str, Any]:
    """Recursively merge ``override`` into a copy of ``base``.

    Dicts are merged key by key; any other value (lists included) replaces the
    base value. ``None`` in the override means "inherit" and is skipped.
    """
    result = dict(base)
    for key, value in (override or {}).items():
        if value is None:
            continue
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def default_settings() -> dict[str, Any]:
    return PipelineSettings().model_dump()


def effective_settings(channel_settings: dict | None, project_settings: dict | None = None) -> PipelineSettings:
    merged = deep_merge(deep_merge(default_settings(), channel_settings), project_settings)
    return PipelineSettings.model_validate(merged)


def template_for_language(voice: VoiceSettings, language: str) -> str | None:
    """Lumean template id for ``language`` (falls back to the default template)."""
    return voice.templates.get(language) or voice.default_template_id
