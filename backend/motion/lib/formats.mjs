// Formats: the motion languages a video can be told in. A style is the look (palette, type, textures); a format is
// how the graphics behave and what they are made of – the camera, the rhythm of the animation, how the video's
// pictures are treated, what the frame is built from, the finish of the whole video and the rules of composition
// the motion designer follows. Every video gets the format its script asks for (picked with its brief); a channel
// may pin one.
//
//   camera   default camera of a scene without its own: push | rostrum | still | float | handheld | drift
//   hold     element animation in steps of this many fps (12 – «on twos», stop-motion feel); 0 – smooth
//   boil     held frames jitter a little (paper cut-outs moved by hand)
//   treat    how pictures are printed: none | archival | engraving | halftone | duotone | mono  (treatPortrait,
//            treatCutout – of portraits and cut-outs)
//   bg       background of scenes (over the style's), omitted – the style's
//   motion   timing tokens over the style's (ease, dur, stagger, text, pop)
//   avoid    element types / decor kinds / entrances that break the language (the validator warns)
//   finish   the whole video in the render at full strength: grade, grain, weave, flicker, dust, scratches,
//            halation, vignette (0..1); the brief scales it with «film» and may change the grade
//   playbook what the motion designer is told (English, for Claude)

export const GRADES = ['none', 'warm', 'sepia', 'mono', 'cold', 'faded', 'teal', 'bleach']

export const FORMATS = {
  explainer: {
    about: 'bright explainer: flat graphics, big numbers and icons, cut-out characters, lively camera, snappy pops',
    suits: 'psychology, self-help, lifestyle, health, top lists, facts, how-to, kids',
    styles: ['pastel', 'bold', 'notebook', 'retro', 'swiss', 'corporate'],
    camera: 'push', hold: 0, treat: 'none',
    avoid: { types: ['document', 'filmstrip'], kinds: [], ins: [] },
    finish: { grade: 'none', grain: 0.15, vignette: 0.1 },
    playbook: [
      'Energetic and clear: one idea per beat, the hero big, supporting things small. Snappy entrances on the words.',
      'Heroes: cut-out characters acting the idea, a big number, an icon cluster, a simple chart, a flow, a before/after compare.',
      'Every scene has a metaphor a viewer gets in one second (a battery for energy, a maze for confusion…).',
      'Stamps and scribbles are spices for verdicts and emphasis, at most every few scenes.',
    ],
  },

  archive: {
    about: 'documentary archive: letters, manuscripts, prints and portraits laid out on a desk, a slow rostrum camera '
      + 'travelling over them, sepia film with dust and a little gate weave',
    suits: 'history, philosophy, biography, true stories, religion, literature, ideas of the past, investigations',
    styles: ['newspaper', 'editorial', 'noir', 'minimal'],
    camera: 'rostrum', hold: 0, treat: 'archival', treatPortrait: 'engraving', treatCutout: 'archival',
    bg: { kind: 'desk' },
    motion: { ease: 'quart-out', dur: 1.1, stagger: 0.12, text: 'fade', pop: 'cubic-out' },
    avoid: { types: ['iconarray', 'donut', 'ring', 'progress'], kinds: ['confetti', 'sparkle', 'burst'], ins: ['pop', 'slam', 'flip'] },
    finish: { grade: 'sepia', grade_mix: 0.55, grain: 0.75, weave: 0.5, flicker: 0.4, dust: 0.6, scratches: 0.35,
              halation: 0.2, vignette: 0.55 },
    playbook: [
      'The frame is a desk or a page of an archive: the story is told by MATERIALS — a letter in the author\'s hand, a page '
        + 'of a manuscript, an index card, a newspaper clipping, an engraved portrait, a print of the scene\'s picture, an '
        + 'old map. They lie on the desk, overlap a little, sit at small angles (tilt −4…4°), cast soft shadows.',
      'The camera is a rostrum camera: slow continuous moves over the materials. Lay a scene out on a wide canvas (x up to '
        + '3400) and travel from one document to the next, or push in from the whole desk to one line of a letter. Never '
        + 'fast, never bouncy.',
      'Words on screen are quotes and fragments of sources, not slogans: a phrase of the philosopher in the letter, a date '
        + 'on a card, a name under a portrait. A key phrase is underlined in red pencil (*accent* words of a document) or '
        + 'circled with a scribble in accent.',
      'Archetypes (combine, vary): «Portrait and dates» — portrait (engraved) with name and years, a document with a quote '
        + 'beside it; «Dossier» — 3–4 materials around one, the camera visiting them in turn; «Letter» — a full-frame letter, '
        + 'the camera pushing in to the line being read; «Clipping» — a newspaper clipping with a headline, a photo print '
        + 'attached; «Map of the journey» — an old map with a route, a portrait pinned to it; «Card catalogue» — index cards '
        + 'of concepts laid out in a row or a tree; «Two texts» — two documents side by side for a dispute of ideas; '
        + '«Film reel» — a filmstrip of the video\'s pictures for a passage of time; «Title» — a title card in caps on the '
        + 'desk for a turn of the story.',
      'Numbers appear as written on the documents (a date on a card, a figure in a clipping, a counter in caps), charts only '
        + 'as engraved-looking outline charts on a page. No icons as heroes, no confetti, no pops: entrances are fade, '
        + 'rise, drop, place, type and write.',
    ],
  },

  cinematic: {
    about: 'cinematic essay: dark frames full of air, refined serif type tracking in, full-bleed graded pictures, slow '
      + 'light, quotes as film titles',
    suits: 'philosophy, essays, mystery, psychology of meaning, art, space and big questions, stoicism, poetry',
    styles: ['minimal', 'noir', 'cosmos'],
    camera: 'float', hold: 0, treat: 'none', treatPortrait: 'mono',
    motion: { ease: 'quart-out', dur: 1.3, stagger: 0.14, text: 'fade', pop: 'cubic-out' },
    avoid: { types: ['iconarray', 'stamp', 'progress', 'donut', 'list'], kinds: ['confetti', 'sparkle', 'burst'], ins: ['pop', 'slam', 'flip', 'drop'] },
    finish: { grade: 'teal', grade_mix: 0.35, grain: 0.45, flicker: 0.08, dust: 0.12, halation: 0.55, vignette: 0.5 },
    playbook: [
      'Composed like film frames: a lot of empty, dark space with one strong thing in it. Asymmetry (rule of thirds), '
        + 'a horizon, a single figure. Fewer elements than you think: 1–3 per beat.',
      'Type is the hero more often than in other formats, but treated like film titles: the title element (kicker + '
        + 'line + sub, tracking in; font book, caps or thin), quotes in a refined serif (font "book") with the author in small caps, 1 short line at a time. '
        + 'Text 64–130 px, light and elegant, never bold blocks.',
      'Pictures go full-bleed (photo w 1920+, frame none, slow kb) or as a narrow panel; a cut-out figure small against '
        + 'a big empty field reads as solitude and scale.',
      'Movement is slow and continuous: the camera floats, things fade and rise softly, decor light/dust adds air. '
        + 'Long beats (3–6 s), crossing out the previous thing before the next comes (until/out).',
      'Archetypes: «Title card» (kicker, line, rule); «Quote under the picture» (full-bleed photo, dim, the quote low '
        + 'left); «Figure in the field» (small cutout, a big statement far from it); «Two lines» (a thought, then its '
        + 'turn); «Timeline as a horizon» (a thin long line, events far apart, camera travelling along it).',
    ],
  },

  data: {
    about: 'data journalism: precise charts and maps that build and transform, a clear grid, the camera moving through '
      + 'the data, numbers as the story',
    suits: 'economics, finance, business, statistics, geopolitics, science, technology, comparisons',
    styles: ['swiss', 'corporate', 'blueprint', 'editorial'],
    camera: 'still', hold: 0, treat: 'duotone', treatPortrait: 'mono',
    motion: { ease: 'expo-out', dur: 0.75, stagger: 0.06 },
    avoid: { types: ['scribble', 'stamp'], kinds: ['confetti', 'sparkle', 'burst'], ins: ['slam', 'pop', 'flip'] },
    finish: { grade: 'none', grain: 0.12, vignette: 0.15 },
    playbook: [
      'The data is the image: charts, maps and numbers big and exact, with a clear title (a statement of what the chart '
        + 'shows, not a label) and a source line small at the bottom.',
      'Charts transform across beats: bars appear, then one is highlighted (hi), then a second series comes; a line draws, '
        + 'then a mark lands on the moment the narrator names; a map zooms (views) from the world to the country.',
      'Strict grid and alignment: left-aligned headings at x 120, one accent colour for the thing that matters, greys for '
        + 'the rest. Annotations as callouts with thin leader lines.',
      'Archetypes: «Headline chart» (statement title + full-width chart + source); «Zoom map» (views + hl + pins); «Big '
        + 'number with context» (stat + a small comparison bar); «Ranking» (horizontal bars sorted, one highlighted); '
        + '«Split» (two charts side by side for before/after).',
    ],
  },

  sketch: {
    about: 'hand-drawn explainer: everything draws itself on paper — doodle icons, marker highlights, handwritten '
      + 'notes, arrows; animation on twos like a drawing being made',
    suits: 'education, science for everyone, self-development, productivity, how things work, kids',
    styles: ['notebook', 'pastel', 'editorial'],
    camera: 'still', hold: 12, boil: false, treat: 'engraving', treatPortrait: 'engraving', treatCutout: 'none',
    motion: { ease: 'cubic-out', dur: 0.7, stagger: 0.1, text: 'write' },
    avoid: { types: ['filmstrip'], kinds: ['confetti', 'sparkle'], ins: ['slam', 'blur', 'iris'] },
    finish: { grade: 'none', grain: 0.12 },
    playbook: [
      'A page being drawn on: icons and shapes enter with in "draw", text is written (write), arrows and circles are '
        + 'scribbles; pictures of the video appear as drawings (photo with treat engraving).',
      'Build the drawing up across the scene: the first idea in the middle, then arrows to the next ones, until the '
        + 'page is a complete diagram — the camera can pan to the new area of the page.',
      'Handwriting for notes and labels, the display font for the key word; marker highlights on 1–2 words.',
      'Archetypes: «Mind map» (centre word, branches drawn out); «Cause → effect» (flow of doodles); «Labelled drawing» '
        + '(a picture or cutout with callouts); «Checklist» (written list with checks); «Then vs now» (two drawings).',
    ],
  },

  collage: {
    about: 'paper collage: cut-out figures and printed photos with torn edges, halftone prints, tape and paper labels, '
      + 'stop-motion movement on twos with a little jitter',
    suits: 'pop culture, music, internet culture, history with humour, social topics, satire, retro',
    styles: ['retro', 'newspaper', 'bold', 'editorial'],
    camera: 'still', hold: 12, boil: true, treat: 'halftone', treatPortrait: 'halftone',
    bg: { kind: 'paper', grain: 0.8, fibers: true },
    motion: { ease: 'back', dur: 0.5, stagger: 0.08, text: 'pop', pop: 'back' },
    avoid: { types: ['linechart', 'donut', 'ring', 'progress'], kinds: ['sparkle'], ins: ['blur', 'iris'] },
    finish: { grade: 'faded', grade_mix: 0.3, grain: 0.5, weave: 0.2, flicker: 0.12, dust: 0.25, vignette: 0.25 },
    playbook: [
      'Everything is paper: cut-out figures with a paper outline (cutout sticker true), photos as halftone prints with '
        + 'tape, words on torn paper strips (paper), big cut letters. Layers overlap at angles.',
      'Movement is stop-motion: things slide in, flip, wobble; a cutout figure moves in steps along a path (anim x/y), '
        + 'heads and arms can be separate cut-outs. Humour through scale (a giant head, a tiny person).',
      'Archetypes: «Paper stage» (a figure, a speech label, an object, a backdrop photo); «Ransom headline» (words on '
        + 'separate paper strips, slammed in one by one); «Before/after prints» (two halftone photos, one stamped); '
        + '«Crowd» (the same cutout many times small).',
    ],
  },

  interface: {
    about: 'interface/HUD: the story on screens — windows, terminals, scanning frames, data readouts, glitches of light',
    suits: 'technology, internet, AI, cybersecurity, hacking stories, gaming, the future',
    styles: ['terminal', 'neon', 'blueprint'],
    camera: 'drift', hold: 0, treat: 'duotone', treatPortrait: 'duotone', treatCutout: 'duotone',
    motion: { ease: 'expo-out', dur: 0.5, stagger: 0.04, text: 'type' },
    avoid: { types: ['document', 'filmstrip', 'scribble'], kinds: ['confetti'], ins: ['write'] },
    finish: { grade: 'cold', grade_mix: 0.3, grain: 0.3, flicker: 0.05, halation: 0.35, vignette: 0.4 },
    playbook: [
      'Screens and readouts: panels with mono labels, type-on text, counters, scanning frames over pictures (photo with '
        + 'treat duotone and callouts), thin lines connecting data.',
      'Fast precise motion (type, wipe, draw), a slow drifting camera; layers of panels at different depths.',
      'Archetypes: «Dossier on screen» (a duotone photo, readouts beside it); «Terminal» (typed lines, one highlighted); '
        + '«Network» (flow cycle of nodes); «Scan» (callouts appear over a picture one by one).',
    ],
  },
}

/** What the brief and the app need to know of the formats. */
export function formatCatalog() {
  const out = {}
  for (const [name, f] of Object.entries(FORMATS)) {
    out[name] = { about: f.about, suits: f.suits, styles: f.styles, camera: f.camera, treat: f.treat,
                  finish: f.finish, avoid: f.avoid, playbook: f.playbook.join('\n') }
  }
  return out
}

/** The format of a style spec: a name or ``{name, ...overrides}``; unknown → explainer. */
export function resolveFormat(spec) {
  const name = typeof spec === 'string' ? spec : spec?.name
  const base = FORMATS[name] || FORMATS.explainer
  const over = spec && typeof spec === 'object' ? spec : {}
  const { name: _n, ...rest } = over
  return { ...base, ...rest, name: FORMATS[name] ? name : 'explainer' }
}
