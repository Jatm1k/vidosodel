<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import type { Job } from '@/api/types'
import { api } from '@/api/client'
import { relativeDate } from '@/composables/useFormat'
import { useNotify } from '@/composables/useNotify'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ job: Job; compact?: boolean }>()
const notify = useNotify()
const store = useAppStore()

const statusText: Record<string, string> = {
  queued: 'В очереди', running: 'Выполняется', done: 'Готово', failed: 'Ошибка', cancelled: 'Отменено',
}
const waiting = computed(() => props.job.status === 'queued' || /ожидани|Лимит/.test(props.job.message ?? ''))

async function cancel() {
  try {
    await api.post(`/api/jobs/${props.job.id}/cancel`)
  } catch (e) {
    notify.error(e)
  }
}
async function retry() {
  try {
    await api.post(`/api/jobs/${props.job.id}/retry`)
    notify.ok('Задача перезапущена')
    void store.loadActiveJobs()
  } catch (e) {
    notify.error(e)
  }
}
</script>

<template>
  <div class="flex items-center gap-4 border-b border-line-soft px-4 py-3 last:border-b-0">
    <span
      class="h-2 w-2 shrink-0 rounded-full"
      :class="{
        'tally-live bg-tally': job.status === 'running',
        'bg-ink-3': job.status === 'queued' || job.status === 'cancelled',
        'bg-ok': job.status === 'done',
        'bg-bad': job.status === 'failed',
      }"
    />
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline gap-2">
        <span class="truncate font-medium">{{ job.title }}</span>
        <RouterLink
          v-if="job.project_id && job.project_name"
          :to="`/projects/${job.project_id}`"
          class="truncate text-[13px] text-ink-3 hover:text-ink"
        >{{ job.project_name }}<template v-if="job.language"> · {{ job.language.toUpperCase() }}</template></RouterLink>
      </div>
      <div
        class="mt-0.5 truncate text-[13px]"
        :class="job.status === 'failed' ? 'text-bad' : 'text-ink-3'"
        :title="job.error || job.message"
      >
        {{ job.status === 'failed' ? job.error : job.message || statusText[job.status] }}
      </div>
      <div v-if="job.status === 'running'" class="mt-2 h-1 overflow-hidden rounded-full bg-raised">
        <div
          class="h-full rounded-full bg-tally transition-all duration-700"
          :class="waiting ? 'stripes' : ''"
          :style="{ width: `${Math.max(2, job.progress * 100)}%` }"
        />
      </div>
    </div>
    <span v-if="!compact" class="hidden w-28 shrink-0 text-right text-xs text-ink-3 md:block">
      {{ statusText[job.status] }}<br />{{ relativeDate(job.finished_at || job.started_at || job.created_at) }}
    </span>
    <span v-if="job.status === 'running'" class="tnum w-10 shrink-0 text-right text-[13px] text-ink-2">
      {{ Math.round(job.progress * 100) }}%
    </span>
    <Button
      v-if="job.status === 'queued' || job.status === 'running'"
      icon="pi pi-times"
      text
      rounded
      severity="secondary"
      size="small"
      aria-label="Отменить"
      v-tooltip.left="'Отменить'"
      @click="cancel"
    />
    <Button
      v-else-if="job.status === 'failed' || job.status === 'cancelled'"
      icon="pi pi-refresh"
      text
      rounded
      severity="secondary"
      size="small"
      aria-label="Повторить"
      v-tooltip.left="'Повторить'"
      @click="retry"
    />
  </div>
</template>
