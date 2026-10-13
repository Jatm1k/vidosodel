<script setup lang="ts">
/** Disk usage of the whole app or of one channel, and the clean-up buttons. */
import { computed, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { CleanupKind, StorageUsage } from '@/api/types'
import { useNotify } from '@/composables/useNotify'
import { bytes } from '@/composables/useFormat'

const props = defineProps<{ channelId?: number }>()
const notify = useNotify()
const confirm = useConfirm()

const usage = ref<StorageUsage | null>(null)
const loading = ref(false)
const cleaning = ref<CleanupKind | null>(null)

const query = computed(() => (props.channelId ? `?channel_id=${props.channelId}` : ''))

async function load() {
  loading.value = true
  try {
    usage.value = await api.get<StorageUsage>(`/api/storage${query.value}`)
  } catch (e) {
    notify.error(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(() => props.channelId, load)

const CATEGORIES: { id: string; label: string; color: string }[] = [
  { id: 'videos', label: 'Готовые видео', color: 'var(--color-tally)' },
  { id: 'images', label: 'Картинки сцен', color: 'var(--color-info)' },
  { id: 'audio', label: 'Озвучка', color: 'var(--color-ok)' },
  { id: 'depth', label: 'Карты глубины (3D)', color: '#c58be0' },
  { id: 'previews', label: 'Превью', color: '#e58f5a' },
  { id: 'work', label: 'Остатки прерванных рендеров', color: 'var(--color-bad)' },
  { id: 'orphans', label: 'Файлы удалённых проектов', color: '#9aa86a' },
  { id: 'thumbs', label: 'Обложки', color: '#62c0d8' },
  { id: 'characters', label: 'Портреты персонажей', color: '#d9c25b' },
  { id: 'other', label: 'Прочее', color: 'var(--color-ink-3)' },
]

const rows = computed(() =>
  CATEGORIES.map((c) => ({ ...c, bytes: usage.value?.categories[c.id]?.bytes ?? 0 }))
    .filter((c) => c.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes),
)

const ACTIONS: { id: CleanupKind; label: string; hint: string; danger?: boolean }[] = [
  {
    id: 'published_videos',
    label: 'Видео опубликованных роликов',
    hint: 'Файлы роликов, отмеченных как опубликованные. Сценарий, озвучка и картинки остаются — ролик можно собрать заново.',
    danger: true,
  },
  { id: 'depth', label: 'Карты глубины', hint: 'Нужны только для 3D-параллакса; следующий рендер посчитает их снова.' },
  { id: 'previews', label: 'Превью', hint: 'Короткие пробные рендеры.' },
  { id: 'work', label: 'Остатки прерванных рендеров', hint: 'Сегменты рендеров, которые были отменены или упали.' },
  {
    id: 'orphans',
    label: 'Файлы без проекта',
    hint: 'Папки удалённых проектов и языковых версий, старые видео, на которые ничего не ссылается.',
  },
]

function clean(kind: CleanupKind) {
  const action = ACTIONS.find((a) => a.id === kind)!
  const item = usage.value?.cleanable[kind]
  const run = async () => {
    cleaning.value = kind
    try {
      const r = await api.post<{ freed: number; files: number; usage: StorageUsage }>('/api/storage/cleanup', {
        kinds: [kind],
        channel_id: props.channelId ?? null,
      })
      usage.value = r.usage
      notify.ok(r.freed ? `Освобождено ${bytes(r.freed)}` : 'Нечего удалять')
    } catch (e) {
      notify.error(e)
    } finally {
      cleaning.value = null
    }
  }
  if (!action.danger) return run()
  confirm.require({
    header: 'Удалить видео опубликованных роликов?',
    message: `Будет удалено ${item?.files ?? 0} видео (${bytes(item?.bytes)}). Пересобрать ролик можно в любой момент: всё, из чего он сделан, сохранится.`,
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', text: true },
    accept: run,
  })
}
</script>

<template>
  <div>
    <div class="flex items-baseline gap-3">
      <span class="font-display text-2xl font-semibold tnum">{{ usage ? bytes(usage.total) : '…' }}</span>
      <span class="text-ink-3">{{ channelId ? 'занимают проекты канала' : 'занимают все проекты' }}</span>
      <Button
        icon="pi pi-refresh"
        text
        severity="secondary"
        size="small"
        class="ml-auto"
        aria-label="Пересчитать"
        :loading="loading"
        @click="load"
      />
    </div>

    <template v-if="usage && usage.total">
      <div class="mt-3 flex h-2.5 overflow-hidden rounded-full bg-raised" role="img" aria-label="Распределение места">
        <span
          v-for="r in rows"
          :key="r.id"
          class="h-full"
          :style="{ width: `${(r.bytes / usage.total) * 100}%`, background: r.color }"
          :title="`${r.label}: ${bytes(r.bytes)}`"
        />
      </div>
      <ul class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-1.5 text-[13px]">
        <li v-for="r in rows" :key="r.id" class="flex items-center gap-2">
          <span class="h-2 w-2 shrink-0 rounded-full" :style="{ background: r.color }" />
          <span class="text-ink-2">{{ r.label }}</span>
          <span class="tnum ml-auto text-ink">{{ bytes(r.bytes) }}</span>
        </li>
      </ul>
    </template>

    <div v-if="usage" class="mt-6 divide-y divide-line-soft rounded-lg border border-line-soft">
      <div v-for="a in ACTIONS" :key="a.id" class="flex items-center gap-4 px-4 py-3">
        <div class="min-w-0 flex-1">
          <div class="text-ink">{{ a.label }}</div>
          <div class="text-[13px] leading-snug text-ink-3">{{ a.hint }}</div>
        </div>
        <span class="tnum shrink-0 text-[13px]" :class="usage.cleanable[a.id].bytes ? 'text-ink' : 'text-ink-3'">
          {{ usage.cleanable[a.id].bytes ? bytes(usage.cleanable[a.id].bytes) : 'пусто' }}
        </span>
        <Button
          label="Очистить"
          size="small"
          :severity="a.danger ? 'danger' : 'secondary'"
          outlined
          :disabled="!usage.cleanable[a.id].bytes || (cleaning !== null && cleaning !== a.id)"
          :loading="cleaning === a.id"
          @click="clean(a.id)"
        />
      </div>
    </div>
    <p v-if="usage" class="mt-3 text-[13px] text-ink-3">
      Файлы роликов, которые сейчас рендерятся или стоят в очереди на рендер, не трогаются.
      <template v-if="usage.auto_days">
        Видео опубликованных роликов удаляются автоматически через {{ usage.auto_days }} дн. после публикации.
      </template>
      <template v-else>Автоочистка выключена — её можно включить в общих настройках приложения.</template>
    </p>
  </div>
</template>
