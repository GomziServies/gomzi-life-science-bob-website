/**
 * Trace to vector: the selected picture (an AI icon, a logo, a badge) becomes an SVG element in the same place and
 * size. It is a normal element afterwards: every colour has a swatch in the toolbar, it scales without going soft and
 * the whole step is one undo.
 */
import type { FabricImage, FabricObject } from 'fabric'
import type { EditorEngine } from '../editor'
import { asDory } from '../objects/dory'
import { createElementFromSvg } from '../objects/factories'
import { TRACE_MAX_SIDE, type TraceOptions, type TraceResult, vectorize } from '../vectorize'
import { t } from '../../strings'

/** The `elementId` of a traced picture (what makes the toolbar offer one swatch per colour). */
export const TRACE_ELEMENT_ID = 'vector-trace'

const MIN_SCALE = 0.05
const MAX_SCALE = 4

export class VectorizeApi {
  constructor(private readonly engine: EditorEngine) {}

  /** The image that would be traced, or undefined when the selection is not exactly one picture. */
  private target(): FabricImage | undefined {
    const view = this.engine.activeView()
    const picked = view?.selectedObjects() ?? []
    const only = picked.length === 1 ? picked[0] : undefined
    return only && only.type === 'image' && !asDory(only).rawDoc ? (only as FabricImage) : undefined
  }

  /** The picture as the user sees it (crop and filters applied), at a size the tracer works well with. */
  private raster(img: FabricImage): { width: number; height: number; pixels: Uint8ClampedArray } {
    const side = Math.max(img.width, img.height, 1)
    const multiplier = Math.min(MAX_SCALE, Math.max(MIN_SCALE, TRACE_MAX_SIDE / side))
    const canvas = img.toCanvasElement({ multiplier, withoutTransform: true, withoutShadow: true, enableRetinaScaling: false })
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas')
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return { width: data.width, height: data.height, pixels: data.data }
  }

  /**
   * Traces the selected picture and swaps it for the vector. Resolves false when nothing was done (nothing to trace,
   * cancelled, or the selection moved on while the tracer worked); throws when tracing itself failed.
   */
  async traceSelected(options: TraceOptions, signal?: AbortSignal): Promise<boolean> {
    const view = this.engine.activeView()
    const img = this.target()
    if (!view || !img || this.engine.readOnly) return false
    const stale = (): boolean => signal?.aborted === true || this.target() !== img

    let result: TraceResult
    try {
      result = await vectorize(this.raster(img), options, signal)
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) return false
      throw error
    }
    if (stale()) return false

    const frameW = img.getScaledWidth()
    const frameH = img.getScaledHeight()
    const at = img.getCenterPoint()
    const next: FabricObject = await createElementFromSvg(result.svg, { x: at.x, y: at.y }, Math.max(frameW, frameH), { elementId: TRACE_ELEMENT_ID, name: t.ctx.vectorTrace })
    if (stale()) return false

    next.set({
      left: at.x,
      top: at.y,
      originX: 'center',
      originY: 'center',
      scaleX: frameW / Math.max(1, next.width),
      scaleY: frameH / Math.max(1, next.height),
      angle: img.angle,
      flipX: img.flipX,
      flipY: img.flipY,
      opacity: img.opacity,
      shadow: img.shadow,
    })
    const effects = asDory(img).effects
    if (effects) asDory(next).effects = effects
    const index = view.canvas.getObjects().indexOf(img)
    view.canvas.remove(img)
    view.configure(next)
    view.canvas.insertAt(Math.max(0, index), next)
    next.setCoords()
    view.selectObjects([next])
    view.canvas.requestRenderAll()
    this.engine.commit(this.engine.state.activePageId, { label: t.history.traceToVector })
    this.engine.announce(t.announce.traced(result.colors.length))
    return true
  }
}
