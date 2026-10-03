<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
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
    <ActiveJobs :track="track" :kinds="['voice', 'transcribe']" />

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
