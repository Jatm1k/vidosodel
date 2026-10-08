<script setup lang="ts">
/**
 * Channel board: projects in columns by production status.
 * A project sits in the column of its least advanced language; language badges
 * with their own status appear only when the languages have drifted apart.
 */
import { computed, ref } from 'vue'
import Menu from 'primevue/menu'
import type { ProjectSummary } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { STATUSES, markDate, statusTitle, useProductionActions } from '@/composables/useProduction'
import LangBadge from './LangBadge.vue'
import ProjectCard from './ProjectCard.vue'

const props = defineProps<{ projects: ProjectSummary[] }>()
const emit = defineEmits<{ changed: [] }>()
const store = useAppStore()
const { menuFor } = useProductionActions(() => emit('changed'))

const running = (p: ProjectSummary) => p.progress.running || store.activeJobs.some((j) => j.project_id === p.id)
const failed = (p: ProjectSummary) => p.tracks_status.some((t) => t.failed)
const drifted = (p: ProjectSummary) => new Set(p.tracks_status.map((t) => t.status)).size > 1

const columns = computed(() =>
  STATUSES.map((s) => ({ ...s, projects: props.projects.filter((p) => p.status === s.id) })),
)

const publishedDate = (p: ProjectSummary) => markDate(Math.max(...p.tracks_status.map((t) => t.published_at ?? 0)))

const menu = ref()
const menuItems = ref<any[]>([])
function openMenu(e: Event, p: ProjectSummary) {
  menuItems.value = menuFor(p, running(p))
  menu.value.toggle(e)
}
</script>

<template>
  <!-- Columns are as wide as grid cards: six of them scroll horizontally. -->
  <div class="overflow-x-auto pb-3">
    <div class="flex gap-3">
      <section v-for="col in columns" :key="col.id" class="flex w-[272px] shrink-0 flex-col rounded-lg bg-panel/50">
        <header class="px-3 pb-2 pt-3">
          <div class="flex items-baseline gap-2">
            <span class="font-medium text-ink">{{ col.title }}</span>
            <span class="tnum text-[13px] text-ink-3">{{ col.projects.length || '' }}</span>
          </div>
          <div v-if="col.hint" class="truncate text-xs text-ink-3">{{ col.hint }}</div>
        </header>
        <div class="flex flex-col gap-3 px-2 pb-2">
          <ProjectCard v-for="p in col.projects" :key="p.id" :project="p">
            <template v-if="drifted(p)" #languages>
              <span class="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
                <span
                  v-for="t in p.tracks_status"
                  :key="t.id"
                  class="flex items-center gap-1"
                  :title="`${store.langLabel(t.language)}: ${statusTitle(t.status)}`"
                >
                  <LangBadge :code="t.language" />
                  <span :class="t.failed ? 'text-bad' : ''">{{ statusTitle(t.status).toLowerCase() }}</span>
                </span>
              </span>
            </template>
            <template v-if="col.id === 'published'" #date>{{ publishedDate(p) }}</template>
            <template #actions>
              <i v-if="failed(p) && !running(p)" class="pi pi-exclamation-circle text-bad" title="Последний запуск завершился ошибкой" />
              <button
                class="-my-1 -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-3 hover:bg-raised hover:text-ink"
                aria-label="Действия с проектом"
                @click.prevent.stop="openMenu($event, p)"
              >
                <i class="pi pi-ellipsis-h text-[11px]" />
              </button>
            </template>
          </ProjectCard>
        </div>
      </section>
    </div>
    <Menu ref="menu" :model="menuItems" popup />
  </div>
</template>
