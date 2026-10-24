<script setup lang="ts">
/**
 * Series overview: every series with its channel, plus how to connect an AI agent.
 * A series is usually driven by an agent over MCP; this page is for looking and fixing by hand.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { api } from '@/api/client'
import type { SeriesDetail, SeriesSummary } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'

const store = useAppStore()
const router = useRouter()
const notify = useNotify()

const list = ref<SeriesSummary[] | null>(null)
const showNew = ref(false)
const form = ref({ name: '', channel_id: null as number | null, language: 'ru', logline: '' })
const busy = ref(false)

const channelName = (id: number) => store.channels.find((c) => c.id === id)?.name ?? '—'
const channelColor = (id: number) => store.channels.find((c) => c.id === id)?.color ?? '#737b8a'
const mcpCommand = computed(() => `claude mcp add --transport http vidosodel ${window.location.origin}/mcp`)

async function load() {
  list.value = await api.get<SeriesSummary[]>('/api/series')
}

let off: (() => void) | undefined
onMounted(() => {
  void load()
  off = store.onEvent((e) => {
    if (e.type === 'series' && (e.what === 'series' || e.what === 'episodes' || e.what === 'refs')) void load()
  })
})
onUnmounted(() => off?.())

function openNew() {
  form.value = { name: '', channel_id: store.channels[0]?.id ?? null, language: 'ru', logline: '' }
  showNew.value = true
}

async function create() {
  if (!form.value.name.trim() || !form.value.channel_id) return
  busy.value = true
  try {
    const s = await api.post<SeriesDetail>('/api/series', form.value)
    showNew.value = false
    router.push(`/series/${s.id}`)
  } catch (e) {
    notify.error(e)
  } finally {
    busy.value = false
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    notify.ok('Команда скопирована')
  } catch {
    notify.info('Скопируйте вручную', text)
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1400px] px-8 py-8">
    <header class="flex items-start gap-4">
      <div class="flex-1">
        <h1 class="font-display text-2xl font-semibold">Сериалы</h1>
        <p class="mt-1 text-ink-3">
          Общий мир, герои с референсами и своими голосами, локации, серии со звуковым дизайном.
        </p>
      </div>
      <Button label="Новый сериал" icon="pi pi-plus" :disabled="!store.channels.length" @click="openNew" />
    </header>

    <div class="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-line-soft bg-panel px-5 py-4">
      <i class="pi pi-sparkles text-tally" />
      <div class="min-w-0 flex-1">
        <div class="text-ink">Сериалы удобно вести ИИ-агентом</div>
        <div class="text-[13px] text-ink-3">
          Подключите Claude Code к приложению — агент сам напишет мир и серии, подберёт голоса и звук, запустит
          генерацию и проверит кадры.
        </div>
      </div>
      <code class="max-w-full truncate rounded bg-raised px-3 py-1.5 font-mono text-[12px] text-ink-2">{{ mcpCommand }}</code>
      <Button icon="pi pi-copy" severity="secondary" text aria-label="Копировать команду" @click="copy(mcpCommand)" />
    </div>

    <section class="mt-6">
      <div v-if="list && !list.length" class="rounded-lg border border-dashed border-line p-12 text-center">
        <p class="text-ink-2">Сериалов пока нет.</p>
        <p class="mt-1 text-ink-3">
          {{ store.channels.length ? 'Создайте сериал вручную или попросите агента.' : 'Сначала создайте канал: серии станут его проектами.' }}
        </p>
      </div>
      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        <RouterLink
          v-for="s in list ?? []"
          :key="s.id"
          :to="`/series/${s.id}`"
          class="group flex flex-col overflow-hidden rounded-lg border border-line-soft bg-panel transition-colors hover:border-line"
        >
          <div class="aspect-video bg-raised">
            <img v-if="s.cover_url" :src="s.cover_url" alt="" class="h-full w-full object-cover" loading="lazy" />
            <div v-else class="flex h-full items-center justify-center text-ink-3"><i class="pi pi-clone text-2xl" /></div>
          </div>
          <div class="flex flex-1 flex-col gap-1 p-4">
            <div class="font-medium text-ink group-hover:text-tally">{{ s.name }}</div>
            <div class="line-clamp-2 text-[13px] text-ink-3">{{ s.logline || 'Без описания' }}</div>
            <div class="mt-auto flex items-center gap-2 pt-2 text-xs text-ink-3">
              <span class="h-2 w-2 rounded-sm" :style="{ background: channelColor(s.channel_id) }" />
              <span class="truncate">{{ channelName(s.channel_id) }}</span>
              <span class="flex-1" />
              <span class="tnum">{{ s.episodes_count }} сер.</span>
              <span class="uppercase">{{ s.language }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

    <Dialog v-model:visible="showNew" modal header="Новый сериал" :style="{ width: '30rem' }">
      <form class="flex flex-col gap-4" @submit.prevent="create">
        <label class="flex flex-col gap-1.5">
          <span class="text-ink-2">Название</span>
          <InputText v-model="form.name" autofocus />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-ink-2">Канал</span>
          <Select v-model="form.channel_id" :options="store.channels" option-label="name" option-value="id" />
          <span class="text-[13px] text-ink-3">Серии берут из канала стиль картинок, рендер и голос диктора.</span>
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-ink-2">Язык</span>
          <Select v-model="form.language" :options="store.meta?.languages ?? []" option-label="name" option-value="code" filter />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-ink-2">О чём сериал</span>
          <Textarea v-model="form.logline" rows="2" auto-resize />
        </label>
        <div class="flex justify-end gap-2">
          <Button label="Отмена" severity="secondary" text @click="showNew = false" />
          <Button type="submit" label="Создать" :loading="busy" :disabled="!form.name.trim() || !form.channel_id" />
        </div>
      </form>
    </Dialog>
  </div>
</template>
