<script setup lang="ts">
/**
 * Pipeline settings editor shared by channels and projects.
 * Works on a full PipelineSettings object (v-model); the parent decides what to persist.
 */
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import ColorPicker from 'primevue/colorpicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Slider from 'primevue/slider'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import { api } from '@/api/client'
import type { LumeanTemplate, PipelineSettings } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'
import FormField from './FormField.vue'
import VoicePicker from './VoicePicker.vue'

const s = defineModel<PipelineSettings>({ required: true })
const props = defineProps<{
  mode: 'channel' | 'project'
  channelId?: number
  references?: { path: string; url: string }[]
}>()
const emit = defineEmits<{ referencesChanged: [] }>()

const store = useAppStore()
const notify = useNotify()

const sections = [
  { id: 'voice', label: 'Озвучка', icon: 'pi-microphone' },
  { id: 'scenes', label: 'Сцены', icon: 'pi-th-large' },
  { id: 'images', label: 'Изображения', icon: 'pi-image' },
  { id: 'llm', label: 'Тексты и промпты', icon: 'pi-sparkles' },
  { id: 'render', label: 'Анимация и видео', icon: 'pi-video' },
  { id: 'atmosphere', label: 'Атмосфера', icon: 'pi-sun' },
  { id: 'subtitles', label: 'Субтитры', icon: 'pi-align-center' },
  { id: 'unique', label: 'Уникализация', icon: 'pi-shield' },
  { id: 'publish', label: 'Публикация', icon: 'pi-youtube' },
] as const
const active = ref<(typeof sections)[number]['id']>('voice')

// ----------------------------------------------------------------- atmosphere
const atmosphereEffects = [
  ['dust', 'Пылинки в воздухе', 'Мелкие пылинки и размытые «боке» медленно плывут по кадру — как в луче света'],
  ['breathing', 'Дыхание', 'Герой едва заметно «дышит». В 3D-параллаксе дышит только передний план, в остальных сценах — весь кадр от нижнего края'],
  ['light_pulse', 'Пульсация света', 'Светлые места кадра медленно мягко светятся и гаснут'],
  ['vignette_breathing', 'Дыхание виньетки', 'Затемнение по краям медленно сгущается и отпускает'],
  ['grain_boil', 'Кипящее зерно', 'Крупное зерно, как фактура бумаги или плёнки, сменяется рывками, как в рисованной анимации. Заменяет обычное зерно уникализации'],
  ['line_boil', 'Дрожание линий', 'Контуры чуть дрожат, будто каждый кадр перерисован от руки. Только для рисованных стилей: на фотореализме выглядит как брак'],
] as const


const templates = ref<LumeanTemplate[]>([])
const templatesError = ref('')
const pickerFor = ref<string | null>(null)
const newLang = ref<string | null>(null)

async function loadTemplates() {
  try {
    templates.value = await api.get<LumeanTemplate[]>('/api/lumean/templates')
    templatesError.value = ''
  } catch (e) {
    templatesError.value = (e as Error).message
  }
}
const templateOptions = computed(() =>
  templates.value.map((t) => ({ id: t.id, label: `${t.name}${t.model_id ? ` · ${t.model_id.replace('eleven_', '')}` : ''}` })),
)
const voiceLangs = computed(() => Object.keys(s.value.voice.templates))
const freeLangs = computed(() => (store.meta?.languages ?? []).filter((l) => !(l.code in s.value.voice.templates)))

function addLang() {
  if (!newLang.value) return
  s.value.voice.templates = { ...s.value.voice.templates, [newLang.value]: '' }
  newLang.value = null
}
function removeLang(code: string) {
  const t = { ...s.value.voice.templates }
  delete t[code]
  s.value.voice.templates = t
  if (s.value.voice.master_language === code) s.value.voice.master_language = null
}
// The main language is picked among the channel's languages (all languages while none is added).
const masterOptions = computed(() => {
  const all = store.meta?.languages ?? []
  return voiceLangs.value.length ? all.filter((l) => voiceLangs.value.includes(l.code)) : all
})
async function onVoiceCreated(t: { id: string }) {
  await loadTemplates()
  if (pickerFor.value === '__default') s.value.voice.default_template_id = t.id
  else if (pickerFor.value) s.value.voice.templates = { ...s.value.voice.templates, [pickerFor.value]: t.id }
}
const speedOverride = computed({
  get: () => s.value.voice.speed != null,
  set: (v: boolean) => (s.value.voice.speed = v ? 1.0 : null),
})

// ---------------------------------------------------------------- scenes
/** Same estimate as pipeline/scenes.py: how many scenes the duration bounds give. */
function sceneCount(seconds: number) {
  const sc = s.value.scenes
  const intro = Math.min(seconds, sc.intro_seconds)
  return Math.round(intro / ((sc.intro_min_duration + sc.intro_max_duration) / 2)
    + Math.max(0, seconds - intro) / ((sc.min_duration + sc.max_duration) / 2))
}
const limitExample = computed(() => {
  const rows = [10, 30, 60].map((min) => {
    const normal = sceneCount(min * 60)
    const n = Math.min(normal, s.value.scenes.max_images)
    return `${min} мин → ${n}${normal > n ? ` (сцена ≈ ${Math.round((min * 60) / n)} с)` : ''}`
  })
  return `Пример: ${rows.join(', ')}`
})

// ---------------------------------------------------------------- images
const imageOps = computed(() => store.meta?.image_operations ?? [])
const currentOp = computed(() => imageOps.value.find((o) => o.id === s.value.images.operation))
const hourly = computed(() => store.status?.fastgen?.budget ?? 500)
function opCredits(id: string) {
  const op = imageOps.value.find((o) => o.id === id)
  return (op?.credits ?? 4) * (s.value.images.upscale_2x && op?.upscale ? 2 : 1)
}
const perHour = computed(() => Math.floor(hourly.value / opCredits(s.value.images.operation)))
const mixed = computed(() => s.value.images.model_strategy !== 'single')
const STRATEGIES = [
  { v: 'single', l: 'Одна модель' },
  { v: 'intro', l: 'Начало качественнее' },
  { v: 'budget', l: 'По бюджету' },
]
const strategyHint = computed(() => ({
  single: 'Все сцены генерируются одной моделью.',
  intro: 'Первые минуты каждого видео — качественной моделью (начало решает, досмотрят ли ролик), остальное — дешёвой.',
  budget: 'Качественной моделью делается столько сцен, сколько позволяет бюджет, — с начала каждого видео. Остальные — дешёвой. ' +
    'Бюджет делится на все языки, у которых свои картинки, пропорционально числу сцен.',
}[s.value.images.model_strategy]))
// Character references need a scene model that accepts reference images (mirrors pipeline/image_plan.py).
const refsOk = (id: string) => !!imageOps.value.find((o) => o.id === id)?.refs
const opName = (id: string | null) => imageOps.value.find((o) => o.id === id)?.name ?? id ?? ''
const strategyOps = computed(() =>
  mixed.value ? [s.value.images.operation, s.value.images.economy_operation] : [s.value.images.operation],
)
const characterRefsOp = computed(() => [s.value.images.operation, s.value.images.economy_operation].find(refsOk) ?? null)
const characterModelsOk = computed(() => !!characterRefsOp.value)
const characterUpgrade = computed(() => {
  const without = strategyOps.value.filter((op) => !refsOk(op))
  return without.length && characterRefsOp.value ? without.map(opName).join(', ') : ''
})
const economyOptions = computed(() => imageOps.value.map((o) => ({ ...o, label: `${o.name} · ${o.credits} кр.` })))
/** Budget example for a typical 10-minute video (~100 scenes) to make the number tangible. */
const budgetExample = computed(() => {
  const scenes = 100
  const budget = s.value.images.budget_credits || hourly.value
  const cp = opCredits(s.value.images.operation)
  const ce = opCredits(s.value.images.economy_operation)
  if (cp <= ce) return `все ${scenes} сцен — качественной моделью`
  const k = Math.max(0, Math.min(scenes, Math.floor((budget - scenes * ce) / (cp - ce))))
  return k >= scenes ? `все ${scenes} сцен — качественной моделью` : `${k} качественных и ${scenes - k} дешёвых`
})
const uploading = ref(false)
async function uploadRef(ev: Event) {
  const files = (ev.target as HTMLInputElement).files
  if (!files?.length || !props.channelId) return
  uploading.value = true
  try {
    for (const f of Array.from(files)) await api.upload(`/api/channels/${props.channelId}/references`, f)
    emit('referencesChanged')
  } catch (e) {
    notify.error(e)
  } finally {
    uploading.value = false
    ;(ev.target as HTMLInputElement).value = ''
  }
}
async function removeRef(path: string) {
  await api.post(`/api/channels/${props.channelId}/references/delete`, { path })
  emit('referencesChanged')
}

// ------------------------------------------------------------------- llm
const chatModels = ref<{ id: string; name: string; context: number }[]>([])
async function loadModels() {
  try {
    chatModels.value = await api.get('/api/fastgen/chat-models')
  } catch {
    chatModels.value = [{ id: s.value.llm.model, name: s.value.llm.model, context: 0 }]
  }
}

// ---------------------------------------------------------------- render
function toggleIn(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}
const fonts = ref<string[]>([])

// -------------------------------------------------------------- subtitles preview
const previewStyle = computed(() => {
  const st = s.value.subtitles
  const px = (st.size / 1080) * 100
  const outline = st.style === 'box' ? 0 : (st.outline / 1080) * 100 * 1.2
  return {
    fontFamily: `"${st.font}", sans-serif`,
    fontSize: `${px}cqh`,
    fontWeight: st.bold ? 700 : 400,
    textTransform: st.uppercase ? 'uppercase' : 'none',
    color: st.primary_color,
    WebkitTextStroke: outline ? `${outline}cqh ${st.outline_color}` : undefined,
    paintOrder: 'stroke fill',
    background: st.style === 'box' ? `color-mix(in srgb, ${st.box_color} ${st.box_opacity * 100}%, transparent)` : undefined,
    padding: st.style === 'box' ? '0.15em 0.4em' : undefined,
    textShadow: st.shadow ? `0 ${st.shadow * 0.15}cqh ${st.shadow * 0.3}cqh rgb(0 0 0 / .6)` : undefined,
  } as Record<string, string | number | undefined>
})
const previewPos = computed(() => {
  const m = `${(s.value.subtitles.margin_v / 1080) * 100}%`
  return s.value.subtitles.position === 'top' ? { top: m } : s.value.subtitles.position === 'middle' ? { top: '45%' } : { bottom: m }
})
function hex(v: string) {
  return v.startsWith('#') ? v : `#${v}`
}

onMounted(async () => {
  void loadTemplates()
  void loadModels()
  fonts.value = await api.get<string[]>('/api/fonts').catch(() => [])
})
</script>

<template>
  <div class="grid grid-cols-[13rem_minmax(0,1fr)] gap-8">
    <nav class="sticky top-4 flex h-fit flex-col gap-0.5">
      <button
        v-for="sec in sections"
        :key="sec.id"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-raised"
        :class="active === sec.id ? 'bg-raised text-ink' : 'text-ink-2'"
        @click="active = sec.id"
      >
        <i :class="['pi', sec.icon]" class="w-4 text-[14px]" />{{ sec.label }}
      </button>
    </nav>

    <div class="flex min-w-0 flex-col gap-7 pb-10">
      <!-- ============================== VOICE -->
      <template v-if="active === 'voice'">
        <p class="text-ink-3">
          Голос задаётся шаблоном Lumean. Для каждого языка можно выбрать свой голос, остальные языки используют голос по умолчанию.
        </p>
        <div v-if="templatesError" class="rounded-md border border-bad/40 bg-bad/10 px-4 py-3 text-[13px] text-bad">
          Не удалось загрузить голоса Lumean: {{ templatesError }}
        </div>
        <FormField
          v-if="mode === 'channel'"
          label="Основной язык"
          hint="На нём вставляется сценарий новых проектов, остальные языки переводятся с него"
        >
          <Select
            v-model="s.voice.master_language"
            :options="masterOptions"
            option-value="code"
            option-label="name"
            filter
            show-clear
            placeholder="Первый язык из списка"
            class="w-60"
          />
        </FormField>
        <FormField label="Голос по умолчанию" hint="Для языков без отдельного голоса">
          <div class="flex gap-2">
            <Select
              v-model="s.voice.default_template_id"
              :options="templateOptions"
              option-value="id"
              option-label="label"
              filter
              show-clear
              placeholder="Выберите шаблон Lumean"
              class="min-w-0 flex-1"
            />
            <Button icon="pi pi-search" label="Подобрать" severity="secondary" outlined @click="pickerFor = '__default'" />
          </div>
        </FormField>
        <FormField v-for="code in voiceLangs" :key="code" :label="store.langLabel(code)">
          <div class="flex gap-2">
            <Select
              v-model="s.voice.templates[code]"
              :options="templateOptions"
              option-value="id"
              option-label="label"
              filter
              placeholder="Выберите шаблон Lumean"
              class="min-w-0 flex-1"
            />
            <Button icon="pi pi-search" severity="secondary" outlined aria-label="Подобрать голос" v-tooltip="'Подобрать голос'" @click="pickerFor = code" />
            <Button icon="pi pi-trash" severity="secondary" text aria-label="Убрать язык" @click="removeLang(code)" />
          </div>
        </FormField>
        <FormField label="Отдельный голос для языка">
          <div class="flex gap-2">
            <Select v-model="newLang" :options="freeLangs" option-value="code" option-label="name" filter placeholder="Язык" class="w-60" />
            <Button label="Добавить" severity="secondary" outlined :disabled="!newLang" @click="addLang" />
          </div>
        </FormField>
        <FormField label="Своя скорость речи" hint="Иначе используется скорость из шаблона" :value="s.voice.speed?.toFixed(2)">
          <div class="flex items-center gap-4 pt-1.5">
            <ToggleSwitch v-model="speedOverride" />
            <Slider v-if="s.voice.speed != null" v-model="s.voice.speed" :min="0.7" :max="1.2" :step="0.01" class="flex-1" />
          </div>
        </FormField>
        <FormField label="Озвучивать по абзацам" hint="Каждый абзац отдельно: ровнее интонация на стыках, чуть дороже">
          <ToggleSwitch v-model="s.voice.paragraph_mode" class="mt-1.5" />
        </FormField>
        <VoicePicker
          :visible="pickerFor !== null"
          :language="pickerFor && pickerFor !== '__default' ? pickerFor : undefined"
          @update:visible="(v) => !v && (pickerFor = null)"
          @created="onVoiceCreated"
        />
      </template>

      <!-- ============================== SCENES -->
      <template v-else-if="active === 'scenes'">
        <FormField label="Способ разбивки">
          <SelectButton
            v-model="s.scenes.mode"
            :options="[{ v: 'smart', l: 'По смыслу (LLM)' }, { v: 'auto', l: 'По предложениям' }]"
            option-value="v"
            option-label="l"
            :allow-empty="false"
          />
          <p class="mt-2 text-[13px] text-ink-3">
            {{ s.scenes.mode === 'smart'
              ? 'Новая картинка там, где меняется то, что зритель должен увидеть. Длительность всё равно в заданных рамках.'
              : 'Мгновенно и бесплатно: режет по предложениям и паузам, ближе к средней длительности.' }}
          </p>
        </FormField>
        <FormField label="Чем ограничить">
          <SelectButton
            v-model="s.scenes.limit_mode"
            :options="[{ v: 'duration', l: 'Длительностью сцен' }, { v: 'count', l: 'Количеством картинок' }]"
            option-value="v"
            option-label="l"
            :allow-empty="false"
          />
          <p class="mt-2 text-[13px] text-ink-3">
            {{ s.scenes.limit_mode === 'count'
              ? 'Не больше заданного числа картинок на видео. Если с длительностью ниже картинок получится больше, сцены равномерно удлинятся.'
              : 'Сцены держатся в заданных секундах, число картинок зависит от длины видео.' }}
          </p>
        </FormField>
        <FormField
          v-if="s.scenes.limit_mode === 'count'"
          label="Картинок на видео"
          :hint="`Не больше этого числа на одно видео (на каждую языковую версию со своими картинками). ${limitExample}`"
        >
          <InputNumber v-model="s.scenes.max_images" :min="10" :max="5000" :step="10" show-buttons class="w-36" />
        </FormField>
        <FormField
          :label="s.scenes.limit_mode === 'count' ? 'Длительность сцены, если лимит не мешает' : 'Длительность сцены'"
          hint="Сколько секунд держится одна картинка"
          :value="`${s.scenes.min_duration}–${s.scenes.max_duration} с`"
        >
          <div class="flex items-center gap-3">
            <InputNumber v-model="s.scenes.min_duration" :min="1" :max="s.scenes.max_duration" :step="0.5" :min-fraction-digits="0" :max-fraction-digits="1" suffix=" с" show-buttons class="w-32" />
            <span class="text-ink-3">до</span>
            <InputNumber v-model="s.scenes.max_duration" :min="s.scenes.min_duration" :max="60" :step="0.5" :max-fraction-digits="1" suffix=" с" show-buttons class="w-32" />
          </div>
        </FormField>
        <FormField label="Быстрое начало" hint="В первые секунды картинки меняются чаще — это удерживает зрителя" :value="`${s.scenes.intro_seconds} с`">
          <Slider v-model="s.scenes.intro_seconds" :min="0" :max="180" :step="5" class="mt-3" />
          <div v-if="s.scenes.intro_seconds > 0" class="mt-4 flex items-center gap-3">
            <span class="text-ink-3">Сцены в начале</span>
            <InputNumber v-model="s.scenes.intro_min_duration" :min="1" :max="s.scenes.intro_max_duration" :step="0.5" :max-fraction-digits="1" suffix=" с" show-buttons class="w-28" />
            <span class="text-ink-3">до</span>
            <InputNumber v-model="s.scenes.intro_max_duration" :min="s.scenes.intro_min_duration" :max="30" :step="0.5" :max-fraction-digits="1" suffix=" с" show-buttons class="w-28" />
          </div>
        </FormField>
      </template>

      <!-- ============================== IMAGES -->
      <template v-else-if="active === 'images'">
        <FormField label="Распределение моделей">
          <SelectButton
            v-model="s.images.model_strategy"
            :options="STRATEGIES"
            option-value="v"
            option-label="l"
            :allow-empty="false"
            size="small"
          />
          <p class="mt-2 text-[13px] leading-snug text-ink-3">{{ strategyHint }}</p>
        </FormField>
        <FormField :label="mixed ? 'Качественная модель' : 'Модель'" :hint="`≈ ${perHour} картинок в час на вашем тарифе`">
          <div class="grid grid-cols-1 gap-2 xl:grid-cols-2">
            <button
              v-for="op in imageOps"
              :key="op.id"
              class="rounded-md border px-3.5 py-2.5 text-left transition-colors"
              :class="s.images.operation === op.id ? 'border-tally bg-tally/10' : 'border-line hover:border-ink-3'"
              @click="s.images.operation = op.id"
            >
              <span class="flex items-baseline justify-between gap-2">
                <span class="font-medium">{{ op.name }}</span>
                <span class="tnum shrink-0 text-[13px] text-ink-3">{{ op.credits }} кр.</span>
              </span>
              <span class="mt-0.5 block text-[13px] text-ink-3">{{ op.note }}</span>
            </button>
          </div>
        </FormField>
        <template v-if="mixed">
          <FormField label="Дешёвая модель" :hint="`Для остальных сцен · ≈ ${Math.floor(hourly / opCredits(s.images.economy_operation))} картинок в час`">
            <Select v-model="s.images.economy_operation" :options="economyOptions" option-value="id" option-label="label" class="w-80" />
          </FormField>
          <FormField
            v-if="s.images.model_strategy === 'intro'"
            label="Качественная модель первые"
            hint="Минут от начала каждого видео"
          >
            <InputNumber v-model="s.images.premium_minutes" :min="0.5" :max="60" :step="0.5" :min-fraction-digits="0" :max-fraction-digits="1" suffix=" мин" show-buttons class="w-36" />
          </FormField>
          <FormField
            v-else
            label="Бюджет на проект"
            :hint="`Кредитов на все картинки проекта. 0 — один час тарифа (${hourly} кр.). Для 10-минутного видео: ${budgetExample}`"
          >
            <InputNumber v-model="s.images.budget_credits" :min="0" :step="50" suffix=" кр." show-buttons class="w-36" />
          </FormField>
        </template>
        <FormField v-if="currentOp?.upscale" label="Увеличение 2×" hint="Чётче при зуме и в 1440p/4K, но вдвое дороже">
          <ToggleSwitch v-model="s.images.upscale_2x" class="mt-1.5" />
        </FormField>
        <FormField label="Стиль канала" hint="Добавляется к каждому промпту: техника, свет, цвет, настроение">
          <Textarea v-model="s.images.style_prompt" auto-resize rows="3" class="w-full" />
        </FormField>
        <FormField label="Чего не должно быть" hint="Перечислите через запятую">
          <Textarea v-model="s.images.avoid" auto-resize rows="2" class="w-full" />
        </FormField>
        <FormField
          label="Референсы стиля"
          :hint="mode === 'channel' ? 'Примеры картинок в нужном стиле — отправляются вместе с каждым запросом' : 'Задаются в настройках канала'"
        >
          <div class="flex items-center gap-3 pt-1">
            <ToggleSwitch v-model="s.images.use_references" :disabled="!currentOp?.refs" />
            <span class="text-[13px] text-ink-3">{{ currentOp?.refs ? 'Использовать референсы' : 'Эта модель не принимает референсы' }}</span>
          </div>
          <div v-if="references?.length || mode === 'channel'" class="mt-3 flex flex-wrap gap-2">
            <div v-for="r in references" :key="r.path" class="group relative h-20 w-32 overflow-hidden rounded-md border border-line">
              <img :src="r.url" alt="Референс стиля" class="h-full w-full object-cover" />
              <button
                v-if="mode === 'channel'"
                class="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded bg-black/70 text-white group-hover:flex"
                aria-label="Удалить референс"
                @click="removeRef(r.path)"
              >
                <i class="pi pi-times text-xs" />
              </button>
            </div>
            <label
              v-if="mode === 'channel'"
              class="flex h-20 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-[13px] text-ink-3 hover:border-ink-3 hover:text-ink-2"
            >
              <i :class="['pi', uploading ? 'pi-spin pi-spinner' : 'pi-plus']" />Добавить
              <input type="file" accept="image/*" multiple class="hidden" @change="uploadRef" />
            </label>
          </div>
        </FormField>
        <FormField
          label="Референсы персонажей"
          hint="Повторяющиеся герои получают портрет-образец, который отправляется со всеми сценами, где они есть: лицо, причёска и одежда не меняются от кадра к кадру"
        >
          <ToggleSwitch v-model="s.images.character_refs" class="mt-1.5" />
          <div v-if="s.images.character_refs" class="mt-3 flex flex-col gap-2">
            <label class="flex flex-col gap-1.5">
              <span class="text-[13px] text-ink-2">Модель для портретов</span>
              <Select v-model="s.images.character_operation" :options="economyOptions" option-value="id" option-label="label" class="w-80" />
            </label>
            <p v-if="!characterModelsOk" class="text-[13px] text-tally">
              Ни одна из выбранных моделей не принимает референсы — портреты не будут учитываться. Выберите, например, Nano Banana 2.
            </p>
            <p v-else-if="characterUpgrade" class="text-[13px] text-ink-3">
              {{ characterUpgrade }} не принимает референсы — сцены с персонажами сделает {{ opName(characterRefsOp) }}.
            </p>
          </div>
        </FormField>
        <FormField label="Водяные знаки" hint="Модели на основе Gemini (Flower, Nano Banana через Gemini) ставят звёздочку в углу части картинок. Каждая картинка проверяется">
          <Select
            v-model="s.images.watermark_fix"
            :options="[
              { v: 'auto', l: 'Удалять автоматически' },
              { v: 'crop', l: 'Обрезать угол' },
              { v: 'none', l: 'Не трогать' },
            ]"
            option-value="v"
            option-label="l"
            class="w-64"
          />
        </FormField>
        <FormField label="Исправлять отклонённые промпты" hint="Если фильтр модели отклонил запрос, LLM смягчит формулировку и повторит">
          <ToggleSwitch v-model="s.images.auto_fix_rejected" class="mt-1.5" />
        </FormField>
        <FormField label="Попыток на картинку">
          <InputNumber v-model="s.images.max_attempts" :min="1" :max="6" show-buttons class="w-32" />
        </FormField>
      </template>

      <!-- ============================== LLM -->
      <template v-else-if="active === 'llm'">
        <FormField label="Модель" hint="Для разбивки, промптов, перевода и метаданных. Gemini принимает весь сценарий целиком">
          <Select v-model="s.llm.model" :options="chatModels" option-value="id" option-label="name" filter class="w-80" />
        </FormField>
        <FormField label="Тематика канала" hint="О чём канал и для кого — помогает точнее подбирать образы и названия">
          <Textarea v-model="s.llm.niche" auto-resize rows="2" class="w-full" placeholder="Например: психология отношений для женщин 30–50 лет" />
        </FormField>
        <FormField label="Указания для промптов" hint="Постоянные правила для картинок канала">
          <Textarea
            v-model="s.llm.prompt_instructions"
            auto-resize
            rows="3"
            class="w-full"
            placeholder="Например: героиня — женщина 40 лет; действие в современном европейском городе; без детей в кадре"
          />
        </FormField>
        <FormField label="Креативность" :value="s.llm.temperature.toFixed(1)" hint="Выше — разнообразнее образы, ниже — точнее по тексту">
          <Slider v-model="s.llm.temperature" :min="0" :max="1.2" :step="0.1" class="mt-3" />
        </FormField>
      </template>

      <!-- ============================== RENDER -->
      <template v-else-if="active === 'render'">
        <FormField label="Разрешение и частота">
          <div class="flex gap-3">
            <Select
              v-model="s.render.resolution"
              :options="[{ v: '1080p', l: '1920×1080 (Full HD)' }, { v: '1440p', l: '2560×1440 (2K)' }, { v: '2160p', l: '3840×2160 (4K)' }]"
              option-value="v"
              option-label="l"
              class="w-56"
            />
            <Select v-model="s.render.fps" :options="[24, 25, 30, 60]" class="w-28" />
          </div>
          <p class="mt-2 text-[13px] text-ink-3">1440p даёт заметно лучшее качество после сжатия YouTube, но рендерится дольше.</p>
        </FormField>
        <FormField label="Движение камеры" hint="Для каждой сцены выбирается случайно из отмеченных">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="e in store.meta?.effects"
              :key="e.id"
              class="rounded-md border px-3 py-1.5 text-[13px] transition-colors"
              :class="s.render.motion_effects.includes(e.id) ? 'border-tally bg-tally/10 text-ink' : 'border-line text-ink-3 hover:text-ink-2'"
              @click="s.render.motion_effects = toggleIn(s.render.motion_effects, e.id)"
            >{{ e.name }}</button>
          </div>
        </FormField>
        <FormField label="Интенсивность движения" :value="`${Math.round(s.render.motion_intensity * 100)}%`">
          <Slider v-model="s.render.motion_intensity" :min="0" :max="1" :step="0.05" class="mt-3" />
        </FormField>
        <FormField label="Крупные планы по фразам" hint="Внутри сцены монтаж чередует общий план и более крупный план героя, склейки — на паузах в речи. Новые картинки не нужны">
          <ToggleSwitch v-model="s.render.phrase_cuts" class="mt-1.5" />
        </FormField>
        <template v-if="s.render.motion_effects.includes('parallax')">
          <FormField label="Размытие фона" hint="3D-параллакс: фон за героем мягко размыт, как при съёмке на длиннофокусный объектив">
            <ToggleSwitch v-model="s.render.depth_of_field" class="mt-1.5" />
          </FormField>
        </template>
        <FormField label="Переходы">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in store.meta?.transitions"
              :key="t.id"
              class="rounded-md border px-3 py-1.5 text-[13px] transition-colors"
              :class="s.render.transitions.includes(t.id) ? 'border-tally bg-tally/10 text-ink' : 'border-line text-ink-3 hover:text-ink-2'"
              @click="s.render.transitions = toggleIn(s.render.transitions, t.id)"
            >{{ t.name }}</button>
          </div>
        </FormField>
        <FormField label="Длительность перехода" :value="`${s.render.transition_duration.toFixed(1)} с`">
          <Slider v-model="s.render.transition_duration" :min="0.2" :max="1.5" :step="0.1" class="mt-3" />
        </FormField>
        <FormField label="Доля простых склеек" :value="`${Math.round(s.render.cut_ratio * 100)}%`" hint="Без эффекта перехода — так монтаж выглядит естественнее">
          <Slider v-model="s.render.cut_ratio" :min="0" :max="1" :step="0.05" class="mt-3" />
        </FormField>
        <FormField label="Появление и затухание">
          <div class="flex items-center gap-3">
            <InputNumber v-model="s.render.fade_in" :min="0" :max="5" :step="0.1" :max-fraction-digits="1" suffix=" с" show-buttons class="w-32" />
            <InputNumber v-model="s.render.fade_out" :min="0" :max="5" :step="0.1" :max-fraction-digits="1" suffix=" с" show-buttons class="w-32" />
          </div>
        </FormField>
        <FormField label="Качество кодирования">
          <SelectButton
            v-model="s.render.quality"
            :options="[{ v: 'max', l: 'Максимум' }, { v: 'high', l: 'Высокое' }, { v: 'balanced', l: 'Баланс' }, { v: 'fast', l: 'Быстро' }]"
            option-value="v"
            option-label="l"
            :allow-empty="false"
          />
        </FormField>
        <FormField label="Энкодер" hint="Аппаратный энкодер видеокарты быстрее, программный — чуть качественнее">
          <Select
            v-model="s.render.encoder"
            :options="[{ v: 'auto', l: 'Автоматически' }, ...(store.meta?.encoders ?? []).map((e) => ({ v: e, l: e }))]"
            option-value="v"
            option-label="l"
            class="w-56"
          />
        </FormField>
        <FormField label="Громкость" hint="YouTube нормализует к −14 LUFS" :value="`${s.render.loudness} LUFS`">
          <Slider v-model="s.render.loudness" :min="-24" :max="-9" :step="0.5" class="mt-3" />
        </FormField>
        <FormField label="Процессов рендера" hint="0 — подобрать автоматически по числу ядер">
          <InputNumber v-model="s.render.workers" :min="0" :max="16" show-buttons class="w-32" />
        </FormField>
      </template>

      <!-- ============================== ATMOSPHERE -->
      <template v-else-if="active === 'atmosphere'">
        <p class="text-ink-3">
          Едва заметная жизнь в статичной картинке. Каждый рендер получает свой ритм, так что эффекты ещё и уникализируют видео.
          Зерно и дрожание линий заметно увеличивают размер файла.
        </p>
        <template v-for="e in atmosphereEffects" :key="e[0]">
          <FormField :label="e[1]" :hint="e[2]">
            <ToggleSwitch v-model="s.atmosphere[e[0]]" class="mt-1.5" />
          </FormField>
          <FormField v-if="s.atmosphere[e[0]]" label="Сила" :value="`${Math.round(s.atmosphere[`${e[0]}_strength`] * 100)}%`">
            <Slider v-model="s.atmosphere[`${e[0]}_strength`]" :min="0.05" :max="1" :step="0.05" class="mt-3" />
          </FormField>
        </template>
        <FormField
          v-if="s.atmosphere.line_boil || s.atmosphere.grain_boil"
          label="Частота «кипения»"
          hint="Как часто перерисовываются линии и зерно"
        >
          <SelectButton
            v-model="s.atmosphere.boil_hold"
            :options="[{ v: 2, l: 'Быстро (на двойках)' }, { v: 3, l: 'Классика (на тройках)' }, { v: 4, l: 'Медленно' }]"
            option-value="v"
            option-label="l"
            :allow-empty="false"
          />
        </FormField>
      </template>

      <!-- ============================== SUBTITLES -->
      <template v-else-if="active === 'subtitles'">
        <FormField label="Вшивать субтитры в видео" hint="Файл .srt для загрузки на YouTube создаётся всегда">
          <ToggleSwitch v-model="s.subtitles.enabled" class="mt-1.5" />
        </FormField>
        <template v-if="s.subtitles.enabled">
          <div class="relative aspect-video overflow-hidden rounded-lg border border-line bg-[linear-gradient(135deg,#3b4a5e,#6b5a4a_60%,#2c3440)]" style="container-type: size">
            <div class="absolute inset-x-0 flex justify-center px-[4%] text-center leading-tight" :style="previewPos">
              <span :style="previewStyle">
                <template v-if="s.subtitles.style === 'karaoke'">
                  <span :style="{ color: s.subtitles.highlight_color }">Так выглядят</span> субтитры<br />в вашем видео
                </template>
                <template v-else>Так выглядят субтитры<br />в вашем видео</template>
              </span>
            </div>
          </div>
          <FormField label="Стиль">
            <SelectButton
              v-model="s.subtitles.style"
              :options="[{ v: 'plain', l: 'Обводка' }, { v: 'karaoke', l: 'Подсветка слов' }, { v: 'box', l: 'Плашка' }]"
              option-value="v"
              option-label="l"
              :allow-empty="false"
            />
          </FormField>
          <FormField label="Шрифт" hint="Свои шрифты положите в папку data/fonts">
            <div class="flex flex-wrap items-center gap-3">
              <Select v-model="s.subtitles.font" :options="fonts" editable class="w-56" />
              <InputNumber v-model="s.subtitles.size" :min="20" :max="140" show-buttons suffix=" px" class="w-32" />
              <label class="flex items-center gap-2"><ToggleSwitch v-model="s.subtitles.bold" />Жирный</label>
              <label class="flex items-center gap-2"><ToggleSwitch v-model="s.subtitles.uppercase" />Заглавные</label>
            </div>
          </FormField>
          <FormField label="Цвета">
            <div class="flex flex-wrap items-center gap-5">
              <label class="flex items-center gap-2">
                <ColorPicker :model-value="s.subtitles.primary_color.slice(1)" @update:model-value="(v: any) => (s.subtitles.primary_color = hex(v))" />Текст
              </label>
              <label v-if="s.subtitles.style === 'karaoke'" class="flex items-center gap-2">
                <ColorPicker :model-value="s.subtitles.highlight_color.slice(1)" @update:model-value="(v: any) => (s.subtitles.highlight_color = hex(v))" />Подсветка
              </label>
              <label v-if="s.subtitles.style !== 'box'" class="flex items-center gap-2">
                <ColorPicker :model-value="s.subtitles.outline_color.slice(1)" @update:model-value="(v: any) => (s.subtitles.outline_color = hex(v))" />Обводка
              </label>
              <label v-else class="flex items-center gap-2">
                <ColorPicker :model-value="s.subtitles.box_color.slice(1)" @update:model-value="(v: any) => (s.subtitles.box_color = hex(v))" />Плашка
              </label>
            </div>
          </FormField>
          <FormField v-if="s.subtitles.style === 'box'" label="Прозрачность плашки" :value="`${Math.round(s.subtitles.box_opacity * 100)}%`">
            <Slider v-model="s.subtitles.box_opacity" :min="0.1" :max="1" :step="0.05" class="mt-3" />
          </FormField>
          <FormField v-else label="Толщина обводки" :value="s.subtitles.outline.toFixed(1)">
            <Slider v-model="s.subtitles.outline" :min="0" :max="8" :step="0.5" class="mt-3" />
          </FormField>
          <FormField label="Положение">
            <div class="flex items-center gap-3">
              <SelectButton
                v-model="s.subtitles.position"
                :options="[{ v: 'bottom', l: 'Внизу' }, { v: 'middle', l: 'По центру' }, { v: 'top', l: 'Вверху' }]"
                option-value="v"
                option-label="l"
                :allow-empty="false"
              />
              <InputNumber v-model="s.subtitles.margin_v" :min="0" :max="400" show-buttons suffix=" px" class="w-32" />
            </div>
          </FormField>
          <FormField label="Длина строки" hint="Символов в строке и строк на экране">
            <div class="flex items-center gap-3">
              <InputNumber v-model="s.subtitles.max_chars_per_line" :min="12" :max="80" show-buttons class="w-32" />
              <InputNumber v-model="s.subtitles.max_lines" :min="1" :max="3" show-buttons class="w-28" />
            </div>
          </FormField>
        </template>

        <FormField label="Ключевые фразы на экране" hint="Нейросеть выбирает в сценарии цифры и главные мысли, и в нужный момент они крупно появляются в кадре. Работает и без субтитров">
          <ToggleSwitch v-model="s.subtitles.accents" class="mt-1.5" />
        </FormField>
        <template v-if="s.subtitles.accents">
          <FormField label="Частота" :value="`${s.subtitles.accents_per_minute.toFixed(1)} в минуту`" hint="Примерно столько фраз на минуту видео; ближе 6 секунд друг к другу они не появляются">
            <Slider v-model="s.subtitles.accents_per_minute" :min="0.3" :max="4" :step="0.1" class="mt-3" />
          </FormField>
          <FormField label="Шрифт и цвет фраз">
            <div class="flex flex-wrap items-center gap-3">
              <Select v-model="s.subtitles.accent_font" :options="fonts" editable class="w-56" />
              <ColorPicker :model-value="s.subtitles.accent_color.slice(1)" @update:model-value="(v: any) => (s.subtitles.accent_color = hex(v))" />
            </div>
          </FormField>
        </template>
      </template>

      <!-- ============================== UNIQUENESS -->
      <template v-else-if="active === 'unique'">
        <p class="text-ink-3">
          Каждый рендер получает свои случайные параметры: цветокоррекцию, зерно, виньетку, микрозум, порядок движений и переходов,
          тонкую эквализацию звука. Зритель разницы не заметит, а файлы получаются технически разными.
        </p>
        <FormField label="Уникализация">
          <ToggleSwitch v-model="s.unique.enabled" class="mt-1.5" />
        </FormField>
        <template v-if="s.unique.enabled">
          <FormField label="Сила" :value="`${Math.round(s.unique.strength * 100)}%`">
            <Slider v-model="s.unique.strength" :min="0" :max="1" :step="0.05" class="mt-3" />
          </FormField>
          <FormField
            v-for="opt in ([
              ['color_jitter', 'Цветокоррекция', 'Яркость, контраст, насыщенность и температура'],
              ['film_grain', 'Плёночное зерно', 'Едва заметный шум, разный в каждом рендере'],
              ['vignette', 'Виньетка', 'Мягкое затемнение по краям'],
              ['micro_zoom', 'Микрозум и сдвиг', 'Кадр чуть иначе обрезан'],
              ['audio_eq', 'Эквализация звука', 'Неслышимые изменения тембра ±0.6 дБ'],
              ['strip_metadata', 'Очистка метаданных', 'Убирает служебную информацию из файла'],
            ] as const)"
            :key="opt[0]"
            :label="opt[1]"
            :hint="opt[2]"
          >
            <ToggleSwitch v-model="s.unique[opt[0]]" class="mt-1.5" />
          </FormField>
        </template>
      </template>

      <!-- ============================== PUBLISH -->
      <template v-else-if="active === 'publish'">
        <FormField label="Создавать в конвейере" hint="Название, описание, теги и обложки при запуске конвейера. Если выключить, их всё равно можно создать вручную на этапе «Публикация» любого видео">
          <ToggleSwitch v-model="s.publish.enabled" class="mt-1.5" />
        </FormField>
        <FormField label="Вариантов названия">
          <InputNumber v-model="s.publish.title_variants" :min="1" :max="10" show-buttons class="w-32" />
        </FormField>
        <FormField label="Тегов">
          <InputNumber v-model="s.publish.tags_count" :min="3" :max="40" show-buttons class="w-32" />
        </FormField>
        <FormField label="Главы в описании" hint="Таймкоды разделов по абзацам сценария">
          <ToggleSwitch v-model="s.publish.with_chapters" class="mt-1.5" />
        </FormField>
        <FormField label="Подпись в конце описания" hint="Ссылки, соцсети, дисклеймеры">
          <Textarea v-model="s.publish.description_footer" auto-resize rows="3" class="w-full" />
        </FormField>
        <FormField label="Обложек">
          <InputNumber v-model="s.publish.thumbnail_count" :min="1" :max="4" show-buttons class="w-32" />
        </FormField>
        <FormField label="Модель для обложек">
          <Select v-model="s.publish.thumbnail_operation" :options="imageOps" option-value="id" option-label="name" class="w-72" />
        </FormField>
        <FormField label="Заголовок на обложке" hint="Модель нарисует 2–4 слова крупным шрифтом">
          <ToggleSwitch v-model="s.publish.thumbnail_text" class="mt-1.5" />
        </FormField>
        <FormField label="Стиль обложек">
          <Textarea v-model="s.publish.thumbnail_style" auto-resize rows="2" class="w-full" />
        </FormField>
      </template>
    </div>
  </div>
</template>
