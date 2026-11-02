// Shared helpers of the renderer: easing, interpolation, colours, random numbers, number formatting.

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const lerp = (a, b, t) => a + (b - a) * t
export const TAU = Math.PI * 2

// ------------------------------------------------------------------ easing
const c1 = 1.70158, c3 = c1 + 1
export const EASE = {
  linear: (t) => t,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  'sine-out': (t) => Math.sin((t * Math.PI) / 2),
  quad: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  'quad-out': (t) => 1 - (1 - t) * (1 - t),
  cubic: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  'cubic-out': (t) => 1 - (1 - t) ** 3,
  quart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
  'quart-out': (t) => 1 - (1 - t) ** 4,
  expo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2),
  'expo-out': (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  'expo-in': (t) => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
  'cubic-in': (t) => t ** 3,
  back: (t) => 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2,
  'back-in': (t) => c3 * t ** 3 - c1 * t * t,
  elastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  bounce: (t) => {
    const n = 7.5625, d = 2.75
    if (t < 1 / d) return n * t * t
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
    return n * (t -= 2.625 / d) * t + 0.984375
  },
  steps: (t) => Math.floor(t * 6) / 6,
}
export const ease = (name, t) => (EASE[name] || EASE['cubic-out'])(clamp(t))

/** 0..1 progress of a phase that starts at ``at`` and lasts ``dur`` (eased). */
export const phase = (t, at, dur, e = 'cubic-out') => (dur <= 0 ? (t >= at ? 1 : 0) : ease(e, (t - at) / dur))

// ------------------------------------------------------------------ random
/** Deterministic PRNG (mulberry32): the same seed draws the same picture in every worker. */
export function rng(seed) {
  let a = (seed | 0) || 0x9e3779b9
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}
/** Smooth 1D value noise in -1..1 (for drifting backgrounds and idle motion). */
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i
  const r = (k) => { const v = Math.sin((k + seed * 13.37) * 127.1) * 43758.5453; return (v - Math.floor(v)) * 2 - 1 }
  const u = f * f * (3 - 2 * f)
  return lerp(r(i), r(i + 1), u)
}

// ------------------------------------------------------------------ colours
const NAMED = { white: '#ffffff', black: '#000000', transparent: '#00000000', none: '#00000000' }

export function parseHex(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
  const v = parseInt(h.slice(0, 6), 16)
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255, a]
}

/** RGBA of a colour: a palette role (``accent``), a hex, ``rgb()``; ``/40`` sets 40 % opacity. */
export function rgba(spec, palette, fallback = '#ffffff') {
  if (Array.isArray(spec)) return spec
  let s = String(spec ?? fallback).trim()
  let alpha = 1
  const slash = s.match(/^(.*?)\/(\d{1,3})$/)
  if (slash) { s = slash[1]; alpha = +slash[2] / 100 }
  if (palette && palette[s]) s = palette[s]
  if (NAMED[s]) s = NAMED[s]
  let c
  if (s.startsWith('#')) c = parseHex(s)
  else {
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(',').map(Number); c = [p[0], p[1], p[2], p[3] ?? 1] }
    else c = parseHex(palette?.[fallback] || (fallback.startsWith('#') ? fallback : '#ffffff'))
  }
  return [c[0], c[1], c[2], c[3] * alpha]
}
export const css = (c) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${+c[3].toFixed(3)})`
export const color = (spec, palette, fallback) => css(rgba(spec, palette, fallback))
export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]
export const withAlpha = (c, a) => [c[0], c[1], c[2], c[3] * a]
export const luma = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255

// ------------------------------------------------------------------ numbers
const fmtCache = new Map()
/** ``1 250 000`` / ``1,250,000`` – grouped as the language writes numbers. */
export function formatNumber(v, dec = 0, lang = 'ru') {
  const key = `${lang}:${dec}`
  let f = fmtCache.get(key)
  if (!f) {
    try { f = new Intl.NumberFormat(lang, { minimumFractionDigits: dec, maximumFractionDigits: dec }) }
    catch { f = new Intl.NumberFormat('en', { minimumFractionDigits: dec, maximumFractionDigits: dec }) }
    fmtCache.set(key, f)
  }
  return f.format(v).replace(/ /g, ' ')
}

// ------------------------------------------------------------------ boxes
const ANCHORS = { c: [0.5, 0.5], tl: [0, 0], t: [0.5, 0], tr: [1, 0], l: [0, 0.5], r: [1, 0.5], bl: [0, 1], b: [0.5, 1], br: [1, 1] }
/** Top-left corner of a ``w``×``h`` box whose anchor point is at (x, y). */
export function boxOrigin(anchor, w, h) {
  const a = ANCHORS[anchor] || ANCHORS.c
  return [-a[0] * w, -a[1] * h]
}
export const anchorFrac = (anchor) => ANCHORS[anchor] || ANCHORS.c
