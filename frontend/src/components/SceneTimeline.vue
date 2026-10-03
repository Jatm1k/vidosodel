<script setup lang="ts">
/**
 * NLE-style strip: every scene is a block whose width is proportional to its
 * duration, filled with its image. Shows the rhythm of the edit at a glance.
 */
import { computed, ref } from 'vue'
import type { Scene } from '@/api/types'
import { timecode } from '@/composables/useFormat'

const props = defineProps<{ scenes: Scene[]; duration: number; selected: number | null }>()
const emit = defineEmits<{ select: [id: number] }>()

const zoom = ref(14) // px per second
const total = computed(() => Math.max(props.duration, props.scenes.at(-1)?.end ?? 0, 1))
const width = computed(() => Math.max(total.value * zoom.value, 300))
const ticks = computed(() => {
  const step = zoom.value >= 20 ? 10 : zoom.value >= 8 ? 30 : 60
  const out: number[] = []
  for (let t = 0; t <= total.value; t += step) out.push(t)
  return out
})
</script>

<template>
  <div class="rounded-lg border border-line-soft bg-panel">
    <div class="flex items-center justify-between gap-4 px-4 pt-3">
      <span class="text-[13px] text-ink-3">Монтажная лента</span>
      <label class="flex items-center gap-2 text-[13px] text-ink-3">
        <i class="pi pi-search-minus text-xs" />
        <input v-model.number="zoom" type="range" min="2" max="60" step="1" class="w-28 accent-[var(--color-tally)]" aria-label="Масштаб ленты" />
        <i class="pi pi-search-plus text-xs" />
      </label>
    </div>
    <div class="overflow-x-auto px-4 pb-3 pt-2">
      <div class="relative" :style="{ width: `${width}px` }">
        <div class="relative h-5">
          <span
            v-for="t in ticks"
            :key="t"
            class="tnum absolute top-0 border-l border-line pl-1 text-[11px] leading-4 text-ink-3"
            :style="{ left: `${t * zoom}px` }"
          >{{ timecode(t) }}</span>
        </div>
        <div class="relative h-16">
          <button
            v-for="s in scenes"
            :key="s.id"
            class="absolute top-0 h-full overflow-hidden border-r-2 border-panel bg-raised transition-[filter]"
            :class="[
              selected === s.id ? 'z-10 outline outline-2 -outline-offset-2 outline-tally' : 'hover:brightness-125',
              s.image_status === 'failed' ? 'bg-bad/30' : '',
            ]"
            :style="{ left: `${s.start * zoom}px`, width: `${Math.max(2, (s.end - s.start) * zoom)}px` }"
            :title="`${s.idx + 1}. ${timecode(s.start)}–${timecode(s.end)}\n${s.text}`"
            @click="emit('select', s.id)"
          >
            <img v-if="s.image_url" :src="s.image_url" alt="" loading="lazy" class="h-full w-full object-cover" />
            <span
              v-else-if="s.image_status === 'generating' || s.image_status === 'queued'"
              class="stripes absolute inset-0"
              :class="s.image_status === 'generating' ? 'bg-tally/25' : ''"
            />
            <span
              v-if="(s.end - s.start) * zoom > 26"
              class="tnum absolute bottom-0.5 left-1 rounded bg-black/55 px-1 text-[10px] leading-4 text-white/85"
            >{{ s.idx + 1 }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
