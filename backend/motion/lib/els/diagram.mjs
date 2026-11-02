// Explanatory elements: timeline, list, compare, flow, callout.
import { Path2D } from '@napi-rs/canvas'
import { clamp, ease, boxOrigin, css, withAlpha } from '../core.mjs'
import { fontCss, fontSpec, layoutText } from '../fonts.mjs'
import { panel, panelText, drawText, rr } from './util.mjs'
import { drawLabel } from './text.mjs'
import { iconPath } from './shapes.mjs'
import { flatten, tracePartial } from '../paths.mjs'

/** One line of display text, shrunk until it fits ``maxw``. */
function fitLine(ctx, env, text, size, maxw) {
  const f = fontSpec(env.style, 'display')
  const one = text.replace(/ /g, ' ') // never wrap a value
  const opts = (sz) => ({ font: f, size: sz, upper: f.upper, ls: f.ls ?? 0 })
  const first = layoutText(ctx, one, opts(size))
  return first.w <= maxw ? first : layoutText(ctx, one, opts(size * maxw / first.w))
}

const items = (list) => (list || []).map((it) => (typeof it === 'string' ? { text: it } : { ...it, text: it.text ?? it.l ?? it.label ?? '' }))
const lay = (ctx, env, role, text, size, maxw) => {
  const f = fontSpec(env.style, role)
  return layoutText(ctx, text, { font: f, size, maxw, upper: f.upper, ls: f.ls ?? 0, lh: 1.12 })
}

/** Start of item i: its own ``at`` (scene time, relative to the element) or an even stagger. */
const itemAt = (el, it, i, gap) => (it.at !== undefined ? +it.at - +(el.at ?? 0) : i * gap)

function drawIcon(ctx, env, name, x, y, size, color, p = 1) {
  const d = iconPath(name)
  if (!d) return
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24)
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  if (p >= 1) ctx.stroke(new Path2D(d)); else { ctx.beginPath(); tracePartial(ctx, flatten(d, 8), 0, p); ctx.stroke() }
  ctx.restore()
}

// ------------------------------------------------------------------ timeline
export const timeline = {
  hasText: true,
  own: ['draw'],
  defaultIn: 'draw',
  prep(el, env, ctx) {
    const list = items(el.items).map((it) => ({ ...it, d: String(it.d ?? it.date ?? '') }))
    if (!list.length) throw new Error('timeline: пустой items')
    const vertical = el.dir === 'v'
    const w = +(el.w ?? (vertical ? 1100 : 1600)), h = +(el.h ?? (vertical ? 860 : 520))
    const n = list.length
    const slot = vertical ? h / n : w / n
    const dsize = +(el.dateSize ?? (vertical ? 46 : Math.min(64, slot * 0.3)))
    const tsize = +(el.size ?? (vertical ? 34 : Math.min(34, slot * 0.14 + 12)))
    const dates = list.map((it) => lay(ctx, env, 'display', it.d, dsize, vertical ? w * 0.3 : slot * 0.95))
    const texts = list.map((it) => lay(ctx, env, 'body', it.text, tsize, vertical ? w * 0.62 : slot * 0.9))
    const gap = +(el.gap ?? 0.55)
    return { list, vertical, w, h, n, slot, dates, texts, gap }
  },
  inDur(el, st) { return Math.max(...st.list.map((it, i) => itemAt(el, it, i, st.gap))) + 0.8 },
  draw(ctx, el, st, k, env) {
    const { list, vertical, w, h, n, slot, dates, texts } = st
    const lineCol = env.color(el.lineColor ?? 'ink/50')
    const starts = list.map((it, i) => itemAt(el, it, i, st.gap))
    const lastStart = Math.max(...starts)
    const lp = k.inName === 'draw' ? clamp(k.local / (lastStart + 0.6)) : 1
    ctx.fillStyle = lineCol
    if (vertical) ctx.fillRect(w * 0.34 - 1.5, 0, 3, h * lp); else ctx.fillRect(0, h * 0.5 - 1.5, w * lp, 3)
    list.forEach((it, i) => {
      const tl = k.inName === 'draw' ? k.local - starts[i] : 99
      if (tl < 0) return
      const p = ease('back', tl / 0.5), tp = clamp(tl / 0.6)
      const c = env.color(it.c ?? (el.hi === i ? 'accent' : el.color ?? 'accent'))
      const cx = vertical ? w * 0.34 : slot * i + slot / 2, cy = vertical ? slot * i + slot / 2 : h * 0.5
      const R = 12 + (el.hi === i ? 6 : 0)
      ctx.fillStyle = env.color('bg'); ctx.strokeStyle = c; ctx.lineWidth = 5
      ctx.beginPath(); ctx.arc(cx, cy, R * Math.max(0.01, p), 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      if (el.hi === i || it.c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, R * 0.5 * Math.max(0.01, p), 0, Math.PI * 2); ctx.fill() }
      ctx.save(); ctx.globalAlpha *= tp
      const dl = dates[i], tx = texts[i]
      if (vertical) {
        ctx.save(); ctx.translate(cx - 36 - dl.w, cy - dl.h / 2 + (1 - tp) * 12); drawLabel(ctx, dl, env, it.c ?? 'accent', 'r', dl.w); ctx.restore()
        ctx.translate(cx + 36 + (1 - tp) * 20, cy - tx.h / 2)
        drawText(ctx, tx, env, { color: env.color('ink'), acc: env.color('accent'), align: 'l', boxW: tx.w, mode: 'none', local: 99, styleKey: env.style.name })
      } else {
        const up = el.alt !== false && i % 2 === 1
        ctx.save(); ctx.translate(cx - dl.w / 2, up ? cy + 34 + (1 - tp) * 10 : cy - 34 - dl.h - (1 - tp) * 10)
        drawLabel(ctx, dl, env, it.c ?? (el.hi === i ? 'accent' : 'accent'), 'c', dl.w); ctx.restore()
        ctx.translate(cx - tx.w / 2, up ? cy - 34 - tx.h : cy + 34)
        drawText(ctx, tx, env, { color: env.color('ink'), acc: env.color('accent'), align: 'c', boxW: tx.w, mode: 'none', local: 99, styleKey: env.style.name })
      }
      ctx.restore()
    })
  },
}

// ------------------------------------------------------------------ list
const MARKS = { check: 'check', x: 'x', cross: 'x', arrow: 'arrow-right', star: 'star', warn: 'triangle-alert', plus: 'plus', minus: 'minus' }

export const list = {
  hasText: true,
  own: ['items'],
  defaultIn: 'items',
  prep(el, env, ctx) {
    const its = items(el.items)
    if (!its.length) throw new Error('list: пустой items')
    const size = +(el.size ?? 46)
    const w = +(el.w ?? 1200)
    const markW = el.marker === 'none' ? 0 : size * 1.5
    const texts = its.map((it) => lay(ctx, env, el.font || 'body', it.text, size, w - markW))
    const gap = size * +(el.spacing ?? 0.7)
    const h = texts.reduce((a, t) => a + t.h, 0) + gap * (its.length - 1)
    return { its, size, w, markW, texts, gap, h, step: +(el.gap ?? env.motion.stagger * 6 + 0.25) }
  },
  inDur(el, st, env) { return Math.max(...st.its.map((it, i) => itemAt(el, it, i, st.step))) + env.motion.dur },
  draw(ctx, el, st, k, env, node) {
    const { its, size, markW, texts, gap } = st
    let y = 0
    its.forEach((it, i) => {
      const tl = k.inName === 'items' ? k.local - itemAt(el, it, i, st.step) : 99
      const t = texts[i]
      if (tl >= 0) {
        const p = ease(env.motion.ease, tl / env.motion.dur)
        const dim = el.focus && i < its.length - 1 && its.slice(i + 1).some((nx, j) => k.local >= itemAt(el, nx, i + 1 + j, st.step))
        ctx.save(); ctx.translate((1 - p) * -40, y); ctx.globalAlpha *= clamp(p * 1.5) * (dim ? 0.4 : 1)
        const mk = it.marker ?? el.marker ?? 'num'
        const mc = env.color(it.c ?? (el.hi === i ? 'accent' : el.markColor ?? 'accent'))
        const my = Math.min(t.asc, size) * 0.55
        if (mk === 'num') {
          ctx.font = fontCss(fontSpec(env.style, 'display'), size * 0.95); ctx.fillStyle = mc
          ctx.fillText(String(i + 1).padStart(its.length > 9 ? 2 : 1, '0'), 0, t.asc)
        } else if (mk === 'dot') {
          ctx.fillStyle = mc; ctx.beginPath(); ctx.arc(size * 0.35, my, size * 0.16, 0, Math.PI * 2); ctx.fill()
        } else if (mk === 'box') {
          ctx.fillStyle = mc; rr(ctx, 0, my - size * 0.42, size * 0.84, size * 0.84, env.style.shape.radius ? 8 : 0); ctx.fill()
          ctx.font = fontCss(fontSpec(env.style, 'display'), size * 0.6); ctx.fillStyle = env.color('bg'); ctx.textAlign = 'center'
          ctx.fillText(String(i + 1), size * 0.42, my + size * 0.22); ctx.textAlign = 'left'
        } else if (mk !== 'none') {
          drawIcon(ctx, env, MARKS[mk] ?? mk, 0, my - size * 0.45, size * 0.9, mc, clamp(tl / 0.5))
        }
        ctx.translate(markW, 0)
        drawText(ctx, t, env, { color: env.color(el.color ?? 'ink'), acc: env.color('accent'), align: 'l', boxW: t.w, mode: 'none', local: 99,
                                hl: el.hl, styleKey: env.style.name, seed: node.seed + i })
        ctx.restore()
      }
      y += t.h + gap
    })
  },
}

// ------------------------------------------------------------------ compare
export const compare = {
  hasText: true,
  own: ['split'],
  defaultIn: 'split',
  prep(el, env, ctx) {
    const w = +(el.w ?? 1560), h = +(el.h ?? 640)
    const colW = w * 0.42
    const side = (s) => {
      s = typeof s === 'string' ? { title: s } : (s || {})
      return { ...s,
        title: lay(ctx, env, 'label', s.title ?? '', +(el.titleSize ?? 40), colW - 60),
        value: s.value !== undefined ? fitLine(ctx, env, String(s.value), +(el.valueSize ?? 120), colW - 50) : null,
        sub: s.sub ? lay(ctx, env, 'body', s.sub, +(el.subSize ?? 34), colW - 60) : null }
    }
    return { w, h, colW, a: side(el.a), b: side(el.b) }
  },
  inDur() { return 1.4 },
  draw(ctx, el, st, k, env, node) {
    const { w, h, colW, a, b } = st
    const p = k.inName === 'split' ? ease('expo-out', k.local / 0.8) : 1
    const drawSide = (s, x, dir, delay, color) => {
      const sp = k.inName === 'split' ? ease(env.motion.ease, (k.local - delay) / 0.7) : 1
      if (sp <= 0) return
      ctx.save(); ctx.translate(x + dir * (1 - sp) * 60, 0); ctx.globalAlpha *= clamp(sp * 1.4)
      if (el.panels !== false) panel(ctx, env, 0, 0, colW, h, {}, node.seed + delay * 10)
      const tc = el.panels !== false ? panelText(env) : env.color('ink')
      let y = h * 0.14
      if (s.icon) { drawIcon(ctx, env, s.icon, colW / 2 - 50, y, 100, env.color(color), clamp((k.local - delay) / 0.8)); y += 130 }
      ctx.save(); ctx.translate((colW - s.title.w) / 2, y); drawLabel(ctx, s.title, env, el.panels !== false ? 'muted' : 'muted', 'c', s.title.w); ctx.restore()
      y += s.title.h + 24
      if (s.value) {
        ctx.save(); ctx.translate((colW - s.value.w) / 2, y)
        drawText(ctx, s.value, env, { color: env.color(color), acc: env.color(color), align: 'c', boxW: s.value.w, mode: 'none', local: 99, styleKey: env.style.name })
        ctx.restore(); y += s.value.h + 20
      }
      if (s.sub) {
        ctx.translate((colW - s.sub.w) / 2, y)
        drawText(ctx, s.sub, env, { color: tc, acc: env.color('accent'), align: 'c', boxW: s.sub.w, mode: 'none', local: 99, styleKey: env.style.name })
      }
      ctx.restore()
    }
    drawSide(a, 0, -1, 0, a.c ?? el.colorA ?? 'accent2')
    drawSide(b, w - colW, 1, 0.25, b.c ?? el.colorB ?? 'accent')
    // the middle: «VS» or an arrow
    const mp = ease('back', (k.local - 0.5) / 0.5)
    if (mp > 0) {
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(Math.max(0.01, mp), Math.max(0.01, mp))
      if (el.mid === 'arrow') {
        drawIcon(ctx, env, 'arrow-right', -45, -45, 90, env.color('ink'))
      } else {
        const r = 62
        ctx.fillStyle = env.color('accent'); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
        ctx.font = fontCss(fontSpec(env.style, 'display'), 50); ctx.fillStyle = env.color('bg'); ctx.textAlign = 'center'
        ctx.fillText(el.mid ?? 'VS', 0, 18); ctx.textAlign = 'left'
      }
      ctx.restore()
    }
    void p
  },
}

// ------------------------------------------------------------------ flow (process / chain / cycle)
export const flow = {
  hasText: true,
  own: ['chain'],
  defaultIn: 'chain',
  prep(el, env, ctx) {
    const nodes = items(el.nodes || el.items)
    if (!nodes.length) throw new Error('flow: пустой nodes')
    const kind = el.kind ?? 'row'
    const w = +(el.w ?? 1640), h = +(el.h ?? (kind === 'cycle' ? 820 : kind === 'col' ? 860 : 420))
    const n = nodes.length
    const boxW = kind === 'row' ? Math.min(380, (w - (n - 1) * 90) / n) : kind === 'col' ? Math.min(760, w) : Math.min(340, w / 3.2)
    const size = +(el.size ?? Math.min(46, boxW * 0.12 + 12))
    const texts = nodes.map((nd) => lay(ctx, env, 'body', nd.text, size, boxW - 40))
    const iconS = size * 2.3
    const boxH = Math.max(...texts.map((t) => t.h)) + 56 + (nodes.some((nd) => nd.icon) ? iconS + 16 : 0)
    const pos = nodes.map((_, i) => {
      if (kind === 'row') { const gapX = n > 1 ? (w - n * boxW) / (n - 1) : 0; return [i * (boxW + gapX), (h - boxH) / 2] }
      if (kind === 'col') { const gapY = n > 1 ? (h - n * boxH) / (n - 1) : 0; return [(w - boxW) / 2, i * (boxH + gapY)] }
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2
      return [w / 2 + Math.cos(a) * (w / 2 - boxW / 2) - boxW / 2, h / 2 + Math.sin(a) * (h / 2 - boxH / 2) - boxH / 2]
    })
    return { nodes, kind, w, h, boxW, boxH, texts, pos, iconS, step: +(el.gap ?? 0.7) }
  },
  inDur(el, st) { return Math.max(...st.nodes.map((nd, i) => itemAt(el, nd, i, st.step))) + 0.8 },
  draw(ctx, el, st, k, env, node) {
    const { nodes, kind, boxW, boxH, texts, pos, iconS } = st
    const n = nodes.length
    const starts = nodes.map((nd, i) => itemAt(el, nd, i, st.step))
    const edges = kind === 'cycle' ? nodes.map((_, i) => [i, (i + 1) % n]) : nodes.slice(1).map((_, i) => [i, i + 1])
    // arrows first, under the boxes
    for (const [a, b] of edges) {
      const t0 = starts[a] + 0.35, t1 = starts[b]
      const p = k.inName === 'chain' ? clamp((k.local - t0) / Math.max(0.2, t1 - t0)) : 1
      if (p <= 0) continue
      const ca = [pos[a][0] + boxW / 2, pos[a][1] + boxH / 2], cb = [pos[b][0] + boxW / 2, pos[b][1] + boxH / 2]
      const dx = cb[0] - ca[0], dy = cb[1] - ca[1], L = Math.hypot(dx, dy) || 1
      const ux = dx / L, uy = dy / L
      // leave the boxes: clip the segment by the box half sizes
      const ta = Math.min(Math.abs(boxW / 2 / (ux || 1e-6)), Math.abs(boxH / 2 / (uy || 1e-6))) + 14
      const tb = Math.min(Math.abs(boxW / 2 / (ux || 1e-6)), Math.abs(boxH / 2 / (uy || 1e-6))) + 18
      const sx = ca[0] + ux * ta, sy = ca[1] + uy * ta, ex = cb[0] - ux * tb, ey = cb[1] - uy * tb
      const cx = sx + (ex - sx) * p, cy = sy + (ey - sy) * p
      ctx.strokeStyle = env.color(el.lineColor ?? 'ink/70'); ctx.lineWidth = 4; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx, cy); ctx.stroke()
      const a2 = Math.atan2(uy, ux), s = 18
      ctx.fillStyle = env.color(el.lineColor ?? 'ink/70')
      ctx.beginPath(); ctx.moveTo(cx + ux * 6, cy + uy * 6); ctx.lineTo(cx + Math.cos(a2 + 2.6) * s, cy + Math.sin(a2 + 2.6) * s)
      ctx.lineTo(cx + Math.cos(a2 - 2.6) * s, cy + Math.sin(a2 - 2.6) * s); ctx.closePath(); ctx.fill()
    }
    nodes.forEach((nd, i) => {
      const tl = k.inName === 'chain' ? k.local - starts[i] : 99
      if (tl < 0) return
      const p = ease(env.motion.pop, tl / 0.55)
      const [x, y] = pos[i]
      ctx.save(); ctx.translate(x + boxW / 2, y + boxH / 2); ctx.scale(Math.max(0.01, p), Math.max(0.01, p)); ctx.translate(-boxW / 2, -boxH / 2)
      ctx.globalAlpha *= clamp(p * 2)
      const hi = el.hi === i || nd.hi
      panel(ctx, env, 0, 0, boxW, boxH, hi ? { fill: 'accent' } : {}, node.seed + i)
      const tc = hi ? env.color('bg') : panelText(env)
      let ty = 28
      if (nd.icon) { drawIcon(ctx, env, nd.icon, boxW / 2 - iconS / 2, ty, iconS, hi ? env.color('bg') : env.color(nd.c ?? 'accent'), clamp(tl / 0.8)); ty += iconS + 16 }
      ctx.translate((boxW - texts[i].w) / 2, ty)
      drawText(ctx, texts[i], env, { color: tc, acc: env.color(hi ? 'bg' : 'accent'), align: 'c', boxW: texts[i].w, mode: 'none', local: 99, styleKey: env.style.name })
      ctx.restore()
    })
  },
}

// ------------------------------------------------------------------ callout (label + leader line to a point)
export const callout = {
  hasText: true,
  own: ['point'],
  defaultIn: 'point',
  prep(el, env, ctx) {
    const size = +(el.size ?? 38)
    const t = lay(ctx, env, el.font || 'label', el.text ?? '', size, +(el.w ?? 560))
    const pad = el.plate === false ? 0 : size * 0.45
    const w = t.w + pad * 2, h = t.h + pad * 2
    const [ox, oy] = boxOrigin(el.anchor || 'c', w, h)
    return { t, pad, w, h, ox, oy }
  },
  inDur() { return 1.1 },
  draw(ctx, el, st, k, env, node) {
    const { t, pad, w, h } = st
    const [tx, ty] = el.to || [+(el.x ?? 960), +(el.y ?? 540) + 200]
    // the target in the box's local coordinates
    const lx = tx - +(el.x ?? 960) - st.ox, ly = ty - +(el.y ?? 540) - st.oy
    const pp = k.inName === 'point' ? ease('back', k.local / 0.4) : 1
    const lp = k.inName === 'point' ? clamp((k.local - 0.2) / 0.45) : 1
    const bp = k.inName === 'point' ? ease(env.motion.ease, (k.local - 0.5) / 0.5) : 1
    const c = env.color(el.color ?? 'accent')
    // target ring
    ctx.save()
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(lx, ly, 9 * Math.max(0.01, pp), 0, Math.PI * 2); ctx.fill()
    const pulse = (k.local * 0.8) % 1
    ctx.globalAlpha *= (1 - pulse) * clamp(pp)
    ctx.beginPath(); ctx.arc(lx, ly, 10 + pulse * 34, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
    // leader from the nearest box edge point
    const ex = Math.max(0, Math.min(w, lx)), ey = Math.max(0, Math.min(h, ly))
    const sx = lx < 0 || lx > w ? (lx < 0 ? 0 : w) : ex, sy = lx < 0 || lx > w ? ey : (ly < 0 ? 0 : h)
    ctx.strokeStyle = c; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + (sx - lx) * lp, ly + (sy - ly) * lp); ctx.stroke()
    if (bp > 0) {
      ctx.save(); ctx.globalAlpha *= clamp(bp * 1.5)
      ctx.translate(w / 2, h / 2); ctx.scale(0.9 + 0.1 * bp, 0.9 + 0.1 * bp); ctx.translate(-w / 2, -h / 2)
      if (el.plate !== false) panel(ctx, env, 0, 0, w, h, {}, node.seed)
      ctx.translate(pad, pad)
      drawText(ctx, t, env, { color: el.plate === false ? env.color(el.textColor ?? 'ink') : panelText(env), acc: c, align: 'l', boxW: t.w,
                              mode: 'none', local: 99, styleKey: env.style.name })
      ctx.restore()
    }
    void css; void withAlpha
  },
}
