// Registry of element types: type name → {prep, draw, inDur?, own?, defaultIn?, anchor?, hasText?}.
import { text, counter, quote, tag } from './text.mjs'
import { shape, icon, image, group, decor } from './shapes.mjs'
import { bars, linechart, donut, ring, iconarray } from './charts.mjs'
import { timeline, list, compare, flow, callout } from './diagram.mjs'
import { map } from './map.mjs'
import { photo, stat, progress, stamp, scribble, cutout } from './rich.mjs'
import { document, portrait, title, filmstrip, paper } from './archive.mjs'

export const ELEMENTS = { text, counter, quote, tag, shape, icon, image, group, decor, bars, linechart, donut, ring, iconarray,
                          timeline, list, compare, flow, callout, map, photo, stat, progress, stamp, scribble, cutout,
                          document, portrait, title, filmstrip, paper }
