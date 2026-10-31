import { boxMean } from './matte'

/**
 * Steps that make a cut-out cleaner than one pass of the model can: an average of the picture and its mirror
 * image, a second look at the subject alone, removal of stray blobs and pin-holes, and clearing the old
 * background's colour from the soft edge. Plain typed arrays, so they run in a worker and in unit tests.
 */

/** `planes` planar `size` x `size` channels, mirrored left to right. */
export function mirrorPlanes(source: Float32Array, size: number, planes: number): Float32Array {
  const out = new Float32Array(source.length)
  for (let c = 0; c < planes; c++) {
    for (let y = 0; y < size; y++) {
      const row = (c * size + y) * size
      for (let x = 0; x < size; x++) out[row + x] = source[row + size - 1 - x]
    }
  }
  return out
}

/** The average of two mattes of the same size. */
export function averageMattes(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = (a[i] + b[i]) / 2
  return out
}

export interface Box {
  x0: number
  y0: number
  /** Exclusive. */
  x1: number
  y1: number
}

/** The box around every cell of `matte` above `threshold`, or null when there is none. */
export function foregroundBox(matte: Float32Array, width: number, height: number, threshold = 0.5): Box | null {
  let x0 = width
  let y0 = height
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (matte[y * width + x] > threshold) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 }
}

/** `box` grown by `margin` of its own size on every side (never past the picture). */
export function growBox(box: Box, width: number, height: number, margin: number): Box {
  const mx = Math.ceil((box.x1 - box.x0) * margin)
  const my = Math.ceil((box.y1 - box.y0) * margin)
  return { x0: Math.max(0, box.x0 - mx), y0: Math.max(0, box.y0 - my), x1: Math.min(width, box.x1 + mx), y1: Math.min(height, box.y1 + my) }
}

/** The part of an interleaved `channels`-per-pixel picture inside `box`. */
export function cropPlane(source: Float32Array, width: number, channels: number, box: Box): Float32Array {
  const w = box.x1 - box.x0
  const h = box.y1 - box.y0
  const out = new Float32Array(w * h * channels)
  for (let y = 0; y < h; y++) {
    const from = ((box.y0 + y) * width + box.x0) * channels
    out.set(source.subarray(from, from + w * channels), y * w * channels)
  }
  return out
}

/**
 * Puts `patch` (a matte of `box`'s size) into `matte`. Inside the box the patch wins; within `fade` cells of the
 * box's edge the two are blended, except along the picture's own border, so there is no visible seam.
 */
export function pasteMatte(matte: Float32Array, width: number, height: number, patch: Float32Array, box: Box, fade: number): void {
  const w = box.x1 - box.x0
  const h = box.y1 - box.y0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const left = box.x0 === 0 ? Infinity : x
      const right = box.x1 === width ? Infinity : w - 1 - x
      const top = box.y0 === 0 ? Infinity : y
      const bottom = box.y1 === height ? Infinity : h - 1 - y
      const edge = Math.min(left, right, top, bottom)
      const weight = fade <= 0 ? 1 : Math.min(1, (edge + 1) / fade)
      const index = (box.y0 + y) * width + box.x0 + x
      matte[index] = matte[index] * (1 - weight) + patch[y * w + x] * weight
    }
  }
}

export interface CleanOptions {
  /** A foreground blob smaller than this share of the biggest one is dropped. */
  keepRatio: number
  /** A hole in the foreground smaller than this share of the picture is filled. */
  holeShare: number
}

export const DEFAULT_CLEAN: CleanOptions = { keepRatio: 0.03, holeShare: 0.0012 }

/** Labels the 4-connected regions where `inside(matte[i])` holds; returns the label of each cell (0: not inside) and each region's size. */
function regions(matte: Float32Array, width: number, height: number, inside: (v: number) => boolean): { labels: Int32Array; sizes: number[]; touchesBorder: boolean[] } {
  const labels = new Int32Array(width * height)
  const sizes: number[] = [0]
  const touchesBorder: boolean[] = [false]
  const stack = new Int32Array(width * height)
  let next = 1
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] !== 0 || !inside(matte[start])) continue
    let top = 0
    let size = 0
    let border = false
    stack[top++] = start
    labels[start] = next
    while (top > 0) {
      const i = stack[--top]
      size++
      const x = i % width
      const y = (i - x) / width
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) border = true
      if (x > 0 && labels[i - 1] === 0 && inside(matte[i - 1])) (labels[i - 1] = next), (stack[top++] = i - 1)
      if (x < width - 1 && labels[i + 1] === 0 && inside(matte[i + 1])) (labels[i + 1] = next), (stack[top++] = i + 1)
      if (y > 0 && labels[i - width] === 0 && inside(matte[i - width])) (labels[i - width] = next), (stack[top++] = i - width)
      if (y < height - 1 && labels[i + width] === 0 && inside(matte[i + width])) (labels[i + width] = next), (stack[top++] = i + width)
    }
    sizes.push(size)
    touchesBorder.push(border)
    next++
  }
  return { labels, sizes, touchesBorder }
}

/**
 * Removes the specks and islands the model sometimes leaves in the background, and fills the pin-holes it
 * sometimes leaves inside the subject. Real, bigger holes (between an arm and a body, in a handle) are kept.
 * Works on the matte in place.
 */
export function cleanMatte(matte: Float32Array, width: number, height: number, options: CleanOptions = DEFAULT_CLEAN): void {
  const solid = (v: number): boolean => v > 0.5
  const fg = regions(matte, width, height, solid)
  const largest = Math.max(0, ...fg.sizes)
  if (largest > 0) {
    for (let i = 0; i < matte.length; i++) {
      const label = fg.labels[i]
      if (label !== 0 && fg.sizes[label] < largest * options.keepRatio) matte[i] = 0
    }
  }
  const maxHole = Math.max(1, Math.round(width * height * options.holeShare))
  const bg = regions(matte, width, height, (v) => v <= 0.5)
  for (let i = 0; i < matte.length; i++) {
    const label = bg.labels[i]
    if (label !== 0 && !bg.touchesBorder[label] && bg.sizes[label] <= maxHole) matte[i] = 1
  }
}

/**
 * The colour of the subject near every cell, for the cells where the matte is surely foreground, spread outwards:
 * a box blur of the colour weighted by how foreground a cell is, divided by the blurred weight. Returns the
 * colours (interleaved) and the blurred weight (how much subject there was near the cell).
 */
export function foregroundColours(rgb: Float32Array, matte: Float32Array, width: number, height: number, radius: number): { colours: Float32Array; weight: Float32Array } {
  const n = width * height
  const w = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = Math.min(1, Math.max(0, (matte[i] - 0.9) / 0.1))
    w[i] = t * t * (3 - 2 * t)
  }
  const plane = new Float32Array(n)
  const weight = boxMean(w, width, height, radius)
  const colours = new Float32Array(n * 3)
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < n; i++) plane[i] = rgb[i * 3 + c] * w[i]
    const blurred = boxMean(plane, width, height, radius)
    for (let i = 0; i < n; i++) colours[i * 3 + c] = weight[i] > 1e-4 ? blurred[i] / weight[i] : rgb[i * 3 + c]
  }
  return { colours, weight }
}

/**
 * Replaces the colour of the semi-transparent edge pixels of `rgba` (straight alpha) with the subject's own colour
 * nearby, so the old background does not show as a fringe when the cut-out sits on a new one. Pixels that are fully
 * opaque or fully transparent are left alone. `grid` is the reduced grid `foregroundColours` was computed on.
 */
export function decontaminate(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  grid: { colours: Float32Array; weight: Float32Array; width: number; height: number },
): void {
  const sx = grid.width / width
  const sy = grid.height / height
  for (let y = 0; y < height; y++) {
    const gy = Math.min(grid.height - 1, Math.max(0, (y + 0.5) * sy - 0.5))
    const y0 = Math.floor(gy)
    const y1 = Math.min(grid.height - 1, y0 + 1)
    const fy = gy - y0
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4
      const a = rgba[p + 3]
      if (a === 0 || a === 255) continue
      const gx = Math.min(grid.width - 1, Math.max(0, (x + 0.5) * sx - 0.5))
      const x0 = Math.floor(gx)
      const x1 = Math.min(grid.width - 1, x0 + 1)
      const fx = gx - x0
      const i00 = y0 * grid.width + x0
      const i10 = y0 * grid.width + x1
      const i01 = y1 * grid.width + x0
      const i11 = y1 * grid.width + x1
      const w00 = (1 - fx) * (1 - fy)
      const w10 = fx * (1 - fy)
      const w01 = (1 - fx) * fy
      const w11 = fx * fy
      const support = grid.weight[i00] * w00 + grid.weight[i10] * w10 + grid.weight[i01] * w01 + grid.weight[i11] * w11
      if (support < 0.02) continue // no subject nearby to take the colour from
      // A pixel that is half subject and half old background should carry the subject's colour alone (the alpha already
      // says how much of it shows); one that is mostly subject keeps most of its own colour, and its texture.
      const mix = Math.min(1, 2 * (1 - a / 255))
      for (let c = 0; c < 3; c++) {
        const f =
          (grid.colours[i00 * 3 + c] * w00 + grid.colours[i10 * 3 + c] * w10 + grid.colours[i01 * 3 + c] * w01 + grid.colours[i11 * 3 + c] * w11) * 255
        rgba[p + c] = rgba[p + c] * (1 - mix) + f * mix
      }
    }
  }
}
