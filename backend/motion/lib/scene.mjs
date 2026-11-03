// The scene runtime: elements with entrance / exit / keyframes / idle motion, a camera, a background.
// Every frame is a pure function of (scene, t), so frames render in any order in any worker.
import { clamp, lerp, ease, phase, boxOrigin, noise1, hash, rgba, css } from './core.mjs'
import { createCanvas } from '@napi-rs/canvas'
import { drawBackground } from './bg.mjs'
import { ELEMENTS } from './els/index.mjs'

export const VW = 1920, VH = 1080

/** Everything an element needs besides its own data. */
export class Env {
  constructor({ style, lang = 'ru', assets = {}, images = {}, seed = 1, overlay = false, placeholders = false, cutouts = {} }) {
    this.style = style
    this.pal = overlay ? overlayPalette(style.palette) : style.palette
    this.lang = lang
    this.assets = assets
    this.images = images // asset key → loaded Image
    this.seed = seed
    this.overlay = overlay
    this.placeholders = placeholders
    this.cutouts = cutouts // cut-out id → {shape: tall|wide|square, what}: the ones planned for this video
  }
  /** A picture by key; while composing, a missing one is a grey stand-in (it is drawn later in the pipeline). */
  image(key) {
    if (this.images[key]) return this.images[key]
    const k = String(key)
    if (!this.placeholders) return null
    if (k.startsWith('cut:')) return this.cutoutStandIn(k)
    if (!/^img\d+$/.test(k)) return null
    const c = createCanvas(1376, 768), x = c.getContext('2d')
    x.fillStyle = '#8d929b'; x.fillRect(0, 0, 1376, 768)
    x.fillStyle = '#b9bdc4'; x.font = '600 90px "Inter"'; x.textAlign = 'center'; x.fillText(`картинка ${k.slice(3)}`, 688, 410)
    this.images[key] = c
    return c
  }
  /** A cut-out still being drawn: a grey silhouette of its shape on a transparent background. */
  cutoutStandIn(key) {
    const info = this.cutouts[key.slice(4)]
    if (!info) return null
    const [w, h] = info.shape === 'wide' ? [900, 600] : info.shape === 'square' ? [700, 700] : [560, 900]
    const c = createCanvas(w, h), x = c.getContext('2d')
    x.fillStyle = 'rgba(141,146,155,0.9)'
    x.beginPath()
    if (info.shape === 'tall') { x.arc(w / 2, h * 0.17, w * 0.17, 0, Math.PI * 2); x.roundRect(w * 0.18, h * 0.36, w * 0.64, h * 0.64, 60) }
    else x.roundRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9, 80)
    x.fill()
    x.fillStyle = '#e4e6ea'; x.font = '600 46px "Inter"'; x.textAlign = 'center'
    x.fillText(key.slice(4).slice(0, 18), w / 2, h * 0.7)
    this.images[key] = c
    return c
  }
  color(spec, fallback = 'ink') { return css(rgba(spec ?? fallback, this.pal, fallback)) }
  rgba(spec, fallback = 'ink') { return rgba(spec ?? fallback, this.pal, fallback) }
  get motion() { return this.style.motion }
}

/** Over a picture free text must be light: ink and muted become light tones, panels keep the style. */
function overlayPalette(pal) {
  const ink = rgba(pal.ink, pal), bg = rgba(pal.bg, pal)
  const lightOf = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] > 150
  const light = lightOf(ink) ? pal.ink : lightOf(bg) ? pal.bg : '#ffffff'
  return { ...pal, ink: light, muted: css(rgba(light, pal)).replace(/,[\d.]+\)$/, ',0.82)') }
}

// ------------------------------------------------------------------ preparation
/** Element types that only exist to hold others. */
const CONTAINERS = new Set(['group'])

export function prepElements(els, env, ctx, path = '') {
  return (els || []).map((el, i) => {
    const def = ELEMENTS[el.type]
    if (!def) throw new Error(`${path}els[${i}]: неизвестный тип элемента «${el.type}»`)
    const id = el.id || `${path}${i}`
    const node = { el, def, id, seed: hash(id) ^ env.seed }
    node.st = def.prep ? def.prep(el, env, ctx, node) : {}
    if (CONTAINERS.has(el.type)) node.children = prepElements(el.els, env, ctx, `${id}.`)
    node.inDur = el.dur ?? (def.inDur ? def.inDur(el, node.st, env) : env.motion.dur)
    node.at = +(el.at ?? 0)
    return node
  })
}

// ------------------------------------------------------------------ entrance / exit presets
const OWN = (def, name) => def.own && def.own.includes(name)

/** Applies a common entrance/exit preset (``p`` 0 → hidden, 1 → in place). Returns false when invisible. */
function applyPreset(ctx, name, p, w, h, env) {
  if (p >= 1) return true
  if (p <= 0 && name !== 'none') return false
  switch (name) {
    case 'none': return true
    case 'fade': ctx.globalAlpha *= p; return true
    case 'rise': ctx.translate(0, (1 - p) * 60); ctx.globalAlpha *= clamp(p * 1.6); return true
    case 'drop': ctx.translate(0, -(1 - p) * 60); ctx.globalAlpha *= clamp(p * 1.6); return true
    case 'left': ctx.translate(-(1 - p) * 120, 0); ctx.globalAlpha *= clamp(p * 1.6); return true
    case 'right': ctx.translate((1 - p) * 120, 0); ctx.globalAlpha *= clamp(p * 1.6); return true
    case 'pop': case 'zoom': case 'slam': {
      const s = name === 'zoom' ? lerp(0.6, 1, p) : name === 'slam' ? lerp(1.8, 1, p) : Math.max(0.001, p)
      ctx.translate(w / 2, h / 2); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2)
      ctx.globalAlpha *= clamp(p * 2); return true
    }
    case 'blur': { // soft focus-in without a real blur: scale settles while fading in
      const s = lerp(1.12, 1, p)
      ctx.translate(w / 2, h / 2); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2)
      ctx.globalAlpha *= p * p; return true
    }
    case 'wipe': ctx.beginPath(); ctx.rect(-4, -h, (w + 8) * p, h * 3); ctx.clip(); return true
    case 'wipe-l': ctx.beginPath(); ctx.rect(w + 4 - (w + 8) * p, -h, (w + 8) * p, h * 3); ctx.clip(); return true
    case 'wipe-up': ctx.beginPath(); ctx.rect(-w, h + 4 - (h + 8) * p, w * 3, (h + 8) * p); ctx.clip(); return true
    case 'iris': { const r = Math.hypot(w, h) / 2 * p; ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.clip(); return true }
    case 'flip': ctx.translate(w / 2, h / 2); ctx.scale(1, Math.max(0.001, p)); ctx.translate(-w / 2, -h / 2); return true
    default: ctx.globalAlpha *= p; return true
  }
}

const KEYS = ['x', 'y', 'scale', 'rot', 'opacity', 'sx', 'sy']
/** Keyframed transform values at time t (keys hold between keyframes). */
function animValues(el, t) {
  const base = { x: +(el.x ?? VW / 2), y: +(el.y ?? VH / 2), scale: +(el.scale ?? 1), rot: +(el.rot ?? 0),
                 opacity: +(el.opacity ?? 1), sx: 1, sy: 1 }
  const kf = el.anim
  if (!Array.isArray(kf) || !kf.length) return base
  const out = { ...base }
  for (const k of KEYS) {
    let prevT = null, prevV = base[k]
    for (const f of kf) {
      if (f[k] === undefined) continue
      const ft = +(f.t ?? 0)
      if (t >= ft) { prevT = ft; prevV = +f[k]; out[k] = prevV; continue }
      // between the previous key (or the element's own value) and this one
      const t0 = prevT ?? +(el.at ?? 0)
      const dur = Math.max(0.001, ft - t0)
      if (t > t0 || prevT === null) out[k] = lerp(prevV, +f[k], ease(f.e || 'cubic', (t - t0) / dur))
      break
    }
  }
  return out
}

function idle(ctx, kind, t, seed, w, h) {
  if (!kind) return
  const s = (seed % 1000) / 1000 * 6.28
  switch (kind) {
    case 'float': ctx.translate(0, Math.sin(t * 1.3 + s) * 8); break
    case 'sway': ctx.translate(w / 2, h / 2); ctx.rotate(Math.sin(t * 0.9 + s) * 0.03); ctx.translate(-w / 2, -h / 2); break
    case 'pulse': { const k = 1 + Math.sin(t * 3 + s) * 0.03; ctx.translate(w / 2, h / 2); ctx.scale(k, k); ctx.translate(-w / 2, -h / 2); break }
    case 'spin': ctx.translate(w / 2, h / 2); ctx.rotate(t * 0.6); ctx.translate(-w / 2, -h / 2); break
    case 'drift': ctx.translate(noise1(t * 0.4, seed) * 14, noise1(t * 0.35, seed + 7) * 10); break
    case 'shake': ctx.translate(noise1(t * 18, seed) * 4, noise1(t * 17, seed + 3) * 4); break
  }
}

// ------------------------------------------------------------------ drawing
/** Draws prepared elements at scene time ``t``; ``end`` is the scene end (for default exits). */
export function drawElements(ctx, nodes, t, env, end = Infinity) {
  for (const node of nodes) drawNode(ctx, node, t, env, end)
}

function drawNode(ctx, node, t, env, end) {
  const { el, def, st } = node
  if (t < node.at) return
  const until = el.until !== undefined ? +el.until : Infinity
  const outDur = +(el.outDur ?? 0.45)
  if (t > until + outDur) return
  const v = animValues(el, t)
  if (v.opacity <= 0) return
  const motion = env.motion
  const inName = el.in ?? def.defaultIn ?? 'fade'
  const pIn = phase(t, node.at, node.inDur, el.ease || (inName === 'pop' || inName === 'slam' ? motion.pop : motion.ease))
  const pOut = t > until ? phase(t, until, outDur, 'cubic-in') : 0
  const w = st.w || 0, h = st.h || 0
  const [ox, oy] = CONTAINERS.has(el.type) ? [0, 0] : boxOrigin(el.anchor || def.anchor || 'c', w, h)
  ctx.save()
  ctx.translate(v.x, v.y)
  if (v.rot) ctx.rotate(v.rot * Math.PI / 180)
  if (v.scale !== 1 || v.sx !== 1 || v.sy !== 1) ctx.scale(v.scale * v.sx, v.scale * v.sy)
  ctx.translate(ox, oy)
  ctx.globalAlpha *= v.opacity
  idle(ctx, el.loop, t, node.seed, w, h)
  let visible = true
  if (!OWN(def, inName)) visible = applyPreset(ctx, inName, pIn, w, h, env)
  const outName = el.out ?? 'fade'
  if (visible && pOut > 0) visible = OWN(def, outName) ? true : applyPreset(ctx, outName, 1 - pOut, w, h, env)
  if (visible) {
    const k = { in: OWN(def, inName) ? pIn : 1, inName, out: pOut, outName, local: t - node.at, t, end: Math.min(end, until) }
    if (el.glow) { const c = env.rgba(el.glow === true ? (el.color || 'accent') : el.glow); ctx.shadowColor = css(c); ctx.shadowBlur = 28 }
    else if (el.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12 }
    def.draw(ctx, el, st, k, env, node)
    if (node.children) drawElements(ctx, node.children, t, env, end)
  }
  ctx.restore()
}

/** Final (settled) box of every element in scene coordinates, for layout checks. */
export function elementBoxes(nodes, parent = [0, 0]) {
  const out = []
  for (const node of nodes) {
    const { el, def, st } = node
    const s = +(el.scale ?? 1)
    const x = +(el.x ?? VW / 2) + parent[0], y = +(el.y ?? VH / 2) + parent[1]
    if (node.children) { out.push(...elementBoxes(node.children, [x, y])); continue }
    const [ox, oy] = boxOrigin(el.anchor || def.anchor || 'c', st.w || 0, st.h || 0)
    out.push({ id: node.id, type: el.type, text: !!def.hasText, x0: x + ox * s, y0: y + oy * s,
               x1: x + (ox + (st.w || 0)) * s, y1: y + (oy + (st.h || 0)) * s, at: node.at,
               until: el.until !== undefined ? +el.until : Infinity, settle: node.at + node.inDur, el })
  }
  return out
}

// ------------------------------------------------------------------ camera
function camAt(cam, t) {
  const base = { x: VW / 2, y: VH / 2, zoom: 1, rot: 0 }
  if (!Array.isArray(cam) || !cam.length) return base
  const out = { ...base }
  for (const k of ['x', 'y', 'zoom', 'rot']) {
    let prevT = 0, prevV = base[k]
    for (const f of cam) {
      if (f[k] === undefined) continue
      const ft = +(f.t ?? 0)
      if (t >= ft) { prevT = ft; prevV = +f[k]; out[k] = prevV; continue }
      out[k] = lerp(prevV, +f[k], ease(f.e || 'cubic', (t - prevT) / Math.max(0.001, ft - prevT)))
      break
    }
  }
  return out
}

// ------------------------------------------------------------------ scenes and overlays
export class SceneRuntime {
  /** ``spec``: ``{id, dur, bg?, cam?, els}`` of a full-screen scene. */
  constructor(spec, env, ctx) {
    this.spec = spec
    this.env = env
    this.dur = +(spec.dur ?? 5)
    this.nodes = prepElements(spec.els, env, ctx)
    this.bgSeed = hash(String(spec.id ?? 'scene')) ^ env.seed
    this.lateStart = pullFirstIn(this.nodes)
  }
  draw(ctx, t) {
    const env = this.env
    ctx.save()
    const c = camAt(this.spec.cam, t)
    if (!Array.isArray(this.spec.cam) && this.spec.cam !== false) {
      // no camera of its own: a slow push-in with a little drift keeps the frame alive
      const u = clamp(t / Math.max(1, this.dur))
      const dir = (this.bgSeed % 4) - 1.5
      c.zoom = 1 + 0.045 * ease('sine', u)
      c.x += dir * 14 * ease('sine', u)
      c.y += ((this.bgSeed >> 3) % 3 - 1) * 8 * ease('sine', u)
    }
    drawBackground(ctx, env, this.spec.bg, t, this.bgSeed, c)
    ctx.translate(VW / 2, VH / 2)
    if (c.zoom !== 1) ctx.scale(c.zoom, c.zoom)
    if (c.rot) ctx.rotate(c.rot * Math.PI / 180)
    ctx.translate(-c.x, -c.y)
    drawElements(ctx, this.nodes, t, env, this.dur)
    ctx.restore()
  }
  boxes() { return elementBoxes(this.nodes) }
}

/** A motion scene must not open on an empty background: when nothing is on screen in the first half second
 *  (the first phrase anchor lands late), the first element — the largest of those arriving first — comes in at
 *  once. Returns how late the scene would have started (0 = it was fine). */
const FIRST_IN = 0.5
function pullFirstIn(nodes) {
  if (!nodes.length) return 0
  const first = Math.min(...nodes.map((n) => n.at))
  if (first <= FIRST_IN) return 0
  const soon = nodes.filter((n) => n.at <= first + 0.6)
  const size = (n) => (n.st.w || 0) * (n.st.h || 0)
  const lead = soon.reduce((a, b) => (size(b) > size(a) ? b : a), soon[0])
  lead.at = 0.15
  // the hero of the opening (a chart, a photo, a figure due in the next seconds) comes along: a frame with only
  // a caption or a decoration in it is still empty
  const opening = nodes.filter((n) => n !== lead && n.at <= first + 2.5 && n.el.type !== 'decor')
  const hero = opening.reduce((a, b) => (!a || size(b) > size(a) ? b : a), null)
  if (hero && size(hero) > size(lead) * 1.5) hero.at = 0.35
  return +first.toFixed(2)
}

export class OverlayRuntime {
  /** ``spec``: ``{id, start, end, shade?, els}``; element times are relative to ``start``. */
  constructor(spec, env, ctx) {
    this.spec = spec
    this.env = env
    this.start = +spec.start
    this.end = +spec.end
    this.nodes = prepElements(spec.els, env, ctx)
  }
  active(t) { return t >= this.start - 0.05 && t <= this.end + 0.6 }
  draw(ctx, absT) {
    const t = absT - this.start
    const dur = this.end - this.start
    // the whole overlay fades out over its last half second unless the elements have their own exits
    const fade = clamp((dur + 0.5 - t) / 0.5)
    if (fade <= 0) return
    ctx.save()
    ctx.globalAlpha = fade
    if (this.spec.shade) drawShade(ctx, this.env, this.spec.shade, clamp(t / 0.5))
    // a soft shadow under everything keeps thin lines and text readable on any picture
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 2
    drawElements(ctx, this.nodes, t, this.env, dur)
    ctx.restore()
  }
  boxes() { return elementBoxes(this.nodes) }
}

/** A darkening gradient that keeps overlay text readable on any picture. */
function drawShade(ctx, env, side, p) {
  const k = 0.62 * p
  let g
  if (side === 'left') g = ctx.createLinearGradient(0, 0, VW * 0.6, 0)
  else if (side === 'right') g = ctx.createLinearGradient(VW, 0, VW * 0.4, 0)
  else if (side === 'top') g = ctx.createLinearGradient(0, 0, 0, VH * 0.5)
  else if (side === 'bottom') g = ctx.createLinearGradient(0, VH, 0, VH * 0.5)
  if (g) {
    g.addColorStop(0, `rgba(0,0,0,${k})`); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
  } else ctx.fillStyle = `rgba(0,0,0,${k * 0.75})`
  ctx.fillRect(0, 0, VW, VH)
}
