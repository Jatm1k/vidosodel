// Data elements: bars, linechart, donut, ring, iconarray.
import { Path2D } from '@napi-rs/canvas'
import { clamp, ease, formatNumber, css, withAlpha } from '../core.mjs'
import { fontCss, fontSpec, layoutText } from '../fonts.mjs'
import { styledBar } from './util.mjs'
import { drawLabel } from './text.mjs'
import { iconPath } from './shapes.mjs'

const rows = (data) => (data || []).map((d, i) => (Array.isArray(d) ? { l: d[0], v: +d[1], c: d[2] } : { l: d.l ?? d.label ?? '', v: +(d.v ?? d.value ?? 0), c: d.c ?? d.color, i }))
const decOf = (vals, dec) => dec ?? (vals.some((v) => !Number.isInteger(v)) ? 1 : 0)
const fmt = (el, v, dec, env) => `${el.prefix ?? ''}${formatNumber(v, dec, env.lang)}${el.unit ?? el.suffix ?? ''}`
const isHi = (el, d, i) => el.hi !== undefined && (Array.isArray(el.hi) ? el.hi.includes(i) || el.hi.includes(d.l) : el.hi === i || el.hi === d.l)

function niceMax(v) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p
  return v
}

// ------------------------------------------------------------------ bars
export const bars = {
  hasText: true,
  own: ['grow'],
  defaultIn: 'grow',
  prep(el, env, ctx) {
    const data = rows(el.data)
    if (!data.length) throw new Error('bars: пустой data')
    const w = +(el.w ?? 1200), h = +(el.h ?? 620)
    const horizontal = el.dir === 'h'
    const max = +(el.max ?? Math.max(...data.map((d) => d.v)) * (horizontal ? 1 : 1.0))
    const lf = fontSpec(env.style, 'label')
    const vf = fontSpec(env.style, 'display')
    const lsize = Math.max(26, +(el.labelSize ?? (horizontal ? 40 : Math.min(40, (w / data.length) * 0.24 + 12))))
    const vsize = +(el.valueSize ?? Math.min(76, lsize * 1.7))
    const labels = data.map((d) => layoutText(ctx, d.l, { font: lf, size: lsize, maxw: horizontal ? w * 0.34 : (w / data.length) * 0.94,
                                                          upper: lf.upper, ls: lf.ls ?? 0, lh: 1.05 }))
    const dec = decOf(data.map((d) => d.v), el.dec)
    ctx.font = fontCss(vf, vsize)
    const valW = Math.max(...data.map((d) => ctx.measureText(fmt(el, d.v, dec, env)).width))
    return { data, w, h, horizontal, max: max || 1, labels, lsize, vsize, vf, dec, valW,
             labelW: horizontal ? Math.max(...labels.map((l) => l.w)) + 24 : 0,
             labelH: horizontal ? 0 : Math.max(...labels.map((l) => l.h)) + 18 }
  },
  inDur(el, st, env) { return (st.data.length - 1) * (el.stagger ?? env.motion.stagger * 2) + +(el.grow ?? 1.1) },
  draw(ctx, el, st, k, env, node) {
    const { data, w, h, horizontal, max, labels, vsize, vf, dec } = st
    const stg = el.stagger ?? env.motion.stagger * 2
    const growT = +(el.grow ?? 1.1)
    const n = data.length
    const showV = el.values !== false
    const base = env.color(el.axis ?? 'ink/60')
    if (!horizontal) {
      const plotH = h - st.labelH - (showV ? vsize * 1.3 : 0)
      const top = showV ? vsize * 1.3 : 0
      const slot = w / n, bw = slot * +(el.bw ?? 0.62)
      if (el.grid) gridLines(ctx, env, 0, top, w, plotH, 4, false)
      data.forEach((d, i) => {
        const p = k.inName === 'grow' ? ease(env.motion.ease === 'steps' ? 'steps' : 'expo-out', (k.local - i * stg) / growT) : 1
        const bh = plotH * (d.v / max) * p
        const x = i * slot + (slot - bw) / 2, y = top + plotH - bh
        const color = d.c ?? (isHi(el, d, i) ? 'accent' : el.hi !== undefined ? 'muted' : el.color ?? 'accent')
        styledBar(ctx, env, x, y, bw, bh, color, false, node.seed + i)
        if (showV && p > 0.02) {
          ctx.save()
          ctx.font = fontCss(vf, vsize); ctx.fillStyle = env.color(isHi(el, d, i) ? 'accent' : el.valueColor ?? 'ink')
          ctx.textAlign = 'center'; ctx.globalAlpha *= clamp(p * 3)
          ctx.fillText(fmt(el, d.v * p, dec, env), i * slot + slot / 2, y - vsize * 0.3)
          ctx.restore()
        }
      })
      ctx.fillStyle = base; ctx.fillRect(0, top + plotH, w * clamp(k.local / 0.5), 2.5)
      // labels: drawn per slot under the baseline
      data.forEach((d, i) => {
        ctx.save(); ctx.translate(i * slot, top + plotH + 14)
        ctx.globalAlpha *= clamp((k.local - i * stg) / 0.4)
        drawLabel(ctx, labels[i], env, isHi(el, d, i) ? 'ink' : el.labelColor ?? 'muted', 'c', slot)
        ctx.restore()
      })
    } else {
      const lw = st.labelW
      const plotW = w - lw - (showV ? st.valW + 24 : 0)
      const slot = h / n, bh = slot * +(el.bw ?? 0.62)
      if (el.grid) gridLines(ctx, env, lw, 0, plotW, h, 4, true)
      data.forEach((d, i) => {
        const p = k.inName === 'grow' ? ease('expo-out', (k.local - i * stg) / growT) : 1
        const bw = plotW * (d.v / max) * p
        const y = i * slot + (slot - bh) / 2
        const color = d.c ?? (isHi(el, d, i) ? 'accent' : el.hi !== undefined ? 'muted' : el.color ?? 'accent')
        styledBar(ctx, env, lw, y, bw, bh, color, true, node.seed + i)
        ctx.save(); ctx.translate(0, y + (bh - labels[i].h) / 2)
        ctx.globalAlpha *= clamp((k.local - i * stg) / 0.4)
        drawLabel(ctx, labels[i], env, isHi(el, d, i) ? 'ink' : el.labelColor ?? 'ink', 'r', lw - 24)
        ctx.restore()
        if (showV && p > 0.02) {
          ctx.font = fontCss(vf, vsize); ctx.fillStyle = env.color(isHi(el, d, i) ? 'accent' : el.valueColor ?? 'ink')
          ctx.save(); ctx.globalAlpha *= clamp(p * 3)
          ctx.fillText(fmt(el, d.v * p, dec, env), lw + bw + 16, y + bh / 2 + vsize * 0.36)
          ctx.restore()
        }
      })
      ctx.fillStyle = base; ctx.fillRect(lw, 0, 2.5, h * clamp(k.local / 0.5))
    }
  },
}

function gridLines(ctx, env, x, y, w, h, n, vertical) {
  ctx.strokeStyle = env.color('ink/12'); ctx.lineWidth = 1.5; ctx.setLineDash([6, 8])
  ctx.beginPath()
  for (let i = 1; i <= n; i++) {
    if (vertical) { const gx = x + w * i / n; ctx.moveTo(gx, y); ctx.lineTo(gx, y + h) }
    else { const gy = y + h - h * i / n; ctx.moveTo(x, gy); ctx.lineTo(x + w, gy) }
  }
  ctx.stroke(); ctx.setLineDash([])
}

// ------------------------------------------------------------------ line chart
export const linechart = {
  hasText: true,
  own: ['draw'],
  defaultIn: 'draw',
  prep(el, env, ctx) {
    const series = (el.series || [{ v: el.v || el.values || [], c: el.color, name: el.name }]).map((s, i) => ({
      v: (s.v || s.values || []).map(Number), c: s.c ?? s.color ?? ['accent', 'accent2', 'accent3', 'ink'][i % 4], name: s.name ?? '' }))
    const all = series.flatMap((s) => s.v)
    if (!all.length) throw new Error('linechart: нет значений')
    const n = Math.max(...series.map((s) => s.v.length))
    let lo = el.min ?? Math.min(...all), hi = el.max ?? Math.max(...all)
    if (el.min === undefined && lo >= 0 && lo < hi * 0.35) lo = 0
    if (el.max === undefined) hi = lo === 0 ? niceMax(hi * 1.05) : hi + (hi - lo) * 0.12
    if (el.min === undefined && lo !== 0) lo -= (hi - lo) * 0.08
    const w = +(el.w ?? 1300), h = +(el.h ?? 620)
    const lf = fontSpec(env.style, 'label')
    const lsize = Math.max(26, +(el.labelSize ?? 32))
    const labels = (el.labels || []).map((l) => layoutText(ctx, String(l), { font: lf, size: lsize, upper: lf.upper, ls: lf.ls ?? 0 }))
    const vf = fontSpec(env.style, 'display')
    const dec = decOf(all, el.dec)
    return { series, n, lo, hi: hi === lo ? lo + 1 : hi, w, h, labels, lsize, vf, dec, labelH: labels.length ? lsize * 1.8 : 0 }
  },
  inDur(el) { return +(el.count ?? 2.2) },
  draw(ctx, el, st, k, env) {
    const { series, n, lo, hi, w, h, labels, dec } = st
    const plotH = h - st.labelH, padR = 140
    const pw = w - padR
    const X = (i) => (n <= 1 ? 0 : (i / (n - 1)) * pw)
    const Y = (v) => plotH - ((v - lo) / (hi - lo)) * plotH
    const p = k.inName === 'draw' ? ease('cubic', k.local / +(el.count ?? 2.2)) : 1
    if (el.grid !== false) gridLines(ctx, env, 0, 0, pw, plotH, 4, false)
    ctx.fillStyle = env.color('ink/60'); ctx.fillRect(0, plotH, pw * clamp(k.local / 0.5), 2.5)
    // x labels: every one that fits
    const every = Math.max(1, Math.ceil(labels.length * 120 / pw))
    labels.forEach((l, i) => {
      if (i % every && i !== labels.length - 1) return
      const lx = labels.length <= 1 ? 0 : (i / (labels.length - 1)) * pw
      ctx.save(); ctx.globalAlpha *= clamp((p * (labels.length - 1) - i + 1) * 2)
      ctx.translate(lx - l.w / 2, plotH + st.lsize * 0.5)
      drawLabel(ctx, l, env, 'muted', 'l', l.w); ctx.restore()
    })
    const sw = +(el.sw ?? Math.max(4, env.style.shape.stroke * 1.6))
    for (const s of series) {
      const m = s.v.length
      if (!m) continue
      const reach = p * (m - 1)
      const pts = []
      for (let i = 0; i < m; i++) {
        if (i <= reach) pts.push([X(i), Y(s.v[i])])
        else { const f = reach - (i - 1); if (f > 0) pts.push([X(i - 1) + (X(i) - X(i - 1)) * f, Y(s.v[i - 1] + (s.v[i] - s.v[i - 1]) * f)]); break }
      }
      if (pts.length < 1) continue
      const col = env.rgba(s.c)
      if (el.area !== false && pts.length > 1) {
        const g = ctx.createLinearGradient(0, 0, 0, plotH)
        g.addColorStop(0, css(withAlpha(col, 0.32))); g.addColorStop(1, css(withAlpha(col, 0)))
        ctx.fillStyle = g
        ctx.beginPath(); ctx.moveTo(pts[0][0], plotH); for (const [x, y] of pts) ctx.lineTo(x, y); ctx.lineTo(pts[pts.length - 1][0], plotH); ctx.fill()
      }
      ctx.save()
      if (env.style.fx.glow) { ctx.shadowColor = css(col); ctx.shadowBlur = 18 * env.style.fx.glow }
      ctx.strokeStyle = css(col); ctx.lineWidth = sw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke()
      ctx.restore()
      if (el.dots) for (let i = 0; i <= Math.floor(reach) && i < m; i++) {
        ctx.fillStyle = env.color('bg'); ctx.strokeStyle = css(col); ctx.lineWidth = sw * 0.7
        ctx.beginPath(); ctx.arc(X(i), Y(s.v[i]), sw * 1.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      }
      // the running value at the tip
      const [tx, ty] = pts[pts.length - 1]
      const tipV = s.v[Math.min(m - 1, Math.floor(reach))] + (reach < m - 1 ? (s.v[Math.floor(reach) + 1] - s.v[Math.floor(reach)]) * (reach % 1) : 0)
      ctx.fillStyle = css(col)
      ctx.beginPath(); ctx.arc(tx, ty, sw * 1.6, 0, Math.PI * 2); ctx.fill()
      if (el.values !== false) {
        const vs = +(el.valueSize ?? 54)
        ctx.font = fontCss(st.vf, vs)
        ctx.fillText(`${el.prefix ?? ''}${formatNumber(tipV, dec, env.lang)}${el.unit ?? ''}`, tx + 18, ty - 14)
      }
    }
    // marked points
    for (const mk of el.marks || []) {
      const s = series[mk.s ?? 0]
      if (!s || mk.i === undefined || mk.i > p * (s.v.length - 1) + 0.01) continue
      const mx = X(mk.i), my = Y(s.v[mk.i])
      const ap = clamp((p * (s.v.length - 1) - mk.i) * 3 + 0.3)
      ctx.save(); ctx.globalAlpha *= ap
      ctx.strokeStyle = env.color(mk.c ?? 'accent'); ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(mx, my, 16, 0, Math.PI * 2); ctx.stroke()
      if (mk.text) {
        const f = fontSpec(env.style, 'label'), size = 30
        const lay = layoutText(ctx, mk.text, { font: f, size, maxw: 360, upper: f.upper, ls: f.ls ?? 0 })
        const above = my > plotH * 0.45
        const ly = above ? my - 40 - lay.h : my + 40
        ctx.beginPath(); ctx.moveTo(mx, my + (above ? -16 : 16)); ctx.lineTo(mx, above ? ly + lay.h + 6 : ly - 6); ctx.stroke()
        ctx.translate(Math.min(Math.max(0, mx - lay.w / 2), pw - lay.w), ly)
        drawLabel(ctx, lay, env, mk.c ?? 'accent', 'c', lay.w)
      }
      ctx.restore()
    }
  },
}

// ------------------------------------------------------------------ donut / pie
export const donut = {
  hasText: true,
  own: ['sweep'],
  defaultIn: 'sweep',
  prep(el, env, ctx) {
    const data = rows(el.data)
    if (!data.length) throw new Error('donut: пустой data')
    const size = +(el.size ?? 520)
    const total = data.reduce((a, d) => a + d.v, 0) || 1
    const lf = fontSpec(env.style, 'label')
    const lsize = Math.max(28, +(el.labelSize ?? 36))
    const legend = el.legend === false ? null : data.map((d) => layoutText(ctx, `${d.l}`, { font: lf, size: lsize, maxw: 520, upper: lf.upper, ls: lf.ls ?? 0 }))
    const legendW = legend ? Math.max(...legend.map((l) => l.w)) + lsize * 4.6 : 0
    const legendH = legend ? legend.reduce((a, l) => a + Math.max(l.h, lsize) + lsize * 0.8, 0) : 0
    return { data, size, total, legend, lsize, w: size + (legend ? 80 + legendW : 0), h: Math.max(size, legendH),
             dec: decOf(data.map((d) => d.v / total * 100), el.dec ?? 0) }
  },
  inDur(el, st) { return 0.5 + st.data.length * 0.35 },
  draw(ctx, el, st, k, env) {
    const { data, size, total, legend, lsize } = st
    const cx = size / 2, cy = st.h / 2, R = size / 2
    const thick = +(el.thick ?? 0.32)
    const p = k.inName === 'sweep' ? ease('cubic', k.local / (0.5 + data.length * 0.35)) : 1
    const cols = ['accent', 'accent2', 'accent3', 'ink', 'muted']
    let a0 = -Math.PI / 2
    data.forEach((d, i) => {
      const frac = d.v / total
      const end = Math.min(a0 + frac * Math.PI * 2, -Math.PI / 2 + p * Math.PI * 2)
      if (end > a0) {
        ctx.fillStyle = env.color(d.c ?? (el.hi !== undefined ? (isHi(el, d, i) ? 'accent' : `muted/${60 - i * 10}`) : cols[i % cols.length]))
        ctx.beginPath()
        ctx.arc(cx, cy, R, a0 + 0.012, end - 0.012)
        if (thick >= 1) ctx.lineTo(cx, cy); else ctx.arc(cx, cy, R * (1 - thick), end - 0.012, a0 + 0.012, true)
        ctx.closePath(); ctx.fill()
      }
      a0 += frac * Math.PI * 2
    })
    if (thick < 1 && el.center !== false) {
      const main = el.center ?? `${formatNumber(data[el.hi !== undefined && typeof el.hi === 'number' ? el.hi : 0].v / total * 100 * p, st.dec, env.lang)}%`
      const f = fontSpec(env.style, 'display')
      const fs = Math.min(R * (1 - thick) * 0.8, 140)
      ctx.font = fontCss(f, fs); ctx.fillStyle = env.color('ink'); ctx.textAlign = 'center'
      ctx.fillText(String(main), cx, cy + fs * 0.35); ctx.textAlign = 'left'
    }
    if (legend) {
      let y = cy - st.h / 2 + (st.h - legend.reduce((a, l) => a + Math.max(l.h, lsize) + lsize * 0.8, 0)) / 2
      const x = size + 80
      data.forEach((d, i) => {
        const lp = clamp((p * data.length - i) * 2)
        ctx.save(); ctx.globalAlpha *= lp; ctx.translate((1 - lp) * 20, 0)
        ctx.fillStyle = env.color(d.c ?? (el.hi !== undefined ? (isHi(el, d, i) ? 'accent' : `muted/${60 - i * 10}`) : cols[i % cols.length]))
        ctx.fillRect(x, y + lsize * 0.1, lsize * 0.9, lsize * 0.9)
        const pct = `${formatNumber(d.v / total * 100, st.dec, env.lang)}%`
        ctx.font = fontCss(fontSpec(env.style, 'display'), lsize * 1.05); ctx.fillStyle = env.color('ink')
        ctx.fillText(pct, x + lsize * 1.4, y + lsize * 0.9)
        ctx.translate(x + lsize * 4.6, y)
        drawLabel(ctx, legend[i], env, 'ink', 'l', legend[i].w)
        ctx.restore()
        y += Math.max(legend[i].h, lsize) + lsize * 0.8
      })
    }
  },
}

// ------------------------------------------------------------------ ring (progress)
export const ring = {
  hasText: true,
  own: ['sweep'],
  defaultIn: 'sweep',
  prep(el, env, ctx) {
    const size = +(el.size ?? 420)
    let label = null
    if (el.label) {
      const lf = fontSpec(env.style, 'label')
      label = layoutText(ctx, el.label, { font: lf, size: +(el.labelSize ?? Math.max(30, size * 0.08)), maxw: size * 1.3, upper: lf.upper, ls: lf.ls ?? 0 })
    }
    return { size, label, w: Math.max(size, label ? label.w : 0), h: size + (label ? label.h + size * 0.08 : 0) }
  },
  inDur(el) { return +(el.count ?? 1.6) },
  draw(ctx, el, st, k, env) {
    const { size, label } = st
    const cx = st.w / 2, cy = size / 2, R = size / 2 - size * 0.06
    const p = k.inName === 'sweep' ? ease('expo-out', k.local / +(el.count ?? 1.6)) : 1
    const v = clamp(+el.value / +(el.max ?? 100)) * p
    const lw = size * +(el.thick ?? 0.09)
    ctx.lineCap = env.style.shape.cap === 'round' ? 'round' : 'butt'
    ctx.strokeStyle = env.color(el.track ?? 'ink/12'); ctx.lineWidth = lw
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()
    ctx.save()
    if (env.style.fx.glow) { ctx.shadowColor = env.color(el.color ?? 'accent'); ctx.shadowBlur = 24 * env.style.fx.glow }
    ctx.strokeStyle = env.color(el.color ?? 'accent')
    ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2); if (v > 0.001) ctx.stroke()
    ctx.restore()
    const f = fontSpec(env.style, 'display'), fs = size * 0.26
    ctx.font = fontCss(f, fs); ctx.fillStyle = env.color(el.textColor ?? 'ink'); ctx.textAlign = 'center'
    const shown = el.text ?? `${formatNumber(+el.value * p, +(el.dec ?? 0), env.lang)}${el.unit ?? '%'}`
    ctx.fillText(String(shown), cx, cy + fs * 0.36); ctx.textAlign = 'left'
    if (label) { ctx.save(); ctx.translate((st.w - label.w) / 2, size + size * 0.08); ctx.globalAlpha *= clamp(k.local / 0.6); drawLabel(ctx, label, env, 'muted', 'c', label.w); ctx.restore() }
  },
}

// ------------------------------------------------------------------ icon array («1 из 10»)
export const iconarray = {
  own: ['fill'],
  defaultIn: 'fill',
  prep(el) {
    const n = Math.min(400, +(el.n ?? 100))
    const cols = +(el.cols ?? (n <= 10 ? n : n <= 50 ? 10 : 20))
    const rowsN = Math.ceil(n / cols)
    const size = +(el.size ?? Math.min(90, 1400 / cols * 0.8))
    const gap = size * 0.28
    const d = iconPath(el.icon ?? 'user')
    if (!d) throw new Error(`iconarray: нет иконки «${el.icon}»`)
    return { n, cols, rowsN, size, gap, path: new Path2D(d), w: cols * size + (cols - 1) * gap, h: rowsN * size + (rowsN - 1) * gap }
  },
  inDur(el, st) { return 0.6 + Math.min(1.6, st.n * 0.012) + 0.9 },
  draw(ctx, el, st, k, env) {
    const { n, cols, size, gap, path } = st
    const hi = +(el.hi ?? 0)
    const appear = Math.min(1.6, n * 0.012)
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols
      const pa = k.inName === 'fill' ? ease('back', (k.local - (i / n) * appear) / 0.4) : 1
      if (pa <= 0) continue
      const isH = i < hi
      const hp = k.inName === 'fill' ? clamp((k.local - appear - 0.3 - (i / Math.max(1, hi)) * 0.6) / 0.25) : 1
      ctx.save()
      ctx.translate(c * (size + gap) + size / 2, r * (size + gap) + size / 2)
      ctx.scale(Math.max(0.01, pa) * size / 24, Math.max(0.01, pa) * size / 24)
      ctx.translate(-12, -12)
      ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.strokeStyle = env.color(el.color ?? 'muted/70')
      if (isH && hp > 0) {
        ctx.strokeStyle = css(withAlpha(env.rgba(el.hiColor ?? 'accent'), 1))
        ctx.fillStyle = css(withAlpha(env.rgba(el.hiColor ?? 'accent'), 0.85 * hp))
        ctx.fill(path)
      }
      ctx.stroke(path)
      ctx.restore()
    }
  },
}
