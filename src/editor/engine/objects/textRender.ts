/**
 * One render hook for the effects that change how a text object is painted (3D depth, warp). The
 * object's own `_render` is wrapped once; the hook reads the current specs, so turning either effect
 * on or off never stacks wrappers or clobbers the other.
 *
 * The painted area can be larger than the text box (a warp lifts lines, depth reaches sideways), so
 * while an effect is on the selection also draws a dashed outline of that area and a click anywhere
 * on it selects the text (see `installPaintedAreaHitTest`).
 */
import { type Canvas, type FabricObject, Point, util } from 'fabric'
import type { ExtrudeSpec, WarpSpec } from '@/types/document'
import { drawExtruded } from './extrude'
import { type Pt, type WarpCache, drawWarped, isWarpActive, unwarpLocal, warpLocal, warpPoint } from './warp'

type Ctx = CanvasRenderingContext2D
type Hooked = FabricObject & {
  _render(ctx: Ctx): void
  strokeBorders(ctx: Ctx, size: Point): void
  _calculateCurrentDimensions(): Point
  _getNonTransformedDimensions(): Point
  isEditing?: boolean
  __baseRender?: (ctx: Ctx) => void
  __extrude?: ExtrudeSpec
  __warp?: WarpSpec
  __warpSlot?: { cache?: WarpCache }
  /** Whether a scene point lies on the painted area that sticks out of the text box. */
  __paintedHit?: (scene: Point) => boolean
  /** IText only: the caret, the selection and the click-to-character lookup. */
  _renderCursor?: (ctx: Ctx, ...rest: unknown[]) => void
  _renderSelection?: (ctx: Ctx, ...rest: unknown[]) => void
  getSelectionStartFromPointer?: (e: unknown) => number
}

export interface Extent {
  left: number
  top: number
  right: number
  bottom: number
}

const EXTENT_STEPS = 24

/** The painted area of a text, relative to its centre: the text box grown by the warp and by the depth. */
export function visualExtent(width: number, height: number, extrude: ExtrudeSpec | undefined, warp: WarpSpec | undefined): Extent {
  const e: Extent = { left: -width / 2, top: -height / 2, right: width / 2, bottom: height / 2 }
  if (isWarpActive(warp)) {
    for (let j = 0; j <= EXTENT_STEPS / 4; j++) {
      for (let i = 0; i <= EXTENT_STEPS; i++) {
        const p = warpPoint(warp, i / EXTENT_STEPS, (j * 4) / EXTENT_STEPS)
        const x = -width / 2 + p.x * width
        const y = -height / 2 + p.y * height
        e.left = Math.min(e.left, x)
        e.right = Math.max(e.right, x)
        e.top = Math.min(e.top, y)
        e.bottom = Math.max(e.bottom, y)
      }
    }
  }
  if (extrude && extrude.depth > 0) {
    const rad = (extrude.angle * Math.PI) / 180
    const dx = Math.cos(rad) * extrude.depth
    const dy = Math.sin(rad) * extrude.depth
    e.left += Math.min(0, dx)
    e.right += Math.max(0, dx)
    e.top += Math.min(0, dy)
    e.bottom += Math.max(0, dy)
  }
  return e
}

function extentOf(o: Hooked): Extent | null {
  const e = visualExtent(o.width, o.height, o.__extrude, o.__warp)
  const grows = e.left < -o.width / 2 - 1 || e.right > o.width / 2 + 1 || e.top < -o.height / 2 - 1 || e.bottom > o.height / 2 + 1
  return grows ? e : null
}

/** Everything the painted picture depends on, so a cached warp is reused only while it is still right. */
export function paintSignature(o: Hooked): string {
  const paint = (v: unknown): unknown => (v && typeof v === 'object' && 'toObject' in v ? (v as { toObject(): unknown }).toObject() : v)
  const t = o as unknown as Record<string, unknown>
  return JSON.stringify([
    t.text, t.fontSize, t.fontFamily, t.fontWeight, t.fontStyle, t.charSpacing, t.lineHeight, t.textAlign, t.underline, t.linethrough,
    o.width, o.height, paint(o.fill), paint(o.stroke), o.strokeWidth, t.textBackgroundColor, t.styles, !!t.path, o.__extrude, o.__warp,
  ])
}

function installSelectionHelpers(o: Hooked): void {
  if (Object.prototype.hasOwnProperty.call(o, 'strokeBorders')) return
  const baseBorders = o.strokeBorders
  o.strokeBorders = function (this: Hooked, ctx: Ctx, size: Point): void {
    baseBorders.call(this, ctx, size)
    const e = extentOf(this)
    if (!e) return
    const cur = this._calculateCurrentDimensions()
    const plain = this._getNonTransformedDimensions()
    const rx = cur.x / plain.x
    const ry = cur.y / plain.y
    ctx.save()
    ctx.setLineDash([4, 3])
    ctx.strokeRect(e.left * rx, e.top * ry, (e.right - e.left) * rx, (e.bottom - e.top) * ry)
    ctx.restore()
  }
  o.__paintedHit = function (this: Hooked, scene: Point): boolean {
    const e = extentOf(this)
    if (!e) return false
    const p = util.sendPointToPlane(scene, undefined, this.calcTransformMatrix())
    return p.x >= e.left && p.x <= e.right && p.y >= e.top && p.y <= e.bottom
  }
}

function removeSelectionHelpers(o: Hooked): void {
  delete (o as Partial<Hooked>).strokeBorders
  delete o.__paintedHit
}

/** Fills the rectangle (x, y, w, h) as it looks after `map`: its outline is followed point by point so a bent line stays bent. */
export function fillWarpedRect(ctx: Ctx, map: (x: number, y: number) => Pt, x: number, y: number, w: number, h: number): void {
  const across = Math.min(40, Math.max(1, Math.ceil(Math.abs(w) / 8)))
  const down = Math.min(12, Math.max(1, Math.ceil(Math.abs(h) / 16)))
  const ring: Pt[] = []
  for (let i = 0; i <= across; i++) ring.push(map(x + (w * i) / across, y))
  for (let j = 1; j <= down; j++) ring.push(map(x + w, y + (h * j) / down))
  for (let i = across - 1; i >= 0; i--) ring.push(map(x + (w * i) / across, y + h))
  for (let j = down - 1; j >= 1; j--) ring.push(map(x, y + (h * j) / down))
  ctx.beginPath()
  ring.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.closePath()
  ctx.fill()
}

/** A view of `ctx` whose `fillRect` draws the warped shape; everything else goes straight through. */
function warpedContext(ctx: Ctx, map: (x: number, y: number) => Pt): Ctx {
  return new Proxy(ctx, {
    get(target, prop) {
      if (prop === 'fillRect') return (x: number, y: number, w: number, h: number): void => fillWarpedRect(target, map, x, y, w, h)
      const value = Reflect.get(target, prop, target) as unknown
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value
    },
    set: (target, prop, value) => Reflect.set(target, prop, value, target),
  })
}

/**
 * Typing in warped text: the caret and the selection are drawn on the warped letters, and a click or a
 * drag lands on the character that is shown under the pointer (the click is un-warped before Fabric reads it).
 */
function installEditingHelpers(o: Hooked): void {
  if (typeof o._renderCursor !== 'function' || Object.prototype.hasOwnProperty.call(o, '_renderCursor')) return
  const baseCursor = o._renderCursor
  const baseSelection = o._renderSelection as (ctx: Ctx, ...rest: unknown[]) => void
  const basePointer = o.getSelectionStartFromPointer as (e: unknown) => number
  const mapOf = (self: Hooked): ((x: number, y: number) => Pt) | null => {
    const warp = self.__warp
    return warp ? (x, y) => warpLocal(warp, self.width, self.height, x, y) : null
  }
  o._renderCursor = function (this: Hooked, ctx: Ctx, ...rest: unknown[]): void {
    const map = mapOf(this)
    baseCursor.call(this, map ? warpedContext(ctx, map) : ctx, ...rest)
  }
  o._renderSelection = function (this: Hooked, ctx: Ctx, ...rest: unknown[]): void {
    const map = mapOf(this)
    baseSelection.call(this, map ? warpedContext(ctx, map) : ctx, ...rest)
  }
  o.getSelectionStartFromPointer = function (this: Hooked, e: unknown): number {
    const warp = this.__warp
    const canvas = this.canvas as (Canvas & { getScenePoint(ev: unknown): Point }) | undefined
    if (!warp || !canvas) return basePointer.call(this, e)
    const hadOwn = Object.prototype.hasOwnProperty.call(canvas, 'getScenePoint')
    const original = canvas.getScenePoint
    canvas.getScenePoint = (ev: unknown): Point => {
      const scene = original.call(canvas, ev)
      const matrix = this.calcTransformMatrix()
      const local = util.sendPointToPlane(scene, undefined, matrix)
      const flat = unwarpLocal(warp, this.width, this.height, local.x, local.y)
      return util.transformPoint(new Point(flat.x, flat.y), matrix)
    }
    try {
      return basePointer.call(this, e)
    } finally {
      if (hadOwn) canvas.getScenePoint = original
      else delete (canvas as Partial<typeof canvas>).getScenePoint
    }
  }
}

function removeEditingHelpers(o: Hooked): void {
  delete o._renderCursor
  delete o._renderSelection
  delete o.getSelectionStartFromPointer
}

type AreaCheck = (obj: FabricObject, point: Point) => boolean

/**
 * Makes a click on the painted area of an effect text (warp lifts letters above the box, depth reaches
 * sideways) pick the text, not only a click inside its box. Fabric decides hits through this canvas method.
 */
export function installPaintedAreaHitTest(canvas: Canvas): void {
  const c = canvas as unknown as { _pointIsInObjectSelectionArea: AreaCheck }
  const base = c._pointIsInObjectSelectionArea
  c._pointIsInObjectSelectionArea = function (this: Canvas, obj: FabricObject, point: Point): boolean {
    return base.call(this, obj, point) || (obj as Hooked).__paintedHit?.(point) === true
  }
}

/** Sets the painting effects of `obj`; undefined (or zero depth / a warp that bends nothing) turns one off. */
export function syncTextRender(obj: FabricObject, effects: { extrude?: ExtrudeSpec; warp?: WarpSpec }): void {
  const o = obj as Hooked
  const extrude = effects.extrude && effects.extrude.depth > 0 ? effects.extrude : undefined
  const warp = isWarpActive(effects.warp) ? effects.warp : undefined
  o.__extrude = extrude
  o.__warp = warp

  if (!extrude && !warp) {
    if (o.__baseRender) {
      o._render = o.__baseRender
      delete o.__baseRender
      delete o.__warpSlot
      removeSelectionHelpers(o)
      removeEditingHelpers(o)
      obj.set({ objectCaching: true, dirty: true })
    }
    return
  }
  if (warp) installEditingHelpers(o)
  else {
    delete o.__warpSlot
    removeEditingHelpers(o)
  }
  if (!o.__baseRender) {
    o.__baseRender = o._render
    o._render = function (this: Hooked, ctx: Ctx): void {
      const base = this.__baseRender as (ctx: Ctx) => void
      const ex = this.__extrude
      const wp = this.__warp
      const draw = (c: Ctx): void => (ex ? drawExtruded(this, c, base, ex) : base.call(this, c))
      if (wp) {
        this.__warpSlot ??= {}
        drawWarped(this, ctx, draw, wp, paintSignature(this), this.__warpSlot)
      } else draw(ctx)
    }
    installSelectionHelpers(o)
  }
  // Cached bitmaps are cropped to the plain bounds, so draw straight to the canvas.
  obj.set({ objectCaching: false, dirty: true })
}
