/**
 * Turns what the user filled in at /studio/new into a request for the AI-image label flow: the prompt for the artwork,
 * the user's own copy (which the small print is later set from, word for word), and the sizes.
 */
import type { BriefSpec } from './types'
import { type StudioUnit, toCanonicalPx } from './units'

/** The user's own texts, keyed by what they are. Empty ones are left out. */
export type LabelCopy = Record<string, string | string[]>

const line = (...parts: (string | undefined | null)[]): string => parts.map((p) => (p ?? '').trim()).filter(Boolean).join(' ')

/** Everything the user typed that belongs on the label as exact text. */
export function copyFromBrief(spec: BriefSpec): LabelCopy {
  const copy: LabelCopy = {}
  const put = (key: string, value: string | string[] | undefined): void => {
    const text = Array.isArray(value) ? value.map((v) => v.trim()).filter(Boolean) : (value ?? '').trim()
    if (Array.isArray(text) ? text.length > 0 : text.length > 0) copy[key] = text
  }

  put('ingredients', spec.other_ingredients)
  put('directions', spec.suggested_use)
  put('warnings', spec.cautions_warning)
  put('allergen_statement', spec.allergen_statement)
  put('tagline', spec.tagline)
  put('offer', spec.offer_details)
  put('mandatory', spec.mandatory_text)

  const rows = (spec.active_ingredients ?? []).map((i) => line(i.name, i.amount, i.dv)).filter(Boolean)
  const serving = line(spec.serving_size ? `Serving size: ${spec.serving_size}.` : '', spec.servings_per_container ? `Servings per container: ${spec.servings_per_container}.` : '')
  put('nutrition', serving ? [serving, ...rows] : rows)

  const c = spec.contact
  put('contact', [c?.address ?? '', c?.phone ? `Customer care: ${c.phone}` : '', c?.email ? `Email: ${c.email}` : '', c?.website ?? ''])
  return copy
}

export interface PromptInput {
  spec: BriefSpec
  brand: string
  product: string
  flavor: string
  category: string
  fontMood: string
  mustInclude: string
  mustAvoid: string
  brief: string
  logoMode: 'uploaded' | 'text' | 'none'
}

/** The wish sent to the artwork model (the server shapes it further). The user's own words are in the brief text. */
export function buildLabelPrompt(i: PromptInput): string {
  const parts = [
    `Packaging label artwork for ${i.brand}: ${i.product}${i.flavor ? `, ${i.flavor} flavour` : ''}.`,
    i.category ? `Product type: ${i.category.replace(/-/g, ' ')}.` : '',
    i.spec.product_category ? `Category: ${i.spec.product_category}.` : '',
    i.spec.aesthetic_vibe ? `Look and feel: ${i.spec.aesthetic_vibe}.` : '',
    i.spec.tone?.length ? `Tone: ${i.spec.tone.join(', ')}.` : '',
    i.spec.brand_colors?.length ? `Use the brand colours ${i.spec.brand_colors.join(', ')}.` : '',
    `Lettering mood: ${i.fontMood}.`,
    i.spec.dietary_badges?.length ? `Badges: ${i.spec.dietary_badges.join(', ')}.` : '',
    i.spec.key_message ? `Main message: ${i.spec.key_message}.` : '',
    i.mustInclude.trim() ? `Must include: ${i.mustInclude.trim()}.` : '',
    i.mustAvoid.trim() ? `Avoid: ${i.mustAvoid.trim()}.` : '',
    i.logoMode === 'uploaded' ? 'Leave a clean empty area for the brand logo, which is added afterwards.' : '',
    i.brief.trim() ? `Notes from the user: ${i.brief.trim().slice(0, 600)}` : '',
  ]
  return parts.filter(Boolean).join(' ').slice(0, 1950)
}

const MIN_SIDE = 256
const MAX_SIDE = 4096
const ARTWORK_LONG_SIDE = 2800
/** A wide wrap is drawn in panels (each at the image model's own size), so the whole can be much wider. */
const WRAP_ASPECT = 2.0
const WRAP_LONG_SIDE = 5400
const MAX_WRAP_WIDTH = 8192

export interface LabelSizes {
  /** What the artwork is generated at: sharp, the same shape as the label. */
  artwork: { width: number; height: number }
  /** What the design is sized to: the label's real size in CSS pixels (96 per inch). */
  target: { width: number; height: number }
  unit: 'px' | 'mm' | 'in'
  /** Wide labels are drawn panel by panel. */
  panels: 'auto'
}

/** Sizes for a label of `width` x `height` in `unit`. */
export function labelSizes(width: number, height: number, unit: StudioUnit): LabelSizes {
  const w = Math.max(1, Math.round(toCanonicalPx(width, unit)))
  const h = Math.max(1, Math.round(toCanonicalPx(height, unit)))
  const wrap = w / h >= WRAP_ASPECT
  const k = (wrap ? WRAP_LONG_SIDE : ARTWORK_LONG_SIDE) / Math.max(w, h)
  let aw = Math.round(w * k)
  let ah = Math.round(h * k)
  // A very long label keeps its shape; its short side is lifted to what the pipeline accepts and the long side capped.
  if (Math.min(aw, ah) < MIN_SIDE) {
    const lift = MIN_SIDE / Math.min(aw, ah)
    aw = Math.round(aw * lift)
    ah = Math.round(ah * lift)
  }
  aw = Math.min(wrap ? MAX_WRAP_WIDTH : MAX_SIDE, aw)
  ah = Math.min(MAX_SIDE, ah)
  return { artwork: { width: aw, height: ah }, target: { width: w, height: h }, unit: unit === 'mm' || unit === 'cm' ? 'mm' : unit === 'in' ? 'in' : 'px', panels: 'auto' }
}

/** The long side of a wide banner made in one piece: 8192 px (the most the server takes), about 460 dpi for a 450 mm label. Nano Banana 2.1 at 4K draws a 4:1 picture
 *  of 8256 x 2048 px, so this keeps (nearly) all of its detail; the sharp small print survives printing. */
const SIMPLE_WIDE_LONG_SIDE = 8192

/** Sizes for the one-box flow: drawn whole in one piece (never in panels), in the label's own shape. A wide banner is made at about 300 dpi (up to 8192 px wide
 *  and 4096 high); any other shape at most 4096 px a side. */
export function simpleSizes(width: number, height: number, unit: StudioUnit): LabelSizes & { label: string } {
  const w = Math.max(1, Math.round(toCanonicalPx(width, unit)))
  const h = Math.max(1, Math.round(toCanonicalPx(height, unit)))
  const wide = w / h >= WRAP_ASPECT
  const maxWidth = wide ? MAX_WRAP_WIDTH : MAX_SIDE
  const k = Math.min((wide ? SIMPLE_WIDE_LONG_SIDE : MAX_SIDE) / Math.max(w, h), maxWidth / w, MAX_SIDE / h)
  let aw = Math.round(w * k)
  let ah = Math.round(h * k)
  if (Math.min(aw, ah) < MIN_SIDE) {
    const lift = MIN_SIDE / Math.min(aw, ah)
    aw = Math.min(maxWidth, Math.round(aw * lift))
    ah = Math.min(MAX_SIDE, Math.round(ah * lift))
  }
  const shown = unit === 'mm' || unit === 'cm' || unit === 'in' || unit === 'px' ? unit : 'px'
  return {
    artwork: { width: aw, height: ah },
    target: { width: w, height: h },
    unit: unit === 'mm' || unit === 'cm' ? 'mm' : unit === 'in' ? 'in' : 'px',
    panels: 'auto',
    label: `${width} x ${height} ${shown}`,
  }
}
