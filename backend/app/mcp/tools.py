"""MCP tools: everything an agent needs to make a series in Vidosodel.

The agent is the writer and the director: it creates the world, characters and
places, writes episodes as screenplay blocks, sets the visuals and sound design,
starts the generation jobs and checks the results (it sees images directly and
can have a voiced line transcribed). The app does the production: voices,
images with references, mixing and rendering. Tool inputs are pydantic models –
their JSON schemas are what the agent sees.
"""
from __future__ import annotations

import base64
import json
import time
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

import cv2
import numpy as np
from pydantic import BaseModel, Field, ValidationError

from .. import series_ops as ops
from ..api.pipeline_runner import run_pipeline
from ..api.projects import _mark as mark_track
from ..config import ffmpeg_bin
from ..db import session_scope
from ..jobs.common import scene_to_dict
from ..jobs.events import track_changed
from ..jobs.runner import job_to_dict, runner
from ..models import (
    Channel, Character, EpisodeBlock, Job, Project, Scene, Series, SeriesCharacter, SeriesLocation, Track,
)
from ..pipeline import llm_tasks, packaging
from ..render.media import imread, imwrite, make_thumbnail, probe_duration, run
from ..services import gemini_tts
from ..services.http import ApiError
from ..services.limiter import limiter, token_limiter
from ..services.lumean import LumeanClient
from ..settings_schema import effective_settings
from ..storage import to_abs, to_rel, track_dir, unique_name

INSTRUCTIONS = """\
Vidosodel — локальная студия видео. Через эти инструменты вы создаёте сериалы: вы автор и режиссёр, \
приложение — производство (озвучка, картинки по референсам, сведение звука, рендер).

Порядок работы над сериалом:
1. overview → выберите канал (у канала настроены стиль картинок, рендер и голос диктора по умолчанию).
2. create_series: мир (setting), библия (bible: тон, правила, арки), визуальный стиль по-английски.
3. save_character / save_location: описание внешности по-английски (оно повторяется в каждом промпте), \
характер и манера речи, голос (list_voices). generate_reference_images → wait_for_jobs → view_image: \
проверьте референсы, при необходимости перерисуйте с уточнённым описанием.
4. Каждая серия: get_series (там «story_so_far» — краткие итоги прошлых серий) → create_episode → \
set_screenplay блоками: narration (диктор, ведёт повествование), line (реплика героя, direction — как \
сказать), pause. У блоков укажите location (место действия, наследуется следующими блоками) и visual \
(что показать в кадре, по-английски). Реплик героев немного: у Gemini TTS ограничение запросов в день.
5. voice_blocks → wait_for_jobs. Подозрительные реплики (audio_warning) проверьте transcribe_block.
6. set_sound_cues (музыка под сцены, эмбиент, звуковые эффекты; привязка к блокам) → generate_sounds.
7. assemble_episode: речь + звук → дорожка серии, тайминги, сцены по блокам.
8. get_scenes → update_scenes (промпты по-английски; characters/location — по именам) или \
write_scene_prompts (LLM) → generate_images → view_image по сценам, перерисуйте неудачные.
9. render_episode (сначала preview=true для проверки, кадры смотрите view_video_frame), mark_episode(approved).
10. Упаковку для YouTube пишите сами — автоупаковка (generate_packaging) рассчитана на обычные ролики \
и годится разве что как черновик. set_metadata: название, описание (главы, футер канала и хэштеги \
приложение добавит само), теги, главы по блокам. set_thumbnails: обложки с героями и локациями по \
референсам, крупная надпись и название в пару → wait_for_jobs → view_image(kind="thumbnail"); неудачные — \
draw_thumbnails. Итог — get_publish_info.
11. update_episode(summary=…): что произошло в серии — это память сериала для следующих серий.

Настройки производства (стиль обложек, субтитры, рендер, атмосфера…) — get_settings / update_settings: \
для всего сериала (series_id) или одной серии (episode_id); настройки канала не меняются.

Задачи (jobs) выполняются в фоне: инструменты запуска возвращают job_id; ждите wait_for_jobs. \
Изменение текста или голоса блока требует переозвучки только этого блока; после любых правок \
озвучки или звуков повторите assemble_episode. Все тексты для моделей картинок и звуков пишите \
по-английски, текст реплик и диктора — на языке сериала."""


class ToolError(Exception):
    """A message for the agent (shown as a tool error)."""


@dataclass
class Tool:
    name: str
    title: str
    description: str
    args: type[BaseModel]
    fn: Callable[[Any], Any]
    read_only: bool = False
    destructive: bool = False

    def schema(self) -> dict[str, Any]:
        s = self.args.model_json_schema()
        s.pop("title", None)
        return s

    def annotations(self) -> dict[str, Any]:
        return {"title": self.title, "readOnlyHint": self.read_only, "destructiveHint": self.destructive,
                "openWorldHint": False}

    def run(self, arguments: dict[str, Any]) -> list[dict[str, Any]]:
        try:
            args = self.args.model_validate(arguments)
        except ValidationError as exc:
            raise ToolError(f"Неверные параметры: {exc}") from exc
        touched = None if self.read_only else _touched(args)
        try:
            out = self.fn(args)
        except ops.OpError as exc:
            raise ToolError(exc.message) from exc
        except ApiError as exc:
            raise ToolError(f"{exc.service}: {exc.message}") from exc
        if touched:  # open pages of the app refetch what the agent changed
            ops.notify(touched[0], "episodes" if touched[1] else "series", touched[1])
        if isinstance(out, list) and out and isinstance(out[0], dict) and "type" in out[0]:
            return out
        return [{"type": "text", "text": json.dumps(out, ensure_ascii=False, default=str)}]


def _touched(args: BaseModel) -> tuple[int | None, int | None] | None:
    """``(series id, episode id)`` a changing tool works on (looked up before it runs: it may delete it)."""
    a = args.model_dump()
    with session_scope() as db:
        project = None
        if a.get("episode_id"):
            project = db.get(Project, a["episode_id"])
        elif a.get("block_id"):
            block = db.get(EpisodeBlock, a["block_id"])
            project = block.project if block else None
        elif a.get("scene_id"):
            scene = db.get(Scene, a["scene_id"])
            project = scene.track.project if scene else None
        if project is not None:
            return project.series_id, project.id
        if a.get("series_id"):
            return a["series_id"], None
        if a.get("kind") in ("character", "location") and a.get("id"):
            ref = db.get(SeriesCharacter if a["kind"] == "character" else SeriesLocation, a["id"])
            return (ref.series_id, None) if ref else None
    return (None, None) if a.get("channel_id") else None  # a new series: the list refetches


TOOLS: dict[str, Tool] = {}


def tool(name: str, title: str, args: type[BaseModel], *, read_only: bool = False, destructive: bool = False):
    def deco(fn: Callable[[Any], Any]) -> Callable[[Any], Any]:
        TOOLS[name] = Tool(name, title, (fn.__doc__ or "").strip(), args, fn, read_only, destructive)
        return fn
    return deco


class NoArgs(BaseModel):
    pass


# ===================================================================== overview
@tool("overview", "Обзор студии", NoArgs, read_only=True)
def overview(_: NoArgs) -> dict[str, Any]:
    """Каналы (id, название), сериалы и остатки лимитов. Начните работу с этого вызова."""
    with session_scope() as db:
        channels = [{"id": c.id, "name": c.name, "description": c.description} for c in db.query(Channel).order_by(Channel.id)]
        series = [ops.series_to_dict(db, s) for s in db.query(Series).order_by(Series.id)]
    return {"channels": channels, "series": series, "quotas": _quotas(with_balance=False)}


def _quotas(with_balance: bool) -> dict[str, Any]:
    out: dict[str, Any] = {"gemini_tts": gemini_tts.usage_status()}
    try:
        out["fastgen_images_hour"] = limiter.status()
        out["fastgen_llm_tokens_hour"] = token_limiter.status()
    except Exception as exc:  # noqa: BLE001 – status is informational
        out["fastgen_error"] = str(exc)
    if with_balance:
        try:
            with LumeanClient() as lm:
                out["lumean_balance"] = lm.balance()
        except ApiError as exc:
            out["lumean_error"] = exc.message
    return out


@tool("quotas", "Лимиты и баланс", NoArgs, read_only=True)
def quotas(_: NoArgs) -> dict[str, Any]:
    """Остатки: запросы Gemini TTS по ключам на сегодня (и время сброса), кредиты картинок и токены LLM \
FastGen за час, баланс Lumean."""
    return _quotas(with_balance=True)


@tool("list_voices", "Голоса", NoArgs, read_only=True)
def list_voices(_: NoArgs) -> dict[str, Any]:
    """Голоса для героев: встроенные голоса Gemini TTS (имя, обычно мужской/женский, характер) и шаблоны \
Lumean аккаунта (их id годится как voice.template_id героя или запасной голос, а также как голос диктора)."""
    out: dict[str, Any] = {"gemini": [{"voice": n, "gender": g, "character": c} for n, (g, c) in gemini_tts.VOICES.items()]}
    try:
        with LumeanClient() as lm:
            out["lumean_templates"] = [{"id": t.get("id"), "name": t.get("name")} for t in lm.templates()]
    except ApiError as exc:
        out["lumean_error"] = exc.message
    return out


# ===================================================================== series
class SeriesOptionsIn(BaseModel):
    narrator_template_id: str | None = Field(None, description="Шаблон Lumean диктора (пусто — голос канала)")
    narrator_speed: float | None = Field(None, ge=0.7, le=1.2)
    gap: float | None = Field(None, description="Пауза после блока, с (0.5)")
    line_gap: float | None = Field(None, description="Пауза между репликами подряд, с (0.3)")
    lead_in: float | None = None
    tail: float | None = None
    music_volume: float | None = Field(None, description="Громкость музыки относительно речи, дБ (−16)")
    ambience_volume: float | None = Field(None, description="Громкость эмбиента, дБ (−22)")
    sfx_volume: float | None = Field(None, description="Громкость эффектов, дБ (−6)")
    duck_db: float | None = Field(None, description="На сколько дБ музыка уходит под речь (10)")
    line_style: str | None = Field(None, description="Общая пометка ко всем репликам Gemini (акцент, эпоха…)")
    speaker_names_in_subtitles: bool | None = None


class SeriesIn(BaseModel):
    name: str | None = None
    logline: str | None = Field(None, description="О чём сериал, 1–2 предложения")
    setting: str | None = Field(None, description="Мир: место, эпоха, правила, атмосфера")
    bible: str | None = Field(None, description="Библия: тон, темы, арки, правила сюжета")
    visual_style: str | None = Field(None, description="Стиль картинок по-английски (заменяет стиль канала)")
    language: str | None = Field(None, description="Код языка озвучки: ru, en, …")
    options: SeriesOptionsIn | None = None

    def data(self) -> dict[str, Any]:
        d = self.model_dump(exclude_none=True)
        if self.options:
            d["options"] = self.options.model_dump(exclude_none=True)
        return d


class CreateSeriesIn(SeriesIn):
    channel_id: int = Field(description="Канал, к которому относятся серии")
    name: str


@tool("create_series", "Создать сериал", CreateSeriesIn)
def create_series(a: CreateSeriesIn) -> dict[str, Any]:
    """Создать сериал в канале. Серии станут проектами канала и унаследуют его настройки."""
    with session_scope() as db:
        s = ops.create_series(db, {"channel_id": a.channel_id, **a.data()})
        return ops.series_to_dict(db, s, full=True)


class UpdateSeriesIn(SeriesIn):
    series_id: int


@tool("update_series", "Изменить сериал", UpdateSeriesIn)
def update_series(a: UpdateSeriesIn) -> dict[str, Any]:
    """Изменить поля сериала (переданные поля заменяются, options дополняются)."""
    with session_scope() as db:
        s = ops.update_series(db, ops.get_series(db, a.series_id), a.data())
        return ops.series_to_dict(db, s, full=True)


class SeriesIdIn(BaseModel):
    series_id: int


@tool("get_series", "Сериал целиком", SeriesIdIn, read_only=True)
def get_series(a: SeriesIdIn) -> dict[str, Any]:
    """Всё о сериале: мир, библия, стиль, настройки, персонажи (с голосами и референсами), локации, \
серии и story_so_far — синопсисы и итоги всех серий по порядку."""
    with session_scope() as db:
        return ops.series_context(db, ops.get_series(db, a.series_id))


# ===================================================================== cast
class VoiceIn(BaseModel):
    provider: Literal["gemini", "lumean"] = "gemini"
    voice: str | None = Field(None, description="Голос Gemini (list_voices), напр. Kore")
    style: str | None = Field(None, description="Как звучит герой, по-английски: возраст, тембр, манера")
    template_id: str | None = Field(None, description="Шаблон Lumean: голос героя (provider=lumean) или запасной, "
                                                      "когда у Gemini кончились запросы")


class CharacterIn(BaseModel):
    series_id: int
    character_id: int | None = Field(None, description="Для изменения существующего")
    name: str | None = None
    description: str | None = Field(None, description="Внешность по-английски: пол, возраст, лицо, волосы, "
                                                      "телосложение, постоянная одежда")
    role: str | None = None
    personality: str | None = Field(None, description="Характер, манера речи, мотивы")
    voice: VoiceIn | None = None


@tool("save_character", "Персонаж", CharacterIn)
def save_character(a: CharacterIn) -> dict[str, Any]:
    """Создать (без character_id) или изменить персонажа сериала. Изменение внешности не перерисовывает \
референс — вызовите generate_reference_images."""
    with session_scope() as db:
        s = ops.get_series(db, a.series_id)
        data = a.model_dump(exclude_none=True, exclude={"series_id", "character_id"})
        if a.voice:
            data["voice"] = a.voice.model_dump(exclude_none=True)
        c = ops.upsert_character(db, s, data, a.character_id)
        return ops.ref_to_dict(c)


class LocationIn(BaseModel):
    series_id: int
    location_id: int | None = None
    name: str | None = None
    description: str | None = Field(None, description="Как выглядит место, по-английски")


@tool("save_location", "Локация", LocationIn)
def save_location(a: LocationIn) -> dict[str, Any]:
    """Создать (без location_id) или изменить локацию сериала."""
    with session_scope() as db:
        s = ops.get_series(db, a.series_id)
        loc = ops.upsert_location(db, s, a.model_dump(exclude_none=True, exclude={"series_id", "location_id"}),
                                  a.location_id)
        return ops.ref_to_dict(loc)


class RefIdIn(BaseModel):
    kind: Literal["character", "location"]
    id: int


@tool("delete_reference", "Удалить персонажа/локацию", RefIdIn, destructive=True)
def delete_reference(a: RefIdIn) -> dict[str, Any]:
    """Удалить персонажа или локацию сериала (реплики этого персонажа останутся без говорящего)."""
    with session_scope() as db:
        model = SeriesCharacter if a.kind == "character" else SeriesLocation
        obj = db.get(model, a.id)
        if obj is None:
            raise ToolError("Не найдено")
        ops.delete_ref(db, obj)
    return {"ok": True}


class RefImagesIn(BaseModel):
    series_id: int
    character_ids: list[int] = Field(default_factory=list)
    location_ids: list[int] = Field(default_factory=list)
    prompts: dict[str, str] = Field(default_factory=dict, description='Свои промпты: {"character:<id>": "...", '
                                                                      '"location:<id>": "..."} по-английски')


@tool("generate_reference_images", "Нарисовать референсы", RefImagesIn)
def generate_reference_images(a: RefImagesIn) -> dict[str, Any]:
    """Нарисовать референсы: указанных персонажей/локаций (заново), а без списков — всех, у кого их нет. \
Персонаж рисуется листом «в полный рост + лицо», локация — общим планом без людей. Возвращает job_id."""
    with session_scope() as db:
        s = ops.get_series(db, a.series_id)
        job_id = ops.start_refs_job(db, s, a.model_dump(exclude={"series_id"}))
    return {"job_id": job_id}


class RefFileIn(RefIdIn):
    file_path: str = Field(description="Путь к изображению на этом компьютере")


@tool("set_reference_image", "Свой референс", RefFileIn)
def set_reference_image(a: RefFileIn) -> dict[str, Any]:
    """Поставить своё изображение (файл на этом компьютере) референсом персонажа или локации."""
    with session_scope() as db:
        obj = db.get(SeriesCharacter if a.kind == "character" else SeriesLocation, a.id)
        if obj is None:
            raise ToolError("Не найдено")
        ops.set_ref_image(db, obj, Path(a.file_path))
        return ops.ref_to_dict(obj)


class ViewImageIn(BaseModel):
    kind: Literal["character", "location", "scene", "thumbnail"]
    id: int = Field(description="id персонажа, локации или сцены; для thumbnail — id серии")
    index: int = Field(0, description="Для thumbnail: индекс обложки")
    max_side: int = Field(1024, ge=256, le=1600)


def _image_content(img: Any, max_side: int, caption: str) -> list[dict[str, Any]]:
    h, w = img.shape[:2]
    k = min(1.0, max_side / max(h, w))
    if k < 1:
        img = cv2.resize(img, (int(w * k), int(h * k)), interpolation=cv2.INTER_AREA)
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return [{"type": "image", "data": base64.b64encode(buf.tobytes()).decode(), "mimeType": "image/jpeg"},
            {"type": "text", "text": caption}]


@tool("view_image", "Посмотреть картинку", ViewImageIn, read_only=True)
def view_image(a: ViewImageIn) -> list[dict[str, Any]]:
    """Показать картинку: референс персонажа/локации, кадр сцены или обложку серии — чтобы проверить сходство и качество."""
    with session_scope() as db:
        if a.kind == "thumbnail":
            p = ops.get_episode(db, a.id)
            t = ops.episode_track(p)
            concepts = llm_tasks.thumbnail_files(dict(t.publish_meta or {}), list(t.thumbnails or []))
            if not 0 <= a.index < len(concepts):
                raise ToolError(f"Нет обложки с индексом {a.index} (всего {len(concepts)})")
            c = concepts[a.index]
            rel = c.get("file")
            caption = f"Обложка {a.index}: «{c.get('headline') or ''}», название в пару: {c.get('title') or '—'}"
        elif a.kind == "scene":
            sc = db.get(Scene, a.id)
            if sc is None:
                raise ToolError("Сцена не найдена")
            d = scene_to_dict(sc)
            rel = sc.source_scene.image_file if sc.source_scene_id and sc.source_scene else sc.image_file
            caption = f"Сцена #{sc.id} ({d['start']}–{d['end']} с): {sc.prompt[:400]}"
        else:
            obj = db.get(SeriesCharacter if a.kind == "character" else SeriesLocation, a.id)
            if obj is None:
                raise ToolError("Не найдено")
            rel, caption = obj.image_file, f"{obj.name}: {obj.description[:400]}"
    path = to_abs(rel)
    if not path or not path.exists():
        raise ToolError("Картинки ещё нет")
    return _image_content(imread(path), a.max_side, caption)


# ===================================================================== episodes
class CreateEpisodeIn(BaseModel):
    series_id: int
    title: str
    number: int | None = Field(None, description="Номер серии (по умолчанию следующий)")
    synopsis: str = Field("", description="План серии")


@tool("create_episode", "Новая серия", CreateEpisodeIn)
def create_episode(a: CreateEpisodeIn) -> dict[str, Any]:
    """Создать серию. Дальше — set_screenplay."""
    with session_scope() as db:
        p = ops.create_episode(db, ops.get_series(db, a.series_id), a.model_dump(exclude={"series_id"}))
        return ops.episode_summary_dict(db, p)


class UpdateEpisodeIn(BaseModel):
    episode_id: int
    title: str | None = None
    number: int | None = None
    synopsis: str | None = None
    summary: str | None = Field(None, description="Что произошло в серии (память сериала для следующих серий)")


@tool("update_episode", "Изменить серию", UpdateEpisodeIn)
def update_episode(a: UpdateEpisodeIn) -> dict[str, Any]:
    """Название, номер, синопсис или итог серии (summary)."""
    with session_scope() as db:
        p = ops.update_episode(db, ops.get_episode(db, a.episode_id), a.model_dump(exclude_none=True))
        return ops.episode_summary_dict(db, p)


class EpisodeIdIn(BaseModel):
    episode_id: int


@tool("get_episode", "Серия целиком", EpisodeIdIn, read_only=True)
def get_episode(a: EpisodeIdIn) -> dict[str, Any]:
    """Серия: блоки сценария (со статусом озвучки и позицией на таймлайне), звуки (с окном на таймлайне), \
счётчики сцен/картинок, видео и активные задачи."""
    with session_scope() as db:
        return ops.episode_to_dict(db, ops.get_episode(db, a.episode_id))


class BlockIn(BaseModel):
    id: int | None = Field(None, description="Существующий блок (сохранит озвучку, если текст не менялся)")
    kind: Literal["narration", "line", "pause"] = "narration"
    character: str | None = Field(None, description="Говорящий (имя или id) — для line")
    text: str = Field("", description="Текст диктора или реплики на языке сериала")
    direction: str = Field("", description="Как произнести реплику (по-английски лучше): шёпотом, со злостью…")
    location: str | None = Field(None, description="Локация (имя или id); дальше наследуется")
    visible: list[str] = Field(default_factory=list, description="Кто ещё в кадре (имена)")
    visual: str = Field("", description="Что показать, по-английски — промпт сцен этого блока")
    shots: int | None = Field(None, description="Сколько картинок на блок (иначе по длительности)")
    pause: float | None = Field(None, description="Длина паузы, с (для pause)")
    gap_after: float | None = Field(None, description="Своя пауза после блока, с")

    def data(self) -> dict[str, Any]:
        d = self.model_dump(exclude_none=True)
        if self.location is None:
            d.pop("location", None)
        return d


class ScreenplayIn(BaseModel):
    episode_id: int
    blocks: list[BlockIn]


@tool("set_screenplay", "Сценарий серии", ScreenplayIn)
def set_screenplay(a: ScreenplayIn) -> dict[str, Any]:
    """Заменить весь сценарий серии списком блоков. Неизменённые блоки (тот же id или тот же говорящий, \
текст и подача) сохраняют озвучку."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        return ops.set_screenplay(db, p, [b.data() for b in a.blocks])


class InsertBlocksIn(BaseModel):
    episode_id: int
    after_block_id: int | None = Field(None, description="Вставить после этого блока; 0 — в начало; пусто — в конец")
    blocks: list[BlockIn]


@tool("insert_blocks", "Вставить блоки", InsertBlocksIn)
def insert_blocks(a: InsertBlocksIn) -> dict[str, Any]:
    """Вставить блоки в сценарий."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        new = ops.insert_blocks(db, p, [b.data() for b in a.blocks], a.after_block_id)
        return {"inserted": [b.id for b in new]}


class UpdateBlockIn(BaseModel):
    block_id: int
    kind: Literal["narration", "line", "pause"] | None = None
    character: str | None = None
    text: str | None = None
    direction: str | None = None
    location: str | None = Field(None, description="Имя/id локации; пустая строка — убрать")
    visible: list[str] | None = None
    visual: str | None = None
    shots: int | None = None
    pause: float | None = None
    gap_after: float | None = None
    position: int | None = Field(None, description="Переместить на позицию (с 0)")


@tool("update_block", "Изменить блок", UpdateBlockIn)
def update_block(a: UpdateBlockIn) -> dict[str, Any]:
    """Изменить один блок. Изменение текста, подачи или говорящего потребует переозвучки блока."""
    with session_scope() as db:
        b = db.get(EpisodeBlock, a.block_id)
        if b is None:
            raise ToolError("Блок не найден")
        data = a.model_dump(exclude_unset=True, exclude={"block_id"})
        b = ops.update_block(db, b, data)
        series = ops.get_series(db, b.project.series_id)
        return ops.block_to_dict(b, series, ops.narrator_template(db, series), ops.ep.series_options(series))


class DeleteBlocksIn(BaseModel):
    episode_id: int
    block_ids: list[int]


@tool("delete_blocks", "Удалить блоки", DeleteBlocksIn, destructive=True)
def delete_blocks(a: DeleteBlocksIn) -> dict[str, Any]:
    """Удалить блоки сценария (с их озвучкой)."""
    with session_scope() as db:
        return {"deleted": ops.delete_blocks(db, ops.get_episode(db, a.episode_id), a.block_ids)}


class VoiceBlocksIn(BaseModel):
    episode_id: int
    block_ids: list[int] = Field(default_factory=list, description="Только эти (пусто — все неозвученные/изменённые)")
    force: bool = Field(False, description="Переозвучить указанные, даже если они актуальны (новый дубль)")


@tool("voice_blocks", "Озвучить блоки", VoiceBlocksIn)
def voice_blocks(a: VoiceBlocksIn) -> dict[str, Any]:
    """Озвучить блоки: диктор — Lumean, реплики — голосом героя (Gemini TTS; когда запросы кончились — \
запасной голос Lumean, если задан). Возвращает job_id."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        return {"job_id": ops.start_episode_job(db, p, "episode_voice",
                                                {"block_ids": a.block_ids, "force": a.force})}


class BlockIdIn(BaseModel):
    block_id: int


@tool("transcribe_block", "Проверить реплику", BlockIdIn)
def transcribe_block(a: BlockIdIn) -> dict[str, Any]:
    """Распознать, что на самом деле сказано в озвучке блока (результат — в задаче: heard/expected)."""
    with session_scope() as db:
        b = db.get(EpisodeBlock, a.block_id)
        if b is None:
            raise ToolError("Блок не найден")
        p = b.project
        track = ops.episode_track(p)
        job = runner.enqueue("transcribe_block", project_id=p.id, track_id=track.id,
                             params={"block_id": b.id, "series_id": p.series_id})
    return {"job_id": job.id}


class CueIn(BaseModel):
    id: int | None = Field(None, description="Существующий звук (сохранит готовое аудио)")
    kind: Literal["music", "ambience", "sfx"]
    prompt: str = Field(description="Описание по-английски: жанр/настроение/инструменты или сам звук")
    start_block_id: int | None = Field(None, description="Привязка к блоку (пусто — начало серии)")
    anchor: Literal["start", "end"] = "start"
    offset: float = Field(0.0, description="Сдвиг от точки привязки, с (может быть отрицательным)")
    end_block_id: int | None = Field(None, description="Музыка/эмбиент до конца этого блока (пусто — до конца серии)")
    duration: float | None = Field(None, description="Длина эффекта, с (0.5–30; пусто — авто)")
    volume: float = Field(0.0, description="Громкость относительно уровня слоя, дБ")
    fade_in: float = 1.0
    fade_out: float = 1.5


class CuesIn(BaseModel):
    episode_id: int
    cues: list[CueIn]


@tool("set_sound_cues", "Звуковой дизайн", CuesIn)
def set_sound_cues(a: CuesIn) -> dict[str, Any]:
    """Заменить весь звуковой дизайн серии: music — подложка (уходит под речь), ambience — фон-петля, \
sfx — эффект в момент. Привязка к блокам переживает переозвучку и правки таймлайна."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        cues = ops.set_cues(db, p, [c.model_dump() for c in a.cues])
        return {"cues": [c.id for c in cues]}


class GenSoundsIn(BaseModel):
    episode_id: int
    cue_ids: list[int] = Field(default_factory=list)
    force: bool = False


@tool("generate_sounds", "Создать звуки", GenSoundsIn)
def generate_sounds(a: GenSoundsIn) -> dict[str, Any]:
    """Сгенерировать музыку и звуки в Lumean (недостающие или указанные). Музыку лучше генерировать после \
озвучки: длина подложки берётся из таймлайна. Возвращает job_id."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        return {"job_id": ops.start_episode_job(db, p, "episode_sounds", {"cue_ids": a.cue_ids, "force": a.force})}


class AssembleIn(BaseModel):
    episode_id: int
    rebuild_scenes: bool = Field(False, description="Пересоздать сцены по блокам (промпты и картинки сцен пропадут)")


@tool("assemble_episode", "Собрать серию", AssembleIn)
def assemble_episode(a: AssembleIn) -> dict[str, Any]:
    """Собрать дорожку серии: озвученные блоки с паузами + музыка/эмбиент/эффекты с приглушением музыки под \
речью; тайминги и субтитры; при первой сборке — сцены по блокам (затем они только сдвигаются). \
Возвращает job_id."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        return {"job_id": ops.start_episode_job(db, p, "episode_assemble", {"rebuild_scenes": a.rebuild_scenes})}


# ===================================================================== scenes & images
def _cast_names(project: Project) -> tuple[dict[int, Character], dict[str, int], dict[str, int]]:
    by_id = {c.id: c for c in project.characters}
    people = {c.name.strip().lower(): c.id for c in project.characters if c.kind != "location"}
    places = {c.name.strip().lower(): c.id for c in project.characters if c.kind == "location"}
    return by_id, people, places


@tool("get_scenes", "Сцены серии", EpisodeIdIn, read_only=True)
def get_scenes(a: EpisodeIdIn) -> dict[str, Any]:
    """Сцены (кадры) серии: время, текст, промпт, кто в кадре, локация, статус картинки, блок сценария."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        by_id, _, _ = _cast_names(p)
        out = []
        for s in ops.episode_track(p).scenes:
            ids = s.characters or []
            out.append({
                "id": s.id, "idx": s.idx, "start": round(s.start, 2), "end": round(s.end, 2), "text": s.text,
                "prompt": s.prompt, "block_id": (s.image_meta or {}).get("block_id"),
                "characters": [by_id[i].name for i in ids if i in by_id and by_id[i].kind != "location"],
                "location": next((by_id[i].name for i in ids if i in by_id and by_id[i].kind == "location"), None),
                "continuity": s.continuity, "image_status": s.image_status, "image_error": s.image_error,
            })
        return {"scenes": out}


class SceneEdit(BaseModel):
    id: int
    prompt: str | None = Field(None, description="Промпт кадра по-английски (внешность героев не описывайте — "
                                                 "её дают референсы; опишите действие, позу, эмоцию, план)")
    characters: list[str] | None = Field(None, description="Кто в кадре (имена, до 3)")
    location: str | None = Field(None, description="Локация (имя); пустая строка — без локации")
    continue_previous: str | None = Field(None, description="Продолжить предыдущий кадр: что меняется "
                                                            "(по-английски); пустая строка — новый кадр")


class UpdateScenesIn(BaseModel):
    episode_id: int
    scenes: list[SceneEdit]


@tool("update_scenes", "Изменить сцены", UpdateScenesIn)
def update_scenes(a: UpdateScenesIn) -> dict[str, Any]:
    """Задать промпты, героев и локации сцен. Изменённые картинки перерисуйте generate_images."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        by_id, people, places = _cast_names(p)
        scenes = {s.id: s for s in ops.episode_track(p).scenes}
        for e in a.scenes:
            s = scenes.get(e.id)
            if s is None:
                raise ToolError(f"Сцена #{e.id} не из этой серии")
            if e.prompt is not None:
                s.prompt, s.prompt_locked = e.prompt.strip(), True
            ids = list(s.characters or [])
            if e.characters is not None:
                missing = [n for n in e.characters if n.strip().lower() not in people]
                if missing:
                    raise ToolError(f"Неизвестные персонажи: {', '.join(missing)}. Есть: "
                                    + ", ".join(c.name for c in by_id.values() if c.kind != "location"))
                ids = [people[n.strip().lower()] for n in e.characters] + \
                      [i for i in ids if i in by_id and by_id[i].kind == "location"]
            if e.location is not None:
                ids = [i for i in ids if i in by_id and by_id[i].kind != "location"]
                if e.location.strip():
                    lid = places.get(e.location.strip().lower())
                    if lid is None:
                        raise ToolError(f"Неизвестная локация «{e.location}». Есть: "
                                        + ", ".join(c.name for c in by_id.values() if c.kind == "location"))
                    ids.append(lid)
            s.characters = list(dict.fromkeys(ids))
            if e.continue_previous is not None:
                s.continuity = {"change": e.continue_previous.strip()[:500]} if e.continue_previous.strip() and s.idx > 0 else None
        track_changed(ops.episode_track(p).id, "scenes")
    return {"updated": len(a.scenes)}


class SceneIdsIn(BaseModel):
    episode_id: int
    scene_ids: list[int] = Field(default_factory=list)
    force: bool = Field(False, description="Перерисовать/переписать и готовые")


@tool("write_scene_prompts", "Промпты сцен (LLM)", SceneIdsIn)
def write_scene_prompts(a: SceneIdsIn) -> dict[str, Any]:
    """Написать промпты сцен встроенной LLM (сцены без промпта, указанные или — с force — все незаблокированные). \
Промпты, заданные вами, не перезаписываются. Возвращает job_id."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        return {"job_id": ops.start_episode_job(db, p, "prompts", {"scene_ids": a.scene_ids, "overwrite": a.force})}


@tool("generate_images", "Нарисовать сцены", SceneIdsIn)
def generate_images(a: SceneIdsIn) -> dict[str, Any]:
    """Нарисовать картинки сцен с референсами героев и локаций (недостающие, указанные или — с force — все). \
Возвращает job_id."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        return {"job_id": ops.start_episode_job(db, p, "images", {"scene_ids": a.scene_ids, "force": a.force})}


class RenderIn(BaseModel):
    episode_id: int
    preview: bool = Field(False, description="Быстрое превью фрагмента вместо полного рендера")
    start: float = Field(0.0, description="Начало превью, с")
    length: float = Field(30.0, description="Длина превью, с")


@tool("render_episode", "Рендер", RenderIn)
def render_episode(a: RenderIn) -> dict[str, Any]:
    """Отрендерить видео серии (настройки рендера — из канала) или быстрое превью фрагмента. Возвращает job_id."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        if a.preview:
            return {"job_id": ops.start_episode_job(db, p, "preview", {"start": a.start, "length": a.length})}
        return {"job_id": ops.start_episode_job(db, p, "render", {})}


# ===================================================================== packaging (YouTube)
def _publish_dict(p: Project, t: Track) -> dict[str, Any]:
    meta = dict(t.publish_meta or {})
    concepts = llm_tasks.thumbnail_files(meta, list(t.thumbnails or []))
    return {
        "episode_title": p.name,
        "title": (meta.get("titles") or [""])[0],
        "alt_titles": (meta.get("titles") or [])[1:],
        "description": meta.get("description") or "\n\n".join(x for x in (meta.get("hook"), meta.get("about")) if x),
        "description_full": meta.get("description_full") or "",
        "tags": meta.get("tags") or [],
        "hashtags": meta.get("hashtags") or [],
        "chapters": meta.get("chapters") or [],
        "made_by": meta.get("made_by") or ("app" if meta.get("titles") else None),
        "thumbnails": [{
            "index": i, "title": c.get("title") or "", "headline": c.get("headline") or "",
            "accent": c.get("accent") or "", "side": c.get("side") or "", "prompt": c.get("prompt") or "",
            "characters": c.get("characters") or [], "location": c.get("location"),
            "image_path": str(to_abs(c["file"])) if c.get("file") else None,
        } for i, c in enumerate(concepts)],
        "video_path": str(to_abs(t.video_file)) if t.video_file else None,
        "preview_path": str(to_abs(t.preview_file)) if t.preview_file else None,
        "approved": bool(t.approved_at), "published": bool(t.published_at),
    }


def _save_concepts(t: Track, concepts: list[dict[str, Any]]) -> None:
    t.publish_meta = {**(t.publish_meta or {}), "thumbnails": concepts}
    t.thumbnails = [c["file"] for c in concepts if c.get("file")]


def _unlink(files: list[str | None]) -> None:
    for rel in files:
        path = to_abs(rel)
        if path and path.exists():
            path.unlink(missing_ok=True)


class PackagingIn(BaseModel):
    episode_id: int
    parts: list[Literal["metadata", "thumbnails"]] = Field(
        default_factory=lambda: ["metadata", "thumbnails"],
        description="metadata — названия, описание, теги, главы; thumbnails — идеи и отрисовка обложек")
    force: bool = Field(False, description="Сделать заново, даже если уже есть")


@tool("generate_packaging", "Упаковка (авто)", PackagingIn)
def generate_packaging(a: PackagingIn) -> dict[str, Any]:
    """Автоупаковка встроенной LLM, как у обычных роликов (ей сообщается сериал, номер и план серии). \
Обложки авто-идей рисуются без референсов героев. Для сериала надёжнее написать упаковку самому: \
set_metadata и set_thumbnails; автоупаковку можно взять как черновик и поправить. Возвращает job_ids."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        ids = run_pipeline(db, p, track_ids=None, steps=list(dict.fromkeys(a.parts)), force=a.force)
        db.commit()
    return {"job_ids": ids}


@tool("get_publish_info", "Упаковка серии", EpisodeIdIn, read_only=True)
def get_publish_info(a: EpisodeIdIn) -> dict[str, Any]:
    """Всё для публикации: название и варианты, описание (ваш текст и полное — с главами, футером канала и \
хэштегами), теги, главы, обложки (index, надпись, название в пару, путь к файлу), пути к видео, отметки."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        return _publish_dict(p, ops.episode_track(p))


class ChapterIn(BaseModel):
    title: str
    block_id: int | None = Field(None, description="Глава начинается с этого блока сценария")
    t: float | None = Field(None, description="…или с этой секунды видео")


class MetadataIn(BaseModel):
    episode_id: int
    title: str | None = Field(None, description="Название ролика на YouTube (до 100 символов, лучше до 60–70)")
    alt_titles: list[str] | None = Field(None, description="Запасные варианты названия")
    description: str | None = Field(None, description="Текст описания на языке сериала. Главы, футер канала и "
                                                      "хэштеги приложение добавит само — не пишите их сюда")
    tags: list[str] | None = Field(None, description="Теги (вместе до 500 символов)")
    hashtags: list[str] | None = Field(None, description="Хэштеги без # (YouTube показывает первые 3)")
    chapters: list[ChapterIn] | None = Field(None, description="Главы (тайм-коды в описании): от 3, первая — с "
                                                               "начала, каждая не короче 10 с; [] — без глав")
    footer: bool | None = Field(None, description="Добавлять футер описания из настроек канала (по умолчанию да)")


def _chapters(p: Project, items: list[ChapterIn]) -> tuple[list[dict[str, Any]], list[str]]:
    """Chapters with times (a block's start on the episode timeline) and what YouTube will not like."""
    series = p.series
    spans, _ = ops.ep.layout(list(p.blocks), ops.ep.series_options(series))
    start = {s.block_id: s.start for s in spans}
    out, notes = [], []
    for c in items:
        if c.block_id is not None:
            if c.block_id not in start:
                raise ToolError(f"Блок #{c.block_id} не из этой серии")
            t = start[c.block_id]
        elif c.t is not None:
            t = c.t
        else:
            raise ToolError(f"Главе «{c.title}» нужен block_id или t")
        out.append({"t": round(max(0.0, t), 1), "title": c.title.strip()})
    out.sort(key=lambda c: c["t"])
    if out and out[0]["t"] > 0:
        out[0]["t"] = 0.0
        notes.append("первая глава перенесена на 0:00 — YouTube этого требует")
    if out and len(out) < 3:
        notes.append("YouTube показывает главы, только если их от 3")
    if any(b["t"] - a["t"] < 10 for a, b in zip(out, out[1:])):
        notes.append("есть главы короче 10 с — YouTube тогда не покажет главы")
    return out, notes


@tool("set_metadata", "Название, описание, теги", MetadataIn)
def set_metadata(a: MetadataIn) -> dict[str, Any]:
    """Записать упаковку серии самому. Меняются только переданные поля — так можно и поправить автоупаковку. \
Полное описание собирается так: ваш текст → главы → футер канала → хэштеги. Возвращает итог (как \
get_publish_info) и замечания (warnings)."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        t = ops.episode_track(p)
        pub = effective_settings(p.channel.settings, p.settings).publish
        meta = dict(t.publish_meta or {})
        warnings: list[str] = []
        if a.title is not None or a.alt_titles is not None:
            current = list(meta.get("titles") or [])
            title = a.title.strip() if a.title is not None else (current[0] if current else "")
            if not title:
                raise ToolError("Нужно название")
            if len(title) > 100:
                raise ToolError(f"Название длиннее 100 символов ({len(title)}) — YouTube его не примет")
            if len(title) > packaging.TITLE_HARD_MAX:
                warnings.append(f"название длинное ({len(title)} симв.) — в выдаче обрежется")
            alts = [x.strip() for x in a.alt_titles] if a.alt_titles is not None else current[1:]
            meta["titles"] = list(dict.fromkeys(x for x in [title, *alts] if x))
            meta["title_info"] = [i for i in meta.get("title_info") or [] if i.get("text") in meta["titles"]]
        if a.description is not None:
            for key in ("hook", "about", "bullets", "bullets_heading"):
                meta.pop(key, None)
            meta["description"] = a.description.strip()
        if a.tags is not None:
            given = [x.strip().lstrip("#").strip() for x in a.tags]
            tags = list(dict.fromkeys(x for x in given if x))
            while tags and len(",".join(tags)) > 500:
                tags.pop()
            if len(tags) < len([x for x in given if x]):
                warnings.append(f"тегов осталось {len(tags)}: были повторы или вместе больше 500 символов")
            meta["tags"] = tags
        if a.hashtags is not None:
            meta["hashtags"] = list(dict.fromkeys(
                h for h in ("".join(x.strip().lstrip("#").split()) for x in a.hashtags) if h))
        if a.chapters is not None:
            meta["chapters"], notes = _chapters(p, a.chapters)
            warnings += notes
            if meta["chapters"] and not pub.with_chapters:
                warnings.append("главы сохранены, но в описание не попадут: у канала они выключены "
                                "(publish.with_chapters — update_settings)")
        if a.footer is not None:
            meta["footer"] = a.footer
        settings = pub if meta.get("footer", True) else pub.model_copy(update={"description_footer": ""})
        meta["description_full"] = llm_tasks.build_description(meta, settings, t.language)
        if len(meta["description_full"]) > 5000:
            raise ToolError(f"Полное описание длиннее 5000 символов ({len(meta['description_full'])}) — "
                            "сократите текст")
        meta["made_by"] = "agent"
        t.publish_meta = meta
        db.flush()
        track_changed(t.id, "metadata")
        return {**_publish_dict(p, t), "warnings": warnings}


class ThumbIn(BaseModel):
    prompt: str = Field(description="Картинка обложки по-английски: кто что делает, эмоция, план, фон. Внешность "
                                    "героев не описывайте (её дают референсы) и текст не пишите — надпись "
                                    "добавит программа")
    headline: str = Field("", description="Крупная надпись на обложке: 1–4 слова на языке сериала; пусто — без неё")
    accent: str = Field("", description="Слово из надписи, выделяемое цветом")
    side: Literal["left", "right"] = Field("right", description="Сторона главного объекта; надпись — на другой")
    characters: list[str] = Field(default_factory=list, description="Герои на обложке (имена, до 3) — их "
                                                                     "референсы уйдут в модель")
    location: str | None = Field(None, description="Локация (имя) — её референс тоже уйдёт в модель")
    title: str = Field("", description="Название ролика в пару к этой обложке")


class SetThumbsIn(BaseModel):
    episode_id: int
    thumbnails: list[ThumbIn]
    mode: Literal["replace", "append"] = Field("replace", description="replace — заменить все обложки, "
                                                                       "append — добавить к имеющимся")
    draw: bool = Field(True, description="Сразу нарисовать")


@tool("set_thumbnails", "Свои обложки", SetThumbsIn)
def set_thumbnails(a: SetThumbsIn) -> dict[str, Any]:
    """Задать идеи обложек самому: картинка, надпись, кто в кадре (по референсам героев и локаций) и название \
в пару. Стиль обложек — publish.thumbnail_style (get_settings / update_settings). Возвращает индексы и \
job_id отрисовки; результат смотрите view_image(kind="thumbnail", id=episode_id, index=…)."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        t = ops.episode_track(p)
        by_id, people, places = _cast_names(p)
        fresh = []
        for th in a.thumbnails:
            missing = [n for n in th.characters if n.strip().lower() not in people]
            if missing:
                raise ToolError(f"Неизвестные персонажи: {', '.join(missing)}. Есть: "
                                + ", ".join(c.name for c in by_id.values() if c.kind != "location"))
            cast = list(dict.fromkeys(people[n.strip().lower()] for n in th.characters))[:3]
            if th.location and th.location.strip():
                lid = places.get(th.location.strip().lower())
                if lid is None:
                    raise ToolError(f"Неизвестная локация «{th.location}». Есть: "
                                    + ", ".join(c.name for c in by_id.values() if c.kind == "location"))
                cast.append(lid)
            fresh.append({
                "prompt": th.prompt.strip(), "headline": th.headline.strip(), "accent": th.accent.strip(),
                "side": th.side, "title": th.title.strip(), "title_fixed": bool(th.title.strip()),
                "cast": cast, "characters": [by_id[i].name for i in cast if by_id[i].kind != "location"],
                "location": next((by_id[i].name for i in cast if by_id[i].kind == "location"), None),
                "made_by": "agent", "file": None,
            })
        concepts = llm_tasks.thumbnail_files(dict(t.publish_meta or {}), list(t.thumbnails or []))
        removed: list[str | None] = []
        if a.mode == "replace":
            removed, concepts = [c.get("file") for c in concepts], []
        indices = list(range(len(concepts), len(concepts) + len(fresh)))
        _save_concepts(t, concepts + fresh)
        db.flush()
        job_id = ops.start_episode_job(db, p, "thumbnails", {"indices": indices}) if a.draw and fresh else None
        track_changed(t.id, "metadata")
    _unlink(removed)
    return {"indices": indices, "job_id": job_id}


class ThumbIndicesIn(BaseModel):
    episode_id: int
    indices: list[int] = Field(default_factory=list, description="Индексы обложек (пусто — все)")


@tool("draw_thumbnails", "Перерисовать обложки", ThumbIndicesIn)
def draw_thumbnails(a: ThumbIndicesIn) -> dict[str, Any]:
    """Нарисовать обложки заново: та же идея, новая отрисовка. Возвращает job_id."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        return {"job_id": ops.start_episode_job(db, p, "thumbnails", {"indices": a.indices} if a.indices else {})}


@tool("delete_thumbnails", "Удалить обложки", ThumbIndicesIn, destructive=True)
def delete_thumbnails(a: ThumbIndicesIn) -> dict[str, Any]:
    """Удалить обложки по индексам (пусто — все). Индексы оставшихся сдвигаются."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        t = ops.episode_track(p)
        concepts = llm_tasks.thumbnail_files(dict(t.publish_meta or {}), list(t.thumbnails or []))
        drop = set(a.indices) if a.indices else set(range(len(concepts)))
        removed = [c.get("file") for i, c in enumerate(concepts) if i in drop]
        concepts = [c for i, c in enumerate(concepts) if i not in drop]
        _save_concepts(t, concepts)
        track_changed(t.id, "metadata")
    _unlink(removed)
    return {"left": len(concepts)}


class ThumbFileIn(BaseModel):
    episode_id: int
    file_path: str = Field(description="Путь к готовой картинке на этом компьютере (будет приведена к 1280×720)")
    index: int | None = Field(None, description="Заменить картинку этой обложки; пусто — добавить новую")
    title: str = Field("", description="Название в пару (для новой обложки)")


@tool("set_thumbnail_image", "Своя картинка обложки", ThumbFileIn)
def set_thumbnail_image(a: ThumbFileIn) -> dict[str, Any]:
    """Поставить готовое изображение (файл на этом компьютере) обложкой: новой или вместо существующей."""
    src = Path(a.file_path)
    if not src.is_file():
        raise ToolError(f"Файл не найден: {src}")
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        t = ops.episode_track(p)
        concepts = llm_tasks.thumbnail_files(dict(t.publish_meta or {}), list(t.thumbnails or []))
        if a.index is not None and not 0 <= a.index < len(concepts):
            raise ToolError(f"Нет обложки с индексом {a.index}")
        try:
            dest = make_thumbnail(src, track_dir(p.id, t.id, "thumbs") / unique_name("thumb_file", ".jpg"))
        except Exception as exc:  # noqa: BLE001 – any decoder error means "not an image"
            raise ToolError(f"Не удалось прочитать изображение: {exc}") from exc
        old = None
        if a.index is None:
            concepts.append({"prompt": "", "title": a.title.strip(), "title_fixed": bool(a.title.strip()),
                             "made_by": "file", "file": to_rel(dest)})
            index = len(concepts) - 1
        else:
            index, old = a.index, concepts[a.index].get("file")
            concepts[index]["file"] = to_rel(dest)
        _save_concepts(t, concepts)
        track_changed(t.id, "thumbnails")
    _unlink([old])
    return {"index": index, "image_path": str(dest)}


class MarkIn(BaseModel):
    episode_id: int
    approved: bool | None = Field(None, description="Видео проверено (только для отрендеренного)")
    published: bool | None = Field(None, description="Выложено на YouTube")


@tool("mark_episode", "Отметить серию", MarkIn)
def mark_episode(a: MarkIn) -> dict[str, Any]:
    """Отметки на доске канала: «проверено» и «выложено»."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        t = ops.episode_track(p)
        if a.approved and not t.video_file:
            raise ToolError("Сначала отрендерите видео (render_episode)")
        mark_track(t, a.approved, a.published)
        track_changed(t.id, "status")
        return {"approved": bool(t.approved_at), "published": bool(t.published_at)}


# ===================================================================== settings
SETTINGS_SECTIONS = ("voice", "scenes", "images", "llm", "render", "atmosphere", "subtitles", "chapters",
                     "unique", "publish")


class GetSettingsIn(BaseModel):
    episode_id: int | None = Field(None, description="Настройки, с которыми работает эта серия")
    series_id: int | None = Field(None, description="…или общие настройки сериала")
    sections: list[str] = Field(default_factory=list, description=f"Разделы: {', '.join(SETTINGS_SECTIONS)} "
                                                                  "(пусто — все)")


@tool("get_settings", "Настройки производства", GetSettingsIn, read_only=True)
def get_settings(a: GetSettingsIn) -> dict[str, Any]:
    """Действующие настройки (канал + сериал + серия): картинки, рендер, субтитры, атмосфера, главы в видео, \
упаковка (стиль обложек, футер описания…) — и что переопределено у сериала и у серии."""
    with session_scope() as db:
        if a.episode_id is not None:
            p = ops.get_episode(db, a.episode_id)
            series, own = p.series, dict(p.settings or {})
            effective = effective_settings(p.channel.settings, p.settings).model_dump()
        elif a.series_id is not None:
            series, own = ops.get_series(db, a.series_id), None
            channel = db.get(Channel, series.channel_id)
            effective = effective_settings(channel.settings if channel else {},
                                           ops.ep.episode_settings(series, {})).model_dump()
        else:
            raise ToolError("Нужен episode_id или series_id")
        wanted = [s for s in a.sections if s in SETTINGS_SECTIONS] or list(SETTINGS_SECTIONS)
        out: dict[str, Any] = {"effective": {k: effective[k] for k in wanted},
                               "series_overrides": (series.options or {}).get("settings") or {}}
        if own is not None:
            out["episode_overrides"] = own
        return out


class UpdateSettingsIn(BaseModel):
    episode_id: int | None = Field(None, description="Только для этой серии")
    series_id: int | None = Field(None, description="…или для всего сериала: всех серий, и будущих тоже")
    settings: dict[str, Any] = Field(description='Частичные настройки по разделам, напр. {"publish": '
                                                 '{"thumbnail_style": "..."}, "subtitles": {"enabled": true}}')


@tool("update_settings", "Изменить настройки", UpdateSettingsIn)
def update_settings(a: UpdateSettingsIn) -> dict[str, Any]:
    """Изменить настройки производства поверх настроек канала (сам канал не меняется). Переданные поля \
заменяются, остальные остаются. Готовые картинки и видео сами не переделываются."""
    unknown = [k for k in a.settings if k not in SETTINGS_SECTIONS]
    if unknown:
        raise ToolError(f"Неизвестные разделы: {', '.join(unknown)}. Есть: {', '.join(SETTINGS_SECTIONS)}")
    with session_scope() as db:
        if a.episode_id is not None:
            p = ops.get_episode(db, a.episode_id)
            return {"episode_overrides": ops.update_episode_settings(db, p, a.settings)}
        if a.series_id is not None:
            s = ops.get_series(db, a.series_id)
            return {"series_overrides": ops.update_series_settings(db, s, a.settings)}
    raise ToolError("Нужен episode_id или series_id")


# ===================================================================== episode housekeeping
class SceneFileIn(BaseModel):
    scene_id: int
    file_path: str = Field(description="Путь к изображению на этом компьютере")


@tool("set_scene_image", "Своя картинка сцены", SceneFileIn)
def set_scene_image(a: SceneFileIn) -> dict[str, Any]:
    """Поставить своё изображение (файл на этом компьютере) картинкой сцены."""
    src = Path(a.file_path)
    if not src.is_file():
        raise ToolError(f"Файл не найден: {src}")
    with session_scope() as db:
        s = db.get(Scene, a.scene_id)
        if s is None or not s.track.project.series_id:
            raise ToolError("Сцена не найдена")
        try:
            img = imread(src)
        except Exception as exc:  # noqa: BLE001 – any decoder error means "not an image"
            raise ToolError(f"Не удалось прочитать изображение: {exc}") from exc
        dest = imwrite(track_dir(s.track.project_id, s.track_id, "images") / unique_name(f"scene_{s.id}", ".jpg"),
                       img, quality=95)
        old = s.image_file
        s.image_file, s.image_status, s.image_error = to_rel(dest), "done", None
        s.image_meta = {**(s.image_meta or {}), "uploaded": True, "filename": src.name}
        s.source_scene_id = None  # a manual image overrides the shared one
        track_changed(s.track_id, "images")
    _unlink([old])
    return {"scene_id": a.scene_id, "image_status": "done"}


@tool("delete_episode", "Удалить серию", EpisodeIdIn, destructive=True)
def delete_episode(a: EpisodeIdIn) -> dict[str, Any]:
    """Удалить серию целиком: сценарий, озвучку, звуки, картинки, видео. Необратимо."""
    with session_scope() as db:
        ops.delete_episode(db, ops.get_episode(db, a.episode_id))
    return {"deleted": a.episode_id}


class FrameIn(BaseModel):
    episode_id: int
    t: float = Field(description="Секунда видео")
    source: Literal["video", "preview"] = Field("video", description="Полный рендер или последнее превью "
                                                                     "(время превью — от его начала)")
    max_side: int = Field(1280, ge=256, le=1920)


@tool("view_video_frame", "Кадр из видео", FrameIn, read_only=True)
def view_video_frame(a: FrameIn) -> list[dict[str, Any]]:
    """Показать кадр отрендеренного видео или превью: проверить субтитры, движение, переходы, карточки глав."""
    with session_scope() as db:
        p = ops.get_episode(db, a.episode_id)
        t = ops.episode_track(p)
        path = to_abs(t.video_file if a.source == "video" else t.preview_file)
    if not path or not path.exists():
        raise ToolError("Видео ещё нет — render_episode" + (" с preview=true" if a.source == "preview" else ""))
    duration = probe_duration(path)
    if not 0 <= a.t < duration:
        raise ToolError(f"Видео длится {duration:.1f} с — укажите t от 0 до {max(0.0, duration - 0.1):.1f}")
    try:
        proc = run([ffmpeg_bin(), "-v", "error", "-ss", f"{a.t:.3f}", "-i", str(path), "-frames:v", "1",
                    "-f", "image2pipe", "-vcodec", "png", "-"], timeout=60)
    except RuntimeError as exc:
        raise ToolError(f"Не удалось взять кадр: {exc}") from exc
    img = cv2.imdecode(np.frombuffer(proc.stdout, dtype=np.uint8), cv2.IMREAD_COLOR) if proc.stdout else None
    if img is None:
        raise ToolError("Не удалось взять кадр в этот момент")
    return _image_content(img, a.max_side, f"{a.source} @ {a.t:.1f} с")


# ===================================================================== jobs
class JobsIn(BaseModel):
    job_ids: list[int] = Field(default_factory=list)
    episode_id: int | None = None


def _jobs(ids: list[int]) -> list[dict[str, Any]]:
    with session_scope() as db:
        out = []
        for i in ids:
            j = db.get(Job, i)
            if j is None:
                out.append({"id": i, "status": "missing"})
                continue
            d = job_to_dict(j)
            out.append({k: d[k] for k in ("id", "kind", "title", "status", "progress", "message", "error", "result")})
        return out


@tool("get_jobs", "Задачи", JobsIn, read_only=True)
def get_jobs(a: JobsIn) -> dict[str, Any]:
    """Статус задач по id; без id — активные задачи серии (или все активные)."""
    if a.job_ids:
        return {"jobs": _jobs(a.job_ids)}
    with session_scope() as db:
        return {"jobs": ops.active_jobs(db, a.episode_id)}


class WaitIn(BaseModel):
    job_ids: list[int]
    timeout_seconds: float = Field(50, ge=1, le=55)


@tool("wait_for_jobs", "Дождаться задач", WaitIn, read_only=True)
def wait_for_jobs(a: WaitIn) -> dict[str, Any]:
    """Ждать завершения задач (до timeout_seconds) и вернуть их статус. Если ещё идут — вызовите снова."""
    deadline = time.time() + a.timeout_seconds
    while True:
        jobs = _jobs(a.job_ids)
        if all(j["status"] not in ("queued", "running") for j in jobs) or time.time() >= deadline:
            return {"jobs": jobs, "all_finished": all(j["status"] not in ("queued", "running") for j in jobs)}
        time.sleep(1.0)


class JobIdIn(BaseModel):
    job_id: int


@tool("cancel_job", "Отменить задачу", JobIdIn, destructive=True)
def cancel_job(a: JobIdIn) -> dict[str, Any]:
    """Отменить задачу."""
    return {"cancelled": runner.cancel(a.job_id)}

