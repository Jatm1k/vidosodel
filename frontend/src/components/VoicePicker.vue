<script setup lang="ts">
/**
 * Browse Lumean voice catalogues (ElevenLabs library / LumVoice), listen to
 * previews and create a TTS template with the chosen voice.
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Slider from 'primevue/slider'
import Button from 'primevue/button'
import { api } from '@/api/client'
import type { Voice } from '@/api/types'
import { useNotify } from '@/composables/useNotify'
import { useAppStore } from '@/stores/app'
import FormField from './FormField.vue'

const visible = defineModel<boolean>('visible', { required: true })
const props = defineProps<{ language?: string }>()
const emit = defineEmits<{ created: [template: { id: string; name: string }] }>()

const store = useAppStore()
const notify = useNotify()

const source = ref<'elevenlabs' | 'lumean'>('elevenlabs')
const search = ref('')
const gender = ref<string | null>(null)
const language = ref<string | null>(props.language ?? null)
const voices = ref<Voice[]>([])
const page = ref(0)
const hasMore = ref(false)
const loading = ref(false)
const selected = ref<Voice | null>(null)
const playing = ref<string | null>(null)
const audio = new Audio()
audio.onended = () => (playing.value = null)

const form = ref({ name: '', model_id: 'eleven_multilingual_v2', stability: 0.5, similarity_boost: 0.75, style: 0, speed: 1 })
const creating = ref(false)

const models = [
  { id: 'eleven_multilingual_v2', name: 'Multilingual v2 — стабильный, лучший для длинных текстов' },
  { id: 'eleven_v3', name: 'v3 — самый выразительный, больше языков' },
  { id: 'eleven_turbo_v2_5', name: 'Turbo v2.5 — быстрый и дешевле' },
  { id: 'eleven_flash_v2_5', name: 'Flash v2.5 — самый быстрый' },
]
const languageOptions = computed(() => [{ code: null, name: 'Любой язык' }, ...(store.meta?.languages ?? [])])

async function load(reset = true) {
  loading.value = true
  if (reset) page.value = 0
  try {
    const params = new URLSearchParams({
      source: source.value, search: search.value, language: language.value ?? '', gender: gender.value ?? '',
      page: String(page.value),
    })
    const data = await api.get<{ voices: Voice[]; has_more: boolean }>(`/api/lumean/voices?${params}`)
    voices.value = reset ? data.voices : [...voices.value, ...data.voices]
    hasMore.value = data.has_more
  } catch (e) {
    notify.error(e, 'Каталог голосов недоступен')
  } finally {
    loading.value = false
  }
}

function more() {
  page.value += 1
  void load(false)
}

function toggle(v: Voice) {
  if (!v.preview_url) return
  if (playing.value === v.voice_id) {
    audio.pause()
    playing.value = null
    return
  }
  audio.src = v.preview_url
  void audio.play()
  playing.value = v.voice_id
}

function choose(v: Voice) {
  selected.value = v
  const lang = language.value ? ` ${language.value.toUpperCase()}` : ''
  form.value.name = `${v.name}${lang}`
}

async function create() {
  if (!selected.value) return
  creating.value = true
  try {
    const t = await api.post<{ id: string; name: string }>('/api/lumean/templates', {
      ...form.value, voice_id: selected.value.voice_id, language_code: language.value || null,
    })
    notify.ok('Голос добавлен в Lumean', t.name)
    emit('created', t)
    visible.value = false
  } catch (e) {
    notify.error(e)
  } finally {
    creating.value = false
  }
}

let searchTimer: number | undefined
watch([search], () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => load(), 400)
})
watch([source, gender, language], () => load())
watch(visible, (v) => {
  if (v && !voices.value.length) void load()
  if (!v) audio.pause()
})
onUnmounted(() => audio.pause())
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Подбор голоса" :style="{ width: 'min(1100px, 96vw)' }" :content-style="{ padding: 0 }">
    <div class="grid h-[70vh] grid-cols-[minmax(0,1fr)_340px]">
      <div class="flex min-h-0 flex-col border-r border-line-soft">
        <div class="flex flex-wrap items-center gap-2 border-b border-line-soft px-5 py-3">
          <SelectButton
            v-model="source"
            :options="[{ v: 'elevenlabs', l: 'ElevenLabs' }, { v: 'lumean', l: 'Lumean' }]"
            option-value="v"
            option-label="l"
            :allow-empty="false"
            size="small"
          />
          <InputText v-model="search" placeholder="Поиск: тембр, стиль, имя" size="small" class="min-w-48 flex-1" />
          <Select v-model="language" :options="languageOptions" option-value="code" option-label="name" size="small" class="w-40" />
          <Select
            v-model="gender"
            :options="[{ v: null, l: 'Любой пол' }, { v: 'male', l: 'Мужской' }, { v: 'female', l: 'Женский' }]"
            option-value="v"
            option-label="l"
            size="small"
            class="w-36"
          />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <button
            v-for="v in voices"
            :key="v.voice_id"
            class="flex w-full items-center gap-3 border-b border-line-soft px-5 py-3 text-left transition-colors hover:bg-raised"
            :class="selected?.voice_id === v.voice_id ? 'bg-raised' : ''"
            @click="choose(v)"
          >
            <span
              role="button"
              :aria-label="playing === v.voice_id ? 'Остановить' : 'Прослушать'"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors"
              :class="[
                playing === v.voice_id ? 'border-tally bg-tally text-tally-ink' : 'border-line text-ink-2 hover:border-ink-3',
                v.preview_url ? '' : 'opacity-30',
              ]"
              @click.stop="toggle(v)"
            >
              <i :class="['pi', playing === v.voice_id ? 'pi-pause' : 'pi-play']" class="text-xs" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium">{{ v.name }}</span>
              <span class="block truncate text-[13px] text-ink-3">
                {{ [v.gender === 'male' ? 'мужской' : v.gender === 'female' ? 'женский' : '', v.age, v.accent, v.use_case, v.language]
                  .filter(Boolean).join(', ') || v.description }}
              </span>
            </span>
            <i v-if="selected?.voice_id === v.voice_id" class="pi pi-check text-tally" />
          </button>
          <div class="p-4 text-center">
            <Button v-if="hasMore" label="Показать ещё" text severity="secondary" :loading="loading" @click="more" />
            <span v-else-if="loading" class="text-ink-3">Загрузка…</span>
            <span v-else-if="!voices.length" class="text-ink-3">Ничего не найдено. Измените фильтры.</span>
          </div>
        </div>
      </div>

      <div class="flex min-h-0 flex-col overflow-y-auto p-5">
        <template v-if="selected">
          <div class="font-display text-lg">{{ selected.name }}</div>
          <p v-if="selected.description" class="mt-1 line-clamp-4 text-[13px] text-ink-3">{{ selected.description }}</p>
          <div class="mt-5 flex flex-col gap-4">
            <FormField label="Название шаблона" stacked>
              <InputText v-model="form.name" class="w-full" />
            </FormField>
            <FormField label="Модель" stacked>
              <Select v-model="form.model_id" :options="models" option-value="id" option-label="name" class="w-full" />
            </FormField>
            <FormField label="Стабильность" :value="form.stability.toFixed(2)" hint="Выше — ровнее, ниже — эмоциональнее" stacked>
              <Slider v-model="form.stability" :min="0" :max="1" :step="0.05" />
            </FormField>
            <FormField label="Похожесть на оригинал" :value="form.similarity_boost.toFixed(2)" stacked>
              <Slider v-model="form.similarity_boost" :min="0" :max="1" :step="0.05" />
            </FormField>
            <FormField label="Выразительность" :value="form.style.toFixed(2)" stacked>
              <Slider v-model="form.style" :min="0" :max="1" :step="0.05" />
            </FormField>
            <FormField label="Скорость речи" :value="form.speed.toFixed(2)" stacked>
              <Slider v-model="form.speed" :min="0.7" :max="1.2" :step="0.01" />
            </FormField>
          </div>
          <Button class="mt-6" label="Создать голос" :loading="creating" :disabled="!form.name.trim()" @click="create" />
        </template>
        <div v-else class="m-auto max-w-60 text-center text-ink-3">
          Прослушайте голоса слева и выберите подходящий. Мы создадим в Lumean шаблон с этим голосом.
        </div>
      </div>
    </div>
  </Dialog>
</template>
