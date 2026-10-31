/**
 * Title styles: one-click looks for headlines. Each style is only a fill, a font tweak and the same
 * declarative `effects` the Effects panel edits, so applying one leaves a normal live text layer
 * the user can keep adjusting (colour, depth, outline, curve...).
 */
import type { ObjectEffects, TextCase } from '@/types/document'
import type { FillSpec } from '../objects/fills'

export type TitleStyleGroup = 'threeD' | 'metallic' | 'brush' | 'retro' | 'neon' | 'outline' | 'food'

export interface TitleStyle {
  id: string
  label: string
  group: TitleStyleGroup
  fill: FillSpec
  effects: ObjectEffects
  fontFamily?: string
  fontWeight?: number
  charSpacing?: number
  textCase?: TextCase
  /** Background the preview tile sits on, so light and dark styles stay readable. */
  on?: 'light' | 'dark'
}

export const TITLE_STYLE_GROUPS: readonly { id: TitleStyleGroup; label: string }[] = [
  { id: 'threeD', label: '3D' },
  { id: 'metallic', label: 'Metallic' },
  { id: 'brush', label: 'Brush & hand' },
  { id: 'retro', label: 'Retro' },
  { id: 'neon', label: 'Neon & glow' },
  { id: 'outline', label: 'Outline & sticker' },
  { id: 'food', label: 'Food & packaging' },
]

const solid = (color: string): FillSpec => ({ type: 'solid', color })
/** Vertical gradient (top to bottom) with evenly spaced stops. */
const gradient = (angle: number, colors: string[]): FillSpec => ({
  type: 'gradient',
  kind: 'linear',
  angle,
  stops: colors.map((color, i) => ({ offset: colors.length === 1 ? 0 : i / (colors.length - 1), color })),
})
const vertical = (...colors: string[]): FillSpec => gradient(90, colors)
const diagonal = (...colors: string[]): FillSpec => gradient(45, colors)
const hollow = solid('transparent')

const SERIF = 'Fraunces'
const SCRIPT = 'Caveat'
const ROUND = 'Nunito'

export const TITLE_STYLES: readonly TitleStyle[] = [
  /* ------------------------------------------------------------------ 3D */
  { id: 'kulfi-brown', label: 'Kulfi', group: 'threeD', fill: vertical('#f0b46a', '#8a4310', '#4a1d06'), effects: { extrude: { depth: 16, angle: 120, color: '#4a1d06', color2: '#1a0a02' }, outline: { color: '#2a1004', width: 2 } }, fontWeight: 900 },
  { id: 'block-red', label: 'Block red', group: 'threeD', fill: solid('#ff4d4d'), effects: { extrude: { depth: 18, angle: 45, color: '#9b1c1c', color2: '#4a0b0b' } }, fontWeight: 900 },
  { id: 'sky-pop', label: 'Sky pop', group: 'threeD', fill: solid('#ffffff'), effects: { extrude: { depth: 16, angle: 90, color: '#2563eb', color2: '#1e3a8a' } }, fontWeight: 900, on: 'dark' },
  { id: 'gold-bevel', label: 'Gold bevel', group: 'threeD', fill: vertical('#fff3b0', '#e6b422', '#b07d00'), effects: { extrude: { depth: 12, angle: 90, color: '#8a5a00', color2: '#3a2400' }, outline: { color: '#5a3a00', width: 2 } }, fontWeight: 900 },
  { id: 'neon-lime-3d', label: 'Lime block', group: 'threeD', fill: solid('#d9ff3f'), effects: { extrude: { depth: 14, angle: 45, color: '#3f8f00', color2: '#143600' } }, fontWeight: 900, on: 'dark' },
  { id: 'deep-purple', label: 'Deep purple', group: 'threeD', fill: solid('#f3e8ff'), effects: { extrude: { depth: 18, angle: 135, color: '#7c3aed', color2: '#2e1065' } }, fontWeight: 900, on: 'dark' },
  { id: 'long-shadow', label: 'Long shadow', group: 'threeD', fill: solid('#ffffff'), effects: { extrude: { depth: 60, angle: 45, color: '#374151', color2: '#111827' } }, fontWeight: 800, on: 'dark' },
  { id: 'isometric-mint', label: 'Isometric', group: 'threeD', fill: solid('#ecfeff'), effects: { extrude: { depth: 22, angle: 30, color: '#0d9488', color2: '#134e4a' } }, fontWeight: 900, on: 'dark' },

  /* ------------------------------------------------------------ Metallic */
  { id: 'gold-foil', label: 'Gold foil', group: 'metallic', fill: vertical('#fff3b0', '#e6b422', '#9a6b00', '#f7d96b'), effects: { outline: { color: '#6b4700', width: 2 }, shadow: { color: '#00000066', blur: 6, offsetX: 2, offsetY: 3 } }, fontWeight: 900, on: 'dark' },
  { id: 'silver-chrome', label: 'Chrome', group: 'metallic', fill: vertical('#ffffff', '#9ca3af', '#f3f4f6', '#6b7280'), effects: { outline: { color: '#374151', width: 2 }, shadow: { color: '#00000066', blur: 6, offsetX: 2, offsetY: 3 } }, fontWeight: 900, on: 'dark' },
  { id: 'rose-gold', label: 'Rose gold', group: 'metallic', fill: vertical('#ffe4e1', '#e8a598', '#b76e79', '#f4c2c2'), effects: { outline: { color: '#7a3b45', width: 2 } }, fontWeight: 800, on: 'dark' },
  { id: 'bronze', label: 'Bronze', group: 'metallic', fill: vertical('#f0b27a', '#a04000', '#e59866'), effects: { outline: { color: '#4a1d00', width: 2 }, shadow: { color: '#00000066', blur: 5, offsetX: 2, offsetY: 3 } }, fontWeight: 900 },
  { id: 'copper', label: 'Copper', group: 'metallic', fill: vertical('#ffd1a8', '#c8693a', '#7c3416', '#e8905c'), effects: { extrude: { depth: 6, angle: 90, color: '#5a2610', color2: '#2f1308' } }, fontWeight: 900 },
  { id: 'steel-blue', label: 'Steel blue', group: 'metallic', fill: vertical('#e0f2fe', '#60a5fa', '#1e3a8a'), effects: { outline: { color: '#0f172a', width: 2 }, glow: { color: '#3b82f6', blur: 14 } }, fontWeight: 900, on: 'dark' },

  /* -------------------------------------------------------- Brush & hand */
  { id: 'brush-script', label: 'Brush script', group: 'brush', fill: solid('#1f2937'), effects: { shadow: { color: '#00000033', blur: 3, offsetX: 2, offsetY: 3 } }, fontFamily: SCRIPT, fontWeight: 700 },
  { id: 'ink-brush', label: 'Ink', group: 'brush', fill: solid('#0b0b0f'), effects: { outline: { color: '#0b0b0f', width: 2 } }, fontFamily: SCRIPT, fontWeight: 700 },
  { id: 'paint-red', label: 'Paint red', group: 'brush', fill: solid('#dc2626'), effects: { shadow: { color: '#7f1d1d55', blur: 4, offsetX: 3, offsetY: 4 } }, fontFamily: SCRIPT, fontWeight: 700 },
  { id: 'chalk', label: 'Chalk', group: 'brush', fill: solid('#f8fafc'), effects: { glow: { color: '#ffffff', blur: 4 } }, fontFamily: SCRIPT, fontWeight: 700, on: 'dark' },
  { id: 'marker', label: 'Marker', group: 'brush', fill: solid('#111827'), effects: { background: { color: '#fde047' } }, fontFamily: SCRIPT, fontWeight: 700 },
  { id: 'cream-script', label: 'Cream script', group: 'brush', fill: solid('#fff7e6'), effects: { outline: { color: '#5b2a0c', width: 3 }, shadow: { color: '#00000055', blur: 4, offsetX: 3, offsetY: 4 } }, fontFamily: SCRIPT, fontWeight: 700, on: 'dark' },

  /* --------------------------------------------------------------- Retro */
  { id: 'retro-sunset', label: 'Sunset', group: 'retro', fill: vertical('#ffd166', '#ef476f'), effects: { extrude: { depth: 8, angle: 45, color: '#7b2cbf', color2: '#3c096c' } }, fontWeight: 900, on: 'dark' },
  { id: 'seventies-orange', label: '70s', group: 'retro', fill: solid('#f97316'), effects: { extrude: { depth: 6, angle: 45, color: '#7c2d12' } }, fontFamily: SERIF, fontWeight: 900 },
  { id: 'vintage-cream', label: 'Vintage', group: 'retro', fill: solid('#fef3c7'), effects: { outline: { color: '#78350f', width: 3 }, shadow: { color: '#78350f', blur: 0, offsetX: 4, offsetY: 4 } }, fontFamily: SERIF, fontWeight: 900 },
  { id: 'arcade', label: 'Arcade', group: 'retro', fill: solid('#fde047'), effects: { outline: { color: '#dc2626', width: 4 }, extrude: { depth: 8, angle: 45, color: '#7f1d1d' } }, fontWeight: 900, on: 'dark' },
  { id: 'diner', label: 'Diner', group: 'retro', fill: solid('#ffffff'), effects: { outline: { color: '#1d4ed8', width: 4 }, extrude: { depth: 7, angle: 45, color: '#dc2626' } }, fontWeight: 900 },
  { id: 'western', label: 'Western', group: 'retro', fill: solid('#92400e'), effects: { extrude: { depth: 5, angle: 60, color: '#451a03' } }, fontFamily: SERIF, fontWeight: 900, textCase: 'upper' },

  /* ------------------------------------------------------- Neon & glow */
  { id: 'neon-pink', label: 'Neon pink', group: 'neon', fill: solid('#ffffff'), effects: { outline: { color: '#ff2d95', width: 2 }, glow: { color: '#ff2d95', blur: 24 } }, fontWeight: 800, on: 'dark' },
  { id: 'neon-cyan', label: 'Neon cyan', group: 'neon', fill: solid('#ffffff'), effects: { outline: { color: '#22d3ee', width: 2 }, glow: { color: '#22d3ee', blur: 24 } }, fontWeight: 800, on: 'dark' },
  { id: 'neon-green', label: 'Neon green', group: 'neon', fill: solid('#ecfccb'), effects: { outline: { color: '#84cc16', width: 2 }, glow: { color: '#84cc16', blur: 24 } }, fontWeight: 800, on: 'dark' },
  { id: 'electric-violet', label: 'Violet', group: 'neon', fill: solid('#f5f3ff'), effects: { outline: { color: '#8b5cf6', width: 2 }, glow: { color: '#8b5cf6', blur: 26 } }, fontWeight: 800, on: 'dark' },
  { id: 'fire', label: 'Fire', group: 'neon', fill: vertical('#fff200', '#ff6a00', '#d00000'), effects: { glow: { color: '#ff6a00', blur: 20 } }, fontWeight: 900, on: 'dark' },
  { id: 'ice', label: 'Ice', group: 'neon', fill: vertical('#ffffff', '#7dd3fc'), effects: { glow: { color: '#38bdf8', blur: 20 } }, fontWeight: 900, on: 'dark' },

  /* ------------------------------------------------- Outline & sticker */
  { id: 'sticker-white', label: 'Sticker', group: 'outline', fill: solid('#111827'), effects: { outline: { color: '#ffffff', width: 8 }, shadow: { color: '#00000055', blur: 6, offsetX: 0, offsetY: 4 } }, fontWeight: 900, on: 'dark' },
  { id: 'hollow-black', label: 'Hollow', group: 'outline', fill: hollow, effects: { outline: { color: '#111827', width: 3 } }, fontWeight: 900 },
  { id: 'hollow-white', label: 'Hollow white', group: 'outline', fill: hollow, effects: { outline: { color: '#ffffff', width: 3 } }, fontWeight: 900, on: 'dark' },
  { id: 'comic-pop', label: 'Comic pop', group: 'outline', fill: solid('#fde047'), effects: { outline: { color: '#111111', width: 5 }, extrude: { depth: 8, angle: 45, color: '#111111' } }, fontWeight: 900 },
  { id: 'bubble', label: 'Bubble', group: 'outline', fill: solid('#f472b6'), effects: { outline: { color: '#ffffff', width: 6 }, shadow: { color: '#be185d66', blur: 8, offsetX: 0, offsetY: 5 } }, fontFamily: ROUND, fontWeight: 900, on: 'dark' },

  /* ------------------------------------------------ Food & packaging */
  { id: 'candy', label: 'Candy', group: 'food', fill: diagonal('#f472b6', '#fbbf24'), effects: { outline: { color: '#ffffff', width: 4 }, shadow: { color: '#00000033', blur: 6, offsetX: 0, offsetY: 4 } }, fontFamily: ROUND, fontWeight: 900 },
  { id: 'chocolate', label: 'Chocolate', group: 'food', fill: vertical('#d2a679', '#6b3a14', '#3b1f0b'), effects: { extrude: { depth: 6, angle: 90, color: '#2a1305' } }, fontWeight: 900 },
  { id: 'organic-green', label: 'Organic', group: 'food', fill: vertical('#86efac', '#16a34a', '#14532d'), effects: { outline: { color: '#052e16', width: 2 } }, fontWeight: 900 },
  { id: 'premium-black', label: 'Premium', group: 'food', fill: solid('#111111'), effects: {}, fontWeight: 900, charSpacing: 120, textCase: 'upper' },
  { id: 'protein-power', label: 'Protein', group: 'food', fill: solid('#111111'), effects: { extrude: { depth: 10, angle: 45, color: '#c8a15a', color2: '#7a5a22' } }, fontWeight: 900, textCase: 'upper' },
  { id: 'fresh-citrus', label: 'Citrus', group: 'food', fill: vertical('#fef08a', '#fb923c'), effects: { outline: { color: '#9a3412', width: 3 }, extrude: { depth: 6, angle: 90, color: '#9a3412' } }, fontWeight: 900 },
]

export function titleStyleById(id: string): TitleStyle | undefined {
  return TITLE_STYLES.find((s) => s.id === id)
}
