// Backgrounds of full-screen scenes. Static textures (paper, noise, nebula) are drawn once per size and
// palette and cached; patterns (grids, stars, scanlines) move a little every frame and follow the camera
// at a slower rate, so the background has depth.
import { createCanvas } from '@napi-rs/canvas'
import { rng, noise1, rgba, css, mix, withAlpha, luma } from './core.mjs'

const VW = 1920, VH = 1080
const cache = new Map()

function texture(key, scale, draw) {
  const k = `${key}@${scale.toFixed(3)}`
  let c = cache.get(k)
  if (!c) {
    c = createCanvas(Math.ceil(VW * scale), Math.ceil(VH * scale))
    const x = c.getContext('2d')
    x.scale(scale, scale)
    draw(x)
    cache.set(k, c)
    if (cache.size > 24) cache.delete(cache.keys().next().value)
  }
  return c
}

function noiseTexture(ctx, seed, amount, dark) {
  // speckles and soft blotches: cheap «paper» without per-pixel work
  const r = rng(seed)
  const n = Math.round(9000 * amount)
  for (let i = 0; i < n; i++) {
    const v = r()
    ctx.fillStyle = dark ? `rgba(255,255,255,${0.025 + v * 0.04})` : `rgba(0,0,0,${0.02 + v * 0.05})`
    const s = 0.8 + r() * 1.8
    ctx.fillRect(r() * VW, r() * VH, s, s)
  }
  for (let i = 0; i < 26 * amount; i++) {
    const x = r() * VW, y = r() * VH, rad = 80 + r() * 320
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    const a = 0.03 + r() * 0.04
    g.addColorStop(0, dark ? `rgba(255,255,255,${a * 0.5})` : `rgba(90,60,20,${a})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
}

function fibers(ctx, seed, ink) {
  const r = rng(seed + 11)
  ctx.lineWidth = 0.7
  for (let i = 0; i < 160; i++) {
    const x = r() * VW, y = r() * VH, a = r() * Math.PI, l = 6 + r() * 22
    ctx.strokeStyle = css(withAlpha(ink, 0.05 + r() * 0.05))
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke()
  }
}

function vignette(ctx, strength, light = 0, lightColor = [255, 255, 255, 1]) {
  if (light) {
    const g = ctx.createRadialGradient(VW * 0.5, VH * 0.42, 0, VW * 0.5, VH * 0.42, VW * 0.55)
    g.addColorStop(0, css(withAlpha(lightColor, light)))
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH)
  }
  const g = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.72)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${strength})`)
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH)
}

/** ``spec``: a kind name, a colour, or ``{kind, ...options}`` over the style's background. */
export function resolveBg(style, spec) {
  const base = { ...style.bg }
  if (!spec) return base
  if (typeof spec === 'string') {
    if (KINDS.has(spec)) return { ...base, kind: spec }
    return { kind: 'solid', color: spec }
  }
  return spec.kind && spec.kind !== base.kind ? { ...spec } : { ...base, ...spec }
}
const KINDS = new Set(['solid', 'grad', 'paper', 'grid', 'blueprint', 'notebook', 'dots', 'blobs', 'vignette', 'stars',
                       'scan', 'rays', 'none', 'image', 'desk'])

/** The desk under the archive's papers: a deep warm tone of the style's ink (or of a dark style's background). */
export function deskColor(pal) {
  const ink = rgba('ink', pal), bg = rgba('bg', pal)
  const base = luma(ink) < 0.35 ? mix(ink, [92, 64, 40, 1], 0.35) : mix(bg, [58, 42, 28, 1], 0.45)
  return [base[0], base[1], base[2], 1]
}

/** Hex of a scene background whose lightness differs from the style's own (then free text needs other colours),
 *  or null. */
export function surfaceOf(style, bg) {
  let c = null
  if (bg.kind === 'desk') c = bg.color ? rgba(bg.color, style.palette) : deskColor(style.palette)
  else if (bg.color && bg.kind !== 'image') c = rgba(bg.color, style.palette)
  if (!c) return null
  const own = rgba('bg', style.palette)
  if ((luma(c) < 0.45) === (luma(own) < 0.45)) return null
  return '#' + [c[0], c[1], c[2]].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

/** Long soft grain of wood or leather; seamless (every stroke wraps around the tile), so it can follow the camera. */
function deskGrain(ctx, seed) {
  const r = rng(seed + 21)
  ctx.lineCap = 'round'
  for (let i = 0; i < 260; i++) {
    const y0 = r() * VH, amp = 4 + r() * 18, len = VW * (0.3 + r() * 0.9), x0 = r() * VW
    const light = r() < 0.5
    ctx.strokeStyle = light ? `rgba(255,235,200,${0.012 + r() * 0.03})` : `rgba(0,0,0,${0.03 + r() * 0.06})`
    ctx.lineWidth = 0.8 + r() * 3.5
    const ph = r() * 6
    for (const dx of [-VW, 0]) for (const dy of [-VH, 0, VH]) {
      if (x0 + dx + len < 0 || x0 + dx > VW) continue
      ctx.beginPath(); ctx.moveTo(x0 + dx, y0 + dy)
      for (let x = 0; x <= len; x += 40) ctx.lineTo(x0 + dx + x, y0 + dy + Math.sin(x / 260 + ph) * amp)
      ctx.stroke()
    }
  }
  const rs = rng(seed + 5)
  for (let i = 0; i < 4500; i++) { ctx.fillStyle = `rgba(255,255,255,${0.02 + rs() * 0.035})`; ctx.fillRect(rs() * VW, rs() * VH, 1.2, 1.2) }
}
/** The lamp light over the desk and its deep corners: fixed to the frame. */
function deskLight(ctx) {
  const g = ctx.createRadialGradient(VW * 0.42, VH * 0.36, 0, VW * 0.42, VH * 0.36, VW * 0.62)
  g.addColorStop(0, 'rgba(255,214,160,0.16)'); g.addColorStop(0.6, 'rgba(255,214,160,0.04)'); g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH)
  vignette(ctx, 0.62)
}

export function drawBackground(ctx, env, spec, t, seed, cam) {
  const bg = resolveBg(env.style, spec)
  const pal = env.pal
  const scale = ctx.getTransform().a
  const base = rgba(bg.color || 'bg', pal, 'bg')
  const base2 = rgba(bg.color2 || 'bg2', pal, 'bg2')
  const ink = rgba('ink', pal)
  const dark = luma(base) < 0.45
  // camera parallax: patterns move at a third of the camera speed
  const px = cam ? -(cam.x - VW / 2) * 0.3 : 0, py = cam ? -(cam.y - VH / 2) * 0.3 : 0
  if (bg.kind === 'none') return
  if (bg.kind === 'image' && env.image(bg.src)) {
    const img = env.picture(bg.src, bg.treat)
    const k = Math.max(VW / img.width, VH / img.height) * (1.06 + 0.04 * Math.sin(t * 0.2))
    ctx.drawImage(img, VW / 2 - img.width * k / 2 + px * 0.2, VH / 2 - img.height * k / 2 + py * 0.2, img.width * k, img.height * k)
    ctx.fillStyle = css(withAlpha(base, bg.dim ?? 0.55)); ctx.fillRect(0, 0, VW, VH)
    return
  }
  ctx.fillStyle = css(base)
  ctx.fillRect(0, 0, VW, VH)
  const key = `${bg.kind}:${css(base)}:${css(base2)}:${seed % 7}`

  switch (bg.kind) {
    case 'grad': {
      const a = ((bg.angle ?? 120) * Math.PI) / 180
      const dx = Math.cos(a) * VW * 0.6, dy = Math.sin(a) * VH * 0.6
      const g = ctx.createLinearGradient(VW / 2 - dx, VH / 2 - dy, VW / 2 + dx, VH / 2 + dy)
      g.addColorStop(0, css(rgba(bg.from || 'bg2', pal))); g.addColorStop(1, css(rgba(bg.to || 'bg', pal)))
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH)
      if (bg.dots) dotGrid(ctx, withAlpha(ink, 0.07), 36, px, py)
      break
    }
    case 'desk': {
      const c = bg.color ? rgba(bg.color, env.style.palette) : deskColor(env.style.palette)
      ctx.fillStyle = css(c); ctx.fillRect(0, 0, VW, VH)
      // the grain follows the camera (tiled), the light stays where the lamp is
      const grain = texture(`deskgrain:${seed % 5}`, scale, (x) => deskGrain(x, seed % 5))
      const ox = ((px % VW) + VW) % VW, oy = ((py % VH) + VH) % VH
      for (const dx of [ox - VW, ox]) for (const dy of [oy - VH, oy]) ctx.drawImage(grain, dx, dy, VW, VH)
      ctx.drawImage(texture('desklight', scale, deskLight), 0, 0, VW, VH)
      break
    }
    case 'paper': {
      const darkPaper = bg.dark || dark
      ctx.drawImage(texture(key + ':paper', scale, (x) => {
        noiseTexture(x, seed, bg.grain ?? 0.6, darkPaper)
        if (bg.fibers) fibers(x, seed, darkPaper ? [255, 255, 255, 1] : ink)
        if (bg.aged) vignette(x, 0.28, 0, ink)
      }), 0, 0, VW, VH)
      if (bg.grid) lineGrid(ctx, withAlpha(ink, 0.06), bg.grid, px, py, 1)
      if (bg.halftone) halftoneCorner(ctx, withAlpha(ink, 0.08), seed)
      break
    }
    case 'grid': {
      lineGrid(ctx, withAlpha(rgba(bg.glow ? 'accent' : 'ink', pal), bg.alpha ?? 0.08), bg.step ?? 100, px + t * 6, py, 1.2)
      if (bg.horizon) horizonGrid(ctx, rgba('accent', pal), t)
      if (bg.glow) vignette(ctx, 0.55, 0.12, rgba('accent2', pal))
      break
    }
    case 'blueprint': {
      const s = bg.step ?? 48
      lineGrid(ctx, withAlpha(ink, (bg.alpha ?? 0.16) * 0.5), s, px, py, 1)
      lineGrid(ctx, withAlpha(ink, bg.alpha ?? 0.16), s * 4, px, py, 1.6)
      vignette(ctx, 0.35)
      break
    }
    case 'notebook': {
      const s = bg.step ?? 42
      lineGrid(ctx, withAlpha(rgba('accent2', pal), bg.alpha ?? 0.18), s, px, py, 1)
      ctx.fillStyle = css(withAlpha(rgba('accent', pal), 0.45))
      ctx.fillRect(150 + px % s, 0, 2.5, VH)
      break
    }
    case 'dots': dotGrid(ctx, withAlpha(ink, bg.alpha ?? 0.12), bg.step ?? 40, px, py); break
    case 'blobs': {
      const cols = (bg.colors || ['accent/22', 'accent2/22', 'accent3/18']).map((c) => rgba(c, pal))
      cols.forEach((c, i) => {
        const x = VW * (0.2 + 0.6 * ((i * 0.37 + 0.13) % 1)) + noise1(t * 0.12, seed + i) * 220 + px * 0.5
        const y = VH * (0.25 + 0.5 * ((i * 0.61 + 0.3) % 1)) + noise1(t * 0.1, seed + i + 9) * 160 + py * 0.5
        const r = VH * (0.45 + 0.15 * i)
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, css(c)); g.addColorStop(1, css(withAlpha(c, 0)))
        ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH)
      })
      if (bg.grain) ctx.drawImage(texture(key + ':grain', scale, (x) => noiseTexture(x, seed, bg.grain, dark)), 0, 0, VW, VH)
      break
    }
    case 'vignette': {
      ctx.drawImage(texture(key + ':vig', scale, (x) => {
        noiseTexture(x, seed, bg.grain ?? 0.4, dark)
        vignette(x, dark ? 0.75 : 0.35, bg.light ?? 0.15, dark ? rgba('accent', pal) : [255, 255, 255, 1])
      }), 0, 0, VW, VH)
      break
    }
    case 'stars': {
      ctx.drawImage(texture(key + ':nebula', scale, (x) => {
        const r = rng(seed)
        const g0 = x.createLinearGradient(0, 0, VW, VH)
        g0.addColorStop(0, css(base2)); g0.addColorStop(1, css(base))
        x.fillStyle = g0; x.fillRect(0, 0, VW, VH)
        if (bg.nebula !== false) for (let i = 0; i < 5; i++) {
          const c = rgba(['accent', 'accent2', 'accent'][i % 3], pal)
          const cx = r() * VW, cy = r() * VH, rad = 300 + r() * 500
          const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad)
          g.addColorStop(0, css(withAlpha(c, 0.13))); g.addColorStop(1, css(withAlpha(c, 0)))
          x.fillStyle = g; x.fillRect(0, 0, VW, VH)
        }
      }), 0, 0, VW, VH)
      const r = rng(seed + 5)
      for (let i = 0; i < 260; i++) {
        const depth = 0.2 + r() * 0.8
        const x = ((r() * VW + px * depth + t * 4 * depth) % VW + VW) % VW
        const y = ((r() * VH + py * depth) % VH + VH) % VH
        const tw = 0.55 + 0.45 * Math.sin(t * (0.8 + r() * 2) + r() * 6)
        ctx.fillStyle = `rgba(255,255,255,${(0.25 + depth * 0.6) * tw})`
        const s = depth * 2.4
        ctx.fillRect(x, y, s, s)
      }
      break
    }
    case 'scan': {
      if (bg.glow) vignette(ctx, 0.7, 0.1, rgba('ink', pal))
      ctx.fillStyle = css(withAlpha([0, 0, 0, 1], bg.alpha ?? 0.18))
      const off = (t * 40) % 6
      for (let y = -6 + off; y < VH; y += 6) ctx.fillRect(0, y, VW, 2)
      break
    }
    case 'rays': {
      ctx.save()
      ctx.translate(VW / 2 + px * 0.3, VH * 0.62 + py * 0.3)
      ctx.rotate(t * 0.03)
      ctx.fillStyle = css(withAlpha(rgba('accent', pal), bg.alpha ?? 0.12))
      for (let i = 0; i < 18; i++) {
        ctx.beginPath(); ctx.moveTo(0, 0)
        ctx.arc(0, 0, VW * 1.3, (i / 18) * Math.PI * 2, (i / 18 + 1 / 36) * Math.PI * 2)
        ctx.closePath(); ctx.fill()
      }
      ctx.restore()
      if (bg.grain) ctx.drawImage(texture(key + ':grain', scale, (x) => noiseTexture(x, seed, bg.grain, dark)), 0, 0, VW, VH)
      break
    }
    case 'solid':
    default:
      if (bg.stripes) {
        ctx.save(); ctx.fillStyle = css(withAlpha(mix(base, base2, 1), 0.18))
        ctx.translate(px * 0.5 + (t * 20) % 120, 0)
        for (let x = -VW; x < VW * 2; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 60 - VH * 0.4, VH); ctx.lineTo(x - VH * 0.4, VH); ctx.fill() }
        ctx.restore()
      }
      if (bg.grain) ctx.drawImage(texture(key + ':grain', scale, (x) => noiseTexture(x, seed, bg.grain, dark)), 0, 0, VW, VH)
  }
}

function lineGrid(ctx, c, step, ox, oy, lw) {
  ctx.strokeStyle = css(c); ctx.lineWidth = lw
  ctx.beginPath()
  for (let x = ((ox % step) + step) % step; x < VW; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, VH) }
  for (let y = ((oy % step) + step) % step; y < VH; y += step) { ctx.moveTo(0, y); ctx.lineTo(VW, y) }
  ctx.stroke()
}

function dotGrid(ctx, c, step, ox, oy) {
  ctx.fillStyle = css(c)
  for (let x = ((ox % step) + step) % step; x < VW; x += step)
    for (let y = ((oy % step) + step) % step; y < VH; y += step) ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
}

function horizonGrid(ctx, c, t) {
  const hy = VH * 0.68
  ctx.save()
  ctx.strokeStyle = css(withAlpha(c, 0.35)); ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = -14; i <= 14; i++) { ctx.moveTo(VW / 2 + i * 40, hy); ctx.lineTo(VW / 2 + i * 260, VH) }
  const off = (t * 0.35) % 1
  for (let k = 0; k < 9; k++) {
    const u = (k + off) / 9
    const y = hy + (VH - hy) * u * u
    ctx.moveTo(0, y); ctx.lineTo(VW, y)
  }
  ctx.stroke()
  const g = ctx.createLinearGradient(0, hy - 120, 0, hy + 40)
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, css(withAlpha(c, 0.18)))
  ctx.fillStyle = g; ctx.fillRect(0, hy - 120, VW, 160)
  ctx.restore()
}

function halftoneCorner(ctx, c, seed) {
  ctx.fillStyle = css(c)
  const r = rng(seed)
  const cx = r() < 0.5 ? VW : 0, cy = VH
  for (let x = 0; x < VW; x += 18) for (let y = VH * 0.4; y < VH; y += 18) {
    const d = Math.hypot(x - cx, y - cy) / (VW * 0.6)
    const rad = Math.max(0, 6 * (1 - d))
    if (rad > 0.4) { ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill() }
  }
}
