<script setup lang="ts">
/** One scene of the storyboard: image, voice-over fragment, editable prompt and actions. */
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { api } from '@/api/client'
import type { Scene } from '@/api/types'
import { timecode } from '@/composables/useFormat'
import { useNotify } from '@/composables/useNotify'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  scene: Scene; trackId: number; selected: boolean; readonlyPrompt: boolean; isLast: boolean
  /** Model the project plan assigns to this scene (null for borrowed images). */
  plannedOp?: string | null
}>()
const emit = defineEmits<{
  updated: [scene: Scene]
  replaced: [scenes: Scene[]]
  regenerateImage: [id: number]
  regeneratePrompt: [id: number]
  open: [scene: Scene]
}>()

const store = useAppStore()
const notify = useNotify()
const prompt = ref(props.scene.prompt)
const menu = ref()
const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)

watch(() => props.scene.prompt, (v) => (prompt.value = v))

const busy = computed(() => props.scene.image_status === 'generating' || props.scene.image_status === 'queued')
const effectOptions = computed(() => [{ id: null, name: 'Случайное' }, ...(store.meta?.effects ?? [])])
const transitionOptions = computed(() => [{ id: null, name: 'Случайный' }, { id: 'cut', name: 'Склейка' }, ...(store.meta?.transitions ?? [])])
const ops = computed(() => store.meta?.image_operations ?? [])
const opShort = (id?: string | null) => ops.value.find((o) => o.id === id)?.short ?? null
/** "Auto" shows which model the plan picked; a fixed model sticks to this scene for every regeneration. */
const modelOptions = computed(() => {
  const plannedShort = opShort(props.scene.overrides.operation ? null : props.plannedOp)
  return [
    { id: null, name: plannedShort ? `Модель: авто · ${plannedShort}` : 'Модель: авто' },
    ...ops.value.map((o) => ({ id: o.id, name: `${o.name} · ${o.credits} кр.` })),
  ]
})
const usedModel = computed(() => opShort(props.scene.image_meta?.operation))

async function savePrompt() {
  if (prompt.value.trim() === props.scene.prompt.trim()) return
  try {
    emit('updated', await api.patch<Scene>(`/api/scenes/${props.scene.id}`, { prompt: prompt.value }))
  } catch (e) {
    notify.error(e)
  }
}

async function setOverride(key: 'effect' | 'transition' | 'operation', value: string | null) {
  const overrides = { ...props.scene.overrides, [key]: value || undefined }
  emit('updated', await api.patch<Scene>(`/api/scenes/${props.scene.id}`, { overrides }))
}

async function upload(ev: Event) {
  const f = (ev.target as HTMLInputElement).files?.[0]
  ;(ev.target as HTMLInputElement).value = ''
  if (!f) return
  uploading.value = true
  try {
    emit('updated', await api.upload<Scene>(`/api/scenes/${props.scene.id}/image`, f))
  } catch (e) {
    notify.error(e)
  } finally {
    uploading.value = false
  }
}

const menuItems = computed(() => [
  { label: 'Загрузить свою картинку', icon: 'pi pi-upload', command: () => fileInput.value?.click() },
  ...(props.readonlyPrompt ? [] : [{ label: 'Новый промпт от LLM', icon: 'pi pi-sparkles', command: () => emit('regeneratePrompt', props.scene.id) }]),
  { separator: true },
  { label: 'Разделить пополам', icon: 'pi pi-arrows-h', command: () => restructure('split') },
  { label: 'Объединить со следующей', icon: 'pi pi-link', disabled: props.isLast, command: () => restructure('merge-next') },
])

async function restructure(action: 'split' | 'merge-next') {
  try {
    emit('replaced', await api.post<Scene[]>(`/api/scenes/${props.scene.id}/${action}`, {}))
  } catch (e) {
    notify.error(e)
  }
}
</script>

<template>
  <article
    :id="`scene-${scene.id}`"
    class="grid grid-cols-[minmax(0,17rem)_minmax(0,1fr)] gap-5 border-b border-line-soft px-4 py-4 transition-colors"
    :class="selected ? 'bg-tally/[0.05]' : ''"
  >
    <div class="relative">
      <button
        class="relative block aspect-video w-full overflow-hidden rounded-md bg-raised"
        :aria-label="`Открыть картинку сцены ${scene.idx + 1}`"
        @click="scene.image_url && emit('open', scene)"
      >
        <img v-if="scene.image_url" :src="scene.image_url" alt="" loading="lazy" class="h-full w-full object-cover" :class="busy ? 'opacity-40' : ''" />
        <span v-if="busy" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[13px] text-tally">
          <i class="pi pi-spin pi-spinner" />{{ scene.image_status === 'queued' ? 'В очереди' : 'Генерация' }}
        </span>
        <span v-else-if="!scene.image_url" class="absolute inset-0 flex items-center justify-center text-[13px]" :class="scene.image_status === 'failed' ? 'text-bad' : 'text-ink-3'">
          {{ scene.image_status === 'failed' ? 'Ошибка генерации' : 'Нет картинки' }}
        </span>
      </button>
      <span v-if="scene.shared" class="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 text-[11px] leading-5 text-white/80">общая</span>
      <span
        v-if="scene.image_url && usedModel && !busy"
        class="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 text-[11px] leading-5 text-white/80"
        :title="scene.image_meta?.watermark_removed ? 'Водяной знак удалён' : undefined"
      >{{ usedModel }}<i v-if="scene.image_meta?.watermark_removed" class="pi pi-eraser ml-1 text-[9px]" /></span>
    </div>

    <div class="flex min-w-0 flex-col gap-2.5">
      <div class="flex items-start gap-3">
        <span class="tnum shrink-0 pt-0.5 text-[13px] text-ink-3">
          <b class="font-semibold text-ink-2">{{ scene.idx + 1 }}</b>&nbsp; {{ timecode(scene.start) }} · {{ (scene.end - scene.start).toFixed(1) }} с
        </span>
        <p class="min-w-0 flex-1 text-ink">{{ scene.text }}</p>
        <div class="flex shrink-0 gap-0.5">
          <Button
            v-if="!scene.shared"
            icon="pi pi-refresh"
            text
            rounded
            size="small"
            severity="secondary"
            :disabled="busy || !scene.prompt"
            :aria-label="scene.image_url ? 'Перегенерировать картинку' : 'Сгенерировать картинку'"
            v-tooltip.top="scene.image_url ? 'Перегенерировать картинку' : 'Сгенерировать картинку'"
            @click="emit('regenerateImage', scene.id)"
          />
          <Button icon="pi pi-ellipsis-v" text rounded size="small" severity="secondary" aria-label="Действия со сценой" :loading="uploading" @click="(e) => menu.toggle(e)" />
          <Menu ref="menu" :model="menuItems" popup />
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="upload" />
        </div>
      </div>

      <Textarea
        v-if="!readonlyPrompt"
        v-model="prompt"
        auto-resize
        rows="2"
        class="w-full !text-[13px] !leading-relaxed !text-ink-2"
        placeholder="Промпт для картинки (на английском). Создайте промпты кнопкой вверху или напишите свой."
        @blur="savePrompt"
      />
      <p v-else-if="scene.prompt" class="text-[13px] leading-relaxed text-ink-3">{{ scene.prompt }}</p>

      <div v-if="scene.image_error && scene.image_status === 'failed'" class="text-[13px] text-bad">{{ scene.image_error }}</div>

      <div class="flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
        <span v-if="scene.prompt_locked" class="flex items-center gap-1"><i class="pi pi-pencil text-[11px]" />промпт изменён вручную</span>
        <span v-if="scene.image_meta?.original_prompt" class="flex items-center gap-1" :title="scene.image_meta.original_prompt">
          <i class="pi pi-shield text-[11px]" />промпт смягчён после отказа модели
        </span>
        <div class="ml-auto flex items-center gap-2">
          <Select
            v-if="!scene.shared && plannedOp !== null"
            :model-value="scene.overrides.operation ?? null"
            :options="modelOptions"
            option-value="id"
            option-label="name"
            :placeholder="modelOptions[0].name"
            size="small"
            class="w-48"
            aria-label="Модель для этой сцены"
            @update:model-value="(v: string | null) => setOverride('operation', v)"
          />
          <Select
            :model-value="scene.overrides.effect ?? null"
            :options="effectOptions"
            option-value="id"
            option-label="name"
            placeholder="Случайное"
            size="small"
            class="w-44"
            aria-label="Движение камеры"
            @update:model-value="(v: string | null) => setOverride('effect', v)"
          />
          <Select
            v-if="scene.idx > 0"
            :model-value="scene.overrides.transition ?? null"
            :options="transitionOptions"
            option-value="id"
            option-label="name"
            placeholder="Случайный"
            size="small"
            class="w-40"
            aria-label="Переход в эту сцену"
            @update:model-value="(v: string | null) => setOverride('transition', v)"
          />
        </div>
      </div>
    </div>
  </article>
</template>
