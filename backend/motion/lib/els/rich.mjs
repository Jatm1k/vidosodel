// Expressive elements: photo (the video's own pictures in a frame), stat (a number card), progress, stamp, scribble.
import { clamp, ease, rng, formatNumber, css, withAlpha, lerp } from '../core.mjs'
import { fontCss, fontSpec, layoutText } from '../fonts.mjs'
import { panel, panelText, drawText, rr } from './util.mjs'
import { drawLabel } from './text.mjs'
import { iconPath } from './shapes.mjs'
import { Path2D, createCanvas } from '@napi-rs/canvas'
import { flatten, tracePartial, pointAt } from '../paths.mjs'

const lay = (ctx, env, role, text, size, maxw) => {
  const f = fontSpec(env.style, role)
  return layoutText(ctx, text, { font: f, size, maxw, upper: f.upper, ls: f.ls ?? 0, lh: 1.12 })
}

// ------------------------------------------------------------------ photo
export const photo = {
  hasText: true,
  prep(el, env, ctx) {
    const img = env.image(el.src)
    if (!img && !/^img\d+$/.test(String(el.src))) throw new Error(`photo: src «${el.src}» — нужно img<номер сцены>`)
    const w = +(el.w ?? 760)
    const h = +(el.h ?? w * 9 / 16)
    const frame = el.frame ?? 'polaroid'
    const border = frame === 'polaroid' ? Math.round(w * 0.035) : frame === 'clean' ? Math.round(w * 0.018) : 0
    const bottom = frame === 'polaroid' ? Math.round(w * 0.12) : border
    const caption = el.caption ? lay(ctx, env, frame === 'polaroid' ? 'hand' : 'label', el.caption, Math.max(30, +(el.captionSize ?? w * 0.05)), w) : null
    const capH = caption && frame !== 'polaroid' ? caption.h + 18 : 0
    return { img, w: w + border * 2, h: h + border + bottom + capH, iw: w, ih: h, border, bottom, caption, frame }
  },
  draw(ctx, el, st, k, env) {
    const { img, iw, ih, border, bottom, caption, frame } = st
    if (!img) return // the picture was never drawn: the photo is left out
    // lands with a small rotation settling, like a print dropped on a desk
    const tilt = +(el.tilt ?? 0) * Math.PI / 180
    const p = ease('expo-out', k.local / 0.8)
    ctx.translate(st.w / 2, st.h / 2); ctx.rotate(tilt + (1 - p) * 0.08); ctx.translate(-st.w / 2, -st.h / 2)
    if (frame !== 'none') {
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18
      ctx.fillStyle = frame === 'polaroid' ? '#fbfaf6' : env.color('panel')
      rr(ctx, 0, 0, st.w, st.h - (frame !== 'polaroid' && caption ? caption.h + 18 : 0), frame === 'clean' ? 10 : 2)
      ctx.fill(); ctx.restore()
    }
    ctx.save()
    rr(ctx, border, border, iw, ih, frame === 'none' ? +(el.r ?? 14) : 2); ctx.clip()
    const fit = Math.max(iw / img.width, ih / img.height)
    const z = 1 + +(el.kb ?? 0.07) * clamp(k.local / Math.max(1, k.end - (k.t - k.local)))
    const fx = +(el.fx ?? 0.5), fy = +(el.fy ?? 0.5) // focus point of the zoom
    const dw = img.width * fit * z, dh = img.height * fit * z
    ctx.drawImage(img, border + (iw - dw) * fx, border + (ih - dh) * fy, dw, dh)
    if (el.tint) { ctx.fillStyle = env.color(el.tint); ctx.fillRect(border, border, iw, ih) }
    ctx.restore()
    if (frame === 'tape') {
      ctx.fillStyle = 'rgba(245,235,200,0.75)'
      for (const [x, a] of [[st.w * 0.12, -0.5], [st.w * 0.88, 0.45]]) {
        ctx.save(); ctx.translate(x, 6); ctx.rotate(a); ctx.fillRect(-60, -18, 120, 36); ctx.restore()
      }
    }
    if (caption) {
      ctx.save()
      ctx.globalAlpha *= clamp((k.local - 0.4) / 0.5)
      const cy = frame === 'polaroid' ? border + ih + (bottom - caption.h) / 2 : st.h - caption.h
      ctx.translate((st.w - caption.w) / 2, cy)
      drawText(ctx, caption, env, { color: frame === 'polaroid' ? '#2a2a2a' : env.color('ink'), acc: env.color('accent'), align: 'c',
                                    boxW: caption.w, mode: 'none', local: 99, styleKey: env.style.name })
      ctx.restore()
    }
  },
}

// ------------------------------------------------------------------ stat (number card)
export const stat = {
  hasText: true,
  own: ['count'],
  defaultIn: 'count',
  prep(el, env, ctx) {
    const w = +(el.w ?? 520)
    const pad = Math.round(w * 0.09)
    const vf = fontSpec(env.style, 'display')
    const vsize = +(el.size ?? Math.min(170, w * 0.3))
    const dec = +(el.dec ?? (String(el.value).includes('.') ? String(el.value).split('.')[1].length : 0))
    const final = `${el.prefix ?? ''}${formatNumber(+el.value, dec, env.lang)}${el.suffix ?? ''}`
    ctx.font = fontCss(vf, vsize)
    let vs = vsize
    const fw = ctx.measureText(final).width
    if (fw > w - pad * 2) vs = vsize * (w - pad * 2) / fw
    ctx.font = fontCss(vf, vs)
    const asc = ctx.measureText('0').actualBoundingBoxAscent || vs * 0.72
    const label = el.label ? lay(ctx, env, 'body', el.label, Math.max(30, +(el.labelSize ?? 38)), w - pad * 2) : null
    const icon = el.icon ? Math.round(vs * 0.42) : 0
    const delta = el.delta ? lay(ctx, env, 'label', String(el.delta), 32, w) : null
    const h = pad * 2 + (icon ? icon + 22 : 0) + asc + (label ? 22 + label.h : 0) + (delta ? 18 + delta.h : 0)
    return { w, h: +(el.h ?? h), pad, vf, vs, dec, asc, label, icon, delta, final }
  },
  inDur(el) { return +(el.count ?? 1.5) },
  draw(ctx, el, st, k, env, node) {
    const { w, h, pad, vf, vs, dec, asc, label, icon, delta } = st
    const plate = el.plate !== false
    if (plate) panel(ctx, env, 0, 0, w, h, el.fill ? { fill: el.fill } : {}, node.seed)
    if (plate && el.bar !== false) { ctx.fillStyle = env.color(el.color ?? 'accent'); rr(ctx, 0, 0, w, 8, 4); ctx.fill() }
    const align = el.align ?? 'l'
    const ax = (bw) => (align === 'c' ? (w - bw) / 2 : pad)
    let y = pad
    if (icon) {
      const d = iconPath(el.icon)
      if (d) {
        ctx.save(); ctx.translate(ax(icon), y); ctx.scale(icon / 24, icon / 24)
        ctx.strokeStyle = env.color(el.color ?? 'accent'); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        const ip = clamp(k.local / 0.7)
        if (ip < 1) { ctx.beginPath(); tracePartial(ctx, flatten(d, 8), 0, ip); ctx.stroke() } else ctx.stroke(new Path2D(d))
        ctx.restore()
      }
      y += icon + 22
    }
    const p = k.inName === 'count' ? ease('expo-out', k.local / +(el.count ?? 1.5)) : 1
    const from = +(el.from ?? 0)
    const s = `${el.prefix ?? ''}${formatNumber(from + (+el.value - from) * p, dec, env.lang)}${el.suffix ?? ''}`
    ctx.font = fontCss(vf, vs)
    ctx.fillStyle = env.color(el.valueColor ?? (plate ? 'panelInk' : 'ink'))
    const mw = ctx.measureText(st.final).width
    ctx.fillText(s, ax(mw), y + asc)
    y += asc
    if (label) {
      y += 22
      ctx.save(); ctx.globalAlpha *= clamp((k.local - 0.3) / 0.5); ctx.translate(ax(label.w), y)
      drawText(ctx, label, env, { color: plate ? panelText(env) : env.color('ink'), acc: env.color('accent'), align, boxW: label.w,
                                  mode: 'none', local: 99, styleKey: env.style.name })
      ctx.restore(); y += label.h
    }
    if (delta) {
      y += 18
      const up = !String(el.delta).trim().startsWith('-') && !String(el.delta).trim().startsWith('−')
      ctx.save(); ctx.globalAlpha *= clamp((k.local - 0.8) / 0.4); ctx.translate(ax(delta.w + 40), y)
      ctx.fillStyle = env.color(up ? 'good' : 'bad')
      ctx.beginPath()
      if (up) { ctx.moveTo(0, delta.h * 0.75); ctx.lineTo(14, delta.h * 0.25); ctx.lineTo(28, delta.h * 0.75) } else { ctx.moveTo(0, delta.h * 0.3); ctx.lineTo(14, delta.h * 0.8); ctx.lineTo(28, delta.h * 0.3) }
      ctx.fill(); ctx.translate(40, 0)
      drawLabel(ctx, delta, env, up ? 'good' : 'bad', 'l', delta.w)
      ctx.restore()
    }
  },
}

// ------------------------------------------------------------------ progress bar
export const progress = {
  hasText: true,
  own: ['fill'],
  defaultIn: 'fill',
  prep(el, env, ctx) {
    const w = +(el.w ?? 1100)
    const bh = +(el.thick ?? 34)
    const label = el.label ? lay(ctx, env, 'body', el.label, Math.max(30, +(el.size ?? 42)), w * 0.75) : null
    const vf = fontSpec(env.style, 'display')
    const vsize = Math.max(34, +(el.valueSize ?? 54))
    return { w, bh, label, vf, vsize, h: (label ? Math.max(label.h, vsize) + 20 : vsize + 10) + bh }
  },
  inDur(el) { return +(el.count ?? 1.4) },
  draw(ctx, el, st, k, env) {
    const { w, bh, label, vf, vsize } = st
    const max = +(el.max ?? 100)
    const p = k.inName === 'fill' ? ease('expo-out', k.local / +(el.count ?? 1.4)) : 1
    const v = clamp(+el.value / max) * p
    const top = st.h - bh
    if (label) { ctx.save(); ctx.translate(0, top - 20 - label.h); drawText(ctx, label, env, { color: env.color('ink'), acc: env.color('accent'), align: 'l', boxW: label.w, mode: 'none', local: 99, styleKey: env.style.name }); ctx.restore() }
    ctx.font = fontCss(vf, vsize); ctx.fillStyle = env.color(el.color ?? 'accent'); ctx.textAlign = 'right'
    ctx.fillText(el.text ?? `${formatNumber(+el.value * p, +(el.dec ?? 0), env.lang)}${el.unit ?? '%'}`, w, top - 20)
    ctx.textAlign = 'left'
    ctx.fillStyle = env.color(el.track ?? 'hair'); rr(ctx, 0, top, w, bh, bh / 2); ctx.fill()
    if (v > 0.002) { ctx.fillStyle = env.color(el.color ?? 'accent'); rr(ctx, 0, top, Math.max(bh, w * v), bh, bh / 2); ctx.fill() }
  },
}

// ------------------------------------------------------------------ stamp
export const stamp = {
  hasText: true,
  own: ['slam'],
  defaultIn: 'slam',
  prep(el, env, ctx) {
    const size = Math.max(34, +(el.size ?? 64))
    const t = lay(ctx, env, el.font || 'display', String(el.text ?? '').toUpperCase(), size, +(el.w ?? 1100))
    const pad = size * 0.4
    return { t, pad, w: t.w + pad * 2, h: t.h + pad * 1.4 }
  },
  inDur() { return 0.5 },
  draw(ctx, el, st, k, env, node) {
    const { t, pad, w, h } = st
    const p = ease('expo-out', k.local / 0.35)
    const s = lerp(1.9, 1, p)
    // the runtime turns the element by its own «rot»; without one a stamp sits a little askew
    ctx.translate(w / 2, h / 2); if (el.rot === undefined) ctx.rotate(-8 * Math.PI / 180); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2)
    ctx.globalAlpha *= clamp(p * 2.5)
    const c = env.color(el.color ?? 'accent')
    ctx.strokeStyle = c; ctx.lineWidth = Math.max(5, t.size * 0.08)
    rr(ctx, 0, 0, w, h, t.size * 0.12); ctx.stroke()
    ctx.lineWidth = Math.max(2, t.size * 0.03)
    rr(ctx, ctx.lineWidth * 3, ctx.lineWidth * 3, w - ctx.lineWidth * 6, h - ctx.lineWidth * 6, t.size * 0.08); ctx.stroke()
    ctx.save(); ctx.translate(pad, pad * 0.7)
    drawText(ctx, t, env, { color: c, acc: c, align: 'c', boxW: t.w, mode: 'none', local: 99, styleKey: env.style.name })
    ctx.restore()
    // worn ink: a few gaps punched out of the stamp
    ctx.globalCompositeOperation = 'destination-out'
    const r = rng(node.seed)
    for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.5})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 1 + r() * 4, 0, Math.PI * 2); ctx.fill() }
    ctx.globalCompositeOperation = 'source-over'
  },
}

// ------------------------------------------------------------------ scribble (hand-drawn mark)
function wobbly(kind, w, h, seed) {
  const r = rng(seed)
  const j = (a) => (r() - 0.5) * a
  if (kind === 'circle') {
    // one smooth hand loop: slightly more than a full turn, the radius drifting a little (no jitter per point)
    const n = 64, turns = 1.1, a0 = -Math.PI * 0.7, drift = 0.04 + r() * 0.04, tilt = j(0.25)
    let d = ''
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = a0 + u * Math.PI * 2 * turns
      const k = 1 + drift * Math.sin(u * Math.PI * 2 + 1) + u * 0.06
      const ex = Math.cos(a) * w * 0.55 * k, ey = Math.sin(a) * h * 0.6 * k
      d += `${i ? 'L' : 'M'}${w / 2 + ex * Math.cos(tilt) - ey * Math.sin(tilt)} ${h / 2 + ex * Math.sin(tilt) + ey * Math.cos(tilt)}`
    }
    return d
  }
  if (kind === 'underline') return `M${j(10)} ${h * 0.5}Q${w * 0.5} ${h * 0.5 + 14 + j(10)} ${w + j(10)} ${h * 0.5 - 6}`
  if (kind === 'double') return `M0 ${h * 0.35}Q${w / 2} ${h * 0.35 + 10} ${w} ${h * 0.3}M${w * 0.06} ${h * 0.75}Q${w / 2} ${h * 0.75 + 10} ${w * 0.97} ${h * 0.7}`
  if (kind === 'cross') return `M0 0L${w} ${h}M${w} ${j(8)}L${j(8)} ${h}`
  if (kind === 'strike') return `M${-w * 0.04} ${h * 0.55}L${w * 1.04} ${h * 0.45 + j(6)}`
  if (kind === 'check') return `M0 ${h * 0.55}L${w * 0.38} ${h}L${w} 0`
  return `M0 ${h}Q${w * 0.2 + j(30)} ${h * 0.1} ${w} 0` // arrow
}

export const scribble = {
  own: ['draw'],
  defaultIn: 'draw',
  prep(el) {
    const kind = el.kind ?? 'circle'
    let w = +(el.w ?? 300), h = +(el.h ?? (kind === 'underline' || kind === 'strike' ? 40 : 160))
    if (el.from && el.to) {
      const [x0, y0] = el.from, [x1, y1] = el.to
      el.x = Math.min(x0, x1); el.y = Math.min(y0, y1); el.anchor = 'tl'
      w = Math.max(20, Math.abs(x1 - x0)); h = Math.max(20, Math.abs(y1 - y0))
      const d = `M${x0 - el.x} ${y0 - el.y}Q${(x0 + x1) / 2 - el.x + (y1 - y0) * 0.25} ${(y0 + y1) / 2 - el.y - (x1 - x0) * 0.25} ${x1 - el.x} ${y1 - el.y}`
      return { kind: 'arrow', w, h, flat: flatten(d) }
    }
    return { kind, w, h, flat: flatten(wobbly(kind, w, h, (el.seed ?? 3) * 31 + w)) }
  },
  inDur(el, st) { return Math.max(0.4, Math.min(1.1, st.flat.len / 1400)) },
  draw(ctx, el, st, k, env) {
    const p = k.inName === 'draw' ? ease('quad-out', k.in) : 1
    const c = env.color(el.color ?? 'accent')
    ctx.strokeStyle = c; ctx.lineWidth = +(el.sw ?? 7); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath(); tracePartial(ctx, st.flat, 0, p); ctx.stroke()
    if (st.kind === 'arrow' && p > 0.6) {
      const tip = pointAt(st.flat, p)
      const s = 26
      ctx.beginPath()
      ctx.moveTo(tip.x + Math.cos(tip.a + 2.5) * s, tip.y + Math.sin(tip.a + 2.5) * s); ctx.lineTo(tip.x, tip.y)
      ctx.lineTo(tip.x + Math.cos(tip.a - 2.5) * s, tip.y + Math.sin(tip.a - 2.5) * s); ctx.stroke()
    }
    void css; void withAlpha
  },
}

// ------------------------------------------------------------------ cutout (a character / object without background)
/** Cut-outs are pictures drawn for this video in the channel's picture style with the background removed:
 *  a character next to a number, an object as the hero, a figure walking along a timeline. */
export const cutout = {
  defaultIn: 'rise',
  prep(el, env) {
    const key = String(el.src || '')
    if (!key.startsWith('cut:')) throw new Error(`cutout: src «${key}» — нужно cut:<id> из списка CUTOUTS`)
    const img = env.image(key)
    if (!img && env.placeholders) throw new Error(`cutout: нет вырезки «${key.slice(4)}» (есть: ${Object.keys(env.cutouts).join(', ') || 'никаких'})`)
    const sprite = img && el.sticker ? stickerOf(img, env.color(el.sticker === true ? '#ffffff' : el.sticker)) : img
    const ar = sprite ? sprite.width / sprite.height : 0.62
    let w = el.w !== undefined ? +el.w : undefined, h = el.h !== undefined ? +el.h : undefined
    if (w === undefined && h === undefined) h = 760
    if (w !== undefined && h !== undefined) { // fit inside the box
      if (w / h > ar) w = h * ar
      else h = w / ar
    } else if (w === undefined) w = h * ar
    else h = w / ar
    return { img: sprite, w, h }
  },
  draw(ctx, el, st, k, env) {
    const { img, w, h } = st
    if (!img) return // not drawn (generation failed): the cut-out is left out
    ctx.save()
    if (el.flip) { ctx.translate(w, 0); ctx.scale(-1, 1) }
    if (el.shadow !== false && !env.overlay) {
      ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 18
    }
    // a slight settle on landing keeps it from looking pasted
    const p = ease('expo-out', k.local / 0.7)
    const s = lerp(0.96, 1, p)
    ctx.translate(w / 2, h); ctx.scale(s, s); ctx.translate(-w / 2, -h)
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h)
    ctx.restore()
  },
}

const stickers = new WeakMap()
/** The cut-out with a solid outline around it (a paper sticker), rendered once. */
function stickerOf(img, color) {
  const cached = stickers.get(img)
  if (cached && cached.color === color) return cached.canvas
  const r = Math.max(4, Math.round(img.width * 0.035))
  const c = createCanvas(img.width + r * 2, img.height + r * 2), x = c.getContext('2d')
  const tint = createCanvas(img.width, img.height), tx = tint.getContext('2d')
  tx.drawImage(img, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = color; tx.fillRect(0, 0, img.width, img.height)
  for (let a = 0; a < 16; a++) x.drawImage(tint, r + Math.cos(a / 16 * Math.PI * 2) * r, r + Math.sin(a / 16 * Math.PI * 2) * r)
  x.drawImage(img, r, r)
  stickers.set(img, { color, canvas: c })
  return c
}
