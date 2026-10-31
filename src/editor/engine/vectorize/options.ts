/** What the user can ask of a trace, and the presets of the toolbar. Kept apart from the tracer so the editor does not load it. */
export interface TraceOptions {
  /** Colours to keep (2-32). */
  colors: number
  /** 0 = rough and light, 1 = every small curve and speck. */
  detail: number
  /** 0 = sharp edges, 1 = softened before tracing (cleans noisy or compressed pictures). */
  smooth: number
  /** Drop the colour that fills the picture's border (a white box around a logo) so the shape is cut out. */
  dropBackground: boolean
}

export type TracePresetId = 'logo' | 'icon' | 'illustration'

export const TRACE_COLORS_RANGE = [2, 32] as const

export const TRACE_PRESETS: Record<TracePresetId, TraceOptions> = {
  logo: { colors: 6, detail: 0.75, smooth: 0.2, dropBackground: true },
  icon: { colors: 3, detail: 0.85, smooth: 0.1, dropBackground: true },
  illustration: { colors: 16, detail: 0.55, smooth: 0.35, dropBackground: false },
}

export interface TraceResult {
  svg: string
  width: number
  height: number
  /** Colours in the result (one path each). */
  colors: string[]
  /** Size of the SVG text, in characters. */
  size: number
}
