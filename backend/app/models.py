"""ORM models.

Domain hierarchy::

    Channel ─┬─ Project ─┬─ Track (one per language) ─── Scene
             │           └─ ...
             └─ ...

* **Channel** – a YouTube channel preset: voices, visual style, render look.
* **Project** – one video idea; produces one video per language track.
* **Track** – a language version of the project: script → audio → timings →
  scenes → images → video. Every stage can be produced by the pipeline *or*
  supplied manually (uploaded audio, SRT, images...).
* **Scene** – a time span of the track illustrated by one image.

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

    channel: Mapped[Channel] = relationship(back_populates="projects")
    tracks: Mapped[list[Track]] = relationship(
        back_populates="project", cascade="all, delete-orphan", passive_deletes=True,
        order_by="Track.position",
    )
    characters: Mapped[list[Character]] = relationship(
        back_populates="project", cascade="all, delete-orphan", passive_deletes=True,
        order_by="Character.position",
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
    #: ``generated`` or ``upload`` (an own photo/drawing is never replaced automatically).
    image_origin: Mapped[str | None] = mapped_column(String(20), nullable=True)

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
    #: Generated YouTube metadata: titles, description, tags, chapters.
    publish_meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    #: Relative paths of generated thumbnails.
    thumbnails: Mapped[list[str]] = mapped_column(JSON, default=list)

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

    track: Mapped[Track] = relationship(back_populates="scenes", foreign_keys=[track_id])
    source_scene: Mapped[Scene | None] = relationship(remote_side=[id], foreign_keys=[source_scene_id])


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
