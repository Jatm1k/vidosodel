// How pictures are printed in a format: the video's own pictures (and cut-outs) as an archival print, an
// engraving, a halftone print, a duotone or black-and-white. Each treatment is computed once per picture, palette
// and kind, at the picture's own resolution (≤ 1600 px), and keeps the picture's transparency.
import { createCanvas } from '@napi-rs/canvas'
import { rgba, rng } from './core.mjs'

export const TREATS = ['none', 'archival', 'engraving', 'halftone', 'duotone', 'mono']

const cache = new WeakMap()
const MAX = 1600

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
/** Soft S-curve around the middle: more contrast without clipping. */
const scurve = (x, k) => { const y = x - 0.5; return 0.5 + y * (1 + k) / (1 + k * Math.abs(y) * 2) }

/** ``img`` treated as ``kind`` in the colours of ``pal`` (a canvas), or ``img`` itself for none / unknown. */
export function treated(img, kind, pal, seed = 1) {
  if (!img || !kind || kind === 'none' || !TREATS.includes(kind)) return img
  let per = cache.get(img)
  if (!per) { per = new Map(); cache.set(img, per) }
  const key = `${kind}|${pal.ink}|${pal.panel}|${pal.bg}|${pal.accent}`
  let out = per.get(key)
  if (!out) { out = render(img, kind, pal, seed); per.set(key, out) }
  return out
}

function render(img, kind, pal, seed) {
  const k = Math.min(1, MAX / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k))
  const c = createCanvas(w, h), x = c.getContext('2d')
  x.drawImage(img, 0, 0, w, h)
  const src = x.getImageData(0, 0, w, h)
  const d = src.data
  const n = w * h
  // luminance and its local mean (a small copy scaled back up: the low frequencies, for local contrast)
  const L = new Float32Array(n)
  for (let i = 0; i < n; i++) L[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255
  const low = lowpass(c, w, h)
  // auto levels: a dark oil painting or a flat photo uses the whole range of the print (2–98 % of its pixels),
  // a little brighter for the line treatments, whose ink otherwise floods the shadows
  const hist = new Uint32Array(256)
  for (let i = 0; i < n; i += 3) if (d[i * 4 + 3] > 20) hist[Math.min(255, L[i] * 255 | 0)]++
  let total = 0
  for (const v of hist) total += v
  let lo = 0, hi = 255
  for (let acc = 0; lo < 255 && (acc += hist[lo]) < total * 0.02;) lo++
  for (let acc = 0; hi > 0 && (acc += hist[hi]) < total * 0.02;) hi--
  if (hi - lo > 20) {
    const a = lo / 255, span = (hi - lo) / 255
    const gamma = kind === 'engraving' || kind === 'halftone' ? 0.8 : 0.92
    for (let i = 0; i < n; i++) {
      L[i] = Math.pow(Math.min(1, Math.max(0, (L[i] - a) / span)), gamma)
      low[i] = Math.pow(Math.min(1, Math.max(0, (low[i] - a) / span)), gamma)
    }
  }
  const ink = rgba(pal.ink, pal), paper = paperOf(pal), acc = rgba(pal.accent, pal)
  const r = rng(seed * 131 + w)
  const out = x.createImageData(w, h)
  const o = out.data
  const P = Math.max(4, Math.round(Math.max(w, h) / 300)) // line / dot period, px of the picture
  for (let y = 0; y < h; y++) {
    for (let xx = 0; xx < w; xx++) {
      const i = y * w + xx, j = i * 4
      // local contrast: details of faces and objects survive the flattening of the treatments
      const l = Math.min(1, Math.max(0, L[i] + (L[i] - low[i]) * 0.9))
      let cr, cg, cb
      if (kind === 'archival') {
        // faded print: lifted blacks, softened highlights, toned from the ink to the paper; a little colour stays
        const v = 0.08 + 0.84 * scurve(l, 0.6)
        const keep = 0.14
        cr = (ink[0] + (paper[0] - ink[0]) * v) * (1 - keep) + d[j] * keep
        cg = (ink[1] + (paper[1] - ink[1]) * v) * (1 - keep) + d[j + 1] * keep
        cb = (ink[2] + (paper[2] - ink[2]) * v) * (1 - keep) + d[j + 2] * keep
      } else if (kind === 'mono') {
        const v = scurve(l, 0.5) * 255
        cr = cg = cb = v
      } else if (kind === 'duotone') {
        // ink → accent → paper
        const v = scurve(l, 0.5)
        const [a, b, t] = v < 0.5 ? [ink, acc, v * 2] : [acc, paper, (v - 0.5) * 2]
        cr = a[0] + (b[0] - a[0]) * t; cg = a[1] + (b[1] - a[1]) * t; cb = a[2] + (b[2] - a[2]) * t
      } else {
        // engraving: wavy parallel lines whose thickness follows the darkness, a cross-hatch in the shadows;
        // halftone: a 45° dot screen
        const dark = Math.pow(1 - scurve(l, 0.7), 1.1)
        let cover
        if (kind === 'engraving') {
          const v = y + Math.sin(xx / 41 + y / 97) * P * 0.9 + Math.sin(xx / 13.7) * 0.6
          const f = Math.abs(((v / P) % 1 + 1) % 1 - 0.5) // 0 at the line's centre, 0.5 between lines
          cover = smooth(-0.06, 0.06, dark * 0.5 - f)
          if (dark > 0.55) {
            const v2 = (xx + y) / 1.4142
            const f2 = Math.abs(((v2 / P) % 1 + 1) % 1 - 0.5)
            cover = Math.max(cover, smooth(-0.06, 0.06, (dark - 0.55) * 0.9 - f2))
          }
        } else {
          const u = (xx + y) / 1.4142 / (P * 1.2), vv = (xx - y) / 1.4142 / (P * 1.2)
          const fu = u - Math.floor(u) - 0.5, fv = vv - Math.floor(vv) - 0.5
          const dist = Math.sqrt(fu * fu + fv * fv)
          cover = smooth(-0.05, 0.05, Math.sqrt(dark) * 0.62 - dist)
        }
        cr = paper[0] + (ink[0] - paper[0]) * cover
        cg = paper[1] + (ink[1] - paper[1]) * cover
        cb = paper[2] + (ink[2] - paper[2]) * cover
      }
      if (kind === 'archival' || kind === 'mono') {
        // the grain of an old print and its worn, lighter edges
        const g = (r() - 0.5) * 16
        const ex = Math.min(xx, w - 1 - xx) / w, ey = Math.min(y, h - 1 - y) / h
        const wear = 1 - smooth(0, 0.07, Math.min(ex, ey))
        cr += g + (paper[0] - cr) * wear * 0.35; cg += g + (paper[1] - cg) * wear * 0.35; cb += g + (paper[2] - cb) * wear * 0.35
      }
      o[j] = cr; o[j + 1] = cg; o[j + 2] = cb; o[j + 3] = d[j + 3]
    }
  }
  x.putImageData(out, 0, 0)
  if (kind === 'archival') blotches(x, w, h, ink, seed)
  return c
}

/** The paper of the prints: the style's panel warmed toward its background. */
function paperOf(pal) {
  const p = rgba(pal.panel, pal), b = rgba(pal.bg, pal)
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
  const base = lum(p) > 140 ? p : lum(b) > 140 ? b : [236, 228, 210, 1]
  return [base[0] * 0.97, base[1] * 0.95, base[2] * 0.9, 1]
}

/** Local mean luminance: the picture scaled down to ~1/24 and back up (smooth). */
function lowpass(c, w, h) {
  const sw = Math.max(2, Math.round(w / 24)), sh = Math.max(2, Math.round(h / 24))
  const small = createCanvas(sw, sh), sx = small.getContext('2d')
  sx.imageSmoothingQuality = 'high'
  sx.drawImage(c, 0, 0, sw, sh)
  const big = createCanvas(w, h), bx = big.getContext('2d')
  bx.imageSmoothingQuality = 'high'
  bx.drawImage(small, 0, 0, w, h)
  const d = bx.getImageData(0, 0, w, h).data
  const out = new Float32Array(w * h)
  for (let i = 0; i < out.length; i++) out[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255
  return out
}

/** Foxing and stains of an old print, only where the picture is (its transparency is kept). */
function blotches(x, w, h, ink, seed) {
  const r = rng(seed * 17 + 3)
  x.save()
  x.globalCompositeOperation = 'source-atop'
  for (let i = 0; i < 9; i++) {
    const cx = r() * w, cy = r() * h, rad = (0.02 + r() * 0.08) * Math.max(w, h)
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad)
    g.addColorStop(0, `rgba(${ink[0] * 0.6 + 80 | 0},${ink[1] * 0.5 + 50 | 0},${ink[2] * 0.3 + 20 | 0},${0.05 + r() * 0.07})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
  }
  x.restore()
}
