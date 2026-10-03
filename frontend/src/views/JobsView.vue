<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { Job } from '@/api/types'
import JobRow from '@/components/JobRow.vue'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'

const store = useAppStore()
const confirm = useConfirm()
const notify = useNotify()
const history = ref<Job[]>([])
const filter = ref<'all' | 'failed'>('all')

const active = computed(() => store.activeJobs)
const finished = computed(() =>
  history.value
    .filter((j) => j.status !== 'queued' && j.status !== 'running')
    .filter((j) => filter.value === 'all' || j.status === 'failed'),
)

async function load() {
  history.value = await api.get<Job[]>('/api/jobs?limit=300')
}

let off: (() => void) | undefined
let timer: number | undefined
onMounted(() => {
  void load()
  off = store.onEvent((e) => {
    if (e.type === 'job' && ['done', 'failed', 'cancelled'].includes(e.job.status ?? '')) {
      window.clearTimeout(timer)
      timer = window.setTimeout(load, 500)
    }
  })
})
onUnmounted(() => off?.())

function cancelAll() {
  confirm.require({
    header: 'Остановить все задачи?',
    message: 'Выполняющиеся задачи будут прерваны, ожидающие — сняты с очереди.',
    acceptLabel: 'Остановить все',
    rejectLabel: 'Отмена',
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      const r = await api.post<{ cancelled: number }>('/api/jobs/cancel-all')
      notify.info(`Остановлено задач: ${r.cancelled}`)
    },
  })
}

async function clearFinished() {
  await api.del('/api/jobs/finished')
  await load()
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-8 py-8">
    <div class="flex items-center justify-between gap-4">
      <h1 class="font-display text-2xl font-semibold">Очередь задач</h1>
      <Button
        v-if="active.length"
        label="Остановить все"
        icon="pi pi-stop-circle"
        severity="secondary"
        outlined
        size="small"
        @click="cancelAll"
      />
    </div>

    <section class="mt-6">
      <h2 class="mb-3 text-base font-semibold">Активные</h2>
      <div v-if="active.length" class="overflow-hidden rounded-lg border border-line-soft bg-panel">
        <JobRow v-for="j in active" :key="j.id" :job="j" />
      </div>
      <p v-else class="rounded-lg border border-dashed border-line px-4 py-6 text-center text-ink-3">
        Сейчас ничего не выполняется. Задачи появляются здесь, когда вы запускаете шаги в проекте.
      </p>
    </section>

    <section class="mt-10">
      <div class="mb-3 flex items-center justify-between gap-4">
        <h2 class="text-base font-semibold">История</h2>
        <div class="flex items-center gap-2">
          <SelectButton
            v-model="filter"
            :options="[{ v: 'all', l: 'Все' }, { v: 'failed', l: 'С ошибками' }]"
            option-value="v"
            option-label="l"
            :allow-empty="false"
            size="small"
          />
          <Button label="Очистить" text severity="secondary" size="small" :disabled="!finished.length" @click="clearFinished" />
        </div>
      </div>
      <div v-if="finished.length" class="overflow-hidden rounded-lg border border-line-soft bg-panel">
        <JobRow v-for="j in finished" :key="j.id" :job="j" />
      </div>
      <p v-else class="text-ink-3">История пуста.</p>
    </section>
  </div>
</template>
