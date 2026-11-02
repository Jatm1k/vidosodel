// Builds the data files of the renderer from npm packages (run once by a developer: `npm run build-data`):
//   data/icons.json – Lucide icons (ISC) as one SVG path string per icon, 24×24 box;
//   data/world.json – Natural Earth 1:50m countries (public domain, via world-atlas) in Web Mercator
//                     unit coordinates, quantised, with ISO codes and English/Russian names.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const here = (p) => new URL(p, import.meta.url)

// ------------------------------------------------------------------ icons
const n = (v) => +(+v).toFixed(2)
function nodeToPath([tag, a]) {
  switch (tag) {
    // every element is its own path: a leading relative «m» would be read relative to the previous element
    // («m12 5 7 7-7 7» → «M12 5l7 7-7 7»: the first pair is the start, the pairs after it stay relative lines)
    case 'path': return a.d.replace(/^\s*m\s*(-?[\d.]+(?:e-?\d+)?)[\s,]*(-?[\d.]+(?:e-?\d+)?)(\s*,?\s*)(?=[-\d.])?/,
      (_, x, y, sep, offset, str) => `M${x} ${y}` + (/^[\s,]*[-\d.]/.test(str.slice(_.length - sep.length)) ? 'l' : ''))
    case 'circle': { const cx = n(a.cx), cy = n(a.cy), r = n(a.r)
      return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z` }
    case 'ellipse': { const cx = n(a.cx), cy = n(a.cy), rx = n(a.rx), ry = n(a.ry)
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z` }
    case 'line': return `M${n(a.x1)} ${n(a.y1)}L${n(a.x2)} ${n(a.y2)}`
    case 'polyline': case 'polygon': {
      const pts = a.points.trim().split(/[\s,]+/).map(Number)
      let d = `M${pts[0]} ${pts[1]}`
      for (let i = 2; i < pts.length; i += 2) d += `L${pts[i]} ${pts[i + 1]}`
      return tag === 'polygon' ? d + 'Z' : d }
    case 'rect': {
      const x = n(a.x || 0), y = n(a.y || 0), w = n(a.width), h = n(a.height)
      const r = Math.min(n(a.rx || a.ry || 0), w / 2, h / 2)
      if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`
      return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
        `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z` }
    default: return ''
  }
}
const nodes = JSON.parse(readFileSync(require.resolve('lucide-static/icon-nodes.json'), 'utf8'))
const icons = {}
for (const [name, list] of Object.entries(nodes)) icons[name] = list.map(nodeToPath).filter(Boolean).join('')
writeFileSync(here('../data/icons.json'), JSON.stringify(icons))
console.log('icons:', Object.keys(icons).length)

// ------------------------------------------------------------------ world
const countries = require('i18n-iso-countries')
countries.registerLocale(require('i18n-iso-countries/langs/en.json'))
countries.registerLocale(require('i18n-iso-countries/langs/ru.json'))
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'))
const geo = feature(topo, topo.objects.countries)
const Q = 65535
const merc = (lon, lat) => {
  const la = Math.max(-85, Math.min(85, lat)) * Math.PI / 180
  return [(lon + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + la / 2)) / Math.PI) / 2]
}
// Kosovo, Northern Cyprus, Somaliland… have no numeric ISO code in the atlas.
const EXTRA = { 'Kosovo': 'XKX', 'N. Cyprus': 'CYN', 'Somaliland': 'SOL', 'Siachen Glacier': 'SIA' }
const world = {}
let points = 0
for (const f of geo.features) {
  const iso = (f.id && countries.numericToAlpha3(f.id)) || EXTRA[f.properties.name]
  if (!iso) { console.log('skip', f.id, f.properties.name); continue }
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  const rings = []
  let best = null
  for (const poly of polys) {
    for (const [ri, ring] of poly.entries()) {
      const out = []
      let px = -1, py = -1
      for (const [lon, lat] of ring) {
        const [x, y] = merc(lon, lat)
        const qx = Math.round(x * Q), qy = Math.round(y * Q)
        if (Math.abs(qx - px) + Math.abs(qy - py) < 3) continue // ~0.015° – invisible even zoomed in
        out.push(qx, qy); px = qx; py = qy
      }
      if (out.length < 6) continue
      // a ring across the antimeridian (Chukotka, Fiji): move its western points one world east
      let jumps = false
      for (let i = 2; i < out.length; i += 2) if (Math.abs(out[i] - out[i - 2]) > Q / 2) { jumps = true; break }
      if (jumps) for (let i = 0; i < out.length; i += 2) if (out[i] < Q / 2) out[i] += Q
      rings.push(out)
      points += out.length / 2
      if (ri === 0) { // outer ring: the label goes to the centroid of the largest one
        let a = 0, cx = 0, cy = 0
        for (let i = 0; i < out.length; i += 2) {
          const j = (i + 2) % out.length
          const k = out[i] * out[j + 1] - out[j] * out[i + 1]
          a += k; cx += (out[i] + out[j]) * k; cy += (out[i + 1] + out[j + 1]) * k
        }
        if (a && (!best || Math.abs(a) > best.a)) best = { a: Math.abs(a), c: [Math.round(cx / (3 * a)), Math.round(cy / (3 * a))] }
      }
    }
  }
  if (!rings.length) continue
  world[iso] = { en: countries.getName(iso, 'en') || f.properties.name, ru: countries.getName(iso, 'ru') || '',
                 c: best ? best.c : [rings[0][0], rings[0][1]], p: rings }
}
writeFileSync(here('../data/world.json'), JSON.stringify(world))
console.log('countries:', Object.keys(world).length, 'points:', points)
