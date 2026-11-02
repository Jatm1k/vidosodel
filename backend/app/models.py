"""ORM models.

Domain hierarchy::

    Channel ─┬─ Project ─┬─ Track (one per language) ─── Scene
             │           └─ ...
             └─ Series ─┬─ SeriesCharacter, SeriesLocation
                        └─ Project (an episode) ─┬─ EpisodeBlock (screenplay)
                                                 └─ SoundCue (music, sfx)

* **Channel** – a YouTube channel preset: voices, visual style, render look.
* **Project** – one video idea; produces one video per language track.
* **Track** – a language version of the project: script → audio → timings →
  scenes → images → video. Every stage can be produced by the pipeline *or*
  supplied manually (uploaded audio, SRT, images...).
* **Scene** – a time span of the track illustrated by one image.
* **Series** – a serial: a world, recurring characters and places shared by its
  episodes. An episode is an ordinary project with ``series_id``: its voice-over
  is assembled from the screenplay blocks (narrator via Lumean, character lines
  via Gemini TTS) and mixed with music and sound effects; scenes, images and the
  render are the usual pipeline (see :mod:`app.pipeline.episode`).

All media paths are stored *relative* to ``settings.media_dir`` using forward
slashes, so the data folder can be moved between machines.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Channel(TimestampMixin, Base):
    __tablename__ = "channels"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(16), default="#7c5cff")
    #: Partial overrides of :class:`app.settings_schema.PipelineSettings`.
    settings: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    projects: Mapped[list[Project]] = relationship(
        back_populates="channel", cascade="all, delete-orphan", passive_deletes=True
    )


class Project(TimestampMixin, Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    channel_id: Mapped[int] = mapped_column(ForeignKey("channels.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(300))
    #: Partial overrides on top of the channel settings.
    settings: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    #: ``shared`` – one image set (from the master track) for all languages;
    #: ``per_language`` – every track generates its own images.
    image_mode: Mapped[str] = mapped_column(String(20), default="shared")
    master_track_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    #: LLM-made "visual bible": recurring characters, places, era, palette.
    visual_context: Mapped[str] = mapped_column(Text, default="")
    #: When the script was last scanned for recurring characters (None – never).
    characters_scanned_at: Mapped[float | None] = mapped_column(Float, nullable=True)

    # --- series episode (all empty for an ordinary video) ---------------------
    series_id: Mapped[int | None] = mapped_column(
        ForeignKey("series.id", ondelete="CASCADE"), nullable=True, index=True
    )
    episode_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    #: What happens in the episode (the plan the screenplay is written from).
    synopsis: Mapped[str] = mapped_column(Text, default="")
    #: What actually happened – the series memory read when writing the next episodes.
    episode_summary: Mapped[str] = mapped_column(Text, default="")

    channel: Mapped[Channel] = relationship(back_populates="projects")
    series: Mapped[Series | None] = relationship(viewonly=True)
    tracks: Mapped[list[Track]] = relationship(
        back_populates="project", cascade="all, delete-orphan", passive_deletes=True,
        order_by="Track.position",
    )
    characters: Mapped[list[Character]] = relationship(
        back_populates="project", cascade="all, delete-orphan", passive_deletes=True,
        order_by="Character.position",
    )
    blocks: Mapped[list[EpisodeBlock]] = relationship(
        back_populates="project", cascade="all, delete-orphan", passive_deletes=True,
        order_by="EpisodeBlock.position",
    )
    sound_cues: Mapped[list[SoundCue]] = relationship(
        back_populates="project", cascade="all, delete-orphan", passive_deletes=True,
        order_by="SoundCue.id",
    )


class Character(TimestampMixin, Base):
    """A recurring person of the video with a reference portrait.

    The portrait is sent to the image model together with every scene the
    character appears in, so the face, hair and clothing stay the same.
    """

    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    #: Short name used in prompts ("Alex").
    name: Mapped[str] = mapped_column(String(100))
    #: Fixed appearance in English: gender, age, ethnicity, hair, build, clothing.
    description: Mapped[str] = mapped_column(Text, default="")
    image_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    #: none | generating | done | failed
    image_status: Mapped[str] = mapped_column(String(20), default="none")
    image_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    #: ``generated``, ``upload`` (an own photo/drawing is never replaced automatically) or
    #: ``series`` (a copy of a series character/location, kept in sync by the series).
    image_origin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    #: ``character`` or ``location`` (a place of a series, sent as a reference too).
    kind: Mapped[str] = mapped_column(String(20), default="character")
    #: Id of the series character/location this row mirrors (``kind`` tells which table).
    series_ref_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    project: Mapped[Project] = relationship(back_populates="characters")


class Track(TimestampMixin, Base):
    __tablename__ = "tracks"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    language: Mapped[str] = mapped_column(String(10))
    position: Mapped[int] = mapped_column(Integer, default=0)

    # --- script ---------------------------------------------------------------
    script: Mapped[str] = mapped_column(Text, default="")
    #: manual | translated | transcribed
    script_origin: Mapped[str] = mapped_column(String(20), default="manual")

    # --- voice-over -----------------------------------------------------------
    audio_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    #: lumean | upload
    audio_origin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    lumean_order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    #: Extra info about the voice order: cost, template, chunk failures...
    voice_meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    # --- timings --------------------------------------------------------------
    #: Normalised word timings (see :mod:`app.pipeline.timings`).
    timings_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    #: lumean | srt | stt | estimate
    timings_origin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    srt_file: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # --- output ---------------------------------------------------------------
    video_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    preview_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    #: Key phrases on screen picked by the LLM: ``{"key": script hash + count, "items": [{"quote", "text"}]}``.
    text_accents: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    #: Chapters shared by the chapter cards and the description:
    #: ``{"key": script + paragraph timing hash, "items": [{"t", "title", "card"}]}`` (see pipeline.chapters).
    chapters: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    #: Generated YouTube metadata: titles, description, tags, chapters.
    publish_meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    #: Relative paths of generated thumbnails.
    thumbnails: Mapped[list[str]] = mapped_column(JSON, default=list)
    #: Motion graphics of this language version (see :mod:`app.motion.store`): style, full-screen motion scenes
    #: (by scene index) and overlays (by time), written by Claude.
    motion: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    # --- production status (set by the user) ----------------------------------
    #: When the user checked the finished video; a new render resets it.
    approved_at: Mapped[float | None] = mapped_column(Float, nullable=True)
    #: When the user marked the video as uploaded to the channel.
    published_at: Mapped[float | None] = mapped_column(Float, nullable=True)

    project: Mapped[Project] = relationship(back_populates="tracks")
    scenes: Mapped[list[Scene]] = relationship(
        back_populates="track", cascade="all, delete-orphan", passive_deletes=True,
        order_by="Scene.idx", foreign_keys="Scene.track_id",
    )


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[int] = mapped_column(primary_key=True)
    track_id: Mapped[int] = mapped_column(ForeignKey("tracks.id", ondelete="CASCADE"), index=True)
    idx: Mapped[int] = mapped_column(Integer)
    start: Mapped[float] = mapped_column(Float)
    end: Mapped[float] = mapped_column(Float)
    text: Mapped[str] = mapped_column(Text, default="")
    prompt: Mapped[str] = mapped_column(Text, default="")
    #: True once the user edited the prompt by hand: regeneration keeps it.
    prompt_locked: Mapped[bool] = mapped_column(Boolean, default=False)

    image_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    #: none | queued | generating | done | failed
    image_status: Mapped[str] = mapped_column(String(20), default="none")
    image_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    #: In ``shared`` image mode a non-master scene borrows the image of this scene.
    source_scene_id: Mapped[int | None] = mapped_column(
        ForeignKey("scenes.id", ondelete="SET NULL"), nullable=True
    )
    #: Optional manual overrides: ``{"effect": "zoom_in", "transition": "fade"}``.
    overrides: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    #: Ids of the project characters visible in this scene; ``None`` – not assigned
    #: yet (then names mentioned in the prompt are used).
    characters: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    #: The scene continues the previous frame: ``{"change": "<what differs, English>"}``.
    #: Its image is drawn from the previous scene's image; ``None`` – a new frame.
    continuity: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    track: Mapped[Track] = relationship(back_populates="scenes", foreign_keys=[track_id])
    source_scene: Mapped[Scene | None] = relationship(remote_side=[id], foreign_keys=[source_scene_id])


class Series(TimestampMixin, Base):
    """A serial: its world and story bible, shared by every episode."""

    __tablename__ = "series"

    id: Mapped[int] = mapped_column(primary_key=True)
    #: Episodes are projects of this channel and inherit its settings (style, render, voice).
    channel_id: Mapped[int] = mapped_column(ForeignKey("channels.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(300))
    language: Mapped[str] = mapped_column(String(10), default="ru")
    #: One or two sentences: what the series is about.
    logline: Mapped[str] = mapped_column(Text, default="")
    #: The world: place, era, rules, atmosphere.
    setting: Mapped[str] = mapped_column(Text, default="")
    #: Story bible: tone, themes, arcs, rules the story must keep.
    bible: Mapped[str] = mapped_column(Text, default="")
    #: Visual style of the images in English (replaces the channel style when set).
    visual_style: Mapped[str] = mapped_column(Text, default="")
    #: Narrator, sound levels, pauses (see :class:`app.pipeline.episode.SeriesOptions`).
    options: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    characters: Mapped[list[SeriesCharacter]] = relationship(
        back_populates="series", cascade="all, delete-orphan", passive_deletes=True,
        order_by="SeriesCharacter.position",
    )
    locations: Mapped[list[SeriesLocation]] = relationship(
        back_populates="series", cascade="all, delete-orphan", passive_deletes=True,
        order_by="SeriesLocation.position",
    )
    episodes: Mapped[list[Project]] = relationship(order_by="Project.episode_number", viewonly=True)


class _SeriesRef:
    """Columns shared by series characters and locations: a description and a reference image."""

    id: Mapped[int] = mapped_column(primary_key=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str] = mapped_column(String(100))
    #: Fixed appearance in English – repeated in every image prompt.
    description: Mapped[str] = mapped_column(Text, default="")
    image_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    #: none | generating | done | failed
    image_status: Mapped[str] = mapped_column(String(20), default="none")
    image_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    #: ``generated`` or ``upload``.
    image_origin: Mapped[str | None] = mapped_column(String(20), nullable=True)


class SeriesCharacter(_SeriesRef, TimestampMixin, Base):
    __tablename__ = "series_characters"

    series_id: Mapped[int] = mapped_column(ForeignKey("series.id", ondelete="CASCADE"), index=True)
    #: Role in the story ("главная героиня, следователь").
    role: Mapped[str] = mapped_column(Text, default="")
    #: Character, manner of speech, motives – for writing lines.
    personality: Mapped[str] = mapped_column(Text, default="")
    #: Voice of the lines: ``{"provider": "gemini"|"lumean", "voice": "Kore", "style": "...",
    #: "template_id": "<Lumean template>"}`` (see :mod:`app.pipeline.episode`).
    voice: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    series: Mapped[Series] = relationship(back_populates="characters")


class SeriesLocation(_SeriesRef, TimestampMixin, Base):
    __tablename__ = "series_locations"

    series_id: Mapped[int] = mapped_column(ForeignKey("series.id", ondelete="CASCADE"), index=True)

    series: Mapped[Series] = relationship(back_populates="locations")


class EpisodeBlock(Base):
    """One piece of an episode screenplay, voiced as one audio clip.

    ``narration`` – the narrator (Lumean); ``line`` – a character's line (Gemini TTS or
    the character's Lumean voice); ``pause`` – silence of ``pause`` seconds.
    """

    __tablename__ = "episode_blocks"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    kind: Mapped[str] = mapped_column(String(20), default="narration")
    character_id: Mapped[int | None] = mapped_column(
        ForeignKey("series_characters.id", ondelete="SET NULL"), nullable=True
    )
    text: Mapped[str] = mapped_column(Text, default="")
    #: How a line is said ("шёпотом, испуганно") – sent to the TTS as a delivery note.
    direction: Mapped[str] = mapped_column(Text, default="")
    #: Where the block happens (images use the location reference).
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("series_locations.id", ondelete="SET NULL"), nullable=True
    )
    #: Other characters visible during the block (series character ids).
    visible: Mapped[list[int]] = mapped_column(JSON, default=list)
    #: Silence after the block, seconds (``None`` – the series default).
    gap_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    #: Length of a ``pause`` block, seconds.
    pause: Mapped[float] = mapped_column(Float, default=1.0)
    #: How many images (scenes) the block gets; ``None`` – by duration.
    shots: Mapped[int | None] = mapped_column(Integer, nullable=True)
    #: What to show, in English – the prompt of the block's scenes until they get their own.
    visual: Mapped[str] = mapped_column(Text, default="")

    audio_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    #: Hash of what was voiced (text, direction, voice) – a changed block is voiced again.
    audio_hash: Mapped[str | None] = mapped_column(String(32), nullable=True)
    #: none | queued | generating | done | failed
    audio_status: Mapped[str] = mapped_column(String(20), default="none")
    audio_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    #: Provider, voice, word timings of the clip (``words``), cost…
    audio_meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    project: Mapped[Project] = relationship(back_populates="blocks")


class SoundCue(Base):
    """Music or a sound effect of an episode, placed relative to screenplay blocks."""

    __tablename__ = "sound_cues"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    #: ``music`` (a bed under several blocks, ducked under speech), ``ambience`` (a looped
    #: background like rain) or ``sfx`` (a single sound at a moment).
    kind: Mapped[str] = mapped_column(String(20), default="sfx")
    #: Generation prompt in English.
    prompt: Mapped[str] = mapped_column(Text, default="")
    #: Starts at this block (``None`` – the episode start) plus ``offset`` seconds.
    start_block_id: Mapped[int | None] = mapped_column(
        ForeignKey("episode_blocks.id", ondelete="SET NULL"), nullable=True
    )
    #: ``start`` or ``end`` of the start block.
    anchor: Mapped[str] = mapped_column(String(10), default="start")
    offset: Mapped[float] = mapped_column(Float, default=0.0)
    #: Music/ambience lasts until the end of this block (``None`` – the episode end).
    end_block_id: Mapped[int | None] = mapped_column(
        ForeignKey("episode_blocks.id", ondelete="SET NULL"), nullable=True
    )
    #: Length of an sfx in seconds (``None`` – as generated).
    duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    #: Loudness relative to the series default for this kind, dB.
    volume: Mapped[float] = mapped_column(Float, default=0.0)
    fade_in: Mapped[float] = mapped_column(Float, default=1.0)
    fade_out: Mapped[float] = mapped_column(Float, default=1.5)

    audio_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    #: Hash of the generation request – a changed prompt/length is generated again.
    audio_hash: Mapped[str | None] = mapped_column(String(32), nullable=True)
    #: none | queued | generating | done | failed
    audio_status: Mapped[str] = mapped_column(String(20), default="none")
    audio_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    project: Mapped[Project] = relationship(back_populates="sound_cues")


class TtsUsage(Base):
    """Requests made with each Gemini API key (free keys have a daily request limit)."""

    __tablename__ = "tts_usage"

    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[float] = mapped_column(Float, index=True)
    #: Short hash of the key (keys themselves are never stored here).
    key_id: Mapped[str] = mapped_column(String(16), index=True)
    #: Quota day of the request (Google resets daily limits at midnight Pacific time).
    day: Mapped[str] = mapped_column(String(10), index=True)
    #: ``ok`` – a counted request; ``exhausted`` – the server said the key is over its limit.
    status: Mapped[str] = mapped_column(String(20), default="ok")
    chars: Mapped[int] = mapped_column(Integer, default=0)


class Job(Base):
    """A unit of background work. Persisted so it survives restarts."""

    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(40), index=True)
    #: queued | running | done | failed | cancelled
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)
    title: Mapped[str] = mapped_column(String(300), default="")
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True
    )
    track_id: Mapped[int | None] = mapped_column(
        ForeignKey("tracks.id", ondelete="CASCADE"), nullable=True, index=True
    )
    depends_on_id: Mapped[int | None] = mapped_column(
        ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True
    )
    params: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    result: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    message: Mapped[str] = mapped_column(Text, default="")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FastgenUsage(Base):
    """Local ledger of FastGen credits, used for the rolling hourly budget."""

    __tablename__ = "fastgen_usage"

    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[float] = mapped_column(Float, index=True)
    credits: Mapped[int] = mapped_column(Integer)
    operation: Mapped[str] = mapped_column(String(100))
    generation_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class AppSetting(Base):
    """Global key/value settings editable from the UI."""

    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[Any] = mapped_column(JSON)
