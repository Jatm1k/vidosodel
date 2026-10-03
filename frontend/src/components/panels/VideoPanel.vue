<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { api } from '@/api/client'
import type { ProjectDetail, TrackSummary } from '@/api/types'
import { useNotify } from '@/composables/useNotify'
import { bytes, duration, relativeDate } from '@/composables/useFormat'
import { useTrackActions } from '@/composables/useTrackActions'
import ActiveJobs from '../ActiveJobs.vue'

const props = defineProps<{ track: TrackSummary; project: ProjectDetail }>()
defineEmits<{ openSettings: [] }>()
const { run, starting } = useTrackActions(() => props.track.id)
const notify = useNotify()

async function reveal() {
  try {
    await api.post(`/api/tracks/${props.track.id}/reveal/video`)
  } catch (e) {
    notify.error(e)
  }
}

const previewStart = ref(0)
const previewLength = ref(30)
const allowMissing = ref(false)
const tab = ref<'video' | 'preview'>(props.track.video_url ? 'video' : 'preview')

const s = computed(() => props.project.effective_settings)
const master = computed(() => props.project.tracks.find((t) => t.is_master))
const imagesReady = computed(() => {
  if (props.track.shares_images) {
    const m = master.value?.scene_stats
    return m ? m.total > 0 && m.images === m.total : false
  }
  return props.track.scene_stats.total > 0 && props.track.scene_stats.images === props.track.scene_stats.total
})
const checks = computed(() => [
  { ok: !!props.track.audio_url, label: 'Озвучка', note: props.track.audio_url ? duration(props.track.audio_duration) : 'нет аудио' },
  { ok: props.track.scene_stats.total > 0, label: 'Сцены', note: `${props.track.scene_stats.total}` },
  {
    ok: imagesReady.value, label: 'Картинки',
    note: props.track.shares_images ? 'из основного языка' : `${props.track.scene_stats.images}/${props.track.scene_stats.total}`,
  },
])
const canRender = computed(() => checks.value[0].ok && checks.value[1].ok && (imagesReady.value || allowMissing.value))
const meta = computed(() => props.track.video_meta ?? {})
const estimate = computed(() => {
  const d = props.track.audio_duration ?? 0
  // Measured: 1080p renders at ~0.25× real time with a GPU encoder, ~0.6× on CPU only.
  const factor = { '1080p': 0.45, '1440p': 0.8, '2160p': 1.8 }[s.value.render.resolution] ?? 0.5
  return d * factor
})

function startPreview() {
  tab.value = 'preview'
  void run('preview', { start: previewStart.value, length: previewLength.value }, 'Превью собирается')
}
function startRender() {
  tab.value = 'video'
  void run('render', { allow_missing: allowMissing.value }, 'Рендер запущен')
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <ActiveJobs :track="track" :kinds="['render', 'preview']" />

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section class="min-w-0">
        <div class="mb-3 flex gap-1">
          <button
            v-for="t in ([['video', 'Готовое видео'], ['preview', 'Превью']] as const)"
            :key="t[0]"
            class="rounded-md px-3 py-1.5 text-[13px] transition-colors"
            :class="tab === t[0] ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink-2'"
            @click="tab = t[0]"
          >{{ t[1] }}</button>
        </div>
        <div class="overflow-hidden rounded-lg border border-line-soft bg-black">
          <video
            v-if="tab === 'video' && track.video_url"
            :key="track.video_url"
            :src="track.video_url"
            controls
            preload="metadata"
            class="aspect-video w-full"
          />
          <video
            v-else-if="tab === 'preview' && track.preview_url"
            :key="track.preview_url"
            :src="track.preview_url"
            controls
            autoplay
            class="aspect-video w-full"
          />
          <div v-else class="flex aspect-video flex-col items-center justify-center gap-2 text-center text-ink-3">
            <i class="pi pi-video text-3xl" />
            {{ tab === 'video' ? 'Видео ещё не собрано' : 'Соберите короткое превью, чтобы проверить движение, переходы и субтитры' }}
          </div>
        </div>
        <div v-if="tab === 'video' && track.video_url" class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-ink-3">
          <span class="tnum">{{ meta.resolution }} · {{ meta.fps }} к/с</span>
          <span class="tnum">{{ duration(meta.duration) }}</span>
          <span class="tnum">{{ bytes(meta.size) }}</span>
          <span>{{ meta.encoder }}</span>
          <span v-if="meta.render_seconds">собрано за {{ duration(meta.render_seconds) }}, {{ relativeDate(new Date(meta.rendered_at * 1000).toISOString()) }}</span>
          <div class="ml-auto flex gap-2">
            <Button label="Показать в папке" icon="pi pi-folder-open" severity="secondary" outlined size="small" @click="reveal" />
            <a :href="`/api/tracks/${track.id}/download/video`" class="p-button p-button-sm">
              <i class="pi pi-download mr-2 text-xs" />Скачать MP4
            </a>
            <a v-if="track.video_srt_url" :href="`/api/tracks/${track.id}/download/video_srt`" class="p-button p-button-secondary p-button-outlined p-button-sm">
              Субтитры SRT
            </a>
          </div>
        </div>
      </section>

      <aside class="flex flex-col gap-4">
        <section class="rounded-lg border border-line-soft bg-panel p-4">
          <div class="font-medium">Готовность</div>
          <ul class="mt-3 flex flex-col gap-2">
            <li v-for="c in checks" :key="c.label" class="flex items-center gap-2.5">
              <i :class="['pi', c.ok ? 'pi-check text-ok' : 'pi-circle text-ink-3']" class="text-xs" />
              <span>{{ c.label }}</span>
              <span class="tnum ml-auto text-[13px] text-ink-3">{{ c.note }}</span>
            </li>
          </ul>
          <label v-if="!imagesReady && checks[1].ok" class="mt-3 flex items-start gap-2 text-[13px] text-ink-2">
            <Checkbox v-model="allowMissing" binary class="mt-0.5" />
            Собрать с пропусками: пустые сцены покажут соседнюю картинку
          </label>
          <Button
            class="mt-4 w-full"
            :label="track.video_url ? 'Собрать заново' : 'Собрать видео'"
            icon="pi pi-video"
            :disabled="!canRender"
            :loading="starting === 'render'"
            @click="startRender"
          />
          <p v-if="track.audio_duration" class="mt-2 text-center text-[13px] text-ink-3">
            Примерно {{ duration(estimate) }} на этом компьютере
          </p>
        </section>

        <section class="rounded-lg border border-line-soft p-4">
          <div class="font-medium">Быстрое превью</div>
          <p class="mt-1 text-[13px] text-ink-3">Фрагмент в 960×540 за несколько секунд.</p>
          <div class="mt-3 flex items-center gap-2">
            <InputNumber v-model="previewStart" :min="0" :max="Math.max(0, (track.audio_duration ?? 0) - 5)" suffix=" с" class="w-28" input-class="w-full" aria-label="Начало фрагмента" />
            <Select
              v-model="previewLength"
              :options="[{ v: 15, l: '15 с' }, { v: 30, l: '30 с' }, { v: 60, l: '1 мин' }]"
              option-value="v"
              option-label="l"
              class="w-24"
              aria-label="Длина фрагмента"
            />
            <Button icon="pi pi-play" severity="secondary" :disabled="!checks[0].ok || !checks[1].ok" :loading="starting === 'preview'" aria-label="Собрать превью" @click="startPreview" />
          </div>
        </section>

        <section class="rounded-lg border border-line-soft p-4 text-[13px]">
          <div class="flex items-baseline justify-between">
            <span class="font-medium text-ink">Параметры</span>
            <button class="text-ink-3 hover:text-ink" @click="$emit('openSettings')">Изменить</button>
          </div>
          <dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-ink-3">
            <dt>Качество</dt><dd class="text-ink-2">{{ s.render.resolution }}, {{ s.render.fps }} к/с</dd>
            <dt>Субтитры</dt><dd class="text-ink-2">{{ s.subtitles.enabled ? 'вшиваются' : 'только файл .srt' }}</dd>
            <dt>Уникализация</dt><dd class="text-ink-2">{{ s.unique.enabled ? `включена, ${Math.round(s.unique.strength * 100)}%` : 'выключена' }}</dd>
            <dt>Движение</dt><dd class="text-ink-2">{{ Math.round(s.render.motion_intensity * 100) }}%, переходов {{ s.render.transitions.length }}</dd>
          </dl>
        </section>
      </aside>
    </div>
  </div>
</template>
