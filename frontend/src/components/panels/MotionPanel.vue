<script setup lang="ts">
/**
 * Motion graphics of a language version: what Claude composed (full-screen motion scenes and overlays),
 * a frame of each, «redo with a comment», delete, and starting the generation for the whole video or a range;
 * the art direction of this video (its brief, editable) and the cut-outs drawn for it.
 */
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { api } from '@/api/client'
import type { MotionInfo, MotionItem, ProjectDetail, TrackSummary } from '@/api/types'
import { useNotify } from '@/composables/useNotify'
import { timecode } from '@/composables/useFormat'
import { useTrackActions } from '@/composables/useTrackActions'
import ActiveJobs from '../ActiveJobs.vue'

const props = defineProps<{ track: TrackSummary; project: ProjectDetail }>()
const emit = defineEmits<{ changed: [] }>()
const notify = useNotify()
const confirm = useConfirm()
const { run, starting } = useTrackActions(() => props.track.id)

const info = ref<MotionInfo | null>(null)
async function load() {
  try {
    info.value = await api.get<MotionInfo>(`/api/tracks/${props.track.id}/motion`)
  } catch (e) {
    notify.error(e)
  }
}
watch(() => [props.track.id, props.track.updated_at, props.track.motion?.scenes, props.track.motion?.overlays], load,
  { immediate: true })

const settingsMode = computed(() => props.project.effective_settings.motion?.mode ?? 'off')
const MODES = [
  { value: 'accents', label: 'Акценты' },
  { value: 'mixed', label: 'Смешанный' },
  { value: 'full', label: 'Весь ролик' },
]
const MODE_HINT: Record<string, string> = {
  accents: 'Картинки остаются, поверх — цифры, карты, подписи, выноски',
  mixed: 'Часть сцен — полноэкранная инфографика (для них картинки не рисуются), остальные с оверлеями',
  full: 'Весь ролик — моушн-графика, без картинок',
}
const mode = ref<string>(settingsMode.value === 'off' ? 'mixed' : settingsMode.value)
const useRange = ref(false)
const rangeFrom = ref(1)
const rangeTo = ref(Math.min(10, props.track.scene_stats.total || 10))
const busy = computed(() => (props.track.active_jobs ?? []).some((j) => j.kind === 'motion'))
const ready = computed(() => !!props.track.audio_url && props.track.scene_stats.total > 0)

function generate() {
  const params: Record<string, unknown> = { mode: mode.value }
  if (useRange.value) params.range = [rangeFrom.value - 1, rangeTo.value - 1]
  const go = () => run('motion', params, 'Claude взялся за графику')
  if ((info.value?.items.length ?? 0) > 0 && !useRange.value) {
    confirm.require({
      header: 'Сделать графику заново?', message: 'Текущие моушн-сцены и оверлеи этой версии будут заменены.',
      acceptLabel: 'Заменить', rejectLabel: 'Отмена', rejectProps: { severity: 'secondary', text: true }, accept: go,
    })
  } else go()
}

const scenes = computed(() => (info.value?.items ?? []).filter((i) => i.kind === 'scene'))
const overlays = computed(() => (info.value?.items ?? []).filter((i) => i.kind === 'overlay'))
const filter = ref<'all' | 'scene' | 'overlay'>('all')
const shown = computed(() => (info.value?.items ?? []).filter((i) => filter.value === 'all' || i.kind === filter.value))

// ---- redo with a comment
const redoItem = ref<MotionItem | null>(null)
const comment = ref('')
function openRedo(it: MotionItem) {
  redoItem.value = it
  comment.value = ''
}
async function redo() {
  if (!redoItem.value) return
  await run('motion', { ids: [redoItem.value.id], comment: comment.value.trim() }, 'Claude переделывает')
  redoItem.value = null
}

async function remove(it: MotionItem) {
  try {
    const r = await api.del<{ pictures_needed: number }>(`/api/tracks/${props.track.id}/motion/${it.id}`)
    if (r.pictures_needed) notify.info(`Сценам нужны картинки (${r.pictures_needed}) — сгенерируйте их в раскадровке`)
    await load()
    emit('changed')
  } catch (e) {
    notify.error(e)
  }
}
function clearAll() {
  confirm.require({
    header: 'Удалить всю моушн-графику?', message: 'Сценам без картинок понадобятся картинки.',
    acceptLabel: 'Удалить', rejectLabel: 'Отмена', acceptProps: { severity: 'danger' }, rejectProps: { severity: 'secondary', text: true },
    accept: async () => {
      await api.del(`/api/tracks/${props.track.id}/motion`)
      await load()
      emit('changed')
    },
  })
}

// ---- the brief of this video
const brief = computed(() => info.value?.brief ?? null)
const briefOpen = ref(false)
const briefDraft = ref('')
const briefEditing = ref(false)
watch(() => brief.value?.text, (t) => { if (!briefEditing.value) briefDraft.value = t ?? '' }, { immediate: true })
async function saveBrief() {
  try {
    await api.put(`/api/tracks/${props.track.id}/motion/brief`, { text: briefDraft.value })
    briefEditing.value = false
    notify.ok('Арт-дирекция сохранена', 'Claude будет следовать ей при каждой генерации этого ролика')
    await load()
  } catch (e) {
    notify.error(e)
  }
}
async function resetBrief() {
  try {
    await api.del(`/api/tracks/${props.track.id}/motion/brief`)
    briefEditing.value = false
    notify.info('При следующей генерации Claude напишет арт-дирекцию заново')
    await load()
  } catch (e) {
    notify.error(e)
  }
}
async function removeCutout(id: string) {
  try {
    await api.del(`/api/tracks/${props.track.id}/motion/cutouts/${id}`)
    await load()
  } catch (e) {
    notify.error(e)
  }
}
const CUT_STATUS: Record<string, string> = { pending: 'ждёт', generating: 'рисуется', failed: 'не вышла' }

const big = ref<MotionItem | null>(null)
const styleName = computed(() => (info.value?.style as any)?.base ?? null)
</script>

<template>
  <section>
    <header class="flex flex-wrap items-center gap-3">
      <h3 class="text-[15px] font-semibold">Моушн-графика</h3>
      <span class="text-[13px] text-ink-3">
        делает Claude по вашей подписке ·
        <template v-if="info?.items.length">{{ scenes.length }} сцен, {{ overlays.length }} оверлеев</template>
        <template v-else>ещё нет</template>
        <template v-if="styleName"> · стиль {{ styleName }}</template>
      </span>
      <span v-if="info?.stale" class="rounded bg-tally/15 px-2 text-[12px] leading-6 text-tally">
        сцены изменились после генерации — тайминги могли сдвинуться
      </span>
      <span v-if="info?.planning" class="text-[12px] text-tally"><i class="pi pi-spin pi-spinner mr-1 text-[11px]" />Claude выбирает сцены</span>
      <div class="ml-auto flex gap-2">
        <Button v-if="info?.items.length" label="Удалить всё" severity="secondary" text size="small" @click="clearAll" />
      </div>
    </header>

    <ActiveJobs :track="track" :kinds="['motion']" class="mt-3" />

    <div class="mt-3 flex flex-wrap items-center gap-3">
      <SelectButton v-model="mode" :options="MODES" option-label="label" option-value="value" :allow-empty="false" size="small" />
      <label class="flex items-center gap-2 text-[13px] text-ink-2">
        <input v-model="useRange" type="checkbox" class="accent-[var(--p-primary-color)]" />
        только сцены
      </label>
      <template v-if="useRange">
        <InputNumber v-model="rangeFrom" :min="1" :max="track.scene_stats.total" size="small" input-class="w-16" />
        <span class="text-ink-3">—</span>
        <InputNumber v-model="rangeTo" :min="rangeFrom" :max="track.scene_stats.total" size="small" input-class="w-16" />
      </template>
      <Button
        :label="info?.items.length && !useRange ? 'Сделать заново' : 'Создать графику'"
        icon="pi pi-sparkles"
        size="small"
        :disabled="!ready || busy"
        :loading="starting === 'motion'"
        @click="generate"
      />
      <span class="w-full text-[12px] text-ink-3">
        {{ ready ? MODE_HINT[mode] : 'Нужны озвучка и разбивка на сцены: графика привязывается к словам диктора' }}
        <template v-if="settingsMode === 'off'"> · в пайплайне выключено (Настройки → Моушн)</template>
      </span>
    </div>

    <div v-if="brief" class="mt-4 rounded-md border border-line-soft">
      <button class="flex w-full flex-wrap items-center gap-2 px-3 py-2 text-left text-[13px]" @click="briefOpen = !briefOpen">
        <i class="pi text-[11px] text-ink-3" :class="briefOpen ? 'pi-chevron-down' : 'pi-chevron-right'" />
        <span class="font-medium text-ink">Арт-дирекция этого ролика</span>
        <span class="text-ink-3">
          {{ brief.by === 'user' ? 'ваша' : 'написал Claude' }}
          <template v-if="brief.cutouts.length"> · вырезок {{ brief.cutouts.filter((c) => c.status === 'done').length }}/{{ brief.cutouts.length }}</template>
        </span>
        <span v-if="brief.stale" class="text-[12px] text-tally">сценарий изменился — при генерации будет написана заново</span>
      </button>
      <div v-if="briefOpen" class="border-t border-line-soft p-3">
        <p class="mb-2 text-[12px] text-ink-3">
          Сквозные образы, приёмы для разных частей сценария и чего избегать — общий план для всех частей ролика. Claude пишет
          её под каждый сценарий; если поправите — ваша версия сохранится для всех следующих генераций этого ролика.
        </p>
        <Textarea v-model="briefDraft" rows="6" auto-resize class="w-full font-mono text-[12px]" @input="briefEditing = true" />
        <div class="mt-2 flex gap-2">
          <Button label="Сохранить" size="small" :disabled="!briefEditing" @click="saveBrief" />
          <Button label="Написать заново" size="small" severity="secondary" text @click="resetBrief" />
        </div>
        <template v-if="brief.cutouts.length">
          <h4 class="mt-4 text-[13px] font-medium">Вырезки</h4>
          <p class="mb-2 text-[12px] text-ink-3">Персонажи и предметы в стиле картинок канала без фона — Claude ставит их в моушн-сцены</p>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
            <figure v-for="c in brief.cutouts" :key="c.id" class="group relative overflow-hidden rounded border border-line-soft"
                    :title="[c.what, c.use, c.error].filter(Boolean).join('\n\n')">
              <div class="checker flex aspect-square items-center justify-center p-2">
                <img v-if="c.url" :src="c.url" alt="" loading="lazy" class="max-h-full max-w-full object-contain" />
                <span v-else class="text-[12px]" :class="c.status === 'failed' ? 'text-red-500' : 'text-ink-3'">
                  <i v-if="c.status === 'generating'" class="pi pi-spin pi-spinner mr-1 text-[11px]" />{{ CUT_STATUS[c.status] }}
                </span>
              </div>
              <figcaption class="truncate px-2 py-1 text-[12px] text-ink-2">{{ c.id }}</figcaption>
              <button class="absolute right-1 top-1 hidden rounded bg-black/60 px-1.5 leading-6 text-white group-hover:block"
                      aria-label="Удалить вырезку" @click="removeCutout(c.id)"><i class="pi pi-trash text-[11px]" /></button>
            </figure>
          </div>
        </template>
      </div>
    </div>

    <div v-if="info?.items.length" class="mt-4">
      <div class="mb-2 flex gap-1 text-[13px]">
        <button v-for="f in (['all', 'scene', 'overlay'] as const)" :key="f" class="rounded px-2 py-0.5"
                :class="filter === f ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink-2'" @click="filter = f">
          {{ f === 'all' ? 'Все' : f === 'scene' ? 'Сцены' : 'Оверлеи' }}
        </button>
      </div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
        <article v-for="it in shown" :key="it.id" class="overflow-hidden rounded-md border border-line-soft bg-raised/40">
          <button class="block aspect-video w-full bg-black" :aria-label="`Открыть ${it.id}`" @click="big = it">
            <img :src="it.still" alt="" loading="lazy" class="h-full w-full object-cover" />
          </button>
          <div class="flex flex-col gap-1 p-2.5">
            <div class="flex items-center gap-2 text-[12px]">
              <span class="rounded px-1.5 leading-5" :class="it.kind === 'scene' ? 'bg-tally/15 text-tally' : 'bg-ink-3/15 text-ink-2'">
                {{ it.kind === 'scene' ? `сцена ${(it.slots ?? []).map((s) => s + 1).join('–')}` : 'оверлей' }}
              </span>
              <span v-if="it.start != null" class="tnum text-ink-3">{{ timecode(it.start) }}–{{ timecode(it.end ?? 0) }}</span>
            </div>
            <p class="text-[13px] leading-snug text-ink-2">{{ it.note || '—' }}</p>
            <p v-if="it.warnings.length" class="text-[12px] leading-snug text-tally" :title="it.warnings.join('\n')">
              <i class="pi pi-exclamation-triangle mr-1 text-[11px]" />{{ it.warnings[0] }}
            </p>
            <div class="mt-1 flex gap-1">
              <Button label="Переделать" icon="pi pi-refresh" size="small" severity="secondary" outlined :disabled="busy" @click="openRedo(it)" />
              <Button icon="pi pi-trash" size="small" severity="secondary" text aria-label="Удалить" @click="remove(it)" />
            </div>
          </div>
        </article>
      </div>
    </div>

    <Dialog :visible="!!redoItem" modal header="Переделать" :style="{ width: '32rem' }" @update:visible="redoItem = null">
      <p class="mb-2 text-[13px] text-ink-3">Что изменить? Claude переделает только этот элемент.</p>
      <Textarea v-model="comment" rows="4" class="w-full" auto-resize placeholder="Например: вместо списка — карта; крупнее цифра; меньше текста" />
      <template #footer>
        <Button label="Отмена" severity="secondary" text @click="redoItem = null" />
        <Button label="Переделать" icon="pi pi-sparkles" @click="redo" />
      </template>
    </Dialog>

    <Dialog :visible="!!big" modal :header="big?.note || big?.id" :style="{ width: '64rem' }" @update:visible="big = null">
      <img v-if="big" :src="big.still" alt="" class="w-full rounded" />
    </Dialog>
  </section>
</template>

<style scoped>
.checker {
  background-color: #d8dade;
  background-image: linear-gradient(45deg, #c4c7cc 25%, transparent 25%), linear-gradient(-45deg, #c4c7cc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #c4c7cc 75%), linear-gradient(-45deg, transparent 75%, #c4c7cc 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}
</style>
