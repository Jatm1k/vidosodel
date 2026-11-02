// Fonts and text layout: the bundled OFL fonts (fonts/Family-Weight.ttf), the user's fonts folder,
// word wrapping with *accent* markup, per-word / per-character positions for text animations.
import { readdirSync, existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GlobalFonts } from '@napi-rs/canvas'

const BUNDLED = fileURLToPath(new URL('../fonts/', import.meta.url))
export const FAMILIES = new Set()
let loaded = false

/** «PlayfairDisplay» → «Playfair Display», «PTSerif» → «PT Serif», «JetBrainsMono» → «JetBrains Mono». */
const SPACED = { PTSerif: 'PT Serif', PTMono: 'PT Mono', JetBrainsMono: 'JetBrains Mono', OldStandardTT: 'Old Standard TT',
                 PressStart2P: 'Press Start 2P', DelaGothicOne: 'Dela Gothic One', RussoOne: 'Russo One', YesevaOne: 'Yeseva One',
                 PlayfairDisplay: 'Playfair Display', CormorantGaramond: 'Cormorant Garamond' }

export function loadFonts(extraDir) {
  if (loaded) return
  loaded = true
  for (const f of readdirSync(BUNDLED)) {
    if (extname(f) !== '.ttf') continue
    const [stem] = basename(f, '.ttf').split('-')
    const family = SPACED[stem] || stem
    GlobalFonts.registerFromPath(join(BUNDLED, f), family)
    FAMILIES.add(family)
  }
  if (extraDir && existsSync(extraDir)) {
    for (const f of readdirSync(extraDir)) {
      if (!['.ttf', '.otf'].includes(extname(f).toLowerCase())) continue
      const family = basename(f).replace(/\.(ttf|otf)$/i, '').split('-')[0]
      try { GlobalFonts.registerFromPath(join(extraDir, f), family); FAMILIES.add(family) } catch { /* broken file */ }
    }
  }
}

/** A font role of the style (``display``, ``body``, ``label``, ``mono``, ``hand``) or a family name. */
export function fontSpec(style, role, over = {}) {
  const base = style.fonts[role] || (FAMILIES.has(role) ? { family: role, weight: 400 } : style.fonts.body)
  return { ...base, ...over }
}
export const fontCss = (f, size) => `${f.weight || 400} ${Math.max(1, size).toFixed(1)}px "${f.family}"`

// ------------------------------------------------------------------ markup
/** «Рост *в 3 раза* за год» → words with an accent flag; ``\n`` forces a line break. */
export function parseMarkup(text) {
  const out = []
  let acc = false
  for (const para of String(text ?? '').split('\n')) {
    if (out.length) out.push({ br: true })
    for (const raw of para.split(/\s+/)) {
      if (!raw) continue
      // every «*» toggles the accent, also inside a word: «№*1147*» → «№» + accented «1147»
      const parts = raw.split('*')
      parts.forEach((part, k) => {
        if (k > 0) acc = !acc
        if (part) out.push({ text: part, acc, glue: k > 0 && out.length > 0 && !out[out.length - 1].br && parts.slice(0, k).some(Boolean) })
      })
    }
  }
  return out
}
export const plain = (text) => String(text ?? '').replace(/\*/g, '')

// ------------------------------------------------------------------ layout
/**
 * Lays out text: ``{lines: [{words: [{text, acc, x, w}], w, y}], w, h, size, asc}``.
 * ``maxw`` wraps; ``fit`` shrinks the size until the text fits ``maxw`` × ``maxh`` (min 40 % of the size).
 */
export function layoutText(ctx, text, opts) {
  const { font, maxw = 0, maxh = 0, lh = 1.15, ls = 0, upper = false } = opts
  let size = opts.size
  const words = parseMarkup(upper ? String(text ?? '').toUpperCase() : text)
  for (let attempt = 0; attempt < 12; attempt++) {
    const res = _layout(ctx, words, font, size, maxw, lh, ls)
    const fitsW = !maxw || res.w <= maxw + 1
    const fitsH = !maxh || res.h <= maxh + 1
    if ((fitsW && fitsH) || !opts.fit || size <= opts.size * 0.4) return res
    size *= 0.92
  }
  return _layout(ctx, words, font, size, maxw, lh, ls)
}

function _layout(ctx, words, font, size, maxw, lh, ls) {
  ctx.font = fontCss(font, size)
  ctx.letterSpacing = `${ls * size / 40}px`
  const space = ctx.measureText(' ').width
  const lines = []
  let cur = { words: [], w: 0 }
  for (const wd of words) {
    if (wd.br) { lines.push(cur); cur = { words: [], w: 0 }; continue }
    const w = ctx.measureText(wd.text).width
    const gap = wd.glue ? 0 : space
    const nx = cur.words.length ? cur.w + gap : 0
    if (maxw && cur.words.length && !wd.glue && nx + w > maxw) {
      lines.push(cur)
      cur = { words: [], w: 0 }
    }
    const x = cur.words.length ? cur.w + gap : 0
    cur.words.push({ text: wd.text, acc: wd.acc, x, w })
    cur.w = x + w
  }
  lines.push(cur)
  const m = ctx.measureText('ЁÁHg')
  const asc = m.fontBoundingBoxAscent || size * 0.8
  const desc = m.fontBoundingBoxDescent || size * 0.2
  const step = size * lh
  lines.forEach((l, i) => { l.y = i * step })
  ctx.letterSpacing = '0px'
  return { lines, w: Math.max(0, ...lines.map((l) => l.w)), h: (lines.length - 1) * step + asc + desc, size, asc, desc, space,
           ls: ls * size / 40, font }
}
