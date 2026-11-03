// Tools of the app around the renderer:
//   node cli.mjs validate doc.json                  → JSON {scenes: {id: {errors, warnings, settle}}, overlays: {...}}
//   node cli.mjs sheet doc.json out.jpg [id|id@t…]  → a contact sheet: every item when it has settled (or at t)
//   node cli.mjs still doc.json id t out.(png|jpg) [width] → one frame (t in the item's own time)
import { writeFileSync, readFileSync } from 'node:fs'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { loadDoc, Motion, checkLayout, VW, VH } from './lib/doc.mjs'
import { SceneRuntime, OverlayRuntime, Env } from './lib/scene.mjs'
import { fontCss } from './lib/fonts.mjs'

const [cmd, docPath, ...rest] = process.argv.slice(2)
if (cmd === 'styles') {
  const { STYLES } = await import('./lib/styles.mjs')
  const { FAMILIES, loadFonts } = await import('./lib/fonts.mjs')
  loadFonts()
  const out = {}
  for (const [name, s] of Object.entries(STYLES)) out[name] = { about: s.about, palette: s.palette, fonts: Object.fromEntries(Object.entries(s.fonts).map(([k, f]) => [k, `${f.family} ${f.weight}`])), bg: s.bg.kind }
  process.stdout.write(JSON.stringify({ styles: out, families: [...FAMILIES] }))
  process.exit(0)
}
const loaded = await loadDoc(docPath)
const { doc } = loaded

function settleOf(rt, dur) {
  let s = 0
  const walk = (nodes) => { for (const n of nodes) { if (n.el.until === undefined || +n.el.until > n.at) s = Math.max(s, n.at + n.inDur); if (n.children) walk(n.children) } }
  walk(rt.nodes)
  return Math.min(s + 0.15, Math.max(0, dur - 0.05))
}

function build(ctx, motion, id) {
  const sc = (doc.scenes || []).find((s) => String(s.id) === String(id))
  if (sc) { const rt = new SceneRuntime(sc, motion.env(false), ctx); return { kind: 'scene', spec: sc, rt, dur: rt.dur } }
  const ov = (doc.overlays || []).find((s) => String(s.id) === String(id))
  if (ov) { const rt = new OverlayRuntime(ov, motion.env(true), ctx); return { kind: 'overlay', spec: ov, rt, dur: rt.end - rt.start } }
  throw new Error(`нет элемента ${id}`)
}

async function drawItem(ctx, motion, item, t, W, H) {
  ctx.save()
  ctx.scale(W / VW, H / VH)
  if (item.kind === 'scene') item.rt.draw(ctx, t)
  else {
    const bgPath = item.spec.previewBg
    if (bgPath) {
      try {
        const img = await loadImage(readFileSync(bgPath))
        const k = Math.max(VW / img.width, VH / img.height)
        ctx.drawImage(img, (VW - img.width * k) / 2, (VH - img.height * k) / 2, img.width * k, img.height * k)
      } catch { ctx.fillStyle = '#5a5f66'; ctx.fillRect(0, 0, VW, VH) }
    } else { ctx.fillStyle = '#5a5f66'; ctx.fillRect(0, 0, VW, VH) }
    item.rt.draw(ctx, item.rt.start + t)
  }
  ctx.restore()
}

if (cmd === 'validate') {
  const ctx = createCanvas(64, 64).getContext('2d')
  const motion = new Motion(loaded, ctx)
  const out = { scenes: {}, overlays: {} }
  for (const [kind, list] of [['scenes', doc.scenes || []], ['overlays', doc.overlays || []]]) {
    for (const spec of list) {
      const res = { errors: [], warnings: [] }
      try {
        const item = build(ctx, motion, spec.id)
        res.settle = +settleOf(item.rt, item.dur).toFixed(2)
        // one frame in the middle and one at the end: drawing errors show up here
        for (const t of [item.dur / 2, Math.max(0, item.dur - 0.05)]) item.kind === 'scene' ? item.rt.draw(ctx, t) : item.rt.draw(ctx, item.rt.start + t)
        const boxes = item.rt.boxes()
        res.warnings = checkLayout(boxes, { dur: item.dur, overlay: kind === 'overlays', safeBottom: doc.safeBottom || 0,
                                            cam: Array.isArray(spec.cam) && spec.cam.length > 0 })
        if (item.kind === 'scene') {
          if (item.rt.lateStart) res.warnings.unshift(`пустой кадр в начале: первый элемент появлялся только на ${item.rt.lateStart} с — сцена должна открываться главным образом сразу (at 0–0.3), а детали приходить по фразам`)
          res.sig = signature(boxes, spec)
        }
      } catch (e) { res.errors.push(e.message) }
      out[kind][spec.id] = res
    }
  }
  process.stdout.write(JSON.stringify(out))
} else if (cmd === 'sheet') {
  const [outPath, ...ids] = rest
  const all = ids.length ? ids : [...(doc.scenes || []).map((s) => s.id), ...(doc.overlays || []).map((o) => o.id)]
  const cols = Math.min(3, all.length), TW = all.length > 4 ? 480 : 640, TH = TW * 9 / 16, rows = Math.ceil(all.length / cols)
  const sheet = createCanvas(cols * TW + (cols + 1) * 6, rows * TH + (rows + 1) * 6)
  const sc = sheet.getContext('2d')
  sc.fillStyle = '#111'; sc.fillRect(0, 0, sheet.width, sheet.height)
  const tile = createCanvas(TW, TH), tc = tile.getContext('2d')
  const motion = new Motion(loaded, tc)
  for (const [i, entry] of all.entries()) {
    const [id, at] = String(entry).split('@')
    const x = 6 + (i % cols) * (TW + 6), y = 6 + Math.floor(i / cols) * (TH + 6)
    try {
      const item = build(tc, motion, id)
      const t = at !== undefined ? +at : settleOf(item.rt, item.dur)
      tc.setTransform(1, 0, 0, 1, 0, 0); tc.clearRect(0, 0, TW, TH)
      await drawItem(tc, motion, item, t, TW, TH)
      sc.drawImage(tile, x, y)
      label(sc, `${id} · ${t.toFixed(1)}s`, x, y)
    } catch (e) {
      sc.fillStyle = '#400'; sc.fillRect(x, y, TW, TH); label(sc, `${id}: ${e.message}`.slice(0, 70), x, y)
    }
  }
  writeFileSync(outPath, await sheet.encode('jpeg', 82))
  process.stdout.write(JSON.stringify({ ok: true, count: all.length }))
} else if (cmd === 'still') {
  const [id, t, outPath, width] = rest
  const W = +(width || 960), H = Math.round(W * 9 / 16)
  const cv = createCanvas(W, H), ctx = cv.getContext('2d')
  const motion = new Motion(loaded, ctx)
  const item = build(ctx, motion, id)
  const tt = t === 'settle' ? settleOf(item.rt, item.dur) : +t
  await drawItem(ctx, motion, item, tt, W, H)
  writeFileSync(outPath, outPath.endsWith('.png') ? await cv.encode('png') : await cv.encode('jpeg', 85))
  process.stdout.write(JSON.stringify({ ok: true, t: tt }))
} else {
  process.stderr.write('usage: validate | sheet | still\n')
  process.exit(2)
}

/** What a scene is made of, to catch repetition across the video: the hero (largest element), where it sits,
 *  and the set of element types. */
function signature(boxes, spec) {
  const clip = (b) => Math.max(0, Math.min(b.x1, VW) - Math.max(b.x0, 0)) * Math.max(0, Math.min(b.y1, VH) - Math.max(b.y0, 0))
  const cands = boxes.filter((b) => b.type !== 'decor' && b.type !== 'scribble')
  const hero = cands.reduce((a, b) => (!a || clip(b) > clip(a) ? b : a), null)
  let zone = 'c'
  if (hero) {
    const cx = (Math.max(hero.x0, 0) + Math.min(hero.x1, VW)) / 2
    zone = clip(hero) > VW * VH * 0.5 ? 'full' : cx < VW * 0.38 ? 'l' : cx > VW * 0.62 ? 'r' : 'c'
  }
  const types = [...new Set(boxes.map((b) => b.type))].sort()
  return { hero: hero ? hero.type : 'none', zone, types, cam: Array.isArray(spec.cam) && spec.cam.length > 0, bg: spec.bg?.kind ?? spec.bg ?? null }
}

function label(ctx, text, x, y) {
  ctx.font = fontCss({ family: 'Inter', weight: 600 }, 15)
  const w = ctx.measureText(text).width + 12
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(x, y, w, 22)
  ctx.fillStyle = '#fff'; ctx.fillText(text, x + 6, y + 16)
}
void Env
