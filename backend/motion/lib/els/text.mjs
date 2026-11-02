// Text elements: text (kinetic typography), counter, quote, tag (lower third / label plate).
import { clamp, ease, formatNumber, css, withAlpha } from '../core.mjs'
import { fontCss, fontSpec, layoutText, plain } from '../fonts.mjs'
import { prepText, drawText, textInDur, alignOf, panel, panelText, rr } from './util.mjs'

const TEXT_MODES = ['mask', 'type', 'write', 'words', 'chars', 'lines', 'pop', 'rise', 'blur']

export const text = {
  hasText: true,
  own: TEXT_MODES,
  prep(el, env, ctx) {
    const size = Math.max(30, +(el.size ?? 84))
    const lay = prepText(ctx, el, env, el.font ? el.font : size >= 56 ? 'display' : 'body', size)
    const pad = el.plate ? Math.round(lay.size * 0.35) : 0
    const mode = el.in ?? env.motion.text
    return { lay, pad, w: (el.w ? Math.min(+el.w, lay.w) || +el.w : lay.w) + pad * 2, h: lay.h + pad * 2, mode,
             unitDur: Math.max(0.35, env.motion.dur) }
  },
  inDur(el, st, env) { return TEXT_MODES.includes(st.mode) ? textInDur(st.lay, st.mode, env, st.unitDur) : env.motion.dur },
  draw(ctx, el, st, k, env, node) {
    const { lay, pad } = st
    if (el.plate) {
      const p = clamp(k.in * 3)
      ctx.save(); ctx.globalAlpha *= p
      panel(ctx, env, 0, 0, st.w, st.h, typeof el.plate === 'string' ? { fill: el.plate } : {}, node.seed)
      ctx.restore()
    }
    ctx.save(); ctx.translate(pad, pad)
    const color = el.color ? env.color(el.color) : el.plate ? panelText(env) : env.color('ink')
    drawText(ctx, lay, env, {
      color, acc: env.color(el.acc ?? 'accent'), align: alignOf(el), boxW: st.w - pad * 2, mode: TEXT_MODES.includes(k.inName) ? k.inName : 'none',
      local: k.local, unitDur: st.unitDur, hl: el.hl, styleKey: env.style.name, seed: node.seed,
      stroke: el.stroke ? { color: env.color(el.stroke), width: Math.max(4, lay.size * 0.08) } : null,
    })
    ctx.restore()
  },
}

// ------------------------------------------------------------------ counter
function digitsWidth(ctx) {
  let m = 0
  for (let d = 0; d <= 9; d++) m = Math.max(m, ctx.measureText(String(d)).width)
  return m
}
function numberWidth(ctx, s, dw) {
  let w = 0
  for (const ch of s) w += ch >= '0' && ch <= '9' ? dw : ctx.measureText(ch).width
  return w
}

export const counter = {
  hasText: true,
  own: ['count'],
  defaultIn: 'count',
  prep(el, env, ctx) {
    const size = +(el.size ?? 150)
    const font = fontSpec(env.style, el.font || 'display', el.weight ? { weight: el.weight } : {})
    ctx.font = fontCss(font, size)
    const dw = digitsWidth(ctx)
    const dec = +(el.dec ?? (String(el.value).includes('.') ? String(el.value).split('.')[1].length : 0))
    const final = `${el.prefix ?? ''}${formatNumber(+el.value, dec, env.lang)}${el.suffix ?? ''}`
    const numW = numberWidth(ctx, final, dw)
    let label = null
    if (el.label) {
      const lsize = +(el.labelSize ?? Math.max(30, size * 0.26))
      label = layoutText(ctx, el.label, { font: fontSpec(env.style, 'label'), size: lsize, maxw: Math.max(numW, el.w ? +el.w : 0, 420),
                                           upper: fontSpec(env.style, 'label').upper, ls: fontSpec(env.style, 'label').ls ?? 0 })
    }
    ctx.font = fontCss(font, size) // the label layout above changed the font
    const m = ctx.measureText('0')
    const asc = m.actualBoundingBoxAscent || size * 0.72
    const w = Math.max(numW, label ? label.w : 0)
    const gap = label ? size * 0.16 : 0
    return { font, size, dw, dec, numW, asc, label, gap, w, h: asc + (label ? gap + label.h : 0) + size * 0.04 }
  },
  inDur(el) { return +(el.count ?? 1.6) },
  draw(ctx, el, st, k, env) {
    const p = k.inName === 'count' ? ease('expo-out', k.local / +(el.count ?? 1.6)) : 1
    const from = +(el.from ?? 0)
    const v = from + (+el.value - from) * p
    const s = `${el.prefix ?? ''}${formatNumber(v, st.dec, env.lang)}${el.suffix ?? ''}`
    ctx.font = fontCss(st.font, st.size)
    ctx.textBaseline = 'alphabetic'
    const align = alignOf(el)
    const w = numberWidth(ctx, s, st.dw)
    let x = align === 'c' ? (st.w - w) / 2 : align === 'r' ? st.w - w : 0
    ctx.globalAlpha *= clamp(k.local / 0.25)
    ctx.fillStyle = env.color(el.color ?? 'accent')
    for (const ch of s) {
      const isD = ch >= '0' && ch <= '9'
      const cw = isD ? st.dw : ctx.measureText(ch).width
      ctx.fillText(ch, x + (isD ? (cw - ctx.measureText(ch).width) / 2 : 0), st.asc)
      x += cw
    }
    if (st.label) {
      ctx.save(); ctx.translate(0, st.asc + st.gap)
      const lp = clamp((k.local - 0.3) / 0.5)
      ctx.globalAlpha *= lp; ctx.translate(0, (1 - lp) * 16)
      drawLabel(ctx, st.label, env, el.labelColor ?? 'muted', align, st.w)
      ctx.restore()
    }
  },
}

function drawLabel(ctx, lay, env, color, align, boxW) {
  ctx.font = fontCss(lay.font, lay.size)
  ctx.letterSpacing = `${lay.ls}px`
  ctx.fillStyle = env.color(color)
  for (const line of lay.lines) {
    const x = align === 'c' ? (boxW - line.w) / 2 : align === 'r' ? boxW - line.w : 0
    for (const w of line.words) { ctx.fillStyle = env.color(w.acc ? 'accent' : color); ctx.fillText(w.text, x + w.x, line.y + lay.asc) }
  }
  ctx.letterSpacing = '0px'
}
export { drawLabel }

// ------------------------------------------------------------------ quote
export const quote = {
  hasText: true,
  own: TEXT_MODES,
  prep(el, env, ctx) {
    const size = Math.max(34, +(el.size ?? 64))
    const lay = prepText(ctx, { ...el, w: el.w ?? 1300 }, env, el.font || 'display', size)
    let by = null
    if (el.by) by = layoutText(ctx, `— ${plain(el.by)}`, { font: fontSpec(env.style, 'label'), size: Math.max(26, size * 0.42),
                                                          upper: fontSpec(env.style, 'label').upper, ls: fontSpec(env.style, 'label').ls ?? 0 })
    const mark = size * 2.2
    ctx.font = fontCss(fontSpec(env.style, 'display'), mark)
    const indent = ctx.measureText('«').width + size * 0.35
    const w = Math.max(lay.w, by ? by.w : 0) + indent
    return { lay, by, mark, indent, w, h: lay.h + (by ? by.h + size * 0.6 : 0), mode: el.in ?? env.motion.text,
             unitDur: Math.max(0.35, env.motion.dur) }
  },
  inDur(el, st, env) { return (TEXT_MODES.includes(st.mode) ? textInDur(st.lay, st.mode, env, st.unitDur) : env.motion.dur) + 0.4 },
  draw(ctx, el, st, k, env, node) {
    const { lay, by, mark, indent } = st
    const mp = ease('back', k.local / 0.6)
    ctx.save()
    ctx.globalAlpha *= clamp(mp)
    ctx.font = fontCss(fontSpec(env.style, 'display'), mark)
    ctx.fillStyle = env.color(el.acc ?? 'accent')
    ctx.translate(0, lay.asc * 1.05)
    ctx.scale(Math.max(0.01, mp), Math.max(0.01, mp))
    ctx.fillText('«', 0, lay.size * 0.2)
    ctx.restore()
    ctx.save(); ctx.translate(indent, 0)
    drawText(ctx, lay, env, { color: env.color(el.color ?? 'ink'), acc: env.color(el.acc ?? 'accent'), align: 'l', boxW: lay.w,
                              mode: TEXT_MODES.includes(k.inName) ? k.inName : 'none', local: k.local - 0.2, unitDur: st.unitDur,
                              hl: el.hl, styleKey: env.style.name, seed: node.seed })
    if (by) {
      const tIn = textInDur(lay, TEXT_MODES.includes(k.inName) ? k.inName : 'none', env, st.unitDur)
      const bp = clamp((k.local - tIn) / 0.5)
      ctx.globalAlpha *= bp
      ctx.translate(0, lay.h + lay.size * 0.6 + (1 - bp) * 12)
      drawLabel(ctx, by, env, 'muted', 'l', by.w)
    }
    ctx.restore()
  },
}

// ------------------------------------------------------------------ tag (lower third / plate with title + subtitle)
export const tag = {
  hasText: true,
  own: ['wipe', 'slide'],
  defaultIn: 'slide',
  prep(el, env, ctx) {
    const size = Math.max(32, +(el.size ?? 50))
    const tf = fontSpec(env.style, el.font || 'display')
    const title = layoutText(ctx, el.text ?? el.title ?? '', { font: tf, size, maxw: el.w ? +el.w : 1100, upper: tf.upper, ls: tf.ls ?? 0 })
    let sub = null
    if (el.sub) {
      const lf = fontSpec(env.style, 'label')
      sub = layoutText(ctx, el.sub, { font: lf, size: Math.max(22, size * 0.5), maxw: el.w ? +el.w : 1100, upper: lf.upper, ls: lf.ls ?? 0 })
    }
    const pad = size * 0.5
    const bar = el.bar === false ? 0 : Math.max(8, size * 0.18)
    const inner = Math.max(title.w, sub ? sub.w : 0)
    return { title, sub, pad, bar, w: inner + pad * 2 + bar, h: title.h + (sub ? sub.h + size * 0.22 : 0) + pad * 1.6 }
  },
  inDur() { return 0.9 },
  draw(ctx, el, st, k, env, node) {
    const { title, sub, pad, bar } = st
    const p = ease('expo-out', k.local / 0.7)
    const right = alignOf(el) === 'r'
    ctx.save()
    if (k.inName === 'slide' || k.inName === 'wipe') {
      ctx.beginPath()
      if (right) ctx.rect(st.w * (1 - p), -20, st.w + 40, st.h + 40); else ctx.rect(-20, -20, st.w * p + 20, st.h + 40)
      ctx.clip()
    }
    panel(ctx, env, 0, 0, st.w, st.h, el.fill ? { fill: el.fill } : {}, node.seed)
    if (bar) { ctx.fillStyle = env.color(el.acc ?? 'accent'); ctx.fillRect(right ? st.w - bar : 0, 0, bar, st.h) }
    const tx = (right ? 0 : bar) + pad
    const tp = clamp((k.local - 0.25) / 0.5)
    ctx.globalAlpha *= tp
    ctx.translate(tx + (1 - tp) * (right ? 20 : -20), pad * 0.8)
    const tcol = el.color ? env.color(el.color) : panelText(env)
    drawText(ctx, title, env, { color: tcol, acc: env.color(el.acc ?? 'accent'), align: right ? 'r' : 'l', boxW: st.w - pad * 2 - bar,
                                mode: 'none', local: 99, styleKey: env.style.name })
    if (sub) {
      ctx.translate(0, title.h + title.size * 0.22)
      ctx.globalAlpha *= 0.85
      drawLabel(ctx, sub, env, el.subColor ?? 'accent', right ? 'r' : 'l', st.w - pad * 2 - bar)
    }
    ctx.restore()
  },
}
