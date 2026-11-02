// Map: Natural Earth countries in Web Mercator; highlighted countries, pins, animated routes,
// a camera that flies between views. Country outlines are Path2D objects built once in projected
// units and drawn through a transform, so a frame costs one fill per visible country.
import { readFileSync } from 'node:fs'
import { Path2D, createCanvas } from '@napi-rs/canvas'
import { clamp, ease, lerp, css, withAlpha } from '../core.mjs'
import { fontCss, fontSpec, layoutText } from '../fonts.mjs'
import { panel, panelText, drawText } from './util.mjs'
import { iconPath } from './shapes.mjs'

const Q = 65535
let WORLD = null
function world() {
  if (WORLD) return WORLD
  const raw = JSON.parse(readFileSync(new URL('../../data/world.json', import.meta.url), 'utf8'))
  WORLD = {}
  const byName = {}
  for (const [iso, c] of Object.entries(raw)) {
    const path = new Path2D()
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const ring of c.p) {
      path.moveTo(ring[0], ring[1])
      for (let i = 2; i < ring.length; i += 2) path.lineTo(ring[i], ring[i + 1])
      path.closePath()
      for (let i = 0; i < ring.length; i += 2) {
        if (ring[i] < x0) x0 = ring[i]; if (ring[i] > x1) x1 = ring[i]
        if (ring[i + 1] < y0) y0 = ring[i + 1]; if (ring[i + 1] > y1) y1 = ring[i + 1]
      }
    }
    // the bounding box of the largest part only (France without French Guiana, the US without Alaska…)
    WORLD[iso] = { iso, en: c.en, ru: c.ru, c: c.c, path, bbox: [x0, y0, x1, y1], main: mainBox(c.p) }
    byName[c.en.toLowerCase()] = iso
    if (c.ru) byName[c.ru.toLowerCase()] = iso
  }
  Object.assign(byName, { usa: 'USA', us: 'USA', america: 'USA', uk: 'GBR', britain: 'GBR', england: 'GBR', russia: 'RUS', ussr: 'RUS',
                          'south korea': 'KOR', 'north korea': 'PRK', iran: 'IRN', syria: 'SYR', vietnam: 'VNM', 'czech republic': 'CZE',
                          czechia: 'CZE', turkey: 'TUR', 'сша': 'USA', 'англия': 'GBR', 'великобритания': 'GBR', 'ссср': 'RUS' })
  WORLD._byName = byName
  return WORLD
}
function mainBox(rings) {
  let best = null
  for (const r of rings) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]) }
    const a = (x1 - x0) * (y1 - y0)
    if (!best || a > best.a) best = { a, b: [x0, y0, x1, y1] }
  }
  return best ? best.b : [0, 0, Q, Q]
}
export function country(id) {
  const w = world()
  const key = String(id ?? '')
  return w[key.toUpperCase()] || w[w._byName[key.toLowerCase()]] || null
}

const merc = (lon, lat) => {
  const la = Math.max(-85, Math.min(85, lat)) * Math.PI / 180
  return [((lon + 180) / 360) * Q, ((1 - Math.log(Math.tan(Math.PI / 4 + la / 2)) / Math.PI) / 2) * Q]
}

export const REGIONS = {
  world: [-170, -56, 190, 78], europe: [-24, 35, 45, 70], asia: [25, -10, 150, 60], africa: [-20, -36, 55, 38],
  n_america: [-168, 8, -50, 74], s_america: [-85, -56, -32, 13], middle_east: [25, 12, 64, 42], russia: [25, 40, 180, 78],
  usa: [-126, 23, -65, 50], china: [72, 17, 136, 54], ukraine: [21, 44, 41, 53], caucasus: [36, 38, 51, 45.5],
  balkans: [13, 39, 30, 47.5], scandinavia: [3, 54, 32, 71.5], australia: [110, -45, 156, -9], india: [66, 6, 98, 36],
  japan: [128, 30, 147, 46], mediterranean: [-8, 29, 38, 47], east_asia: [95, 15, 150, 52], latin_america: [-118, -56, -32, 32],
  central_asia: [46, 35, 88, 56], baltic: [9, 53, 32, 61], pacific: [100, -50, 290, 60], atlantic: [-90, -20, 20, 65],
}

/** A view (``"europe"``, ``"FRA"``, ``[lon1, lat1, lon2, lat2]``, ``{lon, lat, zoom}``) → projected box [x0, y0, x1, y1]. */
export function viewBox(v) {
  if (!v) v = 'world'
  if (typeof v === 'string') {
    if (REGIONS[v]) v = REGIONS[v]
    else {
      const c = country(v)
      if (!c) throw new Error(`map: неизвестный вид «${v}» (регионы: ${Object.keys(REGIONS).join(', ')}, или код страны)`)
      const [x0, y0, x1, y1] = c.main
      const pad = Math.max(x1 - x0, y1 - y0) * 0.35
      return [x0 - pad, y0 - pad, x1 + pad, y1 + pad]
    }
  }
  if (Array.isArray(v)) { const [a, b] = merc(v[0], v[3]), [c, d] = merc(v[2], v[1]); return [a, b, c, d] }
  if (typeof v === 'object') {
    const [cx, cy] = merc(+v.lon, +v.lat)
    const half = Q / (2 * +(v.zoom ?? 4))
    return [cx - half, cy - half * 0.56, cx + half, cy + half * 0.56]
  }
  return viewBox('world')
}

function viewAt(el, st, t) {
  const views = st.views
  if (views.length === 1) return views[0].box
  let prev = views[0]
  for (const v of views) {
    if (t < v.t) {
      const u = ease(v.e || 'cubic', (t - prev.t) / Math.max(0.01, v.t - prev.t))
      // interpolate the centre linearly and the size logarithmically: a smooth fly-in
      const [a0, b0, c0, d0] = prev.box, [a1, b1, c1, d1] = v.box
      const cx = lerp((a0 + c0) / 2, (a1 + c1) / 2, u), cy = lerp((b0 + d0) / 2, (b1 + d1) / 2, u)
      const w = Math.exp(lerp(Math.log(c0 - a0), Math.log(c1 - a1), u)), h = Math.exp(lerp(Math.log(d0 - b0), Math.log(d1 - b1), u))
      return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]
    }
    prev = v
  }
  return prev.box
}

export const map = {
  hasText: true,
  inDur(el, st) {
    const base = +(el.at ?? 0)
    const ends = [0.6, ...st.hl.map((x) => +(x.at ?? base) - base + 0.9), ...st.pins.map((p) => +(p.at ?? base) - base + 0.7),
                  ...st.routes.map((r) => +(r.at ?? base) - base + +(r.dur ?? 1.6)), ...st.views.map((v) => v.t)]
    return Math.max(...ends)
  },
  prep(el, env, ctx) {
    const w = +(el.w ?? 1920), h = +(el.h ?? 1080)
    const views = [{ t: 0, box: viewBox(el.view) }]
    for (const v of el.views || []) views.push({ t: +(v.t ?? 0) - +(el.at ?? 0), box: viewBox(v.view ?? v), e: v.e })
    views.sort((a, b) => a.t - b.t)
    const hl = (el.hl || []).map((h0) => {
      const h1 = typeof h0 === 'string' ? { id: h0 } : h0
      const c = country(h1.id)
      if (!c) throw new Error(`map: неизвестная страна «${h1.id}» (ISO3: RUS, USA, DEU… или английское название)`)
      let label = null
      if (h1.label) { const f = fontSpec(env.style, 'label'); label = layoutText(ctx, h1.label, { font: f, size: +(h1.size ?? 30), upper: f.upper, ls: f.ls ?? 0 }) }
      return { ...h1, c, label }
    })
    const pins = (el.pins || []).map((p) => {
      let label = null
      if (p.label) { const f = fontSpec(env.style, 'label'); label = layoutText(ctx, p.label, { font: f, size: +(p.size ?? 30), upper: f.upper, ls: f.ls ?? 0 }) }
      return { ...p, xy: merc(+p.lon, +p.lat), label }
    })
    const routes = (el.routes || []).map((r) => {
      const a = merc(r.from[0], r.from[1]), b = merc(r.to[0], r.to[1])
      return { ...r, a, b }
    })
    return { w, h, views, hl, pins, routes }
  },
  draw(ctx, el, st, k, env) {
    const W = world()
    const { w, h, hl, pins, routes } = st
    const t = k.local
    const [vx0, vy0, vx1, vy1] = viewAt(el, st, t)
    const s = Math.min(w / (vx1 - vx0), h / (vy1 - vy0))
    const cx = (vx0 + vx1) / 2, cy = (vy0 + vy1) / 2
    const P = (x, y) => [w / 2 + (x - cx) * s, h / 2 + (y - cy) * s]
    ctx.save()
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip()
    // land and borders: drawn once per view into a bitmap, reused while the camera stands still
    const m = ctx.getTransform()
    const dev = Math.hypot(m.a, m.b)
    const key = `${Math.round(vx0)},${Math.round(vy0)},${Math.round(vx1)},${Math.round(vy1)},${dev.toFixed(3)}`
    if (st.cacheKey !== key) {
      const cw = Math.max(1, Math.ceil(w * dev)), ch = Math.max(1, Math.ceil(h * dev))
      if (!st.cache || st.cache.width !== cw || st.cache.height !== ch) st.cache = createCanvas(cw, ch)
      const b = st.cache.getContext('2d')
      b.setTransform(dev, 0, 0, dev, 0, 0)
      b.clearRect(0, 0, w, h)
      if (el.sea !== false) { b.fillStyle = env.color(el.sea ?? 'bg2'); b.fillRect(0, 0, w, h) }
      const qx0 = cx - w / 2 / s, qx1 = cx + w / 2 / s, qy0 = cy - h / 2 / s, qy1 = cy + h / 2 / s
      b.translate(w / 2, h / 2); b.scale(s, s); b.translate(-cx, -cy)
      b.fillStyle = env.color(el.land ?? 'muted/45')
      b.strokeStyle = env.color(el.border ?? 'bg')
      b.lineWidth = +(el.bw ?? 1.2) / s
      b.lineJoin = 'round'
      for (const iso in W) {
        if (iso === '_byName') continue
        const c = W[iso]
        const [bx0, by0, bx1, by1] = c.bbox
        if (bx1 < qx0 || bx0 > qx1 || by1 < qy0 || by0 > qy1) continue
        b.fill(c.path)
        if (el.borders !== false) b.stroke(c.path)
      }
      st.cacheKey = key
    }
    ctx.drawImage(st.cache, 0, 0, w, h)
    ctx.save()
    ctx.translate(w / 2, h / 2); ctx.scale(s, s); ctx.translate(-cx, -cy)
    ctx.lineJoin = 'round'
    const hlSet = null
    for (const x of hl) {
      const at = +(x.at ?? el.at ?? 0) - +(el.at ?? 0)
      const p = clamp((t - at) / 0.6)
      if (p <= 0) continue
      const col = env.rgba(x.color ?? 'accent')
      ctx.fillStyle = css(withAlpha(col, p * (x.alpha ?? 0.9)))
      ctx.fill(x.c.path)
      ctx.strokeStyle = css(withAlpha(col, p)); ctx.lineWidth = 2.5 / s; ctx.stroke(x.c.path)
    }
    ctx.restore()
    void hlSet
    // labels of highlighted countries
    for (const x of hl) {
      if (!x.label) continue
      const at = +(x.at ?? el.at ?? 0) - +(el.at ?? 0)
      const p = ease('back', (t - at - 0.3) / 0.5)
      if (p <= 0) continue
      const [lx, ly] = x.pos ? P(...merc(x.pos[0], x.pos[1])) : P(x.c.c[0], x.c.c[1])
      ctx.save(); ctx.translate(lx, ly); ctx.scale(Math.max(0.01, p), Math.max(0.01, p))
      const pw = x.label.w + 28, ph = x.label.h + 16
      panel(ctx, env, -pw / 2, -ph / 2, pw, ph, { shadow: false })
      ctx.translate(-x.label.w / 2, -x.label.h / 2)
      drawText(ctx, x.label, env, { color: panelText(env), acc: env.color('accent'), align: 'c', boxW: x.label.w, mode: 'none', local: 99, styleKey: env.style.name })
      ctx.restore()
    }
    // routes
    for (const r of routes) {
      const at = +(r.at ?? el.at ?? 0) - +(el.at ?? 0)
      const p = ease('cubic', (t - at) / +(r.dur ?? 1.6))
      if (p <= 0) continue
      const [ax, ay] = P(...r.a), [bx, by] = P(...r.b)
      const bend = +(r.curve ?? 0.25)
      const mx = (ax + bx) / 2 - (by - ay) * bend, my = (ay + by) / 2 + (bx - ax) * bend
      const col = env.color(r.color ?? 'accent')
      ctx.strokeStyle = col; ctx.lineWidth = +(r.sw ?? 5); ctx.lineCap = 'round'
      if (r.dash) ctx.setLineDash([14, 12])
      ctx.beginPath(); ctx.moveTo(ax, ay)
      const N = 40
      let tx = ax, ty = ay, ta = 0
      for (let i = 1; i <= N * p; i++) {
        const u = i / N
        const nx = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx
        const ny = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by
        ta = Math.atan2(ny - ty, nx - tx); tx = nx; ty = ny
        ctx.lineTo(nx, ny)
      }
      ctx.stroke(); ctx.setLineDash([])
      const arrived = clamp((t - at - +(r.dur ?? 1.6)) / 0.4)
      if (r.icon && iconPath(r.icon) && arrived < 1) {
        ctx.save(); ctx.globalAlpha *= 1 - arrived; ctx.translate(tx, ty); ctx.rotate(ta + (r.icon === 'plane' ? Math.PI / 4 : 0)); ctx.scale(2.2, 2.2); ctx.translate(-12, -12)
        ctx.fillStyle = env.color('bg'); ctx.strokeStyle = col; ctx.lineWidth = 2
        const ip = new Path2D(iconPath(r.icon)); ctx.fill(ip); ctx.stroke(ip); ctx.restore()
      } else if (!r.icon) {
        const s2 = 18
        ctx.fillStyle = col; ctx.beginPath()
        ctx.moveTo(tx + Math.cos(ta) * 6, ty + Math.sin(ta) * 6); ctx.lineTo(tx + Math.cos(ta + 2.6) * s2, ty + Math.sin(ta + 2.6) * s2)
        ctx.lineTo(tx + Math.cos(ta - 2.6) * s2, ty + Math.sin(ta - 2.6) * s2); ctx.closePath(); ctx.fill()
      }
    }
    // pins
    for (const pn of pins) {
      const at = +(pn.at ?? el.at ?? 0) - +(el.at ?? 0)
      const p = ease('back', (t - at) / 0.5)
      if (p <= 0) continue
      const [px, py] = P(...pn.xy)
      const col = env.color(pn.color ?? 'accent')
      const pulse = ((t - at) * 0.7) % 1
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.globalAlpha *= 1 - pulse
      ctx.beginPath(); ctx.arc(px, py, 10 + pulse * 40, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
      ctx.fillStyle = col; ctx.strokeStyle = env.color('bg'); ctx.lineWidth = 4
      ctx.beginPath(); ctx.arc(px, py, 11 * Math.max(0.01, p), 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      if (pn.label) {
        const lp = clamp((t - at - 0.25) / 0.4)
        const right = pn.side !== 'l'
        ctx.save(); ctx.globalAlpha *= lp
        const pw = pn.label.w + 24, ph = pn.label.h + 14
        const bx = right ? px + 24 : px - 24 - pw
        panel(ctx, env, bx + (1 - lp) * (right ? -10 : 10), py - ph / 2, pw, ph, { shadow: false })
        ctx.translate(bx + 12 + (1 - lp) * (right ? -10 : 10), py - pn.label.h / 2)
        drawText(ctx, pn.label, env, { color: panelText(env), acc: env.color('accent'), align: 'l', boxW: pn.label.w, mode: 'none', local: 99, styleKey: env.style.name })
        ctx.restore()
      }
    }
    ctx.restore()
    void fontCss
  },
}
