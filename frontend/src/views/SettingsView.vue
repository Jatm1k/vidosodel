<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Slider from 'primevue/slider'
import ToggleSwitch from 'primevue/toggleswitch'
import { api } from '@/api/client'
import type { AppConfig, GeminiStatus } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'
import StoragePanel from '@/components/StoragePanel.vue'

const store = useAppStore()
const notify = useNotify()
const cfg = ref<AppConfig | null>(null)
const saving = ref(false)
const checks = ref<Record<string, { ok: boolean; error?: string; details?: string[]; models?: string[] } | 'pending'>>({})
const gemini = ref<GeminiStatus | null>(null)
const geminiModels = ref<string[]>([])
const mcpUrl = computed(() => `${window.location.origin}/mcp`)
const mcpCommand = computed(() => `claude mcp add --transport http vidosodel ${mcpUrl.value}`)

async function loadGemini() {
  try {
    gemini.value = await api.get<GeminiStatus>('/api/gemini/status')
  } catch {
    gemini.value = null
  }
}

onMounted(async () => {
  cfg.value = await api.get<AppConfig>('/api/settings')
  void loadGemini()
})

function addGeminiKey() {
  cfg.value?.gemini_api_keys.push('')
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    notify.ok('Скопировано')
  } catch {
    notify.info('Скопируйте вручную', text)
  }
}

async function save() {
  if (!cfg.value) return
  saving.value = true
  try {
    cfg.value = await api.put<AppConfig>('/api/settings', cfg.value)
    await store.loadStatus()
    notify.ok('Настройки сохранены')
  } catch (e) {
    notify.error(e)
  } finally {
    saving.value = false
  }
}

const KEY_LABELS = {
  inflight: 'Inflight — генерация видео и изображений',
  lumean: 'Lumean — озвучка',
  fastgen: 'FastGen — изображения, тексты, распознавание речи',
  youtube: 'YouTube Data API — исследование ниши для упаковки',
} as const

async function check(service: 'inflight' | 'lumean' | 'fastgen' | 'llm_fallback' | 'gemini' | 'youtube') {
  await save()
  checks.value[service] = 'pending'
  const result = await api.post<{ ok: boolean; error?: string; details?: string[]; models?: string[] }>(
    '/api/settings/check', { service })
  checks.value[service] = result
  if (service === 'fastgen') cfg.value = await api.get<AppConfig>('/api/settings')
  if (service === 'gemini') {
    geminiModels.value = result.models ?? []
    void loadGemini()
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-8 py-8">
    <h1 class="font-display text-2xl font-semibold">Настройки</h1>
    <p class="mt-1 text-ink-3">Общие для всех каналов. Голос, стиль и монтаж задаются в настройках каждого канала.</p>

    <form v-if="cfg" class="mt-8 flex flex-col gap-10" @submit.prevent="save">
      <section class="rounded-xl border border-line p-5">
        <h2 class="font-semibold">Inflight: лимиты генерации</h2>
        <p class="my-3 text-sm text-ink-3">До 1000 видео и 1000 картинок за сутки UTC. Очередь ждёт сброса квоты; серверные ограничения учитываются дополнительно.</p>
        <label class="block">Адрес API <InputText v-model="cfg.inflight_base_url" class="w-full" /></label>
        <div class="mt-4 flex flex-wrap gap-4">
          <label>Потоки на пул <InputNumber v-model="cfg.inflight_threads" :min="1" :max="12" show-buttons /></label>
          <label>Видео/сутки <InputNumber v-model="cfg.inflight_video_daily" :min="1" :max="1000" /></label>
          <label>Картинки/сутки <InputNumber v-model="cfg.inflight_image_daily" :min="1" :max="1000" /></label>
        </div>
        <p class="mt-3 text-sm text-ink-3">На тарифе parallel картинки и видео используют отдельные пулы потоков. На chain лимит общий. FastGen работает независимо.</p>
      </section>
      <section>
        <h2 class="text-base font-semibold">Ключи API</h2>
        <p class="mt-1 text-[13px] text-ink-3">Хранятся локально в базе приложения. Ключи из файла .env используются, если здесь пусто.</p>
        <div class="mt-4 flex flex-col gap-5">
          <div v-for="svc in (['inflight', 'lumean', 'fastgen', 'youtube'] as const)" :key="svc" class="flex flex-col gap-1.5">
            <label :for="`key-${svc}`" class="text-ink-2">
              {{ KEY_LABELS[svc] }}
            </label>
            <div class="flex gap-2">
              <InputText
                :id="`key-${svc}`"
                v-model="cfg[`${svc}_api_key`]"
                class="flex-1 font-mono text-[13px]"
                placeholder="Вставьте ключ"
                autocomplete="off"
              />
              <Button
                label="Проверить"
                severity="secondary"
                outlined
                :loading="checks[svc] === 'pending'"
                @click="check(svc)"
              />
            </div>
            <span
              v-if="checks[svc] && checks[svc] !== 'pending'"
              class="text-[13px]"
              :class="(checks[svc] as any).ok ? 'text-ok' : 'text-bad'"
            >
              {{ (checks[svc] as any).ok ? 'Ключ работает' : (checks[svc] as any).error }}
            </span>
            <span v-if="svc === 'youtube'" class="text-[13px] text-ink-3">
              Необязательно. Перед упаковкой приложение находит ролики по теме, которые набрали в разы больше
              просмотров, чем обычно на их канале, и учится на их названиях и обложках. Ключ бесплатный:
              console.cloud.google.com → создать проект → «APIs &amp; Services» → включить «YouTube Data API v3» →
              «Credentials» → «Create credentials» → «API key». Квоты хватает примерно на 40–50 роликов в день.
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-base font-semibold">Лимиты FastGen</h2>
        <p class="mt-1 text-[13px] text-ink-3">
          Проверка ключа подставляет значения вашего тарифа. Приложение само распределяет генерации, чтобы не превысить лимит.
        </p>
        <div class="mt-4 grid grid-cols-2 gap-5">
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Кредитов в час</span>
            <InputNumber v-model="cfg.fastgen_credits_per_hour" :min="1" show-buttons />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Одновременных генераций</span>
            <InputNumber v-model="cfg.fastgen_image_threads" :min="1" :max="50" show-buttons />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Токенов LLM в час</span>
            <InputNumber v-model="cfg.fastgen_tokens_per_hour" :min="1000" :step="10000" show-buttons />
          </label>
          <div class="flex flex-col gap-2">
            <span class="text-ink-2">
              Доля токенов для приложения: <span class="tnum text-ink">{{ Math.round(cfg.fastgen_token_ratio * 100) }}%</span>
            </span>
            <Slider v-model="cfg.fastgen_token_ratio" :min="0.1" :max="1" :step="0.05" class="mt-2" />
          </div>
          <div class="col-span-2 flex flex-col gap-2">
            <span class="text-ink-2">
              Доля бюджета для приложения: <span class="tnum text-ink">{{ Math.round(cfg.fastgen_budget_ratio * 100) }}%</span>
            </span>
            <Slider v-model="cfg.fastgen_budget_ratio" :min="0.1" :max="1" :step="0.05" />
            <span class="text-[13px] text-ink-3">
              Траты всех, кто пользуется этим ключом, учитываются автоматически: приложение сверяется со счётчиком FastGen
              и ждёт, когда лимит освободится. Доли нужны, только чтобы жёстко поделить тариф между людьми.
            </span>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-base font-semibold">Резервный LLM</h2>
          <ToggleSwitch v-model="cfg.llm_fallback_enabled" aria-label="Использовать резервный LLM" />
        </div>
        <p class="mt-1 text-[13px] text-ink-3">
          Любой сервис с OpenAI-совместимым API: OpenRouter, OpenAI, DeepSeek, локальная Ollama. Тексты уходят туда,
          когда у FastGen кончились токены за час или ошибку либо отказ-заглушку вернули обе его модели: сначала
          модель канала, затем другая модель FastGen (например, OpenAI Auto ↔ Gemini Auto). Без резервного LLM
          приложение ждёт следующего часа. В настройках моушн-графики эту же модель можно выбрать основным
          исполнителем графики; для этого нужны вызов функций, а для визуальной проверки — поддержка изображений.
        </p>
        <div class="mt-4 grid grid-cols-2 gap-5" :class="{ 'opacity-60': !cfg.llm_fallback_enabled }">
          <label class="col-span-2 flex flex-col gap-1.5">
            <span class="text-ink-2">Адрес API</span>
            <InputText
              v-model="cfg.llm_fallback_url"
              class="font-mono text-[13px]"
              placeholder="https://openrouter.ai/api/v1"
              autocomplete="off"
            />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Модель</span>
            <InputText
              v-model="cfg.llm_fallback_model"
              class="font-mono text-[13px]"
              placeholder="google/gemini-2.5-flash"
              autocomplete="off"
            />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Ключ API</span>
            <InputText
              v-model="cfg.llm_fallback_api_key"
              class="font-mono text-[13px]"
              placeholder="Не нужен для локальной модели"
              autocomplete="off"
            />
          </label>
          <div class="col-span-2 flex items-center gap-3">
            <Button
              label="Проверить"
              severity="secondary"
              outlined
              :loading="checks.llm_fallback === 'pending'"
              @click="check('llm_fallback')"
            />
            <span
              v-if="checks.llm_fallback && checks.llm_fallback !== 'pending'"
              class="text-[13px]"
              :class="(checks.llm_fallback as any).ok ? 'text-ok' : 'text-bad'"
            >
              {{ (checks.llm_fallback as any).ok ? 'Модель отвечает' : (checks.llm_fallback as any).error }}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-base font-semibold">Gemini TTS — голоса героев сериалов</h2>
        <p class="mt-1 text-[13px] text-ink-3">
          Ключи Google AI Studio. Бесплатный ключ даёт несколько запросов в день (одна реплика — один запрос);
          ключи используются по очереди, счётчик сбрасывается в полночь по тихоокеанскому времени. Лимит считается
          на проект Google Cloud: ключи из одного проекта делят общий лимит.
        </p>
        <div class="mt-4 flex flex-col gap-2">
          <div v-for="(_, i) in cfg.gemini_api_keys" :key="i" class="flex gap-2">
            <InputText
              v-model="cfg.gemini_api_keys[i]"
              class="flex-1 font-mono text-[13px]"
              :placeholder="`Ключ ${i + 1}`"
              autocomplete="off"
              :aria-label="`Ключ Gemini ${i + 1}`"
            />
            <span v-if="gemini?.keys[i]" class="tnum w-28 self-center text-right text-[13px] text-ink-3">
              {{ gemini.keys[i].exhausted ? 'исчерпан' : `осталось ${gemini.keys[i].left}` }}
            </span>
            <Button icon="pi pi-times" text severity="secondary" aria-label="Убрать ключ" @click="cfg.gemini_api_keys.splice(i, 1)" />
          </div>
          <div class="flex items-center gap-2">
            <Button label="Добавить ключ" icon="pi pi-plus" size="small" severity="secondary" text @click="addGeminiKey" />
            <div class="flex-1" />
            <Button label="Проверить" severity="secondary" outlined :loading="checks.gemini === 'pending'" @click="check('gemini')" />
          </div>
          <div v-if="checks.gemini && checks.gemini !== 'pending'" class="text-[13px]" :class="checks.gemini.ok ? 'text-ok' : 'text-bad'">
            {{ checks.gemini.ok ? 'Ключи работают' : checks.gemini.error }}
            <div v-if="checks.gemini.details?.length" class="mt-1 text-ink-3">{{ checks.gemini.details.join(' · ') }}</div>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-5">
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Модель</span>
            <InputText v-model="cfg.gemini_tts_model" class="font-mono text-[13px]" list="gemini-models"
                       :placeholder="gemini?.model ? `авто: ${gemini.model}` : 'авто — самая новая TTS-модель'" />
            <datalist id="gemini-models">
              <option v-for="m in geminiModels" :key="m" :value="m" />
            </datalist>
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Запросов в день на ключ</span>
            <InputNumber v-model="cfg.gemini_tts_daily_limit" :min="1" :max="10000" show-buttons />
          </label>
        </div>
        <p v-if="gemini && gemini.keys.length" class="mt-2 text-[13px] text-ink-3">
          Сегодня осталось запросов: <span class="tnum text-ink-2">{{ gemini.left }}</span>, сброс в
          {{ new Date(gemini.resets_at * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }}.
        </p>
      </section>

      <section>
        <h2 class="text-base font-semibold">Подключение ИИ-агента (MCP)</h2>
        <p class="mt-1 text-[13px] text-ink-3">
          Агент (Claude Code, Claude Desktop и другие клиенты MCP) подключается к запущенному приложению и ведёт
          сериал сам: пишет мир и сценарии, задаёт голоса, звук и кадры, запускает генерацию и проверяет картинки.
          Работает, пока открыто окно Vidosodel.
        </p>
        <div class="mt-4 flex flex-col gap-2">
          <span class="text-ink-2">Адрес сервера</span>
          <div class="flex gap-2">
            <InputText :model-value="mcpUrl" readonly class="flex-1 font-mono text-[13px]" aria-label="Адрес MCP" />
            <Button icon="pi pi-copy" severity="secondary" outlined aria-label="Копировать адрес" @click="copy(mcpUrl)" />
          </div>
          <span class="mt-2 text-ink-2">Команда для Claude Code</span>
          <div class="flex gap-2">
            <InputText :model-value="mcpCommand" readonly class="flex-1 font-mono text-[13px]" aria-label="Команда" />
            <Button icon="pi pi-copy" severity="secondary" outlined aria-label="Копировать команду" @click="copy(mcpCommand)" />
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-base font-semibold">Производительность</h2>
        <div class="mt-4 grid grid-cols-2 gap-5">
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Заказов озвучки одновременно</span>
            <InputNumber v-model="cfg.lumean_parallel_orders" :min="1" :max="10" show-buttons />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-ink-2">Рендеров одновременно</span>
            <InputNumber v-model="cfg.parallel_renders" :min="1" :max="4" show-buttons />
          </label>
        </div>
        <p class="mt-3 text-[13px] text-ink-3">
          Каждый рендер сам использует все ядра процессора ({{ store.meta?.cpu_count }}). Энкодеры:
          {{ store.meta?.encoders.join(', ') }}.
        </p>
      </section>

      <section>
        <h2 class="text-base font-semibold">Хранилище</h2>
        <p class="mt-1 text-[13px] text-ink-3">
          Почти всё место занимают готовые видео. Сценарий, озвучка и картинки сохраняются всегда, поэтому удалённый ролик
          можно собрать заново. Почистить отдельный канал можно на его странице, во вкладке «Хранилище».
        </p>
        <label class="mt-4 flex flex-col gap-1.5">
          <span class="text-ink-2">Удалять видео опубликованных роликов через, дней</span>
          <div class="flex items-center gap-3">
            <InputNumber v-model="cfg.cleanup_published_after_days" :min="0" :max="365" show-buttons class="w-40" />
            <span class="text-[13px] text-ink-3">
              {{ cfg.cleanup_published_after_days ? 'вместе с картами глубины, проверка раз в час' : '0 — не удалять автоматически' }}
            </span>
          </div>
        </label>
        <StoragePanel class="mt-6" />
      </section>

      <section class="text-[13px] text-ink-3">
        <div>Папка данных: <span class="text-ink-2">{{ store.status?.data_dir }}</span></div>
        <div class="mt-1">{{ store.status?.ffmpeg ?? 'ffmpeg не найден — рендер недоступен' }}</div>
      </section>

      <div class="sticky bottom-0 -mx-8 flex justify-end border-t border-line-soft bg-bg/90 px-8 py-4 backdrop-blur">
        <Button type="submit" label="Сохранить" :loading="saving" />
      </div>
    </form>
  </div>
</template>
