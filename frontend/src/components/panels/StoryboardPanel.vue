<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { ImagePlan, ProjectDetail, Scene, TrackSummary } from '@/api/types'
import { plural, timecode } from '@/composables/useFormat'
import { useTrackActions } from '@/composables/useTrackActions'
import { useNotify } from '@/composables/useNotify'
import { useAppStore } from '@/stores/app'
import ActiveJobs from '../ActiveJobs.vue'
import CharacterCast from '../CharacterCast.vue'
import SceneRow from '../SceneRow.vue'
import SceneTimeline from '../SceneTimeline.vue'

const props = defineProps<{ track: TrackSummary; project: ProjectDetail }>()
const emit = defineEmits<{ changed: [] }>()
const store = useAppStore()
const notify = useNotify()
const confirm = useConfirm()
const { run, starting } = useTrackActions(() => props.track.id)

const scenes = ref<Scene[]>([])
const loading = ref(true)
const selected = ref<number | null>(null)
const filter = ref<'all' | 'missing' | 'failed'>('all')
const visibleCount = ref(40)
const sentinel = ref<HTMLElement>()
const viewer = ref<Scene | null>(null)
const splitMenu = ref()
const promptMenu = ref()
const imageMenu = ref()
const bibleOpen = ref(false)
const bible = ref(props.project.visual_context)

const shares = computed(() => props.track.shares_images)
/** Character references are on: the cast is shown and scenes list who is in them. */
const cast = computed(() => (props.project.effective_settings.images.character_refs ? props.project.characters : []))
const stats = computed(() => props.track.scene_stats)
const master = computed(() => props.project.tracks.find((t) => t.is_master))
const filtered = computed(() =>
  scenes.value.filter((s) =>
    filter.value === 'missing' ? !s.image_url : filter.value === 'failed' ? s.image_status === 'failed' : true,
  ),
)
const shown = computed(() => filtered.value.slice(0, visibleCount.value))
// Which model makes which scene (quality/cheap mix, budget over all languages) – computed by the server.
const plan = ref<ImagePlan | null>(null)
const trackPlan = computed(() => plan.value?.tracks.find((t) => t.track_id === props.track.id))
const opName = (id: string) => store.meta?.image_operations.find((o) => o.id === id)?.name ?? id
const planModels = computed(() =>
  Object.entries(trackPlan.value?.by_operation ?? {}).map(([op, n]) => `${opName(op)} — ${n}`).join(', '),
)
async function loadPlan() {
  if (shares.value) return
  try {
    plan.value = await api.get<ImagePlan>(`/api/projects/${props.project.id}/image-plan`)
  } catch {
    plan.value = null
  }
}
const missingImages = computed(() => scenes.value.filter((s) => !s.image_url).length)
const missingPrompts = computed(() => scenes.value.filter((s) => !s.prompt.trim()).length)

async function load() {
  scenes.value = await api.get<Scene[]>(`/api/tracks/${props.track.id}/scenes`)
  loading.value = false
  void loadPlan()
}

function patch(scene: Scene) {
  const i = scenes.value.findIndex((s) => s.id === scene.id)
  if (i >= 0) scenes.value[i] = { ...scenes.value[i], ...scene }
}

function select(id: number) {
  selected.value = id
  const idx = filtered.value.findIndex((s) => s.id === id)
  if (idx >= visibleCount.value) visibleCount.value = idx + 20
  void nextTick(() => document.getElementById(`scene-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

// ----------------------------------------------------------------- actions
function split(mode: 'smart' | 'auto') {
  const go = () => run('scenes', { mode }, 'Разбивка на сцены запущена')
  if (scenes.value.length) {
    confirm.require({
      header: 'Разбить заново?',
      message: `Текущие ${scenes.value.length} ${plural(scenes.value.length, ['сцена', 'сцены', 'сцен'])} с промптами и картинками будут удалены.`,
      acceptLabel: 'Разбить заново',
      rejectLabel: 'Отмена',
      acceptProps: { severity: 'danger' },
      rejectProps: { severity: 'secondary', text: true },
      accept: go,
    })
  } else go()
}

const splitItems = [
  { label: 'По смыслу (LLM)', command: () => split('smart') },
  { label: 'По предложениям — быстро', command: () => split('auto') },
]
const promptItems = computed(() => [
  { label: `Создать недостающие (${missingPrompts.value})`, disabled: !missingPrompts.value, command: () => run('prompts', {}, 'Создание промптов запущено') },
  {
    label: 'Пересоздать все, кроме изменённых вручную',
    command: () => run('prompts', { overwrite: true }, 'Промпты пересоздаются'),
  },
])
const imageItems = computed(() => [
  { label: `Сгенерировать недостающие (${missingImages.value})`, disabled: !missingImages.value, command: () => run('images', {}, 'Генерация картинок запущена') },
  {
    label: 'Перегенерировать все',
    command: () =>
      confirm.require({
        header: 'Перегенерировать все картинки?',
        message: `Это ≈ ${trackPlan.value?.credits ?? '?'} кредитов FastGen (${planModels.value}). Готовые картинки будут заменены.`,
        acceptLabel: 'Перегенерировать',
        rejectLabel: 'Отмена',
        rejectProps: { severity: 'secondary', text: true },
        accept: () => run('images', { force: true }, 'Перегенерация запущена'),
      }),
  },
  { separator: true },
  {
    label: 'Убрать водяные знаки с готовых',
    icon: 'pi pi-eraser',
    command: () => run('watermarks', {}, 'Проверка картинок запущена'),
  },
])

async function saveBible() {
  try {
    await api.patch(`/api/projects/${props.project.id}`, { visual_context: bible.value })
    notify.ok('Визуальная библия сохранена', 'Используется при создании следующих промптов')
    emit('changed')
  } catch (e) {
    notify.error(e)
  }
}
async function regenerateBible() {
  await api.post(`/api/projects/${props.project.id}/bible`)
  notify.info('Визуальная библия пересоздаётся')
}

// ------------------------------------------------------------ live updates
let off: (() => void) | undefined
let reloadTimer: number | undefined
let observer: IntersectionObserver | undefined
onMounted(() => {
  void load()
  off = store.onEvent((e) => {
    if (e.type === 'scene' && e.track_id === props.track.id) patch(e.scene)
    else if (e.type === 'scene' && shares.value && e.track_id === master.value?.id) {
      const local = scenes.value.find((s) => s.source_scene_id === e.scene.id)
      if (local) patch({ ...local, image_url: e.scene.image_url, image_status: e.scene.image_status, prompt: e.scene.prompt })
    } else if (e.type === 'track' && e.track_id === props.track.id && ['scenes', 'voice', 'timings', 'images', 'prompts'].includes(e.what)) {
      window.clearTimeout(reloadTimer)
      reloadTimer = window.setTimeout(load, 300)
    }
  })
  observer = new IntersectionObserver((entries) => {
    if (entries.some((en) => en.isIntersecting)) visibleCount.value += 40
  }, { rootMargin: '600px' })
})
watch(sentinel, (el, old) => {
  if (old) observer?.unobserve(old)
  if (el) observer?.observe(el)
})
watch(filter, () => (visibleCount.value = 40))
watch(() => props.project.visual_context, (v) => (bible.value = v))
watch(() => JSON.stringify(props.project.effective_settings.images), () => void loadPlan())
onUnmounted(() => {
  off?.()
  observer?.disconnect()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <ActiveJobs :track="track" :kinds="['scenes', 'characters', 'prompts', 'images', 'watermarks']" />

    <div class="flex flex-wrap items-center gap-2">
      <Button
        label="Разбить на сцены"
        icon="pi pi-th-large"
        :severity="scenes.length ? 'secondary' : undefined"
        :outlined="!!scenes.length"
        size="small"
        :loading="starting === 'scenes'"
        @click="(e) => splitMenu.toggle(e)"
      />
      <Menu ref="splitMenu" :model="splitItems" popup />
      <template v-if="!shares && scenes.length">
        <Button
          label="Промпты"
          icon="pi pi-sparkles"
          :severity="missingPrompts ? undefined : 'secondary'"
          :outlined="!missingPrompts"
          size="small"
          :loading="starting === 'prompts'"
          @click="(e) => promptMenu.toggle(e)"
        />
        <Menu ref="promptMenu" :model="promptItems" popup />
        <Button
          label="Картинки"
          icon="pi pi-images"
          :severity="missingImages && !missingPrompts ? undefined : 'secondary'"
          :outlined="!(missingImages && !missingPrompts)"
          size="small"
          :loading="starting === 'images'"
          @click="(e) => imageMenu.toggle(e)"
        />
        <Menu ref="imageMenu" :model="imageItems" popup />
      </template>
      <div class="flex-1" />
      <template v-if="scenes.length">
        <span class="tnum text-[13px] text-ink-3">
          {{ stats.total }} {{ plural(stats.total, ['сцена', 'сцены', 'сцен']) }}
          <template v-if="!shares"> · промпты {{ stats.prompts }}/{{ stats.total }} · картинки {{ stats.images }}/{{ stats.total }}</template>
          <template v-if="!shares && missingImages && trackPlan"> · нужно ≈ {{ trackPlan.remaining_credits }} кр.</template>
        </span>
        <a :href="`/api/tracks/${track.id}/download/images`" class="p-button p-button-secondary p-button-text p-button-sm" v-tooltip.top="'Скачать все картинки ZIP-архивом'">
          <i class="pi pi-download text-xs" />
        </a>
      </template>
    </div>

    <div
      v-if="!shares && plan && trackPlan?.scenes && Object.keys(trackPlan.by_operation).length > 1"
      class="flex flex-wrap items-baseline gap-x-2 rounded-md border border-line-soft bg-panel px-4 py-2.5 text-[13px] text-ink-2"
    >
      <i class="pi pi-images text-[12px] text-ink-3" />
      <span>Модели: {{ planModels }}</span>
      <span class="tnum text-ink-3">
        · проект целиком ≈ {{ plan.credits }} кр.
        <template v-if="plan.strategy === 'budget'"> из бюджета {{ plan.budget }}</template>
        <template v-if="plan.remaining_credits"> · осталось ≈ {{ plan.remaining_credits }} кр., {{ plan.hours && plan.hours > 1 ? `≈ ${plan.hours.toFixed(1)} ч лимита` : 'в пределах часа' }}</template>
      </span>
      <span v-if="plan.warning" class="basis-full text-tally">{{ plan.warning }}</span>
    </div>

    <div v-if="shares" class="rounded-md border border-line-soft bg-panel px-4 py-3 text-[13px] text-ink-2">
      Картинки берутся из основного языка ({{ master?.language_name }}), а границы сцен подстроены под эту озвучку.
      Можно заменить картинку в отдельной сцене своей.
    </div>

    <section v-if="!shares" class="rounded-lg border border-line-soft">
      <button class="flex w-full items-center gap-3 px-4 py-3 text-left" :aria-expanded="bibleOpen" @click="bibleOpen = !bibleOpen">
        <i :class="['pi', bibleOpen ? 'pi-chevron-down' : 'pi-chevron-right']" class="text-xs text-ink-3" />
        <span class="font-medium">Визуальная библия</span>
        <span class="truncate text-[13px] text-ink-3">
          {{ project.visual_context ? 'Персонажи, места и палитра — одинаковые во всех промптах' : 'Создаётся автоматически вместе с первыми промптами' }}
        </span>
      </button>
      <div v-if="bibleOpen" class="flex flex-col gap-3 border-t border-line-soft p-4">
        <Textarea v-model="bible" auto-resize rows="6" class="w-full !text-[13px]" placeholder="Опишите героев, места и стиль — или создайте автоматически." />
        <div class="flex gap-2">
          <Button label="Сохранить" size="small" :disabled="bible === project.visual_context" @click="saveBible" />
          <Button label="Создать заново по сценарию" size="small" severity="secondary" text @click="regenerateBible" />
        </div>
      </div>
    </section>

    <CharacterCast
      v-if="!shares && project.effective_settings.images.character_refs"
      :project-id="project.id"
      :master-track-id="project.master_track_id"
      :characters="project.characters"
      @changed="emit('changed')"
    />

    <template v-if="scenes.length">
      <SceneTimeline :scenes="scenes" :duration="track.audio_duration ?? scenes.at(-1)?.end ?? 0" :selected="selected" @select="select" />

      <div class="flex items-center justify-between">
        <SelectButton
          v-model="filter"
          :options="[
            { v: 'all', l: 'Все сцены' },
            { v: 'missing', l: `Без картинки · ${missingImages}` },
            { v: 'failed', l: `С ошибкой · ${stats.failed}` },
          ]"
          option-value="v"
          option-label="l"
          :allow-empty="false"
          size="small"
        />
      </div>

      <div class="overflow-hidden rounded-lg border border-line-soft bg-panel">
        <SceneRow
          v-for="(s, i) in shown"
          :key="s.id"
          :scene="s"
          :track-id="track.id"
          :selected="selected === s.id"
          :readonly-prompt="shares"
          :planned-op="plan?.scene_ops[s.id] ?? null"
          :cast="cast"
          :is-last="i === filtered.length - 1"
          @updated="(sc) => { patch(sc); void loadPlan() }"
          @replaced="(list) => (scenes = list)"
          @regenerate-image="(id) => run('images', { scene_ids: [id] })"
          @regenerate-prompt="(id) => run('prompts', { scene_ids: [id] })"
          @open="(sc) => (viewer = sc)"
        />
        <div ref="sentinel" class="h-1" />
        <p v-if="!filtered.length" class="p-8 text-center text-ink-3">Таких сцен нет.</p>
      </div>
    </template>

    <div v-else-if="!loading" class="rounded-lg border border-dashed border-line p-12 text-center">
      <p class="text-ink-2">Сцен пока нет.</p>
      <p class="mx-auto mt-1 max-w-xl text-ink-3">
        <template v-if="shares">Сначала разбейте на сцены основной язык — здесь они подстроятся под эту озвучку.</template>
        <template v-else>
          Нужны тайминги: озвучка, SRT или расчёт по тексту. Без них разбивка возьмёт приблизительные тайминги из сценария.
        </template>
      </p>
    </div>

    <Dialog
      :visible="!!viewer"
      modal
      dismissable-mask
      :header="viewer ? `Сцена ${viewer.idx + 1} · ${timecode(viewer.start)}` : ''"
      :style="{ width: 'min(1280px, 96vw)' }"
      @update:visible="(v) => !v && (viewer = null)"
    >
      <template v-if="viewer">
        <img :src="viewer.image_url ?? ''" alt="" class="w-full rounded-md" />
        <p class="mt-3 text-ink-2">{{ viewer.text }}</p>
        <p class="mt-2 text-[13px] text-ink-3">{{ viewer.prompt }}</p>
      </template>
    </Dialog>
  </div>
</template>
