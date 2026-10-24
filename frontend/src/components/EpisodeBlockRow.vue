<script setup lang="ts">
/**
 * One screenplay block: who speaks, the text, delivery, place and shot, plus its voiced clip.
 * Fields are saved when they lose focus; a changed text/delivery marks the clip as outdated.
 */
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import type { EpisodeBlock, SeriesCharacter, SeriesRef } from '@/api/types'
import { timecode } from '@/composables/useFormat'

const props = defineProps<{
  block: EpisodeBlock
  index: number
  characters: SeriesCharacter[]
  locations: SeriesRef[]
  busy: boolean
}>()
const emit = defineEmits<{
  patch: [body: Record<string, unknown>]
  voice: []
  remove: []
  insert: [kind: 'narration' | 'line' | 'pause']
  move: [delta: number]
}>()

const draft = ref({ ...props.block })
// Fresh server data replaces only the fields the user is not editing right now.
watch(() => props.block, (next, prev) => {
  const d = draft.value as Record<string, unknown>
  for (const key of Object.keys(next) as (keyof EpisodeBlock)[]) {
    if (!prev || d[key] === prev[key]) d[key] = next[key]
  }
})
const showShot = ref(!!props.block.visual)
const menu = ref()

const speakerColor = computed(() => {
  if (props.block.kind !== 'line') return undefined
  const palette = ['#7aa5e8', '#5fb3a1', '#c58be0', '#e58f5a', '#d9c25b', '#e56a8d', '#62c0d8', '#9aa86a']
  const idx = props.characters.findIndex((c) => c.id === props.block.character_id)
  return palette[(idx < 0 ? 0 : idx) % palette.length]
})

const status = computed(() => {
  const b = props.block
  if (b.kind === 'pause') return null
  if (b.audio_status === 'generating' || b.audio_status === 'queued') return { text: 'озвучивается…', tone: 'text-info' }
  if (b.audio_status === 'failed') return { text: 'ошибка озвучки', tone: 'text-bad' }
  if (b.audio_stale) return { text: 'изменён — переозвучить', tone: 'text-tally' }
  if (b.audio_status === 'done') return { text: `${b.audio_provider === 'gemini' ? 'Gemini' : 'Lumean'} · ${b.audio_duration?.toFixed(1)} с`, tone: 'text-ink-3' }
  return { text: 'не озвучен', tone: 'text-ink-3' }
})

function commit(field: keyof EpisodeBlock, value: unknown) {
  if ((props.block as any)[field] === value) return
  emit('patch', { [field]: value })
}

const menuItems = computed(() => [
  { label: 'Переозвучить (новый дубль)', icon: 'pi pi-refresh', disabled: props.block.kind === 'pause' || props.busy, command: () => emit('voice') },
  { label: 'Вставить диктора ниже', icon: 'pi pi-plus', command: () => emit('insert', 'narration') },
  { label: 'Вставить реплику ниже', icon: 'pi pi-plus', command: () => emit('insert', 'line') },
  { label: 'Вставить паузу ниже', icon: 'pi pi-plus', command: () => emit('insert', 'pause') },
  { label: 'Выше', icon: 'pi pi-arrow-up', command: () => emit('move', -1) },
  { label: 'Ниже', icon: 'pi pi-arrow-down', command: () => emit('move', 1) },
  { separator: true },
  { label: 'Удалить блок', icon: 'pi pi-trash', command: () => emit('remove') },
])
</script>

<template>
  <div class="group flex gap-3 border-l-2 py-3 pl-3 pr-2" :style="{ borderColor: speakerColor ?? 'transparent' }">
    <div class="w-12 shrink-0 pt-1.5 text-right">
      <div class="tnum text-xs text-ink-3">{{ index + 1 }}</div>
      <div v-if="block.start != null" class="tnum text-[11px] text-ink-3">{{ timecode(block.start) }}</div>
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <template v-if="block.kind === 'line'">
          <Select :model-value="block.character_id" :options="characters" option-label="name" option-value="id"
                  size="small" class="min-w-36" aria-label="Говорящий" @update:model-value="(v) => commit('character_id', v)" />
          <InputText v-model="draft.direction" size="small" class="min-w-0 flex-1" placeholder="Подача: шёпотом, со злостью…"
                     aria-label="Подача" @blur="commit('direction', draft.direction)" />
        </template>
        <span v-else-if="block.kind === 'narration'" class="text-[13px] font-medium text-ink-2">Диктор</span>
        <span v-else class="text-[13px] font-medium text-ink-2">Пауза</span>
        <div class="flex-1" />
        <Select :model-value="block.location_id" :options="[{ id: null, name: '— место не меняется —' }, ...locations]"
                option-label="name" option-value="id" size="small" class="w-48" aria-label="Локация"
                @update:model-value="(v) => commit('location_id', v)" />
        <Button icon="pi pi-image" size="small" text :severity="block.visual ? 'primary' : 'secondary'"
                v-tooltip.top="'Что показать в кадре'" aria-label="Кадр" @click="showShot = !showShot" />
        <Button icon="pi pi-ellipsis-v" size="small" text severity="secondary" aria-label="Действия с блоком" @click="(e) => menu.toggle(e)" />
        <Menu ref="menu" :model="menuItems" popup />
      </div>
      <Textarea v-if="block.kind !== 'pause'" v-model="draft.text" rows="1" auto-resize class="mt-2 w-full"
                :aria-label="block.kind === 'line' ? 'Реплика' : 'Текст диктора'" @blur="commit('text', draft.text)" />
      <div v-else class="mt-2 flex items-center gap-2 text-[13px] text-ink-3">
        <InputNumber v-model="draft.pause" :min="0.1" :max="30" :step="0.5" :min-fraction-digits="1" size="small"
                     input-class="w-20" aria-label="Длина паузы" @blur="commit('pause', draft.pause)" /> с тишины
      </div>
      <div v-if="showShot" class="mt-2 flex items-center gap-2">
        <InputText v-model="draft.visual" size="small" class="flex-1" placeholder="Кадр по-английски: wide shot of…"
                   aria-label="Кадр" @blur="commit('visual', draft.visual)" />
        <InputNumber v-model="draft.shots" :min="1" :max="12" size="small" input-class="w-14" placeholder="авто"
                     v-tooltip.top="'Сколько картинок на блок'" aria-label="Картинок на блок" @blur="commit('shots', draft.shots)" />
      </div>
      <div v-if="block.kind !== 'pause'" class="mt-2 flex items-center gap-3">
        <audio v-if="block.audio_url" :src="block.audio_url" controls preload="none" class="h-7 w-64" />
        <span v-if="status" class="text-[12px]" :class="status.tone">{{ status.text }}</span>
        <span v-if="block.audio_warning" class="text-[12px] text-tally" v-tooltip.top="block.audio_warning"><i class="pi pi-exclamation-triangle" /></span>
        <span v-if="block.audio_error && block.audio_status !== 'generating'" class="truncate text-[12px] text-bad" :title="block.audio_error">{{ block.audio_error }}</span>
      </div>
    </div>
  </div>
</template>
