// Colour discipline of a style: whatever palette a channel ends up with (a base style or Claude's overrides),
// contrast is fixed in OKLCH (hue kept, lightness moved) and the derived roles every element uses are computed:
// soft tints of the accents for highlights and plates, readable text on an accent, a shadow tinted by the bg.
import { parseHex } from './core.mjs'

// ------------------------------------------------------------------ colour math (sRGB ↔ OKLab)
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const toSrgb = (c) => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, v)) * 255) }

function rgbToOklch([r, g, b]) {
  const [R, G, B] = [toLin(r), toLin(g), toLin(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [L, Math.hypot(a, bb), Math.atan2(bb, a)]
}
function oklchToRgb([L, C, h]) {
  const a = C * Math.cos(h), b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
          toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
          toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)]
}
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
const rgbOf = (h) => parseHex(h).slice(0, 3)

function luminance([r, g, b]) {
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b)
}
export function contrast(a, b) {
  const la = luminance(rgbOf(a)), lb = luminance(rgbOf(b))
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Moves the lightness of ``color`` (keeping hue, easing chroma) until it reaches ``ratio`` against ``bg``. */
function ensure(color, bg, ratio) {
  if (contrast(color, bg) >= ratio) return color
  const [L, C, h] = rgbToOklch(rgbOf(color))
  const darkBg = luminance(rgbOf(bg)) < 0.25
  for (let k = 1; k <= 40; k++) {
    const L2 = darkBg ? Math.min(0.98, L + k * 0.015) : Math.max(0.05, L - k * 0.015)
    const c = hex(oklchToRgb([L2, C * (1 - k * 0.006), h]))
    if (contrast(c, bg) >= ratio) return c
  }
  return darkBg ? '#ffffff' : '#000000'
}
/** ``a`` mixed toward ``b`` by ``t`` in OKLab (perceptually even tints). */
function mixOk(a, b, t) {
  const [L1, C1, h1] = rgbToOklch(rgbOf(a)), [L2, C2, h2] = rgbToOklch(rgbOf(b))
  const x = (1 - t) * C1 * Math.cos(h1) + t * C2 * Math.cos(h2), y = (1 - t) * C1 * Math.sin(h1) + t * C2 * Math.sin(h2)
  return hex(oklchToRgb([(1 - t) * L1 + t * L2, Math.hypot(x, y), Math.atan2(y, x)]))
}

const solid = (v, fallback) => (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v.trim()) ? v.trim().slice(0, 7) : fallback)

/** The palette with fixed contrast and the derived roles. */
export function harmonize(p) {
  const bg = solid(p.bg, '#ffffff')
  const out = { ...p, bg }
  out.bg2 = solid(p.bg2, mixOk(bg, '#808080', 0.08))
  out.ink = ensure(solid(p.ink, '#111111'), bg, 9)
  out.muted = ensure(solid(p.muted, mixOk(out.ink, bg, 0.45)), bg, 3.6)
  out.accent = ensure(solid(p.accent, '#e5484d'), bg, 3.1)
  out.accent2 = ensure(solid(p.accent2, '#2f7fd8'), bg, 2.6)
  out.accent3 = ensure(solid(p.accent3, '#e5a50a'), bg, 2.2)
  out.good = ensure(solid(p.good, '#2f9e6b'), bg, 2.6)
  out.bad = ensure(solid(p.bad, out.accent), bg, 2.6)
  out.panel = solid(p.panel, mixOk(bg, '#ffffff', 0.6))
  out.line = solid(p.line, out.ink)
  // derived roles
  out.accentSoft = mixOk(out.accent, bg, 0.8)
  out.accentHl = mixOk(out.accent, bg, 0.58) // highlighter behind ink text
  out.accent2Soft = mixOk(out.accent2, bg, 0.8)
  out.accent3Soft = mixOk(out.accent3, bg, 0.75)
  out.onAccent = contrast('#ffffff', out.accent) >= contrast('#111111', out.accent) ? '#ffffff' : '#111111'
  out.panelInk = ensure(out.ink, out.panel, 9)
  out.hair = mixOk(out.ink, bg, 0.86) // hairlines, axis, grid
  out.shadow = mixOk(bg, '#000000', luminance(rgbOf(bg)) < 0.25 ? 0.7 : 0.55)
  return out
}
