<script setup lang="ts">
/** Language code badge (flag emoji are not rendered by Windows browsers). */
defineProps<{ code: string }>()
</script>

<template>
  <span class="inline-flex h-[18px] min-w-[26px] items-center justify-center rounded-[4px] border border-line px-1 text-[10px] font-semibold uppercase leading-none tracking-wide text-ink-2">{{ code }}</span>
</template>
