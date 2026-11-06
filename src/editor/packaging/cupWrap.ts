/**
 * Cup labels (the peanut butter cups): the print layout is one flat picture holding the curved wrap for the cup's tapered
 * side and the round sticker for its lid. A tapered cup's side unrolls into a ring segment: two arcs round one centre (the
 * cup's top and bottom edges) between two straight ends. Finding that segment in the picture gives the cup's exact shape:
 * an edge of slant radius ρ on a segment of angle φ closes into a circle of radius ρ·φ / 2π.
 *
 * Everything here works on pixels (no DOM), so it can be tested on its own.
 */

export interface Pixels {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface CupFit {
  /** Size of the picture the fit was measured on (the coordinates below are in its pixels). */
  width: number
  height: number
  /** The centre of the ring segment. */
  cx: number
  cy: number
  /** Slant radius of the wrap's edge at the top of the picture, and at its bottom. */
  rhoTop: number
  rhoBottom: number
  /** Unit vector from the centre towards the middle of the wrap, and the angles (signed, from that vector) of the wrap's left and right ends. */
  dirX: number
  dirY: number
  angleLeft: number
  angleRight: number
  /** The round lid sticker, when the picture has one. */
  lid: { x: number; y: number; r: number } | null
}

/** The cup's shape from a fit, in the same pixel units: radii at the top and bottom of the side, and the side's height. */
export function cupShape(fit: CupFit): { rTop: number; rBottom: number; height: number } {
  const phi = Math.abs(fit.angleRight - fit.angleLeft)
  const rTop = (fit.rhoTop * phi) / (2 * Math.PI)
  const rBottom = (fit.rhoBottom * phi) / (2 * Math.PI)
  const slant = Math.abs(fit.rhoTop - fit.rhoBottom)
  const height = Math.sqrt(Math.max(0, slant * slant - (rTop - rBottom) * (rTop - rBottom)))
  return { rTop, rBottom, height }
}

/** Where a point of the cup's side comes from in the picture: `s` runs round the cup from the wrap's left end (0) to its right end (1), `t` up its side (0 bottom, 1 top). Returns picture pixels. */
export function wrapPoint(fit: CupFit, s: number, t: number): { x: number; y: number } {
  const a = fit.angleLeft + (fit.angleRight - fit.angleLeft) * s
  const rho = fit.rhoBottom + (fit.rhoTop - fit.rhoBottom) * t
  // the direction at angle a from the middle direction (perpendicular taken so that a positive angle is cross(dir, v) > 0)
  const px = -fit.dirY
  const py = fit.dirX
  const ux = Math.cos(a) * fit.dirX + Math.sin(a) * px
  const uy = Math.cos(a) * fit.dirY + Math.sin(a) * py
  return { x: fit.cx + rho * ux, y: fit.cy + rho * uy }
}

/** Least-squares circle through points (Kåsa's method). */
function fitCircle(pts: Array<[number, number]>): { x: number; y: number; r: number } | null {
  const n = pts.length
  if (n < 8) return null
  let sx = 0, sy = 0
  for (const [x, y] of pts) {
    sx += x
    sy += y
  }
  const mx = sx / n
  const my = sy / n
  let suu = 0, svv = 0, suv = 0, suuu = 0, svvv = 0, suvv = 0, svuu = 0
  for (const [x, y] of pts) {
    const u = x - mx
    const v = y - my
    suu += u * u
    svv += v * v
    suv += u * v
    suuu += u * u * u
    svvv += v * v * v
    suvv += u * v * v
    svuu += v * u * u
  }
  const det = suu * svv - suv * suv
  if (Math.abs(det) < 1e-9) return null
  const bu = 0.5 * (suuu + suvv)
  const bv = 0.5 * (svvv + svuu)
  const uc = (bu * svv - bv * suv) / det
  const vc = (bv * suu - bu * suv) / det
  const r = Math.sqrt(uc * uc + vc * vc + (suu + svv) / n)
  return { x: uc + mx, y: vc + my, r }
}

/** Circle through three points, or null when they are (nearly) in a line. */
function circleThrough(a: [number, number], b: [number, number], c: [number, number]): { x: number; y: number; r: number } | null {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
  if (Math.abs(d) < 1e-6) return null
  const a2 = a[0] * a[0] + a[1] * a[1]
  const b2 = b[0] * b[0] + b[1] * b[1]
  const c2 = c[0] * c[0] + c[1] * c[1]
  const x = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d
  const y = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d
  return { x, y, r: Math.hypot(a[0] - x, a[1] - y) }
}

/**
 * The arc most of an edge's points lie on: decorations that stick out of the edge (drips, notches, a tab) are outvoted.
 * Circles through three points (one from each third of the edge) are tried; the one with the most points near it wins
 * and is then fitted to just those points.
 */
function fitArc(pts: Array<[number, number]>, tolerance: number): { x: number; y: number; r: number; share: number; inliers: Array<[number, number]> } | null {
  const n = pts.length
  if (n < 12) return null
  let seed = 12345
  const rand = (k: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return Math.floor((seed / 0x7fffffff) * k)
  }
  const third = Math.floor(n / 3)
  let best: { x: number; y: number; r: number } | null = null
  let bestCount = 0
  for (let k = 0; k < 400; k++) {
    const c = circleThrough(pts[rand(third)], pts[third + rand(third)], pts[2 * third + rand(n - 2 * third)])
    if (!c) continue
    let count = 0
    for (const p of pts) if (Math.abs(Math.hypot(p[0] - c.x, p[1] - c.y) - c.r) <= tolerance) count++
    if (count > bestCount) {
      bestCount = count
      best = c
    }
  }
  if (!best) return null
  const inliers = pts.filter((p) => Math.abs(Math.hypot(p[0] - best!.x, p[1] - best!.y) - best!.r) <= tolerance)
  const refined = fitCircle(inliers) ?? best
  return { ...refined, share: inliers.length / n, inliers }
}

/**
 * Finds the cup wrap and the lid sticker in a label picture, or null when the picture is not a cup layout (no large curved
 * band, or edges that are not arcs round one centre).
 */
export function detectCupWrap(px: Pixels, why?: (reason: string) => void): CupFit | null {
  const no = (reason: string): null => (why?.(reason), null)
  const { data, width: W, height: H } = px
  // 1. what is printed: anything different from the white sheet (and not transparent). Faint grey counts too: a wrap whose
  //    bottom part is white paper shows its edge only as a thin grey cut line.
  const ink = new Uint8Array(W * H)
  // the very faintest marks, kept apart: only the search for the wrap's bottom edge uses them (a thin cut line, once the
  // picture is shrunk, can fade to almost white)
  const faint = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3]
    const dark = a > 40 ? 255 * 3 - (r + g + b) : 0
    ink[i] = dark > 12 ? 1 : 0
    faint[i] = dark > 4 ? 1 : 0
  }
  // 2. the separate printed shapes (4-connected), largest first
  const label = new Int32Array(W * H).fill(-1)
  const comps: Array<{ area: number; x0: number; y0: number; x1: number; y1: number }> = []
  const stack: number[] = []
  for (let start = 0; start < W * H; start++) {
    if (!ink[start] || label[start] !== -1) continue
    const id = comps.length
    const c = { area: 0, x0: W, y0: H, x1: 0, y1: 0 }
    label[start] = id
    stack.push(start)
    while (stack.length) {
      const i = stack.pop()!
      const x = i % W
      const y = (i - x) / W
      c.area++
      if (x < c.x0) c.x0 = x
      if (x > c.x1) c.x1 = x
      if (y < c.y0) c.y0 = y
      if (y > c.y1) c.y1 = y
      // the four neighbours, checked in place (no array made per pixel)
      if (x > 0 && ink[i - 1] && label[i - 1] === -1) {
        label[i - 1] = id
        stack.push(i - 1)
      }
      if (x < W - 1 && ink[i + 1] && label[i + 1] === -1) {
        label[i + 1] = id
        stack.push(i + 1)
      }
      if (y > 0 && ink[i - W] && label[i - W] === -1) {
        label[i - W] = id
        stack.push(i - W)
      }
      if (y < H - 1 && ink[i + W] && label[i + W] === -1) {
        label[i + W] = id
        stack.push(i + W)
      }
    }
    comps.push(c)
  }
  if (!comps.length) return no("nothing printed")
  const order = comps.map((_, i) => i).sort((a, b) => comps[b].area - comps[a].area)
  const bandId = order[0]
  const band = comps[bandId]
  const bw = band.x1 - band.x0 + 1
  const bh = band.y1 - band.y0 + 1
  // a wrap is a wide shape that covers a good part of the sheet
  if (band.area < W * H * 0.08 || bw < bh * 1.6) return no(`biggest shape is not a wide band (area ${(band.area / (W * H)).toFixed(2)}, ${bw}x${bh})`)

  // 3. its top and bottom edges, column by column across the middle (the slanted ends are left out)
  const top: Array<[number, number]> = []
  // The bottom edge, two ways: where the band itself ends, and the lowest faint mark close under it. A wrap whose lower part
  // is white paper shows its edge only as a thin cut line (which a smaller copy breaks off the band); a saved JPEG has faint
  // speckles in its white instead. Whichever edge is an arc round the top edge's centre is the real one.
  const bandBottom: Array<[number, number]> = []
  const faintBottom: Array<[number, number]> = []
  const reach = Math.round(bh * 0.6)
  for (let x = Math.round(band.x0 + bw * 0.18); x <= band.x1 - bw * 0.18; x++) {
    let y0 = -1, y1 = -1, y2 = -1
    for (let y = band.y0; y <= band.y1; y++) if (label[y * W + x] === bandId) { y0 = y; break }
    for (let y = band.y1; y >= band.y0; y--) if (label[y * W + x] === bandId) { y1 = y; break }
    for (let y = Math.min(H - 1, band.y1 + reach); y >= band.y0; y--) if (faint[y * W + x]) { y2 = y; break }
    if (y0 >= 0 && y1 > y0) {
      top.push([x, y0])
      bandBottom.push([x, y1 + 1])
      faintBottom.push([x, Math.max(y1, y2) + 1])
    }
  }
  const tolerance = Math.max(1.5, W * 0.004)
  const ct = fitArc(top, tolerance)
  if (!ct || ct.share < 0.45) return no(`the top edge is not an arc (${ct ? ct.share.toFixed(2) : 'no fit'})`)
  const candidates = [fitArc(faintBottom, tolerance), fitArc(bandBottom, tolerance)].filter((c): c is NonNullable<typeof c> => !!c && c.share >= 0.45)
  const gapTo = (c: { x: number; y: number }) => Math.hypot(ct.x - c.x, ct.y - c.y)
  const cb = candidates.sort((p, q) => gapTo(p) - gapTo(q))[0]
  // most of each edge must lie on its arc
  if (!cb) return no('the bottom edge is not an arc')
  // both edges must be arcs round (nearly) one centre, clearly curved, and the band a real ring segment
  const cx = (ct.x + cb.x) / 2
  const cy = (ct.y + cb.y) / 2
  const centreGap = Math.hypot(ct.x - cb.x, ct.y - cb.y)
  const rMax = Math.max(ct.r, cb.r)
  if (centreGap > rMax * 0.08 || rMax > Math.max(W, H) * 12 || Math.abs(ct.r - cb.r) < bh * 0.3) return no(`arcs do not share a centre (gap ${centreGap.toFixed(0)}, radii ${ct.r.toFixed(0)} / ${cb.r.toFixed(0)})`)
  // each edge's radius from the shared centre: the middle distance to the points on its arc
  const median = (xs: number[]) => xs.sort((a, b) => a - b)[xs.length >> 1]
  const rhoTop = median(ct.inliers.map((p) => Math.hypot(p[0] - cx, p[1] - cy)))
  const rhoBottom = median(cb.inliers.map((p) => Math.hypot(p[0] - cx, p[1] - cy)))

  // 4. the angles the band covers, seen from the centre (a few stray pixels at either end are ignored)
  const midX = (band.x0 + band.x1) / 2
  const midYs = top[top.length >> 1]
  const dx0 = midX - cx
  const dy0 = (midYs[1] + cb.inliers[cb.inliers.length >> 1][1]) / 2 - cy
  const dl = Math.hypot(dx0, dy0) || 1
  const dirX = dx0 / dl
  const dirY = dy0 / dl
  const angles: number[] = []
  const stride = Math.max(1, Math.floor(band.area / 60000))
  let n = 0
  for (let y = band.y0; y <= band.y1; y++) {
    for (let x = band.x0; x <= band.x1; x++) {
      if (label[y * W + x] !== bandId || n++ % stride) continue
      const vx = x - cx
      const vy = y - cy
      angles.push(Math.atan2(dirX * vy - dirY * vx, dirX * vx + dirY * vy))
    }
  }
  angles.sort((a, b) => a - b)
  const lo = angles[Math.floor(angles.length * 0.002)]
  const hi = angles[Math.ceil(angles.length * 0.998) - 1]
  // which end is the left one in the picture
  const leftIsLo = wrapX(cx, dirX, dirY, (rhoTop + rhoBottom) / 2, lo) < wrapX(cx, dirX, dirY, (rhoTop + rhoBottom) / 2, hi)
  const fit: CupFit = { width: W, height: H, cx, cy, rhoTop, rhoBottom, dirX, dirY, angleLeft: leftIsLo ? lo : hi, angleRight: leftIsLo ? hi : lo, lid: null }
  const shape = cupShape(fit)
  if (!(shape.height > 0) || Math.abs(hi - lo) < 0.15 || Math.abs(hi - lo) > Math.PI * 1.9) return no("not a ring segment")

  // 5. the lid sticker: another large, round shape (its box nearly square and about π/4 of it printed)
  for (const id of order.slice(1, 6)) {
    const c = comps[id]
    const w = c.x1 - c.x0 + 1
    const h = c.y1 - c.y0 + 1
    const fill = c.area / (w * h)
    if (c.area > W * H * 0.01 && w / h > 0.85 && w / h < 1.18 && fill > 0.68 && fill < 0.86) {
      fit.lid = { x: c.x0 + w / 2, y: c.y0 + h / 2, r: (w + h) / 4 }
      break
    }
  }
  return fit
}

const wrapX = (cx: number, dx: number, dy: number, rho: number, a: number) => cx + rho * (Math.cos(a) * dx + Math.sin(a) * -dy)

/**
 * The wrap laid out flat: a rectangle as wide as the wrap's length half-way up and as tall as its slant height, each pixel
 * read (smoothly, between the four nearest) from its place on the curved wrap. Wrapped once round a cup it looks as printed.
 * @param src the label picture at any size (the fit may have been measured on a smaller copy of it)
 */
export function unrollWrap(src: Pixels, fit: CupFit, outWidth: number): Pixels {
  const k = src.width / fit.width
  const phi = Math.abs(fit.angleRight - fit.angleLeft)
  const arcMid = ((fit.rhoTop + fit.rhoBottom) / 2) * phi
  const slant = Math.abs(fit.rhoTop - fit.rhoBottom)
  const W = Math.max(1, Math.round(outWidth))
  const H = Math.max(1, Math.round((W * slant) / Math.max(1e-6, arcMid)))
  const out = new Uint8ClampedArray(W * H * 4)
  const sw = src.width
  const sh = src.height
  const sd = src.data
  // the direction of each column from the centre, worked out once
  const px = -fit.dirY
  const py = fit.dirX
  const colX = new Float64Array(W)
  const colY = new Float64Array(W)
  for (let x = 0; x < W; x++) {
    const a = fit.angleLeft + (fit.angleRight - fit.angleLeft) * ((x + 0.5) / W)
    colX[x] = Math.cos(a) * fit.dirX + Math.sin(a) * px
    colY[x] = Math.cos(a) * fit.dirY + Math.sin(a) * py
  }
  for (let y = 0; y < H; y++) {
    // the top row of the rectangle is the wrap's top edge
    const t = 1 - (y + 0.5) / H
    const rho = fit.rhoBottom + (fit.rhoTop - fit.rhoBottom) * t
    for (let x = 0; x < W; x++) {
      const fx = (fit.cx + rho * colX[x]) * k - 0.5
      const fy = (fit.cy + rho * colY[x]) * k - 0.5
      const x0 = Math.max(0, Math.min(sw - 1, Math.floor(fx)))
      const y0 = Math.max(0, Math.min(sh - 1, Math.floor(fy)))
      const x1 = Math.min(sw - 1, x0 + 1)
      const y1 = Math.min(sh - 1, y0 + 1)
      const ax = Math.max(0, Math.min(1, fx - x0))
      const ay = Math.max(0, Math.min(1, fy - y0))
      const o = (y * W + x) * 4
      for (let c = 0; c < 4; c++) {
        const top = sd[(y0 * sw + x0) * 4 + c] * (1 - ax) + sd[(y0 * sw + x1) * 4 + c] * ax
        const bottom = sd[(y1 * sw + x0) * 4 + c] * (1 - ax) + sd[(y1 * sw + x1) * 4 + c] * ax
        out[o + c] = top * (1 - ay) + bottom * ay
      }
    }
  }
  return { data: out, width: W, height: H }
}
