<script setup lang="ts">
/**
 * Work happening in a stage: live progress of running/queued jobs and, when the
 * latest attempt of a step failed, its error with a retry button.
 */
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import type { Job, TrackSummary } from '@/api/types'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'

const props = defineProps<{ track: TrackSummary; kinds: string[] }>()
const store = useAppStore()
const notify = useNotify()
const dismissed = ref(new Set<number>())
const retrying = ref<number | null>(null)

const jobs = computed<Job[]>(() =>
  store.activeJobs.filter((j) => j.track_id === props.track.id && props.kinds.includes(j.kind)),
)

/** Failed jobs from the server summary plus failures that arrived live, minus superseded ones. */
const failed = computed<Job[]>(() => {
  const byKind = new Map<string, Job>()
  const live = [...store.jobs.values()].filter((j) => j.track_id === props.track.id)
  for (const j of [...(props.track.failed_jobs ?? []), ...live].sort((a, b) => a.id - b.id)) {
    if (props.kinds.includes(j.kind)) byKind.set(j.kind, { ...byKind.get(j.kind), ...j } as Job)
  }
  return [...byKind.values()].filter(
    (j) => j.status === 'failed' && !dismissed.value.has(j.id) && !jobs.value.some((a) => a.kind === j.kind),
  )
})

async function cancel(id: number) {
  await api.post(`/api/jobs/${id}/cancel`).catch(() => undefined)
}

async function retry(job: Job) {
  retrying.value = job.id
  try {
    await api.post(`/api/jobs/${job.id}/retry`)
    dismissed.value.add(job.id)
    void store.loadActiveJobs()
  } catch (e) {
    notify.error(e)
  } finally {
    retrying.value = null
  }
}
</script>

<template>
  <div v-if="jobs.length || failed.length" class="flex flex-col gap-2">
    <div
      v-for="job in failed"
      :key="`f${job.id}`"
      role="alert"
      class="flex items-start gap-4 rounded-lg border border-bad/40 bg-bad/[0.07] px-4 py-3"
    >
      <i class="pi pi-exclamation-triangle mt-0.5 text-bad" />
      <div class="min-w-0 flex-1">
        <div class="font-medium">{{ job.title }} — не получилось</div>
        <div class="mt-0.5 whitespace-pre-line text-[13px] text-ink-2">{{ job.error }}</div>
        <div v-if="job.progress > 0 && job.progress < 1" class="mt-1 text-[13px] text-ink-3">
          Готовое до сбоя сохранено ({{ job.message }}) — повтор продолжит с того же места.
        </div>
      </div>
      <Button label="Повторить" icon="pi pi-refresh" size="small" severity="secondary" outlined :loading="retrying === job.id" @click="retry(job)" />
      <Button icon="pi pi-times" text rounded severity="secondary" size="small" aria-label="Скрыть" v-tooltip.left="'Скрыть'" @click="dismissed.add(job.id)" />
    </div>

    <div
      v-for="job in jobs"
      :key="job.id"
      class="flex items-center gap-4 rounded-lg border border-tally/30 bg-tally/[0.06] px-4 py-3"
    >
      <span class="h-2 w-2 shrink-0 rounded-full bg-tally" :class="job.status === 'running' ? 'tally-live' : 'opacity-40'" />
      <div class="min-w-0 flex-1">
        <div class="flex items-baseline justify-between gap-3">
          <span class="font-medium">{{ job.title }}</span>
          <span class="tnum text-[13px] text-ink-2">
            {{ job.status === 'queued' ? 'в очереди' : `${Math.round(job.progress * 100)}%` }}
          </span>
        </div>
        <div class="mt-0.5 truncate text-[13px] text-ink-3">{{ job.message || 'Ожидает предыдущий шаг' }}</div>
        <div class="mt-2 h-1 overflow-hidden rounded-full bg-raised">
          <div
            class="h-full rounded-full bg-tally transition-all duration-700"
            :class="job.status === 'queued' ? 'stripes opacity-40' : ''"
            :style="{ width: job.status === 'queued' ? '100%' : `${Math.max(2, job.progress * 100)}%` }"
          />
        </div>
      </div>
      <Button icon="pi pi-times" text rounded severity="secondary" size="small" aria-label="Отменить" v-tooltip.left="'Отменить'" @click="cancel(job.id)" />
    </div>
  </div>
</template>
