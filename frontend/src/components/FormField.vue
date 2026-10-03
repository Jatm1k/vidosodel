<script setup lang="ts">
/** Label + control + optional hint, laid out as a settings row. */
defineProps<{ label: string; hint?: string; value?: string | number | null; stacked?: boolean }>()
</script>

<template>
  <div :class="stacked ? 'flex flex-col gap-2' : 'grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1'">
    <div class="pt-1.5">
      <div class="flex items-baseline gap-2 text-ink">
        {{ label }}
        <span v-if="value !== undefined && value !== null" class="tnum text-[13px] text-tally">{{ value }}</span>
      </div>
      <div v-if="hint && !stacked" class="mt-0.5 text-[13px] leading-snug text-ink-3">{{ hint }}</div>
    </div>
    <div class="min-w-0">
      <slot />
      <div v-if="hint && stacked" class="mt-1 text-[13px] text-ink-3">{{ hint }}</div>
    </div>
  </div>
</template>
