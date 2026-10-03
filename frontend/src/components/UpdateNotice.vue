<script setup lang="ts">
/**
 * Installed version in the sidebar footer. When GitHub has a newer version it
 * shows a badge; the dialog lists the changelog and installs the update
 * (git pull on the server, then the launcher restarts it).
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { api } from '@/api/client'
import type { VersionState } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from '@/composables/useNotify'

const store = useAppStore()
const notify = useNotify()
const state = ref<VersionState | null>(null)
const open = ref(false)
const checking = ref(false)
const phase = ref<'idle' | 'installing' | 'restarting'>('idle')

const update = computed(() => state.value?.update ?? null)
const available = computed(() => !!update.value?.available)

async function load() {
  try {
    state.value = await api.get<VersionState>('/api/system/version')
  } catch {
    /* the server may be restarting */
  }
}
async function checkNow() {
  checking.value = true
  try {
    state.value = await api.post<VersionState>('/api/system/version/check')
    if (!state.value.update?.available) notify.ok('Установлена последняя версия')
  } catch (e) {
    notify.error(e)
  } finally {
    checking.value = false
  }
}

/** Changelog markdown → simple blocks (### headings and "- " items). */
function blocks(body: string) {
  return body.split('\n').map((l) => l.trim()).filter(Boolean).map((l) =>
    l.startsWith('### ') ? { kind: 'h' as const, text: l.slice(4) }
      : { kind: 'li' as const, text: l.replace(/^[-*]\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1') },
  )
}

async function install() {
  phase.value = 'installing'
  try {
    const r = await api.post<{ ok: boolean; restarting: boolean; message: string }>('/api/system/update')
    if (!r.restarting) {
      phase.value = 'idle'
      notify.info(r.message)
      await load()
      return
    }
    phase.value = 'restarting'
    const before = state.value?.version
    // Wait for the server to go down and come back with the new version, then reload the UI.
    await new Promise((res) => setTimeout(res, 3000))
    for (let i = 0; i < 180; i++) {
      try {
        const s = await api.get<VersionState>('/api/system/version')
        if (s.version !== before || i > 20) {
          window.location.reload()
          return
        }
      } catch {
        /* still restarting */
      }
      await new Promise((res) => setTimeout(res, 2000))
    }
    phase.value = 'idle'
    notify.error('Сервер не поднялся после обновления. Посмотрите окно консоли Vidosodel.')
  } catch (e) {
    phase.value = 'idle'
    notify.error(e)
  }
}

let timer: number | undefined
onMounted(() => {
  void load()
  // The server re-checks GitHub every few hours; refresh the cached result now and then.
  timer = window.setInterval(load, 15 * 60 * 1000)
})
onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div v-if="state" class="mt-2">
    <button
      v-if="available"
      class="flex w-full items-center gap-2 rounded-md bg-tally/15 px-2.5 py-1.5 text-left text-xs text-tally hover:bg-tally/25"
      @click="open = true"
    >
      <i class="pi pi-arrow-circle-up text-[13px]" />
      <span class="flex-1">Доступна версия {{ update?.latest ?? 'новая' }}</span>
    </button>
    <button v-else class="text-xs text-ink-3 hover:text-ink-2" title="Что нового и проверка обновлений" @click="open = true">
      Версия {{ state.version }}
    </button>

    <Dialog v-model:visible="open" modal :header="available ? `Обновление до ${update?.latest ?? 'новой версии'}` : 'Версия программы'" :style="{ width: 'min(620px, 96vw)' }">
      <div class="flex flex-col gap-4">
        <p class="text-ink-2">
          Установлена версия <b class="tnum">{{ state.version }}</b>.
          <template v-if="available"> На GitHub есть новая: <b class="tnum">{{ update?.latest }}</b>.</template>
          <template v-else-if="update?.error"><br /><span class="text-ink-3">{{ update.error }}</span></template>
          <template v-else-if="update"> Это последняя версия.</template>
        </p>

        <div v-if="available && update?.notes.length" class="max-h-[50vh] overflow-y-auto rounded-md border border-line-soft bg-panel p-4">
          <section v-for="n in update.notes" :key="n.version" class="mb-4 last:mb-0">
            <div class="flex items-baseline gap-2">
              <span class="font-medium">{{ n.version }}</span>
              <span class="tnum text-[13px] text-ink-3">{{ n.date }}</span>
            </div>
            <template v-for="(b, i) in blocks(n.body)" :key="i">
              <div v-if="b.kind === 'h'" class="mt-2 text-[13px] font-medium text-ink-2">{{ b.text }}</div>
              <div v-else class="mt-1 flex gap-2 text-[13px] text-ink-2"><span class="text-ink-3">•</span><span>{{ b.text }}</span></div>
            </template>
          </section>
        </div>
        <p v-else-if="available" class="text-[13px] text-ink-3">Новых изменений: {{ update?.behind }}. Описание — в CHANGELOG.md.</p>

        <p v-if="available && update?.blocker" class="rounded-md border border-tally/40 bg-tally/10 px-3 py-2 text-[13px] text-tally">
          {{ update.blocker }}
        </p>
        <p v-if="available && update?.can_apply && store.activeJobs.length" class="text-[13px] text-ink-3">
          Сейчас выполняется задач: {{ store.activeJobs.length }}. После перезапуска они продолжатся, но текущий шаг начнётся заново.
        </p>
        <p v-if="phase === 'restarting'" class="flex items-center gap-2 text-ink-2">
          <i class="pi pi-spin pi-spinner" />Перезапуск… страница обновится сама.
        </p>

        <div class="flex justify-end gap-2">
          <Button label="Проверить сейчас" severity="secondary" text :loading="checking" :disabled="phase !== 'idle'" @click="checkNow" />
          <Button
            v-if="available"
            label="Обновить и перезапустить"
            icon="pi pi-download"
            :disabled="!update?.can_apply || phase !== 'idle'"
            :loading="phase !== 'idle'"
            @click="install"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
