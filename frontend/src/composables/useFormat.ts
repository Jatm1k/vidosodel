/** Formatting helpers shared by views. */

/** 75.4 → "1:15", 3725 → "1:02:05". */
export function timecode(seconds: number | null | undefined, withTenths = false): string {
  if (seconds == null || Number.isNaN(seconds)) return '—'
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const tenths = withTenths ? `.${Math.floor((s * 10) % 10)}` : ''
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}${tenths}`
}

/** Human duration: "39 мин 12 с". */
export function duration(seconds: number | null | undefined): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  if (h) return `${h} ч ${m} мин`
  if (m) return `${m} мин ${s} с`
  return `${s} с`
}

export function bytes(n: number | null | undefined): string {
  if (!n) return '—'
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

export function relativeDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

/** Russian plural: plural(5, ['сцена', 'сцены', 'сцен']) → "сцен". */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
