// Drawing helpers shared by the elements: panels in the style's manner, styled bars, rough strokes,
// text blocks with per-line / per-word / per-character entrances and accent highlights.
import { clamp, lerp, ease, rng, css, withAlpha, rgba, luma } from '../core.mjs'
import { fontCss, fontSpec, layoutText } from '../fonts.mjs'

export function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))
  ctx.beginPath()
  if (r <= 0.5) ctx.rect(x, y, w, h)
  else ctx.roundRect(x, y, w, h, r)
}

/** A slightly wobbly line (hand-drawn styles). */
export function roughLine(ctx, x0, y0, x1, y1, seed, amp = 2.5) {
  const r = rng(seed)
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 60))
  ctx.moveTo(x0 + (r() - 0.5) * amp, y0 + (r() - 0.5) * amp)
  for (let i = 1; i <= n; i++) {
    const u = i / n
    ctx.lineTo(lerp(x0, x1, u) + (r() - 0.5) * amp, lerp(y0, y1, u) + (r() - 0.5) * amp)
  }
}
export function roughRect(ctx, x, y, w, h, seed, amp = 3) {
  ctx.beginPath()
  roughLine(ctx, x, y, x + w, y, seed, amp); roughLine(ctx, x + w, y, x + w, y + h, seed + 1, amp)
  roughLine(ctx, x + w, y + h, x, y + h, seed + 2, amp); roughLine(ctx, x, y + h, x, y, seed + 3, amp)
}

/** Panel (plate) in the style's manner: fill, border, radius, shadow, print offset, double rule, corner marks. */
export function panel(ctx, env, x, y, w, h, over = {}, seed = 1) {
  const p = { ...env.style.panel, ...over }
  const radius = p.radius ?? 0
  if (p.offset) {
    ctx.fillStyle = env.color('ink'); rr(ctx, x + 9, y + 9, w, h, radius); ctx.fill()
  }
  if (p.shadow) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 14 }
  ctx.fillStyle = env.color(p.fill ?? 'panel')
  if (p.rough) roughRect(ctx, x, y, w, h, seed); else rr(ctx, x, y, w, h, radius)
  ctx.fill()
  if (p.shadow) ctx.restore()
  if (p.stroke) {
    ctx.strokeStyle = env.color(p.stroke); ctx.lineWidth = p.sw ?? 2
    if (p.rough) roughRect(ctx, x, y, w, h, seed + 9); else rr(ctx, x, y, w, h, radius)
    ctx.stroke()
    if (p.double) { rr(ctx, x + 7, y + 7, w - 14, h - 14, Math.max(0, radius - 4)); ctx.lineWidth = 1; ctx.stroke() }
  }
  if (p.corners) {
    const L = Math.min(28, w / 4, h / 3)
    ctx.strokeStyle = env.color('accent'); ctx.lineWidth = 3
    ctx.beginPath()
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
      ctx.moveTo(cx + dx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * L)
    }
    ctx.stroke()
  }
}
/** Text colour on the style's panel. */
export function panelText(env) {
  const p = env.style.panel, pal = env.style.palette // the style's own palette: panels look the same over pictures
  if (p.text) return css(rgba(p.text, pal))
  const fill = rgba(p.fill ?? 'panel', pal), ink = rgba('ink', pal)
  return luma(fill) > 0.55 ? (luma(ink) < 0.5 ? css(ink) : '#111111') : (luma(ink) > 0.55 ? css(ink) : '#ffffff')
}

/** A filled bar in the style's bar manner (``flat``, ``round``, ``outline``, ``hatch``, ``grad``, ``glow``,
 *  ``blocks``, ``marker``, ``offset``, ``thin``). ``horizontal`` – the bar grows along x. */
export function styledBar(ctx, env, x, y, w, h, color, horizontal = false, seed = 1) {
  if (w <= 0.5 || h <= 0.5) return
  const kind = env.style.shape.bar
  const c = env.rgba(color)
  const rad = Math.min(env.style.shape.radius ?? 0, (horizontal ? h : w) / 2)
  switch (kind) {
    case 'outline':
      ctx.fillStyle = css(withAlpha(c, 0.18)); rr(ctx, x, y, w, h, rad); ctx.fill()
      ctx.strokeStyle = css(c); ctx.lineWidth = 2.5; rr(ctx, x + 1.25, y + 1.25, w - 2.5, h - 2.5, rad); ctx.stroke(); break
    case 'hatch': {
      ctx.save(); rr(ctx, x, y, w, h, rad); ctx.clip()
      ctx.fillStyle = css(withAlpha(c, 0.12)); ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = css(c); ctx.lineWidth = 3; ctx.beginPath()
      for (let k = -h; k < w + h; k += 11) { ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h, y) }
      ctx.stroke(); ctx.restore()
      ctx.strokeStyle = css(c); ctx.lineWidth = 2.5; rr(ctx, x, y, w, h, rad); ctx.stroke(); break
    }
    case 'grad': {
      const g = horizontal ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y + h, 0, y)
      g.addColorStop(0, css(withAlpha(c, 0.45))); g.addColorStop(1, css(c))
      ctx.fillStyle = g; rr(ctx, x, y, w, h, rad); ctx.fill(); break
    }
    case 'glow':
      ctx.save(); ctx.shadowColor = css(c); ctx.shadowBlur = 24
      ctx.fillStyle = css(withAlpha(c, 0.85)); rr(ctx, x, y, w, h, rad); ctx.fill(); ctx.restore(); break
    case 'blocks': {
      ctx.fillStyle = css(c)
      const step = 16
      if (horizontal) for (let k = 0; k < w; k += step) ctx.fillRect(x + k, y, Math.min(step - 4, w - k), h)
      else for (let k = 0; k < h; k += step) ctx.fillRect(x, y + h - k - Math.min(step - 4, h - k), w, Math.min(step - 4, h - k))
      break
    }
    case 'marker': {
      ctx.fillStyle = css(withAlpha(c, 0.85)); roughRect(ctx, x, y, w, h, seed, 4); ctx.fill()
      ctx.strokeStyle = env.color('ink'); ctx.lineWidth = 3; roughRect(ctx, x, y, w, h, seed + 5, 3); ctx.stroke(); break
    }
    case 'offset':
      ctx.fillStyle = env.color('ink'); rr(ctx, x + 7, y + 7, w, h, rad); ctx.fill()
      ctx.fillStyle = css(c); rr(ctx, x, y, w, h, rad); ctx.fill()
      ctx.strokeStyle = env.color('ink'); ctx.lineWidth = 3; rr(ctx, x, y, w, h, rad); ctx.stroke(); break
    case 'thin': {
      const k = horizontal ? Math.min(h, 10) : Math.min(w, 10)
      ctx.fillStyle = css(c)
      if (horizontal) rr(ctx, x, y + (h - k) / 2, w, k, k / 2); else rr(ctx, x + (w - k) / 2, y, k, h, k / 2)
      ctx.fill(); break
    }
    case 'round': ctx.fillStyle = css(c); rr(ctx, x, y, w, h, Math.max(rad, 10)); ctx.fill(); break
    default: ctx.fillStyle = css(c); rr(ctx, x, y, w, h, rad); ctx.fill()
  }
}

// ------------------------------------------------------------------ text blocks
const HL = { notebook: 'marker', pastel: 'marker', editorial: 'underline', newspaper: 'underline', bold: 'box', retro: 'box' }

/** Lays out a text element. ``role`` – the default font role. */
export function prepText(ctx, el, env, role, defSize) {
  const size = +(el.size ?? defSize)
  const font = fontSpec(env.style, el.font || role, el.weight ? { weight: el.weight } : {})
  const upper = el.upper ?? font.upper ?? false
  const ls = el.ls ?? font.ls ?? 0
  const lay = layoutText(ctx, el.text, { font, size, maxw: el.w ? +el.w : 0, maxh: el.h ? +el.h : 0, lh: el.lh ?? (size > 90 ? 1.02 : 1.18),
                                         ls, upper, fit: el.fit ?? !!el.h })
  return lay
}

/** Units of an entrance: lines, words or characters, each with its start time (s) inside the entrance. */
export function textUnits(lay, mode, stagger) {
  const units = []
  let i = 0
  lay.lines.forEach((line, li) => {
    if (mode === 'lines' || mode === 'mask' || mode === 'rise' || mode === 'fade' || mode === 'none' || mode === 'wipe' || mode === 'slam') {
      units.push({ li, words: line.words.map((_, wi) => wi), t: li * stagger * 2 })
      return
    }
    line.words.forEach((w, wi) => {
      if (mode === 'chars' || mode === 'type' || mode === 'write') {
        units.push({ li, wi, chars: true, t: i * stagger }); i += w.text.length + 1
      } else { units.push({ li, words: [wi], t: i * stagger }); i++ }
    })
  })
  return units
}

export function textInDur(lay, mode, env, unitDur) {
  const stg = charMode(mode) ? (mode === 'type' ? 0.035 : 0.028) : env.motion.stagger
  const units = textUnits(lay, mode, stg)
  const last = units.length ? units[units.length - 1] : { t: 0 }
  const lastChars = last.chars ? lay.lines[last.li].words[last.wi].text.length * stg : 0
  return last.t + lastChars + (mode === 'type' ? 0.05 : unitDur)
}
const charMode = (m) => m === 'chars' || m === 'type' || m === 'write'

/**
 * Draws a laid-out text block into the box (0, 0, boxW, lay.h) with ``align``. ``k.local`` is the time since
 * the element appeared; ``mode`` the entrance; ``hl`` the accent highlight.
 */
export function drawText(ctx, lay, env, o) {
  const { color, acc, align = 'l', boxW = lay.w, mode = 'fade', local = 99, unitDur = 0.6, stroke, hl: hlIn } = o
  const hl = hlIn || HL[o.styleKey] || 'color'
  const stg = charMode(mode) ? (mode === 'type' ? 0.035 : 0.028) : env.motion.stagger
  const units = textUnits(lay, mode, stg)
  ctx.font = fontCss(lay.font, lay.size)
  ctx.letterSpacing = `${lay.ls}px`
  ctx.textBaseline = 'alphabetic'
  const e = env.motion.ease
  const accColor = acc
  const lineX = (line) => (align === 'c' ? (boxW - line.w) / 2 : align === 'r' ? boxW - line.w : 0)
  let cursor = null
  for (const u of units) {
    const line = lay.lines[u.li]
    const lx = lineX(line), ly = line.y + lay.asc
    if (u.chars) {
      const w = line.words[u.wi]
      const n = w.text.length
      let x = lx + w.x
      for (let c = 0; c < n; c++) {
        const ch = w.text[c]
        const cw = ctx.measureText(ch).width // includes ctx.letterSpacing
        const tc = local - (u.t + c * stg)
        if (tc < 0) { if (mode === 'type' && !cursor) cursor = { x, y: ly }; break }
        const p = mode === 'type' ? 1 : ease(e, tc / (mode === 'write' ? 0.18 : unitDur * 0.6))
        ctx.save()
        if (mode === 'chars') { ctx.globalAlpha *= p; ctx.translate(0, (1 - p) * lay.size * 0.25) }
        if (mode === 'write' && p < 1) { ctx.beginPath(); ctx.rect(x - 2, ly - lay.asc - 4, (cw + 4) * p, lay.size * 1.6); ctx.clip() }
        paintWord(ctx, ch, x, ly, w.acc ? accColor : color, stroke)
        ctx.restore()
        x += cw
        if (mode === 'type') cursor = { x, y: ly }
      }
      if (w.acc) accentFx(ctx, env, hl, lx + w.x, ly, w.w, lay, clamp((local - u.t - n * stg) / 0.4), accColor, o.seed)
      continue
    }
    const tu = local - u.t
    if (tu < 0 && mode !== 'none' && mode !== 'fade' && mode !== 'wipe' && mode !== 'slam') continue
    const p = mode === 'none' || mode === 'fade' || mode === 'wipe' || mode === 'slam' ? 1 : ease(mode === 'pop' ? 'back' : e, tu / unitDur)
    ctx.save()
    if (mode === 'mask') {
      ctx.beginPath(); ctx.rect(-lay.size, line.y - lay.size * 0.1, boxW + lay.size * 2, lay.asc + lay.desc + lay.size * 0.2); ctx.clip()
      ctx.translate(0, (1 - p) * (lay.asc + lay.desc) * 1.05)
    } else if (mode === 'rise' || mode === 'words' || mode === 'lines') {
      ctx.globalAlpha *= clamp(p * 1.5); ctx.translate(0, (1 - p) * lay.size * 0.45)
    } else if (mode === 'blur') {
      ctx.globalAlpha *= p * p
    }
    for (const wi of u.words) {
      const w = line.words[wi]
      const wx = lx + w.x
      ctx.save()
      if (mode === 'pop' || mode === 'blur') {
        const s = mode === 'pop' ? Math.max(0.01, p) : lerp(1.25, 1, p)
        ctx.translate(wx + w.w / 2, ly - lay.size * 0.35); ctx.scale(s, s); ctx.translate(-(wx + w.w / 2), -(ly - lay.size * 0.35))
        if (mode === 'pop') ctx.globalAlpha *= clamp(p * 2)
      }
      if (w.acc) accentFx(ctx, env, hl, wx, ly, w.w, lay, clamp((tu - unitDur * 0.5) / 0.45), accColor, o.seed, true)
      paintWord(ctx, w.text, wx, ly, w.acc && hl !== 'box' ? accColor : (w.acc && hl === 'box' ? env.color('bg') : color), stroke)
      if (w.acc) accentFx(ctx, env, hl, wx, ly, w.w, lay, clamp((tu - unitDur * 0.5) / 0.45), accColor, o.seed, false)
      ctx.restore()
    }
    ctx.restore()
  }
  if (mode === 'type' && cursor && Math.floor(local * 2.5) % 2 === 0) {
    ctx.fillStyle = color
    ctx.fillRect(cursor.x + 3, cursor.y - lay.asc * 0.85, Math.max(3, lay.size * 0.08), lay.asc * 0.95)
  }
  ctx.letterSpacing = '0px'
}

function paintWord(ctx, text, x, y, color, stroke) {
  if (stroke) {
    ctx.lineJoin = 'round'; ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.width
    ctx.strokeText(text, x, y)
  }
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

/** Highlight of an accent word: under the word (``behind``) or over it. */
function accentFx(ctx, env, hl, x, y, w, lay, p, accColor, seed = 1, behind = false) {
  if (p <= 0) return
  const s = lay.size
  if (behind && hl === 'marker') {
    ctx.save(); ctx.fillStyle = css(withAlpha(env.rgba('accent3'), 0.75))
    ctx.beginPath()
    roughLineBox(ctx, x - s * 0.08, y - lay.asc * 0.62, (w + s * 0.16) * p, lay.asc * 0.82, seed)
    ctx.fill(); ctx.restore()
  } else if (behind && hl === 'box') {
    ctx.fillStyle = accColor
    ctx.fillRect(x - s * 0.1, y - lay.asc - s * 0.04, (w + s * 0.2) * p, lay.asc + lay.desc + s * 0.06)
  } else if (!behind && hl === 'underline') {
    ctx.save(); ctx.strokeStyle = accColor; ctx.lineWidth = Math.max(3, s * 0.06); ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.12); ctx.lineTo(x + w * p, y + s * 0.12); ctx.stroke(); ctx.restore()
  } else if (!behind && hl === 'circle') {
    ctx.save(); ctx.strokeStyle = accColor; ctx.lineWidth = Math.max(3, s * 0.05)
    ctx.beginPath(); ctx.ellipse(x + w / 2, y - lay.asc * 0.35, w / 2 + s * 0.3, lay.asc * 0.85, -0.05, -Math.PI * 0.6, -Math.PI * 0.6 + Math.PI * 2.1 * p)
    ctx.stroke(); ctx.restore()
  }
}
function roughLineBox(ctx, x, y, w, h, seed) {
  const r = rng(seed)
  ctx.moveTo(x, y + r() * 4); ctx.lineTo(x + w, y + r() * 4); ctx.lineTo(x + w + r() * 4, y + h); ctx.lineTo(x - r() * 4, y + h); ctx.closePath()
}

/** Default horizontal alignment of a text box from its anchor. */
export const alignOf = (el) => el.align || ({ l: 'l', tl: 'l', bl: 'l', r: 'r', tr: 'r', br: 'r' }[el.anchor] ?? 'c')
