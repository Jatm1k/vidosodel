// Materials: things a story is told with when the frame is a desk or a page – a document (letter, manuscript page,
// index card, newspaper clipping, telegram, note), a framed portrait with a name plate, a film title card,
// a filmstrip of the video's pictures, a torn paper scrap. Papers are drawn once into offscreen canvases (aged,
// with fibres, foxing, folds and torn edges) at the resolution they are seen at, and laid on the scene with a
// contact shadow; their texts animate live.
import { createCanvas } from '@napi-rs/canvas'
import { clamp, ease, lerp, rng, css, withAlpha, rgba, mix, luma, hash, noise1 } from '../core.mjs'
import { fontCss, fontSpec, layoutText } from '../fonts.mjs'
import { drawText, textInDur, rr, alignOf } from './util.mjs'

// ------------------------------------------------------------------ offscreen papers
const sheets = new Map() // LRU of drawn papers: key → canvas
function cached(key, w, h, scale, draw) {
  const k = `${key}@${scale}`
  let c = sheets.get(k)
  if (c) { sheets.delete(k); sheets.set(k, c); return c }
  c = createCanvas(Math.max(1, Math.ceil(w * scale)), Math.max(1, Math.ceil(h * scale)))
  const x = c.getContext('2d')
  x.scale(scale, scale)
  draw(x)
  sheets.set(k, c)
  if (sheets.size > 18) sheets.delete(sheets.keys().next().value)
  return c
}
/** How sharp an offscreen paper must be at the current transform (camera zoom included), in half steps. */
const seenScale = (ctx) => { const m = ctx.getTransform(); return Math.min(3, Math.max(1, Math.ceil(Math.hypot(m.a, m.b) * 2) / 2)) }

/** Paper colours of a kind, from the style's own palette (paper looks the same over any background). */
function paperTone(env, kind, color) {
  const pal = env.style.palette
  if (color) return rgba(color, pal)
  const panel = rgba(pal.panel, pal), bg = rgba(pal.bg, pal)
  const base = luma(panel) > 0.6 ? panel : luma(bg) > 0.6 ? bg : [238, 230, 212, 1]
  const cream = mix(base, [236, 222, 190, 1], 0.45)
  switch (kind) {
    case 'card': return mix(base, [246, 240, 226, 1], 0.6)
    case 'clipping': return mix(base, [222, 214, 192, 1], 0.6)
    case 'note': return mix(cream, rgba(pal.accent3, pal), 0.18)
    case 'telegram': return mix(base, [226, 228, 214, 1], 0.55)
    case 'tape': return [226, 214, 178, 0.88]
    default: return cream
  }
}

/** The outline of a sheet: straight, deckled (hand-made paper) or torn on some sides. */
function sheetPath(ctx, w, h, seed, torn = '', deckle = 0) {
  const r = rng(seed)
  const pts = []
  const side = (x0, y0, x1, y1, s) => {
    const tear = torn.includes(s)
    const len = Math.hypot(x1 - x0, y1 - y0)
    const n = Math.max(2, Math.round(len / (tear ? 5 : 26)))
    const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1
    const sd = seed + s.charCodeAt(0)
    for (let i = 0; i < n; i++) {
      const u = i / n
      // inward from the edge: a wandering tear line with a little fibrous fringe
      const amp = tear ? 4 + noise1(u * len / 70, sd) * 4 + noise1(u * len / 19, sd + 3) * 2 + r() * 1.6 : deckle * (r() - 0.5) * 2
      pts.push([lerp(x0, x1, u) + nx / nl * amp, lerp(y0, y1, u) + ny / nl * amp])
    }
  }
  side(0, 0, w, 0, 't'); side(w, 0, w, h, 'r'); side(w, h, 0, h, 'b'); side(0, h, 0, 0, 'l')
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

/** An aged sheet: tone, darker worn edges, fibres, foxing, folds; ``o`` – torn, deckle, folds, rules, holes. */
function drawSheet(x, w, h, tone, o, seed) {
  const r = rng(seed + 7)
  x.save()
  sheetPath(x, w, h, seed, o.torn, o.deckle ?? 1.2)
  x.fillStyle = css(tone); x.fill()
  x.clip()
  const age = o.age ?? 1
  // worn edges and a slightly uneven tone
  const g = x.createRadialGradient(w * (0.4 + r() * 0.2), h * (0.4 + r() * 0.2), Math.min(w, h) * 0.2, w / 2, h / 2, Math.hypot(w, h) * 0.62)
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(110,72,30,${0.22 * age})`)
  x.fillStyle = g; x.fillRect(0, 0, w, h)
  for (let i = 0; i < 5; i++) { // large faint blotches
    const cx = r() * w, cy = r() * h, rad = (0.15 + r() * 0.3) * Math.max(w, h)
    const b = x.createRadialGradient(cx, cy, 0, cx, cy, rad)
    b.addColorStop(0, `rgba(140,100,50,${0.035 * age})`); b.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = b; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
  }
  for (let i = 0; i < Math.round(w * h / 380); i++) { // grain
    x.fillStyle = r() < 0.5 ? `rgba(90,60,30,${0.03 + r() * 0.05})` : `rgba(255,255,255,${0.04 + r() * 0.05})`
    x.fillRect(r() * w, r() * h, 1 + r() * 1.6, 1 + r() * 1.6)
  }
  x.lineWidth = 0.7
  for (let i = 0; i < Math.round(w * h / 9000); i++) { // fibres
    const fx = r() * w, fy = r() * h, a = r() * Math.PI, l = 5 + r() * 16
    x.strokeStyle = `rgba(90,60,30,${0.05 + r() * 0.06})`
    x.beginPath(); x.moveTo(fx, fy); x.quadraticCurveTo(fx + Math.cos(a) * l * 0.5 + 2, fy + Math.sin(a) * l * 0.5, fx + Math.cos(a) * l, fy + Math.sin(a) * l); x.stroke()
  }
  for (let i = 0; i < Math.round(6 * age); i++) { // foxing
    const cx = r() * w, cy = r() * h, rad = 2 + r() * 9
    x.fillStyle = `rgba(150,95,40,${0.08 + r() * 0.12})`
    x.beginPath(); x.arc(cx, cy, rad, 0, Math.PI * 2); x.fill()
  }
  if (o.rules) { // index card: a red head rule and blue lines
    x.strokeStyle = 'rgba(200,70,60,0.55)'; x.lineWidth = 2
    x.beginPath(); x.moveTo(0, o.rules.top); x.lineTo(w, o.rules.top); x.stroke()
    x.strokeStyle = 'rgba(80,120,180,0.28)'; x.lineWidth = 1.4
    x.beginPath()
    for (let y = o.rules.top + o.rules.step; y < h - 8; y += o.rules.step) { x.moveTo(0, y); x.lineTo(w, y) }
    x.stroke()
  }
  for (const fy of o.folds || []) { // a crease: light ridge and a dark valley, faint across the sheet
    const y = fy * h
    const fg = x.createLinearGradient(0, y - 6, 0, y + 6)
    fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(0.45, 'rgba(255,255,255,0.1)'); fg.addColorStop(0.55, 'rgba(80,50,20,0.07)'); fg.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = fg; x.fillRect(0, y - 6, w, 12)
    // the two halves age a little differently
    x.fillStyle = 'rgba(120,80,30,0.025)'; x.fillRect(0, y, w, h - y)
  }
  x.restore()
  if (o.hole) { // the punched hole of a catalogue card
    x.save(); x.globalCompositeOperation = 'destination-out'
    x.beginPath(); x.arc(w / 2, h - Math.min(34, h * 0.07), Math.min(13, w * 0.016), 0, Math.PI * 2); x.fill(); x.restore()
  }
}

/** Lays a paper canvas on the scene with a contact shadow that grows as it lands (``p`` 0..1). */
function laySheet(ctx, canvas, w, h, p, env, lift = 1) {
  ctx.save()
  if (!env.overlay) {
    ctx.shadowColor = `rgba(0,0,0,${0.34 * lift})`
    ctx.shadowBlur = lerp(46, 22, p) * lift
    ctx.shadowOffsetY = lerp(26, 9, p) * lift
    ctx.shadowOffsetX = lerp(6, 3, p) * lift
  }
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h)
  ctx.restore()
}

// ------------------------------------------------------------------ text helpers
const lay = (ctx, env, role, text, size, maxw, extra = {}) => {
  const f = fontSpec(env.style, role)
  return layoutText(ctx, text, { font: f, size, maxw, upper: extra.upper ?? f.upper, ls: f.ls ?? 0, lh: extra.lh ?? 1.25 })
}
/** Ink of writing on paper: the style's ink on its panel, a little toward a brown-black. */
function paperInk(env) {
  const pal = env.style.palette
  const c = rgba(pal.panelInk || pal.ink, pal)
  return luma(c) < 0.35 ? css(mix(c, [52, 36, 24, 1], 0.3)) : '#2a2118'
}

// ------------------------------------------------------------------ document
const DOC = {
  letter: { w: 880, role: 'script', size: 46, mode: 'write', folds: [1 / 3, 2 / 3], lh: 1.32 },
  page: { w: 900, role: 'book', size: 40, mode: 'lines', lh: 1.34 },
  card: { w: 900, role: 'typed', size: 36, mode: 'type', lh: 1.5 },
  clipping: { w: 760, role: 'book', size: 34, mode: 'lines', lh: 1.3, torn: 'tblr' },
  telegram: { w: 980, role: 'typed', size: 38, mode: 'type', lh: 1.45, upper: true },
  note: { w: 540, role: 'hand', size: 50, mode: 'write', lh: 1.15 },
}

export const document = {
  hasText: true,
  own: ['place'],
  defaultIn: 'place',
  prep(el, env, ctx) {
    const kind = DOC[el.kind] ? el.kind : 'page'
    const d = DOC[kind]
    const w = +(el.w ?? d.w)
    const pad = Math.round(w * (kind === 'note' ? 0.1 : 0.085))
    const photo = el.photo ? env.picture(el.photo, el.treat) : null
    const pw = photo ? Math.round(w * 0.36) : 0
    const inner = w - pad * 2
    const size = +(el.size ?? d.size)
    let y = pad
    const parts = {}
    if (el.meta) { parts.meta = lay(ctx, env, kind === 'letter' ? 'script' : 'typed', el.meta, Math.max(26, size * 0.66), inner - pw * 0.6); parts.metaY = y; y += parts.meta.h + size * 0.55 }
    if (el.title) {
      const tr = kind === 'clipping' ? 'display' : kind === 'card' || kind === 'telegram' ? 'typed' : 'caps'
      const ts = +(el.titleSize ?? (kind === 'clipping' ? size * 1.9 : size * 1.25))
      parts.title = lay(ctx, env, tr, el.title, ts, inner - pw * 0.6, { upper: kind === 'card' || kind === 'telegram' || undefined, lh: 1.08 })
      parts.titleY = y; y += parts.title.h + size * (kind === 'clipping' ? 0.55 : 0.75)
      if (kind === 'page' || kind === 'clipping') { parts.ruleY = y - size * 0.4; y += size * 0.25 }
    }
    if (el.text) {
      parts.text = lay(ctx, env, el.font || d.role, el.text, size, inner - (photo && !el.title ? pw * 0.6 : 0), { lh: d.lh, upper: d.upper })
      parts.textY = y; y += parts.text.h
    }
    if (kind === 'clipping' && el.columns !== false) { parts.greekY = y + size * 0.5; y += size * 0.5 + size * 4.2 }
    if (el.sign) { parts.sign = lay(ctx, env, 'script', el.sign, size * 1.15, inner); parts.signY = y + size * 0.6; y = parts.signY + parts.sign.h }
    let h = Math.max(y + pad, +(el.h ?? 0), kind === 'card' ? w * 0.6 : 0, kind === 'note' ? w * 0.8 : 0, photo ? pw * 0.9 : 0)
    const mode = el.reveal === false ? 'none' : el.mode ?? d.mode
    const unitDur = 0.6
    const textDur = parts.text ? textInDur(parts.text, mode, env, unitDur) : 0
    return { kind, w, h, pad, size, photo, pw, parts, mode, unitDur, textDur, inner }
  },
  inDur() { return 0.9 },
  draw(ctx, el, st, k, env, node) {
    const { kind, w, h, pad, parts, photo, pw, size } = st
    const p = k.inName === 'place' ? ease('expo-out', k.local / 0.9) : 1
    // landing: from a little above and turned, settling at its tilt
    const tilt = +(el.tilt ?? 0) * Math.PI / 180
    ctx.translate(w / 2, h / 2); ctx.rotate(tilt + (1 - p) * 0.05); const s = lerp(1.06, 1, p); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2 - (1 - p) * 30)
    ctx.globalAlpha *= clamp(p * 2.4)
    const scale = seenScale(ctx)
    const tone = paperTone(env, kind, el.color)
    const sheet = cached(`doc:${node.id}:${kind}:${w}x${Math.round(h)}:${css(tone)}`, w, h, scale, (x) => drawSheet(x, w, h, tone, {
      torn: el.torn ?? DOC[kind].torn ?? '', folds: el.folds === false ? [] : DOC[kind].folds, age: el.age ?? 1,
      rules: kind === 'card' ? { top: pad + (parts.title ? parts.title.h + size * 0.4 : size), step: size * 1.5 } : null,
      hole: kind === 'card',
    }, node.seed))
    laySheet(ctx, sheet, w, h, p, env)
    if (kind === 'note' && el.tape !== false) tapePiece(ctx, w / 2, -10, Math.min(220, w * 0.42), node.seed)
    const ink = paperInk(env)
    const acc = css(rgba(env.style.palette.accent, env.style.palette))
    const t0 = 0.45 // writing starts when the paper has landed
    const local = k.local - t0
    const text = (lay_, x, y, color, mode, start, align = 'l', hl = 'underline') => {
      if (!lay_ || local - start < 0 && mode !== 'none') return
      ctx.save(); ctx.translate(x, y)
      drawText(ctx, lay_, env, { color, acc, align, boxW: st.inner, mode, local: mode === 'none' ? 99 : local - start, unitDur: st.unitDur,
                                 hl, styleKey: env.style.name, seed: node.seed })
      ctx.restore()
    }
    if (parts.meta) text(parts.meta, pad, parts.metaY, css(withAlpha(rgba(ink), 0.75)), st.mode === 'none' ? 'none' : 'fade', 0, kind === 'letter' ? 'r' : 'l')
    if (parts.title) text(parts.title, pad, parts.titleY, ink, st.mode === 'none' ? 'none' : kind === 'card' || kind === 'telegram' ? 'type' : 'fade', 0.1,
                          kind === 'page' ? 'c' : 'l')
    if (parts.ruleY !== undefined) {
      const rp = clamp((local - 0.3) / 0.6)
      ctx.strokeStyle = ink; ctx.lineWidth = 1.6
      ctx.beginPath(); ctx.moveTo(w / 2 - st.inner / 2 * rp, parts.ruleY); ctx.lineTo(w / 2 + st.inner / 2 * rp, parts.ruleY); ctx.stroke()
      if (kind === 'page') { ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(w / 2 - st.inner / 2 * rp, parts.ruleY + 5); ctx.lineTo(w / 2 + st.inner / 2 * rp, parts.ruleY + 5); ctx.stroke() }
    }
    const textStart = parts.title ? 0.5 : 0.15
    if (parts.text) text(parts.text, pad, parts.textY, ink, st.mode, textStart)
    if (parts.greekY !== undefined) greek(ctx, pad, parts.greekY, st.inner, size, ink, node.seed, clamp((local - 0.4) / 0.8))
    const after = textStart + st.textDur
    if (parts.sign) text(parts.sign, pad, parts.signY, ink, st.mode === 'none' ? 'none' : 'write', after + 0.1, 'r')
    if (photo) attachedPhoto(ctx, photo, w, pw, clamp((local + 0.2) / 0.6), node.seed)
    if (el.stamp) {
      const sp = clamp((local - after - 0.5) / 0.3)
      if (sp > 0 || st.mode === 'none') inkStamp(ctx, env, String(el.stamp), w - pad - size * 3.2, h - pad - size * 1.4, size, st.mode === 'none' ? 1 : sp, node.seed)
    }
  },
}

/** A strip of translucent masking tape holding a paper to the desk. */
function tapePiece(ctx, x, y, w, seed) {
  const r = rng(seed + 29)
  ctx.save(); ctx.translate(x, y); ctx.rotate((r() - 0.5) * 0.12)
  ctx.fillStyle = 'rgba(232,222,190,0.72)'
  ctx.beginPath(); ctx.moveTo(-w / 2, -18)
  for (let i = 0; i <= 6; i++) ctx.lineTo(-w / 2 + w * i / 6, -18 + (i % 2 ? 1.5 : -1.5))
  for (let i = 6; i >= 0; i--) ctx.lineTo(-w / 2 + w * i / 6 + (r() - 0.5) * 4, 18 + (i % 2 ? -1.5 : 1.5))
  ctx.closePath(); ctx.fill()
  ctx.restore()
}

/** Columns of small grey lines: the rest of a clipping's article, not meant to be read. */
function greek(ctx, x, y, w, size, ink, seed, p) {
  const r = rng(seed + 3)
  const cols = 2, gap = size * 0.9, cw = (w - gap) / cols, lh = size * 0.62
  ctx.save(); ctx.globalAlpha *= 0.32 * p; ctx.fillStyle = ink
  for (let c = 0; c < cols; c++) for (let i = 0; i < 6; i++) {
    const lw = i === 5 ? cw * (0.3 + r() * 0.4) : cw * (0.86 + r() * 0.14)
    ctx.fillRect(x + c * (cw + gap), y + i * lh, lw, size * 0.2)
  }
  ctx.restore()
}

/** A small print fixed to the top right corner of a document with a paper clip. */
function attachedPhoto(ctx, img, w, pw, p, seed) {
  if (p <= 0) return
  const ph = pw * 0.78, b = pw * 0.05
  ctx.save()
  ctx.translate(w - pw * 0.72, -ph * 0.18)
  ctx.rotate((((seed % 7) - 3) * 0.9 + 3) * Math.PI / 180)
  ctx.globalAlpha *= p
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6
  ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 0, pw, ph + b * 2)
  ctx.shadowColor = 'transparent'
  ctx.save(); ctx.beginPath(); ctx.rect(b, b, pw - b * 2, ph); ctx.clip()
  const k = Math.max((pw - b * 2) / img.width, ph / img.height)
  ctx.drawImage(img, b + (pw - b * 2 - img.width * k) / 2, b + (ph - img.height * k) / 2, img.width * k, img.height * k)
  ctx.restore()
  // the clip
  ctx.strokeStyle = 'rgba(120,120,125,0.95)'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'
  const cx = pw * 0.22, cy = -14
  ctx.beginPath(); ctx.moveTo(cx, cy + 70); ctx.lineTo(cx, cy + 8); ctx.arc(cx + 9, cy + 8, 9, Math.PI, 0); ctx.lineTo(cx + 18, cy + 58)
  ctx.arc(cx + 11, cy + 58, 7, 0, Math.PI); ctx.lineTo(cx + 4, cy + 18); ctx.stroke()
  ctx.restore()
}

/** A worn rubber stamp in the accent, at a slant. */
function inkStamp(ctx, env, text, x, y, size, p, seed) {
  const f = fontSpec(env.style, 'caps')
  const s = Math.max(30, size * 0.9)
  const c = css(rgba(env.style.palette.accent, env.style.palette))
  const scale = seenScale(ctx)
  const mctx = createCanvas(1, 1).getContext('2d')
  mctx.font = fontCss(f, s); mctx.letterSpacing = `${s * 0.12}px`
  const tw = mctx.measureText(text.toUpperCase()).width
  const bw = tw + s * 1.2, bh = s * 1.75
  const img = cached(`stamp:${text}:${c}:${Math.round(s)}:${seed}`, bw + 8, bh + 8, scale, (x) => {
    x.translate(4, 4)
    x.strokeStyle = c; x.fillStyle = c; x.lineWidth = s * 0.08
    rr(x, 0, 0, bw, bh, s * 0.15); x.stroke()
    x.lineWidth = s * 0.03; rr(x, s * 0.14, s * 0.14, bw - s * 0.28, bh - s * 0.28, s * 0.1); x.stroke()
    x.font = fontCss(f, s); x.letterSpacing = `${s * 0.12}px`
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text.toUpperCase(), bw / 2, bh / 2 + s * 0.06)
    // worn rubber: the ink did not take everywhere
    x.globalCompositeOperation = 'destination-out'
    const r = rng(seed + 11)
    for (let i = 0; i < 70; i++) { x.globalAlpha = 0.2 + r() * 0.6; x.beginPath(); x.arc(r() * bw, r() * bh, 0.6 + r() * 2.6, 0, Math.PI * 2); x.fill() }
  })
  ctx.save()
  ctx.translate(x + bw / 2, y + bh / 2); ctx.rotate(-0.16); const k = lerp(1.6, 1, ease('expo-out', p)); ctx.scale(k, k)
  ctx.globalAlpha *= clamp(p * 2) * 0.85
  ctx.drawImage(img, 0, 0, img.width, img.height, -bw / 2 - 4, -bh / 2 - 4, bw + 8, bh + 8)
  ctx.restore()
}

// ------------------------------------------------------------------ portrait
export const portrait = {
  hasText: true,
  own: ['reveal'],
  defaultIn: 'reveal',
  prep(el, env, ctx) {
    const key = String(el.src || '')
    const isCut = key.startsWith('cut:')
    const img = env.picture(key, el.treat ?? (isCut ? env.format.treatCutout : undefined), !isCut)
    if (!img && !/^img\d+$/.test(key) && !isCut) throw new Error(`portrait: src «${key}» — нужно img<номер сцены> или cut:<id>`)
    const frame = ['oval', 'rect', 'arch', 'circle', 'card', 'none'].includes(el.frame) ? el.frame : 'oval'
    const w = +(el.w ?? 560)
    const fh = Math.round(w * (frame === 'circle' ? 1 : frame === 'card' ? 1.45 : frame === 'arch' ? 1.36 : 1.3))
    const ns = Math.max(36, +(el.size ?? Math.round(w * 0.085)))
    const name = el.name ? lay(ctx, env, el.font || 'caps', el.name, ns, Math.max(w * 1.4, 600), { lh: 1.05 }) : null
    const dates = el.dates ? lay(ctx, env, 'book', el.dates, Math.max(30, ns * 0.72), Math.max(w * 1.4, 600)) : null
    const role = el.role ? lay(ctx, env, 'book', el.role, Math.max(30, ns * 0.62), Math.max(w * 1.4, 600)) : null
    const gap = name || dates || role ? ns * 0.6 : 0
    const plateH = (name ? name.h : 0) + (dates ? dates.h + ns * 0.18 : 0) + (role ? role.h + ns * 0.12 : 0)
    const bw = Math.max(w, name ? name.w : 0, dates ? dates.w : 0, role ? role.w : 0)
    return { img, isCut, frame, fw: w, fh, w: bw, h: fh + gap + plateH, name, dates, role, gap, ns }
  },
  inDur() { return 1.1 },
  draw(ctx, el, st, k, env, node) {
    const { img, frame, fw, fh, isCut } = st
    const p = k.inName === 'reveal' ? ease('quart-out', k.local / 1.1) : 1
    const ox = (st.w - fw) / 2
    const pal = env.style.palette
    const ink = css(rgba(pal.ink, pal)), mat = css(paperTone(env, 'card'))
    ctx.save(); ctx.translate(ox, 0)
    ctx.globalAlpha *= clamp(p * 1.8)
    const sc = lerp(1.03, 1, p); ctx.translate(fw / 2, fh / 2); ctx.scale(sc, sc); ctx.translate(-fw / 2, -fh / 2)
    const shape = (x, inset) => {
      const a = inset, W = fw - inset * 2, H = fh - inset * 2
      x.beginPath()
      if (frame === 'oval') x.ellipse(fw / 2, fh / 2, W / 2, H / 2, 0, 0, Math.PI * 2)
      else if (frame === 'circle') x.arc(fw / 2, fh / 2, W / 2, 0, Math.PI * 2)
      else if (frame === 'arch') { x.moveTo(a, a + W / 2); x.arc(fw / 2, a + W / 2, W / 2, Math.PI, 0); x.lineTo(a + W, a + H); x.lineTo(a, a + H); x.closePath() }
      else x.rect(a, a, W, H)
    }
    const m = frame === 'none' ? 0 : Math.round(fw * 0.075)
    if (frame !== 'none') { // mount / passe-partout with a frame line
      ctx.save()
      if (!env.overlay) { ctx.shadowColor = 'rgba(0,0,0,0.32)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14 }
      ctx.fillStyle = mat
      if (frame === 'card') rr(ctx, 0, 0, fw, fh, 6); else shape(ctx, 0)
      ctx.fill(); ctx.restore()
      ctx.strokeStyle = css(withAlpha(rgba(pal.ink, pal), 0.55)); ctx.lineWidth = 1.5
      if (frame === 'card') { rr(ctx, m * 0.45, m * 0.45, fw - m * 0.9, fh - m * 0.9, 3); ctx.stroke() }
      else { shape(ctx, m * 0.45); ctx.stroke() }
    }
    if (img) {
      ctx.save()
      const inset = frame === 'card' ? 0 : m
      if (frame === 'card') { ctx.beginPath(); ctx.rect(m, m, fw - m * 2, fh - m * 3.2) } else shape(ctx, inset)
      ctx.clip()
      const bx = frame === 'card' ? m : inset, by = bx, bwid = fw - bx * 2, bh = frame === 'card' ? fh - m * 4.2 : fh - by * 2
      if (isCut) { ctx.fillStyle = css(mix(paperTone(env, 'card'), [120, 100, 80, 1], 0.12)); ctx.fillRect(bx, by, bwid, bh) }
      const z = +(el.zoom ?? 1) * (1 + 0.04 * clamp(k.local / Math.max(2, k.end - (k.t - k.local))))
      const fit = (isCut ? Math.min(bwid / img.width, bh / img.height) * 0.98 : Math.max(bwid / img.width, bh / img.height)) * z
      const dw = img.width * fit, dh = img.height * fit
      const fx = +(el.fx ?? 0.5), fy = +(el.fy ?? (isCut ? 1 : 0.32))
      ctx.globalAlpha *= clamp((k.local - 0.15) / 0.7)
      ctx.drawImage(img, bx + (bwid - dw) * fx, by + (bh - dh) * fy, dw, dh)
      ctx.restore()
    }
    ctx.restore()
    // the name plate
    let y = fh + st.gap
    const line = (lay_, color, start) => {
      if (!lay_) return
      const tp = clamp((k.local - start) / 0.7)
      if (tp > 0) {
        ctx.save(); ctx.globalAlpha *= tp; ctx.translate((st.w - lay_.w) / 2, y + (1 - ease('cubic-out', tp)) * 14)
        drawText(ctx, lay_, env, { color, acc: env.color('accent'), align: 'c', boxW: lay_.w, mode: 'none', local: 99, styleKey: env.style.name })
        ctx.restore()
      }
      y += lay_.h
    }
    line(st.name, env.color(el.color ?? 'ink'), 0.55)
    if (st.dates) y += st.ns * 0.18
    line(st.dates, env.color('accent'), 0.8)
    if (st.role) y += st.ns * 0.12
    line(st.role, env.color('muted'), 1.0)
    void ink
  },
}

// ------------------------------------------------------------------ title (film title card)
export const title = {
  hasText: true,
  own: ['track'],
  defaultIn: 'track',
  prep(el, env, ctx) {
    const size = Math.max(48, +(el.size ?? 120))
    const maxw = +(el.w ?? 1560)
    const font = fontSpec(env.style, el.font || 'display')
    const head = layoutText(ctx, el.text, { font, size, maxw, upper: el.upper ?? font.upper, ls: el.ls ?? font.ls ?? 0, lh: el.lh ?? 1.04 })
    // every character's x for the tracking-in
    ctx.font = fontCss(font, size)
    ctx.letterSpacing = `${head.ls}px`
    for (const line of head.lines) {
      line.chars = []
      for (const w of line.words) {
        let x = w.x
        for (const ch of w.text) { line.chars.push({ ch, x, acc: w.acc }); x += ctx.measureText(ch).width }
      }
    }
    ctx.letterSpacing = '0px'
    const kicker = el.kicker ? lay(ctx, env, el.kickerFont || 'thin', el.kicker, Math.max(28, +(el.kickerSize ?? size * 0.26)), maxw, { lh: 1.1 }) : null
    const sub = el.sub ? lay(ctx, env, el.subFont || 'book', el.sub, Math.max(36, +(el.subSize ?? size * 0.36)), maxw * 0.9, { lh: 1.25 }) : null
    const kgap = kicker ? size * 0.42 : 0
    const sgap = sub ? size * (el.rule === false ? 0.35 : 0.62) : 0
    const w = Math.max(head.w, kicker ? kicker.w + (alignOf(el) === 'c' ? 160 : 0) : 0, sub ? sub.w : 0)
    return { head, kicker, sub, kgap, sgap, w, h: (kicker ? kicker.h + kgap : 0) + head.h + (sub ? sgap + sub.h : 0), size, font }
  },
  inDur(el, st) { return 1.1 + st.head.lines.length * 0.2 + (st.sub ? 0.6 : 0) },
  draw(ctx, el, st, k, env) {
    const { head, kicker, sub, size, font } = st
    const align = alignOf(el)
    const e = env.motion.ease
    const L = k.inName === 'track' ? k.local : 99
    const ax = (lw) => (align === 'c' ? (st.w - lw) / 2 : align === 'r' ? st.w - lw : 0)
    const ink = env.color(el.color ?? 'ink'), acc = env.color(el.acc ?? 'accent')
    let y = 0
    if (kicker) {
      const kp = clamp(L / 0.7)
      ctx.save(); ctx.globalAlpha *= kp
      ctx.translate(ax(kicker.w), 0)
      drawText(ctx, kicker, env, { color: acc, acc, align: 'l', boxW: kicker.w, mode: 'none', local: 99, styleKey: env.style.name })
      ctx.restore()
      // flanking hairlines (centred) or a short rule before it (left)
      const rp = ease('cubic-out', clamp((L - 0.2) / 0.9))
      ctx.strokeStyle = acc; ctx.lineWidth = 2
      const my = kicker.asc * 0.62
      ctx.beginPath()
      if (align === 'c') {
        const x0 = ax(kicker.w) - 26, x1 = ax(kicker.w) + kicker.w + 26
        ctx.moveTo(x0, my); ctx.lineTo(x0 - 54 * rp, my); ctx.moveTo(x1, my); ctx.lineTo(x1 + 54 * rp, my)
      }
      ctx.stroke()
      y += kicker.h + st.kgap
    }
    // headline: each line tracks in from wide letter spacing, softly fading up
    ctx.font = fontCss(font, size)
    ctx.textBaseline = 'alphabetic'
    head.lines.forEach((line, i) => {
      const p = ease(e, clamp((L - 0.15 - i * 0.2) / 1.15))
      if (p <= 0) return
      const lx = ax(line.w), cx = line.w / 2
      const spread = 1 + 0.16 * (1 - p)
      ctx.save()
      ctx.globalAlpha *= Math.pow(p, 1.6)
      ctx.translate(lx, y + line.y + head.asc + (1 - p) * size * 0.06)
      for (const c of line.chars) {
        ctx.fillStyle = c.acc ? acc : ink
        ctx.fillText(c.ch, cx + (c.x - cx) * spread, 0)
      }
      ctx.restore()
    })
    y += head.h
    if (sub) {
      if (el.rule !== false) {
        const rp = ease('cubic-out', clamp((L - 0.7) / 0.8))
        const rw = Math.min(head.w * 0.5, 320) * rp
        const rx = align === 'c' ? st.w / 2 - rw / 2 : align === 'r' ? st.w - rw : 0
        ctx.fillStyle = acc; ctx.fillRect(rx, y + st.sgap * 0.42, rw, 2.5)
      }
      const sp = clamp((L - 0.9) / 0.7)
      ctx.save(); ctx.globalAlpha *= sp; ctx.translate(ax(sub.w), y + st.sgap + (1 - sp) * 12)
      drawText(ctx, sub, env, { color: env.color('muted'), acc, align: 'l', boxW: sub.w, mode: 'none', local: 99, styleKey: env.style.name })
      ctx.restore()
    }
  },
}

// ------------------------------------------------------------------ filmstrip
export const filmstrip = {
  prep(el, env) {
    const srcs = (Array.isArray(el.srcs) ? el.srcs : [el.src]).filter(Boolean).map(String)
    if (!srcs.length) throw new Error('filmstrip: нужен srcs — список картинок img<N>')
    const imgs = srcs.map((s) => env.picture(s, el.treat)).filter(Boolean)
    const fh = +(el.fh ?? 300), fw = Math.round(fh * 1.5), band = Math.round(fh * 0.2), gap = Math.round(fh * 0.06)
    const w = +(el.w ?? 2100)
    return { imgs, fh, fw, band, gap, w, h: fh + band * 2 }
  },
  draw(ctx, el, st, k) {
    const { imgs, fh, fw, band, gap, w, h } = st
    const step = fw + gap
    const off = ((+(el.speed ?? 40)) * k.local * (el.dir === 'l' ? -1 : 1)) % step
    ctx.save()
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip()
    ctx.fillStyle = '#16120e'; ctx.fillRect(0, 0, w, h)
    // sprocket holes
    ctx.fillStyle = 'rgba(232,222,200,0.92)'
    const hs = band * 0.42, hp = band * 0.95
    for (let x = -hp + (off % hp); x < w + hp; x += hp) {
      rr(ctx, x, band * 0.29, hs * 0.75, hs, 3); ctx.fill()
      rr(ctx, x, h - band * 0.29 - hs, hs * 0.75, hs, 3); ctx.fill()
    }
    const n = Math.ceil(w / step) + 2
    for (let i = -1; i < n; i++) {
      const x = i * step + off
      const img = imgs.length ? imgs[((i % imgs.length) + imgs.length) % imgs.length] : null
      ctx.save(); ctx.beginPath(); ctx.rect(x, band, fw, fh); ctx.clip()
      if (img) {
        const s = Math.max(fw / img.width, fh / img.height)
        ctx.drawImage(img, x + (fw - img.width * s) / 2, band + (fh - img.height * s) / 2, img.width * s, img.height * s)
      } else { ctx.fillStyle = '#3a342c'; ctx.fillRect(x, band, fw, fh) }
      const g = ctx.createRadialGradient(x + fw / 2, band + fh / 2, fh * 0.3, x + fw / 2, band + fh / 2, fw * 0.7)
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)')
      ctx.fillStyle = g; ctx.fillRect(x, band, fw, fh)
      ctx.restore()
      ctx.fillStyle = 'rgba(214,140,60,0.8)'; ctx.font = '600 13px "JetBrains Mono"'
      ctx.fillText(`${24 + i} ▸`, x + 6, h - 4)
    }
    ctx.restore()
  },
}

// ------------------------------------------------------------------ paper scrap
export const paper = {
  hasText: true,
  own: ['place'],
  defaultIn: 'place',
  prep(el, env, ctx) {
    const kind = ['strip', 'scrap', 'label', 'tape'].includes(el.kind) ? el.kind : 'strip'
    const size = Math.max(32, +(el.size ?? (kind === 'tape' ? 44 : 64)))
    const role = el.font || (kind === 'label' ? 'typed' : kind === 'tape' ? 'hand' : 'display')
    const t = lay(ctx, env, role, el.text ?? '', size, +(el.w ?? 1400), { lh: 1.08, upper: kind === 'label' || undefined })
    const px = size * (kind === 'scrap' ? 0.7 : 0.45), py = size * (kind === 'scrap' ? 0.55 : 0.3)
    return { kind, t, px, py, w: t.w + px * 2, h: t.h + py * 2, size }
  },
  inDur() { return 0.6 },
  draw(ctx, el, st, k, env, node) {
    const { kind, t, px, py, w, h } = st
    const p = k.inName === 'place' ? ease('expo-out', k.local / 0.6) : 1
    ctx.translate(w / 2, h / 2); ctx.rotate((1 - p) * 0.08); const s = lerp(1.1, 1, p); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2)
    ctx.globalAlpha *= clamp(p * 2.5)
    const tone = kind === 'tape' ? paperTone(env, 'tape') : paperTone(env, 'strip', el.color)
    const sheet = cached(`paper:${node.id}:${kind}:${Math.round(w)}x${Math.round(h)}:${css(tone)}`, w, h, seenScale(ctx),
                         (x) => drawSheet(x, w, h, tone, { torn: kind === 'strip' ? 'lr' : kind === 'scrap' ? 'tblr' : kind === 'tape' ? 'lr' : '',
                                                         deckle: kind === 'label' ? 0.4 : 1.4, age: kind === 'tape' ? 0.3 : 0.7 }, node.seed))
    laySheet(ctx, sheet, w, h, p, env, kind === 'tape' ? 0.4 : 0.8)
    const color = el.textColor ? env.color(el.textColor) : luma(tone) > 0.55 ? paperInk(env) : '#f4efe4'
    ctx.save(); ctx.translate(px, py)
    drawText(ctx, t, env, { color, acc: css(rgba(env.style.palette.accent, env.style.palette)), align: 'l', boxW: t.w, mode: 'none', local: 99,
                            styleKey: env.style.name, hl: 'underline' })
    ctx.restore()
    void hash
  },
}
