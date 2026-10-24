<script setup lang="ts">
/**
 * A series character or location: reference image, appearance and (for characters) voice.
 * Edits are kept as a draft until "Сохранить"; the reference is drawn or uploaded right away.
 */
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { SeriesCharacter, SeriesRef, SeriesVoice } from '@/api/types'
import { useNotify } from '@/composables/useNotify'

const props = defineProps<{
  kind: 'characters' | 'locations'
  item: SeriesRef | SeriesCharacter
  seriesId: number
  language: string
  geminiVoices: { voice: string; gender: string; character: string }[]
  templates: { id: string; name: string }[]
  drawing: boolean
}>()
const emit = defineEmits<{ changed: [] }>()
const notify = useNotify()
const confirm = useConfirm()

const isCharacter = computed(() => props.kind === 'characters')
type Draft = { name: string; description: string; role: string; personality: string; voice: SeriesVoice }
const draft = ref<Draft>(fromItem())
const saving = ref(false)
const previewing = ref(false)
const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()

function fromItem(): Draft {
  const c = props.item as SeriesCharacter
  return {
    name: c.name, description: c.description, role: c.role ?? '', personality: c.personality ?? '',
    voice: { ...(c.voice ?? { provider: 'gemini', voice: 'Kore', style: '', template_id: '' }) },
  }
}

const savedJson = ref(JSON.stringify(fromItem()))
watch(() => props.item, () => {
  // Refresh from the server unless the user has unsaved edits.
  if (JSON.stringify(draft.value) === savedJson.value) draft.value = fromItem()
  savedJson.value = JSON.stringify(fromItem())
})
const dirty = computed(() => JSON.stringify(draft.value) !== savedJson.value)

const voiceOptions = computed(() => props.geminiVoices.map((v) => ({
  value: v.voice, label: `${v.voice} — ${v.gender === 'female' ? 'жен.' : 'муж.'}, ${v.character}`,
})))

async function save() {
  saving.value = true
  try {
    const body: Record<string, unknown> = { name: draft.value.name, description: draft.value.description }
    if (isCharacter.value) Object.assign(body, { role: draft.value.role, personality: draft.value.personality, voice: draft.value.voice })
    await api.patch(`/api/series-refs/${props.kind}/${props.item.id}`, body)
    savedJson.value = JSON.stringify(draft.value)
    emit('changed')
  } catch (e) {
    notify.error(e)
  } finally {
    saving.value = false
  }
}

async function draw() {
  if (dirty.value) await save()
  try {
    const key = isCharacter.value ? 'character_ids' : 'location_ids'
    await api.post(`/api/series/${props.seriesId}/refs`, { [key]: [props.item.id] })
    notify.info('Референс рисуется', 'Картинка появится в карточке')
    emit('changed')
  } catch (e) {
    notify.error(e)
  }
}

async function upload(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    await api.upload(`/api/series-refs/${props.kind}/${props.item.id}/image`, file)
    emit('changed')
  } catch (e) {
    notify.error(e)
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

function remove() {
  confirm.require({
    header: isCharacter.value ? 'Удалить персонажа?' : 'Удалить локацию?',
    message: `«${props.item.name}» исчезнет из сериала и из всех серий.`,
    acceptLabel: 'Удалить', rejectLabel: 'Отмена',
    acceptProps: { severity: 'danger' }, rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      await api.del(`/api/series-refs/${props.kind}/${props.item.id}`)
      emit('changed')
    },
  })
}

async function preview() {
  previewing.value = true
  try {
    const sample = props.language === 'ru' ? 'Здравствуйте. Кажется, мы с вами уже встречались.' : 'Hello. I think we have met before.'
    const r = await api.post<{ url: string }>('/api/gemini/preview', {
      voice: draft.value.voice.voice, style: draft.value.voice.style, text: sample, language: props.language,
    })
    previewUrl.value = r.url
  } catch (e) {
    notify.error(e)
  } finally {
    previewing.value = false
  }
}
</script>

<template>
  <article class="flex flex-col overflow-hidden rounded-lg border border-line-soft bg-panel">
    <div class="relative aspect-video bg-raised">
      <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="h-full w-full object-cover" />
      <div v-else class="flex h-full items-center justify-center text-[13px] text-ink-3">
        {{ item.image_status === 'generating' || drawing ? 'Рисуется…' : 'Нет референса' }}
      </div>
      <div v-if="item.image_status === 'generating'" class="absolute inset-0 flex items-center justify-center bg-bg/60">
        <i class="pi pi-spin pi-spinner text-xl" />
      </div>
      <div class="absolute bottom-2 right-2 flex gap-1">
        <Button icon="pi pi-sparkles" size="small" severity="secondary" rounded v-tooltip.top="'Нарисовать заново'"
                aria-label="Нарисовать референс" :disabled="item.image_status === 'generating'" @click="draw" />
        <Button icon="pi pi-upload" size="small" severity="secondary" rounded v-tooltip.top="'Загрузить своё изображение'"
                aria-label="Загрузить изображение" @click="fileInput?.click()" />
      </div>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="upload" />
    </div>
    <p v-if="item.image_error && item.image_status !== 'generating'" class="px-4 pt-2 text-[12px] text-bad">{{ item.image_error }}</p>
    <div class="flex flex-col gap-3 p-4">
      <div class="flex gap-2">
        <InputText v-model="draft.name" class="flex-1 font-medium" aria-label="Имя" />
        <Button icon="pi pi-trash" text severity="secondary" aria-label="Удалить" @click="remove" />
      </div>
      <InputText v-if="isCharacter" v-model="draft.role" placeholder="Роль в истории" aria-label="Роль" />
      <label class="flex flex-col gap-1">
        <span class="text-[12px] text-ink-3">Внешность (по-английски — уходит в промпты кадров)</span>
        <Textarea v-model="draft.description" rows="3" auto-resize />
      </label>
      <template v-if="isCharacter">
        <label class="flex flex-col gap-1">
          <span class="text-[12px] text-ink-3">Характер и манера речи</span>
          <Textarea v-model="draft.personality" rows="2" auto-resize />
        </label>
        <div class="flex flex-col gap-2 rounded-md border border-line-soft p-3">
          <div class="flex items-center gap-2">
            <span class="text-[12px] text-ink-3">Голос</span>
            <div class="flex-1" />
            <div class="flex rounded-md border border-line-soft p-0.5 text-[12px]">
              <button v-for="p in (['gemini', 'lumean'] as const)" :key="p" type="button"
                      class="rounded px-2 py-0.5" :class="draft.voice.provider === p ? 'bg-raised text-ink' : 'text-ink-3'"
                      @click="draft.voice.provider = p">{{ p === 'gemini' ? 'Gemini' : 'Lumean' }}</button>
            </div>
          </div>
          <template v-if="draft.voice.provider === 'gemini'">
            <Select v-model="draft.voice.voice" :options="voiceOptions" option-label="label" option-value="value" filter
                    aria-label="Голос Gemini" />
            <InputText v-model="draft.voice.style" placeholder="Как звучит (по-англ.): low raspy voice, speaks slowly…" />
            <div class="flex items-center gap-2">
              <Button label="Прослушать" icon="pi pi-play" size="small" severity="secondary" outlined :loading="previewing"
                      v-tooltip.top="'Тратит один запрос Gemini (повторное прослушивание того же — бесплатно)'" @click="preview" />
              <audio v-if="previewUrl" :src="previewUrl" controls autoplay class="h-8 flex-1" />
            </div>
          </template>
          <label class="flex flex-col gap-1">
            <span class="text-[12px] text-ink-3">
              {{ draft.voice.provider === 'lumean' ? 'Шаблон Lumean' : 'Запасной голос Lumean (когда у Gemini кончились запросы)' }}
            </span>
            <Select v-model="draft.voice.template_id" :options="[{ id: '', name: '— нет —' }, ...templates]"
                    option-label="name" option-value="id" filter />
          </label>
        </div>
      </template>
      <div v-if="dirty" class="flex justify-end gap-2">
        <Button label="Отменить" size="small" severity="secondary" text @click="draft = JSON.parse(savedJson)" />
        <Button label="Сохранить" size="small" :loading="saving" @click="save" />
      </div>
    </div>
  </article>
</template>
