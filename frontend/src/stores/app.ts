/**
 * Global app state: catalogues (meta), channels, live job queue and service status.
 * A single EventSource feeds job/track/scene events; components subscribe with `onEvent`.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { Channel, Job, Meta, SystemStatus } from '@/api/types'

export type AppEvent =
  | { type: 'job'; job: Partial<Job> & { id: number } }
  | { type: 'track'; track_id: number; what: string }
  | { type: 'scene'; track_id: number; scene: any }

type Listener = (e: AppEvent) => void

export const useAppStore = defineStore('app', () => {
  const meta = ref<Meta | null>(null)
  const channels = ref<Channel[]>([])
  const jobs = ref<Map<number, Job>>(new Map())
  const status = ref<SystemStatus | null>(null)
  const connected = ref(false)
  const listeners = new Set<Listener>()

  const activeJobs = computed(() =>
    [...jobs.value.values()].filter((j) => j.status === 'queued' || j.status === 'running').sort((a, b) => a.id - b.id),
  )

  const languages = computed(() => new Map((meta.value?.languages ?? []).map((l) => [l.code, l])))

  async function loadMeta() {
    meta.value = await api.get<Meta>('/api/meta')
  }

  async function loadChannels() {
    channels.value = await api.get<Channel[]>('/api/channels')
  }

  async function loadStatus() {
    try {
      status.value = await api.get<SystemStatus>('/api/system/status')
    } catch {
      /* offline – keep last known */
    }
  }

  async function loadActiveJobs() {
    const list = await api.get<Job[]>('/api/jobs?status=active')
    const map = new Map(jobs.value)
    for (const [id, j] of map) if (j.status === 'queued' || j.status === 'running') map.delete(id)
    for (const j of list) map.set(j.id, j)
    jobs.value = map
  }

  function onEvent(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  function connect() {
    const es = new EventSource('/api/events')
    es.onopen = () => {
      connected.value = true
      void loadActiveJobs()
    }
    es.onerror = () => {
      connected.value = false
    }
    es.onmessage = (msg) => {
      const event = JSON.parse(msg.data) as AppEvent
      if (event.type === 'job') {
        const prev = jobs.value.get(event.job.id)
        const next = { ...(prev ?? {}), ...event.job } as Job
        const map = new Map(jobs.value)
        map.set(next.id, next)
        jobs.value = map
      }
      for (const fn of listeners) fn(event)
    }
  }

  async function init() {
    await Promise.all([loadMeta(), loadChannels(), loadStatus()])
    connect()
    setInterval(loadStatus, 15000)
  }

  function langLabel(code: string) {
    const l = languages.value.get(code)
    return l ? l.name : code.toUpperCase()
  }

  return {
    meta, channels, jobs, status, connected, activeJobs, languages,
    init, loadChannels, loadStatus, loadActiveJobs, onEvent, langLabel,
  }
})
