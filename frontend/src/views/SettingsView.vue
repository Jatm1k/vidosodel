<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Slider from 'primevue/slider'
import { api } from '@/api/client'
import type { AppConfig } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'

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

async function check(service: 'lumean' | 'fastgen') {
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
          <div class="col-span-2 flex flex-col gap-2">
            <span class="text-ink-2">
              Доля бюджета для приложения: <span class="tnum text-ink">{{ Math.round(cfg.fastgen_budget_ratio * 100) }}%</span>
            </span>
            <Slider v-model="cfg.fastgen_budget_ratio" :min="0.1" :max="1" :step="0.05" />
            <span class="text-[13px] text-ink-3">Уменьшите, если тем же ключом пользуются другие инструменты.</span>
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
