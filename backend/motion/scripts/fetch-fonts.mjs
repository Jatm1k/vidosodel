// Downloads the font set of the renderer from Google Fonts (all SIL OFL, all with Cyrillic) into fonts/.
// Run once by a developer (`npm run fetch-fonts`); the files are committed, so users need no network for them.
// A request without a browser User-Agent gets plain static TTF files with every glyph.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'

export const FAMILIES = {
  'Inter': [400, 600, 800],
  'Manrope': [500, 800],
  'Montserrat': [500, 700, 900],
  'Unbounded': [400, 700, 900],
  'Onest': [400, 700],
  'Rubik': [500, 800],
  'Oswald': [400, 700],
  'Russo One': [400],
  'Dela Gothic One': [400],
  'PT Serif': [400, 700],
  'Playfair Display': [700, 900],
  'Cormorant Garamond': [500, 700],
  'Old Standard TT': [400, 700],
  'Yeseva One': [400],
  'JetBrains Mono': [400, 700],
  'PT Mono': [400],
  'Press Start 2P': [400],
  'Caveat': [500, 700],
  'Comfortaa': [500, 700],
}

const dir = new URL('../fonts/', import.meta.url)
mkdirSync(dir, { recursive: true })
for (const [family, weights] of Object.entries(FAMILIES)) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weights.join(';')}`
  const css = await (await fetch(url)).text()
  const faces = [...css.matchAll(/font-weight: (\d+);\s*src: url\((https:[^)]+\.ttf)\)/g)]
  if (!faces.length) { console.log('NOT FOUND', family); continue }
  for (const [, weight, src] of faces) {
    const file = new URL(`${family.replace(/ /g, '')}-${weight}.ttf`, dir)
    if (existsSync(file)) continue
    writeFileSync(file, Buffer.from(await (await fetch(src)).arrayBuffer()))
    console.log(family, weight)
  }
}
