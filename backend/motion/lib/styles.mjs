// Visual languages. A style is not a template: it is a set of tokens (palette roles, type, background,
// shapes, effects, motion character) every element draws with. A channel takes a base style and overrides
// any token for its niche; every scene is composed anew from the elements.

import { harmonize } from './palette.mjs'

const font = (family, weight, extra = {}) => ({ family, weight, ...extra })

export const STYLES = {
  editorial: {
    about: 'magazine documentary: warm paper, black ink, one red accent, big serif headlines, hatched charts',
    palette: { bg: '#f1ece2', bg2: '#e6dfd1', ink: '#1d1b19', muted: '#8a8378', accent: '#c8372d', accent2: '#2f5d7c',
               accent3: '#d9a441', panel: '#fbf8f2', line: '#1d1b19', good: '#3d7a4a', bad: '#c8372d' },
    fonts: { display: font('Playfair Display', 900), body: font('PT Serif', 400), label: font('Inter', 600, { upper: true, ls: 2 }),
             mono: font('JetBrains Mono', 400), hand: font('Caveat', 700) },
    bg: { kind: 'paper', grain: 0.5, fibers: true },
    shape: { radius: 2, stroke: 3, bar: 'hatch', cap: 'butt', dot: 'circle' },
    fx: { shadow: 0, glow: 0, texture: 'paper' },
    motion: { ease: 'expo-out', dur: 0.7, stagger: 0.07, text: 'mask', pop: 'cubic-out' },
    panel: { fill: 'panel', stroke: 'ink', sw: 2, radius: 2 },
  },
  swiss: {
    about: 'International typographic style: white, black heavy grotesk, strict grid, a single loud accent',
    palette: { bg: '#f4f4f1', bg2: '#e4e4df', ink: '#111111', muted: '#9b9b96', accent: '#ff3b1f', accent2: '#1f4bff',
               accent3: '#ffc400', panel: '#ffffff', line: '#111111', good: '#18a058', bad: '#ff3b1f' },
    fonts: { display: font('Inter', 800, { ls: -2 }), body: font('Inter', 400), label: font('Inter', 600, { upper: true, ls: 1 }),
             mono: font('JetBrains Mono', 400), hand: font('Caveat', 700) },
    bg: { kind: 'grid', step: 120, alpha: 0.07 },
    shape: { radius: 0, stroke: 4, bar: 'flat', cap: 'butt', dot: 'square' },
    fx: { shadow: 0, glow: 0 },
    motion: { ease: 'expo-out', dur: 0.55, stagger: 0.05, text: 'mask', pop: 'expo-out' },
    panel: { fill: 'ink', text: 'bg', radius: 0 },
  },
  neon: {
    about: 'tech / future / crypto: deep navy, glowing cyan and magenta lines, wide display type, perspective grid',
    palette: { bg: '#070b1a', bg2: '#0f1733', ink: '#e8f1ff', muted: '#5f6f96', accent: '#21e6ff', accent2: '#ff2bd6',
               accent3: '#b6ff3b', panel: '#0d1430', line: '#2a3a6e', good: '#3bffa1', bad: '#ff3b6b' },
    fonts: { display: font('Unbounded', 700), body: font('Manrope', 500), label: font('JetBrains Mono', 400, { upper: true, ls: 2 }),
             mono: font('JetBrains Mono', 400), hand: font('Caveat', 700) },
    bg: { kind: 'grid', step: 90, alpha: 0.12, glow: true, horizon: true },
    shape: { radius: 6, stroke: 3, bar: 'glow', cap: 'round', dot: 'circle' },
    fx: { shadow: 0, glow: 1 },
    motion: { ease: 'expo-out', dur: 0.6, stagger: 0.05, text: 'blur', pop: 'back' },
    panel: { fill: 'panel/85', stroke: 'accent/60', sw: 2, radius: 10 },
  },
  noir: {
    about: 'true crime / mystery: near-black, gold accent, elegant serif, heavy vignette, slow deliberate moves',
    palette: { bg: '#0c0b0a', bg2: '#1a1714', ink: '#efe7d8', muted: '#7b7266', accent: '#d4a64a', accent2: '#a3322a',
               accent3: '#6d8a9a', panel: '#15130f', line: '#3a342b', good: '#8fae6a', bad: '#a3322a' },
    fonts: { display: font('Cormorant Garamond', 700), body: font('PT Serif', 400), label: font('Montserrat', 500, { upper: true, ls: 4 }),
             mono: font('PT Mono', 400), hand: font('Caveat', 500) },
    bg: { kind: 'vignette', grain: 0.6, light: 0.25 },
    shape: { radius: 0, stroke: 2, bar: 'outline', cap: 'butt', dot: 'circle' },
    fx: { shadow: 0.6, glow: 0.3 },
    motion: { ease: 'quart-out', dur: 1.0, stagger: 0.12, text: 'fade', pop: 'cubic-out' },
    panel: { fill: 'panel/90', stroke: 'accent/70', sw: 1.5, radius: 0 },
  },
  blueprint: {
    about: 'engineering / science / how it works: blueprint blue, white thin strokes, mono labels, everything draws itself',
    palette: { bg: '#123a6b', bg2: '#0f3160', ink: '#eaf3ff', muted: '#8fb1d9', accent: '#ffd23f', accent2: '#7fe0ff',
               accent3: '#ff8f5a', panel: '#0e2f5a', line: '#cfe3ff', good: '#9effa8', bad: '#ff8f5a' },
    fonts: { display: font('Unbounded', 400), body: font('Manrope', 500), label: font('JetBrains Mono', 400, { upper: true, ls: 2 }),
             mono: font('JetBrains Mono', 400), hand: font('Caveat', 500) },
    bg: { kind: 'blueprint', step: 48, alpha: 0.16 },
    shape: { radius: 0, stroke: 2.5, bar: 'outline', cap: 'round', dot: 'ring' },
    fx: { shadow: 0, glow: 0 },
    motion: { ease: 'cubic-out', dur: 0.8, stagger: 0.08, text: 'type', pop: 'cubic-out' },
    panel: { fill: 'panel/90', stroke: 'line/70', sw: 1.5, radius: 0 },
  },
  pastel: {
    about: 'psychology / lifestyle / kids / health: soft pastels, rounded friendly shapes, bouncy motion',
    palette: { bg: '#fdf6ee', bg2: '#f6e9dc', ink: '#2e2a3b', muted: '#a49cb3', accent: '#ff7a8a', accent2: '#6cc4a4',
               accent3: '#8c8cff', panel: '#ffffff', line: '#2e2a3b', good: '#6cc4a4', bad: '#ff7a8a' },
    fonts: { display: font('Unbounded', 700), body: font('Onest', 400), label: font('Onest', 700), mono: font('JetBrains Mono', 400),
             hand: font('Caveat', 700) },
    bg: { kind: 'blobs', colors: ['accentSoft/70', 'accent2Soft/60'] },
    shape: { radius: 28, stroke: 4, bar: 'round', cap: 'round', dot: 'circle' },
    fx: { shadow: 0.25, glow: 0 },
    motion: { ease: 'back', dur: 0.65, stagger: 0.08, text: 'pop', pop: 'back' },
    panel: { fill: 'panel', radius: 24, shadow: true },
  },
  terminal: {
    about: 'hacking / IT / internet mysteries: black, phosphor green monospace, scanlines, typewriter text, stepped motion',
    palette: { bg: '#040805', bg2: '#0a140c', ink: '#9dffb0', muted: '#3f7a4c', accent: '#d7ff3f', accent2: '#ff4f4f',
               accent3: '#4fd5ff', panel: '#081109', line: '#2e6b3b', good: '#9dffb0', bad: '#ff4f4f' },
    fonts: { display: font('JetBrains Mono', 700), body: font('JetBrains Mono', 400), label: font('JetBrains Mono', 400, { upper: true, ls: 1 }),
             mono: font('JetBrains Mono', 400), hand: font('PT Mono', 400) },
    bg: { kind: 'scan', alpha: 0.18, glow: true },
    shape: { radius: 0, stroke: 2, bar: 'blocks', cap: 'butt', dot: 'square' },
    fx: { shadow: 0, glow: 0.7 },
    motion: { ease: 'steps', dur: 0.5, stagger: 0.04, text: 'type', pop: 'steps' },
    panel: { fill: 'panel/90', stroke: 'ink/70', sw: 1.5, radius: 0 },
  },
  newspaper: {
    about: 'old history / archives: yellowed newsprint, old typefaces, halftone, ink rules and stamps',
    palette: { bg: '#e9dfc7', bg2: '#d9cdb0', ink: '#24201a', muted: '#7d7260', accent: '#9c2a1f', accent2: '#3b4a5c',
               accent3: '#7a6a2c', panel: '#f1e8d2', line: '#24201a', good: '#465c3a', bad: '#9c2a1f' },
    fonts: { display: font('Old Standard TT', 700), body: font('Old Standard TT', 400), label: font('PT Serif', 700, { upper: true, ls: 3 }),
             mono: font('PT Mono', 400), hand: font('Caveat', 500) },
    bg: { kind: 'paper', grain: 0.8, fibers: true, halftone: true, aged: true },
    shape: { radius: 0, stroke: 2.5, bar: 'hatch', cap: 'butt', dot: 'circle' },
    fx: { shadow: 0, glow: 0, texture: 'paper' },
    motion: { ease: 'quart-out', dur: 0.8, stagger: 0.09, text: 'fade', pop: 'cubic-out' },
    panel: { fill: 'panel', stroke: 'ink', sw: 2, radius: 0, double: true },
  },
  corporate: {
    about: 'finance / business / economy: clean deep blue and white, geometric sans, smooth precise data animation',
    palette: { bg: '#0b1f3a', bg2: '#12294a', ink: '#ffffff', muted: '#7d93b3', accent: '#3fa9ff', accent2: '#2ee59d',
               accent3: '#ffb547', panel: '#13305a', line: '#2c4a75', good: '#2ee59d', bad: '#ff5c6c' },
    fonts: { display: font('Montserrat', 900), body: font('Montserrat', 500), label: font('Montserrat', 700, { upper: true, ls: 2 }),
             mono: font('JetBrains Mono', 400), hand: font('Caveat', 700) },
    bg: { kind: 'grad', from: 'bg2', to: 'bg', angle: 115, dots: true },
    shape: { radius: 8, stroke: 3, bar: 'grad', cap: 'round', dot: 'circle' },
    fx: { shadow: 0.3, glow: 0.2 },
    motion: { ease: 'expo-out', dur: 0.7, stagger: 0.06, text: 'rise', pop: 'back' },
    panel: { fill: 'panel/92', radius: 12, shadow: true },
  },
  bold: {
    about: 'top-lists / motivation / facts: saturated colour fields, huge condensed caps, punchy fast cuts',
    palette: { bg: '#ffd400', bg2: '#ff4d2e', ink: '#101010', muted: '#5a5a5a', accent: '#ff2e63', accent2: '#2e5bff',
               accent3: '#ffffff', panel: '#101010', line: '#101010', good: '#00b36b', bad: '#ff2e63' },
    fonts: { display: font('Oswald', 700, { upper: true }), body: font('Rubik', 500), label: font('Rubik', 800, { upper: true, ls: 1 }),
             mono: font('JetBrains Mono', 700), hand: font('Caveat', 700) },
    bg: { kind: 'solid', stripes: true },
    shape: { radius: 0, stroke: 6, bar: 'flat', cap: 'butt', dot: 'square' },
    fx: { shadow: 0, glow: 0, offset: 10 },
    motion: { ease: 'back', dur: 0.45, stagger: 0.05, text: 'slam', pop: 'back' },
    panel: { fill: 'ink', text: 'bg', radius: 0 },
  },
  notebook: {
    about: 'education / explainers: squared notebook paper, handwriting, marker highlights, doodle arrows',
    palette: { bg: '#fbfaf6', bg2: '#f0eee6', ink: '#2b3a55', muted: '#9aa5b8', accent: '#ff6b35', accent2: '#2bb3a3',
               accent3: '#ffd447', panel: '#ffffff', line: '#2b3a55', good: '#2bb3a3', bad: '#e5484d' },
    fonts: { display: font('Caveat', 700), body: font('Comfortaa', 500), label: font('Caveat', 700), mono: font('PT Mono', 400),
             hand: font('Caveat', 700) },
    bg: { kind: 'notebook', step: 42, alpha: 0.18 },
    shape: { radius: 14, stroke: 4, bar: 'marker', cap: 'round', dot: 'circle', rough: true },
    fx: { shadow: 0, glow: 0 },
    motion: { ease: 'back', dur: 0.6, stagger: 0.08, text: 'write', pop: 'back' },
    panel: { fill: 'panel', stroke: 'ink', sw: 3, radius: 14, rough: true },
  },
  cosmos: {
    about: 'space / physics / big questions: deep space gradient, slow twinkling stars, thin wide type, soft glows',
    palette: { bg: '#05040f', bg2: '#1a1240', ink: '#f2efff', muted: '#7a74a8', accent: '#9d7bff', accent2: '#4fd8ff',
               accent3: '#ffcf6b', panel: '#120d2e', line: '#3a3270', good: '#6bffc1', bad: '#ff6b8b' },
    fonts: { display: font('Unbounded', 400, { ls: 2 }), body: font('Manrope', 500), label: font('Manrope', 800, { upper: true, ls: 4 }),
             mono: font('JetBrains Mono', 400), hand: font('Caveat', 500) },
    bg: { kind: 'stars', nebula: true },
    shape: { radius: 999, stroke: 2, bar: 'glow', cap: 'round', dot: 'circle' },
    fx: { shadow: 0, glow: 0.8 },
    motion: { ease: 'sine-out', dur: 1.1, stagger: 0.1, text: 'blur', pop: 'cubic-out' },
    panel: { fill: 'panel/80', stroke: 'accent/50', sw: 1.5, radius: 16 },
  },
  retro: {
    about: '70s-90s print / pop culture / nostalgia: cream, orange and teal, chunky display type, offset print shadows',
    palette: { bg: '#f4e4c1', bg2: '#ecd3a0', ink: '#2a1d14', muted: '#9c8564', accent: '#e8562a', accent2: '#1f8a8a',
               accent3: '#f2b134', panel: '#fff3da', line: '#2a1d14', good: '#1f8a8a', bad: '#e8562a' },
    fonts: { display: font('Dela Gothic One', 400), body: font('Rubik', 500), label: font('Rubik', 800, { upper: true, ls: 2 }),
             mono: font('PT Mono', 400), hand: font('Caveat', 700) },
    bg: { kind: 'rays', alpha: 0.12, grain: 0.5 },
    shape: { radius: 18, stroke: 5, bar: 'offset', cap: 'round', dot: 'circle' },
    fx: { shadow: 0, glow: 0, offset: 8 },
    motion: { ease: 'back', dur: 0.6, stagger: 0.07, text: 'pop', pop: 'back' },
    panel: { fill: 'panel', stroke: 'ink', sw: 4, radius: 18, offset: true },
  },
  military: {
    about: 'war history / geopolitics / strategy: olive and khaki, stencil-like condensed caps, tactical maps, grit',
    palette: { bg: '#2b2f24', bg2: '#373c2e', ink: '#e6e0c8', muted: '#8d8a72', accent: '#d9a02b', accent2: '#b5432f',
               accent3: '#7c9a5a', panel: '#23271d', line: '#5b5f48', good: '#7c9a5a', bad: '#b5432f' },
    fonts: { display: font('Russo One', 400, { upper: true, ls: 1 }), body: font('Oswald', 400), label: font('Oswald', 700, { upper: true, ls: 3 }),
             mono: font('PT Mono', 400), hand: font('Caveat', 500) },
    bg: { kind: 'paper', grain: 0.9, dark: true, grid: 100 },
    shape: { radius: 0, stroke: 3, bar: 'flat', cap: 'butt', dot: 'square' },
    fx: { shadow: 0.4, glow: 0 },
    motion: { ease: 'quart-out', dur: 0.6, stagger: 0.07, text: 'mask', pop: 'cubic-out' },
    panel: { fill: 'panel/92', stroke: 'accent/70', sw: 2, radius: 0, corners: true },
  },
  minimal: {
    about: 'calm documentary / essays / philosophy: off-black or off-white, light large type, lots of air, slow fades',
    palette: { bg: '#121212', bg2: '#1c1c1c', ink: '#f0f0ec', muted: '#6f6f6a', accent: '#e8d5b0', accent2: '#8fb3c9',
               accent3: '#c98f8f', panel: '#1a1a1a', line: '#3a3a38', good: '#a8c99a', bad: '#c98f8f' },
    fonts: { display: font('Manrope', 500, { ls: -1 }), body: font('Manrope', 500), label: font('Manrope', 800, { upper: true, ls: 5 }),
             mono: font('JetBrains Mono', 400), hand: font('Caveat', 500) },
    bg: { kind: 'vignette', grain: 0.35, light: 0.12 },
    shape: { radius: 4, stroke: 2, bar: 'thin', cap: 'round', dot: 'circle' },
    fx: { shadow: 0, glow: 0 },
    motion: { ease: 'quart-out', dur: 1.0, stagger: 0.1, text: 'fade', pop: 'cubic-out' },
    panel: { fill: 'panel/88', radius: 6 },
  },
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
function merge(base, over) {
  const out = { ...base }
  for (const [k, v] of Object.entries(over || {})) out[k] = isObj(v) && isObj(base[k]) ? merge(base[k], v) : v
  return out
}

/** Resolved style: ``{base: "neon", palette: {...}, fonts: {...}}`` – the base with any tokens overridden. */
export function resolveStyle(spec) {
  const s = spec || {}
  const base = STYLES[s.base] || STYLES.editorial
  const { base: _b, about: _a, ...over } = s
  const out = merge(base, over)
  out.palette = harmonize(out.palette)
  return { ...out, name: STYLES[s.base] ? s.base : 'editorial' }
}
