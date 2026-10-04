<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useAppStore } from '@/stores/app'
import { api } from '@/api/client'
import type { Channel } from '@/api/types'
import { useNotify } from '@/composables/useNotify'
import UpdateNotice from './UpdateNotice.vue'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const notify = useNotify()

const showCreate = ref(false)
const newName = ref('')
const palette = ['#7aa5e8', '#5fb3a1', '#c58be0', '#e58f5a', '#d9c25b', '#e56a8d', '#62c0d8', '#9aa86a']

const budget = computed(() => store.status?.fastgen)
const budgetPct = computed(() => (budget.value ? Math.min(100, (budget.value.used / budget.value.budget) * 100) : 0))
const tokens = computed(() => store.status?.llm)
const tokensPct = computed(() => (tokens.value ? Math.min(100, (tokens.value.used / tokens.value.budget) * 100) : 0))
const thousands = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)} тыс.` : String(n))

// FastGen zeroes its counters at the top of every hour; tick locally so the countdown stays live between polls.
const now = ref(Date.now() / 1000)
const clock = setInterval(() => (now.value = Date.now() / 1000), 20000)
onUnmounted(() => clearInterval(clock))

function resetLabel(resetAt?: number) {
  if (!resetAt) return ''
  const time = new Date(resetAt * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const min = Math.max(1, Math.ceil((resetAt - now.value) / 60))
  return `${time} (через ${min} мин)`
}

function isActive(path: string) {
  return route.path === path || (path !== '/' && route.path.startsWith(path))
}

async function createChannel() {
  if (!newName.value.trim()) return
  try {
    const color = palette[store.channels.length % palette.length]
    const ch = await api.post<Channel>('/api/channels', { name: newName.value.trim(), color })
    await store.loadChannels()
    showCreate.value = false
    newName.value = ''
    router.push(`/channels/${ch.id}?tab=settings`)
  } catch (e) {
    notify.error(e)
  }
}
</script>

<template>
  <aside class="flex w-64 shrink-0 flex-col border-r border-line-soft bg-panel">
    <RouterLink to="/" class="flex items-center gap-2.5 px-5 pb-5 pt-6">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="7" width="8" height="18" rx="2" fill="#f0b03c" />
        <rect x="12" y="7" width="12" height="18" rx="2" fill="#5f6b80" />
        <rect x="26" y="7" width="4" height="18" rx="2" fill="#5f6b80" />
      </svg>
      <span class="font-display text-[17px] font-semibold">Vidosodel</span>
    </RouterLink>

    <nav class="flex flex-col gap-0.5 px-3">
      <RouterLink
        v-for="item in [
          { to: '/', icon: 'pi-home', label: 'Обзор' },
          { to: '/jobs', icon: 'pi-list-check', label: 'Очередь задач' },
          { to: '/settings', icon: 'pi-cog', label: 'Настройки' },
        ]"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-ink-2 transition-colors hover:bg-raised hover:text-ink"
        :class="isActive(item.to) && (item.to !== '/' || route.path === '/') ? 'bg-raised !text-ink' : ''"
      >
        <i :class="['pi', item.icon]" class="text-[15px]" />
        <span class="flex-1">{{ item.label }}</span>
        <span
          v-if="item.to === '/jobs' && store.activeJobs.length"
          class="tnum rounded-full bg-tally px-2 text-xs font-semibold leading-5 text-tally-ink"
        >{{ store.activeJobs.length }}</span>
      </RouterLink>
    </nav>

    <div class="mt-7 flex items-center justify-between px-5 pb-2">
      <span class="text-[13px] font-medium text-ink-3">Каналы</span>
      <button
        class="flex h-6 w-6 items-center justify-center rounded text-ink-3 hover:bg-raised hover:text-ink"
        aria-label="Создать канал"
        v-tooltip.right="'Новый канал'"
        @click="showCreate = true"
      >
        <i class="pi pi-plus text-xs" />
      </button>
    </div>
    <div class="flex-1 overflow-y-auto px-3">
      <RouterLink
        v-for="ch in store.channels"
        :key="ch.id"
        :to="`/channels/${ch.id}`"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-ink-2 transition-colors hover:bg-raised hover:text-ink"
        :class="route.path === `/channels/${ch.id}` ? 'bg-raised !text-ink' : ''"
      >
        <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: ch.color }" />
        <span class="flex-1 truncate">{{ ch.name }}</span>
        <span class="tnum text-xs text-ink-3">{{ ch.projects_count }}</span>
      </RouterLink>
      <button
        v-if="!store.channels.length"
        class="w-full rounded-md border border-dashed border-line px-3 py-3 text-left text-ink-3 hover:border-ink-3 hover:text-ink-2"
        @click="showCreate = true"
      >
        Создайте первый канал: у каждого свой голос, стиль картинок и монтаж.
      </button>
    </div>

    <div class="border-t border-line-soft px-5 py-4">
      <div v-if="budget" class="mb-3">
        <div class="mb-1.5 flex items-baseline justify-between text-xs">
          <span class="text-ink-3">FastGen за час</span>
          <span class="tnum text-ink-2">{{ budget.used }} / {{ budget.budget }}</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-raised">
          <div
            class="h-full rounded-full transition-all"
            :class="budgetPct > 90 ? 'bg-bad' : 'bg-ink-3'"
            :style="{ width: `${budgetPct}%` }"
          />
        </div>
        <div class="mt-1.5 text-xs text-ink-3">
          Потоков занято: <span class="tnum">{{ budget.active }}/{{ budget.threads }}</span>
          <template v-if="budget.waiting"> · ждут: {{ budget.waiting }}</template>
        </div>
        <div v-if="budget.used" class="mt-0.5 text-xs" :class="budget.used >= budget.budget ? 'text-bad' : 'text-ink-3'">
          {{ budget.used >= budget.budget ? 'Исчерпан до' : 'Сброс в' }} {{ resetLabel(budget.reset_at) }}
        </div>
      </div>
      <div v-if="tokens" class="mb-3">
        <div class="mb-1.5 flex items-baseline justify-between text-xs">
          <span class="text-ink-3">LLM за час</span>
          <span class="tnum text-ink-2">{{ thousands(tokens.used) }} / {{ thousands(tokens.budget) }}</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-raised">
          <div class="h-full rounded-full transition-all" :class="tokensPct > 90 ? 'bg-bad' : 'bg-ink-3'" :style="{ width: `${tokensPct}%` }" />
        </div>
        <div v-if="tokens.used" class="mt-1.5 text-xs" :class="tokens.used >= tokens.budget ? 'text-bad' : 'text-ink-3'">
          {{ tokens.used >= tokens.budget ? 'Исчерпан до' : 'Сброс в' }} {{ resetLabel(tokens.reset_at) }}
          <template v-if="tokens.waiting"> · ждут: {{ tokens.waiting }}</template>
        </div>
      </div>
      <div class="flex items-center gap-2 text-xs" :class="store.connected ? 'text-ink-3' : 'text-bad'">
        <span class="h-1.5 w-1.5 rounded-full" :class="store.connected ? 'bg-ok' : 'bg-bad'" />
        {{ store.connected ? 'Подключено' : 'Нет связи с сервером' }}
      </div>
      <UpdateNotice />
    </div>

    <Dialog v-model:visible="showCreate" modal header="Новый канал" :style="{ width: '26rem' }">
      <form class="flex flex-col gap-4" @submit.prevent="createChannel">
        <label class="flex flex-col gap-1.5">
          <span class="text-ink-2">Название</span>
          <InputText v-model="newName" autofocus placeholder="Например, «Психология отношений»" />
        </label>
        <p class="text-[13px] text-ink-3">
          После создания откроются настройки канала: голос, стиль картинок, анимация и субтитры.
        </p>
        <div class="flex justify-end gap-2">
          <Button label="Отмена" severity="secondary" text @click="showCreate = false" />
          <Button type="submit" label="Создать канал" :disabled="!newName.trim()" />
        </div>
      </form>
    </Dialog>
  </aside>
</template>
