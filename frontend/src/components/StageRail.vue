<script setup lang="ts">
/**
 * The production line of a language version: five stages in order.
 * Each stage shows its state and whether work is running in it right now.
 */
import { computed } from 'vue'
import type { TrackSummary } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { duration } from '@/composables/useFormat'

export type StageId = 'script' | 'voice' | 'storyboard' | 'video' | 'publish'

const props = defineProps<{ track: TrackSummary; publishEnabled?: boolean }>()
const active = defineModel<StageId>({ required: true })
const store = useAppStore()

const KINDS: Record<StageId, string[]> = {
  script: ['translate'],
  voice: ['voice', 'transcribe'],
  storyboard: ['scenes', 'characters', 'prompts', 'images', 'watermarks'],
  video: ['render', 'preview'],
  publish: ['metadata', 'thumbnails'],
}

const stages = computed(() => {
  const t = props.track
  const st = t.scene_stats
  const running = (id: StageId) =>
    store.activeJobs.some((j) => j.track_id === t.id && KINDS[id].includes(j.kind) && j.status === 'running')
  const failed = (id: StageId) => (t.failed_jobs ?? []).some((j) => KINDS[id].includes(j.kind))
  const queued = (id: StageId) => store.activeJobs.some((j) => j.track_id === t.id && KINDS[id].includes(j.kind))
  const storyboardState = t.stages.images === 'done' ? 'done' : st.total ? 'partial' : 'empty'
  return [
    { id: 'script' as const, title: 'Сценарий', state: t.stages.script,
      note: t.script_chars ? `${t.script_chars.toLocaleString('ru-RU')} знаков` : 'Нет текста' },
    { id: 'voice' as const, title: 'Озвучка', state: t.stages.voice,
      note: t.audio_duration ? duration(t.audio_duration) : t.timings_origin === 'srt' ? 'Есть SRT' : 'Нет аудио' },
    { id: 'storyboard' as const, title: 'Раскадровка', state: storyboardState,
      note: !st.total ? 'Нет сцен' : t.shares_images ? `${st.total} сцен, картинки основного языка` : `${st.images}/${st.total} картинок` },
    { id: 'video' as const, title: 'Видео', state: t.stages.video,
      note: t.video_meta?.resolution ? `${t.video_meta.resolution}` : 'Не собрано' },
    { id: 'publish' as const, title: 'Публикация', state: t.stages.publish,
      note: t.publish_meta?.titles?.length ? 'Метаданные готовы' : props.publishEnabled === false ? 'Вручную, по желанию' : 'Нет метаданных' },
  ].map((s) => ({ ...s, running: running(s.id), queued: queued(s.id), failed: failed(s.id) }))
})
</script>

<template>
  <ol class="grid grid-cols-5 gap-px overflow-hidden rounded-lg border border-line-soft bg-line-soft">
    <li v-for="(s, i) in stages" :key="s.id">
      <button
        class="relative flex h-full w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors"
        :class="active === s.id ? 'bg-raised' : 'bg-panel hover:bg-raised/60'"
        :aria-current="active === s.id ? 'step' : undefined"
        @click="active = s.id"
      >
        <span class="flex items-center gap-2">
          <span class="tnum text-xs text-ink-3">{{ i + 1 }}</span>
          <span class="font-medium" :class="active === s.id ? 'text-ink' : 'text-ink-2'">{{ s.title }}</span>
          <span class="ml-auto">
            <span v-if="s.running" class="tally-live block h-2 w-2 rounded-full bg-tally" title="Выполняется" />
            <span v-else-if="s.queued" class="block h-2 w-2 rounded-full border border-tally" title="В очереди" />
            <i v-else-if="s.failed" class="pi pi-exclamation-circle text-xs text-bad" title="Последний запуск завершился ошибкой" />
            <i v-else-if="s.state === 'done'" class="pi pi-check text-xs text-ok" />
            <span v-else-if="s.state === 'partial'" class="block h-2 w-2 rounded-full bg-ink-3" title="Частично" />
          </span>
        </span>
        <span class="truncate text-[13px] text-ink-3">{{ s.note }}</span>
        <span v-if="active === s.id" class="absolute inset-x-0 bottom-0 h-0.5 bg-tally" />
      </button>
    </li>
  </ol>
</template>
