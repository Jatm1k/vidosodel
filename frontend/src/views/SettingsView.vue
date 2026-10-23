<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Slider from 'primevue/slider'
import ToggleSwitch from 'primevue/toggleswitch'
import { api } from '@/api/client'
import type { AppConfig } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'
import StoragePanel from '@/components/StoragePanel.vue'

const store = useAppStore()
const notify = useNotify()
const cfg = ref<AppConfig | null>(null)
const saving = ref(false)
const checks = ref<Record<string, { ok: boolean; error?: string } | 'pending'>>({})

onMounted(async () => {
  cfg.value = await api.get<AppConfig>('/api/settings')
})

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

async function check(service: 'lumean' | 'fastgen' | 'llm_fallback') {
  await save()
  checks.value[service] = 'pending'
  checks.value[service] = await api.post('/api/settings/check', { service })
  if (service === 'fastgen') cfg.value = await api.get<AppConfig>('/api/settings')
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-8 py-8">
    <h1 class="font-display text-2xl font-semibold">Настройки</h1>
    <p class="mt-1 text-ink-3">Общие для всех каналов. Голос, стиль и монтаж задаются в настройках каждого канала.</p>

    <form v-if="cfg" class="mt-8 flex flex-col gap-10" @submit.prevent="save">
      <section>
        <h2 class="text-base font-semibold">Ключи API</h2>
        <p class="mt-1 text-[13px] text-ink-3">Хранятся локально в базе приложения. Ключи из файла .env используются, если здесь пусто.</p>
        <div class="mt-4 flex flex-col gap-5">
          <div v-for="svc in (['lumean', 'fastgen'] as const)" :key="svc" class="flex flex-col gap-1.5">
            <label :for="`key-${svc}`" class="text-ink-2">
              {{ svc === 'lumean' ? 'Lumean — озвучка' : 'FastGen — изображения, тексты, распознавание речи' }}
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
          приложение ждёт следующего часа.
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
