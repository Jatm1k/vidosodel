<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { ChannelDetail, PipelineSettings, ProjectSummary } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'
import ProjectCard from '@/components/ProjectCard.vue'
import ProjectBoard from '@/components/ProjectBoard.vue'
import SettingsForm from '@/components/SettingsForm.vue'
import NewProjectDialog from '@/components/NewProjectDialog.vue'

const props = defineProps<{ id: number }>()
const route = useRoute()
const router = useRouter()
const store = useAppStore()
const notify = useNotify()
const confirm = useConfirm()

const channel = ref<ChannelDetail | null>(null)
const settings = ref<PipelineSettings | null>(null)
const savedJson = ref('')
const saving = ref(false)
const tab = computed<'projects' | 'settings'>({
  get: () => (route.query.tab === 'settings' ? 'settings' : 'projects'),
  set: (v) => router.replace({ query: v === 'settings' ? { tab: 'settings' } : {} }),
})
const showNew = ref(false)

// Board or grid: a per-viewer convenience, remembered in the browser.
const VIEW_KEY = 'vidosodel.channelView'
function savedView(): 'board' | 'grid' {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'board'
  } catch {
    return 'board'
  }
}
const view = ref<'board' | 'grid'>(savedView())
watch(view, (v) => {
  try {
    localStorage.setItem(VIEW_KEY, v)
  } catch {
    /* storage unavailable – keep the choice for this visit only */
  }
})
const editingName = ref(false)
const menu = ref()
const colors = ['#7aa5e8', '#5fb3a1', '#c58be0', '#e58f5a', '#d9c25b', '#e56a8d', '#62c0d8', '#9aa86a']

const dirty = computed(() => settings.value && JSON.stringify(settings.value) !== savedJson.value)
const defaultLanguages = computed(() => Object.keys(channel.value?.effective_settings.voice.templates ?? {}))

async function load() {
  channel.value = await api.get<ChannelDetail>(`/api/channels/${props.id}`)
  settings.value = JSON.parse(JSON.stringify(channel.value.effective_settings)) as PipelineSettings
  savedJson.value = JSON.stringify(settings.value)
}

/** Refresh only the project list: unsaved channel settings stay untouched. */
async function reloadProjects() {
  if (!channel.value) return
  channel.value.projects = await api.get<ProjectSummary[]>(`/api/projects?channel_id=${props.id}`)
}

let timer: number | undefined
let off: (() => void) | undefined
onMounted(() => {
  const ids = () => new Set(channel.value?.projects.map((p) => p.id))
  off = store.onEvent((e) => {
    // Track events carry no project id: a cheap list reload is fine for them.
    const relevant = e.type === 'track' || (e.type === 'job' && ids().has(e.job.project_id ?? -1) && e.job.status !== 'running')
    if (relevant) {
      window.clearTimeout(timer)
      timer = window.setTimeout(reloadProjects, 500)
    }
  })
})
onUnmounted(() => {
  off?.()
  window.clearTimeout(timer)
})

async function reloadRefs() {
  // Reference uploads are saved immediately on the server: sync them without touching unsaved edits.
  const fresh = await api.get<ChannelDetail>(`/api/channels/${props.id}`)
  const refs = fresh.effective_settings.images.reference_images
  channel.value = fresh
  if (settings.value) settings.value.images.reference_images = refs
  const saved = JSON.parse(savedJson.value) as PipelineSettings
  saved.images.reference_images = refs
  savedJson.value = JSON.stringify(saved)
}

async function save() {
  if (!settings.value) return
  saving.value = true
  try {
    channel.value = await api.patch<ChannelDetail>(`/api/channels/${props.id}`, { settings: settings.value })
    savedJson.value = JSON.stringify(settings.value)
    notify.ok('Настройки канала сохранены', 'Применятся к следующим шагам всех проектов канала')
  } catch (e) {
    notify.error(e)
  } finally {
    saving.value = false
  }
}

async function patch(body: Record<string, unknown>) {
  channel.value = await api.patch<ChannelDetail>(`/api/channels/${props.id}`, body)
  await store.loadChannels()
}

const menuItems = [
  {
    label: 'Дублировать канал', icon: 'pi pi-copy',
    command: async () => {
      const c = await api.post<{ id: number }>(`/api/channels/${props.id}/duplicate`)
      await store.loadChannels()
      router.push(`/channels/${c.id}?tab=settings`)
    },
  },
  {
    label: 'Удалить канал', icon: 'pi pi-trash',
    command: () =>
      confirm.require({
        header: 'Удалить канал?',
        message: 'Вместе с каналом удалятся все его проекты, картинки и видео. Это нельзя отменить.',
        acceptLabel: 'Удалить',
        rejectLabel: 'Отмена',
        acceptProps: { severity: 'danger' },
        rejectProps: { severity: 'secondary', text: true },
        accept: async () => {
          await api.del(`/api/channels/${props.id}`)
          await store.loadChannels()
          router.push('/')
        },
      }),
  },
]

onMounted(load)
</script>

<template>
  <div v-if="channel && settings" class="mx-auto max-w-[1400px] px-8 py-8">
    <header class="flex items-start gap-4">
      <div class="group relative mt-1">
        <span class="block h-9 w-9 rounded-md" :style="{ background: channel.color }" />
        <div class="absolute left-0 top-11 z-10 hidden w-40 flex-wrap gap-1.5 rounded-md border border-line bg-panel p-2 group-focus-within:flex group-hover:flex">
          <button
            v-for="c in colors"
            :key="c"
            class="h-6 w-6 rounded"
            :style="{ background: c }"
            :aria-label="`Цвет ${c}`"
            @click="patch({ color: c })"
          />
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <InputText
          v-if="editingName"
          :model-value="channel.name"
          autofocus
          class="font-display !text-2xl"
          @blur="(e: any) => { editingName = false; patch({ name: e.target.value }) }"
          @keydown.enter="(e: any) => e.target.blur()"
        />
        <h1 v-else class="cursor-text font-display text-2xl font-semibold" title="Нажмите, чтобы переименовать" @click="editingName = true">
          {{ channel.name }}
        </h1>
        <InputText
          :model-value="channel.description"
          placeholder="Короткое описание канала"
          class="mt-1 w-full max-w-xl !border-transparent !bg-transparent !px-0 text-ink-2 hover:!border-line focus:!border-line focus:!px-3"
          @change="(e: any) => patch({ description: e.target.value })"
        />
      </div>
      <Button icon="pi pi-ellipsis-h" text severity="secondary" aria-label="Действия с каналом" @click="(e) => menu.toggle(e)" />
      <Menu ref="menu" :model="menuItems" popup />
    </header>

    <div class="mt-6 flex items-center gap-1 border-b border-line-soft">
      <button
        v-for="t in ([['projects', `Проекты · ${channel.projects.length}`], ['settings', 'Настройки канала']] as const)"
        :key="t[0]"
        class="-mb-px border-b-2 px-4 py-2.5 transition-colors"
        :class="tab === t[0] ? 'border-tally text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'"
        @click="tab = t[0]"
      >{{ t[1] }}</button>
      <div class="flex-1" />
      <div v-if="tab === 'projects' && channel.projects.length" class="mb-2 mr-2 flex rounded-md border border-line-soft p-0.5">
        <button
          v-for="v in ([['board', 'pi-objects-column', 'Доска'], ['grid', 'pi-th-large', 'Сетка']] as const)"
          :key="v[0]"
          class="flex items-center gap-1.5 rounded px-2.5 py-1 text-[13px] transition-colors"
          :class="view === v[0] ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink-2'"
          :aria-pressed="view === v[0]"
          @click="view = v[0]"
        ><i :class="['pi', v[1], 'text-xs']" />{{ v[2] }}</button>
      </div>
      <Button v-if="tab === 'projects'" label="Новый проект" icon="pi pi-plus" size="small" class="mb-2" @click="showNew = true" />
    </div>

    <section v-if="tab === 'projects'" class="mt-6">
      <div v-if="!channel.projects.length" class="rounded-lg border border-dashed border-line p-12 text-center">
        <p class="text-ink-2">В канале пока нет проектов.</p>
        <p class="mt-1 text-ink-3">Проект — это одно видео: вставьте сценарий, и приложение соберёт ролик на всех выбранных языках.</p>
        <Button class="mt-5" label="Создать проект" icon="pi pi-plus" @click="showNew = true" />
      </div>
      <ProjectBoard v-else-if="view === 'board'" :projects="channel.projects" @changed="reloadProjects" />
      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        <ProjectCard v-for="p in channel.projects" :key="p.id" :project="p" />
      </div>
    </section>

    <section v-else class="mt-6">
      <SettingsForm
        v-model="settings"
        mode="channel"
        :channel-id="channel.id"
        :references="channel.reference_urls"
        @references-changed="reloadRefs"
      />
      <div
        class="sticky bottom-0 -mx-8 flex items-center justify-end gap-3 border-t border-line-soft bg-bg/90 px-8 py-3 backdrop-blur transition-opacity"
        :class="dirty ? 'opacity-100' : 'pointer-events-none opacity-0'"
      >
        <span class="text-[13px] text-ink-3">Есть несохранённые изменения</span>
        <Button label="Отменить" severity="secondary" text @click="settings = JSON.parse(savedJson)" />
        <Button label="Сохранить настройки" :loading="saving" @click="save" />
      </div>
    </section>

    <NewProjectDialog v-model:visible="showNew" :channel-id="channel.id" :default-languages="defaultLanguages" />
  </div>
</template>
