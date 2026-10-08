<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import { api } from '@/api/client'
import type { PipelineSettings, ProjectDetail } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'
import { diffSettings } from '@/composables/useTrackActions'
import SettingsForm from './SettingsForm.vue'

const visible = defineModel<boolean>('visible', { required: true })
const props = defineProps<{ channelId: number; defaultLanguages?: string[] }>()

const store = useAppStore()
const router = useRouter()
const notify = useNotify()

const name = ref('')
const script = ref('')
const languages = ref<string[]>(props.defaultLanguages?.length ? props.defaultLanguages : ['ru'])
const master = ref(languages.value[0])
const imageMode = ref<'shared' | 'per_language'>('shared')
const runAll = ref(true)
const busy = ref(false)

// ------------------------------------------------------------ per-project settings
const channelSettings = ref<PipelineSettings | null>(null)
const projSettings = ref<PipelineSettings | null>(null)
const showSettings = ref(false)
const SECTION_NAMES: Record<string, string> = {
  voice: 'озвучка', scenes: 'сцены', images: 'изображения', llm: 'тексты', render: 'видео',
  subtitles: 'субтитры', unique: 'уникализация', publish: 'публикация',
}
const overrides = computed(() =>
  channelSettings.value && projSettings.value
    ? ((diffSettings(projSettings.value, channelSettings.value) ?? {}) as Partial<PipelineSettings>)
    : {},
)
const changedSections = computed(() => Object.keys(overrides.value).map((k) => SECTION_NAMES[k] ?? k))
const publishEnabled = computed(() => projSettings.value?.publish.enabled ?? true)

watch(visible, async (v) => {
  if (!v) return
  try {
    // Fresh channel settings on every open; edits made earlier for this draft are kept.
    const keep = changedSections.value.length > 0
    const ch = await api.get<{ effective_settings: PipelineSettings }>(`/api/channels/${props.channelId}`)
    channelSettings.value = ch.effective_settings
    if (!keep) projSettings.value = JSON.parse(JSON.stringify(ch.effective_settings)) as PipelineSettings
    // A fresh draft starts with the channel's main language.
    const main = ch.effective_settings.voice.master_language
    if (main && !name.value && !script.value) {
      if (!languages.value.includes(main)) languages.value = [main, ...languages.value]
      master.value = main
    }
  } catch (e) {
    notify.error(e)
  }
}, { immediate: true })

function resetSettings() {
  if (channelSettings.value) projSettings.value = JSON.parse(JSON.stringify(channelSettings.value)) as PipelineSettings
}

const langOptions = computed(() => (store.meta?.languages ?? []).map((l) => ({ ...l, label: `${l.name} (${l.code.toUpperCase()})` })))
const masterOptions = computed(() => langOptions.value.filter((l) => languages.value.includes(l.code)))
const words = computed(() => (script.value.trim() ? script.value.trim().split(/\s+/).length : 0))

watch(languages, (v) => {
  if (!v.includes(master.value)) master.value = v[0]
})

function readFile(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!name.value) name.value = file.name.replace(/\.[^.]+$/, '')
  file.text().then((t) => (script.value = t))
}

async function create() {
  busy.value = true
  try {
    const p = await api.post<ProjectDetail>('/api/projects', {
      channel_id: props.channelId, name: name.value, languages: languages.value,
      master_language: master.value, image_mode: imageMode.value, script: script.value,
      settings: overrides.value,
    })
    if (runAll.value && script.value.trim()) {
      // No explicit steps: the server runs everything, honouring "metadata in the pipeline" from the settings.
      await api.post(`/api/projects/${p.id}/run`, {})
      notify.ok('Проект создан', 'Конвейер запущен — следите за ходом на странице проекта')
    }
    visible.value = false
    await store.loadChannels()
    router.push(`/projects/${p.id}`)
  } catch (e) {
    notify.error(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Новый проект" :style="{ width: 'min(760px, 96vw)' }">
    <form class="flex flex-col gap-5" @submit.prevent="create">
      <label class="flex flex-col gap-1.5">
        <span class="text-ink-2">Название</span>
        <InputText v-model="name" autofocus placeholder="Рабочее название видео" />
      </label>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-baseline justify-between">
          <span class="text-ink-2">Сценарий основного языка</span>
          <label class="cursor-pointer text-[13px] text-ink-3 hover:text-ink">
            Загрузить .txt
            <input type="file" accept=".txt,.md,text/plain" class="hidden" @change="readFile" />
          </label>
        </div>
        <Textarea v-model="script" rows="8" class="max-h-[40vh] w-full" placeholder="Вставьте текст. Абзацы разделяйте пустой строкой. Можно оставить пустым и загрузить озвучку или SRT позже." />
        <span class="tnum text-[13px] text-ink-3">
          {{ words }} слов<template v-if="words"> · ≈ {{ Math.round(words / 130) }} мин озвучки</template>
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-ink-2">Языки видео</span>
          <MultiSelect v-model="languages" :options="langOptions" option-value="code" option-label="label" filter display="chip" :show-toggle-all="false" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-ink-2">Основной язык</span>
          <Select v-model="master" :options="masterOptions" option-value="code" option-label="label" />
        </label>
      </div>

      <div v-if="languages.length > 1" class="flex flex-col gap-2">
        <span class="text-ink-2">Картинки для языков</span>
        <SelectButton
          v-model="imageMode"
          :options="[{ v: 'shared', l: 'Одни на все языки' }, { v: 'per_language', l: 'Свои для каждого языка' }]"
          option-value="v"
          option-label="l"
          :allow-empty="false"
        />
        <span class="text-[13px] text-ink-3">
          {{ imageMode === 'shared'
            ? 'Картинки генерируются один раз по основному языку, остальные версии подстраиваются под свою озвучку. Экономит кредиты.'
            : 'Каждая версия получает свою раскадровку. Полезно, если видео должны сильнее отличаться.' }}
          Сценарии остальных языков переведутся автоматически, их можно отредактировать.
        </span>
      </div>

      <div class="flex items-center gap-3 rounded-md border border-line-soft px-4 py-3">
        <i class="pi pi-sliders-h text-ink-3" />
        <div class="min-w-0 flex-1">
          <div>Настройки проекта</div>
          <div class="truncate text-[13px]" :class="changedSections.length ? 'text-tally' : 'text-ink-3'">
            {{ changedSections.length ? `Свои для проекта: ${changedSections.join(', ')}` : 'Как у канала' }}
          </div>
        </div>
        <Button v-if="changedSections.length" label="Как у канала" severity="secondary" text size="small" @click="resetSettings" />
        <Button label="Изменить" severity="secondary" outlined size="small" :disabled="!projSettings" @click="showSettings = true" />
      </div>

      <label v-if="script.trim()" class="flex items-center gap-2.5">
        <Checkbox v-model="runAll" binary />
        <span>Сразу запустить весь конвейер: озвучка, сцены, картинки, видео{{ publishEnabled ? ', метаданные' : '' }}</span>
      </label>

      <div class="flex justify-end gap-2">
        <Button label="Отмена" severity="secondary" text @click="visible = false" />
        <Button type="submit" :label="runAll && script.trim() ? 'Создать и запустить' : 'Создать проект'" :loading="busy" :disabled="!name.trim() || !languages.length" />
      </div>
    </form>
  </Dialog>

  <Drawer v-model:visible="showSettings" position="right" header="Настройки нового проекта" class="!w-[min(1100px,96vw)]">
    <template v-if="projSettings">
      <p class="mb-5 text-ink-3">
        Меняйте только то, что должно отличаться от канала, — сохранятся только отличия. Позже их можно поправить в меню проекта.
      </p>
      <SettingsForm v-model="projSettings" mode="project" />
      <div class="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-line-soft bg-panel px-5 py-3">
        <Button v-if="changedSections.length" label="Вернуть настройки канала" severity="secondary" text @click="resetSettings" />
        <Button label="Готово" @click="showSettings = false" />
      </div>
    </template>
  </Drawer>
</template>
