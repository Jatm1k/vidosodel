// Frame server of a render worker: `node render.mjs doc.json WIDTH HEIGHT`.
// Requests on stdin, one JSON per line:
//   {"scene": "<id>", "t": <seconds in the scene>}  → an opaque frame of the scene
//   {"overlay": true, "t": <absolute seconds>}      → the overlays at t (transparent around them)
// Answer on stdout: uint32 LE byte count (0 – nothing to draw) followed by RGBA pixels (un-premultiplied).
import { writeSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { createCanvas } from '@napi-rs/canvas'
import { loadDoc, Motion, VW } from './lib/doc.mjs'

const [docPath, W, H] = [process.argv[2], +process.argv[3], +process.argv[4]]
const loaded = await loadDoc(docPath)
const canvas = createCanvas(W, H)
const ctx = canvas.getContext('2d')
const motion = new Motion(loaded, ctx)
const scale = W / VW

function send(buf) {
  const head = Buffer.alloc(4)
  head.writeUInt32LE(buf ? buf.length : 0)
  write(head)
  if (buf) write(buf)
}
function write(buf) {
  let off = 0
  while (off < buf.length) {
    try { off += writeSync(1, buf, off, buf.length - off) }
    catch (e) { if (e.code !== 'EAGAIN') throw e }
  }
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })
for await (const line of rl) {
  if (!line.trim()) continue
  let req
  try { req = JSON.parse(line) } catch { send(null); continue }
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.globalAlpha = 1
    if (req.overlay) {
      if (!motion.drawOverlays(ctx, +req.t)) { send(null); continue }
    } else {
      motion.scene(req.scene).draw(ctx, +req.t)
    }
    const img = ctx.getImageData(0, 0, W, H)
    send(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength))
  } catch (e) {
    process.stderr.write(`motion: ${e.stack || e.message}\n`)
    send(null)
  }
}
