import { BackgroundRemovalError } from '../bgRemoval'
import { DEFAULT_SHAPE, featherAlpha, fitGuidedFilter, writeAlpha, type AlphaShape } from './matte'
import type { ModelInput } from './model'
import { averageMattes, cleanMatte, cropPlane, decontaminate, foregroundBox, foregroundColours, growBox, mirrorPlanes, pasteMatte } from './refine'
import { fitLongSide, resample } from './resample'
import { buildModelInput, normalizeMatte } from './tensor'

export interface PipelineOptions {
  /** Feather the edge of the cut-out by this many pixels (0: none). */
  feather?: number
  /** The matte is refined against the photo reduced to this many pixels on its longer side. */
  guideLongSide?: number
  shape?: AlphaShape
  /** Guided-filter regularisation (see `fitGuidedFilter`). */
  epsilon?: number
  /** Average the answer for the picture with the answer for its mirror image (one more run of the model). */
  mirror?: boolean
  /** When the subject is small in the frame, look at it again alone, so it fills the model's view (one or two more runs). */
  zoom?: boolean
  /** Drop stray specks and islands, and fill pin-holes in the subject. */
  clean?: boolean
  /** Clear the old background's colour from the soft edge. */
  decontaminate?: boolean
}

/** Everything on: the cleanest cut-out the model can give, for a few runs of it instead of one. */
export const BEST_QUALITY: Pick<PipelineOptions, 'mirror' | 'zoom' | 'clean' | 'decontaminate'> = { mirror: true, zoom: true, clean: true, decontaminate: true }

/** The subject is looked at again alone only when its box covers less than this share of the picture. */
const ZOOM_BELOW_SHARE = 0.6
const ZOOM_MARGIN = 0.1

export interface PipelineHooks {
  /** Runs the model on a planar `1 x 3 x size x size` tensor and returns the `size x size` probabilities. */
  infer(input: Float32Array): Promise<Float32Array>
  /** Called between stages with the progress so far (0..100); it may throw to cancel. */
  step(percent: number): Promise<void>
}

const GUIDE_LONG_SIDE = 1024
const DEFAULT_EPSILON = 1e-3
/** Below this share of foreground the model found no subject (a flat, empty answer). */
export const MIN_COVERAGE = 0.0005

/**
 * Cuts the background out of `rgba` (`width` x `height`, straight alpha) in place: only the alpha channel
 * changes. Returns the share of the picture that was kept (0..1).
 *
 * The photo is reduced once to a guide grid (`guideLongSide`), the model sees it at its own size, and the
 * soft matte it answers with is refined against the guide and applied at full resolution, so a 12-megapixel
 * photo costs one small inference and a handful of linear passes.
 */
export async function cutOut(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  model: ModelInput,
  hooks: PipelineHooks,
  options: PipelineOptions = {},
): Promise<number> {
  const grid = fitLongSide(width, height, options.guideLongSide ?? GUIDE_LONG_SIDE)
  const guide = resample({ data: rgba, width, height, stride: 4 }, 3, grid.width, grid.height, 1 / 255)
  await hooks.step(20)

  const input = buildModelInput(guide, grid.width, grid.height, model)
  await hooks.step(30)

  const probabilities = async (tensor: Float32Array): Promise<Float32Array> => {
    const answer = await hooks.infer(tensor)
    if (answer.length !== model.size * model.size) {
      throw new BackgroundRemovalError('The model returned an unexpected result.')
    }
    const first = normalizeMatte(answer)
    if (!options.mirror) return first
    // The mirror image is a second opinion with the errors in different places.
    const second = normalizeMatte(await hooks.infer(mirrorPlanes(tensor, model.size, 3)))
    return averageMattes(first, mirrorPlanes(second, model.size, 1))
  }

  const coarse = await probabilities(input)
  await hooks.step(65)
  const matte = resample({ data: coarse, width: model.size, height: model.size, stride: 1 }, 1, grid.width, grid.height)

  if (options.zoom) {
    const box = foregroundBox(matte, grid.width, grid.height)
    if (box && ((box.x1 - box.x0) * (box.y1 - box.y0)) / (grid.width * grid.height) < ZOOM_BELOW_SHARE) {
      const crop = growBox(box, grid.width, grid.height, ZOOM_MARGIN)
      const cw = crop.x1 - crop.x0
      const ch = crop.y1 - crop.y0
      const closeUp = await probabilities(buildModelInput(cropPlane(guide, grid.width, 3, crop), cw, ch, model))
      const patch = resample({ data: closeUp, width: model.size, height: model.size, stride: 1 }, 1, cw, ch)
      pasteMatte(matte, grid.width, grid.height, patch, crop, Math.max(2, Math.round(Math.min(cw, ch) / 24)))
    }
  }
  await hooks.step(75)

  if (options.clean) cleanMatte(matte, grid.width, grid.height)
  const radius = Math.min(12, Math.max(2, Math.round(Math.max(grid.width, grid.height) / 128)))
  const fit = fitGuidedFilter(guide, matte, grid.width, grid.height, { radius, epsilon: options.epsilon ?? DEFAULT_EPSILON })
  await hooks.step(85)

  const coverage = writeAlpha(rgba, width, height, fit, options.shape ?? DEFAULT_SHAPE)
  if (coverage < MIN_COVERAGE) throw new BackgroundRemovalError('No subject was found in the image.', 'no-subject')
  await hooks.step(90)

  if (options.decontaminate) {
    const spread = foregroundColours(guide, matte, grid.width, grid.height, Math.max(3, Math.round(Math.max(grid.width, grid.height) / 96)))
    decontaminate(rgba, width, height, { ...spread, width: grid.width, height: grid.height })
  }
  await hooks.step(95)

  if (options.feather) featherAlpha(rgba, width, height, options.feather)
  return coverage
}
