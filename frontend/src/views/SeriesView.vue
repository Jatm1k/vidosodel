<script setup lang="ts">
/**
 * One series: episodes, cast and places with references and voices, the world/bible and sound options.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { EpisodeSummary, SeriesDetail, SeriesOptions } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'
import { duration as formatDuration } from '@/composables/useFormat'
import SeriesRefCard from '@/components/SeriesRefCard.vue'

const props = defineProps<{ id: number }>()
const route = useRoute()
const router = useRouter()
const store = useAppStore()
const notify = useNotify()
const confirm = useConfirm()

const series = ref<SeriesDetail | null>(null)
type Tab = 'episodes' | 'characters' | 'locations' | 'world' | 'sound'
const TABS: Tab[] = ['episodes', 'characters', 'locations', 'world', 'sound']
const tab = computed<Tab>({
  get: () => (TABS.includes(route.query.tab as Tab) ? (route.query.tab as Tab) : 'episodes'),
  set: (v) => router.replace({ query: v === 'episodes' ? {} : { tab: v } }),
})

const world = ref({ name: '', logline: '', setting: '', bible: '', visual_style: '', language: 'ru' })
const worldSaved = ref('')
const options = ref<SeriesOptions | null>(null)
const optionsSaved = ref('')
const geminiVoices = ref<{ voice: string; gender: string; character: string }[]>([])
const templates = ref<{ id: string; name: string }[]>([])
const showNewEpisode = ref(false)
const newEpisode = ref({ title: '', synopsis: '' })
const newRefName = ref('')
const menu = ref()

const channel = computed(() => store.channels.find((c) => c.id === series.value?.channel_id))
const drawingRefs = computed(() =>
  store.activeJobs.some((j) => j.kind === 'series_refs' && (j.params as any)?.series_id === props.id),
)

function fillForms(s: SeriesDetail) {
  world.value = { name: s.name, logline: s.logline, setting: s.setting, bible: s.bible, visual_style: s.visual_style, language: s.language }
  worldSaved.value = JSON.stringify(world.value)
  options.value = { ...s.options }
  optionsSaved.value = JSON.stringify(options.value)
}

async function load(refillForms = true) {
  const s = await api.get<SeriesDetail>(`/api/series/${props.id}`)
  series.value = s
  if (refillForms) fillForms(s)
}

let timer: number | undefined
let off: (() => void) | undefined
onMounted(async () => {
  await load()
  off = store.onEvent((e) => {
    const mine = (e.type === 'series' && e.series_id === props.id) ||
      (e.type === 'job' && e.job.status !== 'running' && (e.job.params as any)?.series_id === props.id)
    if (mine) {
      window.clearTimeout(timer)
      // Keep unsaved world/sound edits: only lists and cards are refreshed.
      timer = window.setTimeout(() => load(false), 400)
    }
  })
  api.get<typeof geminiVoices.value>('/api/gemini/voices').then((v) => (geminiVoices.value = v)).catch(() => {})
  api.get<typeof templates.value>('/api/lumean/templates').then((t) => (templates.value = t)).catch(() => {})
})
onUnmounted(() => {
  off?.()
  window.clearTimeout(timer)
})

async function saveWorld() {
  try {
    await api.patch(`/api/series/${props.id}`, world.value)
    worldSaved.value = JSON.stringify(world.value)
    await load(false)
    notify.ok('Сохранено')
  } catch (e) {
    notify.error(e)
  }
}

async function saveOptions() {
  try {
    await api.patch(`/api/series/${props.id}`, { options: options.value })
    optionsSaved.value = JSON.stringify(options.value)
    notify.ok('Настройки звука и голоса сохранены')
  } catch (e) {
    notify.error(e)
  }
}

async function addRef(kind: 'characters' | 'locations') {
  if (!newRefName.value.trim()) return
  try {
    await api.post(`/api/series/${props.id}/${kind}`, { name: newRefName.value.trim() })
    newRefName.value = ''
    await load(false)
  } catch (e) {
    notify.error(e)
  }
}

async function drawMissing() {
  try {
    await api.post(`/api/series/${props.id}/refs`, {})
    notify.info('Рисуются недостающие референсы')
    void store.loadActiveJobs()
  } catch (e) {
    notify.error(e)
  }
}

async function createEpisode() {
  try {
    const ep = await api.post<EpisodeSummary>(`/api/series/${props.id}/episodes`, newEpisode.value)
    showNewEpisode.value = false
    newEpisode.value = { title: '', synopsis: '' }
    router.push(`/episodes/${ep.id}`)
  } catch (e) {
    notify.error(e)
  }
}

function episodeStage(e: EpisodeSummary): { label: string; tone: string } {
  if (e.video_url) return { label: 'Видео готово', tone: 'text-ok' }
  if (e.images && e.images === e.scenes) return { label: 'Кадры готовы', tone: 'text-ink-2' }
  if (e.assembled) return { label: `Собрана · кадров ${e.images}/${e.scenes}`, tone: 'text-ink-2' }
  if (e.to_voice) return { label: `Озвучено ${e.voiced}/${e.to_voice}`, tone: 'text-ink-3' }
  return { label: e.blocks ? 'Сценарий' : 'Пустая', tone: 'text-ink-3' }
}

const menuItems = [
  {
    label: 'Удалить сериал', icon: 'pi pi-trash',
    command: () => confirm.require({
      header: 'Удалить сериал?',
      message: 'Удалятся все серии с озвучкой, звуками, картинками и видео, а также персонажи и локации. Это нельзя отменить.',
      acceptLabel: 'Удалить', rejectLabel: 'Отмена',
      acceptProps: { severity: 'danger' }, rejectProps: { severity: 'secondary', text: true },
      accept: async () => {
        await api.del(`/api/series/${props.id}`)
        router.push('/series')
      },
    }),
  },
]
</script>

<template>
  <div v-if="series" class="mx-auto max-w-[1400px] px-8 py-8">
    <RouterLink to="/series" class="text-[13px] text-ink-3 hover:text-ink-2"><i class="pi pi-arrow-left text-[11px]" /> Сериалы</RouterLink>
    <header class="mt-2 flex items-start gap-4">
      <div class="min-w-0 flex-1">
        <h1 class="font-display text-2xl font-semibold">{{ series.name }}</h1>
        <p class="mt-1 text-ink-3">{{ series.logline || 'Без описания' }}</p>
        <div class="mt-2 flex items-center gap-2 text-[13px] text-ink-3">
          <span class="h-2 w-2 rounded-sm" :style="{ background: channel?.color }" />
          <RouterLink v-if="channel" :to="`/channels/${channel.id}?tab=settings`" class="hover:text-ink-2">{{ channel.name }}</RouterLink>
          <span>·</span><span>{{ store.langLabel(series.language) }}</span>
          <span>·</span><span>персонажей {{ series.characters.length }}, локаций {{ series.locations.length }}</span>
        </div>
      </div>
      <Button icon="pi pi-ellipsis-h" text severity="secondary" aria-label="Действия с сериалом" @click="(e) => menu.toggle(e)" />
      <Menu ref="menu" :model="menuItems" popup />
    </header>

    <div class="mt-6 flex items-center gap-1 border-b border-line-soft">
      <button
        v-for="t in ([['episodes', `Серии · ${series.episodes.length}`], ['characters', `Персонажи · ${series.characters.length}`],
                     ['locations', `Локации · ${series.locations.length}`], ['world', 'Мир и библия'], ['sound', 'Голос и звук']] as const)"
        :key="t[0]"
        class="-mb-px border-b-2 px-4 py-2.5 transition-colors"
        :class="tab === t[0] ? 'border-tally text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'"
        @click="tab = t[0]"
      >{{ t[1] }}</button>
      <div class="flex-1" />
      <Button v-if="tab === 'episodes'" label="Новая серия" icon="pi pi-plus" size="small" class="mb-2" @click="showNewEpisode = true" />
      <Button v-if="tab === 'characters' || tab === 'locations'" label="Нарисовать недостающие" icon="pi pi-sparkles" size="small"
              severity="secondary" class="mb-2" :loading="drawingRefs" @click="drawMissing" />
    </div>

    <!-- episodes -->
    <section v-if="tab === 'episodes'" class="mt-6">
      <div v-if="!series.episodes.length" class="rounded-lg border border-dashed border-line p-12 text-center">
        <p class="text-ink-2">Серий пока нет.</p>
        <p class="mt-1 text-ink-3">Серия — это сценарий из блоков: диктор, реплики героев, паузы; плюс музыка и звуки.</p>
      </div>
      <div v-else class="flex flex-col divide-y divide-line-soft rounded-lg border border-line-soft bg-panel">
        <RouterLink v-for="e in series.episodes" :key="e.id" :to="`/episodes/${e.id}`"
                    class="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-raised">
          <span class="tnum w-8 shrink-0 pt-0.5 font-display text-lg text-ink-3">{{ e.number ?? '—' }}</span>
          <div class="min-w-0 flex-1">
            <div class="font-medium text-ink">{{ e.title }}</div>
            <div class="mt-0.5 line-clamp-2 text-[13px] text-ink-3">{{ e.summary || e.synopsis || 'Без синопсиса' }}</div>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1 text-[13px]">
            <span :class="episodeStage(e).tone">{{ episodeStage(e).label }}</span>
            <span v-if="e.duration" class="tnum text-ink-3">{{ formatDuration(e.duration) }}</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- characters / locations -->
    <section v-else-if="tab === 'characters' || tab === 'locations'" class="mt-6">
      <form class="mb-5 flex max-w-md gap-2" @submit.prevent="addRef(tab)">
        <InputText v-model="newRefName" class="flex-1" :placeholder="tab === 'characters' ? 'Имя нового персонажа' : 'Название новой локации'" />
        <Button type="submit" label="Добавить" icon="pi pi-plus" severity="secondary" :disabled="!newRefName.trim()" />
      </form>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        <SeriesRefCard
          v-for="item in tab === 'characters' ? series.characters : series.locations"
          :key="`${tab}-${item.id}`"
          :kind="tab"
          :item="item"
          :series-id="series.id"
          :language="series.language"
          :gemini-voices="geminiVoices"
          :templates="templates"
          :drawing="drawingRefs"
          @changed="load(false)"
        />
      </div>
    </section>

    <!-- world -->
    <section v-else-if="tab === 'world'" class="mt-6 grid max-w-4xl gap-5">
      <label class="flex flex-col gap-1.5">
        <span class="text-ink-2">Название</span>
        <InputText v-model="world.name" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-ink-2">О чём сериал</span>
        <Textarea v-model="world.logline" rows="2" auto-resize />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-ink-2">Мир</span>
        <span class="text-[13px] text-ink-3">Место, эпоха, правила, атмосфера. Уходит в «визуальную библию» каждой серии.</span>
        <Textarea v-model="world.setting" rows="5" auto-resize />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-ink-2">Библия сюжета</span>
        <span class="text-[13px] text-ink-3">Тон, темы, арки героев, правила, которые нельзя нарушать.</span>
        <Textarea v-model="world.bible" rows="8" auto-resize />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-ink-2">Визуальный стиль (по-английски)</span>
        <span class="text-[13px] text-ink-3">Заменяет стиль картинок канала во всех сериях. Пусто — стиль канала.</span>
        <Textarea v-model="world.visual_style" rows="3" auto-resize />
      </label>
      <label class="flex max-w-xs flex-col gap-1.5">
        <span class="text-ink-2">Язык озвучки</span>
        <Select v-model="world.language" :options="store.meta?.languages ?? []" option-label="name" option-value="code" filter />
      </label>
      <div class="flex justify-end">
        <Button label="Сохранить" :disabled="JSON.stringify(world) === worldSaved" @click="saveWorld" />
      </div>
    </section>

    <!-- sound & narrator -->
    <section v-else-if="options" class="mt-6 grid max-w-4xl gap-8">
      <div>
        <h2 class="text-base font-semibold">Диктор</h2>
        <div class="mt-3 grid grid-cols-2 gap-5">
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Голос диктора (шаблон Lumean)</span>
            <Select v-model="options.narrator_template_id" :options="[{ id: '', name: 'Голос канала для языка сериала' }, ...templates]"
                    option-label="name" option-value="id" filter />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Скорость (пусто — как в шаблоне)</span>
            <InputNumber v-model="options.narrator_speed" :min="0.7" :max="1.2" :step="0.05" :min-fraction-digits="2" show-buttons />
          </label>
        </div>
      </div>
      <div>
        <h2 class="text-base font-semibold">Реплики героев</h2>
        <div class="mt-3 grid grid-cols-2 gap-5">
          <label class="col-span-2 flex flex-col gap-1.5">
            <span class="text-ink-2">Общая пометка ко всем репликам Gemini</span>
            <InputText v-model="options.line_style" placeholder="Например: 19th century, theatrical diction" />
          </label>
          <label class="flex items-center justify-between gap-3">
            <span class="text-ink-2">Имя говорящего в субтитрах</span>
            <ToggleSwitch v-model="options.speaker_names_in_subtitles" />
          </label>
        </div>
      </div>
      <div>
        <h2 class="text-base font-semibold">Паузы, с</h2>
        <div class="mt-3 grid grid-cols-4 gap-5">
          <label class="flex flex-col gap-1.5"><span class="text-ink-2">После блока</span>
            <InputNumber v-model="options.gap" :min="0" :max="5" :step="0.05" :min-fraction-digits="2" /></label>
          <label class="flex flex-col gap-1.5"><span class="text-ink-2">Между репликами</span>
            <InputNumber v-model="options.line_gap" :min="0" :max="5" :step="0.05" :min-fraction-digits="2" /></label>
          <label class="flex flex-col gap-1.5"><span class="text-ink-2">В начале</span>
            <InputNumber v-model="options.lead_in" :min="0" :max="10" :step="0.1" :min-fraction-digits="1" /></label>
          <label class="flex flex-col gap-1.5"><span class="text-ink-2">В конце</span>
            <InputNumber v-model="options.tail" :min="0" :max="15" :step="0.1" :min-fraction-digits="1" /></label>
        </div>
      </div>
      <div>
        <h2 class="text-base font-semibold">Громкость слоёв относительно речи, дБ</h2>
        <div class="mt-3 grid grid-cols-4 gap-5">
          <label class="flex flex-col gap-1.5"><span class="text-ink-2">Музыка</span>
            <InputNumber v-model="options.music_volume" :min="-40" :max="6" show-buttons /></label>
          <label class="flex flex-col gap-1.5"><span class="text-ink-2">Эмбиент</span>
            <InputNumber v-model="options.ambience_volume" :min="-40" :max="6" show-buttons /></label>
          <label class="flex flex-col gap-1.5"><span class="text-ink-2">Эффекты</span>
            <InputNumber v-model="options.sfx_volume" :min="-40" :max="6" show-buttons /></label>
          <label class="flex flex-col gap-1.5"><span class="text-ink-2">Музыка под речью −</span>
            <InputNumber v-model="options.duck_db" :min="0" :max="30" show-buttons /></label>
        </div>
        <p class="mt-2 text-[13px] text-ink-3">
          Музыка плавно уходит вниз, когда звучит речь, и возвращается в длинных паузах. Изменения применятся при следующей сборке серии.
        </p>
      </div>
      <div class="flex justify-end">
        <Button label="Сохранить" :disabled="JSON.stringify(options) === optionsSaved" @click="saveOptions" />
      </div>
    </section>

    <Dialog v-model:visible="showNewEpisode" modal header="Новая серия" :style="{ width: '32rem' }">
      <form class="flex flex-col gap-4" @submit.prevent="createEpisode">
        <label class="flex flex-col gap-1.5">
          <span class="text-ink-2">Название</span>
          <InputText v-model="newEpisode.title" autofocus />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-ink-2">Синопсис</span>
          <Textarea v-model="newEpisode.synopsis" rows="4" auto-resize />
        </label>
        <div class="flex justify-end gap-2">
          <Button label="Отмена" severity="secondary" text @click="showNewEpisode = false" />
          <Button type="submit" label="Создать" :disabled="!newEpisode.title.trim()" />
        </div>
      </form>
    </Dialog>
  </div>
</template>
