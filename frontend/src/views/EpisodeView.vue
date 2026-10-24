<script setup lang="ts">
/**
 * One episode: screenplay blocks with their clips, sound design, assembling.
 * Scenes, images, render and packaging are the usual project page (an episode is a project).
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'
import type { BlockKind, CueKind, EpisodeDetail, SeriesDetail, SoundCue } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'
import { duration, timecode } from '@/composables/useFormat'
import EpisodeBlockRow from '@/components/EpisodeBlockRow.vue'

const props = defineProps<{ id: number }>()
const store = useAppStore()
const notify = useNotify()
const confirm = useConfirm()
const router = useRouter()

const episode = ref<EpisodeDetail | null>(null)
const series = ref<SeriesDetail | null>(null)
const meta = ref({ title: '', synopsis: '', summary: '' })
const showNotes = ref(false)

const busyKinds = computed(() => new Set(
  store.activeJobs.filter((j) => j.project_id === props.id).map((j) => j.kind),
))
const jobs = computed(() => store.activeJobs.filter((j) => j.project_id === props.id))
const toVoice = computed(() => episode.value?.blocks.filter((b) => b.kind !== 'pause' && (b.audio_status !== 'done' || b.audio_stale)).length ?? 0)
const toMake = computed(() => episode.value?.cues.filter((c) => c.audio_status !== 'done').length ?? 0)
const blockOptions = computed(() => (episode.value?.blocks ?? []).map((b, i) => ({
  id: b.id,
  label: `${i + 1}. ${b.kind === 'pause' ? 'пауза' : (b.character ? b.character + ': ' : '') + b.text.slice(0, 50)}`,
})))

async function load() {
  const ep = await api.get<EpisodeDetail>(`/api/episodes/${props.id}`)
  episode.value = ep
  if (!series.value || series.value.id !== ep.series_id) series.value = await api.get<SeriesDetail>(`/api/series/${ep.series_id}`)
  if (JSON.stringify(meta.value) === JSON.stringify({ title: '', synopsis: '', summary: '' }) || !showNotes.value) {
    meta.value = { title: ep.title, synopsis: ep.synopsis, summary: ep.summary }
  }
}

let timer: number | undefined
let off: (() => void) | undefined
onMounted(async () => {
  await load()
  off = store.onEvent((e) => {
    const mine = (e.type === 'series' && (e.project_id === props.id || (e.project_id == null && e.series_id === episode.value?.series_id))) ||
      (e.type === 'job' && e.job.project_id === props.id && e.job.status !== 'running') ||
      (e.type === 'track' && e.track_id === episode.value?.track_id)
    if (mine) {
      window.clearTimeout(timer)
      timer = window.setTimeout(load, 400)
    }
  })
})
onUnmounted(() => {
  off?.()
  window.clearTimeout(timer)
})

async function call<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn()
  } catch (e) {
    notify.error(e)
    return undefined
  }
}

async function patchBlock(id: number, body: Record<string, unknown>) {
  const ep = await call(() => api.patch<EpisodeDetail>(`/api/blocks/${id}`, body))
  if (ep) episode.value = ep
}

async function insert(kind: BlockKind, afterId: number | null) {
  const chars = series.value?.characters ?? []
  if (kind === 'line' && !chars.length) {
    notify.info('Сначала добавьте персонажа', 'Реплике нужен говорящий')
    return
  }
  const block: Record<string, unknown> = { kind }
  if (kind === 'line') Object.assign(block, { character_id: chars[0].id, text: '…' })
  if (kind === 'narration') block.text = '…'
  if (kind === 'pause') block.pause = 1
  const ep = await call(() => api.post<EpisodeDetail>(`/api/episodes/${props.id}/blocks`, { blocks: [block], after_block_id: afterId }))
  if (ep) episode.value = ep
}

function removeBlock(id: number) {
  confirm.require({
    header: 'Удалить блок?', message: 'Блок удалится вместе с озвучкой.',
    acceptLabel: 'Удалить', rejectLabel: 'Отмена',
    acceptProps: { severity: 'danger' }, rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      const ep = await call(() => api.del<EpisodeDetail>(`/api/blocks/${id}`))
      if (ep) episode.value = ep
    },
  })
}

async function move(index: number, delta: number) {
  const b = episode.value?.blocks[index]
  if (!b) return
  await patchBlock(b.id, { position: Math.max(0, index + delta) })
}

async function job(kind: string, params: Record<string, unknown> = {}, message = '') {
  const r = await call(() => api.post<{ job_id: number }>(`/api/episodes/${props.id}/jobs/${kind}`, params))
  if (r) {
    if (message) notify.info(message)
    void store.loadActiveJobs()
  }
}

async function saveMeta() {
  const ep = await call(() => api.patch<EpisodeDetail>(`/api/episodes/${props.id}`, meta.value))
  if (ep) {
    episode.value = ep
    notify.ok('Сохранено')
  }
}

// ------------------------------------------------------------------ cues
async function addCue(kind: CueKind) {
  const first = episode.value?.blocks[0]?.id ?? null
  const body = { kind, prompt: kind === 'music' ? 'calm cinematic underscore' : kind === 'ambience' ? 'quiet room tone' : 'door creak',
                 start_block_id: kind === 'music' ? null : first }
  const ep = await call(() => api.post<EpisodeDetail>(`/api/episodes/${props.id}/cues`, body))
  if (ep) episode.value = ep
}

async function patchCue(c: SoundCue, body: Record<string, unknown>) {
  const ep = await call(() => api.patch<EpisodeDetail>(`/api/cues/${c.id}`, body))
  if (ep) episode.value = ep
}

async function removeCue(c: SoundCue) {
  const ep = await call(() => api.del<EpisodeDetail>(`/api/cues/${c.id}`))
  if (ep) episode.value = ep
}

const cueKinds = [
  { value: 'music', label: 'Музыка' }, { value: 'ambience', label: 'Эмбиент' }, { value: 'sfx', label: 'Эффект' },
]

function deleteEpisode() {
  confirm.require({
    header: 'Удалить серию?', message: 'Удалятся сценарий, озвучка, звуки, кадры и видео серии.',
    acceptLabel: 'Удалить', rejectLabel: 'Отмена',
    acceptProps: { severity: 'danger' }, rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      const sid = episode.value?.series_id
      await api.del(`/api/episodes/${props.id}`)
      router.push(`/series/${sid}`)
    },
  })
}
</script>

<template>
  <div v-if="episode && series" class="mx-auto max-w-[1200px] px-8 py-8">
    <RouterLink :to="`/series/${series.id}`" class="text-[13px] text-ink-3 hover:text-ink-2">
      <i class="pi pi-arrow-left text-[11px]" /> {{ series.name }}
    </RouterLink>
    <header class="mt-2 flex items-start gap-4">
      <span class="tnum pt-1 font-display text-2xl text-ink-3">{{ episode.number }}</span>
      <div class="min-w-0 flex-1">
        <h1 class="font-display text-2xl font-semibold">{{ episode.title }}</h1>
        <div class="mt-1 text-[13px] text-ink-3">
          <template v-if="episode.duration">Длительность {{ duration(episode.duration) }}</template>
          <template v-else>Примерно {{ duration(episode.estimated_duration) }}<span v-if="episode.timeline_estimated"> (оценка до озвучки)</span></template>
          · блоков {{ episode.blocks.length }} · звуков {{ episode.cues.length }}
        </div>
      </div>
      <Button label="Заметки" icon="pi pi-book" severity="secondary" text @click="showNotes = !showNotes" />
      <RouterLink :to="`/projects/${episode.id}`">
        <Button label="Кадры и видео" icon="pi pi-images" severity="secondary" />
      </RouterLink>
      <Button icon="pi pi-trash" severity="secondary" text aria-label="Удалить серию" @click="deleteEpisode" />
    </header>

    <section v-if="showNotes" class="mt-5 grid gap-4 rounded-lg border border-line-soft bg-panel p-5">
      <label class="flex flex-col gap-1.5"><span class="text-ink-2">Название</span><InputText v-model="meta.title" /></label>
      <label class="flex flex-col gap-1.5"><span class="text-ink-2">Синопсис (план серии)</span>
        <Textarea v-model="meta.synopsis" rows="3" auto-resize /></label>
      <label class="flex flex-col gap-1.5"><span class="text-ink-2">Итог серии</span>
        <span class="text-[13px] text-ink-3">Что произошло на самом деле — память сериала, её читает автор следующих серий.</span>
        <Textarea v-model="meta.summary" rows="3" auto-resize /></label>
      <div class="flex justify-end"><Button label="Сохранить" @click="saveMeta" /></div>
    </section>

    <!-- production bar -->
    <div class="sticky top-0 z-10 -mx-8 mt-5 flex flex-wrap items-center gap-2 border-b border-line-soft bg-bg/90 px-8 py-3 backdrop-blur">
      <Button :label="toVoice ? `Озвучить блоки · ${toVoice}` : 'Всё озвучено'" icon="pi pi-microphone" size="small"
              :disabled="!toVoice" :loading="busyKinds.has('episode_voice')" @click="job('episode_voice', {}, 'Озвучка блоков запущена')" />
      <Button :label="toMake ? `Создать звуки · ${toMake}` : 'Звуки готовы'" icon="pi pi-volume-up" size="small" severity="secondary"
              :disabled="!toMake" :loading="busyKinds.has('episode_sounds')" @click="job('episode_sounds', {}, 'Генерация звуков запущена')" />
      <Button label="Собрать серию" icon="pi pi-sliders-h" size="small" severity="secondary" :disabled="!!toVoice"
              v-tooltip.bottom="toVoice ? 'Сначала озвучьте все блоки' : 'Речь + музыка и звуки → дорожка серии, субтитры и сцены'"
              :loading="busyKinds.has('episode_assemble')" @click="job('episode_assemble', {}, 'Сборка запущена')" />
      <audio v-if="episode.audio_url" :src="episode.audio_url" controls preload="none" class="ml-2 h-8 min-w-64 flex-1" />
      <div v-for="j in jobs" :key="j.id" class="flex w-full items-center gap-2 text-[12px] text-ink-3">
        <i class="pi pi-spin pi-spinner text-[11px]" />
        <span class="truncate">{{ j.title }} — {{ j.message }}</span>
        <span class="tnum">{{ Math.round(j.progress * 100) }}%</span>
      </div>
    </div>

    <div class="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <!-- screenplay -->
      <section>
        <h2 class="text-base font-semibold">Сценарий</h2>
        <div v-if="!episode.blocks.length" class="mt-3 rounded-lg border border-dashed border-line p-8 text-center text-ink-3">
          Сценарий пуст. Добавьте блоки ниже или попросите агента написать серию (set_screenplay).
        </div>
        <div class="mt-3 divide-y divide-line-soft rounded-lg border border-line-soft bg-panel">
          <EpisodeBlockRow
            v-for="(b, i) in episode.blocks"
            :key="b.id"
            :block="b"
            :index="i"
            :characters="series.characters"
            :locations="series.locations"
            :busy="busyKinds.has('episode_voice')"
            @patch="(body) => patchBlock(b.id, body)"
            @voice="job('episode_voice', { block_ids: [b.id], force: true }, 'Блок переозвучивается')"
            @remove="removeBlock(b.id)"
            @insert="(kind) => insert(kind, b.id)"
            @move="(d) => move(i, d)"
          />
        </div>
        <div class="mt-3 flex gap-2">
          <Button label="Диктор" icon="pi pi-plus" size="small" severity="secondary" text @click="insert('narration', null)" />
          <Button label="Реплика" icon="pi pi-plus" size="small" severity="secondary" text @click="insert('line', null)" />
          <Button label="Пауза" icon="pi pi-plus" size="small" severity="secondary" text @click="insert('pause', null)" />
        </div>
      </section>

      <!-- sound design -->
      <section>
        <h2 class="text-base font-semibold">Звуковой дизайн</h2>
        <p class="mt-1 text-[13px] text-ink-3">
          Привязка к блокам: звуки остаются на месте после переозвучки. Описания — по-английски. Музыку лучше
          создавать после озвучки: её длина берётся из таймлайна.
        </p>
        <div class="mt-3 flex flex-col gap-3">
          <article v-for="c in episode.cues" :key="c.id" class="flex flex-col gap-2 rounded-lg border border-line-soft bg-panel p-3">
            <div class="flex items-center gap-2">
              <Select :model-value="c.kind" :options="cueKinds" option-label="label" option-value="value" size="small" class="w-32"
                      aria-label="Тип звука" @update:model-value="(v) => patchCue(c, { kind: v })" />
              <span v-if="c.window" class="tnum text-[12px] text-ink-3">{{ timecode(c.window[0]) }}–{{ timecode(c.window[1]) }}</span>
              <div class="flex-1" />
              <Button icon="pi pi-refresh" size="small" text severity="secondary" v-tooltip.top="'Создать заново'"
                      aria-label="Создать заново" :disabled="busyKinds.has('episode_sounds')"
                      @click="job('episode_sounds', { cue_ids: [c.id], force: true }, 'Звук создаётся заново')" />
              <Button icon="pi pi-trash" size="small" text severity="secondary" aria-label="Удалить звук" @click="removeCue(c)" />
            </div>
            <Textarea :model-value="c.prompt" rows="1" auto-resize class="text-[13px]" aria-label="Описание звука"
                      @change="(e: any) => patchCue(c, { prompt: e.target.value })" />
            <div class="grid grid-cols-2 gap-2 text-[12px]">
              <label class="col-span-2 flex flex-col gap-1">
                <span class="text-ink-3">Начало: блок</span>
                <div class="flex gap-1">
                  <Select :model-value="c.start_block_id" :options="[{ id: null, label: 'Начало серии' }, ...blockOptions]"
                          option-label="label" option-value="id" size="small" class="min-w-0 flex-1"
                          @update:model-value="(v) => patchCue(c, { start_block_id: v })" />
                  <Select :model-value="c.anchor" :options="[{ v: 'start', l: 'начало' }, { v: 'end', l: 'конец' }]"
                          option-label="l" option-value="v" size="small" class="w-28"
                          @update:model-value="(v) => patchCue(c, { anchor: v })" />
                </div>
              </label>
              <label v-if="c.kind !== 'sfx'" class="col-span-2 flex flex-col gap-1">
                <span class="text-ink-3">До конца блока</span>
                <Select :model-value="c.end_block_id" :options="[{ id: null, label: 'До конца серии' }, ...blockOptions]"
                        option-label="label" option-value="id" size="small"
                        @update:model-value="(v) => patchCue(c, { end_block_id: v })" />
              </label>
              <label class="flex flex-col gap-1"><span class="text-ink-3">Сдвиг, с</span>
                <InputNumber :model-value="c.offset" :step="0.1" :min-fraction-digits="1" size="small" input-class="w-full"
                             @update:model-value="(v) => patchCue(c, { offset: v ?? 0 })" /></label>
              <label class="flex flex-col gap-1"><span class="text-ink-3">Громкость, дБ</span>
                <InputNumber :model-value="c.volume" :min="-40" :max="12" size="small" input-class="w-full"
                             @update:model-value="(v) => patchCue(c, { volume: v ?? 0 })" /></label>
              <label v-if="c.kind === 'sfx'" class="flex flex-col gap-1"><span class="text-ink-3">Длина, с</span>
                <InputNumber :model-value="c.duration" :min="0.5" :max="30" :step="0.5" :min-fraction-digits="1" size="small"
                             input-class="w-full" placeholder="авто" @update:model-value="(v) => patchCue(c, { duration: v })" /></label>
              <label class="flex flex-col gap-1"><span class="text-ink-3">Нарастание / затухание, с</span>
                <div class="flex gap-1">
                  <InputNumber :model-value="c.fade_in" :min="0" :max="20" :step="0.5" :min-fraction-digits="1" size="small" input-class="w-full"
                               @update:model-value="(v) => patchCue(c, { fade_in: v ?? 0 })" />
                  <InputNumber :model-value="c.fade_out" :min="0" :max="20" :step="0.5" :min-fraction-digits="1" size="small" input-class="w-full"
                               @update:model-value="(v) => patchCue(c, { fade_out: v ?? 0 })" />
                </div>
              </label>
            </div>
            <div class="flex items-center gap-2">
              <audio v-if="c.audio_url" :src="c.audio_url" controls preload="none" class="h-7 flex-1" />
              <span class="text-[12px]" :class="c.audio_status === 'failed' ? 'text-bad' : 'text-ink-3'">
                {{ { none: 'не создан', queued: 'в очереди', generating: 'создаётся…', done: '', failed: 'ошибка' }[c.audio_status] }}
              </span>
            </div>
            <p v-if="c.audio_error" class="text-[12px] text-bad">{{ c.audio_error }}</p>
          </article>
        </div>
        <div class="mt-3 flex gap-2">
          <Button label="Музыка" icon="pi pi-plus" size="small" severity="secondary" text @click="addCue('music')" />
          <Button label="Эмбиент" icon="pi pi-plus" size="small" severity="secondary" text @click="addCue('ambience')" />
          <Button label="Эффект" icon="pi pi-plus" size="small" severity="secondary" text @click="addCue('sfx')" />
        </div>
      </section>
    </div>
  </div>
</template>
