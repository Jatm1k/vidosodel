// SVG path data → flattened polylines, so any path (icons, arrows, custom shapes) can "draw itself":
// stroked up to a fraction of its total length.

const CMD = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/g

function tokens(d) {
  const out = []
  let m
  CMD.lastIndex = 0
  while ((m = CMD.exec(d))) out.push(m[1] ?? +m[2])
  return out
}

function arcPoints(x1, y1, rx, ry, phi, fa, fs, x2, y2, seg) {
  // SVG arc endpoint → centre parameterisation (SVG spec F.6.5)
  if (!rx || !ry) return [[x2, y2]]
  const s = Math.sin(phi), c = Math.cos(phi)
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2
  const x1p = c * dx + s * dy, y1p = -s * dx + c * dy
  rx = Math.abs(rx); ry = Math.abs(ry)
  const L = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry)
  if (L > 1) { rx *= Math.sqrt(L); ry *= Math.sqrt(L) }
  const sign = fa === fs ? -1 : 1
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const k = sign * Math.sqrt(Math.max(0, num / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)))
  const cxp = k * rx * y1p / ry, cyp = -k * ry * x1p / rx
  const cx = c * cxp - s * cyp + (x1 + x2) / 2, cy = s * cxp + c * cyp + (y1 + y2) / 2
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!fs && dt > 0) dt -= Math.PI * 2
  if (fs && dt < 0) dt += Math.PI * 2
  const n = Math.max(4, Math.ceil(Math.abs(dt) / (Math.PI * 2) * seg))
  const pts = []
  for (let i = 1; i <= n; i++) {
    const t = t1 + dt * i / n
    pts.push([cx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, cy + rx * Math.cos(t) * s + ry * Math.sin(t) * c])
  }
  return pts
}

/** ``[{pts: [x0, y0, x1, y1…], closed, len}]`` and the total length. */
export function flatten(d, seg = 16) {
  const t = tokens(d)
  const subs = []
  let cur = null
  let x = 0, y = 0, sx = 0, sy = 0, lcx = 0, lcy = 0, lqx = 0, lqy = 0, cmd = 'M', i = 0, prev = ''
  const add = (px, py) => { cur.pts.push(px, py) }
  const start = (px, py) => { cur = { pts: [px, py], closed: false }; subs.push(cur) }
  const num = () => t[i++]
  while (i < t.length) {
    if (typeof t[i] === 'string') cmd = t[i++]
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase()
    const ox = rel ? x : 0, oy = rel ? y : 0
    if (C === 'Z') { if (cur) { cur.closed = true; add(sx, sy) } x = sx; y = sy; prev = 'Z'; continue }
    if (C === 'M') { x = ox + num(); y = oy + num(); sx = x; sy = y; start(x, y); cmd = rel ? 'l' : 'L'; prev = 'M'; continue }
    if (!cur) start(x, y)
    if (C === 'L') { x = ox + num(); y = oy + num(); add(x, y) }
    else if (C === 'H') { x = ox + num(); add(x, y) }
    else if (C === 'V') { y = oy + num(); add(x, y) }
    else if (C === 'C' || C === 'S') {
      let x1, y1
      if (C === 'C') { x1 = ox + num(); y1 = oy + num() } else if ('CS'.includes(prev)) { x1 = 2 * x - lcx; y1 = 2 * y - lcy } else { x1 = x; y1 = y }
      const x2 = ox + num(), y2 = oy + num(), ex = ox + num(), ey = oy + num()
      for (let k = 1; k <= seg; k++) {
        const u = k / seg, v = 1 - u
        add(v * v * v * x + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * ex,
            v * v * v * y + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * ey)
      }
      lcx = x2; lcy = y2; x = ex; y = ey
    } else if (C === 'Q' || C === 'T') {
      let qx, qy
      if (C === 'Q') { qx = ox + num(); qy = oy + num() } else if ('QT'.includes(prev)) { qx = 2 * x - lqx; qy = 2 * y - lqy } else { qx = x; qy = y }
      const ex = ox + num(), ey = oy + num()
      for (let k = 1; k <= seg; k++) {
        const u = k / seg, v = 1 - u
        add(v * v * x + 2 * v * u * qx + u * u * ex, v * v * y + 2 * v * u * qy + u * u * ey)
      }
      lqx = qx; lqy = qy; x = ex; y = ey
    } else if (C === 'A') {
      const rx = num(), ry = num(), rot = num() * Math.PI / 180, fa = num(), fs = num(), ex = ox + num(), ey = oy + num()
      for (const [px, py] of arcPoints(x, y, rx, ry, rot, fa, fs, ex, ey, seg * 2)) add(px, py)
      x = ex; y = ey
    } else { i++ } // unknown token – skip
    prev = C
  }
  let total = 0
  for (const s of subs) {
    let len = 0
    for (let k = 2; k < s.pts.length; k += 2) len += Math.hypot(s.pts[k] - s.pts[k - 2], s.pts[k + 1] - s.pts[k - 1])
    s.len = len
    total += len
  }
  return { subs, len: total }
}

/** Bounding box of flattened paths. */
export function bounds(flat) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const s of flat.subs) for (let k = 0; k < s.pts.length; k += 2) {
    const px = s.pts[k], py = s.pts[k + 1]
    if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py
  }
  return x0 === Infinity ? [0, 0, 0, 0] : [x0, y0, x1, y1]
}

/** Adds the part of the paths between ``from`` and ``to`` (fractions of the total length) to the current path. */
export function tracePartial(ctx, flat, from, to) {
  const a = from * flat.len, b = to * flat.len
  let acc = 0
  for (const s of flat.subs) {
    const p = s.pts
    if (acc + s.len < a) { acc += s.len; continue }
    if (acc > b) break
    let started = false
    for (let k = 2; k < p.length; k += 2) {
      const seg = Math.hypot(p[k] - p[k - 2], p[k + 1] - p[k - 1])
      const s0 = acc, s1 = acc + seg
      acc = s1
      if (s1 < a) continue
      if (s0 > b) break
      const u0 = seg ? Math.max(0, (a - s0) / seg) : 0, u1 = seg ? Math.min(1, (b - s0) / seg) : 1
      const x0 = p[k - 2] + (p[k] - p[k - 2]) * u0, y0 = p[k - 1] + (p[k + 1] - p[k - 1]) * u0
      const x1 = p[k - 2] + (p[k] - p[k - 2]) * u1, y1 = p[k - 1] + (p[k + 1] - p[k - 1]) * u1
      if (!started) { ctx.moveTo(x0, y0); started = true }
      ctx.lineTo(x1, y1)
    }
    if (s.closed && to >= 1 && from <= 0 && started) ctx.closePath()
  }
}

/** Point and direction at a fraction of the total length (for arrow heads and moving dots). */
export function pointAt(flat, f) {
  const target = Math.max(0, Math.min(1, f)) * flat.len
  let acc = 0
  for (const s of flat.subs) {
    const p = s.pts
    for (let k = 2; k < p.length; k += 2) {
      const seg = Math.hypot(p[k] - p[k - 2], p[k + 1] - p[k - 1])
      if (acc + seg >= target && seg > 0) {
        const u = (target - acc) / seg
        return { x: p[k - 2] + (p[k] - p[k - 2]) * u, y: p[k - 1] + (p[k + 1] - p[k - 1]) * u,
                 a: Math.atan2(p[k + 1] - p[k - 1], p[k] - p[k - 2]) }
      }
      acc += seg
    }
  }
  const s = flat.subs[flat.subs.length - 1]
  if (!s) return { x: 0, y: 0, a: 0 }
  const n = s.pts.length
  return { x: s.pts[n - 2], y: s.pts[n - 1], a: n >= 4 ? Math.atan2(s.pts[n - 1] - s.pts[n - 3], s.pts[n - 2] - s.pts[n - 4]) : 0 }
}
