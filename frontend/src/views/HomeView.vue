<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { api } from '@/api/client'
import type { ProjectSummary } from '@/api/types'
import { useAppStore } from '@/stores/app'
import ProjectCard from '@/components/ProjectCard.vue'
import JobRow from '@/components/JobRow.vue'

const store = useAppStore()
const projects = ref<ProjectSummary[]>([])
const loading = ref(true)

const channelById = computed(() => new Map(store.channels.map((c) => [c.id, c])))
const keysMissing = computed(() => store.status && (!store.status.keys.lumean || !store.status.keys.fastgen))

async function load() {
  projects.value = await api.get<ProjectSummary[]>('/api/projects?limit=24')
  loading.value = false
}

let off: (() => void) | undefined
let timer: number | undefined
onMounted(() => {
  void load()
  off = store.onEvent((e) => {
    if (e.type === 'job' && (e.job.status === 'done' || e.job.status === 'failed')) {
      window.clearTimeout(timer)
      timer = window.setTimeout(load, 800)
    }
  })
})
onUnmounted(() => off?.())
</script>

<template>
  <div class="mx-auto max-w-[1400px] px-8 py-8">
    <h1 class="font-display text-2xl font-semibold">Студия</h1>

    <div v-if="keysMissing" class="mt-6 rounded-lg border border-tally/40 bg-tally/10 p-5">
      <div class="font-medium text-tally">Подключите сервисы</div>
      <p class="mt-1 text-ink-2">
        Для озвучки нужен ключ Lumean, для картинок и текстов — ключ FastGen. Без них можно загружать свою озвучку и картинки.
      </p>
      <RouterLink to="/settings" class="mt-3 inline-block font-medium text-tally hover:underline">Открыть настройки ключей</RouterLink>
    </div>

    <section v-if="store.activeJobs.length" class="mt-8">
      <div class="mb-3 flex items-baseline justify-between">
        <h2 class="text-base font-semibold">Сейчас в работе</h2>
        <RouterLink to="/jobs" class="text-[13px] text-ink-3 hover:text-ink">Вся очередь</RouterLink>
      </div>
      <div class="overflow-hidden rounded-lg border border-line-soft bg-panel">
        <JobRow v-for="job in store.activeJobs.slice(0, 6)" :key="job.id" :job="job" compact />
      </div>
    </section>

    <section class="mt-8">
      <h2 class="mb-3 text-base font-semibold">Недавние проекты</h2>
      <div v-if="!loading && !projects.length" class="rounded-lg border border-dashed border-line p-10 text-center">
        <p class="text-ink-2">Проектов пока нет.</p>
        <p class="mt-1 text-ink-3">
          {{ store.channels.length ? 'Откройте канал слева и создайте в нём проект.' : 'Начните с канала: кнопка «+» рядом с заголовком «Каналы».' }}
        </p>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        <ProjectCard
          v-for="p in projects"
          :key="p.id"
          :project="p"
          :channel-name="channelById.get(p.channel_id)?.name"
          :channel-color="channelById.get(p.channel_id)?.color"
        />
      </div>
    </section>
  </div>
</template>
