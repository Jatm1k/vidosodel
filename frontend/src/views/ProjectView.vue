<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { PipelineSettings, ProjectDetail, TrackSummary } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'
import { diffSettings } from '@/composables/useTrackActions'
import StageRail, { type StageId } from '@/components/StageRail.vue'
import SettingsForm from '@/components/SettingsForm.vue'
import LangBadge from '@/components/LangBadge.vue'
import ScriptPanel from '@/components/panels/ScriptPanel.vue'
import VoicePanel from '@/components/panels/VoicePanel.vue'
import StoryboardPanel from '@/components/panels/StoryboardPanel.vue'
import VideoPanel from '@/components/panels/VideoPanel.vue'
import PublishPanel from '@/components/panels/PublishPanel.vue'

const props = defineProps<{ id: number }>()
const router = useRouter()
const store = useAppStore()
const notify = useNotify()
const confirm = useConfirm()

const project = ref<ProjectDetail | null>(null)
const track = ref<TrackSummary | null>(null)
const trackId = ref<number | null>(null)
const stage = ref<StageId>('script')
const editingName = ref(false)
const moreMenu = ref()

// ------------------------------------------------------------------ loading
async function loadProject() {
  project.value = await api.get<ProjectDetail>(`/api/projects/${props.id}`)
  if (!trackId.value || !project.value.tracks.some((t) => t.id === trackId.value)) {
    trackId.value = project.value.master_track_id ?? project.value.tracks[0]?.id ?? null
  }
}
async function loadTrack() {
  if (!trackId.value) return
  track.value = await api.get<TrackSummary>(`/api/tracks/${trackId.value}`)
}
async function reload() {
  await loadProject()
  await loadTrack()
}

/** Open the first stage that still needs work. */
function pickStage(t: TrackSummary): StageId {
  if (t.stages.script !== 'done') return 'script'
  if (t.stages.voice !== 'done' && t.timings_origin !== 'srt') return 'voice'
  if (t.stages.images !== 'done') return 'storyboard'
  if (t.stages.video !== 'done') return 'video'
  return 'publish'
}

watch(trackId, async (id, old) => {
  if (!id) return
  await loadTrack()
  // First open: jump to the first unfinished stage. Switching languages keeps the current stage.
  if (old == null && track.value) stage.value = pickStage(track.value)
})

let off: (() => void) | undefined
let timer: number | undefined
onMounted(async () => {
  try {
    await loadProject()
  } catch (e) {
    notify.error(e)
    router.push('/')
    return
  }
  const trackIds = () => new Set(project.value?.tracks.map((t) => t.id))
  off = store.onEvent((e) => {
    const relevant =
      (e.type === 'track' && trackIds().has(e.track_id)) ||
      (e.type === 'job' && (e.job.project_id === props.id || trackIds().has(e.job.track_id ?? -1)) &&
        e.job.status !== 'running')
    if (relevant) {
      window.clearTimeout(timer)
      timer = window.setTimeout(reload, 400)
    }
  })
})
onUnmounted(() => off?.())

// ------------------------------------------------------------------ project actions
async function rename(name: string) {
  editingName.value = false
  if (!project.value || !name.trim() || name === project.value.name) return
  await api.patch(`/api/projects/${props.id}`, { name })
  await loadProject()
}

const moreItems = [
  { label: 'Настройки проекта', icon: 'pi pi-sliders-h', command: () => openSettings() },
  { label: 'Добавить язык', icon: 'pi pi-language', command: () => (showAddLang.value = true) },
  { separator: true },
  {
    label: 'Удалить проект', icon: 'pi pi-trash',
    command: () =>
      confirm.require({
        header: 'Удалить проект?',
        message: 'Удалятся все языковые версии, озвучка, картинки и видео проекта.',
        acceptLabel: 'Удалить', rejectLabel: 'Отмена',
        acceptProps: { severity: 'danger' }, rejectProps: { severity: 'secondary', text: true },
        accept: async () => {
          const channelId = project.value?.channel_id
          await api.del(`/api/projects/${props.id}`)
          await store.loadChannels()
          router.push(channelId ? `/channels/${channelId}` : '/')
        },
      }),
  },
]

// ------------------------------------------------------------------ run pipeline
const showRun = ref(false)
const STEPS = [
  { id: 'translate', label: 'Перевод сценария', hint: 'для языков без текста' },
  { id: 'voice', label: 'Озвучка' },
  { id: 'scenes', label: 'Разбивка на сцены' },
  { id: 'characters', label: 'Персонажи', hint: 'если включены референсы' },
  { id: 'prompts', label: 'Промпты' },
  { id: 'images', label: 'Картинки' },
  { id: 'render', label: 'Видео' },
  { id: 'metadata', label: 'Название, описание, теги' },
  { id: 'thumbnails', label: 'Обложки' },
]
const PUBLISH_STEPS = ['metadata', 'thumbnails']
const publishEnabled = computed(() => project.value?.effective_settings.publish.enabled ?? true)
const runSteps = ref<string[]>(STEPS.map((s) => s.id))
const runTracks = ref<number[]>([])
const runForce = ref(false)
const runAllowMissing = ref(false)
const running = ref(false)

function openRun() {
  runTracks.value = project.value?.tracks.map((t) => t.id) ?? []
  runSteps.value = STEPS.map((s) => s.id).filter((id) => publishEnabled.value || !PUBLISH_STEPS.includes(id))
  showRun.value = true
}

/** Work in progress anywhere in the project: the header shows it instead of the run button. */
const projectJobs = computed(() => store.activeJobs.filter((j) => j.project_id === props.id))
const currentJob = computed(() => projectJobs.value.find((j) => j.status === 'running') ?? projectJobs.value[0])
const stopping = ref(false)
function stopAll() {
  confirm.require({
    header: 'Остановить работу над проектом?',
    message: 'Текущие и запланированные задачи будут отменены. Всё, что уже готово, сохранится — продолжить можно в любой момент.',
    acceptLabel: 'Остановить', rejectLabel: 'Продолжить работу',
    acceptProps: { severity: 'danger' }, rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      stopping.value = true
      try {
        await api.post(`/api/projects/${props.id}/cancel`)
        await store.loadActiveJobs()
      } catch (e) {
        notify.error(e)
      } finally {
        stopping.value = false
      }
    },
  })
}
async function startRun() {
  running.value = true
  try {
    const r = await api.post<{ message: string }>(`/api/projects/${props.id}/run`, {
      steps: runSteps.value, track_ids: runTracks.value, force: runForce.value,
      options: { allow_missing: runAllowMissing.value },
    })
    notify.info(r.message)
    showRun.value = false
    void store.loadActiveJobs()
    void reload()
  } catch (e) {
    notify.error(e)
  } finally {
    running.value = false
  }
}

// ------------------------------------------------------------------ languages
const showAddLang = ref(false)
const addLang = ref<string | null>(null)
const addTranslate = ref(true)
const freeLangs = computed(() =>
  (store.meta?.languages ?? []).filter((l) => !project.value?.tracks.some((t) => t.language === l.code))
    .map((l) => ({ ...l, label: l.name })),
)
async function addTrack() {
  if (!addLang.value) return
  try {
    const t = await api.post<TrackSummary>(`/api/projects/${props.id}/tracks`, { language: addLang.value, translate: addTranslate.value })
    showAddLang.value = false
    addLang.value = null
    await loadProject()
    trackId.value = t.id
  } catch (e) {
    notify.error(e)
  }
}
function trackMenu(t: TrackSummary) {
  return [
    ...(t.is_master ? [] : [{
      label: 'Сделать основным', icon: 'pi pi-star',
      command: async () => {
        await api.patch(`/api/projects/${props.id}`, { master_track_id: t.id })
        await reload()
      },
    }]),
    {
      label: 'Удалить язык', icon: 'pi pi-trash', disabled: (project.value?.tracks.length ?? 0) < 2,
      command: () =>
        confirm.require({
          header: `Удалить версию «${t.language_name}»?`,
          message: 'Удалятся её сценарий, озвучка, сцены и видео.',
          acceptLabel: 'Удалить', rejectLabel: 'Отмена',
          acceptProps: { severity: 'danger' }, rejectProps: { severity: 'secondary', text: true },
          accept: async () => {
            await api.del(`/api/tracks/${t.id}`)
            trackId.value = null
            await reload()
          },
        }),
    },
  ]
}
const trackMenuRef = ref()
const trackMenuItems = ref<any[]>([])
function openTrackMenu(e: Event, t: TrackSummary) {
  trackMenuItems.value = trackMenu(t)
  trackMenuRef.value.toggle(e)
}

// ------------------------------------------------------------------ project settings
const showSettings = ref(false)
const projSettings = ref<PipelineSettings | null>(null)
const channelSettings = ref<PipelineSettings | null>(null)
const imageMode = ref<'shared' | 'per_language'>('shared')
async function openSettings() {
  if (!project.value) return
  const ch = await api.get<{ effective_settings: PipelineSettings }>(`/api/channels/${project.value.channel_id}`)
  channelSettings.value = ch.effective_settings
  projSettings.value = JSON.parse(JSON.stringify(project.value.effective_settings)) as PipelineSettings
  imageMode.value = project.value.image_mode
  showSettings.value = true
}
async function saveSettings() {
  if (!projSettings.value || !channelSettings.value) return
  const overrides = (diffSettings(projSettings.value, channelSettings.value) ?? {}) as Partial<PipelineSettings>
  const body: Record<string, unknown> = { settings: overrides }
  if (imageMode.value !== project.value?.image_mode) body.image_mode = imageMode.value
  try {
    await api.patch(`/api/projects/${props.id}`, body)
    showSettings.value = false
    notify.ok('Настройки проекта сохранены', Object.keys(overrides).length ? 'Отличия от канала применятся только к этому проекту' : undefined)
    await reload()
  } catch (e) {
    notify.error(e)
  }
}
async function resetSettings() {
  await api.patch(`/api/projects/${props.id}`, { settings: {} })
  showSettings.value = false
  await reload()
  notify.ok('Проект снова использует настройки канала')
}

const hasOverrides = computed(() => !!project.value && Object.keys(project.value.settings ?? {}).length > 0)
</script>

<template>
  <div v-if="project" class="mx-auto max-w-[1400px] px-8 pb-16 pt-6">
    <!-- header -->
    <RouterLink :to="`/channels/${project.channel.id}`" class="inline-flex items-center gap-2 text-[13px] text-ink-3 hover:text-ink">
      <span class="h-2 w-2 rounded-sm" :style="{ background: project.channel.color }" />{{ project.channel.name }}
    </RouterLink>
    <header class="mt-1 flex items-start gap-4">
      <div class="min-w-0 flex-1">
        <InputText
          v-if="editingName"
          :model-value="project.name"
          autofocus
          class="w-full font-display !text-2xl"
          @blur="(e: any) => rename(e.target.value)"
          @keydown.enter="(e: any) => e.target.blur()"
          @keydown.esc="editingName = false"
        />
        <h1 v-else class="cursor-text truncate font-display text-2xl font-semibold" title="Нажмите, чтобы переименовать" @click="editingName = true">
          {{ project.name }}
        </h1>
      </div>
      <Button
        v-if="hasOverrides"
        label="Свои настройки"
        icon="pi pi-sliders-h"
        severity="secondary"
        text
        size="small"
        v-tooltip.bottom="'У проекта есть настройки, отличные от канала'"
        @click="openSettings"
      />
      <div v-if="projectJobs.length" class="flex items-center gap-3 rounded-md border border-line-soft bg-panel py-1 pl-3 pr-1">
        <span class="tally-live h-2 w-2 shrink-0 rounded-full bg-tally" />
        <span class="max-w-[22rem] truncate text-[13px] text-ink-2" :title="currentJob?.message || undefined">
          {{ currentJob?.status === 'running' ? currentJob.title : 'В очереди' }}
          <span v-if="projectJobs.length > 1" class="tnum text-ink-3"> · ещё {{ projectJobs.length - 1 }}</span>
        </span>
        <Button label="Остановить" icon="pi pi-stop" severity="secondary" text size="small" :loading="stopping" @click="stopAll" />
      </div>
      <Button v-else label="Запустить конвейер" icon="pi pi-play" @click="openRun" />
      <Button icon="pi pi-ellipsis-h" severity="secondary" text aria-label="Действия с проектом" @click="(e) => moreMenu.toggle(e)" />
      <Menu ref="moreMenu" :model="moreItems" popup />
    </header>

    <!-- language tabs -->
    <div class="mt-5 flex items-end gap-1 border-b border-line-soft">
      <div
        v-for="t in project.tracks"
        :key="t.id"
        class="group -mb-px flex items-center border-b-2 transition-colors"
        :class="trackId === t.id ? 'border-tally' : 'border-transparent'"
      >
        <button
          class="flex items-center gap-2 py-2.5 pl-4 pr-1"
          :class="trackId === t.id ? 'text-ink' : 'text-ink-3 hover:text-ink-2'"
          @click="trackId = t.id"
        >
          <LangBadge :code="t.language" />
          <span>{{ t.language_name }}</span>
          <span v-if="t.is_master && project.tracks.length > 1" class="text-[11px] text-ink-3">основной</span>
          <span v-if="t.active_jobs.length" class="tally-live h-1.5 w-1.5 rounded-full bg-tally" />
          <i v-else-if="t.stages.video === 'done'" class="pi pi-check text-[11px] text-ok" />
        </button>
        <button
          class="mr-2 flex h-6 w-6 items-center justify-center rounded text-ink-3 opacity-0 hover:bg-raised hover:text-ink group-hover:opacity-100 focus:opacity-100"
          :aria-label="`Действия с версией ${t.language_name}`"
          @click="openTrackMenu($event, t)"
        >
          <i class="pi pi-ellipsis-v text-[11px]" />
        </button>
      </div>
      <button class="mb-1 ml-1 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-ink-3 hover:bg-raised hover:text-ink" @click="showAddLang = true">
        <i class="pi pi-plus text-[11px]" />Язык
      </button>
      <Menu ref="trackMenuRef" :model="trackMenuItems" popup />
    </div>

    <template v-if="track">
      <StageRail v-model="stage" :track="track" :publish-enabled="publishEnabled" class="mt-5" />
      <div class="mt-6">
        <ScriptPanel v-if="stage === 'script'" :key="`s${track.id}`" :track="track" :project="project" @changed="reload" />
        <VoicePanel v-else-if="stage === 'voice'" :key="`v${track.id}`" :track="track" :project="project" @changed="reload" />
        <StoryboardPanel v-else-if="stage === 'storyboard'" :key="`b${track.id}`" :track="track" :project="project" @changed="reload" />
        <VideoPanel v-else-if="stage === 'video'" :key="`r${track.id}`" :track="track" :project="project" @open-settings="openSettings" />
        <PublishPanel v-else :key="`p${track.id}`" :track="track" :project="project" />
      </div>
    </template>

    <!-- run dialog -->
    <Dialog v-model:visible="showRun" modal header="Запустить конвейер" :style="{ width: 'min(560px, 96vw)' }">
      <p class="text-ink-3">Уже готовые шаги пропускаются — конвейер продолжит с того места, где остановился.</p>
      <div class="mt-5 grid grid-cols-2 gap-6">
        <div>
          <div class="mb-2 text-ink-2">Шаги</div>
          <label v-for="s in STEPS" :key="s.id" class="flex items-center gap-2.5 py-1">
            <Checkbox v-model="runSteps" :value="s.id" />
            <span>{{ s.label }}</span>
            <span v-if="!publishEnabled && PUBLISH_STEPS.includes(s.id)" class="text-[12px] text-ink-3">выкл. в настройках</span>
          </label>
        </div>
        <div>
          <div class="mb-2 text-ink-2">Языки</div>
          <label v-for="t in project.tracks" :key="t.id" class="flex items-center gap-2.5 py-1">
            <Checkbox v-model="runTracks" :value="t.id" />
            <LangBadge :code="t.language" /><span>{{ t.language_name }}</span>
          </label>
          <div class="mt-5 flex flex-col gap-2 text-[13px]">
            <label class="flex items-start gap-2.5">
              <Checkbox v-model="runForce" binary class="mt-0.5" />
              <span>Переделать выбранные шаги, даже если они готовы</span>
            </label>
            <label class="flex items-start gap-2.5">
              <Checkbox v-model="runAllowMissing" binary class="mt-0.5" />
              <span>Собирать видео, даже если часть картинок не получилась</span>
            </label>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <Button label="Отмена" severity="secondary" text @click="showRun = false" />
        <Button label="Запустить" icon="pi pi-play" :loading="running" :disabled="!runSteps.length || !runTracks.length" @click="startRun" />
      </div>
    </Dialog>

    <!-- add language -->
    <Dialog v-model:visible="showAddLang" modal header="Новая языковая версия" :style="{ width: '26rem' }">
      <div class="flex flex-col gap-4">
        <Select v-model="addLang" :options="freeLangs" option-value="code" option-label="label" filter placeholder="Выберите язык" />
        <label class="flex items-center gap-2.5">
          <Checkbox v-model="addTranslate" binary />Перевести сценарий основного языка
        </label>
        <div class="flex justify-end gap-2">
          <Button label="Отмена" severity="secondary" text @click="showAddLang = false" />
          <Button label="Добавить язык" :disabled="!addLang" @click="addTrack" />
        </div>
      </div>
    </Dialog>

    <!-- project settings -->
    <Drawer v-model:visible="showSettings" position="right" header="Настройки проекта" class="!w-[min(1100px,96vw)]">
      <template v-if="projSettings">
        <p class="mb-5 text-ink-3">
          По умолчанию проект использует настройки канала «{{ project.channel.name }}». Сохраняются только отличия.
        </p>
        <div v-if="project.tracks.length > 1" class="mb-6 flex items-center gap-4">
          <span class="text-ink-2">Картинки для языков</span>
          <SelectButton
            v-model="imageMode"
            :options="[{ v: 'shared', l: 'Одни на все языки' }, { v: 'per_language', l: 'Свои для каждого' }]"
            option-value="v"
            option-label="l"
            :allow-empty="false"
            size="small"
          />
        </div>
        <SettingsForm v-model="projSettings" mode="project" />
        <div class="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-line-soft bg-panel px-5 py-3">
          <Button v-if="hasOverrides" label="Вернуть настройки канала" severity="secondary" text @click="resetSettings" />
          <Button label="Сохранить" @click="saveSettings" />
        </div>
      </template>
    </Drawer>
  </div>
</template>
