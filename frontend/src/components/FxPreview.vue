<script setup lang="ts">
/**
 * Looping preview clip of one camera move, transition or atmosphere effect.
 * Rendered by the server from the channel's own images with the settings being
 * edited (not the saved ones); identical requests come straight from its cache.
 */
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { api } from '@/api/client'

export interface FxPreviewTarget {
  kind: 'motion' | 'transition' | 'atmosphere'
  effect: string
  title: string
}

const visible = defineModel<boolean>('visible', { required: true })
const props = defineProps<{
  target: FxPreviewTarget | null
  channelId?: number
  projectId?: number
  /** Settings to render with: render section values + atmosphere. */
  settings: () => Record<string, unknown>
}>()

const url = ref('')
const loading = ref(false)
const error = ref('')
const ownImages = ref(true)
const imageCount = ref(0)
const pick = ref(0)

async function load() {
  if (!props.target) return
  loading.value = true
  error.value = ''
  try {
    const res = await api.post<{ url: string; own_images: boolean; images: number }>('/api/fx-preview', {
      kind: props.target.kind,
      effect: props.target.effect,
      channel_id: props.channelId ?? null,
      project_id: props.projectId ?? null,
      pick: pick.value,
      settings: props.settings(),
    })
    url.value = res.url
    ownImages.value = res.own_images
    imageCount.value = res.images
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function anotherImage() {
  pick.value += props.target?.kind === 'transition' ? 2 : 1
  void load()
}

watch(
  () => [visible.value, props.target] as const,
  ([open]) => {
    if (open) {
      url.value = ''
      void load()
    }
  },
)
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="target?.title ?? 'Превью'" :style="{ width: 'min(820px, 96vw)' }">
    <div class="relative aspect-video overflow-hidden rounded-md bg-black">
      <video v-if="url" :key="url" :src="url" autoplay loop muted playsinline class="h-full w-full" />
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-ink-2">
        <i class="pi pi-spin pi-spinner" />Рендер превью…
      </div>
      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center p-6 text-center text-ink-2">{{ error }}</div>
    </div>
    <div class="mt-3 flex items-center justify-between gap-4">
      <p class="text-[13px] text-ink-3">
        <template v-if="ownImages">На картинке канала, с текущими настройками (ещё не сохранёнными).</template>
        <template v-else>В канале пока нет картинок — показано на условной заглушке.</template>
      </p>
      <div class="flex shrink-0 gap-2">
        <Button
          v-if="ownImages && imageCount > 1"
          label="Другая картинка"
          icon="pi pi-images"
          severity="secondary"
          size="small"
          :disabled="loading"
          @click="anotherImage"
        />
        <Button label="Обновить" icon="pi pi-refresh" severity="secondary" size="small" :disabled="loading" @click="load" />
      </div>
    </div>
  </Dialog>
</template>
