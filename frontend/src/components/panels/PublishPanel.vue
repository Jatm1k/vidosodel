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
/** Ideas and drawings share one image budget and one list: one job at a time keeps them consistent. */
const thumbsBusy = computed(() =>
  props.track.active_jobs.some((j) => ['thumbnail_ideas', 'thumbnails', 'metadata'].includes(j.kind)),
)

async function copy(text: string, what: string) {
  await copyText(text)
  notify.ok(`${what} скопировано`)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <ActiveJobs :track="track" :kinds="['metadata', 'thumbnail_ideas', 'thumbnails']" />

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
        :label="meta.thumbnails?.length ? 'Новые идеи обложек' : 'Придумать обложки'"
        icon="pi pi-lightbulb"
        severity="secondary"
        outlined
        size="small"
        :disabled="!hasMeta || thumbsBusy"
        :loading="starting === 'thumbnail_ideas'"
        v-tooltip.top="!hasMeta ? 'Сначала создайте метаданные — идеи строятся от названий' : 'Совсем другие идеи и сразу новые обложки'"
        @click="run('thumbnail_ideas', { draw: true }, 'Идеи и обложки создаются')"
      />
      <Button
        v-if="meta.thumbnails?.length"
        label="Перерисовать все"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        size="small"
        :disabled="thumbsBusy"
        :loading="starting === 'thumbnails'"
        v-tooltip.top="'Те же идеи, новая отрисовка каждой'"
        @click="run('thumbnails', {}, 'Обложки перерисовываются')"
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

    <div v-if="!hasMeta && !meta.thumbnails?.length" class="rounded-lg border border-dashed border-line p-10 text-center text-ink-3">
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

      <section v-if="meta.thumbnails?.length" class="rounded-lg border border-line-soft bg-panel p-5 xl:col-span-2">
        <h3 class="font-medium">Обложки 1280×720</h3>
        <p class="mt-1 text-[13px] text-ink-3">
          Каждая обложка рассчитана на своё название. «Перерисовать» — та же идея, новая отрисовка (если на картинке артефакт);
          «Другая идея» — заменит только эту идею и нарисует её заново.
        </p>
        <div class="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="(c, i) in meta.thumbnails" :key="i" class="flex flex-col gap-2">
            <a
              v-if="c.image"
              :href="c.image"
              :download="`thumbnail_${track.language}_${i + 1}.jpg`"
              class="group relative overflow-hidden rounded-md"
            >
              <img :src="c.image" alt="Вариант обложки" class="aspect-video w-full object-cover" />
              <span class="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex"><i class="pi pi-download text-white" /></span>
            </a>
            <div v-else class="flex aspect-video w-full items-center justify-center rounded-md border border-dashed border-line text-[13px] text-ink-3">
              Ещё не нарисована
            </div>
            <div class="flex flex-col gap-0.5 text-[13px]">
              <span v-if="c.headline" class="font-medium">«{{ c.headline }}»</span>
              <span v-if="meta.titles?.[c.title_index ?? 0]" class="text-ink-2">к названию: {{ meta.titles[c.title_index ?? 0] }}</span>
              <span v-if="c.angle" class="text-ink-3">{{ c.angle }}</span>
            </div>
            <div class="flex flex-wrap gap-1">
              <Button
                :label="c.image ? 'Перерисовать' : 'Нарисовать'"
                icon="pi pi-refresh"
                text
                size="small"
                severity="secondary"
                :disabled="thumbsBusy"
                @click="run('thumbnails', { index: i }, 'Обложка перерисовывается')"
              />
              <Button
                label="Другая идея"
                icon="pi pi-lightbulb"
                text
                size="small"
                severity="secondary"
                :disabled="thumbsBusy"
                @click="run('thumbnail_ideas', { index: i, draw: true }, 'Новая идея создаётся')"
              />
              <Button
                icon="pi pi-copy"
                text
                size="small"
                severity="secondary"
                aria-label="Скопировать промпт"
                v-tooltip.top="'Скопировать промпт'"
                @click="copy(c.prompt, 'Промпт')"
              />
            </div>
          </article>
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
