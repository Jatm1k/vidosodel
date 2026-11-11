# Inflight HTTP API

## Connection

Base URL:

```text
https://api.varag.video/v1
```

Every request except file download sends:

```http
X-API-Key: mk_...
Content-Type: application/json
```

The API key identifies the user's tariff. Use it in your application's API
client; keep it out of logs and publicly distributed source code.

All timestamps are Unix seconds in UTC. JSON is UTF-8.

## How to choose an endpoint

Use this decision table before writing a request:

| What your application needs | Endpoint | Required input |
|---|---|---|
| Create a still image from a text description | `POST /image/generate` | `prompt` |
| Create a still image using one or more reference images | `POST /image/reference-to-image` | `prompt` and `reference_images` |
| Create a video from text only | `POST /video/text-to-video` | `prompt` |
| Animate one existing image as the first frame | `POST /video/image-to-video` | `prompt` and `image_base64` |
| Create a video while preserving several reference images | `POST /video/reference-to-video` | `prompt` and `reference_images` |
| Generate a silent transition between initial and final frames | `POST /video/first-last-frame-to-video` | `prompt`, `first_frame` and `last_frame` |
| Generate video with audio from a first frame toward a target ending | `POST /video/first-frame-to-last-reference` | `prompt`, `first_frame` and `last_frame_reference` |
| Create an image first, then animate that generated image | `POST /video/image-then-video` | `image_prompt` and `video_prompt` |

The endpoint determines the generation kind. Do not send an image to the
text-only endpoint and do not use `image-to-video` when the image is only a
visual reference. Use `image-to-video` when one specific image must become
the first frame; use `reference-to-video` when the request contains several
reference images or asks the model to preserve people, objects, or style from
those references.

All generation requests are asynchronous. A successful `POST` means that the
job was accepted, not that the media is ready. Save the returned `id`, poll
`GET /tasks/{id}` or several IDs through `GET /tasks?ids=...`, and download
the `url` only after the state becomes `ready`.

## Input image limit

Before base64 encoding, the client must resize or compress every input image
to **at most 1,500,000 binary bytes**. This is a per-image limit. The server
does not compress images. Inflight rejects an oversized image with
`400 IMAGE_TOO_LARGE` before creating a job.

For multiple references, the limit applies to each file independently. For
example, three reference images may each be 1,500,000 bytes; the combined
payload may be about 4.5 MB. If any individual decoded image is larger, the
request is rejected before a job is created:

```json
{
  "detail": {
    "code": "IMAGE_TOO_LARGE",
    "message": "изображение больше безопасного лимита 1500000 байт; сожмите его на стороне клиента перед отправкой"
  }
}
```

The HTTP status is `400`. Do not retry the same bytes; compress or resize the
offending image first.

## Image aspect ratio and pixel resolution

For `/image/generate`, `/image/reference-to-image`, and image jobs in
`POST /jobs`, set `aspect_ratio` independently on each job:

| Value | Image shape |
|---|---|
| `"16:9"` | landscape, default |
| `"9:16"` | vertical |
| `"1:1"` | square |
| `"4:5"` | vertical 4:5 |

```json
{"prompt":"a blue ceramic teapot on a white table","aspect_ratio":"1:1","client_ref":"square-001"}
```

Mixed image batches may use different supported ratios in the same request.
For reference-to-image, the output ratio comes from `aspect_ratio`, not from
the dimensions of the reference. Do not send `resolution`, `width` or `height`.
Other ratios, including `4:3`, `3:4`, `3:2`, `2:3` and `7:12`, are rejected
with `400 BAD_ASPECT`. Do not assume that image ratios apply to video: video
and image-then-video still accept only `16:9` and `9:16`.

## Video orientation and references

When calling Inflight API directly, set orientation in the JSON request field
`aspect_ratio`:

```json
{
  "prompt": "a lighthouse on a rocky coast at dawn",
  "aspect_ratio": "16:9",
  "client_ref": "scene-001"
}
```

Allowed values:

- `"16:9"` = landscape video
- `"9:16"` = vertical video

Do not put the aspect only in the prompt text. The API does not support extra
`resolution`, `width`, or `height` fields.

Reference images may have any source dimensions and aspect ratio.
Preserve reference order and optional `name` labels, and mention only the
labels intended for the current scene in the prompt.

## Account

### `GET /account`

Alias: `GET /account/info`.

Response:

```json
{
  "name": "client",
  "plan": "parallel",
  "quota": "day",
  "services": ["video", "image"],
  "expires": 1794359558.1,
  "refusals_paid": false,
  "video": {"bought": 2500, "slots": 12},
  "image": {"bought": 2500, "slots": 12}
}
```

`plan` values:

- `images`: images only
- `video`: video only
- `chain`: video and images share one slot pool
- `parallel`: video and images have separate slot pools

### `GET /account/usage`

```json
{
  "plan": "parallel",
  "quota": "day",
  "video": {"slots": 12, "busy": 2, "free": 10, "left": 2498},
  "image": {"slots": 12, "busy": 0, "free": 12, "left": 2500},
  "warning": "",
  "warning_code": "",
  "resets_at": 1794355200,
  "expires": 1794359558.1,
  "expired": false
}
```

`left` is the remaining quota. `busy` is the number of active jobs. For
`quota: day`, the quota resets at `resets_at` (00:00 UTC).

### Turbo-hours notice

`slots` and `free` include active turbo limits. If a response from `/account`,
`/account/info`, or `/account/usage` contains an optional `turbo` object, it can
be displayed as an informational notice:

```json
{
  "active": true,
  "extra_slots": 24,
  "ends_at": 1792620000,
  "ends_at_msk": "22.10.2026 01:00",
  "message": "Турбо-часы работают: +24 потока для вас до 22.10.2026 01:00 МСК"
}
```

Display `turbo.message` as an informational badge only while `active` is true
and `ends_at` is still in the future. Refresh from `/account/usage`; its newer
turbo object takes precedence over `/account/info`, including `active: false`.
`slots` and `free` already include the bonus. Never add `extra_slots` again.
The bonus applies independently to video and image slots for `parallel`;
the shared pool receives it once for `chain`.
`ends_at` is a Unix timestamp; `ends_at_msk` is formatted in Moscow time
(UTC+03:00), regardless of the client's time zone.
Inactive, scheduled-but-not-started, and expired turbo return `active: false`,
`extra_slots: 0`, null end fields, and an empty message.
If `turbo` is omitted, show no badge. Do not interpret the notice
as a quota warning or change handling of `warning` / `warning_code`.

## Single-job Endpoints

Common request fields:

```json
{
  "prompt": "a lighthouse on a rocky coast at dawn",
  "aspect_ratio": "16:9",
  "client_ref": "my-job-001"
}
```

- `prompt`: required, maximum 12000 characters
- `aspect_ratio`: images accept `16:9`, `9:16`, `1:1`, `4:5`; video accepts
  `16:9` or `9:16`. Default: `16:9`.
- `client_ref`: optional, maximum 120 characters; returned unchanged

### Text to image

```http
POST /image/generate
```

```json
{"prompt":"a lighthouse at dawn","aspect_ratio":"1:1","client_ref":"img-1"}
```

### Reference image to image

```http
POST /image/reference-to-image
```

```json
{
  "prompt": "same location, storm approaching",
  "reference_images": [
    {"name": "REF_MAN", "image_base64": "...", "mime": "image/png"}
  ],
  "aspect_ratio": "16:9",
  "client_ref": "img-ref-1"
}
```

Supported image MIME types: `image/png`, `image/jpeg`, `image/webp`.

**Required client-side limit:** compress or resize every binary image to
**at most 1,500,000 bytes before base64 encoding**. Inflight rejects a larger
individual image with HTTP `400` and error code `IMAGE_TOO_LARGE`.

This is a **per-image** limit, not a sum limit. Three reference images may
each be 1,500,000 bytes (about 4.5 MB of binary images total) in one request.
Maximum: 10 reference images.

`name` is optional but recommended when several references have distinct roles.
Use a short stable label without an extension, for example `REF_MAN` and
`REF_PAN`. The same label should appear in the prompt wherever you refer to
that reference. The `name` field is optional.

### Text to video

Creates one 10-second video from `prompt`, with scene motion and requested
sound described in the text. No input images. Required `prompt`: 1–12,000
characters. Optional `aspect_ratio`: `16:9` or `9:16` (default `16:9`);
optional `client_ref`: at most 120 characters. This endpoint has no separate
duration field. Returned mode: `t2v`. One ready video costs one video generation
and occupies one video slot while active.

```http
POST /video/text-to-video
```

```json
{"prompt":"slow camera push toward a lighthouse at dawn","aspect_ratio":"16:9","client_ref":"vid-1"}
```

### Multi-shot video

A multi-shot prompt describes several consecutive scenes or camera shots
inside one video. Send one task to `POST /video/text-to-video`, placing the
entire selected example in `prompt`. For several videos, use `POST /jobs`
with `kind: "video"` and one complete prompt per job.

Keep all numbered shots inside one `prompt`. `SHOT` numbers define order.
Describe the desired transition between each pair of shots in the prompt.
`HARD CUT` in the examples below requests a direct edit and is one transition
option. One request creates one video with one task ID.

#### 3 shots

```text
SG: EDITED. Generate ONE single 10-second video containing exactly 3 different full-screen shots in the order below. Photorealistic live-action imagery. Each numbered shot is a different scene. HARD CUT between shots. No dissolves, camera flights between scenes, split screens, collages, title cards, captions, visible writing or logos. Choose natural shot lengths within the single video.
SHOT 1: Macro close-up of a single bright yellow lemon on a dark wooden kitchen table, warm sunlight, locked camera.
HARD CUT TO SHOT 2.
SHOT 2: Wide view of a vivid blue alpine lake beneath jagged snow-covered mountains, clear daylight, small ripples, locked camera.
HARD CUT TO SHOT 3.
SHOT 3: A red vintage bicycle leaning against a plain white courtyard wall, green ivy at the far edge, locked camera.
```

#### 4 shots

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

#### 6 shots

```text
One 10-second photorealistic product montage in SIX full-screen shots. Each shot shows only its own object. Roughly equal screen time for all six. Hard cuts only; no panels, merged scenes, writing, opening or closing shots.
SHOT 1: one red apple on a white table. HARD CUT.
SHOT 2: one blue ceramic cup on a white shelf. HARD CUT.
SHOT 3: a bunch of silver keys on black velvet. HARD CUT.
SHOT 4: one yellow lemon on a pale wooden table. HARD CUT.
SHOT 5: one green leaf on a charcoal surface. HARD CUT.
SHOT 6: one white feather on a black table.
```

#### Cross-dissolve transitions

Describe each transition inside `prompt` next to its shot pair. Different
shot pairs may use different transition descriptions. Example with a smooth
cross-dissolve from each scene into the next:

```text
Generate ONE photorealistic 10-second video containing three distinct full-screen shots in this order. Keep each shot static and its object distinct. No text, panels or added scenes. SHOT 1: a close-up of one red apple centered on a white table.
TRANSITION 1 TO 2: A slow optical CROSS-DISSOLVE: the outgoing picture fades out while the next picture fades in, visibly overlapping for about one second.
SHOT 2: one blue ceramic mug centered on a white shelf.
TRANSITION 2 TO 3: A slow optical CROSS-DISSOLVE: the outgoing picture fades out while the next picture fades in, visibly overlapping for about one second.
SHOT 3: one yellow lemon centered on pale wood. Use the specified transitions at both scene changes.
```

### Image to video

Creates one 10-second video starting from exactly one supplied image.
Required fields: `prompt` (1–12,000 characters) and `image_base64` (full file,
no `data:` prefix). `image_mime` is optional, default `image/png`; supported
types are `image/png`, `image/jpeg`, `image/webp`. The decoded file must be
at most **1,500,000 bytes**. Optional `aspect_ratio`: `16:9` or `9:16`, default
`16:9`; `client_ref`: at most 120 characters. There is no separate duration
field. Returned mode: `i2v`. One ready video costs one video generation;
the uploaded image consumes no image-generation quota.

```http
POST /video/image-to-video
```

```json
{
  "prompt": "slow camera push forward, waves moving",
  "image_base64": "...",
  "image_mime": "image/png",
  "aspect_ratio": "16:9",
  "client_ref": "i2v-1"
}
```

### Reference images to video

Creates one 10-second video from the scene prompt and visual references.
Required `prompt`: 1–12,000 characters; required `reference_images`: **1–10**
image objects. Each object has required `image_base64`, optional `mime`
(default `image/png`), and optional `name` (at most 80 characters).
Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`. Every decoded
file must be at most **1,500,000 bytes**; the whole request is limited to
200 MB. Optional `aspect_ratio`: `16:9` or `9:16`, default `16:9`;
`client_ref`: at most 120 characters. There is no separate duration field.
Returned mode: `ref2v`; one ready video costs one video generation, regardless
of the number of uploaded references. Uploads consume no image-generation quota.
Use `image-to-video` when an image must define the beginning, rather than serve
as an appearance/style reference.

Canonical endpoint:

```http
POST /video/reference-to-video
```

Alias:

```http
POST /video/multi-image-to-video
```

```json
{
  "prompt": "the same characters walk through the harbor",
  "reference_images": [
    {"name": "REF_MAN", "image_base64": "...", "mime": "image/png"},
    {"name": "REF_PAN", "image_base64": "...", "mime": "image/jpeg"}
  ],
  "aspect_ratio": "16:9",
  "client_ref": "ref2v-1"
}
```

Maximum: 10 reference images; each must be <= 1,500,000 bytes before base64.

When the prompt distinguishes references, keep the order and labels aligned:
the first object is the first reference, and `REF_MAN` / `REF_PAN` must match
the names used in the prompt. Do not describe only a filename as plain text;
send the image in `reference_images` and use the label to identify its role.

### First and last frame video — silent

Choose the two-image video mode by the role of the final image:

| Endpoint | Audio | Duration | Second image |
|---|---|---|---|
| `/video/first-last-frame-to-video` | no | 5, 6, 7 or 8 seconds | defines the final frame |
| `/video/first-frame-to-last-reference` | yes | 10 seconds | guides the desired ending; visual interpretation is allowed |

`POST /video/first-last-frame-to-video` creates a video transitioning from
the initial image to the final frame defined by the second image, without an audio track. Use `prompt`
to describe the scene and the motion between those frames.

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

Both frame objects are required. Each contains base64 without a `data:`
prefix and a MIME type: `image/png`, `image/jpeg` or `image/webp`. Each decoded
image must be at most 1,500,000 bytes.

`client_ref` is an optional identifier chosen by your application, such as
`scene-001`. It is returned unchanged in this task's responses.

`duration_seconds` must be **exactly one of these four JSON integers:
`5`, `6`, `7`, or `8` seconds**. If omitted, it defaults to `8`.
Values such as `4`, `9`, `10`, decimal numbers (`6.0`, `6.5`), and strings such as `"6"`
are rejected with HTTP `422`. This limit applies to the first/last-frame mode. Supported output
orientation presets are `16:9` (landscape) and `9:16` (vertical), default `16:9`.
`width` / `height` do not set a fixed output resolution. This mode produces silent video.
One ready output consumes one video generation and one video slot while
active; input frames do not consume image-generation quota.

The response contains the accepted task `id`, `mode: "frames2v"`, and
`duration_seconds`. Poll the task normally and download its `url` when ready.

For `POST /jobs`, use this per-job format:

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

Exactly two images are required, ordered **first frame, last frame**.
The batch may contain several transitions with independent frames and durations.
`mode: "frames2v"` is returned by the server; select this mode in batch input
using `image_role: "first_last_frame"`, not an input `mode` field.

### First frame and ending reference — with audio

`POST /video/first-frame-to-last-reference` creates a 10-second video with audio.
`first_frame` defines the beginning; `last_frame_reference` visually guides
the desired ending. The final image is a reference for the ending state;
exact reproduction of its composition is not guaranteed.

Describe the scene, motion and desired sounds in `prompt`.

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

| Field | Required | Accepted value |
|---|---|---|
| `prompt` | yes | scene, motion and sound description, up to 12,000 characters |
| `first_frame` | yes | initial image object |
| `last_frame_reference` | yes | target ending image object |
| `duration_seconds` | no | **only the JSON integer `10`**, default `10` |
| `aspect_ratio` | no | `16:9` or `9:16`, default `16:9` |
| `client_ref` | no | caller-defined task label, up to 120 characters; echoed unchanged |

Each image object contains `image_base64` without a `data:` prefix and `mime`:
`image/png`, `image/jpeg` or `image/webp`. Each decoded image is limited to
1,500,000 bytes. Exactly two input images are required.

Other durations, decimal numbers such as `10.0`, and strings such as `"10"`
are rejected with HTTP `422`. A missing required image also returns `422`;
an invalid aspect returns `400 BAD_ASPECT`.

An accepted response contains `id`, `kind: "video"`, `mode: "frame_ref2v"`,
`duration_seconds: 10`, `client_ref`, `state: "accepted"`, and current `usage`.
Poll `/tasks/{id}` or `/tasks?ids=...`, then download `url` when the state is
`ready`. Task status responses retain `mode` and `duration_seconds`.

One ready job consumes one video generation and one video slot while active.
Uploading the two images does not consume image-generation quota.

For `POST /jobs`, use this per-job shape:

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

`image_role: "first_frame_last_reference"` selects the mode for the whole pair.
Assign each image by its **array position**:

| Element | Meaning |
|---|---|
| `images[0]`, the first object | first frame of the video |
| `images[1]`, the second object | visual reference for the target ending |

Replace `BASE64_FIRST_FRAME` and `BASE64_LAST_FRAME_REFERENCE` with the base64
contents of the corresponding files. Do not put an `image_role` inside each
image object. The optional `name` field does not select its role; swapping the
objects swaps their roles.

To use explicit field names instead of an array, call
`POST /video/first-frame-to-last-reference` with the first image in `first_frame`
and the ending reference in `last_frame_reference`, as shown above.

Omitting `duration_seconds` defaults to `10` for this role. A video batch may
mix both two-image modes and ordinary video jobs; choose the image role and
duration separately for each item.

### Image then video

Canonical endpoint:

```http
POST /video/image-then-video
```

Alias:

```http
POST /video/im2v
```

```json
{
  "image_prompt": "a lighthouse on a rocky coast at dawn",
  "video_prompt": "slow camera push forward, waves moving",
  "aspect_ratio": "16:9",
  "client_ref": "im2v-1",
  "return_image_url": true
}
```

This creates an image and then animates that image. It requires a tariff with
both `image` and `video` services (`chain` or `parallel`). `image_prompt` is
required (1–12,000 characters); `video_prompt` is optional (up to 12,000), and
an empty value or `"same"` reuses the image prompt. `aspect_ratio` accepts only
`16:9` or `9:16`, default `16:9`; `client_ref` is at most 120 characters.
`return_image_url` defaults to `true`. No input image upload is needed.
The returned task has `mode: "im2v"`; poll the same ID through both stages.
The image stage occupies an image slot; the video stage occupies a video slot
when it starts. A ready image costs one image generation; a ready video costs
one video generation. A completed image remains charged if the later video
fails. The output video is 10 seconds; there is no separate duration field.

## Accepted Response

Single-job endpoints return an accepted job:

```json
{
  "id": "job-id",
  "client_ref": "my-job-001",
  "kind": "video",
  "mode": "t2v",
  "state": "accepted",
  "usage": {"slots": 12, "busy": 1, "free": 11, "left": 2499},
  "warning": "",
  "warning_code": ""
}
```

For `image-then-video`, responses can contain `stage: image` or `stage: video`.
The generated image becomes available in `image_url` when requested.

## Batch Submission

Use one batch request when submitting multiple jobs of the same kind:

```http
POST /jobs
```

```json
{
  "kind": "video",
  "jobs": [
    {
      "prompt": "a lighthouse at dawn",
      "aspect_ratio": "16:9",
      "client_ref": "clip-001"
    },
    {
      "prompt": "a harbor in a snowstorm",
      "aspect_ratio": "16:9",
      "client_ref": "clip-002"
    }
  ]
}
```

`kind` is `image` or `video`. Image response modes are `t2i` and `ref2i`.
For video jobs, returned modes are `t2v`, `i2v`, `ref2v`, `frames2v` (silent frames), or `frame_ref2v` (first frame and ending reference with audio).
For batch input, select image roles with `image_role` and ordered `images`;
use `first_last_frame` for silent transitions or `first_frame_last_reference` for audible first-frame/ending-reference video, as shown above. Both require exactly two ordered images.

For images in a batch:

```json
{
  "kind": "image",
  "jobs": [
    {
      "prompt": "a lighthouse at dawn",
      "aspect_ratio": "16:9",
      "client_ref": "img-001"
    }
  ]
}
```

Batch admission is all-or-nothing. The batch must fit the currently free
slots and remaining quota. Keep a client-side queue when the server returns
`SLOTS_BUSY`.

## Polling

### `GET /tasks/{id}`

Returns one task.

### `GET /tasks?ids=id1,id2,id3`

Returns the named tasks belonging to the API key.

Poll every 3–5 seconds. Do not poll each task in a separate request.

Typical states:

- `accepted`: accepted, waiting for an available worker
- `running`: generation is active
- `ready`: output is available
- `declined`: content refusal; no output
- `failed`: service or execution failure
- `cancelled`: cancelled by the client

Ready video:

```json
{
  "id": "job-id",
  "state": "ready",
  "url": "https://api.varag.video/v1/files/...",
  "url_expires": 1794359900,
  "client_ref": "vid-1"
}
```

Ready image can include `url` and, for image-then-video, `image_url`.

## File Download

```http
GET /files/{opaque-file-id}.mp4
GET /files/{opaque-file-id}.webp
GET /files/{opaque-file-id}.png
GET /files/{opaque-file-id}.jpg
```

The generated URL is downloadable without `X-API-Key`. Treat it as temporary
and download it promptly. Do not construct file URLs manually.

## Cancellation

```http
DELETE /tasks/{id}
```

Cancels an `accepted` task before generation begins; no quota is charged.
A `running` task returns HTTP `409` with code `JOB_RUNNING` and continues.
A task already in final state is returned unchanged.

### Hard cancel running or stuck tasks

```http
POST /tasks/{id}/hard-cancel
```

Alias: `POST /jobs/{id}/hard-cancel`. No request body is required.
Send `X-API-Key`. A task belonging to another key is not visible (`404 JOB_NOT_FOUND`).

Closes an active task, including `running`, immediately as `cancelled` with
`error_code: HARD_CANCELLED`. Returns the task with HTTP `200`. Active slots
are released, no new quota is charged, and subsequent calls are idempotent.
Already final tasks are returned unchanged. Late outputs cannot restore or
charge a cancelled task.

For selected tasks:

```http
POST /tasks/hard-cancel
```

```json
{"ids": ["task-id-1", "task-id-2"]}
```

Maximum: 200 IDs. Alias: `POST /jobs/hard-cancel`.
Unknown, foreign and final IDs are ignored; they are not included in cancelled IDs.

To reset **all active tasks of this API key**:

```json
{"all": true}
```

Do not combine `all: true` with `ids`.

```json
{
  "jobs": [{"id":"task-id-1","state":"cancelled","error_code":"HARD_CANCELLED"}],
  "cancelled_ids": ["task-id-1"],
  "cancelled_count": 1,
  "hard_cancelled": true,
  "usage": {"video":{"busy":0,"free":12},"image":{"busy":0,"free":12}}
}
```

For image-then-video, unfinished stages are cancelled together. Charges for an
image already delivered remain; cancelled video is not charged. Already started
computation may finish later, but its output is ignored. To retry after hard
cancel, submit a new task and use its new ID.

## Errors

Error body:

```json
{
  "detail": {
    "code": "SLOTS_BUSY",
    "message": "нет свободного слота"
  }
}
```

Important codes:

| HTTP | Code | Client action |
|---:|---|---|
| 400 | `BAD_KIND`, `BAD_ASPECT`, `WRONG_ENDPOINT`, `BAD_IMAGE_TYPE`, `NO_REFERENCES` | Fix request |
| 400 | `IMAGE_TOO_LARGE` | Compress the individual binary image to at most 1,500,000 bytes |
| 400 | `LIST_OVER_SLOTS`, `TOO_MANY_IDS` | Reduce the number of jobs or task IDs |
| 400 | `BAD_IDS` | Supply `ids` or `all: true` for hard cancel |
| 401 | `INVALID_API_KEY` | Stop; obtain a valid key |
| 402 | `EXPIRED`, `QUOTA_EXHAUSTED` | Stop until tariff is renewed |
| 403 | `PLAN_NO_SERVICE` | The key does not include this service |
| 404 | `JOB_NOT_FOUND`, `FILE_NOT_FOUND` | Check the returned task ID or result URL |
| 409 | `JOB_RUNNING` | Normal DELETE does not cancel running; use hard cancel if needed |
| 410 | `FILE_EXPIRED` | The temporary result URL has expired |
| 413 | `REQUEST_TOO_LARGE` | Split the JSON request into smaller submissions |
| 422 | validation error list in `detail` | Fix missing fields or invalid field types |
| 429 | `SLOTS_BUSY`, `DAILY_QUOTA`, `TOO_MANY_REQUESTS` | Back off; keep jobs client-side |
| 502 | `FILE_UNAVAILABLE` | Retry downloading the existing result |
| 503 | `SERVICE_UNAVAILABLE` | Back off and poll existing task IDs again |

Content refusal is returned as a completed `declined` task and should not be
blindly retried with the same prompt. A `failed` task is a service failure and
may be retried with a bounded attempt count.
For a first/last-frame task, `error_code: "OUTCOME_UNKNOWN"` with
`retryable: false` means that the accepted operation's result could not be
confirmed. Do not automatically submit a new generation for that task.
After a request timeout or temporary HTTP failure, continue polling the same
accepted task ID. Do not submit a duplicate generation solely because polling
or downloading failed.

## Minimal Python Client

```python
import base64
import time
import requests

BASE = "https://api.varag.video/v1"
HEADERS = {"X-API-Key": "mk_...", "Content-Type": "application/json"}

payload = {
    "prompt": "slow camera push toward a lighthouse at dawn",
    "aspect_ratio": "16:9",
    "client_ref": "demo-001",
}

created = requests.post(
    f"{BASE}/video/text-to-video",
    headers=HEADERS,
    json=payload,
    timeout=60,
)
created.raise_for_status()
job = created.json()

while True:
    status = requests.get(
        f"{BASE}/tasks/{job['id']}",
        headers={"X-API-Key": HEADERS["X-API-Key"]},
        timeout=30,
    )
    status.raise_for_status()
    data = status.json()
    if data["state"] == "ready":
        video = requests.get(data["url"], timeout=180)
        video.raise_for_status()
        open("output.mp4", "wb").write(video.content)
        break
    if data["state"] in {"declined", "failed", "cancelled"}:
        raise RuntimeError(data)
    time.sleep(4)
```

## Client Rules

1. Never put the API key into frontend JavaScript or a public repository.
2. Keep a local queue; the server does not queue jobs rejected for busy slots.
3. Submit jobs in batches when possible.
4. Poll multiple task IDs in one request.
5. Retry only transient HTTP errors and `failed` tasks, with a bounded limit.
6. Do not retry `declined` with the same prompt.
