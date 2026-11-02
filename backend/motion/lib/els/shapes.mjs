// Shapes, icons, images, groups and decorative effects.
import { readFileSync } from 'node:fs'
import { Path2D } from '@napi-rs/canvas'
import { clamp, ease, rng, css, withAlpha, lerp } from '../core.mjs'
import { flatten, bounds, tracePartial, pointAt } from '../paths.mjs'
import { rr } from './util.mjs'

let ICONS = null
export function icons() {
  if (!ICONS) ICONS = JSON.parse(readFileSync(new URL('../../data/icons.json', import.meta.url), 'utf8'))
  return ICONS
}
const ICON_ALIASES = { money: 'banknote', dollar: 'dollar-sign', euro: 'euro', ruble: 'russian-ruble', person: 'user', people: 'users',
                       man: 'user', woman: 'user', warning: 'triangle-alert', danger: 'triangle-alert', ok: 'check', yes: 'check',
                       no: 'x', time: 'clock', money_bag: 'hand-coins', chart: 'chart-line', growth: 'trending-up', fall: 'trending-down',
                       world: 'globe', earth: 'globe', idea: 'lightbulb', brain: 'brain', heart: 'heart', fire: 'flame', war: 'swords',
                       ship: 'ship', plane: 'plane', car: 'car', house: 'house', home: 'house', city: 'building-2', factory: 'factory',
                       oil: 'droplet', gold: 'coins', bank: 'landmark', law: 'scale', court: 'gavel', book: 'book-open', crown: 'crown',
                       question: 'circle-help', star: 'star', skull: 'skull', bomb: 'bomb', shield: 'shield', target: 'target',
                       phone: 'smartphone', computer: 'monitor', robot: 'bot', ai: 'bot', lock: 'lock', key: 'key', eye: 'eye',
                       baby: 'baby', doctor: 'stethoscope', pill: 'pill', virus: 'bug', food: 'utensils', water: 'droplets', sun: 'sun',
                       moon: 'moon', rocket: 'rocket', gun: 'crosshair', calendar: 'calendar', map: 'map', flag: 'flag', trophy: 'trophy' }
export function iconPath(name) {
  const all = icons()
  const n = String(name || '').toLowerCase().replace(/_/g, '-')
  return all[n] ?? all[ICON_ALIASES[n] ?? ''] ?? null
}

// ------------------------------------------------------------------ shape
export const shape = {
  own: ['draw'],
  prep(el) {
    const kind = el.kind || (el.d ? 'path' : el.from ? 'line' : 'rect')
    let d, w = +(el.w ?? 200), h = +(el.h ?? el.w ?? 200)
    if (kind === 'line' || kind === 'arrow') {
      const [x0, y0] = el.from || [0, 0], [x1, y1] = el.to || [100, 0]
      const bend = +(el.curve ?? 0)
      const mx = (x0 + x1) / 2 - (y1 - y0) * bend * 0.5, my = (y0 + y1) / 2 + (x1 - x0) * bend * 0.5
      const minx = Math.min(x0, x1, mx), miny = Math.min(y0, y1, my)
      d = bend ? `M${x0 - minx} ${y0 - miny}Q${mx - minx} ${my - miny} ${x1 - minx} ${y1 - miny}` : `M${x0 - minx} ${y0 - miny}L${x1 - minx} ${y1 - miny}`
      el.x = minx; el.y = miny; el.anchor = 'tl'
      w = Math.max(x0, x1, mx) - minx; h = Math.max(y0, y1, my) - miny
    } else if (kind === 'path' || kind === 'poly') {
      d = kind === 'poly' ? 'M' + (el.pts || []).map((p) => p.join(' ')).join('L') + (el.closed ? 'Z' : '') : el.d
      const b = bounds(flatten(d, 8))
      const sx = el.w ? +el.w / Math.max(1, b[2] - b[0]) : 1, sy = el.h ? +el.h / Math.max(1, b[3] - b[1]) : sx
      return { kind, flat: flatten(d), path: new Path2D(d), off: [-b[0], -b[1]], k: [sx, el.h ? sy : sx],
               w: (b[2] - b[0]) * sx, h: (b[3] - b[1]) * (el.h ? sy : sx) }
    } else if (kind === 'circle') {
      const r = w / 2
      d = `M0 ${r}A${r} ${r} 0 1 1 ${w} ${r}A${r} ${r} 0 1 1 0 ${r}Z`; h = w
    } else if (kind === 'ellipse') {
      d = `M0 ${h / 2}A${w / 2} ${h / 2} 0 1 1 ${w} ${h / 2}A${w / 2} ${h / 2} 0 1 1 0 ${h / 2}Z`
    } else {
      const r = Math.min(+(el.r ?? 0), w / 2, h / 2)
      d = r ? `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${r}A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`
            : `M0 0H${w}V${h}H0Z`
    }
    return { kind, flat: flatten(d), path: new Path2D(d), off: [0, 0], k: [1, 1], w, h }
  },
  inDur(el, st, env) { return el.in === 'draw' ? Math.max(0.5, Math.min(2.2, st.flat.len / 900)) : env.motion.dur },
  draw(ctx, el, st, k, env) {
    const lineish = st.kind === 'line' || st.kind === 'arrow'
    const stroke = el.stroke ?? (lineish ? (el.color ?? 'ink') : null)
    const fill = lineish ? null : (el.fill ?? (el.stroke ? null : el.color ?? 'accent'))
    const sw = +(el.sw ?? env.style.shape.stroke ?? 3)
    const drawing = k.inName === 'draw'
    const p = drawing ? k.in : 1
    ctx.save()
    ctx.translate(st.off[0] * st.k[0], st.off[1] * st.k[1])
    ctx.scale(st.k[0], st.k[1])
    if (fill) {
      ctx.save(); ctx.globalAlpha *= drawing ? clamp((p - 0.6) / 0.4) : 1
      ctx.fillStyle = env.color(fill); ctx.fill(st.path); ctx.restore()
    }
    if (stroke) {
      ctx.strokeStyle = env.color(stroke); ctx.lineWidth = sw / st.k[0]
      ctx.lineCap = env.style.shape.cap === 'round' || lineish ? 'round' : 'butt'; ctx.lineJoin = 'round'
      if (el.dash) ctx.setLineDash(el.dash === true ? [sw * 3, sw * 2.5] : el.dash)
      if (p >= 1 && !el.flow) ctx.stroke(st.path)
      else { ctx.beginPath(); tracePartial(ctx, st.flat, 0, p); ctx.stroke() }
      ctx.setLineDash([])
      if (st.kind === 'arrow' && p > 0.02) {
        const tip = pointAt(st.flat, p)
        const s = Math.max(14, sw * 4.2) * +(el.head ?? 1)
        ctx.fillStyle = env.color(stroke)
        ctx.beginPath()
        ctx.moveTo(tip.x + Math.cos(tip.a) * s * 0.35, tip.y + Math.sin(tip.a) * s * 0.35)
        ctx.lineTo(tip.x + Math.cos(tip.a + 2.6) * s, tip.y + Math.sin(tip.a + 2.6) * s)
        ctx.lineTo(tip.x + Math.cos(tip.a - 2.6) * s, tip.y + Math.sin(tip.a - 2.6) * s)
        ctx.closePath(); ctx.fill()
      }
      if (el.flow) { // a dot running along the line
        const f = ((k.local * 0.5) % 1)
        const pt = pointAt(st.flat, f)
        ctx.fillStyle = env.color(el.flow === true ? 'accent' : el.flow)
        ctx.beginPath(); ctx.arc(pt.x, pt.y, sw * 2.2, 0, Math.PI * 2); ctx.fill()
      }
    }
    ctx.restore()
  },
}

// ------------------------------------------------------------------ icon
export const icon = {
  own: ['draw'],
  defaultIn: 'draw',
  prep(el) {
    const d = iconPath(el.name)
    if (!d) throw new Error(`нет иконки «${el.name}» (имена Lucide: users, globe, coins, trending-up…)`)
    const size = +(el.size ?? 140)
    return { flat: flatten(d, 10), path: new Path2D(d), size, w: size, h: size }
  },
  inDur(el, st, env) { return el.in === 'draw' || el.in === undefined ? 0.9 : env.motion.dur },
  draw(ctx, el, st, k, env) {
    const s = st.size / 24
    if (el.bg) {
      const bp = ease('back', k.local / 0.5)
      ctx.save(); ctx.globalAlpha *= clamp(bp)
      ctx.fillStyle = env.color(el.bg)
      ctx.beginPath(); ctx.arc(st.size / 2, st.size / 2, st.size * 0.62 * Math.max(0.01, bp), 0, Math.PI * 2); ctx.fill(); ctx.restore()
    }
    ctx.save()
    ctx.scale(s, s)
    ctx.strokeStyle = env.color(el.color ?? 'ink')
    ctx.lineWidth = +(el.sw ?? 2)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (el.fill) { ctx.fillStyle = env.color(el.fill); ctx.fill(st.path) }
    if (k.inName === 'draw' && k.in < 1) { ctx.beginPath(); tracePartial(ctx, st.flat, 0, k.in); ctx.stroke() }
    else ctx.stroke(st.path)
    ctx.restore()
  },
}

// ------------------------------------------------------------------ image
export const image = {
  prep(el, env) {
    const img = env.images[el.src]
    if (!img) throw new Error(`нет картинки «${el.src}» (доступны: ${Object.keys(env.images).join(', ') || 'нет'})`)
    const w = +(el.w ?? 800), h = +(el.h ?? (el.w ? +el.w * img.height / img.width : 450))
    return { img, w, h }
  },
  draw(ctx, el, st, k, env) {
    const { img, w, h } = st
    const r = +(el.r ?? env.style.shape.radius ?? 0)
    ctx.save()
    if (el.border) { ctx.fillStyle = env.color(el.border); rr(ctx, -8, -8, w + 16, h + 16, r + 6); ctx.fill() }
    rr(ctx, 0, 0, w, h, r); ctx.clip()
    const fit = el.fit === 'contain' ? Math.min(w / img.width, h / img.height) : Math.max(w / img.width, h / img.height)
    const z = 1 + (+(el.kb ?? 0.08)) * clamp(k.local / Math.max(1, k.end - k.t + k.local))
    const iw = img.width * fit * z, ih = img.height * fit * z
    ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih)
    if (el.tint) { ctx.fillStyle = env.color(el.tint); ctx.fillRect(0, 0, w, h) }
    ctx.restore()
  },
}

// ------------------------------------------------------------------ group
export const group = {
  prep(el) { return { w: +(el.w ?? 0), h: +(el.h ?? 0) } },
  draw() {},
}

// ------------------------------------------------------------------ decor
export const decor = {
  own: ['burst'],
  prep(el) {
    const w = +(el.w ?? 400), h = +(el.h ?? el.w ?? 400)
    const r = rng((el.seed ?? 7) * 97 + w)
    const n = +(el.n ?? ({ burst: 14, rings: 3, particles: 40, confetti: 60, sparkle: 8 }[el.kind] ?? 20))
    const items = Array.from({ length: n }, () => ({ a: r() * Math.PI * 2, d: r(), s: r(), c: Math.floor(r() * 3), x: r(), y: r() }))
    return { w, h, n, items }
  },
  inDur() { return 0.8 },
  draw(ctx, el, st, k, env) {
    const { w, h, items } = st
    const cols = ['accent', 'accent2', 'accent3'].map((c) => env.rgba(c))
    const col = el.color ? env.rgba(el.color) : null
    const t = k.local
    ctx.save()
    switch (el.kind) {
      case 'burst': {
        const p = ease('expo-out', t / 0.7), fade = clamp(1 - (t - 0.4) / 0.5)
        if (fade <= 0) break
        ctx.strokeStyle = css(col || cols[0]); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.globalAlpha *= fade
        ctx.beginPath()
        items.forEach((it, i) => {
          const a = (i / items.length) * Math.PI * 2
          const r0 = w * 0.18 + w * 0.22 * p, r1 = r0 + w * 0.12 * (1 - p * 0.6)
          ctx.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0); ctx.lineTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1)
        })
        ctx.stroke(); break
      }
      case 'rings': {
        ctx.strokeStyle = css(col || cols[0]); ctx.lineWidth = 3
        for (let i = 0; i < st.n; i++) {
          const u = ((t * 0.6 + i / st.n) % 1)
          ctx.globalAlpha = (1 - u) * 0.8
          ctx.beginPath(); ctx.arc(w / 2, h / 2, (w / 2) * u, 0, Math.PI * 2); ctx.stroke()
        }
        break
      }
      case 'particles': {
        for (const it of items) {
          const x = ((it.x * w + Math.sin(t * 0.5 + it.a) * 30 + t * 12 * (it.s - 0.5)) % w + w) % w
          const y = ((it.y * h - t * (10 + it.s * 30)) % h + h) % h
          ctx.fillStyle = css(withAlpha(col || cols[it.c], 0.25 + it.d * 0.6))
          ctx.beginPath(); ctx.arc(x, y, 1.5 + it.s * 4, 0, Math.PI * 2); ctx.fill()
        }
        break
      }
      case 'confetti': {
        for (const it of items) {
          const y = -40 + (t * (220 + it.s * 260) + it.y * h * 0.3)
          if (y > h + 40) continue
          const x = it.x * w + Math.sin(t * 2 + it.a) * 40
          ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 * (it.s - 0.5) + it.a)
          ctx.fillStyle = css(col || cols[it.c]); ctx.fillRect(-8, -4, 16, 8); ctx.restore()
        }
        break
      }
      case 'sparkle': {
        for (const it of items) {
          const tw = Math.max(0, Math.sin(t * (2 + it.s * 3) + it.a))
          const x = it.x * w, y = it.y * h, s = (8 + it.d * 18) * tw
          ctx.fillStyle = css(col || cols[it.c])
          ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s)
          ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill()
        }
        break
      }
      default: break
    }
    ctx.restore()
  },
}

export const _lerp = lerp
