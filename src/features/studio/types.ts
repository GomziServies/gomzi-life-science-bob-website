/**
 * TypeScript types and schemas for the AI Studio feature.
 */

import type { DoryDocument } from '@/types/document'

export type StudioJobStatus =
  | 'queued'
  | 'extracting'
  | 'planning'
  | 'designing'
  | 'critiquing'
  | 'rendering'
  | 'done'
  | 'failed'

export interface ContactInfo {
  phone?: string
  email?: string
  website?: string
  address?: string
  socials?: string[]
}

export interface BriefSpec {
  business_name: string
  industry?: string
  offering?: string
  audience?: string
  key_message: string
  tagline?: string
  offer_details?: string
  call_to_action: string
  contact?: ContactInfo
  tone?: string[]
  language?: string
  mandatory_text?: string[]
  forbidden?: string[]
  dates?: string
  prices?: string
  brand_colors?: string[]
  notes?: string
  confidence?: Record<string, number>
  source_quotes?: Record<string, string>

  // Supplement specific fields
  brand_name?: string
  product_name?: string
  product_category?: string
  flavor_or_variant?: string
  net_quantity?: string
  serving_size?: string
  servings_per_container?: string
  active_ingredients?: Array<{ name: string; amount: string; dv: string }>
  other_ingredients?: string
  suggested_use?: string
  cautions_warning?: string
  allergen_statement?: string
  dietary_badges?: string[]
  container_type?: string
  aesthetic_vibe?: string
}

export interface Brief {
  id: string
  raw_text: string
  extracted: BriefSpec
  confirmed: boolean
  created_at: string
  updated_at: string
}

export interface DesignStrategy {
  label: 'A' | 'B'
  concept_name: string
  archetype: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  heading_font: string
  body_font: string
  image_treatment: string
  decorative_language: string[]
  hierarchy_order: string[]
  rationale: string
}

export interface QualityReport {
  score: number
  passed: boolean
  wcag_contrast_pass: boolean
  safe_margin_pass: boolean
  bounds_pass: boolean
  font_count: number
  color_count: number
  critique_notes: string[]
  fixes_applied: string[]
}

export interface DesignVariant {
  id: string
  label: 'A' | 'B'
  strategy: DesignStrategy
  document: DoryDocument
  thumbnail?: string
  rationale: string
  quality_report?: QualityReport
  design_id?: string | null
  seed: number
  created_at: string
}

export interface GenerationJobParams {
  preset?: string
  width?: number
  height?: number
  unit?: 'px' | 'mm' | 'cm' | 'in'
  dpi?: number
  bleed_mm?: number
  pages?: number
  category?: string
  style_prefs?: Record<string, unknown>
}

export interface GenerationJob {
  id: string
  brief_id: string
  params: GenerationJobParams
  status: StudioJobStatus
  progress: number
  stage_message: string
  error?: string
  provider: string
  model?: string
  tokens_used: number
  cost_usd: string
  variants: DesignVariant[]
  created_at: string
  updated_at: string
}

export interface LogoAsset {
  id: string
  file_url: string
  palette: string[]
  has_alpha: boolean
  aspect: number
  is_svg: boolean
  created_at: string
  /** What was done to an uploaded logo to make it print-ready (background, method, size); null when it is used exactly as uploaded. */
  prep?: LogoPrep | null
  /** The file as uploaded, kept beside the cleaned one ('' when nothing was cleaned). */
  original_url?: string
}

export interface LogoPrep {
  original: [number, number]
  size: [number, number]
  background: string
  method: string
  shape_match?: number
}
