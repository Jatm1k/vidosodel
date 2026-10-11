<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { ProjectDetail, TrackSummary } from '@/api/types'
import { duration } from '@/composables/useFormat'
import { useTrackActions } from '@/composables/useTrackActions'
import { useNotify } from '@/composables/useNotify'
import ActiveJobs from '../ActiveJobs.vue'

const props = defineProps<{ track: TrackSummary; project: ProjectDetail }>()
const emit = defineEmits<{ changed: [] }>()
const notify = useNotify()
const confirm = useConfirm()
const { run, starting } = useTrackActions(() => props.track.id)

const transcribe = ref(true)
const uploading = ref<'audio' | 'srt' | null>(null)

const timingsText = computed(() => ({
  lumean: 'Пословные тайминги от Lumean — самые точные',
  stt: 'Тайминги распознаны из аудио',
  srt: 'Тайминги взяты из SRT',
  estimate: 'Тайминги рассчитаны по тексту (приблизительно) — заменятся после озвучки',
}[props.track.timings_origin ?? ''] ?? 'Таймингов пока нет'))

const voiceTemplate = computed(() => {
  const v = props.project.effective_settings.voice
  return v.templates[props.track.language] || v.default_template_id
})

function generate() {
  const go = () => run('voice', {}, 'Озвучка запущена')
  if (props.track.audio_url) {
    confirm.require({
      header: 'Озвучить заново?',
      message: 'Текущая озвучка будет заменена. Сцены сохранятся и подстроятся под новые тайминги.',
      acceptLabel: 'Озвучить заново',
      rejectLabel: 'Отмена',
      rejectProps: { severity: 'secondary', text: true },
      accept: go,
    })
  } else go()
}

async function upload(kind: 'audio' | 'srt', ev: Event) {
  const f = (ev.target as HTMLInputElement).files?.[0]
  ;(ev.target as HTMLInputElement).value = ''
  if (!f) return
  uploading.value = kind
  try {
    const url = kind === 'audio'
      ? `/api/tracks/${props.track.id}/upload/audio?transcribe=${transcribe.value}`
      : `/api/tracks/${props.track.id}/upload/srt`
    await api.upload(url, f)
    notify.ok(kind === 'audio' ? 'Аудио загружено' : 'Субтитры загружены', kind === 'audio' && transcribe.value ? 'Запущено распознавание таймингов' : undefined)
    emit('changed')
  } catch (e) {
    notify.error(e)
  } finally {
    uploading.value = null
  }
}

// ---- правка отдельных фрагментов озвучки
interface VoiceChunk { index: number; duration: number; text: string | null; chars: number | null; edited: boolean }
interface VoiceChunks { expired: boolean; busy: boolean; max_length: number; script_chars: number; chunks: VoiceChunk[] }

const chunkData = ref<VoiceChunks | null>(null)
const chunksLoading = ref(false)
const playing = ref<number | null>(null)
const editing = ref<number | null>(null)
const draft = ref('')
const retimeScenes = ref(true)

const canFixChunks = computed(() => props.track.audio_origin === 'lumean' && !!props.track.audio_url)
const fixRunning = computed(() => props.track.active_jobs?.some((j: { kind: string }) => ['voice', 'voice_fix'].includes(j.kind)) ?? false)

async function loadChunks() {
  chunksLoading.value = true
  try {
    chunkData.value = await api.get<VoiceChunks>(`/api/tracks/${props.track.id}/voice/chunks`)
  } catch (e) {
    notify.error(e)
  } finally {
    chunksLoading.value = false
  }
}

function startEdit(c: VoiceChunk) {
  playing.value = null
  editing.value = c.index
  draft.value = c.text ?? ''
}

const editedChunk = computed(() => chunkData.value?.chunks.find((c) => c.index === editing.value) ?? null)
const draftChanged = computed(() => draft.value.trim() !== (editedChunk.value?.text ?? '').trim())
const costShare = computed(() => {
  const total = chunkData.value?.script_chars || 0
  return total ? Math.max(1, Math.round((draft.value.trim().length / total) * 100)) : null
})

function submitFix() {
  const c = editedChunk.value
  if (!c) return
  const text = draft.value.trim()
  confirm.require({
    header: `Переозвучить фрагмент №${c.index + 1}?`,
    message: `Платно озвучится только этот фрагмент (${text.length} симв.${costShare.value ? `, ~${costShare.value}% стоимости всей озвучки` : ''}). `
      + 'Сценарий, картинки и промпты не меняются'
      + (retimeScenes.value ? '; границы сцен подстроятся под новое аудио.' : '; границы сцен останутся как есть.'),
    acceptLabel: 'Переозвучить',
    rejectLabel: 'Отмена',
    rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      await run('voice_fix', { chunk_index: c.index, text, retime_scenes: retimeScenes.value }, 'Фрагмент переозвучивается')
      editing.value = null
    },
  })
}

// после правки список перечитывается сам (озвучка обновилась на сервере)
watch(() => props.track.voice_meta?.fixed_at, () => {
  if (chunkData.value) void loadChunks()
})

async function estimateTimings() {
  try {
    await api.post(`/api/tracks/${props.track.id}/timings/estimate`)
    emit('changed')
  } catch (e) {
    notify.error(e)
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <ActiveJobs :track="track" :kinds="['voice', 'voice_fix', 'transcribe']" />

    <section v-if="track.audio_url" class="rounded-lg border border-line-soft bg-panel p-5">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div class="font-medium">
            {{ track.audio_origin === 'lumean' ? 'Озвучка Lumean' : 'Загруженная озвучка' }}
            <span class="tnum ml-2 text-ink-3">{{ duration(track.audio_duration) }}</span>
          </div>
          <div class="mt-0.5 text-[13px]" :class="track.timings_origin && track.timings_origin !== 'estimate' ? 'text-ink-3' : 'text-tally'">
            {{ timingsText }}
          </div>
        </div>
        <div class="flex gap-2">
          <a :href="`/api/tracks/${track.id}/download/audio`" class="p-button p-button-secondary p-button-text p-button-sm">
            <i class="pi pi-download mr-2 text-xs" />Аудио
          </a>
          <a v-if="track.srt_url" :href="`/api/tracks/${track.id}/download/srt`" class="p-button p-button-secondary p-button-text p-button-sm">
            <i class="pi pi-download mr-2 text-xs" />SRT
          </a>
        </div>
      </div>
      <audio :src="track.audio_url" controls preload="metadata" class="mt-4 w-full" />
      <div v-if="track.voice_meta?.cost_rub" class="mt-2 text-[13px] text-ink-3">
        Списано: <span class="tnum">{{ track.voice_meta.cost_rub }}</span> LMC
      </div>
      <div v-if="track.audio_origin === 'upload' && (!track.timings_origin || track.timings_origin === 'estimate')" class="mt-4">
        <Button label="Распознать тайминги из аудио" icon="pi pi-wave-pulse" size="small" :loading="starting === 'transcribe'" @click="run('transcribe', {}, 'Распознавание запущено')" />
      </div>
    </section>

    <section v-if="canFixChunks" class="rounded-lg border border-line-soft p-5">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div class="font-medium">Исправить произношение</div>
          <p class="mt-0.5 text-[13px] text-ink-3">
            Переозвучивается один фрагмент, а не вся озвучка. Платно только он: обычно доли рубля.
            Сценарий, сцены и картинки не затрагиваются.
          </p>
        </div>
        <Button
          v-if="!chunkData"
          label="Показать фрагменты"
          icon="pi pi-list"
          severity="secondary"
          outlined
          size="small"
          :loading="chunksLoading"
          @click="loadChunks"
        />
        <Button v-else label="Обновить" icon="pi pi-refresh" severity="secondary" text size="small" :loading="chunksLoading" @click="loadChunks" />
      </div>

      <p v-if="chunkData?.expired" class="mt-3 text-[13px] text-tally">
        Файлы заказа удалены Lumean по сроку хранения — точечная правка недоступна, озвучьте заново.
      </p>
      <ul v-else-if="chunkData" class="mt-4 flex flex-col divide-y divide-line-soft">
        <li v-for="c in chunkData.chunks" :key="c.index" class="py-3">
          <div class="flex items-start gap-3">
            <span class="tnum w-8 shrink-0 pt-0.5 text-[13px] text-ink-3">№{{ c.index + 1 }}</span>
            <div class="min-w-0 flex-1">
              <p v-if="editing !== c.index" class="line-clamp-2 text-[13px] text-ink-2">{{ c.text ?? '(текст недоступен)' }}</p>
              <template v-else>
                <Textarea v-model="draft" auto-resize rows="4" :maxlength="chunkData.max_length" class="w-full" />
                <p class="mt-1 text-[13px] text-ink-3">
                  Пишите так, как слово должно звучать: «Python» → «Пайтон», ударение — символом ´ после гласной.
                  Субтитры сохранят прежнее написание, если число слов не меняется.
                </p>
                <label class="mt-2 flex items-center gap-2 text-[13px]">
                  <Checkbox v-model="retimeScenes" binary />Подстроить границы сцен под новое аудио (рекомендуется)
                </label>
                <div class="mt-3 flex items-center gap-2">
                  <Button
                    label="Переозвучить фрагмент"
                    icon="pi pi-microphone"
                    size="small"
                    :disabled="!draft.trim() || !draftChanged || fixRunning"
                    :loading="starting === 'voice_fix'"
                    @click="submitFix"
                  />
                  <Button label="Отмена" severity="secondary" text size="small" @click="editing = null" />
                  <span class="tnum ml-auto text-[13px] text-ink-3">{{ draft.length }} / {{ chunkData.max_length }}</span>
                </div>
              </template>
              <audio
                v-if="playing === c.index"
                :src="`/api/tracks/${track.id}/voice/chunks/${c.index}/audio`"
                controls
                autoplay
                class="mt-2 w-full"
                @ended="playing = null"
              />
            </div>
            <div v-if="editing !== c.index" class="flex shrink-0 items-center gap-1">
              <span v-if="c.edited" class="mr-1 rounded bg-raised px-1.5 py-0.5 text-[11px] text-ink-3">исправлено</span>
              <span class="tnum mr-2 text-[13px] text-ink-3">{{ duration(c.duration) }}</span>
              <Button
                :icon="playing === c.index ? 'pi pi-stop' : 'pi pi-play'"
                severity="secondary"
                text
                size="small"
                :aria-label="`Прослушать фрагмент ${c.index + 1}`"
                @click="playing = playing === c.index ? null : c.index"
              />
              <Button icon="pi pi-pencil" severity="secondary" text size="small" :disabled="!c.text || fixRunning" :aria-label="`Править фрагмент ${c.index + 1}`" @click="startEdit(c)" />
            </div>
          </div>
        </li>
      </ul>
    </section>

    <div class="grid gap-4 lg:grid-cols-3">
      <section class="flex flex-col rounded-lg border border-line-soft p-5">
        <div class="font-medium">Сгенерировать в Lumean</div>
        <p class="mt-1 flex-1 text-[13px] text-ink-3">
          Голос из настроек канала. Вместе с аудио придут точные пословные тайминги и субтитры.
          <template v-if="!voiceTemplate"><br /><span class="text-tally">Голос для этого языка не выбран — откройте настройки канала.</span></template>
        </p>
        <Button
          class="mt-4 self-start"
          :label="track.audio_url ? 'Озвучить заново' : 'Озвучить сценарий'"
          icon="pi pi-microphone"
          :disabled="!track.script_chars || !voiceTemplate"
          :loading="starting === 'voice'"
          @click="generate"
        />
      </section>

      <section class="flex flex-col rounded-lg border border-line-soft p-5">
        <div class="font-medium">Загрузить свою озвучку</div>
        <p class="mt-1 flex-1 text-[13px] text-ink-3">MP3, WAV, M4A, OGG или FLAC.</p>
        <label class="mt-3 flex items-center gap-2 text-[13px]">
          <Checkbox v-model="transcribe" binary />Распознать тайминги автоматически
        </label>
        <label class="p-button p-button-secondary p-button-outlined mt-4 cursor-pointer self-start">
          <i :class="['pi', uploading === 'audio' ? 'pi-spin pi-spinner' : 'pi-upload']" class="mr-2 text-xs" />Выбрать аудиофайл
          <input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.opus" class="hidden" @change="upload('audio', $event)" />
        </label>
      </section>

      <section class="flex flex-col rounded-lg border border-line-soft p-5">
        <div class="font-medium">Только тайминги</div>
        <p class="mt-1 flex-1 text-[13px] text-ink-3">
          Загрузите SRT, чтобы сделать раскадровку и картинки без аудио. Или рассчитайте тайминги по тексту, чтобы спланировать сцены заранее.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <label class="p-button p-button-secondary p-button-outlined cursor-pointer">
            <i :class="['pi', uploading === 'srt' ? 'pi-spin pi-spinner' : 'pi-upload']" class="mr-2 text-xs" />SRT / VTT
            <input type="file" accept=".srt,.vtt" class="hidden" @change="upload('srt', $event)" />
          </label>
          <Button label="По тексту" severity="secondary" text :disabled="!track.script_chars" @click="estimateTimings" />
        </div>
      </section>
    </div>
  </div>
</template>
