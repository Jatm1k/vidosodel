# Inflight API — документация для клиентов

Адрес: **`https://api.varag.video`**. Все запросы — HTTPS, тела — JSON (UTF-8). Время во всех ответах — секунды
Unix (UTC), дробные.

## 1. Ключ

Каждый запрос (кроме скачивания готового файла) несёт ключ в заголовке:

```
X-API-Key: mk_…
```

Ключ = тариф. Ключ без заголовка, чужой или выключенный — `401 INVALID_API_KEY`. Ключ показывается один раз, при
выдаче; потеряли — попросите новый (прежний сразу перестанет работать).

## 2. Как устроена работа

- **Слоты.** У тарифа есть слоты — сколько ваших задач одновременно в работе (отдельно для видео и для картинок).
  Слот занят с момента приёма задачи и до её исхода (готово, отказ, сбой, снята). Свободных слотов нет — задача
  **не принимается** (`429 SLOTS_BUSY`): очередь держите у себя и присылайте следующую, когда слот освободится.
  Задачи, отклонённые с `SLOTS_BUSY`, остаются в очереди клиента.
- **Объём.** Тариф — либо объём на срок (`quota: month`: N роликов и M картинок до даты окончания), либо дневная
  квота (`quota: day`: N роликов и M картинок в сутки, сброс в 00:00 UTC). Остаток видно в `/v1/account/usage`.
- **Списание — за готовое.** Одна штука списывается, когда задача готова и ссылка выдана. Повторный запрос той же
  готовой задачи ничего не списывает. Отказ по содержанию и сбой ничего не списывают (кроме платных отказов, см. 9).
- **Виды тарифа** (`plan`):

  | `plan` | Что можно | Слоты |
  |---|---|---|
  | `images` | только картинки | слоты картинок |
  | `video` | только видео | слоты видео |
  | `chain` | видео и картинки | общие на оба вида: одновременно не больше N задач в любой смеси |
  | `parallel` | видео и картинки одновременно | у каждого вида свои |

- **Присылайте задачи вместе.** Задачи, присланные списком (`POST /v1/jobs`) или подряд без пауз, и делаются
  вместе — так быстрее. Обычно задача занимает 1–4 минуты; фактическое время зависит от загрузки.
- **Частота запросов** — не больше 20 в секунду на ключ и на адрес (кратковременно — до 60 подряд). Сверх —
  `429 TOO_MANY_REQUESTS`: подождите секунду и повторите. Опрашивать состояние достаточно раз в 3–5 секунд, все свои
  задачи одним запросом (`GET /v1/tasks?ids=…`).

## 3. Тариф и занятость

### `GET /v1/account` (то же — `GET /v1/account/info`)

Сведения о тарифе — меняются редко.

```json
{
  "name": "ivan",
  "plan": "parallel",
  "quota": "month",
  "services": ["video", "image"],
  "expires": 1791769607.37,
  "refusals_paid": false,
  "rules": "видео и картинки одновременно, у каждого вида свои слоты",
  "video": {"bought": 1000, "slots": 12},
  "image": {"bought": 1000, "slots": 12}
}
```

`bought` — куплено штук на срок (или в сутки при `quota: day`), `slots` — слотов. У `chain` ещё `pool_slots` — общие
слоты на оба вида. `expires` — срок тарифа (`null` — без срока).

### `GET /v1/account/usage`

Занятость сейчас.

```json
{
  "plan": "parallel",
  "quota": "month",
  "video": {"slots": 12, "busy": 3, "free": 9, "left": 958},
  "image": {"slots": 12, "busy": 0, "free": 12, "left": 1000},
  "warning": "",
  "warning_code": "",
  "refusals_paid": false,
  "expires": 1791769607.37,
  "expired": false
}
```

`busy` — задач в работе, `free` — свободных слотов, `left` — сколько штук осталось (без учёта задач в работе). У
`chain` ещё `pool: {slots, busy, free}`; при `quota: day` — `resets_at` (когда сброс). `warning` / `warning_code` —
предупреждение о пределе отказов (раздел 9).

### Турбо-часы в информации по ключу

Значения `slots` и `free` отражают действующие лимиты, включая турбо-часы.
Если ответ `GET /v1/account`, `/v1/account/info` или `/v1/account/usage`
содержит дополнительный объект `turbo`, его можно показать как уведомление:

```json
{
  "active": true,
  "extra_slots": 24,
  "ends_at": 1792620000,
  "ends_at_msk": "22.10.2026 01:00",
  "message": "Турбо-часы работают: +24 потока для вас до 22.10.2026 01:00 МСК"
}
```

Показывайте `turbo.message` как информационную метку при `turbo.active: true`.
В `slots` и `free` прибавка **уже учтена** — повторно добавлять `extra_slots`
не нужно. Для тарифа `parallel` прибавка действует отдельно для каждого
доступного вида генерации; для `chain` общий лимит увеличен один раз.
`ends_at` — Unix-время, `ends_at_msk` — готовое время окончания по МСК.
Обновляйте метку при опросе `/v1/account/usage`, убирайте её при отключении
турбо или наступлении `ends_at`. У выключенного, ещё не начавшегося или
завершившегося турбо: `active: false`, `extra_slots: 0`, времена `null`,
`message: ""`. Если `turbo` отсутствует, метка не показывается.
Поля `warning` и `warning_code` сохраняют прежний смысл.

## 4. Постановка задачи — по одной

Один запрос — одна задача. Сохраните возвращённый `id` и опрашивайте состояние.
`client_ref` — ваша метка, а не ключ идемпотентности: повторный `POST` создаёт
новую задачу, даже если метка совпадает. Общие поля тела:

| Поле | Обязательно | Что |
|---|---|---|
| `prompt` | да | текст задачи, до 12000 знаков |
| `aspect_ratio` | нет | картинки: `16:9`, `9:16`, `1:1`, `4:5`; видео: `16:9`, `9:16`. По умолчанию `16:9` |
| `client_ref` | нет | ваш номер задачи, до 120 знаков — возвращается в ответах как есть |

| Адрес | Что делает | Изображения |
|---|---|---|
| `POST /v1/image/generate` | картинка из текста | никаких |
| `POST /v1/image/reference-to-image` | картинка по референсам | `reference_images`: 1–10 |
| `POST /v1/video/text-to-video` | ролик из текста | никаких |
| `POST /v1/video/image-to-video` | ролик из первого кадра | `image_base64` (+ `image_mime`) |
| `POST /v1/video/reference-to-video` (то же — `/v1/video/multi-image-to-video`) | ролик по референсам | `reference_images`: 1–10 |
| `POST /v1/video/first-last-frame-to-video` | переход между кадрами, без звука | `first_frame` и `last_frame` |
| `POST /v1/video/first-frame-to-last-reference` | начальный кадр и референс конца, со звуком | `first_frame` и `last_frame_reference` |
| `POST /v1/video/image-then-video` (то же — `/v1/video/im2v`) | картинка и сразу ролик из неё — раздел 6 | никаких |

Изображения — PNG, JPEG или WEBP, base64 без префикса `data:`.
Клиент обязан до base64 сжать или уменьшить **каждое** бинарное изображение
до **1 500 000 байт включительно**. Inflight не сжимает изображения:
файл больше лимита отклоняется с `400 IMAGE_TOO_LARGE` до создания задачи.

```json
{"image_base64": "iVBORw0KGgo…", "image_mime": "image/png"}
```

```json
{"reference_images": [{"name": "REF_MAN", "image_base64": "…", "mime": "image/jpeg"}, {"name": "REF_PAN", "image_base64": "…", "mime": "image/webp"}]}
```

У каждого элемента `reference_images` необязательное поле `name` — короткая
метка референса без расширения. Если у референсов разные роли, например
`REF_MAN` и `REF_PAN`, используйте эти же метки в `prompt` и передавайте
изображения в том же порядке. Поле `name` необязательно.

### Картинка из текста — `POST /v1/image/generate`

Создаёт одно изображение по текстовому описанию. Входные картинки не требуются.

```json
{
  "prompt": "a blue ceramic teapot on a white table, soft daylight",
  "aspect_ratio": "1:1",
  "client_ref": "image-001"
}
```

| Поле | Обязательно | Ограничения и значение по умолчанию |
|---|---|---|
| `prompt` | да | от 1 до 12 000 символов |
| `aspect_ratio` | нет | `16:9`, `9:16`, `1:1`, `4:5`; по умолчанию `16:9` |
| `client_ref` | нет | ваша метка до 120 символов |

Ответ: принятая задача с `kind: "image"`, `mode: "t2i"` и её `id`.
Готовность и ссылку получайте через `/v1/tasks/{id}`. Одна готовая картинка
расходует одну генерацию картинок; во время выполнения занят один слот картинок.

### Картинка по референсам — `POST /v1/image/reference-to-image`

Создаёт одно новое изображение по `prompt`, используя приложенные картинки
как визуальные референсы. Передайте **от 1 до 10 референсов**.

```json
{
  "prompt": "Place REF_OBJECT on a wooden table beside a window, soft daylight.",
  "reference_images": [
    {"name": "REF_OBJECT", "image_base64": "...", "mime": "image/jpeg"}
  ],
  "aspect_ratio": "4:5",
  "client_ref": "image-ref-001"
}
```

| Поле | Обязательно | Ограничения и значение по умолчанию |
|---|---|---|
| `prompt` | да | от 1 до 12 000 символов |
| `reference_images` | да | массив от 1 до 10 объектов изображений |
| `aspect_ratio` | нет | `16:9`, `9:16`, `1:1`, `4:5`; по умолчанию `16:9` |
| `client_ref` | нет | ваша метка до 120 символов |

Каждый элемент `reference_images` содержит:

| Поле элемента | Обязательно | Что передавать |
|---|---|---|
| `image_base64` | да | base64 полного файла, без префикса `data:` |
| `mime` | нет | `image/png`, `image/jpeg` или `image/webp`; по умолчанию `image/png` |
| `name` | нет | метка до 80 символов; используйте её в `prompt`, если нужно различать референсы |

Размер **каждого файла до base64 — не более 1 500 000 байт** (1,5 МБ).
Это отдельный лимит на каждый референс, а не сумма размеров массива.
Перед отправкой сожмите или уменьшите файл на стороне клиента.
Вместо `...` в примерах подставляется фактический base64 файла.

Порядок референсов и их метки сохраняйте между запросом и описанием сцены.
Рекомендуемые метки: латинские буквы, цифры, `_` и `-`, без расширения файла.
Исходные пропорции картинки не определяют аспект результата — его задаёт `aspect_ratio`.

Ответ содержит `kind: "image"`, `mode: "ref2i"` и `id`.
Загрузка референсов не создаёт отдельных платных картинок: одна готовая задача
расходует одну генерацию картинок и занимает один слот картинок во время работы.

### Аспект картинок и разрешение

Для `POST /v1/image/generate`, `/v1/image/reference-to-image` и задач
`kind: "image"` в `POST /v1/jobs` доступны:

| `aspect_ratio` | Формат |
|---|---|
| `"16:9"` | горизонтальный, по умолчанию |
| `"9:16"` | вертикальный |
| `"1:1"` | квадрат |
| `"4:5"` | вертикальный 4:5 |

Квадратная картинка из текста:

```json
{"prompt": "a blue ceramic teapot on a white table", "aspect_ratio": "1:1", "client_ref": "square-001"}
```

В списке картинок можно смешивать эти форматы: `aspect_ratio` задаётся у
каждой задачи отдельно. То же поле действует при генерации по референсам;
исходный аспект референса не заменяет запрошенный аспект результата.

`aspect_ratio` задаёт соотношение сторон, а не фиксированное количество пикселей.
Поля `resolution`, `width` и `height` не поддерживаются.
Произвольные отношения, включая `4:3`, `3:4`, `3:2`, `2:3`, `7:12`,
не принимаются: API отвечает `400 BAD_ASPECT`.

### Аспект видео

Для любой программы, которая обращается к Inflight API напрямую, ориентация
задаётся JSON-полем `"aspect_ratio"`:

```json
{
  "prompt": "a lighthouse on a rocky coast at dawn",
  "aspect_ratio": "16:9",
  "client_ref": "scene-001"
}
```

Допустимые значения:

| `aspect_ratio` | Результат |
|---|---|
| `"16:9"` | горизонтальное видео |
| `"9:16"` | вертикальное видео |

Не пытайтесь задавать аспект только словами в промпте. Поля `resolution`,
`width` и `height` API не поддерживаются.

### Видео из текста — `POST /v1/video/text-to-video`

Создаёт один 10-секундный ролик по тексту. Сцену, движение, речь и звуки
описывайте в `prompt`. Изображения в этот режим не передаются.

```json
{
  "prompt": "A lighthouse on a rocky coast at dawn. Slow camera movement, waves and natural sea ambience.",
  "aspect_ratio": "16:9",
  "client_ref": "video-001"
}
```

| Поле | Обязательно | Ограничения и значение по умолчанию |
|---|---|---|
| `prompt` | да | от 1 до 12 000 символов |
| `aspect_ratio` | нет | `16:9` или `9:16`; по умолчанию `16:9` |
| `client_ref` | нет | ваша метка до 120 символов |

Ответ содержит `kind: "video"`, `mode: "t2v"` и `id` принятой задачи.
Отдельного поля управления длительностью у этого endpoint нет.
Один готовый ролик расходует одну генерацию видео; до завершения задачи занят
один видеослот. Состояние и ссылку получайте через `/v1/tasks/{id}`.

### Мультишот: несколько шотов в одном ролике

Мультишот — несколько последовательных сцен или планов внутри одного видео.
Отправьте одну задачу через `POST /v1/video/text-to-video`, передав полный
текст выбранного примера в поле `prompt`. Для списка задач используйте
`POST /v1/jobs` с `kind: "video"`; у каждой задачи свой полный промпт.

Весь список `SHOT` входит в один `prompt`. Числа задают порядок шотов.
Между каждой парой шотов можно текстом описать нужный переход.
`HARD CUT` в примерах ниже обозначает прямую склейку — это один из вариантов
перехода. Запрос создаёт один ролик с одним ID задачи.

#### 3 шота

```text
SG: EDITED. Generate ONE single 10-second video containing exactly 3 different full-screen shots in the order below. Photorealistic live-action imagery. Each numbered shot is a different scene. HARD CUT between shots. No dissolves, camera flights between scenes, split screens, collages, title cards, captions, visible writing or logos. Choose natural shot lengths within the single video.
SHOT 1: Macro close-up of a single bright yellow lemon on a dark wooden kitchen table, warm sunlight, locked camera.
HARD CUT TO SHOT 2.
SHOT 2: Wide view of a vivid blue alpine lake beneath jagged snow-covered mountains, clear daylight, small ripples, locked camera.
HARD CUT TO SHOT 3.
SHOT 3: A red vintage bicycle leaning against a plain white courtyard wall, green ivy at the far edge, locked camera.
```

#### 4 шота

```text
SG: EDITED. Generate ONE single 10-second video containing exactly 4 different full-screen shots in the order below. Photorealistic live-action imagery. Each numbered shot is a different scene. HARD CUT between shots. No dissolves, camera flights between scenes, split screens, collages, title cards, captions, visible writing or logos. Choose natural shot lengths within the single video.
SHOT 1: Macro close-up of a single bright yellow lemon on a dark wooden kitchen table, warm sunlight, locked camera.
HARD CUT TO SHOT 2.
SHOT 2: Wide view of a vivid blue alpine lake beneath jagged snow-covered mountains, clear daylight, small ripples, locked camera.
HARD CUT TO SHOT 3.
SHOT 3: A red vintage bicycle leaning against a plain white courtyard wall, green ivy at the far edge, locked camera.
HARD CUT TO SHOT 4.
SHOT 4: A tall waterfall cascading down dark rocks in a lush green tropical forest, locked wide camera.
```

#### 6 шотов

```text
One 10-second photorealistic product montage in SIX full-screen shots. Each shot shows only its own object. Roughly equal screen time for all six. Hard cuts only; no panels, merged scenes, writing, opening or closing shots.
SHOT 1: one red apple on a white table. HARD CUT.
SHOT 2: one blue ceramic cup on a white shelf. HARD CUT.
SHOT 3: a bunch of silver keys on black velvet. HARD CUT.
SHOT 4: one yellow lemon on a pale wooden table. HARD CUT.
SHOT 5: one green leaf on a charcoal surface. HARD CUT.
SHOT 6: one white feather on a black table.
```

#### Переход растворением

Переход задаётся описанием внутри `prompt` для нужной пары шотов.
В одном ролике можно описывать разные переходы между разными шотами.
Пример с плавным растворением одной сцены в следующей:

```text
Generate ONE photorealistic 10-second video containing three distinct full-screen shots in this order. Keep each shot static and its object distinct. No text, panels or added scenes. SHOT 1: a close-up of one red apple centered on a white table.
TRANSITION 1 TO 2: A slow optical CROSS-DISSOLVE: the outgoing picture fades out while the next picture fades in, visibly overlapping for about one second.
SHOT 2: one blue ceramic mug centered on a white shelf.
TRANSITION 2 TO 3: A slow optical CROSS-DISSOLVE: the outgoing picture fades out while the next picture fades in, visibly overlapping for about one second.
SHOT 3: one yellow lemon centered on pale wood. Use the specified transitions at both scene changes.
```

### Видео из начальной картинки — `POST /v1/video/image-to-video`

Создаёт один 10-секундный ролик, используя присланную картинку как начальный кадр.
В `prompt` задайте развитие сцены, движение и желаемые звуки.
Этот режим подходит, когда видео должно начинаться с вашего изображения.

```json
{
  "prompt": "A gentle camera move forward. Animate the scene naturally with synchronized ambient sound.",
  "image_base64": "...",
  "image_mime": "image/jpeg",
  "aspect_ratio": "9:16",
  "client_ref": "image-video-001"
}
```

| Поле | Обязательно | Ограничения и значение по умолчанию |
|---|---|---|
| `prompt` | да | от 1 до 12 000 символов |
| `image_base64` | да | base64 одного полного файла, без `data:` |
| `image_mime` | нет | `image/png`, `image/jpeg` или `image/webp`; по умолчанию `image/png` |
| `aspect_ratio` | нет | `16:9` или `9:16`; по умолчанию `16:9` |
| `client_ref` | нет | ваша метка до 120 символов |

Передаётся **ровно одна картинка размером до 1 500 000 байт включительно до base64**.
Если файл больше, сожмите или уменьшите его до отправки. Размеры в пикселях
не заменяют ограничение по байтам. Здесь используются плоские поля
`image_base64` и `image_mime`, а не объекты `first_frame` / `last_frame`.

Ответ содержит `kind: "video"`, `mode: "i2v"` и `id`.
Одна готовая задача расходует одну генерацию видео; входная картинка не расходует
квоту генерации картинок. Во время работы занят один видеослот.
Отдельного поля управления длительностью у этого endpoint нет.

### Видео по референсам — `POST /v1/video/reference-to-video`

Алиас с тем же телом запроса: `POST /v1/video/multi-image-to-video`.

Создаёт один 10-секундный ролик по текстовому описанию сцены и визуальным
референсам. Референсы задают внешность, предметы, оформление или место действия.
Это отдельная роль изображений: если картинка должна задавать начало видео,
выберите `image-to-video`; для начального кадра и изображения конца выберите
один из двух следующих режимов.

```json
{
  "prompt": "REF_CHARACTER walks through the courtyard shown in REF_LOCATION. Natural movement and ambient sound.",
  "reference_images": [
    {"name": "REF_CHARACTER", "image_base64": "...", "mime": "image/png"},
    {"name": "REF_LOCATION", "image_base64": "...", "mime": "image/jpeg"}
  ],
  "aspect_ratio": "16:9",
  "client_ref": "reference-video-001"
}
```

| Поле | Обязательно | Ограничения и значение по умолчанию |
|---|---|---|
| `prompt` | да | от 1 до 12 000 символов; сцена, движение и желаемые звуки |
| `reference_images` | да | **от 1 до 10** объектов референсов |
| `aspect_ratio` | нет | `16:9` или `9:16`; по умолчанию `16:9` |
| `client_ref` | нет | ваша метка до 120 символов |

Объект референса:

| Поле элемента | Обязательно | Что передавать |
|---|---|---|
| `image_base64` | да | base64 полного файла, без префикса `data:` |
| `mime` | нет | `image/png`, `image/jpeg` или `image/webp`; по умолчанию `image/png` |
| `name` | нет | метка референса до 80 символов, например `REF_CHARACTER` |

**Лимит каждого референса — 1 500 000 байт включительно до base64** (1,5 МБ).
Например, три файла по 1 500 000 байт допустимы: лимит действует отдельно на
каждую картинку. Общий размер HTTP-запроса при этом ограничен 200 МБ.
Пустой список референсов даёт `400 NO_REFERENCES`, больше десяти — HTTP `422`.
Неверный base64 даёт `400 BAD_IMAGE`, превышение размера файла — `400 IMAGE_TOO_LARGE`.

Сохраняйте порядок и `name` референсов; в промпте используйте соответствующие
метки. Рекомендуются метки из латинских букв, цифр, `_` и `-`, без расширения.
Аспект результата задаётся `aspect_ratio`; исходные пропорции референсов могут
отличаться от него. Перед отправкой приведите каждый файл к указанному лимиту.

Ответ содержит `kind: "video"`, `mode: "ref2v"` и `id`.
Это одна видеозадача независимо от числа референсов: один видеослот на время
выполнения и одна генерация видео за готовый ролик. Квота генерации картинок
за загруженные референсы не расходуется. Отдельного поля длительности здесь нет.

### Начальный и конечный кадры — без звука

Для видео по двум изображениям доступны два варианта:

| Вариант | Endpoint | Звук | Длительность | Роль второго изображения |
|---|---|---|---|---|
| Начальный и конечный кадры | `/v1/video/first-last-frame-to-video` | нет | 5, 6, 7 или 8 секунд | задаёт конечный кадр |
| Начальный кадр и референс конца | `/v1/video/first-frame-to-last-reference` | есть | 10 секунд | задаёт желаемое конечное состояние; допускается визуальная интерпретация |

`POST /v1/video/first-last-frame-to-video` создаёт видео с переходом от
начального изображения к конечному кадру, заданному вторым изображением.
Результат создаётся без звуковой дорожки.
В `prompt` опишите сцену и характер движения между кадрами.

```json
{
  "prompt": "A continuous live-action shot with natural motion. Keep the camera fixed and preserve the scene's appearance and lighting. No cuts or captions.",
  "first_frame": {"image_base64": "...", "mime": "image/jpeg"},
  "last_frame": {"image_base64": "...", "mime": "image/jpeg"},
  "duration_seconds": 8,
  "aspect_ratio": "9:16",
  "client_ref": "scene-001"
}
```

- `first_frame` и `last_frame` обязательны. Каждый содержит `image_base64`
  без префикса `data:` и `mime`: `image/png`, `image/jpeg` или `image/webp`.
  Предел каждого файла до base64 — 1 500 000 байт.
- `client_ref` — необязательная метка вашей задачи, например `scene-001`.
  Сервер возвращает её без изменений в ответах по этой задаче.
- `duration_seconds` — **строго одно из четырёх целочисленных значений JSON:
  `5`, `6`, `7` или `8` секунд**. Если поле не передано, используется `8`.
  Значения `4`, `9`, `10`, числа с десятичной точкой (`6.0`, `6.5`) и строки вроде `"6"` не принимаются:
  API возвращает HTTP `422`. Это ограничение режима начального и конечного кадра.
- `aspect_ratio` выбирает ориентацию: `16:9` — горизонтальная, `9:16` — вертикальная;
  по умолчанию `16:9`.
  Фиксированное разрешение через `width` / `height` не задаётся.
- В этом режиме создаётся видео без звука. Одна готовая задача расходует
  одну генерацию видео и занимает один видеослот; квота картинок не расходуется.

В ответ приходит `id` принятой задачи, `mode: "frames2v"` и
`duration_seconds`. Опрашивайте `/v1/tasks/{id}` или `/v1/tasks?ids=...`;
скачивайте `url` после `state: "ready"`.

Несколько таких переходов можно отправить через `POST /v1/jobs`:

```json
{
  "kind": "video",
  "jobs": [{
    "prompt": "A continuous live-action shot with natural motion. Keep the camera fixed. No cuts or captions.",
    "image_role": "first_last_frame",
    "images": [
      {"image_base64": "...", "mime": "image/jpeg"},
      {"image_base64": "...", "mime": "image/jpeg"}
    ],
    "duration_seconds": 6,
    "aspect_ratio": "16:9",
    "client_ref": "scene-002"
  }]
}
```

В `images` передайте ровно два изображения: сначала начальный кадр, затем
конечный. У каждой задачи свои кадры, длительность и формат.

### Начальный кадр и референс конца — со звуком

`POST /v1/video/first-frame-to-last-reference` создаёт 10-секундное видео со звуком.
`first_frame` задаёт начало видео, а `last_frame_reference` — визуальный референс
желаемого конечного состояния. Последняя картинка направляет содержание финала;
точное повторение её композиции не гарантируется.

Сцену, характер движения и желаемые звуки описывайте в `prompt`.

```json
{
  "prompt": "Connect the supplied scene states with natural motion and synchronized ambient sound. No captions.",
  "first_frame": {"image_base64": "...", "mime": "image/jpeg"},
  "last_frame_reference": {"image_base64": "...", "mime": "image/jpeg"},
  "duration_seconds": 10,
  "aspect_ratio": "16:9",
  "client_ref": "scene-003"
}
```

| Поле | Обязательное | Значение |
|---|---|---|
| `prompt` | да | текст сцены, движения и звука; до 12 000 символов |
| `first_frame` | да | объект начального изображения |
| `last_frame_reference` | да | объект изображения желаемого конца |
| `duration_seconds` | нет | **только целое число JSON `10`**; по умолчанию `10` |
| `aspect_ratio` | нет | `16:9` или `9:16`; по умолчанию `16:9` |
| `client_ref` | нет | ваша метка задачи до 120 символов, возвращается без изменений |

Каждый объект изображения содержит `image_base64` без префикса `data:` и `mime`:
`image/png`, `image/jpeg` или `image/webp`. Размер каждого файла до base64 —
не более 1 500 000 байт. Передаются ровно два изображения.

Другие длительности, числа с десятичной точкой (`10.0`) и строки (`"10"`)
на этом endpoint отклоняются с HTTP `422`. Отсутствие обязательной картинки
также даёт `422`; неверный аспект — `400 BAD_ASPECT`.

Успешный ответ означает приём задачи. Он содержит `id`, `kind: "video"`,
`mode: "frame_ref2v"`, `duration_seconds: 10`, `client_ref`, `state: "accepted"`
и текущую занятость `usage`. Далее опрашивайте `/v1/tasks/{id}` или
`/v1/tasks?ids=...` и скачивайте `url` при `state: "ready"`.
В состояниях задачи также возвращаются `mode` и `duration_seconds`.

Одна готовая задача расходует одну генерацию видео и занимает один видеослот
во время работы. Загрузка двух изображений не расходует квоту картинок.

Пакетный формат через `POST /v1/jobs`:

```json
{
  "kind": "video",
  "jobs": [{
    "prompt": "Connect the supplied scene states with natural motion and synchronized ambient sound. No captions.",
    "image_role": "first_frame_last_reference",
    "images": [
      {"image_base64": "BASE64_FIRST_FRAME", "mime": "image/jpeg"},
      {"image_base64": "BASE64_LAST_FRAME_REFERENCE", "mime": "image/jpeg"}
    ],
    "duration_seconds": 10,
    "aspect_ratio": "9:16",
    "client_ref": "scene-004"
  }]
}
```

`image_role: "first_frame_last_reference"` задаёт режим для всей пары.
Назначение каждого изображения определяется **его позицией в `images`**:

| Элемент | Назначение |
|---|---|
| `images[0]` — первый объект | начальный кадр видео |
| `images[1]` — второй объект | референс желаемого конечного состояния |

Вместо `BASE64_FIRST_FRAME` и `BASE64_LAST_FRAME_REFERENCE` передайте base64
соответствующих файлов. Отдельный `image_role` внутри объекта изображения
не задаётся; поле `name` не меняет его назначение. Если поменять объекты
местами, их роли тоже поменяются.

Для запроса без массива используйте `POST /v1/video/first-frame-to-last-reference`:
начальное изображение передавайте в `first_frame`, а референс конца —
в `last_frame_reference`, как в примере выше.

`duration_seconds` можно не указывать — для этой роли используется `10`.
В одном списке `video` можно сочетать оба режима по двум изображениям и обычные
видеозадачи. Роль и длительность задаются отдельно для каждой задачи.

### Ответ на постановку задачи

Изображения не по адресу (первый кадр на `text-to-video`, референсы на `image-to-video`) — `400 WRONG_ENDPOINT`.

Ответ — принятая задача и занятость этого вида:

```json
{
  "id": "4f0c2a9e7b1d4c3a9e8f7a6b5c4d3e2f",
  "client_ref": "scene-001",
  "state": "accepted",
  "kind": "video",
  "mode": "t2v",
  "usage": {"slots": 12, "busy": 4, "free": 8, "left": 958},
  "warning": "",
  "warning_code": ""
}
```

Пример:

```bash
curl -s https://api.varag.video/v1/video/text-to-video \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"prompt": "a red tram crossing a stone bridge at dawn, cinematic", "aspect_ratio": "16:9", "client_ref": "s1"}'
```

## 5. Постановка списком — `POST /v1/jobs`

Несколько задач одного вида одним запросом. Принимаются **все или ни одной**: если что-то не так (слотов или остатка
тарифа меньше, чем задач, у задачи плохая картинка), не принимается ни одна, а отбой называет причину и номер плохой
задачи. Задач в списке — не больше слотов этого вида (у `chain` — общих), иначе `400 LIST_OVER_SLOTS`; весь запрос —
до 200 МБ (`413 REQUEST_TOO_LARGE`).

Для нескольких задач используйте один запрос. Отправляйте следующую часть очереди,
когда `/v1/account/usage` показывает свободные потоки. У каждой принятой задачи
свой ID и независимое состояние; готовность отслеживается через `/v1/tasks`.

```json
{
  "kind": "video",
  "jobs": [
    {"prompt": "a lighthouse in a storm", "aspect_ratio": "16:9", "client_ref": "s1"},
    {"prompt": "the keeper climbs the stairs", "client_ref": "s2",
     "images": [{"image_base64": "…", "mime": "image/png"}], "image_role": "first_frame"},
    {"prompt": "the same fox in a city street", "client_ref": "s3",
     "images": [{"image_base64": "…", "mime": "image/png"}, {"image_base64": "…", "mime": "image/png"}],
     "image_role": "reference"}
  ]
}
```

`kind` — `video` или `image`. У задачи `images` и `image_role`: `first_frame` — первый кадр ролика (одно
изображение), `reference` — референсы (1–10), `first_last_frame` — начальный и конечный кадры
(ровно два изображения в этом порядке, без звука), `first_frame_last_reference` — начальный кадр
и референс конца (ровно два изображения в этом порядке, со звуком). Обе роли доступны только для видео.
У картинок входные изображения — только референсы.

Ответ:

```json
{
  "jobs": [{"id": "…", "client_ref": "s1", "state": "accepted"}, {"id": "…", "client_ref": "s2", "state": "accepted"}],
  "usage": {"slots": 12, "busy": 3, "free": 9, "left": 958},
  "warning": "",
  "warning_code": ""
}
```

Ошибка в одной задаче списка отклоняет весь список, в сообщении — её номер (с 1): `"задача 2: aspect_ratio: 16:9
или 9:16"`, поле `job: 2`.

## 6. Картинка и сразу ролик из неё — `POST /v1/video/image-then-video`

Алиас: `POST /v1/video/im2v`. Сервер сначала создаёт картинку по тексту,
затем использует её как начальный кадр видео. Загружать картинку обратно не нужно.
Нужен тариф с обеими услугами: `chain` или `parallel`.

```json
{
  "image_prompt": "a lighthouse on a rocky coast at dawn",
  "video_prompt": "Slow camera movement, waves and natural sea ambience.",
  "aspect_ratio": "16:9",
  "client_ref": "image-then-video-001",
  "return_image_url": true
}
```

| Поле | Обязательно | Ограничения и значение по умолчанию |
|---|---|---|
| `image_prompt` | да | текст изображения, от 1 до 12 000 символов |
| `video_prompt` | нет | текст движения и звука, до 12 000 символов; пустая строка или `"same"` — использовать `image_prompt` |
| `aspect_ratio` | нет | `16:9` или `9:16`; по умолчанию `16:9` |
| `client_ref` | нет | ваша метка до 120 символов |
| `return_image_url` | нет | возвращать ли ссылку на созданную картинку; по умолчанию `true` |

Это текстовый запрос: `image_base64` и `reference_images` не требуются.
Клиент получает один ID видеозадачи с `mode: "im2v"` и следит за ним через
`/v1/tasks/{id}`. У задачи две стадии:

- `stage: "image"`: создаётся картинка, занят слот картинок;
- `stage: "video"`: картинка уже создана; видео занимает видеослот, когда начинается
  его выполнение. При `return_image_url: true` доступно поле `image_url`.

Готовый результат — 10-секундное видео. Отдельного поля длительности здесь нет.
Успешные стадии расходуют одну генерацию картинки и одну генерацию видео.
Если картинка не создана, видео не запускается и его квота не списывается.
Если картинка уже готова, её списание сохраняется даже при последующем сбое видео.

## 7. Состояние задач

### `GET /v1/tasks/{id}` (то же — `GET /v1/jobs/{id}`)

```json
{
  "id": "4f0c2a9e7b1d4c3a9e8f7a6b5c4d3e2f",
  "kind": "video",
  "mode": "t2v",
  "state": "ready",
  "client_ref": "s1",
  "created": 1791769000.1,
  "started": 1791769001.4,
  "finished": 1791769112.9,
  "url": "https://api.varag.video/v1/files/4f0c2a9e7b1d4c3a9e8f7a6b5c4d3e2f.mp4",
  "url_expires": 1791888000.0,
  "error_kind": null,
  "error_text": null
}
```

`state`:

| Состояние | Что значит | Слот |
|---|---|---|
| `accepted` | принята, ждёт отправки в работу | занят |
| `running` | делается | занят |
| `ready` | готово: `url` — ссылка на файл, `url_expires` — до какого времени она действует | свободен |
| `declined` | отказ по содержанию: `error_code: CONTENT_REFUSED`, `refusal_kind`, причина в `error_text` | свободен |
| `failed` | сбой: `error_code: SERVICE_FAILED` — поставьте задачу заново (повторы сервер уже сделал сам) | свободен |
| `cancelled` | снята вами | свободен |

`mode` — `t2v` (ролик из текста), `i2v` (из первого кадра), `ref2v` (по референсам), `t2i` (картинка из текста),
`ref2i` (по референсам), `im2v` (картинка и ролик), `frames2v` (начальный и конечный кадры, без звука), `frame_ref2v` (начальный кадр и референс конца, со звуком).
У `im2v` ещё `stage` (`image` / `video`) и `image_url`; у `frames2v` и `frame_ref2v` — `duration_seconds`.

`refusal_kind` — вид отказа: `real_person` (узнаваемый реальный человек), `copyrighted` (защищённый персонаж или
бренд), `minors` (дети), `sexual` (откровенное), `violence` (насилие), `other` (прочее). По `CONTENT_REFUSED`
программа может переписать промпт и поставить задачу заново.

При временной недоступности API повторите запрос состояния с тем же ID.
Повторно создавать генерацию нужно только после конечного состояния `failed`,
а не после таймаута запроса или временного HTTP `503`.
Исключение для переходов между кадрами: `failed` с `error_code: "OUTCOME_UNKNOWN"`
и `retryable: false` означает, что результат принятой операции не подтверждён.
Не запускайте автоматическую повторную генерацию такой задачи.

### `GET /v1/tasks?ids=a,b,c` (то же — `GET /v1/jobs?ids=…`)

Состояние названных задач одним запросом (до 200 номеров). Без `ids` — все ваши задачи, которые сейчас занимают
слоты. Ответ — `{"jobs": [ … ]}`, задачи в том же виде, что выше; чужие и несуществующие номера просто не попадают
в список.

### `DELETE /v1/tasks/{id}` (то же — `DELETE /v1/jobs/{id}`)

Снять задачу, пока она ждёт отправки (`accepted`): слот освобождается, ничего не списывается. Уже делается —
`409 JOB_RUNNING`. Законченная — возвращается как есть.

### Принудительная отмена: hard cancel

`POST /v1/tasks/{id}/hard-cancel` (алиас `/v1/jobs/{id}/hard-cancel`) —
отменить свою задачу в `accepted` или `running`, в том числе зависшую.
Заголовок `X-API-Key` обязателен; тело не нужно.

Ответ HTTP `200` — задача в `cancelled`, с `error_code: "HARD_CANCELLED"`.
Потоки освобождаются сразу; отменённая генерация не списывает квоту.
Повторный вызов безопасен. Уже готовые и другие конечные задачи не меняются.
Чужой или неизвестный ID — `404 JOB_NOT_FOUND`.

Для нескольких задач: `POST /v1/tasks/hard-cancel` (алиас `/v1/jobs/hard-cancel`):

```json
{"ids": ["task-id-1", "task-id-2"]}
```

До 200 ID. Чужие, неизвестные и уже завершённые задачи не отменяются и не
попадают в `cancelled_ids`.

Для сброса **всех активных задач своего API-ключа**:

```json
{"all": true}
```

Ответ:

```json
{
  "jobs": [{"id": "task-id-1", "state": "cancelled", "error_code": "HARD_CANCELLED"}],
  "cancelled_ids": ["task-id-1"],
  "cancelled_count": 1,
  "hard_cancelled": true,
  "usage": {"video": {"busy": 0, "free": 12}, "image": {"busy": 0, "free": 12}}
}
```

У `im2v` снимаются все незавершённые этапы. Если картинка уже готова,
её прежнее списание сохраняется, а отменённое видео не списывается.
Поздний результат не возвращает отменённую задачу в `ready` и не вызывает
нового списания. Hard cancel прекращает обслуживание задачи в API; уже
начатые вычисления могут завершиться позже, но результат будет проигнорирован.
После отмены можно создать новую задачу с новым ID. Обычная отмена `DELETE`
продолжает возвращать `409 JOB_RUNNING` для работающей задачи.

## 8. Скачивание готового файла — `GET /v1/files/{id}.{mp4|webp|png|jpg}`

Ссылка из `url` (и `image_url`). **Ключ не нужен** — номер в ссылке длинный и случайный; не публикуйте ссылки, если
файл не должен видеть никто, кроме вас. Ролики — MP4 (H.264; аудио при наличии — AAC),
картинки — PNG, JPEG или WEBP. Используйте полученный `url` без изменения расширения.

- Работает докачка с середины (`Range: bytes=…` → `206`) и `HEAD` (размер до скачивания).
- Ссылка действует до `url_expires`. **Скачивайте сразу**: длительное хранение результатов не гарантируется;
  после срока ссылка отвечает `410 FILE_EXPIRED`.
- Нет такого файла (или задача ещё не готова) — `404 FILE_NOT_FOUND`; файл временно недоступен — `502
  FILE_UNAVAILABLE`, повторите через минуту.
- Скачиваний — не больше 20 начал в секунду с адреса (кратковременно — до 100 подряд).

## 9. Отказы по содержанию и их предел

Отказ приходит задачей `declined` сразу, с видом и причиной. По умолчанию отказ **бесплатный**. Если отказы по
содержанию составят **15 % и больше** законченных задач ключа за срок тарифа (считается, когда законченных задач
1000 и больше), отказы ключа становятся **платными** — каждый списывает половину штуки. Об этом говорит
предупреждение в `/v1/account/usage` и в ответах на постановку: `warning_code: "REFUSAL_LIMIT"`, `warning` — текст с
долей отказов и частым видом. `refusals_paid: true` — отказы платные. Меняйте промпты: чаще всего отказ — реальные
люди и чужие персонажи.

## 10. Ошибки

Тело ошибки:

```json
{"detail": {"code": "SLOTS_BUSY", "message": "все слоты заняты", "slots": 12, "busy": 12, "free": 0}}
```

`code` — для программы, `message` — человеку; рядом — числа по делу. Различайте ошибки по `code`: например, `429`
бывает и «слоты заняты», и «слишком часто».

| HTTP | `code` | Что делать |
|---|---|---|
| 400 | `BAD_KIND` | `kind` — `video` или `image` |
| 400 | `BAD_ASPECT` | Для картинок: `16:9`, `9:16`, `1:1`, `4:5`; для видео и im2v: только `16:9`, `9:16` |
| 400 | `BAD_IMAGE_ROLE` | `image_role` — `first_frame`, `reference`, `first_last_frame` или `first_frame_last_reference`; у картинок — только `reference` |
| 400 | `BAD_DURATION` | для `first_last_frame` допустимы 5–8 секунд, для `first_frame_last_reference` — только 10; у остальных ролей длительность не задаётся |
| 400 | `TOO_MANY_IMAGES` | первый кадр — одно изображение, референсов — до 10 |
| 400 | `BAD_IMAGE_TYPE` | изображения — PNG, JPEG или WEBP |
| 400 | `BAD_IMAGE` | изображение не разобрано (base64) |
| 400 | `IMAGE_TOO_LARGE` | одно бинарное изображение больше 1 500 000 байт; сожмите его на стороне клиента |
| 400 | `NO_IMAGE` | на `image-to-video` нужен `image_base64` |
| 400 | `NO_REFERENCES` | на `reference-to-…` нужны `reference_images` |
| 400 | `WRONG_ENDPOINT` | изображения не по адресу (см. раздел 4) |
| 400 | `LIST_OVER_SLOTS` | в списке задач больше, чем слотов тарифа (в ответе `slots`) |
| 400 | `TOO_MANY_IDS` | в `?ids=` больше 200 номеров |
| 400 | `BAD_IDS` | hard cancel: укажите непустой `ids` либо `all: true`, без их сочетания |
| 401 | `INVALID_API_KEY` | ключ не принят |
| 402 | `QUOTA_EXHAUSTED` | объём тарифа израсходован (в ответе `left`) |
| 402 | `EXPIRED` | срок тарифа вышел |
| 403 | `PLAN_NO_SERVICE` | услуга не входит в тариф (видео по тарифу картинок и т. п.) |
| 404 | `JOB_NOT_FOUND` | такой задачи нет (или она не ваша) |
| 404 | `FILE_NOT_FOUND` | такого файла нет или задача ещё не готова |
| 409 | `JOB_RUNNING` | обычный DELETE не снимает running; используйте hard cancel при необходимости |
| 410 | `FILE_EXPIRED` | срок ссылки вышел |
| 413 | `REQUEST_TOO_LARGE` | запрос больше 200 МБ — разбейте список |
| 422 | — | тело не по форме (нет `prompt`, не тот тип поля и т. п.); `detail` — список полей с причинами |
| 429 | `SLOTS_BUSY` | все слоты заняты (`slots`, `busy`, `free`) — пришлите, когда освободится |
| 429 | `DAILY_QUOTA` | дневная квота выбрана (`left`, `resets_at`) — после сброса |
| 429 | `TOO_MANY_REQUESTS` | больше 20 запросов в секунду — подождите секунду |
| 502 | `FILE_UNAVAILABLE` | файл временно недоступен — повторите через минуту |
| 503 | `SERVICE_UNAVAILABLE` | сервер перезапускается — повторите через минуту |

## 11. Пример целиком (Python)

```python
import time
import requests

BASE, KEY = "https://api.varag.video", "mk_…"
api = requests.Session()
api.headers["X-API-Key"] = KEY

prompts = ["a red tram crossing a stone bridge at dawn", "a potter shaping clay on a wheel, close-up"]
free = api.get(f"{BASE}/v1/account/usage").json()["video"]["free"]
batch = [{"prompt": p, "client_ref": f"s{i}"} for i, p in enumerate(prompts[:free], 1)]
answer = api.post(f"{BASE}/v1/jobs", json={"kind": "video", "jobs": batch})
answer.raise_for_status()
ids = [job["id"] for job in answer.json()["jobs"]]

done = {}
while len(done) < len(ids):
    time.sleep(4)
    reply = api.get(f"{BASE}/v1/tasks", params={"ids": ",".join(ids)})
    if reply.status_code == 429:          # слишком часто — подождём
        continue
    for task in reply.json()["jobs"]:
        if task["state"] in ("ready", "declined", "failed", "cancelled"):
            done[task["id"]] = task

for task in done.values():
    if task["state"] == "ready":
        with requests.get(task["url"], stream=True, timeout=300) as file:
            file.raise_for_status()
            with open(f"{task['client_ref']}.mp4", "wb") as out:
                for chunk in file.iter_content(1 << 20):
                    out.write(chunk)
    else:
        print(task["client_ref"], task["state"], task.get("error_code"), task.get("error_text"))
```

## 12. FAQ

1. какие есть режимы генерации:

Генерация изображений с референсами и без в 2к качестве
(цензуры на генерацию изо публичных личностей нет)

оживления картинок (наших или чужих) в видео im2vi

Из промпта в видео T2vi качеством не хуже чем im2vi (без мыльных лиц как на вео)

Ref2vi - из промпта в видео с сохранением референсных персонажей и локаций
(анти-дипфейк фильтр: хардрефлок человеческих лиц нет)

Start frame / last frame ( задаются стартовое и финальное изображение и промпт сцены между ними) с управлением длительности видео от 4 до 8 секунд 

Режим бесконечной истории - когда последний кадр предыдущего клипа становится началом следующего, и таким образом получается цельный фильм, а не череда сцен.

Инфографика, оверлеи, генеративный моушн

Мультишот промпт - в одном промпте можно задавать до 6-8 сцен и они будут в итоговом клипе (как в Omni, но с лучшей физикой) 

Переходы между сценами также поддерживаются - укажите вид перехода между шотами клипа и они будут на видео 

2. Генерации длятся 10 сек. 
В таблице тарифов 1ч условно приравнен 500 клипам с учётом монтажа и обрезки сырых видео. 
В действительности 500 клипов это 5000 секунд (83 минуты видеоряда). 

3. Потоки это одновременные генерации. 
Они влияют на скорость вашей работы. 

96 потоков это 96 одновременно выполняющихся генераций, за счёт чего каждую секунду вам на компьютер падает несколько готовых 10 секундных клипов. 

(пример в прикрепленном к посту видео выше) 

**Если вам удалось взять тариф с включённым бонусом по картинкам - то у вас столько же независимых(!) потоков для картинок, такого же объема как и видео. (ограниченная опция, уточняйте в момент покупки) 

4. Неудачные генерации стоят нам денег, но у вас не списывают дневную квоту, кроме случаев когда вы явно и очень долго пытаетесь генерировать нечто, отвергающееся цензурой. 