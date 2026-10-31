/**
 * 3D / extruded text: the glyphs are re-drawn as a stack of offset copies behind the face, shaded from
 * `color` (next to the face) to `color2` (far end). The object stays a normal live text layer; the
 * copies are drawn by the shared render hook (see textRender.ts), so it can still be edited, curved,
 * recoloured and serialised.
 */
import type { FabricObject } from 'fabric'
import type { ExtrudeSpec } from '@/types/document'

export const DEFAULT_EXTRUDE: ExtrudeSpec = { depth: 14, angle: 45, color: '#7a3b12', color2: '#2b1204' }
export const EXTRUDE_MAX_DEPTH = 80

type Ctx = CanvasRenderingContext2D

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6)
  const n = Number.parseInt(f, 16)
  return Number.isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Colour of layer `i` of `n` (0 = against the face). */
export function layerColor(spec: ExtrudeSpec, i: number, n: number): string {
  const [r1, g1, b1] = hexToRgb(spec.color)
  const [r2, g2, b2] = hexToRgb(spec.color2 ?? spec.color)
  const k = n <= 1 ? 0 : i / (n - 1)
  const mix = (a: number, b: number): number => Math.round(a + (b - a) * k)
  return `rgb(${mix(r1, r2)},${mix(g1, g2)},${mix(b1, b2)})`
}

/** Offset of layer `i` (1-based) for a depth direction in degrees (0 = right, 90 = down). */
export function layerOffset(spec: ExtrudeSpec, i: number): { x: number; y: number } {
  const rad = (spec.angle * Math.PI) / 180
  return { x: Math.cos(rad) * i, y: Math.sin(rad) * i }
}

/** Draws the depth copies (far end first) and then the face, using `base` for each pass. */
export function drawExtruded(obj: FabricObject, ctx: Ctx, base: (ctx: Ctx) => void, spec: ExtrudeSpec): void {
  const n = Math.min(EXTRUDE_MAX_DEPTH, Math.max(1, Math.round(spec.depth)))
  const { fill, stroke } = obj
  const hadStroke = !!stroke && (obj.strokeWidth ?? 0) > 0
  ctx.save()
  ctx.shadowColor = 'transparent'
  for (let i = n; i >= 1; i--) {
    const c = layerColor(spec, i - 1, n)
    const { x, y } = layerOffset(spec, i)
    obj.fill = c
    if (hadStroke) obj.stroke = c
    ctx.save()
    ctx.translate(x, y)
    base.call(obj, ctx)
    ctx.restore()
  }
  ctx.restore()
  obj.fill = fill
  obj.stroke = stroke
  base.call(obj, ctx)
}
