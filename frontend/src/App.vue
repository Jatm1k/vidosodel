<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppSidebar from '@/components/AppSidebar.vue'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'

const store = useAppStore()
const ready = ref(false)
const failed = ref('')
const notify = useNotify()

onMounted(async () => {
  try {
    await store.init()
    // Any failed background step is announced wherever the user is.
    store.onEvent((e) => {
      if (e.type === 'job' && e.job.status === 'failed') {
        notify.error(e.job.error ?? 'Подробности — в очереди задач', `${e.job.title ?? 'Задача'}: ошибка`)
      }
    })
  } catch (e) {
    failed.value = (e as Error).message
  } finally {
    ready.value = true
  }
})
</script>

<template>
  <div class="flex h-full">
    <AppSidebar />
    <main class="min-w-0 flex-1 overflow-y-auto">
      <div v-if="failed" class="mx-auto max-w-xl p-10 text-center">
        <h1 class="font-display text-xl">Не удалось подключиться к приложению</h1>
        <p class="mt-3 text-ink-2">{{ failed }}</p>
      </div>
      <RouterView v-else-if="ready" v-slot="{ Component, route }">
        <component :is="Component" :key="route.path" />
      </RouterView>
    </main>
    <Toast position="bottom-right" />
    <ConfirmDialog />
  </div>
</template>
