import type { Dieline, MockupShape } from './dielines'

export type MockupContainer = 'tub' | 'pouch' | 'can' | 'box'

const CONTAINERS: Record<MockupShape, MockupContainer> = {
  tub: 'tub',
  jar: 'tub',
  bottle: 'can',
  dropper: 'can',
  can: 'can',
  pouch: 'pouch',
  sachet: 'pouch',
  tube: 'can',
  box: 'box',
  flat: 'pouch',
}

/** The 3D model that suits a dieline. */
export const containerFor = (d: Dieline): MockupContainer => CONTAINERS[d.mockup.shape]

/** A texture window in UV space (v counts from the bottom): where a rectangle of the flat artwork lies. */
export interface UvWindow {
  offsetX: number
  offsetY: number
  repeatX: number
  repeatY: number
}

/** The window of one panel (its full width and, for a box, only the body rows between the flaps). */
export function panelUv(d: Dieline, panelId: string): UvWindow {
  const p = d.panels.find((q) => q.id === panelId) ?? d.panels[0]
  const [top, bottom] = d.kind === 'box' && d.hFolds.length === 2 && p.role !== 'glue' ? d.hFolds : [0, d.heightMm]
  return { offsetX: p.x / d.widthMm, repeatX: p.w / d.widthMm, offsetY: 1 - bottom / d.heightMm, repeatY: (bottom - top) / d.heightMm }
}

/** The texture offset that turns a wrap so the facing panel's centre is at the front of a cylinder (u = 0 faces the camera). */
export function wrapOffset(d: Dieline): number {
  const p = d.panels.find((q) => q.id === d.mockup.facing) ?? d.panels[0]
  return (p.x + p.w / 2) / d.widthMm
}

/** Height of a cylinder of the given radius that shows a wrap label without stretching it. */
export function wrapHeight(d: Dieline, radius: number): number {
  return (2 * Math.PI * radius * d.heightMm) / d.widthMm
}

/**
 * A cylinder container built from the label's real size, all in millimetres. A wrap label goes once round the body, so the body's radius is the label's
 * width over 2π and its label height is the label's height: the picture is never stretched, and a 450 x 140 mm tub is a bigger jar than a 310 x 85 mm one.
 * The proportions of the lid, shoulder and base follow how real tubs and jars are made (a big wide-mouth tub has a lower lid than a small jar).
 */
export interface CylinderSpec {
  radiusMm: number
  /** The label's own height. */
  labelHeightMm: number
  /** The body, label plus the bare margin above and below it. */
  bodyHeightMm: number
  lidHeightMm: number
  lidRadiusMm: number
  baseHeightMm: number
  shoulderMm: number
  /** Body, lid and base together. */
  totalHeightMm: number
  /** The widest part. */
  maxWidthMm: number
}

export function cylinderSpec(labelWidthMm: number, labelHeightMm: number, kind: 'tub' | 'can'): CylinderSpec {
  const radius = Math.max(8, labelWidthMm / (2 * Math.PI))
  const d = radius * 2
  const bigTub = kind === 'tub' && radius >= 55
  const margin = Math.max(kind === 'can' ? 3 : 4, d * (bigTub ? 0.05 : 0.04))
  const bodyHeight = labelHeightMm + 2 * margin
  const lidHeight = kind === 'can' ? Math.max(4, d * 0.06) : Math.max(14, d * (bigTub ? 0.17 : 0.25))
  const lidRadius = kind === 'can' ? radius * 1.005 : radius * (bigTub ? 1.035 : 1.05)
  const baseHeight = Math.max(3, d * 0.03)
  const shoulder = kind === 'can' ? 0 : Math.max(3, d * 0.05)
  return {
    radiusMm: radius,
    labelHeightMm,
    bodyHeightMm: bodyHeight,
    lidHeightMm: lidHeight,
    lidRadiusMm: lidRadius,
    baseHeightMm: baseHeight,
    shoulderMm: shoulder,
    totalHeightMm: bodyHeight + lidHeight + baseHeight + shoulder,
    maxWidthMm: lidRadius * 2,
  }
}

/** How many scene units one millimetre is, so the whole model fits a view `fit` units across. */
export function sceneScale(maxExtentMm: number, fit = 2.6): number {
  return fit / Math.max(1, maxExtentMm)
}

/** The multiplier at which to export the artwork as a texture: as sharp as the graphics card takes (at most 8192 px wide), never blurrier than 1.5x. */
export function textureMultiplier(pageWidthPx: number, maxTexture: number, ceiling = 8192): number {
  const target = Math.min(Math.max(1024, maxTexture || 4096), ceiling)
  return Math.min(8, Math.max(1.5, target / Math.max(1, pageWidthPx)))
}

export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 4

export const clampZoom = (z: number): number => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number.isFinite(z) ? z : 1))

/** The camera distance that frames a model `extent` units across with a field of view of `fovDeg`, then moves in or out with the zoom. */
export function cameraDistance(extent: number, fovDeg: number, aspect: number, zoom: number): number {
  const half = extent / 2
  const vertical = half / Math.tan((fovDeg * Math.PI) / 360)
  const horizontal = half / (Math.tan((fovDeg * Math.PI) / 360) * Math.max(0.3, aspect))
  return (Math.max(vertical, horizontal) * 1.25) / clampZoom(zoom)
}

/** Which panel goes on which face of a box or pouch: the front, the back (or the front again), and the sides. */
export function faceMap(d: Dieline): { front: string; back: string; side: string } {
  const by = (role: string) => d.panels.find((p) => p.role === role)?.id
  const front = d.mockup.facing && d.panels.some((p) => p.id === d.mockup.facing) ? d.mockup.facing : (by('front') ?? d.panels[0].id)
  return { front, back: d.panels.find((p) => p.id === 'back')?.id ?? by('info') ?? by('story') ?? front, side: by('side') ?? front }
}
