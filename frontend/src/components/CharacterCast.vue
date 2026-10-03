<script setup lang="ts">
/**
 * Recurring characters of a project with their reference portraits.
 * Portraits are sent with every scene the character appears in, so faces,
 * hair and clothing stay the same across the video.
 */
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { Character } from '@/api/types'
import { useNotify } from '@/composables/useNotify'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ projectId: number; masterTrackId: number | null; characters: Character[] }>()
const emit = defineEmits<{ changed: [] }>()
const store = useAppStore()
const notify = useNotify()
const confirm = useConfirm()

const open = ref(false)
const drafts = ref<Record<number, { name: string; description: string }>>({})
const menu = ref()
const menuItems = ref<any[]>([])
const fileInput = ref<HTMLInputElement>()
const uploadFor = ref<number | null>(null)
const starting = ref(false)

const busy = computed(() =>
  store.activeJobs.some((j) => j.kind === 'characters' && j.track_id === props.masterTrackId),
)
const ready = computed(() => props.characters.filter((c) => c.image_url).length)

watch(
  () => props.characters,
  (list) => {
    // Keep what the user is typing; refresh the rest from the server.
    const next: typeof drafts.value = {}
    for (const c of list) next[c.id] = drafts.value[c.id] ?? { name: c.name, description: c.description }
    drafts.value = next
  },
  { immediate: true },
)

async function runJob(body: Record<string, unknown>, message: string) {
  starting.value = true
  try {
    await api.post(`/api/projects/${props.projectId}/characters/run`, body)
    notify.info(message)
    void store.loadActiveJobs()
  } catch (e) {
    notify.error(e)
  } finally {
    starting.value = false
  }
}

async function save(c: Character) {
  const d = drafts.value[c.id]
  if (!d || !d.name.trim() || (d.name === c.name && d.description === c.description)) return
  try {
    await api.patch(`/api/characters/${c.id}`, { name: d.name, description: d.description })
    emit('changed')
  } catch (e) {
    notify.error(e)
  }
}

async function add() {
  try {
    await api.post(`/api/projects/${props.projectId}/characters`, { name: 'Новый персонаж', description: '' })
    open.value = true
    emit('changed')
  } catch (e) {
    notify.error(e)
  }
}

function remove(c: Character) {
  confirm.require({
    header: `Удалить «${c.name}»?`,
    message: 'Портрет перестанет отправляться со сценами. Готовые картинки не изменятся.',
    acceptLabel: 'Удалить', rejectLabel: 'Отмена',
    acceptProps: { severity: 'danger' }, rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      await api.del(`/api/characters/${c.id}`)
      emit('changed')
    },
  })
}

async function upload(ev: Event) {
  const f = (ev.target as HTMLInputElement).files?.[0]
  ;(ev.target as HTMLInputElement).value = ''
  if (!f || uploadFor.value == null) return
  try {
    await api.upload(`/api/characters/${uploadFor.value}/image`, f)
    emit('changed')
  } catch (e) {
    notify.error(e)
  }
}

function openMenu(e: Event, c: Character) {
  menuItems.value = [
    {
      label: c.image_url ? 'Нарисовать портрет заново' : 'Нарисовать портрет', icon: 'pi pi-refresh',
      disabled: busy.value || !c.description.trim(),
      command: () => runJob({ character_ids: [c.id], force: true }, `Портрет «${c.name}» рисуется`),
    },
    {
      label: 'Загрузить своё изображение', icon: 'pi pi-upload',
      command: () => {
        uploadFor.value = c.id
        fileInput.value?.click()
      },
    },
    { separator: true },
    { label: 'Удалить персонажа', icon: 'pi pi-trash', command: () => remove(c) },
  ]
  menu.value.toggle(e)
}
</script>

<template>
  <section class="rounded-lg border border-line-soft">
    <div class="flex items-center gap-3 px-4 py-3">
      <button class="flex min-w-0 flex-1 items-center gap-3 text-left" :aria-expanded="open" @click="open = !open">
        <i :class="['pi', open ? 'pi-chevron-down' : 'pi-chevron-right']" class="text-xs text-ink-3" />
        <span class="font-medium">Персонажи</span>
        <span v-if="characters.length" class="flex -space-x-2">
          <span
            v-for="c in characters.slice(0, 6)"
            :key="c.id"
            class="h-7 w-7 overflow-hidden rounded-full border-2 border-panel bg-raised"
            :title="c.name"
          >
            <img v-if="c.image_url" :src="c.image_url" alt="" class="h-full w-full object-cover" />
          </span>
        </span>
        <span class="truncate text-[13px] text-ink-3">
          <template v-if="busy">Ищутся и рисуются…</template>
          <template v-else-if="characters.length">{{ characters.length }}, с портретом {{ ready }} — внешность одинакова во всех сценах</template>
          <template v-else>Найдутся в сценарии вместе с промптами, или добавьте вручную</template>
        </span>
      </button>
      <Button label="Найти в сценарии" icon="pi pi-search" size="small" severity="secondary" text :loading="starting || busy" @click="runJob({ rescan: true }, 'Поиск персонажей запущен')" />
      <Button icon="pi pi-plus" size="small" severity="secondary" text aria-label="Добавить персонажа" v-tooltip.top="'Добавить вручную'" @click="add" />
    </div>

    <div v-if="open && characters.length" class="grid gap-4 border-t border-line-soft p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <article v-for="c in characters" :key="c.id" class="flex flex-col gap-2 rounded-md border border-line-soft bg-panel p-3">
        <div class="relative aspect-[4/3] overflow-hidden rounded bg-raised">
          <img v-if="c.image_url" :src="c.image_url" :alt="`Портрет: ${c.name}`" class="h-full w-full object-cover object-top" :class="c.image_status === 'generating' ? 'opacity-40' : ''" />
          <span v-if="c.image_status === 'generating'" class="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-tally">
            <i class="pi pi-spin pi-spinner" />Рисуется
          </span>
          <span v-else-if="!c.image_url" class="absolute inset-0 flex items-center justify-center px-3 text-center text-[13px]" :class="c.image_status === 'failed' ? 'text-bad' : 'text-ink-3'">
            {{ c.image_status === 'failed' ? 'Не получилось — нарисуйте заново' : 'Портрет появится перед генерацией картинок' }}
          </span>
          <span v-if="c.image_origin === 'upload'" class="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 text-[11px] leading-5 text-white/80">своё</span>
        </div>
        <div class="flex items-center gap-1">
          <InputText v-model="drafts[c.id].name" size="small" class="min-w-0 flex-1 font-medium" aria-label="Имя персонажа" @blur="save(c)" @keydown.enter="($event.target as HTMLInputElement).blur()" />
          <Button icon="pi pi-ellipsis-v" text rounded size="small" severity="secondary" :aria-label="`Действия: ${c.name}`" @click="openMenu($event, c)" />
        </div>
        <Textarea
          v-model="drafts[c.id].description"
          auto-resize
          rows="3"
          class="w-full !text-[13px] !leading-relaxed !text-ink-2"
          placeholder="Внешность по-английски: пол, возраст, лицо, причёска, телосложение, одежда"
          @blur="save(c)"
        />
        <p v-if="c.image_error && c.image_status === 'failed'" class="text-[12px] text-bad">{{ c.image_error }}</p>
      </article>
    </div>
    <p v-if="open && characters.length" class="border-t border-line-soft px-4 py-2.5 text-[12px] text-ink-3">
      Имя используется в промптах — по нему видно, кто в какой сцене. Изменили внешность — нарисуйте портрет заново и перегенерируйте сцены с этим персонажем.
    </p>
    <Menu ref="menu" :model="menuItems" popup />
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="upload" />
  </section>
</template>
