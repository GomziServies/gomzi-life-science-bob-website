/**
 * The dieline library: the flat shape of a pack, in millimetres, as a printer expects it.
 *
 * A dieline says how big the artwork is, where the pack folds or wraps (panels and creases), what stays clear of the cut
 * (bleed and safe margin) and where the pack has parts that must not carry type (seals, zipper, gusset, glue flap). The
 * editor draws it over the page, the template generator lays designs out on its panels, and the 3D mockup wraps the
 * artwork around the right shape.
 *
 * Sizes are the common real-world ones: a 1 kg protein tub takes a 335 x 105 mm wrap, a 12 oz can 206 x 127 mm, a
 * 160 x 240 mm stand-up pouch is the usual 250 g coffee bag. Everything is a plain number so it can be checked.
 */

export const PX_PER_MM = 96 / 25.4
export const mmToPx = (mm: number): number => Math.round(mm * PX_PER_MM * 100) / 100

export type DielineKind = 'wrap' | 'pouch' | 'sachet' | 'box' | 'tube' | 'label'
export type DielineGroup = 'tubs-jars' | 'bottles-cans' | 'pouches' | 'boxes' | 'tubes' | 'labels'
export type MockupShape = 'tub' | 'jar' | 'bottle' | 'dropper' | 'can' | 'pouch' | 'sachet' | 'box' | 'tube' | 'flat'

export const DIELINE_GROUPS: readonly { id: DielineGroup; label: string }[] = [
  { id: 'tubs-jars', label: 'Tubs & jars' },
  { id: 'bottles-cans', label: 'Bottles & cans' },
  { id: 'pouches', label: 'Pouches & sachets' },
  { id: 'boxes', label: 'Boxes' },
  { id: 'tubes', label: 'Tubes' },
  { id: 'labels', label: 'Labels' },
]

/** One face of the pack: where it sits across the flat artwork (mm from the left edge). */
export interface DielinePanel {
  id: string
  label: string
  /** What usually goes here: shown in the editor and used by the template generator. */
  role: 'front' | 'back' | 'side' | 'story' | 'info' | 'glue' | 'whole'
  x: number
  w: number
}

export type ZoneKind = 'seal' | 'gusset' | 'zipper' | 'tear' | 'flap' | 'glue' | 'hang' | 'cap'

/** A part of the pack that cannot carry artwork or type: a heat seal, the zipper, a tuck flap. Millimetres in the flat. */
export interface DielineZone {
  kind: ZoneKind
  label: string
  x: number
  y: number
  w: number
  h: number
}

export interface Dieline {
  id: string
  name: string
  group: DielineGroup
  kind: DielineKind
  description: string
  /** The size of the flat artwork, in millimetres. */
  widthMm: number
  heightMm: number
  bleedMm: number
  /** Keep type and logos this far inside the trim and off the folds. */
  safeMm: number
  panels: readonly DielinePanel[]
  /** Vertical creases or seams, mm from the left. */
  folds: readonly number[]
  /** Horizontal creases (box flaps), mm from the top. */
  hFolds: readonly number[]
  zones: readonly DielineZone[]
  /** Corner radius of the die cut (pouches, labels), mm. */
  cornerMm: number
  /** What the pack looks like finished: the 3D mockup builds this shape and wraps the artwork round it. */
  mockup: { shape: MockupShape; /** Which panel faces the viewer. */ facing: string }
  /** What the pack holds, for browsing ("1 kg", "250 g", "330 ml"). */
  holds: string
}

type Seed = Omit<Dieline, 'bleedMm' | 'safeMm' | 'folds' | 'hFolds' | 'zones' | 'cornerMm' | 'panels'> &
  Partial<Pick<Dieline, 'bleedMm' | 'safeMm' | 'folds' | 'hFolds' | 'zones' | 'cornerMm'>> & { panels: readonly DielinePanel[] }

function make(seed: Seed): Dieline {
  const panels = seed.panels
  return {
    bleedMm: 3,
    safeMm: 3,
    folds: panels.slice(1).map((p) => p.x),
    hFolds: [],
    zones: [],
    cornerMm: 0,
    ...seed,
  }
}

/** A wrap-around label of equal panels (a tub or jar seen as left | front | right). */
function wrap(id: string, name: string, group: DielineGroup, w: number, h: number, holds: string, shape: MockupShape, description: string, labels: readonly [string, string, string] = ['Left', 'Front', 'Right']): Dieline {
  const third = Math.round((w / 3) * 100) / 100
  const roles = ['story', 'front', 'info'] as const
  return make({
    id,
    name,
    group,
    kind: 'wrap',
    description,
    widthMm: w,
    heightMm: h,
    holds,
    panels: labels.map((label, i) => ({ id: ['left', 'front', 'right'][i], label, role: roles[i], x: Math.round(third * i * 100) / 100, w: i === 2 ? Math.round((w - third * 2) * 100) / 100 : third })),
    mockup: { shape, facing: 'front' },
  })
}

function pouch(id: string, name: string, w: number, h: number, holds: string, description: string, twoUp = false): Dieline {
  const seal = 10
  const side = 8
  const gusset = Math.round(h * 0.16)
  const panelW = w
  const total = twoUp ? w * 2 + 12 : w
  const zonesFor = (x0: number): DielineZone[] => [
    { kind: 'seal', label: 'Top seal', x: x0, y: 0, w: panelW, h: seal },
    { kind: 'seal', label: 'Side seal', x: x0, y: seal, w: side, h: h - seal - gusset },
    { kind: 'seal', label: 'Side seal', x: x0 + panelW - side, y: seal, w: side, h: h - seal - gusset },
    { kind: 'zipper', label: 'Zipper', x: x0 + side, y: seal + 28, w: panelW - side * 2, h: 6 },
    { kind: 'tear', label: 'Tear notch', x: x0, y: seal + 18, w: 4, h: 4 },
    { kind: 'tear', label: 'Tear notch', x: x0 + panelW - 4, y: seal + 18, w: 4, h: 4 },
    { kind: 'gusset', label: 'Bottom gusset', x: x0, y: h - gusset, w: panelW, h: gusset },
  ]
  return make({
    id,
    name,
    group: 'pouches',
    kind: 'pouch',
    description,
    widthMm: total,
    heightMm: h,
    holds,
    safeMm: 6,
    cornerMm: 6,
    panels: twoUp
      ? [
          { id: 'front', label: 'Front', role: 'front', x: 0, w },
          { id: 'back', label: 'Back', role: 'info', x: w + 12, w },
        ]
      : [{ id: 'front', label: 'Front', role: 'front', x: 0, w }],
    folds: twoUp ? [w + 6] : [],
    zones: twoUp ? [...zonesFor(0), ...zonesFor(w + 12)] : zonesFor(0),
    mockup: { shape: 'pouch', facing: 'front' },
  })
}

/** A tuck-end carton net: glue flap | side | front | side | back, with tuck flaps along the top and bottom edges. */
function box(id: string, name: string, w: number, d: number, h: number, holds: string, description: string): Dieline {
  const glue = 15
  const tuck = 20
  const total = glue + d + w + d + w
  const flat = tuck + h + tuck
  const x = (n: number): number => glue + (n === 0 ? 0 : n === 1 ? d : n === 2 ? d + w : d + w + d)
  return make({
    id,
    name,
    group: 'boxes',
    kind: 'box',
    description,
    widthMm: total,
    heightMm: flat,
    holds,
    safeMm: 4,
    panels: [
      { id: 'glue', label: 'Glue flap', role: 'glue', x: 0, w: glue },
      { id: 'side-a', label: 'Side', role: 'side', x: x(0), w: d },
      { id: 'front', label: 'Front', role: 'front', x: x(1), w: w },
      { id: 'side-b', label: 'Side', role: 'side', x: x(2), w: d },
      { id: 'back', label: 'Back', role: 'info', x: x(3), w: w },
    ],
    hFolds: [tuck, tuck + h],
    zones: [
      { kind: 'glue', label: 'Glue', x: 0, y: tuck, w: glue, h },
      { kind: 'flap', label: 'Tuck flap', x: x(1), y: 0, w, h: tuck },
      { kind: 'flap', label: 'Tuck flap', x: x(3), y: 0, w, h: tuck },
      { kind: 'flap', label: 'Bottom flap', x: x(1), y: tuck + h, w, h: tuck },
      { kind: 'flap', label: 'Bottom flap', x: x(3), y: tuck + h, w, h: tuck },
      { kind: 'flap', label: 'Dust flap', x: x(0), y: 0, w: d, h: tuck },
      { kind: 'flap', label: 'Dust flap', x: x(2), y: 0, w: d, h: tuck },
      { kind: 'flap', label: 'Dust flap', x: x(0), y: tuck + h, w: d, h: tuck },
      { kind: 'flap', label: 'Dust flap', x: x(2), y: tuck + h, w: d, h: tuck },
    ],
    mockup: { shape: 'box', facing: 'front' },
  })
}

function tube(id: string, name: string, w: number, h: number, holds: string, description: string): Dieline {
  return make({
    id,
    name,
    group: 'tubes',
    kind: 'tube',
    description,
    widthMm: w,
    heightMm: h,
    holds,
    safeMm: 4,
    panels: [
      { id: 'front', label: 'Front', role: 'front', x: 0, w: w / 2 },
      { id: 'back', label: 'Back', role: 'info', x: w / 2, w: w / 2 },
    ],
    zones: [
      { kind: 'seal', label: 'Crimp seal', x: 0, y: h - 12, w, h: 12 },
      { kind: 'cap', label: 'Shoulder', x: 0, y: 0, w, h: 14 },
    ],
    mockup: { shape: 'tube', facing: 'front' },
  })
}

export const DIELINES: readonly Dieline[] = [
  // Tubs and jars: a label wrapped round the body, read as three panels.
  wrap('tub-250g', 'Tub 250 g', 'tubs-jars', 262, 70, '250 g', 'tub', 'Small protein or creatine tub: 83 mm across, a 262 x 70 mm wrap.'),
  wrap('tub-500g', 'Tub 500 g', 'tubs-jars', 305, 85, '500 g', 'tub', 'Half-kilo supplement tub: 97 mm across, a 305 x 85 mm wrap.'),
  wrap('tub-1kg', 'Tub 1 kg', 'tubs-jars', 335, 105, '1 kg', 'tub', 'The standard 1 kg protein tub: 335 x 105 mm, left story, front hero, right facts.'),
  wrap('tub-2kg', 'Tub 2 kg', 'tubs-jars', 395, 130, '2 kg', 'tub', 'A 2 kg tub: 395 x 130 mm, with a wide front panel for the hero.'),
  wrap('jar-glass-220', 'Glass jar 220 mm wrap', 'tubs-jars', 220, 70, '350 g', 'jar', 'A full wrap for a straight glass jar: 220 x 70 mm.'),
  wrap('jar-honey-350', 'Honey jar 350 g', 'tubs-jars', 235, 72, '350 g', 'jar', 'A squat honey or spread jar: 235 x 72 mm.'),
  wrap('jar-cream-60', 'Cream jar 60 ml', 'tubs-jars', 175, 38, '60 ml', 'jar', 'A cosmetic cream jar side label: 175 x 38 mm.'),
  // Bottles and cans.
  wrap('can-330', 'Can 330 ml', 'bottles-cans', 210, 115, '330 ml', 'can', 'A standard 330 ml can wrap: 210 x 115 mm.'),
  wrap('can-12oz', 'Sleek can 12 oz', 'bottles-cans', 206, 127, '355 ml', 'can', 'A sleek 12 oz can wrap: 206 x 127 mm.'),
  wrap('bottle-500ml', 'Bottle 500 ml', 'bottles-cans', 205, 85, '500 ml', 'bottle', 'A 500 ml round bottle label: 205 x 85 mm.'),
  wrap('bottle-1l', 'Bottle 1 litre', 'bottles-cans', 255, 120, '1 l', 'bottle', 'A 1 litre bottle label: 255 x 120 mm.'),
  make({
    id: 'bottle-oval-250',
    name: 'Oval bottle 250 ml',
    group: 'bottles-cans',
    kind: 'wrap',
    description: 'A 250 ml shampoo or lotion bottle: front and back labels side by side, 150 x 95 mm.',
    widthMm: 150,
    heightMm: 95,
    holds: '250 ml',
    safeMm: 3,
    panels: [
      { id: 'front', label: 'Front', role: 'front', x: 0, w: 75 },
      { id: 'back', label: 'Back', role: 'info', x: 75, w: 75 },
    ],
    mockup: { shape: 'bottle', facing: 'front' },
  }),
  make({
    id: 'bottle-dropper-30',
    name: 'Dropper bottle 30 ml',
    group: 'bottles-cans',
    kind: 'wrap',
    description: 'A 30 ml tincture or serum bottle: a 95 x 45 mm wrap.',
    widthMm: 95,
    heightMm: 45,
    holds: '30 ml',
    safeMm: 2,
    panels: [
      { id: 'left', label: 'Left', role: 'story', x: 0, w: 31.67 },
      { id: 'front', label: 'Front', role: 'front', x: 31.67, w: 31.67 },
      { id: 'right', label: 'Right', role: 'info', x: 63.34, w: 31.66 },
    ],
    mockup: { shape: 'dropper', facing: 'front' },
  }),
  // Pouches and sachets.
  pouch('pouch-stand-160x240', 'Stand-up pouch 160 x 240', 160, 240, '250 g', 'The usual 250 g stand-up pouch (coffee, snacks, granola): front panel with seals, zipper and gusset marked.'),
  pouch('pouch-stand-200x300', 'Stand-up pouch 200 x 300', 200, 300, '500 g', 'A 500 g to 1 kg stand-up pouch: 200 x 300 mm.'),
  pouch('pouch-stand-front-back', 'Stand-up pouch, front and back', 160, 240, '250 g', 'Front and back of the 160 x 240 pouch side by side, as the printer receives them.', true),
  make({
    id: 'sachet-3side-80x120',
    name: 'Sachet 80 x 120',
    group: 'pouches',
    kind: 'sachet',
    description: 'A three-side-seal sachet for powders and samples: 80 x 120 mm.',
    widthMm: 80,
    heightMm: 120,
    holds: '15 g',
    safeMm: 6,
    cornerMm: 2,
    panels: [{ id: 'front', label: 'Front', role: 'front', x: 0, w: 80 }],
    zones: [
      { kind: 'seal', label: 'Top seal', x: 0, y: 0, w: 80, h: 8 },
      { kind: 'seal', label: 'Side seal', x: 0, y: 8, w: 6, h: 104 },
      { kind: 'seal', label: 'Side seal', x: 74, y: 8, w: 6, h: 104 },
      { kind: 'seal', label: 'Bottom seal', x: 0, y: 112, w: 80, h: 8 },
      { kind: 'tear', label: 'Tear notch', x: 0, y: 20, w: 4, h: 4 },
    ],
    mockup: { shape: 'sachet', facing: 'front' },
  }),
  make({
    id: 'stick-pack-30x140',
    name: 'Stick pack 30 x 140',
    group: 'pouches',
    kind: 'sachet',
    description: 'A slim stick pack for single-serve powders: 30 x 140 mm.',
    widthMm: 30,
    heightMm: 140,
    holds: '10 g',
    safeMm: 4,
    cornerMm: 1,
    panels: [{ id: 'front', label: 'Front', role: 'front', x: 0, w: 30 }],
    zones: [
      { kind: 'seal', label: 'Top seal', x: 0, y: 0, w: 30, h: 6 },
      { kind: 'seal', label: 'Bottom seal', x: 0, y: 134, w: 30, h: 6 },
    ],
    mockup: { shape: 'sachet', facing: 'front' },
  }),
  // Boxes (carton nets).
  box('box-tuck-60x60x120', 'Tuck box 60 x 60 x 120', 60, 60, 120, '60 capsules', 'A small supplement carton: 60 x 60 mm base, 120 mm tall, flat net 255 x 160 mm.'),
  box('box-tuck-100x40x150', 'Tuck box 100 x 40 x 150', 100, 40, 150, '10 servings', 'A wide carton for bars or sachets: 100 x 40 mm base, 150 mm tall, flat net 295 x 190 mm.'),
  box('box-tuck-80x80x80', 'Cube box 80 x 80 x 80', 80, 80, 80, 'gift set', 'A small cube gift or soap box: 80 mm all round.'),
  // Tubes.
  tube('tube-50ml', 'Tube 50 ml', 110, 125, '50 ml', 'A 35 mm tube: a 110 x 125 mm print, front and back.'),
  tube('tube-100ml', 'Tube 100 ml', 126, 145, '100 ml', 'A 40 mm tube: a 126 x 145 mm print, front and back.'),
  // Flat labels.
  make({
    id: 'label-shipping-4x6',
    name: 'Shipping label 4 x 6 in',
    group: 'labels',
    kind: 'label',
    description: 'A 102 x 152 mm shipping or carton label.',
    widthMm: 102,
    heightMm: 152,
    holds: 'carton',
    safeMm: 4,
    cornerMm: 2,
    panels: [{ id: 'front', label: 'Label', role: 'whole', x: 0, w: 102 }],
    mockup: { shape: 'flat', facing: 'front' },
  }),
]

export function dielineById(id: string | undefined): Dieline | undefined {
  return DIELINES.find((d) => d.id === id)
}

export function dielinesIn(group: DielineGroup): readonly Dieline[] {
  return DIELINES.filter((d) => d.group === group)
}

export interface PxRect {
  x: number
  y: number
  w: number
  h: number
}

/** The flat artwork's size in page pixels (96 per inch), the unit the document is stored in. */
export function dielineSizePx(d: Dieline): { width: number; height: number } {
  return { width: Math.round(mmToPx(d.widthMm)), height: Math.round(mmToPx(d.heightMm)) }
}

/** Every panel as a rectangle in page pixels. The panels span the full height of the flat. */
export function panelRects(d: Dieline): Record<string, PxRect> {
  const h = mmToPx(d.heightMm)
  const [top, bottom] = d.hFolds.length === 2 ? d.hFolds : [0, d.heightMm]
  const body = d.kind === 'box'
  return Object.fromEntries(
    d.panels.map((p) => [
      p.id,
      body && p.role !== 'glue'
        ? { x: mmToPx(p.x), y: mmToPx(top), w: mmToPx(p.w), h: mmToPx(bottom - top) }
        : { x: mmToPx(p.x), y: 0, w: mmToPx(p.w), h },
    ]),
  )
}

export function zoneRectPx(z: DielineZone): PxRect {
  return { x: mmToPx(z.x), y: mmToPx(z.y), w: mmToPx(z.w), h: mmToPx(z.h) }
}

/** Where type may go on a panel: the panel less the safe margin, and for pouches less the seals and gusset. */
export function safeRect(d: Dieline, panelId: string): PxRect {
  const p = panelRects(d)[panelId]
  const safe = mmToPx(d.safeMm)
  let { x, y, w, h } = p
  x += safe
  w -= safe * 2
  y += safe
  h -= safe * 2
  if (d.kind === 'pouch' || d.kind === 'sachet') {
    const seals = d.zones.filter((z) => z.kind === 'seal' || z.kind === 'gusset').map(zoneRectPx)
    const panel = d.panels.find((q) => q.id === panelId)
    for (const z of seals) {
      if (!panel || z.x < mmToPx(panel.x) - 1 || z.x >= mmToPx(panel.x + panel.w) - 1) continue
      if (z.w >= p.w * 0.8) {
        // A seal across the top or the gusset along the bottom.
        if (z.y < p.h / 2) {
          y = Math.max(y, z.y + z.h + safe)
        } else {
          h = Math.min(h, z.y - y - safe)
        }
      }
    }
    const sideW = Math.max(0, ...d.zones.filter((z) => z.kind === 'seal' && z.w < d.widthMm * 0.2 && z.h > d.heightMm * 0.3).map((z) => mmToPx(z.w)))
    if (sideW > 0) {
      x = Math.max(x, p.x + sideW + safe)
      w = Math.min(w, p.x + p.w - sideW - safe - x)
    }
  }
  return { x, y, w: Math.max(0, w), h: Math.max(0, h) }
}
