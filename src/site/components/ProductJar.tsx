import { useId } from 'react';
import type { Product } from '../data/catalog';
import { ART, ART_FOR } from '../data/art';
import { TPLS, inkOn, lum } from '../data/labelTemplates';

// Jar mock-ups ported from the Gomzi Life Science blueprint: the same shapes, the same 15 label designs and the flavour artwork.
type Shape = { lid: number[]; neck: number[] | null; body: number[]; L: number[] };
const SHAPES: Record<'tub' | 'small' | 'bottle', Shape> = {
  tub: { lid: [58, 8, 124, 42, 9], neck: [70, 48, 100, 10], body: [28, 56, 184, 236, 30], L: [28, 94, 184, 168] },
  small: { lid: [40, 80, 160, 28, 7], neck: null, body: [30, 104, 180, 180, 16], L: [30, 118, 180, 152] },
  bottle: { lid: [70, 20, 100, 36, 8], neck: [76, 52, 88, 28], body: [52, 72, 136, 216, 30], L: [52, 108, 136, 150] },
};

const TITLES: Record<string, string[]> = {
  wp57: ['WHEY', 'PROTEIN'], wp40: ['WHEY', 'PROTEIN'], wp30: ['WHEY', 'PROTEIN'], wpe: ['WHEY', 'BLEND'],
  yeast: ['YEAST', 'PROTEIN'], plant: ['PLANT', 'PROTEIN'], cre: ['CREATINE'], bcaa: ['BCAA'],
  pre: ['PRE-', 'WORKOUT'], biotin: ['BIOTIN'], d3k2: ['D3+K2'], multi: ['MULTI', 'VITAMIN'], calc: ['CALCIUM'],
  omega: ['OMEGA-3'], wpi: ['WHEY', 'ISOLATE'], wpc: ['WHEY', 'CONCENTRATE'], wp60: ['WHEY', 'PROTEIN'], gainer: ['MASS', 'GAINER'], eaa: ['EAA'], fatburner: ['FAT', 'BURNER'], peanut: ['PEANUT', 'BUTTER'], tea: ['SPICED', 'MILK TEA'], mocha: ['MOCHA', 'COFFEE'], pcos: ['PCOS', 'CARE'], liver: ['LIVER', 'HEALTH'], vitc: ['VITAMIN', 'C'], gummies: ['GUMMIES'], drops: ['DROPS'],
};

// Each product gets its own label design and colours (index into the blueprint's TPLS, then primary / base / text colour),
// so the range reads as 18 different products rather than one jar repeated.
type Look = { tpl: number; pal?: [string, string, string] };
const LOOKS: Record<string, Look> = {
  wp57: { tpl: 0 }, //  Slash, red on black
  wp40: { tpl: 6 }, //  Chevron, blue
  wp30: { tpl: 3 }, //  Clean, amber on white
  wpe: { tpl: 7 }, //   Frame, gold
  yeast: { tpl: 8 }, // Wave, teal
  plant: { tpl: 10 }, //Duo, green
  wpi: { tpl: 0 }, //   Slash, red on black (Whey Isolate)
  wpc: { tpl: 10 }, //  Duo, green (Whey Concentrate)
  wp60: { tpl: 3 }, //  Clean, amber on white
  gainer: { tpl: 7 }, // Frame, gold
  eaa: { tpl: 8, pal: ['#26A69A', '#0B1F1D', '#FFFFFF'] },
  fatburner: { tpl: 6, pal: ['#1E5BFF', '#0A1020', '#FFFFFF'] },
  peanut: { tpl: 11, pal: ['#C68642', '#1A1105', '#FFFFFF'] },
  tea: { tpl: 14, pal: ['#2E7D32', '#0F1A12', '#FFFFFF'] },
  mocha: { tpl: 14, pal: ['#6D4C2E', '#1A110A', '#FFFFFF'] },
  cre: { tpl: 1 }, //   Split, yellow
  bcaa: { tpl: 9 }, //  Badge, purple
  pre: { tpl: 2 }, //   Ember, red
  biotin: { tpl: 14 }, // Corner, teal on cream
  d3k2: { tpl: 4 }, //  Stack, lime
  multi: { tpl: 11 }, // Sunburst, amber
  calc: { tpl: 12 }, // Arch, pink
  omega: { tpl: 8, pal: ['#1E88E5', '#0B1F33', '#FFFFFF'] },
  pcos: { tpl: 12, pal: ['#C2185B', '#1A0A12', '#FFFFFF'] },
  liver: { tpl: 5, pal: ['#2E7D32', '#0F1A12', '#FFFFFF'] }, // Ribbon
  vitc: { tpl: 11, pal: ['#FB8C00', '#1A1205', '#FFFFFF'] },
  gummies: { tpl: 10, pal: ['#E91E63', '#1A0A12', '#FFFFFF'] },
  drops: { tpl: 8, pal: ['#00ACC1', '#06222A', '#FFFFFF'] },
};

/** The label design a product starts with (index into TPLS). */
export const ownDesign = (id: string): number => (LOOKS[id] ?? { tpl: 0 }).tpl;

/** `design` picks another of the 15 designs (with its own colours) instead of the product's own. */
export const lookOf = (id: string, design?: number) => {
  const look = LOOKS[id] ?? { tpl: 0 };
  const tp = TPLS[design ?? look.tpl];
  const [P, S, T] = (design === undefined ? look.pal : undefined) ?? tp.pal;
  return { tp, c: { P, S, T } };
};

/** Where a customer's logo goes on the front panel, as shares of the panel's width and height (also what the size guide is worked out from). */
export const LOGO_SLOT = { w: 0.6, h: 0.19, top: 0.035 };

/** The colour that tints a product's card background (its label's main colour). */
export const tintOf = (id: string): string => lookOf(id).c.P;

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

export interface LabelOpts {
  design?: number;
  /** The customer's logo as an image address; drawn in the logo slot instead of the brand name. */
  logo?: string;
}

export function label(p: Product, flavour: string, brand: string, L: { X: number; Y: number; W: number; H: number }, id: string, opts: LabelOpts = {}): string {
  const { X, Y, W, H } = L;
  const { tp, c } = lookOf(p.id, opts.design);
  const cx0 = tp.ribbon ? X + W * 0.19 : X;
  const cw = tp.ribbon ? W * 0.81 : W;
  const cx = cx0 + cw / 2;
  const name = (brand || 'YOUR BRAND').toUpperCase().slice(0, 16);

  let g: string = tp.bg(L, c, id, { brand: { name } });

  // The customer's logo, or the brand name as a wordmark, across the top
  if (opts.logo) {
    const sw = cw * LOGO_SLOT.w;
    const sh = H * LOGO_SLOT.h;
    const sy = Y + H * LOGO_SLOT.top;
    // a dark label gets a light plate, so a dark logo can still be read
    if (lum(c.S) < 0.4 && !tp.ribbon) g += `<rect x="${cx - sw / 2 - H * 0.012}" y="${sy - H * 0.012}" width="${sw + H * 0.024}" height="${sh + H * 0.024}" rx="${H * 0.02}" fill="#fff" opacity=".96"/>`;
    g += `<image href="${opts.logo}" x="${cx - sw / 2}" y="${sy}" width="${sw}" height="${sh}" preserveAspectRatio="xMidYMid meet"/>`;
  } else {
    const logoColor = tp.logoC ? tp.logoC(c) : c.T;
    const bf = Math.min(H * 0.085, (cw * 0.8) / (name.length * 0.62));
    g += `<text x="${cx}" y="${Y + H * 0.15}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="${bf}" letter-spacing="${bf * 0.06}" fill="${logoColor}">${esc(name)}</text>`;
  }

  // Product title
  const lines = TITLES[p.id] ?? [p.name.toUpperCase()];
  const maxLen = Math.max(...lines.map((l) => l.length));
  const fs = Math.min(H * (lines.length > 1 ? 0.19 : 0.24), (cw * 0.84) / (maxLen * 0.56));
  const top = Y + H * 0.25;
  const tc: string[] = tp.title(c);
  lines.forEach((ln, i) => {
    g += `<text x="${cx}" y="${top + fs * (0.92 + i)}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="${fs}" letter-spacing="${fs * 0.02}" fill="${tc[i] ?? c.T}">${esc(ln)}</text>`;
  });
  const ty = top + fs * (0.92 + lines.length - 1) + H * 0.075;
  g += `<text x="${cx}" y="${ty}" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-weight="800" font-size="${H * 0.041}" letter-spacing="${H * 0.005}" fill="${tp.tag ? tp.tag(c) : c.T}" opacity=".92">${esc(p.tag)}</text>`;

  // Flavour artwork
  const art = ART[ART_FOR[flavour] ?? ''];
  if (art) {
    const r = H * 0.095;
    g += `<g transform="translate(${cx0 + cw * 0.84 - r},${Y + H * 0.72 - r}) scale(${r / 50})">${art}</g>`;
  }

  // Bottom bar: flavour + pack size
  const bf2: string = tp.bar(c);
  const bt = inkOn(bf2);
  const byy = Y + H * 0.84;
  const bh = H * 0.12;
  g += `<rect x="${cx0}" y="${byy}" width="${cw}" height="${bh}" fill="${bf2}"/>`;
  const fl = flavour && flavour !== 'Standard' ? (p.id === 'peanut' ? flavour : `${flavour} flavour`).toUpperCase() : 'NUTRACEUTICAL';
  const vs = H * 0.05;
  const vx = cx0 + 7;
  const vy = byy + bh / 2 - vs / 2;
  g += `<rect x="${vx}" y="${vy}" width="${vs}" height="${vs}" fill="#fff" stroke="#1B8A2E" stroke-width="1"/><circle cx="${vx + vs / 2}" cy="${vy + vs / 2}" r="${vs * 0.24}" fill="#1B8A2E"/>`;
  const fsz = Math.min(H * 0.042, (cw * 0.55) / (fl.length * 0.62));
  g += `<text x="${vx + vs + 5}" y="${byy + bh / 2 + fsz * 0.36}" font-family="Montserrat, Arial, sans-serif" font-weight="800" font-size="${fsz}" fill="${bt}">${esc(fl)}</text>`;
  const wt = p.unit === 'kg' ? '1 KG' : (p.weight ?? '');
  g += `<text x="${cx0 + cw - 7}" y="${byy + bh / 2 + H * 0.016}" text-anchor="end" font-family="Montserrat, Arial, sans-serif" font-weight="900" font-size="${H * 0.046}" fill="${bt}">${esc(wt)}</text>`;
  return g;
}

/** The outline of a body: a plain rounded box, except the tablet bottle, whose wall narrows a little towards a wide, rounded foot like the real bottle. */
function bodyShape(p: Product, sh: Shape, attrs: string): string {
  const [bx, by, bw, bh, br] = sh.body;
  if (p.unit !== 'bottle') return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${br}" ${attrs}/>`;
  const x1 = bx + bw;
  const y1 = by + bh;
  const ys = by + bh * 0.78;
  const t = 5;
  const rf = 34;
  const d = `M${bx + br} ${by}H${x1 - br}Q${x1} ${by} ${x1} ${by + br}V${ys}L${x1 - t} ${y1 - rf}Q${x1 - t} ${y1} ${x1 - t - rf} ${y1}H${bx + t + rf}Q${bx + t} ${y1} ${bx + t} ${y1 - rf}L${bx} ${ys}V${by + br}Q${bx} ${by} ${bx + br} ${by}Z`;
  return `<path d="${d}" ${attrs}/>`;
}

/** A sachet packet (the 14 g instant mixes): a flat bag with crimped seals along its top and bottom and the label printed on its front. */
function sachetSvg(p: Product, flavour: string, brand: string, id: string, banner?: string): string {
  const { c } = lookOf(p.id);
  const light = lum(c.S) > 0.5;
  const x = 55;
  const w = 130;
  const y = 36;
  const h = 228;
  const seal = 17;
  const L = { X: x, Y: y + seal, W: w, H: h - seal * 2 };
  // slightly puffed sides, flat sealed top and bottom
  const bulge = 5;
  const d = `M${x + 3} ${y}H${x + w - 3}Q${x + w} ${y} ${x + w} ${y + 3}Q${x + w + bulge} ${y + h / 2} ${x + w} ${y + h - 3}Q${x + w} ${y + h} ${x + w - 3} ${y + h}H${x + 3}Q${x} ${y + h} ${x} ${y + h - 3}Q${x - bulge} ${y + h / 2} ${x} ${y + 3}Q${x} ${y} ${x + 3} ${y}Z`;
  let s = `<svg viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)} sachet">`;
  s += `<defs><clipPath id="${id}c"><path d="${d}"/></clipPath><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".18" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient></defs>`;
  s += `<ellipse cx="120" cy="${y + h + 8}" rx="${w * 0.46}" ry="6" fill="#000" opacity=".2"/>`;
  s += `<path d="${d}" fill="${light ? '#F1F1EE' : '#151515'}"/><g clip-path="url(#${id}c)">`;
  s += banner ? `<image href="${esc(banner)}" x="${L.X}" y="${L.Y}" width="${L.W}" height="${L.H}" preserveAspectRatio="xMidYMid slice"/>` : label(p, flavour, brand, L, id);
  // the crimped seals: a shaded band with fine ridges
  for (const sy of [y, y + h - seal]) {
    s += `<rect x="${x - bulge}" y="${sy}" width="${w + bulge * 2}" height="${seal}" fill="${light ? '#000' : '#fff'}" opacity=".12"/>`;
    for (let i = 2; i < seal; i += 3.2) s += `<rect x="${x - bulge}" y="${sy + i}" width="${w + bulge * 2}" height="1" fill="${light ? '#000' : '#fff'}" opacity=".22"/>`;
  }
  s += `</g><path d="${d}" fill="url(#${id}g)"/>`;
  // a tear notch on the top seal
  s += `<path d="M${x} ${y + seal / 2}l5 -3v6z" fill="#fff" opacity=".55"/>`;
  return s + '</svg>';
}

/** A dropper bottle (the 30 ml drops): a glass-style bottle with a metal collar and a rubber dropper bulb on top. */
function dropperSvg(p: Product, flavour: string, brand: string, id: string, banner?: string): string {
  const { c } = lookOf(p.id);
  const bx = 66;
  const bw = 108;
  const by = 122;
  const bh = 164;
  const L = { X: bx, Y: 150, W: bw, H: 112 };
  const body = `M${bx + 26} ${by}H${bx + bw - 26}Q${bx + bw} ${by} ${bx + bw} ${by + 26}V${by + bh - 24}Q${bx + bw} ${by + bh} ${bx + bw - 24} ${by + bh}H${bx + 24}Q${bx} ${by + bh} ${bx} ${by + bh - 24}V${by + 26}Q${bx} ${by} ${bx + 26} ${by}Z`;
  let s = `<svg viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)} dropper bottle">`;
  s += `<defs><clipPath id="${id}c"><path d="${body}"/></clipPath><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".16" stop-color="#fff" stop-opacity=".08"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient><linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset=".3" stop-color="#5a5a5a"/><stop offset=".55" stop-color="#1a1a1a"/><stop offset="1" stop-color="#050505"/></linearGradient></defs>`;
  s += `<ellipse cx="120" cy="${by + bh + 4}" rx="${bw * 0.46}" ry="6" fill="#000" opacity=".2"/>`;
  // the rubber bulb and the collar it sits in
  s += `<path d="M104 90V50Q104 18 120 18Q136 18 136 50V90Z" fill="url(#${id}b)"/><path d="M110 28Q112 22 118 22" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".4"/>`;
  s += `<rect x="94" y="86" width="52" height="40" rx="6" fill="#0D0D0D"/>`;
  for (let i = 1; i < 6; i++) s += `<rect x="97" y="${86 + i * 6.4}" width="46" height="1.2" fill="#fff" opacity=".1"/>`;
  s += `<rect x="94" y="84" width="52" height="5" rx="2.5" fill="${c.P}"/>`;
  // the bottle
  s += `<path d="${body}" fill="#151515"/><g clip-path="url(#${id}c)">`;
  s += banner ? `<image href="${esc(banner)}" x="${L.X}" y="${L.Y}" width="${L.W}" height="${L.H}" preserveAspectRatio="xMidYMid slice"/>` : label(p, flavour, brand, L, id);
  s += `</g><path d="${body}" fill="url(#${id}g)"/></svg>`;
  return s;
}

export function jarSvg(p: Product, flavour: string, brand: string, id: string, banner?: string): string {
  if (p.id === 'drops') return dropperSvg(p, flavour, brand, id, banner);
  if (p.unit === 'sachet') return sachetSvg(p, flavour, brand, id, banner);
  const sh = SHAPES[p.unit === 'kg' ? 'tub' : p.unit === 'jar' ? 'small' : 'bottle'];
  const { c } = lookOf(p.id);
  const light = lum(c.S) > 0.5;
  const jar = light ? '#F1F1EE' : '#151515';
  const lidC = light ? '#E3E3DF' : '#0D0D0D';
  const [, by, bw, bh] = sh.body;
  const [X, Y, W, H] = sh.L;
  const [lx, ly, lw, lh, lr] = sh.lid;
  let s = `<svg viewBox="0 0 240 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)} jar">`;
  s += `<defs><clipPath id="${id}c">${bodyShape(p, sh, '')}</clipPath><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".16" stop-color="#fff" stop-opacity=".07"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>`;
  s += `<ellipse cx="120" cy="${by + bh + 3}" rx="${bw * 0.46}" ry="6" fill="#000" opacity=".2"/><rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="${lr}" fill="${lidC}"/>`;
  for (let i = 1; i < 5; i++) s += `<rect x="${lx + 3}" y="${ly + (lh * i) / 5}" width="${lw - 6}" height="1.2" fill="${light ? '#000' : '#fff'}" opacity=".07"/>`;
  if (sh.neck) {
    const [nx, ny, nw, nh] = sh.neck;
    s += `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" fill="${lidC}"/>`;
  }
  s += `${bodyShape(p, sh, `fill="${jar}"`)}<g clip-path="url(#${id}c)">${banner ? `<image href="${esc(banner)}" x="${X}" y="${Y}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>` : label(p, flavour, brand, { X, Y, W, H }, id)}</g>${bodyShape(p, sh, `fill="url(#${id}g)"`)}`;
  return s + '</svg>';
}

interface Props {
  product: Product;
  flavour?: string;
  brand?: string;
  className?: string;
  /** A finished banner picture drawn on the label instead of the product's own design. */
  banner?: string;
}

/** A product jar with its own label design, in the style of the blueprint's hero and range cards. */
export function ProductJar({ product, flavour, brand = '', className, banner }: Props) {
  const id = 'j' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return <div className={className} dangerouslySetInnerHTML={{ __html: jarSvg(product, flavour ?? product.flavours[0], brand, id, banner) }} />;
}
