/**
 * Warp text: the live text is drawn flat into an offscreen canvas and re-drawn through a mesh, so every
 * point of the text box (u, v in 0..1) lands somewhere new. A warp is either a preset shape (arch, wave,
 * fish-eye...) or a custom mesh of draggable points that moves both ways. Only the picture is distorted,
 * the layer stays editable text, and the caret, the selection and a click all go through the same
 * mapping (see textRender.ts). The warped picture is cached until the text, its paint or the warp changes.
 */
import type { FabricObject } from 'fabric'
import type { WarpMesh, WarpSpec, WarpStyle } from '@/types/document'

export const DEFAULT_WARP: WarpSpec = { style: 'arch', amount: 50 }
/** Control points of a custom mesh: columns left to right, rows top to bottom. */
export const MESH_COLS = 7
export const MESH_ROWS = 3
/** How far a mesh point may move, as a fraction of the text width and height. */
export const MESH_RANGE_X = 0.15
export const MESH_RANGE_Y = 0.75

export type PresetStyle = Exclude<WarpStyle, 'custom'>

export const WARP_STYLES: readonly { id: PresetStyle; label: string }[] = [
  { id: 'arch', label: 'Arch' },
  { id: 'shell', label: 'Shell' },
  { id: 'wave', label: 'Wave' },
  { id: 'flag', label: 'Flag' },
  { id: 'bulge', label: 'Bulge' },
  { id: 'fisheye', label: 'Fish-eye' },
  { id: 'perspective', label: 'Perspective' },
  { id: 'rise', label: 'Rise' },
]

export interface WarpColumn {
  /** Where the column lands horizontally, as a fraction of the text width (identity: `u`). */
  fx: number
  /** Vertical shift as a fraction of the text height (positive = down). */
  dy: number
  /** Vertical stretch about the middle line. */
  sy: number
}

export interface Pt {
  x: number
  y: number
}

const MIN_SCALE = 0.1
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

/** How column `u` (0 = left edge, 1 = right edge) of the text moves for a preset at `amount` in -100..100. */
export function warpColumn(style: PresetStyle, u: number, amount: number): WarpColumn {
  const a = Math.max(-100, Math.min(100, amount)) / 100
  const bump = Math.sin(Math.PI * u)
  const wave = Math.sin(2 * Math.PI * u)
  const col: WarpColumn = { fx: u, dy: 0, sy: 1 }
  switch (style) {
    case 'arch':
      col.dy = -a * 0.6 * bump
      break
    case 'shell':
      col.dy = -a * 0.6 * bump
      col.sy = 1 + a * 0.5 * bump
      break
    case 'wave':
      col.dy = a * 0.35 * wave
      break
    case 'flag':
      col.dy = a * 0.3 * wave
      col.sy = 1 - a * 0.2 * Math.cos(2 * Math.PI * u)
      break
    case 'bulge':
      col.sy = 1 + a * 0.8 * bump
      break
    case 'fisheye':
      col.sy = 1 + a * 0.9 * bump
      col.fx = u - a * 0.08 * wave
      break
    case 'perspective':
      col.sy = 1 + a * 0.5 * (2 * u - 1)
      break
    case 'rise':
      col.dy = -a * 0.5 * (2 * u - 1)
      break
  }
  col.sy = Math.max(MIN_SCALE, col.sy)
  return col
}

/** Where a preset sends the point (u, v) of the text box; works outside 0..1 too (the edge keeps going). */
export function presetPoint(style: PresetStyle, amount: number, u: number, v: number): Pt {
  const cu = clamp01(u)
  const col = warpColumn(style, cu, amount)
  return { x: col.fx + (u - cu), y: 0.5 + col.dy + (v - 0.5) * col.sy }
}

/** Smooth (Catmull-Rom) value of the control values `pts` at `u` in 0..1. */
export function sampleSpline(pts: readonly number[], u: number): number {
  const n = pts.length
  if (n === 0) return 0
  if (n === 1) return pts[0]
  const x = clamp01(u) * (n - 1)
  const i = Math.min(n - 2, Math.floor(x))
  const t = x - i
  const p0 = pts[Math.max(i - 1, 0)]
  const p1 = pts[i]
  const p2 = pts[i + 1]
  const p3 = pts[Math.min(i + 2, n - 1)]
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
}

/** Value of a mesh layer (`MESH_ROWS` rows of `MESH_COLS`) at (u, v), smooth in both directions. */
export function sampleMesh(values: readonly number[], u: number, v: number): number {
  const rows: number[] = []
  for (let r = 0; r < MESH_ROWS; r++) rows.push(sampleSpline(values.slice(r * MESH_COLS, (r + 1) * MESH_COLS), u))
  return sampleSpline(rows, v)
}

/** The mesh of a spec, padded with zeros so half-written or damaged data still works. */
export function meshOf(spec: WarpSpec): WarpMesh {
  const fit = (a: readonly number[] | undefined): number[] => Array.from({ length: MESH_COLS * MESH_ROWS }, (_, i) => (Number.isFinite(a?.[i]) ? (a as number[])[i] : 0))
  return { dx: fit(spec.mesh?.dx), dy: fit(spec.mesh?.dy) }
}

/** Where any warp sends the point (u, v) of the text box (fractions of its width and height). */
export function warpPoint(spec: WarpSpec, u: number, v: number): Pt {
  if (spec.style === 'custom') {
    const { dx, dy } = meshOf(spec)
    const cu = clamp01(u)
    const cv = clamp01(v)
    return { x: u + sampleMesh(dx, cu, cv), y: v + sampleMesh(dy, cu, cv) }
  }
  return presetPoint(spec.style, spec.amount, u, v)
}

/** The point that `warpPoint` sends to (x, y): where a click on the warped picture came from. */
export function unwarpPoint(spec: WarpSpec, x: number, y: number): Pt {
  let u = x
  let v = y
  const eps = 1e-4
  for (let i = 0; i < 12; i++) {
    const p = warpPoint(spec, u, v)
    const fx = p.x - x
    const fy = p.y - y
    if (Math.abs(fx) < 1e-7 && Math.abs(fy) < 1e-7) break
    const pu = warpPoint(spec, u + eps, v)
    const pv = warpPoint(spec, u, v + eps)
    const a = (pu.x - p.x) / eps
    const c = (pu.y - p.y) / eps
    const b = (pv.x - p.x) / eps
    const d = (pv.y - p.y) / eps
    const det = a * d - b * c
    if (Math.abs(det) < 1e-9) break
    u -= (d * fx - b * fy) / det
    v -= (a * fy - c * fx) / det
  }
  return { x: u, y: v }
}

/** Whether the spec bends anything (a zero preset or a flat mesh is the same as no warp). */
export function isWarpActive(spec: WarpSpec | undefined): spec is WarpSpec {
  if (!spec) return false
  if (spec.style === 'custom') {
    const { dx, dy } = meshOf(spec)
    return [...dx, ...dy].some((v) => Math.abs(v) > 0.001)
  }
  return spec.amount !== 0
}

/** The mesh that reproduces a preset at its control points, so "Custom" starts from the shape the user already has. */
export function presetToMesh(style: PresetStyle, amount: number): WarpMesh {
  const dx: number[] = []
  const dy: number[] = []
  for (let r = 0; r < MESH_ROWS; r++) {
    for (let c = 0; c < MESH_COLS; c++) {
      const u = c / (MESH_COLS - 1)
      const v = r / (MESH_ROWS - 1)
      const p = presetPoint(style, amount, u, v)
      dx.push(Math.round((p.x - u) * 1000) / 1000)
      dy.push(Math.round((p.y - v) * 1000) / 1000)
    }
  }
  return { dx, dy }
}

/** Maps a point of the text box (centre origin, in object units) through the warp. */
export function warpLocal(spec: WarpSpec, w: number, h: number, x: number, y: number): Pt {
  const p = warpPoint(spec, (x + w / 2) / w, (y + h / 2) / h)
  return { x: p.x * w - w / 2, y: p.y * h - h / 2 }
}

/** The inverse of `warpLocal`: the point of the flat text that appears at (x, y). */
export function unwarpLocal(spec: WarpSpec, w: number, h: number, x: number, y: number): Pt {
  const p = unwarpPoint(spec, (x + w / 2) / w, (y + h / 2) / h)
  return { x: p.x * w - w / 2, y: p.y * h - h / 2 }
}

type Ctx = CanvasRenderingContext2D
const MAX_SIDE = 4096
const CELL = 20
const SEAM = 0.7

export interface WarpCache {
  key: string
  canvas: HTMLCanvasElement
  fullW: number
  fullH: number
  mx: number
  my: number
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** Draws the part of `src` inside triangle s0-s1-s2 onto triangle d0-d1-d2 of `ctx` (an affine fit). */
function drawTriangle(ctx: Ctx, src: HTMLCanvasElement, s: readonly Pt[], d: readonly Pt[]): void {
  const [s0, s1, s2] = s
  const det = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y)
  if (Math.abs(det) < 1e-9) return
  const [d0, d1, d2] = d
  const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / det
  const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / det
  const e = (d0.x * (s1.x * s2.y - s2.x * s1.y) + d1.x * (s2.x * s0.y - s0.x * s2.y) + d2.x * (s0.x * s1.y - s1.x * s0.y)) / det
  const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / det
  const dd = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / det
  const f = (d0.y * (s1.x * s2.y - s2.x * s1.y) + d1.y * (s2.x * s0.y - s0.x * s2.y) + d2.y * (s0.x * s1.y - s1.x * s0.y)) / det

  // Grow the clip a little so neighbouring triangles overlap instead of leaving hairline seams.
  const cx = (d0.x + d1.x + d2.x) / 3
  const cy = (d0.y + d1.y + d2.y) / 3
  const grow = (p: Pt): Pt => {
    const dx = p.x - cx
    const dy = p.y - cy
    const len = Math.hypot(dx, dy) || 1
    return { x: p.x + (dx / len) * SEAM, y: p.y + (dy / len) * SEAM }
  }
  const g0 = grow(d0)
  const g1 = grow(d1)
  const g2 = grow(d2)

  const minX = Math.max(0, Math.floor(Math.min(s0.x, s1.x, s2.x)) - 1)
  const minY = Math.max(0, Math.floor(Math.min(s0.y, s1.y, s2.y)) - 1)
  const maxX = Math.min(src.width, Math.ceil(Math.max(s0.x, s1.x, s2.x)) + 1)
  const maxY = Math.min(src.height, Math.ceil(Math.max(s0.y, s1.y, s2.y)) + 1)
  if (maxX <= minX || maxY <= minY) return

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(g0.x, g0.y)
  ctx.lineTo(g1.x, g1.y)
  ctx.lineTo(g2.x, g2.y)
  ctx.closePath()
  ctx.clip()
  ctx.setTransform(a, b, c, dd, e, f)
  ctx.drawImage(src, minX, minY, maxX - minX, maxY - minY, minX, minY, maxX - minX, maxY - minY)
  ctx.restore()
}

/**
 * Draws `draw` (the flat text) through the warp. `slot` keeps the finished picture between paints:
 * while `signature` is unchanged the cached picture is blitted again. Falls back to the flat drawing when a
 * canvas cannot be made (tests without a canvas, or a size the browser refuses).
 */
export function drawWarped(obj: FabricObject, ctx: Ctx, draw: (ctx: Ctx) => void, spec: WarpSpec, signature: string, slot: { cache?: WarpCache }): void {
  const w = obj.width
  const h = obj.height
  const m = ctx.getTransform?.()
  const zoom = m ? Math.hypot(m.a, m.b) || 1 : 1
  const mx = Math.ceil(w * 0.18 + 40)
  const my = Math.ceil(h * 0.8 + 40)
  const fullW = w + 2 * mx
  const fullH = h + 2 * my
  const s = Math.min(zoom, MAX_SIDE / fullW, MAX_SIDE / fullH)
  const pw = Math.max(1, Math.round(fullW * s))
  const ph = Math.max(1, Math.round(fullH * s))
  const key = `${pw}x${ph}|${signature}`

  let cache = slot.cache
  if (!cache || cache.key !== key) {
    const src = makeCanvas(pw, ph)
    const dst = makeCanvas(pw, ph)
    const sctx = src?.getContext('2d')
    const dctx = dst?.getContext('2d')
    if (!src || !dst || !sctx || !dctx) return draw(ctx)

    sctx.setTransform(s, 0, 0, s, (mx + w / 2) * s, (my + h / 2) * s)
    draw(sctx)

    const textLeft = mx * s
    const textTop = my * s
    const textW = w * s
    const textH = h * s
    const cols = Math.min(120, Math.max(16, Math.round(fullW / CELL)))
    const rows = Math.min(60, Math.max(6, Math.round(fullH / CELL)))
    const from: Pt[] = []
    const to: Pt[] = []
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const sx = (i / cols) * pw
        const sy = (j / rows) * ph
        const p = warpPoint(spec, (sx - textLeft) / textW, (sy - textTop) / textH)
        from.push({ x: sx, y: sy })
        to.push({ x: textLeft + p.x * textW, y: textTop + p.y * textH })
      }
    }
    const at = (i: number, j: number): number => j * (cols + 1) + i
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = at(i, j)
        const b = at(i + 1, j)
        const c = at(i, j + 1)
        const d = at(i + 1, j + 1)
        drawTriangle(dctx, src, [from[a], from[b], from[c]], [to[a], to[b], to[c]])
        drawTriangle(dctx, src, [from[b], from[d], from[c]], [to[b], to[d], to[c]])
      }
    }
    cache = { key, canvas: dst, fullW, fullH, mx, my }
    slot.cache = cache
  }

  ctx.drawImage(cache.canvas, -w / 2 - cache.mx, -h / 2 - cache.my, cache.fullW, cache.fullH)
}
