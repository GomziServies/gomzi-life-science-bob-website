/**
 * Picks the colours a picture is traced with. The tracer's own sampling can give muddy or repeated colours for a
 * small palette, so the palette is built here: a weighted k-means over a histogram of the picture, started from
 * the most common colour and then from the colour furthest from the ones chosen. Deterministic: the same picture
 * always gives the same palette.
 */
export interface PaletteColor {
  r: number
  g: number
  b: number
  a: number
}

interface Bin {
  r: number
  g: number
  b: number
  n: number
}

const TRANSPARENT_SHARE = 0.01
/** A colour needs at least this share of the picture to become a palette colour; the blended pixels along soft edges never do. */
const MIN_SHARE = 0.003
const LLOYD_ROUNDS = 8
/** A colour this close to the straight line between two chosen colours is an anti-aliasing blend of them... */
const BLEND_TOLERANCE = 40
/** ...unless it fills this much of the picture, which makes it a real colour (a flat pink between red and white). */
const REAL_SHARE = 0.02

const dist2 = (a: Bin | PaletteColor, b: Bin | PaletteColor): number => (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2

/** Distance from `p` to the segment a-b in RGB space. */
function distToSegment(p: Bin, a: PaletteColor, b: PaletteColor): number {
  const abx = b.r - a.r
  const aby = b.g - a.g
  const abz = b.b - a.b
  const len2 = abx * abx + aby * aby + abz * abz
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((p.r - a.r) * abx + (p.g - a.g) * aby + (p.b - a.b) * abz) / len2))
  return Math.sqrt((p.r - (a.r + abx * t)) ** 2 + (p.g - (a.g + aby * t)) ** 2 + (p.b - (a.b + abz * t)) ** 2)
}

function isBlend(bin: Bin, centers: readonly PaletteColor[], opaque: number): boolean {
  if (bin.n >= opaque * REAL_SHARE) return false
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) if (distToSegment(bin, centers[i], centers[j]) < BLEND_TOLERANCE) return true
  }
  return false
}

/** At most `k` colours (plus one see-through entry when the picture has transparency) that stand for `data` (RGBA). */
export function buildPalette(data: ArrayLike<number>, pixels: number, k: number): PaletteColor[] {
  const counts = new Map<number, Bin>()
  let transparent = 0
  for (let p = 0; p < pixels; p++) {
    const i = p * 4
    if (data[i + 3] < 128) {
      transparent++
      continue
    }
    // 5 bits per channel keeps the histogram small while flat colours stay exact enough to average back.
    const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3)
    const bin = counts.get(key)
    if (bin) {
      bin.n++
      bin.r += data[i]
      bin.g += data[i + 1]
      bin.b += data[i + 2]
    } else counts.set(key, { r: data[i], g: data[i + 1], b: data[i + 2], n: 1 })
  }
  const bins: Bin[] = [...counts.values()].map((b) => ({ r: b.r / b.n, g: b.g / b.n, b: b.b / b.n, n: b.n }))
  bins.sort((a, b) => b.n - a.n)

  const out: PaletteColor[] = []
  const wantsTransparent = pixels > 0 && transparent / pixels >= TRANSPARENT_SHARE
  if (wantsTransparent) out.push({ r: 0, g: 0, b: 0, a: 0 })
  const slots = Math.max(1, Math.round(k) - out.length)
  if (bins.length === 0) return out.length > 0 ? out : [{ r: 255, g: 255, b: 255, a: 255 }]

  const opaque = pixels - transparent
  const minCount = Math.max(2, opaque * MIN_SHARE)
  const centers: PaletteColor[] = [{ r: bins[0].r, g: bins[0].g, b: bins[0].b, a: 255 }]
  const nearest = bins.map((b) => dist2(b, centers[0]))
  while (centers.length < Math.min(slots, bins.length)) {
    let best = -1
    let bestScore = 0
    bins.forEach((b, i) => {
      if (b.n < minCount || isBlend(b, centers, opaque)) return
      const score = Math.sqrt(b.n) * nearest[i]
      if (score > bestScore) {
        best = i
        bestScore = score
      }
    })
    if (best < 0) break
    const c = { r: bins[best].r, g: bins[best].g, b: bins[best].b, a: 255 }
    centers.push(c)
    bins.forEach((b, i) => {
      nearest[i] = Math.min(nearest[i], dist2(b, c))
    })
  }

  for (let round = 0; round < LLOYD_ROUNDS; round++) {
    const sum = centers.map(() => ({ r: 0, g: 0, b: 0, n: 0 }))
    for (const b of bins) {
      let at = 0
      let d = Infinity
      centers.forEach((c, i) => {
        const v = dist2(b, c)
        if (v < d) {
          d = v
          at = i
        }
      })
      sum[at].r += b.r * b.n
      sum[at].g += b.g * b.n
      sum[at].b += b.b * b.n
      sum[at].n += b.n
    }
    sum.forEach((s, i) => {
      if (s.n > 0) centers[i] = { r: s.r / s.n, g: s.g / s.n, b: s.b / s.n, a: 255 }
    })
  }
  for (const c of centers) out.push({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b), a: 255 })
  return out
}
