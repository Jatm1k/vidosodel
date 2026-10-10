/**
 * Production statuses of the channel board and the actions that move a project along it:
 * "run up to a stage" (the pipeline with a subset of steps) and the user's own marks.
 */
import { api } from '@/api/client'
import type { ProductionStatus, ProjectSummary } from '@/api/types'
import { useAppStore } from '@/stores/app'
import { useNotify } from './useNotify'

export const STATUSES: { id: ProductionStatus; title: string; hint: string }[] = [
  { id: 'draft', title: 'Черновик', hint: 'Сценарий без озвучки' },
  { id: 'voiced', title: 'Озвучено', hint: 'Ждёт раскадровку' },
  { id: 'storyboard', title: 'Раскадровка', hint: 'Картинки готовы, нужен монтаж' },
  { id: 'video', title: 'Смонтировано', hint: 'Видео собрано, надо проверить' },
  { id: 'ready', title: 'Готово', hint: 'Проверено, можно выкладывать' },
  { id: 'published', title: 'Выложено', hint: '' },
]

export const statusRank = (s: ProductionStatus) => STATUSES.findIndex((x) => x.id === s)
export const statusTitle = (s: ProductionStatus) => STATUSES.find((x) => x.id === s)?.title ?? s

/** "Run up to…" targets: `steps: null` is the full pipeline (with metadata, if enabled in settings). */
export const RUN_TARGETS: {
  id: string; label: string; icon: string; hint: string; steps: string[] | null; below: ProductionStatus
}[] = [
  {
    id: 'voice', label: 'До озвучки', icon: 'pi pi-microphone', hint: 'Перевод и озвучка — дальше вручную',
    steps: ['translate', 'voice'], below: 'voiced',
  },
  {
    id: 'scenes', label: 'До сцен', icon: 'pi pi-th-large', hint: 'Озвучка и разбивка на сцены — можно поправить границы',
    steps: ['translate', 'voice', 'scenes'], below: 'storyboard',
  },
  {
    id: 'prompts', label: 'До промптов', icon: 'pi pi-pencil', hint: 'Всё до промптов картинок — проверить их, прежде чем тратить кредиты',
    steps: ['translate', 'voice', 'scenes', 'characters', 'prompts'], below: 'storyboard',
  },
  {
    id: 'images', label: 'До раскадровки', icon: 'pi pi-images', hint: 'Картинки готовы, видео не собирается',
    steps: ['translate', 'voice', 'scenes', 'characters', 'prompts', 'images'], below: 'storyboard',
  },
  {
    id: 'video', label: 'До видео', icon: 'pi pi-video', hint: 'Собранное видео без метаданных и обложек',
    steps: ['translate', 'voice', 'scenes', 'characters', 'prompts', 'images', 'render'], below: 'video',
  },
  { id: 'all', label: 'Весь конвейер', icon: 'pi pi-play', hint: '', steps: null, below: 'ready' },
]

/** Date of a user mark (unix seconds) as "5 окт". */
export const markDate = (ts: number | null | undefined) =>
  ts ? new Date(ts * 1000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : ''

/** Set or clear a mark on one language version; the page refreshes from the track event. */
export async function markTrack(trackId: number, body: { approved?: boolean; published?: boolean }) {
  try {
    await api.patch(`/api/tracks/${trackId}`, body)
  } catch (e) {
    useNotify().error(e)
  }
}

export function useProductionActions(onChanged: () => void) {
  const notify = useNotify()
  const store = useAppStore()

  async function runUntil(project: ProjectSummary, steps: string[] | null) {
    try {
      const r = await api.post<{ message: string }>(`/api/projects/${project.id}/run`, steps ? { steps } : {})
      notify.info(r.message, project.name)
      void store.loadActiveJobs()
      onChanged()
    } catch (e) {
      notify.error(e)
    }
  }

  async function mark(project: ProjectSummary, body: { approved?: boolean; published?: boolean }) {
    try {
      await api.post(`/api/projects/${project.id}/mark`, body)
      onChanged()
    } catch (e) {
      notify.error(e)
    }
  }

  async function stop(project: ProjectSummary) {
    try {
      await api.post(`/api/projects/${project.id}/cancel`)
      void store.loadActiveJobs()
      onChanged()
    } catch (e) {
      notify.error(e)
    }
  }

  /** Menu items for a project card on the board. */
  function menuFor(project: ProjectSummary, running: boolean) {
    const rank = statusRank(project.status)
    const hasScript = project.tracks_status.some((t) => t.has_script)
    const allPublished = project.status === 'published'
    const anyPublished = project.tracks_status.some((t) => t.published_at)
    const items: any[] = []
    if (running) {
      items.push({ label: 'Остановить', icon: 'pi pi-stop', command: () => stop(project) })
    } else {
      const targets = RUN_TARGETS.filter((t) => rank < statusRank(t.below))
      if (targets.length) {
        items.push({
          label: 'Довести до…',
          items: targets.map((t) => ({
            label: t.label, icon: t.icon, disabled: !hasScript, command: () => runUntil(project, t.steps),
          })),
        })
      }
    }
    const marks: any[] = []
    if (project.status === 'video') {
      marks.push({ label: 'Проверено', icon: 'pi pi-check', command: () => mark(project, { approved: true }) })
    }
    if (project.status === 'ready') {
      marks.push({ label: 'Снять «проверено»', icon: 'pi pi-undo', command: () => mark(project, { approved: false }) })
    }
    if (!allPublished) {
      marks.push({ label: 'Выложено', icon: 'pi pi-send', command: () => mark(project, { published: true }) })
    }
    if (anyPublished) {
      marks.push({ label: 'Снять «выложено»', icon: 'pi pi-undo', command: () => mark(project, { published: false }) })
    }
    if (marks.length) items.push({ label: 'Отметить', items: marks })
    return items
  }

  return { runUntil, mark, stop, menuFor }
}
