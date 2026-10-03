/** Toast shortcuts with consistent wording and durations. */
import { useToast } from 'primevue/usetoast'

export function useNotify() {
  const toast = useToast()
  return {
    ok(summary: string, detail?: string) {
      toast.add({ severity: 'success', summary, detail, life: 3500 })
    },
    info(summary: string, detail?: string) {
      toast.add({ severity: 'info', summary, detail, life: 4000 })
    },
    error(e: unknown, summary = 'Не получилось') {
      const detail = e instanceof Error ? e.message : String(e)
      toast.add({ severity: 'error', summary, detail, life: 8000 })
    },
  }
}
