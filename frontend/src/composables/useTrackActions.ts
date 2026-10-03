/** Starting track jobs from panels with consistent feedback. */
import { ref } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import { useNotify } from './useNotify'

export function useTrackActions(trackId: () => number) {
  const notify = useNotify()
  const store = useAppStore()
  const starting = ref<string | null>(null)

  async function run(kind: string, params: Record<string, unknown> = {}, okText?: string) {
    starting.value = kind
    try {
      await api.post(`/api/tracks/${trackId()}/jobs/${kind}`, params)
      void store.loadActiveJobs()
      if (okText) notify.info(okText)
    } catch (e) {
      notify.error(e)
    } finally {
      starting.value = null
    }
  }

  return { run, starting }
}

/** Only the leaves of `value` that differ from `base` (used for project-level overrides). */
export function diffSettings(value: unknown, base: unknown): unknown {
  if (value && base && typeof value === 'object' && typeof base === 'object' && !Array.isArray(value)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const d = diffSettings(v, (base as Record<string, unknown>)[k])
      if (d !== undefined) out[k] = d
    }
    return Object.keys(out).length ? out : undefined
  }
  return JSON.stringify(value) === JSON.stringify(base) ? undefined : value
}
