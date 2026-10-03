<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import { api } from '@/api/client'
import type { ProjectDetail, TrackSummary } from '@/api/types'
import { useTrackActions } from '@/composables/useTrackActions'
import { useNotify } from '@/composables/useNotify'
import { useAppStore } from '@/stores/app'
import ActiveJobs from '../ActiveJobs.vue'

const props = defineProps<{ track: TrackSummary; project: ProjectDetail }>()
const emit = defineEmits<{ changed: [] }>()
const notify = useNotify()
const store = useAppStore()
const { run, starting } = useTrackActions(() => props.track.id)

/** Lumean pause markup (shown as a hint; braces would clash with template interpolation). */
const PAUSE_EXAMPLE = '{{pause=1.5}}'

const text = ref(props.track.script ?? '')
const saving = ref(false)
watch(() => props.track.script, (v) => {
  if (!dirty.value) text.value = v ?? ''
})
const dirty = computed(() => text.value !== (props.track.script ?? ''))
const words = computed(() => (text.value.trim() ? text.value.trim().split(/\s+/).length : 0))
const paragraphs = computed(() => text.value.split(/\n\s*\n/).filter((p) => p.trim()).length)
const master = computed(() => props.project.tracks.find((t) => t.is_master))

async function save() {
  saving.value = true
  try {
    await api.patch(`/api/tracks/${props.track.id}`, { script: text.value })
    emit('changed')
    notify.ok('Сценарий сохранён')
  } catch (e) {
    notify.error(e)
  } finally {
    saving.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (dirty.value) void save()
  }
}

function readFile(ev: Event) {
  const f = (ev.target as HTMLInputElement).files?.[0]
  if (f) f.text().then((t) => (text.value = t))
  ;(ev.target as HTMLInputElement).value = ''
}

const estimate = ref<{ chars: number; chunks: number; cost_rub: number; blocked_chunks: number[] } | null>(null)
const estimating = ref(false)
async function doEstimate() {
  if (dirty.value) await save()
  estimating.value = true
  try {
    estimate.value = await api.post(`/api/tracks/${props.track.id}/estimate-voice`)
  } catch (e) {
    notify.error(e)
  } finally {
    estimating.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <ActiveJobs :track="track" :kinds="['translate']" />

    <div class="flex flex-wrap items-center gap-2">
      <Button
        v-if="!track.is_master && master"
        :label="`Перевести с языка «${master.language_name}»`"
        icon="pi pi-language"
        severity="secondary"
        outlined
        size="small"
        :loading="starting === 'translate'"
        @click="run('translate', { source_track_id: master.id }, 'Перевод запущен')"
      />
      <label class="p-button p-button-secondary p-button-outlined p-button-sm cursor-pointer">
        <i class="pi pi-upload mr-2 text-xs" />Загрузить .txt
        <input type="file" accept=".txt,.md,text/plain" class="hidden" @change="readFile" />
      </label>
      <Button label="Оценить стоимость озвучки" icon="pi pi-calculator" severity="secondary" text size="small" :loading="estimating" @click="doEstimate" />
      <div class="flex-1" />
      <span class="tnum text-[13px] text-ink-3">
        {{ words.toLocaleString('ru-RU') }} слов · {{ paragraphs }} абз. · ≈ {{ Math.max(1, Math.round(words / 130)) }} мин
      </span>
      <Button label="Сохранить" size="small" :disabled="!dirty" :loading="saving" @click="save" />
    </div>

    <div v-if="estimate" class="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-line-soft bg-panel px-4 py-2.5 text-[13px]">
      <span>Озвучка обойдётся примерно в <b class="tnum text-ink">{{ estimate.cost_rub }} ₽</b></span>
      <span class="text-ink-3">{{ estimate.chars?.toLocaleString('ru-RU') }} символов, {{ estimate.chunks }} фрагм.</span>
      <span v-if="estimate.blocked_chunks.length" class="text-bad">
        Фрагменты {{ estimate.blocked_chunks.join(', ') }} заблокирует контентная политика — перефразируйте их
      </span>
    </div>

    <div v-if="track.script_origin === 'translated' && !dirty" class="text-[13px] text-ink-3">
      Текст переведён автоматически. Проверьте имена, термины и идиомы перед озвучкой.
    </div>

    <Textarea
      v-model="text"
      class="min-h-[60vh] w-full !text-[15px] !leading-relaxed"
      placeholder="Текст сценария. Абзацы разделяйте пустой строкой — по ним строятся главы и сопоставляются языки."
      @keydown="onKey"
    />
    <p class="text-[13px] text-ink-3">
      Паузы: <code class="text-ink-2" v-text="PAUSE_EXAMPLE" /> — бесплатно. Квадратные скобки
      <code class="text-ink-2">[шёпотом]</code> — подсказки диктору, они не произносятся. Сохранение: Ctrl+S.
      <template v-if="store.languages.get(track.language)"> Язык: {{ store.langLabel(track.language) }}.</template>
    </p>
  </div>
</template>
