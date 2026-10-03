<script setup lang="ts">
import type { ProjectSummary } from '@/api/types'
import { relativeDate } from '@/composables/useFormat'
import LangBadge from './LangBadge.vue'

const props = defineProps<{ project: ProjectSummary; channelName?: string; channelColor?: string }>()
</script>

<template>
  <RouterLink
    :to="`/projects/${props.project.id}`"
    class="group flex flex-col overflow-hidden rounded-lg border border-line-soft bg-panel transition-colors hover:border-line"
  >
    <div class="relative aspect-video bg-raised">
      <img
        v-if="project.cover_url"
        :src="project.cover_url"
        alt=""
        loading="lazy"
        class="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
      />
      <div v-else class="flex h-full items-center justify-center text-ink-3">
        <i class="pi pi-images text-2xl" />
      </div>
      <span
        v-if="project.progress.running"
        class="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 text-xs text-tally backdrop-blur"
      >
        <span class="tally-live h-1.5 w-1.5 rounded-full bg-tally" />В работе
      </span>
      <div class="absolute inset-x-0 bottom-0 h-1 bg-black/40">
        <div class="h-full bg-tally/80" :style="{ width: `${project.progress.percent}%` }" />
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-1 p-3.5">
      <div class="line-clamp-2 font-medium leading-snug text-ink">{{ project.name }}</div>
      <div class="mt-auto flex items-center gap-2 pt-1 text-xs text-ink-3">
        <span v-if="channelName" class="flex items-center gap-1.5 truncate">
          <span class="h-2 w-2 rounded-sm" :style="{ background: channelColor }" />{{ channelName }}
        </span>
        <span class="flex gap-1" :title="project.languages.join(', ')">
          <LangBadge v-for="l in project.languages" :key="l" :code="l" />
        </span>
        <span class="ml-auto shrink-0">{{ relativeDate(project.updated_at) }}</span>
      </div>
    </div>
  </RouterLink>
</template>
