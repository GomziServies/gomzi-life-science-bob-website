/**
 * Image trace: turns a bitmap (an AI icon, a logo, a badge) into SVG made of one filled path per colour,
 * so every colour of the result can be recoloured and the whole picture scales without going soft.
 * Pure and synchronous; `index.ts` runs it in a worker.
 */
import ImageTracer, { type RasterLike, type TraceData } from 'imagetracerjs'
import { buildPalette } from './palette'

import { TRACE_COLORS_RANGE, type TraceOptions, type TraceResult } from './options'

export { TRACE_COLORS_RANGE, TRACE_PRESETS, type TraceOptions, type TracePresetId, type TraceResult } from './options'

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const hex = (n: number): string => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')

/** imagetracerjs options for ours. Layers are sequential so the result stacks like a screen print. */
export function libraryOptions(o: TraceOptions): Record<string, unknown> {
  const detail = clamp(o.detail, 0, 1)
  return {
    numberofcolors: Math.round(clamp(o.colors, TRACE_COLORS_RANGE[0], TRACE_COLORS_RANGE[1])),
    ltres: lerp(3, 0.25, detail),
    qtres: lerp(3, 0.25, detail),
    pathomit: Math.round(lerp(40, 3, detail)),
    blurradius: Math.round(clamp(o.smooth, 0, 1) * 3),
    blurdelta: 20,
    colorsampling: 2,
    colorquantcycles: 3,
    layering: 0,
    strokewidth: 0,
    roundcoords: 1,
    rightangleenhance: true,
    linefilter: false,
    scale: 1,
    viewbox: true,
    desc: false,
  }
}

/** The colour most of the picture's border has, or null when the border is see-through. */
export function borderColor(image: RasterLike): [number, number, number] | null {
  const { width, height, data } = image
  const counts = new Map<number, number>()
  let opaque = 0
  let total = 0
  const take = (x: number, y: number): void => {
    const i = (y * width + x) * 4
    total++
    if (data[i + 3] < 128) return
    opaque++
    // 4 bits per channel: close shades of the same flat colour count together.
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  for (let x = 0; x < width; x++) {
    take(x, 0)
    take(x, height - 1)
  }
  for (let y = 1; y < height - 1; y++) {
    take(0, y)
    take(width - 1, y)
  }
  if (total === 0 || opaque < total / 2) return null
  let best = 0
  let bestCount = -1
  for (const [key, n] of counts) {
    if (n > bestCount) {
      best = key
      bestCount = n
    }
  }
  return [((best >> 8) & 15) * 17, ((best >> 4) & 15) * 17, (best & 15) * 17]
}

const BACKGROUND_DISTANCE = 56
const MIN_ALPHA = 13

/** Traces `image` (RGBA pixels) and builds the SVG. */
export function traceImage(image: RasterLike, options: TraceOptions): TraceResult {
  const lib = { ...libraryOptions(options), pal: buildPalette(image.data, image.width * image.height, options.colors) }
  const background = options.dropBackground ? borderColor(image) : null
  const data: TraceData = ImageTracer.imagedataToTracedata(image, lib)
  const checked = ImageTracer.checkoptions(lib)

  const paths: string[] = []
  const colors: string[] = []
  data.layers.forEach((layer, l) => {
    const c = data.palette[l]
    if (c.a < MIN_ALPHA) return
    if (background && Math.hypot(c.r - background[0], c.g - background[1], c.b - background[2]) < BACKGROUND_DISTANCE) return
    let d = ''
    layer.forEach((p, i) => {
      if (p.isholepath) return
      const m = /d="([^"]*)"/.exec(ImageTracer.svgpathstring(data, l, i, checked))
      if (m) d += m[1]
    })
    if (!d) return
    const fill = `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`
    const opacity = c.a < 250 ? ` opacity="${(c.a / 255).toFixed(2)}"` : ''
    paths.push(`<path fill="${fill}"${opacity} d="${d.trim()}"/>`)
    colors.push(fill)
  })

  const { width, height } = data
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${paths.join('')}</svg>`
  return { svg, width, height, colors, size: svg.length }
}
