<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import { api } from '@/api/client'
import type { ProjectDetail, TrackSummary, Scene } from '@/api/types'
import { useNotify } from '@/composables/useNotify'
import { useTrackActions } from '@/composables/useTrackActions'
import ActiveJobs from '../ActiveJobs.vue'
import CharacterCast from '../CharacterCast.vue'

const props = defineProps<{ track: TrackSummary; project: ProjectDetail }>()
const emit = defineEmits<{ changed: [] }>()
const notify = useNotify()
const { run, starting } = useTrackActions(() => props.track.id)
const scenes = ref<Scene[]>([])
const plan = ref<{ video: number; image: number; motion: number; video_missing: number; image_missing: number; scenes: {id: number; kind: string; status: string; generation: string | null; requested_generation: string | null; first_frame_url: string | null; character_refs_enabled: boolean; characters: {id: number; name: string; url: string | null}[]
  motion: number | null; why: string; group: number | null; shot: number | null; group_size: number | null; continue_from: number | null; needs_frame: boolean}[] } | null>(null)
const motionLabels = ['статично', 'можно картинкой', 'движение помогает', 'нужно движение']
function sceneNo(id: number | null) { const sc = scenes.value.find(s => s.id === id); return sc ? sc.idx + 1 : '?' }
const tasks = ref<{ id: number; mode: string; state: string; remote_id: string | null; error: string | null }[]>([])
const account = ref<any>(null)
const accountError = ref('')
const localRemaining = ref<{video: number; image: number} | null>(null)
const attachIds = ref<Record<number, string>>({})
const selected = ref<number[]>([])
const editing = ref<number | null>(null)
const draft = ref<any>({})
const busy = ref(false)
const showTasks = ref(false)
const filter = ref<'video' | 'image' | 'motion' | 'all'>('video')
const visibleCount = ref(40)
const filteredScenes = computed(() => scenes.value.filter(sc => filter.value === 'all' || kind(sc.id) === filter.value))
const visibleScenes = computed(() => filteredScenes.value.slice(0, visibleCount.value))
const filters = computed(() => [{value: 'video' as const, label: `Клипы (${plan.value?.video ?? 0})`}, {value: 'image' as const, label: `Картинки (${plan.value?.image ?? 0})`}, {value: 'motion' as const, label: `Моушн (${plan.value?.motion ?? 0})`}, {value: 'all' as const, label: `Все (${scenes.value.length})`}])
const modeLabels: Record<string, string> = {i2v: 'Первый кадр → видео', ref2v: 'Референсы → видео', t2v: 'Текст → видео', im2v: 'Картинка, затем видео'}
const active = computed(() => props.track.active_jobs.some(j => ['videos', 'video_prompts', 'images', 'render', 'preview'].includes(j.kind)))
const locked = computed(() => props.track.shares_images || active.value || busy.value)
const modes = [{ value: 'inherit', label: 'По настройкам проекта' }, { value: 'auto', label: 'Авто — по содержанию сцены' }, { value: 't2v', label: 'Текст → видео' },
  { value: 'i2v', label: 'Первый кадр → видео' }, { value: 'ref2v', label: 'Референсы → видео' },
  { value: 'im2v', label: 'Картинка, затем видео' }]
const types = [{ value: 'auto', label: 'По настройкам проекта' }, { value: 'image', label: 'Картинка' }, { value: 'video', label: 'Видеоклип' }]
const fit = [{ value: 'freeze', label: 'Последний кадр' }, { value: 'loop', label: 'Повтор' }, { value: 'stretch', label: 'Растянуть' }]
const labels: Record<string, string> = { queued: 'В очереди', accepted: 'Принято', running: 'Генерация',
  ready: 'Готово', failed: 'Ошибка', declined: 'Отказ', cancelled: 'Отменено', unknown: 'Нужен ID', submitting: 'Отправка', done: 'Готово', none: 'Не создано' }
function planned(id: number) { return plan.value?.scenes.find(s => s.id === id) }
function kind(id: number) { return planned(id)?.kind }
function sceneStatus(sc: Scene) {
  if (kind(sc.id) === 'motion') return planned(sc.id)?.status === 'done' ? 'Графика готова' : 'Графика запланирована'
  if (kind(sc.id) === 'image') return sc.image_status === 'done' ? 'Картинка готова' : (labels[sc.image_status] || sc.image_status)
  return sc.video_status === 'none' ? 'Клип ещё не создан' : (labels[sc.video_status] || sc.video_status)
}
function toggle(id: number) { selected.value = selected.value.includes(id) ? selected.value.filter(x => x !== id) : [...selected.value, id] }
async function load() {
  try {
    const [items, media] = await Promise.all([api.get<Scene[]>(`/api/tracks/${props.track.id}/scenes`),
      api.get<any>(`/api/tracks/${props.track.id}/media-plan`)])
    scenes.value = items
    plan.value = media
    selected.value = selected.value.filter(id => media.scenes.some((s: {id: number; kind: string}) => s.id === id && s.kind === 'video'))
  } catch (e) { notify.error(e) }
  try { const result = await api.get<any>(`/api/inflight/tasks?track_id=${props.track.id}`); tasks.value = result.tasks; localRemaining.value = result.local_remaining } catch { /* key not configured yet */ }
}
async function loadAccount() {
  try { account.value = await api.get('/api/inflight/account'); accountError.value = '' }
  catch (e) { accountError.value = e instanceof Error ? e.message : String(e) }
}
let timer: number | undefined
onMounted(() => { void load(); void loadAccount(); timer = window.setInterval(load, 5000) })
onUnmounted(() => window.clearInterval(timer))
function edit(sc: Scene) {
  editing.value = sc.id
  draft.value = { media_type: 'auto', video_mode: 'inherit', video_prompt: '', first_frame: null,
    references: [], clip_fit: props.project.effective_settings.videos.fit, clip_start: 0, clip_speed: 1,
    ...JSON.parse(JSON.stringify(sc.overrides)), characters: sc.characters }
}
async function save(sc: Scene) {
  busy.value = true
  try { await api.put(`/api/scenes/${sc.id}/media`, draft.value); editing.value = null; await load(); emit('changed') }
  catch (e) { notify.error(e) } finally { busy.value = false }
}
async function upload(sc: Scene, event: Event, role: 'video' | 'reference' | 'frame') {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  busy.value = true
  try {
    for (const file of files) {
      if (role === 'video') await api.upload(`/api/scenes/${sc.id}/video`, file)
      else {
        const result = await api.upload<{path: string}>(`/api/scenes/${sc.id}/references`, file)
        if (role === 'frame') draft.value.first_frame = result.path
        else draft.value.references.push(result.path)
      }
    }
    await load(); emit('changed')
  } catch (e) { notify.error(e) } finally { busy.value = false; input.value = '' }
}
async function generate(force = false) {
  if (editing.value) { notify.info('Сначала сохраните параметры сцены'); return }
  await run('videos', { ...(selected.value.length ? {scene_ids: selected.value} : {}), force }, 'Видеоряд добавлен в очередь')
  emit('changed'); await load()
}
async function prepareFrames() {
  if (editing.value) { notify.info('Сначала сохраните параметры сцены'); return }
  const ids = (plan.value?.scenes || []).filter(s => s.kind === 'video' && s.needs_frame && (!selected.value.length || selected.value.includes(s.id))).map(s => s.id)
  if (!ids.length) { notify.info('Нет видеосцен с генерацией из первого кадра'); return }
  await run('images', {scene_ids: ids}, 'Первые кадры добавлены в очередь — их можно проверить до генерации клипов')
  emit('changed'); await load()
}
async function writePrompts(force = false) {
  if (editing.value) { notify.info('Сначала сохраните параметры сцены'); return }
  await run('video_prompts', { ...(selected.value.length ? { scene_ids: selected.value } : {}), force }, 'Запущена режиссура клипов — без генерации видео')
  emit('changed'); await load()
}
function useDirected(sc: Scene) {
  const shot = sc.video_plan?.shot
  if (!shot) return
  draft.value.video_prompt = [shot.opening_frame, shot.camera_detail, shot.subject_action,
    shot.environment_motion, shot.lighting, ...(shot.beats || []), shot.continuity].filter(Boolean).join(' ')
}
async function cancelActive() {
  try {
    const result = await api.post<{cancelled_count: number}>(`/api/inflight/cancel-active?track_id=${props.track.id}`, {})
    notify.info(`Отменено заданий: ${result.cancelled_count}`); await load(); void loadAccount()
  } catch (e) { notify.error(e) }
}
async function cancel(id: number, hard: boolean) {
  try { await api.post(`/api/inflight/tasks/${id}/cancel`, { hard }); await load(); void loadAccount() }
  catch (e) { notify.error(e) }
}
async function attach(id: number) {
  try { await api.post(`/api/inflight/tasks/${id}/attach`, {remote_id: attachIds.value[id]}); await load() }
  catch (e) { notify.error(e) }
}
async function remove(sc: Scene) {
  try { await api.del(`/api/scenes/${sc.id}/video`); await load(); emit('changed') }
  catch (e) { notify.error(e) }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="rounded-xl border border-line bg-raised p-5">
      <h2 class="text-lg font-semibold">Видеоряд</h2>
      <p class="mt-2 text-sm text-ink-3">Режиссёр решает, какие сцены станут клипами, и выбирает способ для каждой: текст → видео, кадр с героем → видео, референсы локации → видео, мультишот из коротких сцен или продолжение предыдущего клипа. Затем он пишет и проверяет промпт: стиль канала, сцена, камера, действие по секундам и звук. Состав задаётся в настройках проекта → Видеоряд; тип и режим каждой сцены можно изменить ниже. Полноэкранный моушн заменяет медиа сцены, наложения работают поверх клипа.</p>
      <p v-if="plan" class="mt-3">{{ plan.video }} клипов · {{ plan.image }} картинок · {{ plan.motion }} моушн-сцен. Не хватает: {{ plan.video_missing }} клипов, {{ plan.image_missing }} картинок.</p>
      <p v-if="track.shares_images" class="mt-2 text-ink-3">Этот язык использует видеоряд основного языка. Генерируйте и редактируйте его там.</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <Button label="Подготовить первые кадры" icon="pi pi-image" severity="secondary" outlined :disabled="locked || !plan?.scenes.some(s => s.kind === 'video' && s.needs_frame)" :loading="starting === 'images'" @click="prepareFrames" />
        <Button label="Спланировать и написать промпты" severity="secondary" outlined :disabled="locked || !plan?.video" :loading="starting === 'video_prompts'" @click="writePrompts()" />
        <Button label="Обновить режиссуру" severity="secondary" text :disabled="locked || !plan?.video" @click="writePrompts(true)" />
        <Button :label="selected.length ? `Создать выбранные (${selected.length})` : 'Создать недостающие клипы'" icon="pi pi-video" :disabled="locked || !plan?.video" :loading="starting === 'videos'" @click="generate()" />
        <Button v-if="selected.length" label="Перегенерировать выбранные" severity="secondary" outlined :disabled="locked" @click="generate(true)" />
        <a :href="`/api/tracks/${track.id}/download/clips`" class="self-center px-3 text-sm text-tally">Скачать все клипы ZIP</a>
        <Button label="Задания и лимиты" severity="secondary" text @click="showTasks = !showTasks; loadAccount()" />
        <Button v-if="tasks.some(t => ['queued','accepted','running'].includes(t.state))" label="Остановить все задания" severity="danger" text @click="cancelActive" />
      </div>
      <p class="mt-3 text-xs text-ink-3">Выбирать для генерации можно только видеосцены. Тип сцены меняется в её параметрах. Звук клипов не используется: остаются озвучка и звук проекта. Готовые клипы можно скачать и загрузить свои.</p>
    </div>
    <CharacterCast v-if="!track.shares_images && project.effective_settings.videos.character_refs" :project-id="project.id" :master-track-id="project.master_track_id" :characters="project.characters" @changed="emit('changed')" />
    <p class="text-sm text-ink-3">Перед созданием клипов LLM пишет и проверяет режиссуру: действие, камеру, свет и развитие кадра с учётом стиля канала. Видеопромпты можно подготовить отдельно, до расхода квоты Inflight. Ручные промпты сохраняются.</p>
    <ActiveJobs :track="track" :kinds="['video_prompts', 'videos', 'images']" />
    <div v-if="showTasks" class="rounded-xl border border-line p-5">
      <p v-if="accountError" class="text-bad">{{ accountError }}</p>
      <div v-if="account" class="flex flex-wrap gap-5 text-sm">
        <span>Тариф: {{ account.account.plan }}</span>
        <span>Видео: доступно {{ Math.min(account.usage.video?.left ?? 0, localRemaining?.video ?? Infinity) }}, занято {{ account.usage.video?.busy }}/{{ account.usage.video?.slots }}</span>
        <span>Картинки: доступно {{ Math.min(account.usage.image?.left ?? 0, localRemaining?.image ?? Infinity) }}, занято {{ account.usage.image?.busy }}/{{ account.usage.image?.slots }}</span>
        <span v-if="account.usage.pool">Общий пул: {{ account.usage.pool.busy }}/{{ account.usage.pool.slots }}</span>
        <span v-if="account.usage.resets_at">Сброс: {{ new Date(account.usage.resets_at * 1000).toLocaleString() }}</span>
      </div>
      <p v-if="account?.usage.warning" class="mt-3 text-tally">{{ account.usage.warning }}</p>
      <p v-if="account?.usage.turbo?.active" class="mt-3 text-tally">{{ account.usage.turbo.message }}</p>
      <p class="mt-3 text-xs text-ink-3">Используются все свободные потоки тарифа; свой потолок задаётся в настройках приложения. Отмена в очереди задач останавливает ожидание; кнопки ниже отменяют задания в сервисе. Принудительная отмена освобождает активный слот.</p>
      <div v-for="task in tasks" :key="task.id" class="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-sm">
        <span>#{{ task.id }} · {{ task.mode }} · {{ labels[task.state] || task.state }}</span>
        <code class="text-xs text-ink-3">{{ task.remote_id }}</code>
        <span v-if="task.error" class="text-bad">{{ task.error }}</span>
        <template v-if="['unknown','submitting'].includes(task.state)">
          <InputText v-model="attachIds[task.id]" placeholder="ID задания из Inflight" />
          <Button label="Привязать ID" size="small" :disabled="!attachIds[task.id]" @click="attach(task.id)" />
        </template>
        <Button v-if="['queued','accepted'].includes(task.state)" label="Отменить" text size="small" @click="cancel(task.id, false)" />
        <Button v-if="['running','accepted'].includes(task.state)" label="Принудительно отменить" text size="small" severity="danger" @click="cancel(task.id, true)" />
      </div>
      <p v-if="!tasks.length" class="mt-3 text-ink-3">Заданий Inflight для этой версии пока нет.</p>
    </div>
    <p v-if="!scenes.length" class="text-ink-3">Сначала разбейте сценарий на сцены в разделе «Сцены и картинки».</p>
    <div class="flex flex-wrap gap-2">
      <Button v-for="tab in filters" :key="tab.value" :label="tab.label" size="small" :severity="filter === tab.value ? undefined : 'secondary'" :outlined="filter !== tab.value" @click="filter = tab.value; editing = null; visibleCount = 40" />
    </div>
    <p v-if="scenes.length && !visibleScenes.length" class="rounded-xl border border-line p-5 text-ink-3">{{ filter === 'video' ? 'Видеосцен в этом проекте пока нет. Выберите состав видеоряда в настройках проекта или измените тип нужной сцены во вкладке «Картинки».' : 'Сцен этого типа нет.' }}</p>
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <article v-for="sc in visibleScenes" :key="sc.id" class="overflow-hidden rounded-xl border border-line bg-raised">
        <video v-if="kind(sc.id) === 'video' && sc.video_url" :src="sc.video_url" :poster="sc.poster_url || sc.image_url || undefined" controls preload="none" class="max-h-72 w-full bg-black" />
        <img v-else-if="kind(sc.id) === 'video' && planned(sc.id)?.first_frame_url" :src="planned(sc.id)?.first_frame_url || undefined" class="max-h-60 w-full object-contain" loading="lazy" alt="Первый кадр" />
        <img v-else-if="kind(sc.id) === 'image' && sc.image_url" :src="sc.image_url" class="max-h-60 w-full object-contain" loading="lazy" />
        <div v-else-if="kind(sc.id) === 'motion'" class="flex h-28 items-center justify-center gap-2 bg-panel text-ink-3"><i class="pi pi-chart-bar" />Моушн-графика</div>
        <div class="p-4">
          <div class="flex items-center justify-between gap-3">
            <label class="flex items-center gap-2"><input v-if="kind(sc.id) === 'video'" type="checkbox" :checked="selected.includes(sc.id)" :disabled="locked" @change="toggle(sc.id)" />Сцена {{ sc.idx + 1 }} · {{ (sc.end - sc.start).toFixed(1) }} с</label>
            <span class="text-xs text-ink-3">{{ kind(sc.id) === 'motion' ? 'Моушн' : kind(sc.id) === 'video' ? 'Клип' : 'Картинка' }} · {{ sceneStatus(sc) }}</span>
          </div>
          <p class="my-3 line-clamp-3 text-sm text-ink-2">{{ sc.text }}</p>
          <div v-if="kind(sc.id) === 'video'" class="mb-3 flex flex-col gap-2 text-xs text-ink-3">
            <p>Новая генерация: {{ planned(sc.id)?.requested_generation === 'auto' ? 'Авто · ' : '' }}{{ planned(sc.id)?.group ? `Мультишот · шот ${(planned(sc.id)?.shot ?? 0) + 1} из клипа сцены ${sceneNo(planned(sc.id)?.group ?? null)}` : planned(sc.id)?.continue_from ? `Продолжение клипа сцены ${sceneNo(planned(sc.id)?.continue_from ?? null)}` : (modeLabels[planned(sc.id)?.generation || ''] || 'По настройкам проекта') }}</p>
            <p v-if="planned(sc.id)?.motion != null">Режиссёр: {{ motionLabels[planned(sc.id)?.motion ?? 0] }}{{ planned(sc.id)?.why ? ' — ' + planned(sc.id)?.why : '' }}</p>
            <p v-if="sc.video_url && sc.video_meta.mode">Созданный клип: {{ modeLabels[sc.video_meta.mode] || sc.video_meta.mode }}</p>
            <div v-if="planned(sc.id)?.needs_frame" class="flex items-center gap-3">
              <img v-if="planned(sc.id)?.first_frame_url" :src="planned(sc.id)?.first_frame_url || undefined" class="h-14 w-24 rounded object-contain" alt="Первый кадр клипа" />
              <span>{{ planned(sc.id)?.first_frame_url ? 'Этот кадр будет анимирован.' : 'Первый кадр будет создан перед анимацией.' }}</span>
            </div>
            <div v-if="planned(sc.id)?.characters.length" class="flex flex-wrap items-center gap-2">
              <span>{{ planned(sc.id)?.generation === 'i2v' ? 'Герои для первого кадра:' : 'Герои сцены:' }}</span>
              <span v-for="hero in planned(sc.id)?.characters" :key="hero.id" class="inline-flex items-center gap-1">
                <img v-if="hero.url" :src="hero.url" class="h-8 w-8 rounded object-cover" :alt="hero.name" />{{ hero.name }}<span v-if="!hero.url" class="text-tally"> · нет референса</span>
              </span>
            </div>
            <p v-if="!planned(sc.id)?.character_refs_enabled" class="text-tally">Референсы героев выключены в настройках видеоряда.</p>
          </div>
          <p v-if="kind(sc.id) === 'video' && sc.video_error" class="my-2 text-sm text-bad">{{ sc.video_error }}</p>
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <Button label="Параметры" size="small" severity="secondary" :disabled="locked || kind(sc.id) === 'motion'" @click="edit(sc)" />
            <label v-if="!locked && kind(sc.id) === 'video'" class="cursor-pointer text-tally">Загрузить клип<input type="file" accept="video/*,.mkv" class="hidden" @change="upload(sc, $event, 'video')" /></label>
            <a v-if="kind(sc.id) === 'video' && sc.video_url" :href="sc.video_url" download class="text-tally">Скачать</a>
            <Button v-if="kind(sc.id) === 'video' && sc.video_url" label="Убрать клип" text size="small" severity="danger" :disabled="locked" @click="remove(sc)" />
          </div>
          <details v-if="kind(sc.id) === 'video' && sc.video_plan?.prompt" class="mt-4 rounded-lg border border-line p-3 text-sm">
            <summary class="cursor-pointer text-ink-2">Сохранённая режиссура · {{ sc.video_plan.mode }} · {{ sc.video_plan.reviewed ? 'проверена LLM' : '' }}</summary>
            <p class="mt-3 text-ink-3">{{ sc.video_plan.shot?.purpose }}</p>
            <p v-if="sc.overrides.video_prompt" class="mt-2 text-tally">Для этой сцены используется ваш ручной промпт движения.</p>
            <p v-for="warning in sc.video_plan.shot?.warnings || []" :key="warning" class="mt-2 text-tally">{{ warning }}</p>
            <p class="mt-2">План: {{ sc.video_plan.shot?.shot_size }} · камера: {{ sc.video_plan.shot?.camera }}</p>
            <pre class="mt-3 whitespace-pre-wrap font-sans text-xs text-ink-2">{{ sc.video_plan.prompt }}</pre>
            <p class="mt-2 text-xs text-ink-3">Модель: {{ sc.video_plan.model }}. После изменения сцены, стиля или референсов автоматический план пересчитывается перед генерацией.</p>
          </details>
          <div v-if="editing === sc.id" class="mt-4 flex flex-col gap-3 border-t border-line pt-4">
            <label>Тип сцены <Select v-model="draft.media_type" :options="types" option-label="label" option-value="value" class="w-full" /></label>
            <template v-if="draft.media_type === 'video' || kind(sc.id) === 'video'">
            <label>Режим <Select v-model="draft.video_mode" :options="modes" option-label="label" option-value="value" class="w-full" /></label>
            <label>Промпт движения <Textarea v-model="draft.video_prompt" rows="3" class="w-full" placeholder="Пусто — LLM напишет отдельный видеопромпт. Введённый вручную текст не перезаписывается" /></label>
            <Button v-if="sc.video_plan?.shot" label="Взять режиссуру как ручной промпт" severity="secondary" text size="small" @click="useDirected(sc)" />
            <label>Герои и локации <MultiSelect v-model="draft.characters" :options="project.characters" option-label="name" option-value="id" class="w-full" placeholder="Автоопределение по именам" /></label>
            <Button label="Определять героев автоматически" text size="small" @click="draft.characters = null" />
            <div class="flex flex-wrap gap-3">
              <label class="cursor-pointer text-tally">Загрузить первый кадр<input type="file" accept="image/*" class="hidden" @change="upload(sc, $event, 'frame')" /></label>
              <Button v-if="sc.image_file" label="Взять картинку сцены" text size="small" @click="draft.first_frame = sc.image_file" />
              <label class="cursor-pointer text-tally">Добавить референсы<input type="file" accept="image/*" multiple class="hidden" @change="upload(sc, $event, 'reference')" /></label>
            </div>
            <div v-if="draft.first_frame" class="flex items-center gap-3"><img :src="`/media/${draft.first_frame}`" class="h-20 w-28 object-contain" /><Button label="Убрать первый кадр" text size="small" @click="draft.first_frame = null" /></div>
            <div class="flex flex-wrap gap-2"><button v-for="(path, i) in draft.references" :key="path" title="Удалить референс" @click="draft.references.splice(i, 1)"><img :src="`/media/${path}`" class="h-16 w-20 object-cover" /></button></div>
            <label>Если клип короче сцены <Select v-model="draft.clip_fit" :options="fit" option-label="label" option-value="value" class="w-full" /></label>
            <label>Начало клипа, с <InputNumber v-model="draft.clip_start" :min="0" :max-fraction-digits="2" /></label>
            <label>Скорость <InputNumber v-model="draft.clip_speed" :min="0.1" :max="4" :step="0.1" :max-fraction-digits="2" /></label>
            </template>
            <div class="flex gap-2"><Button label="Сохранить" :loading="busy" @click="save(sc)" /><Button label="Закрыть" text @click="editing = null" /></div>
          </div>
        </div>
      </article>
    </div>
    <Button v-if="filteredScenes.length > visibleCount" :label="`Показать ещё · ${visibleScenes.length} из ${filteredScenes.length}`" severity="secondary" outlined class="self-center" @click="visibleCount += 40" />
  </div>
</template>
