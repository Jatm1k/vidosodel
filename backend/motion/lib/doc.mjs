// A motion document: style + full-screen scenes + overlays of one video, as written by the app.
//   {width, height, lang, seed, fontsDir, style: {base, ...overrides},
//    assets: {key: absolute image path}, safeBottom?: 0..1,
//    scenes: [{id, dur, bg?, cam?, els}], overlays: [{id, start, end, shade?, els, previewBg?}]}
import { readFileSync } from 'node:fs'
import { loadImage } from '@napi-rs/canvas'
import { loadFonts } from './fonts.mjs'
import { resolveStyle } from './styles.mjs'
import { Env, SceneRuntime, OverlayRuntime, VW, VH } from './scene.mjs'

export async function loadDoc(path) {
  const doc = JSON.parse(readFileSync(path, 'utf8'))
  loadFonts(doc.fontsDir)
  const style = resolveStyle(doc.style)
  const images = {}
  for (const [key, file] of Object.entries(doc.assets || {})) {
    try { images[key] = await loadImage(readFileSync(file)) } catch { /* a missing picture is reported by the element */ }
  }
  return { doc, style, images }
}

export class Motion {
  constructor({ doc, style, images }, ctx) {
    this.doc = doc
    this.style = style
    this.images = images
    this.ctx = ctx
    this.scenes = new Map((doc.scenes || []).map((s) => [String(s.id), s]))
    this.overlaySpecs = (doc.overlays || []).slice().sort((a, b) => a.start - b.start)
    this.runtimes = new Map()
    this.overlays = null
  }
  env(overlay) {
    return new Env({ style: this.style, lang: this.doc.lang || 'ru', images: this.images, seed: this.doc.seed || 1, overlay })
  }
  scene(id) {
    const key = String(id)
    let rt = this.runtimes.get(key)
    if (!rt) {
      const spec = this.scenes.get(key)
      if (!spec) throw new Error(`нет сцены ${id}`)
      rt = new SceneRuntime(spec, this.env(false), this.ctx)
      this.runtimes.set(key, rt)
    }
    return rt
  }
  overlayRuntimes() {
    if (!this.overlays) {
      this.overlays = []
      for (const spec of this.overlaySpecs) {
        try { this.overlays.push(new OverlayRuntime(spec, this.env(true), this.ctx)) } catch (e) { process.stderr.write(`overlay ${spec.id}: ${e.message}\n`) }
      }
    }
    return this.overlays
  }
  /** Draws the overlays active at absolute time t; false when none is. */
  drawOverlays(ctx, t) {
    let any = false
    for (const o of this.overlayRuntimes()) {
      if (o.start > t + 0.1) break
      if (!o.active(t)) continue
      o.draw(ctx, t)
      any = true
    }
    return any
  }
}

// ------------------------------------------------------------------ checks
const area = (b) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0)
function overlap(a, b) {
  const x = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)), y = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0))
  return x * y
}

/** Problems a layout has after every element settled: out of frame, text over text, tiny text. */
export function checkLayout(boxes, { dur, overlay = false, safeBottom = 0, cam = false } = {}) {
  const warn = []
  for (const b of boxes) {
    const el = b.el
    if (b.at > dur - 0.3) warn.push(`${b.id} (${b.type}): появляется на ${b.at.toFixed(1)} с, а сцена длится ${dur.toFixed(1)} с`)
    if (!cam && !el.bleed && b.type !== 'map' && b.type !== 'decor' && b.type !== 'shape') {
      const m = 8
      if (b.x0 < -m || b.y0 < -m || b.x1 > VW + m || b.y1 > VH + m)
        warn.push(`${b.id} (${b.type}): выходит за кадр — x ${Math.round(b.x0)}…${Math.round(b.x1)}, y ${Math.round(b.y0)}…${Math.round(b.y1)}`)
    }
    if (b.text && (el.size !== undefined && +el.size < 24)) warn.push(`${b.id}: слишком мелкий текст (size ${el.size}), минимум 24`)
    if (overlay && safeBottom && b.text && b.y1 > VH * safeBottom && b.y0 < VH * 0.97)
      warn.push(`${b.id}: залезает в зону субтитров (y > ${Math.round(VH * safeBottom)})`)
  }
  const texts = boxes.filter((b) => b.text || b.type === 'bars' || b.type === 'linechart' || b.type === 'donut' || b.type === 'ring' || b.type === 'counter')
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j]
    // both on screen at the same time after settling?
    const from = Math.max(a.settle, b.settle), to = Math.min(a.until, b.until, dur)
    if (to - from < 0.2) continue
    const o = overlap(a, b)
    if (o > 0.12 * Math.min(area(a), area(b)) && o > 900)
      warn.push(`${a.id} (${a.type}) и ${b.id} (${b.type}) перекрываются`)
  }
  return warn
}

export { VW, VH }
