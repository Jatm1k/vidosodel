<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import type { ProjectDetail, TrackSummary } from '@/api/types'
import { copyText } from '@/composables/useFormat'
import { useTrackActions } from '@/composables/useTrackActions'
import { useNotify } from '@/composables/useNotify'
import { markDate, markTrack } from '@/composables/useProduction'
import ActiveJobs from '../ActiveJobs.vue'

const props = defineProps<{ track: TrackSummary; project: ProjectDetail }>()
const notify = useNotify()
const { run, starting } = useTrackActions(() => props.track.id)

const meta = computed(() => props.track.publish_meta ?? {})
const hasMeta = computed(() => !!meta.value.titles?.length)

async function copy(text: string, what: string) {
  await copyText(text)
  notify.ok(`${what} скопировано`)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <ActiveJobs :track="track" :kinds="['metadata', 'thumbnails']" />

    <div class="flex flex-wrap items-center gap-2">
      <Button
        :label="hasMeta ? 'Создать метаданные заново' : 'Создать название, описание и теги'"
        icon="pi pi-sparkles"
        :severity="hasMeta ? 'secondary' : undefined"
        :outlined="hasMeta"
        size="small"
        :disabled="!track.script_chars"
        :loading="starting === 'metadata'"
        @click="run('metadata', {}, 'Метаданные создаются')"
      />
      <Button
        :label="track.thumbnails.length ? 'Новые обложки' : 'Создать обложки'"
        icon="pi pi-image"
        severity="secondary"
        outlined
        size="small"
        :disabled="!meta.thumbnails?.length"
        :loading="starting === 'thumbnails'"
        v-tooltip.top="!meta.thumbnails?.length ? 'Сначала создайте метаданные — в них идеи для обложек' : undefined"
        @click="run('thumbnails', {}, 'Обложки создаются')"
      />
      <div class="flex-1" />
      <div v-if="track.published_at" class="flex items-center gap-2 text-[13px]">
        <i class="pi pi-send text-ok" />
        <span class="text-ink-2">Выложено {{ markDate(track.published_at) }}</span>
        <button class="text-ink-3 hover:text-ink" @click="markTrack(track.id, { published: false })">Снять</button>
      </div>
      <Button
        v-else
        label="Отметить выложенным"
        icon="pi pi-send"
        severity="secondary"
        outlined
        size="small"
        @click="markTrack(track.id, { published: true })"
      />
    </div>

    <div v-if="!hasMeta && !track.thumbnails.length" class="rounded-lg border border-dashed border-line p-10 text-center text-ink-3">
      Здесь появятся варианты названия, описание с главами, теги и обложки для загрузки на YouTube.
    </div>

    <div v-else class="grid gap-5 xl:grid-cols-2">
      <section v-if="meta.titles?.length" class="rounded-lg border border-line-soft bg-panel p-5">
        <h3 class="font-medium">Варианты названия</h3>
        <ul class="mt-3 flex flex-col">
          <li v-for="(t, i) in meta.titles" :key="i" class="group flex items-start gap-3 border-b border-line-soft py-2.5 last:border-b-0">
            <span class="flex-1">{{ t }}</span>
            <span class="tnum shrink-0 text-xs" :class="t.length > 70 ? 'text-bad' : 'text-ink-3'">{{ t.length }}</span>
            <button class="text-ink-3 hover:text-ink" aria-label="Копировать название" @click="copy(t, 'Название')">
              <i class="pi pi-copy text-sm" />
            </button>
          </li>
        </ul>
      </section>

      <section v-if="track.thumbnails.length" class="rounded-lg border border-line-soft bg-panel p-5">
        <h3 class="font-medium">Обложки 1280×720</h3>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <a v-for="(src, i) in track.thumbnails" :key="src" :href="src" :download="`thumbnail_${track.language}_${i + 1}.jpg`" class="group relative overflow-hidden rounded-md">
            <img :src="src" alt="Вариант обложки" class="aspect-video w-full object-cover" />
            <span class="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex"><i class="pi pi-download text-white" /></span>
          </a>
        </div>
      </section>

      <section v-if="meta.description_full" class="rounded-lg border border-line-soft bg-panel p-5 xl:col-span-2">
        <div class="flex items-baseline justify-between">
          <h3 class="font-medium">Описание</h3>
          <Button label="Копировать" icon="pi pi-copy" text size="small" severity="secondary" @click="copy(meta.description_full!, 'Описание')" />
        </div>
        <pre class="mt-2 whitespace-pre-wrap font-sans text-ink-2">{{ meta.description_full }}</pre>
      </section>

      <section v-if="meta.tags?.length" class="rounded-lg border border-line-soft bg-panel p-5 xl:col-span-2">
        <div class="flex items-baseline justify-between">
          <h3 class="font-medium">Теги</h3>
          <Button label="Копировать через запятую" icon="pi pi-copy" text size="small" severity="secondary" @click="copy(meta.tags!.join(', '), 'Теги')" />
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span v-for="t in meta.tags" :key="t" class="rounded-md bg-raised px-2.5 py-1 text-[13px] text-ink-2">{{ t }}</span>
        </div>
      </section>
    </div>
  </div>
</template>
