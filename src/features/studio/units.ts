/**
 * Mathematical conversions and boundary validations for physical units and DPI.
 *
 * Symmetrical to backend/apps/studio/units.py:
 * - Canonical storage: CSS pixels at 96 DPI.
 * - Units: 'px', 'mm', 'cm', 'in'.
 * - 1 inch == 25.4 mm == 2.54 cm == 96 CSS pixels.
 * - Max dimension bounds: 20,000 px.
 */

export type StudioUnit = 'px' | 'mm' | 'cm' | 'in'

export const CANONICAL_DPI = 96
export const MAX_CANVAS_DIMENSION_PX = 20_000
export const MM_PER_INCH = 25.4
export const CM_PER_INCH = 2.54

export const SUPPORTED_DPIS = [72, 96, 150, 300, 600] as const
export type SupportedDpi = (typeof SUPPORTED_DPIS)[number]

export interface DimensionSpec {
  widthPx: number
  heightPx: number
  outputWidthPx: number
  outputHeightPx: number
  dpi: number
  scaleMultiplier: number
  unit: StudioUnit
  widthInUnit: number
  heightInUnit: number
}

export function unitToInches(val: number, unit: StudioUnit): number {
  if (val <= 0) {
    throw new Error(`Dimension value must be positive, got ${val}`)
  }
  const norm = unit.toLowerCase().trim()
  switch (norm) {
    case 'in':
      return val
    case 'mm':
      return val / MM_PER_INCH
    case 'cm':
      return val / CM_PER_INCH
    case 'px':
      return val / CANONICAL_DPI
    default:
      throw new Error(`Unsupported unit '${unit}'. Must be one of: 'px', 'mm', 'cm', 'in'.`)
  }
}

export function inchesToUnit(inches: number, targetUnit: StudioUnit): number {
  if (inches <= 0) {
    throw new Error(`Inches must be positive, got ${inches}`)
  }
  const norm = targetUnit.toLowerCase().trim()
  switch (norm) {
    case 'in':
      return Number(inches.toFixed(4))
    case 'mm':
      return Number((inches * MM_PER_INCH).toFixed(2))
    case 'cm':
      return Number((inches * CM_PER_INCH).toFixed(3))
    case 'px':
      return Number((inches * CANONICAL_DPI).toFixed(2))
    default:
      throw new Error(`Unsupported unit '${targetUnit}'. Must be one of: 'px', 'mm', 'cm', 'in'.`)
  }
}

export function toCanonicalPx(val: number, unit: StudioUnit): number {
  const inches = unitToInches(val, unit)
  return Math.round(inches * CANONICAL_DPI)
}

export function canonicalPxToUnit(px: number, targetUnit: StudioUnit): number {
  const inches = px / CANONICAL_DPI
  return inchesToUnit(inches, targetUnit)
}

export function computeOutputPx(canonicalPx: number, dpi: number): number {
  if (dpi <= 0) {
    throw new Error(`DPI must be positive, got ${dpi}`)
  }
  const multiplier = dpi / CANONICAL_DPI
  return Math.round(canonicalPx * multiplier)
}

export function validateDimensionBounds(
  widthPx: number,
  heightPx: number,
  dpi = CANONICAL_DPI,
  maxDimension = MAX_CANVAS_DIMENSION_PX,
): { valid: boolean; error?: string } {
  if (widthPx <= 0 || heightPx <= 0) {
    return { valid: false, error: 'Dimensions must be strictly positive.' }
  }
  if (widthPx > maxDimension || heightPx > maxDimension) {
    return {
      valid: false,
      error: `Canvas dimensions ${widthPx}x${heightPx} px exceed maximum allowed ${maxDimension} px.`,
    }
  }

  const outW = computeOutputPx(widthPx, dpi)
  const outH = computeOutputPx(heightPx, dpi)
  if (outW > maxDimension || outH > maxDimension) {
    return {
      valid: false,
      error: `Output resolution ${outW}x${outH} px at ${dpi} DPI exceeds limit of ${maxDimension} px. Reduce output DPI (e.g. choose 300 instead of ${dpi}) or reduce physical dimensions.`,
    }
  }

  return { valid: true }
}

export function calculateDimensionSpec(
  valW: number,
  valH: number,
  unit: StudioUnit,
  dpi = 300,
  maxDimension = MAX_CANVAS_DIMENSION_PX,
): DimensionSpec {
  const canonicalW = toCanonicalPx(valW, unit)
  const canonicalH = toCanonicalPx(valH, unit)
  const validation = validateDimensionBounds(canonicalW, canonicalH, dpi, maxDimension)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const outputW = computeOutputPx(canonicalW, dpi)
  const outputH = computeOutputPx(canonicalH, dpi)
  const multiplier = dpi / CANONICAL_DPI

  return {
    widthPx: canonicalW,
    heightPx: canonicalH,
    outputWidthPx: outputW,
    outputHeightPx: outputH,
    dpi,
    scaleMultiplier: Number(multiplier.toFixed(4)),
    unit,
    widthInUnit: valW,
    heightInUnit: valH,
  }
}
