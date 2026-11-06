import type { Product } from '../data/catalog';
import { TPLS, inkOn } from '../data/labelTemplates';
import { LOGO_SLOT, label, lookOf } from '../components/ProductJar';

// The label a customer designs: the full wrap (marketed-by panel | front design | manufacturer panel) at the real printed size.
// The same SVG feeds the flat view, the 3D jar and the print files, so what they see is what is printed.

export interface Details {
  brand: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
}

export interface LabelSpec {
  product: Product;
  flavour: string;
  /** Index of one of the 15 label designs. */
  design: number;
  details: Details;
  /** The customer's logo as a data address. */
  logo?: string;
}

export const PLACEHOLDER: Details = { brand: '', phone: '', email: '', address: '', city: '', pincode: '' };

// Same figures as the studio's label sizes: tubs 450 x 140 mm, 250 g jars 310 x 85 mm, tablet bottles 177.8 x 70 mm.
export const labelMm = (p: Product): { w: number; h: number } => (p.unit === 'sachet' ? { w: 140, h: 110 } : p.unit === 'kg' ? { w: 450, h: 140 } : p.unit === 'jar' ? { w: 310, h: 85 } : { w: 177.8, h: 70 });
/** The 3D pack a product is shown in: peanut butter has its own tapered cup with a white lid. */
export const jarKind = (p: Product): 'tub' | 'jar' | 'bottle' | 'cup' => (p.id === 'peanut' ? 'cup' : p.unit === 'kg' ? 'tub' : p.unit === 'jar' || p.unit === 'sachet' ? 'jar' : 'bottle');

/** Share of the wrap's width taken by the marketed-by panel, the front design and the manufacturer panel. */
export const PANELS: [number, number, number] = [0.28, 0.44, 0.28];

const MANUFACTURER = 'GOMZI LIFE SCIENCE LLP';
const MANUFACTURER_ADDRESS = '443-444-445, First Floor, RJD Textile Park, Pal-Hazira Road, Ichhapore, Surat-394510.';
const FSSAI = '10724997000182';

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
const round = (n: number) => Math.round(n * 100) / 100;

/** The exact logo area on this label, in mm, with the pixel size a sharp print needs (300 dpi). */
export function logoGuide(p: Product, design: number) {
  const { w, h } = labelMm(p);
  const { tp } = lookOf(p.id, design);
  const front = w * PANELS[1] * (tp.ribbon ? 0.81 : 1);
  const mmW = front * LOGO_SLOT.w;
  const mmH = h * LOGO_SLOT.h;
  const px = (mm: number) => Math.round((mm / 25.4) * 300);
  return { mmW: round(mmW), mmH: round(mmH), pxW: px(mmW), pxH: px(mmH) };
}

function wrapWords(text: string, maxChars: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + ' ' + word).length > maxChars) {
      out.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  if (line) out.push(line);
  return out;
}

type Row = { t: string; k: 'head' | 'bold' | 'text' | 'small' | 'gap' };

/** The side panels' text, in mm, shrunk until it fits the panel. */
function panel(X: number, W: number, H: number, c: { P: string; S: string; T: string }, rows: (fs: number, chars: number) => Row[], box?: string[]): string {
  const pad = W * 0.07;
  let fs = H * 0.05;
  for (let i = 0; i < 16; i++) {
    const chars = Math.floor((W - 2 * pad) / (fs * 0.6));
    const list = rows(fs, chars);
    const need = list.reduce((a, r) => a + (r.k === 'head' ? fs * 2.3 : r.k === 'gap' ? fs * 0.7 : fs * 1.32), 0) + (box ? (box.length + 1.2) * fs * 1.3 : 0) + pad;
    if (need <= H * 0.97) break;
    fs *= 0.93;
  }
  const chars = Math.floor((W - 2 * pad) / (fs * 0.6));
  const list = rows(fs, chars);
  let g = `<rect x="${X}" y="0" width="${W}" height="${H}" fill="${c.S}"/>`;
  let y = pad * 0.5;
  for (const r of list) {
    if (r.k === 'head') {
      const bh = fs * 1.9;
      g += `<rect x="${X + pad * 0.6}" y="${y}" width="${W - pad * 1.2}" height="${bh}" rx="${fs * 0.3}" fill="${c.P}"/>`;
      g += `<text x="${X + W / 2}" y="${y + bh / 2 + fs * 0.36}" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-weight="800" font-size="${fs * 0.95}" fill="${inkOn(c.P)}">${esc(r.t)}</text>`;
      y += fs * 2.3;
    } else if (r.k === 'gap') {
      y += fs * 0.7;
    } else {
      y += fs * 1.32;
      const weight = r.k === 'bold' ? 900 : r.k === 'small' ? 700 : 600;
      const size = r.k === 'small' ? fs * 0.82 : fs;
      const fill = r.k === 'small' ? c.P : c.T;
      g += `<text x="${X + pad}" y="${y - fs * 0.3}" font-family="Montserrat, Arial, sans-serif" font-weight="${weight}" font-size="${size}" fill="${fill}">${esc(r.t)}</text>`;
    }
  }
  if (box) {
    const bh = (box.length + 0.8) * fs * 1.3;
    const by = Math.min(H - pad * 0.6 - bh, y + fs * 0.4);
    g += `<rect x="${X + pad}" y="${by}" width="${W - 2 * pad}" height="${bh}" rx="${fs * 0.3}" fill="none" stroke="${c.T}" stroke-width="${Math.max(0.25, fs * 0.07)}"/>`;
    box.forEach((t, i) => {
      g += `<text x="${X + pad * 1.6}" y="${by + fs * 1.3 * (i + 1)}" font-family="Montserrat, Arial, sans-serif" font-weight="700" font-size="${fs * 0.86}" fill="${c.T}">${esc(t)}</text>`;
    });
  }
  return g;
}

/** The label as an SVG string. `view: 'front'` shows only the front design (for small thumbnails). `px` sets a fixed pixel width (for drawing to a picture). */
export function wrapSvg(spec: LabelSpec, id: string, opts: { view?: 'wrap' | 'front'; px?: number } = {}): string {
  const { product: p, flavour, design, details, logo } = spec;
  const { w: W, h: H } = labelMm(p);
  const { c } = lookOf(p.id, design);
  const lw = W * PANELS[0];
  const cw = W * PANELS[1];
  const rw = W * PANELS[2];

  const front = label(p, flavour, details.brand, { X: lw, Y: 0, W: cw, H }, id, { design, logo });

  const place = [details.city, details.pincode].filter(Boolean).join(' - ');
  const left = panel(0, lw, H, c, (_fs, chars) => {
    const rows: Row[] = [{ t: 'MARKETED BY', k: 'head' }, { t: details.brand || 'Your brand name', k: 'bold' }];
    for (const l of wrapWords(details.address || 'Your address', chars)) rows.push({ t: l, k: 'text' });
    if (place) for (const l of wrapWords(place, chars)) rows.push({ t: l, k: 'text' });
    rows.push({ t: '', k: 'gap' }, { t: 'CUSTOMER CARE', k: 'small' }, { t: details.phone || 'Your phone number', k: 'text' });
    if (details.email) rows.push({ t: 'EMAIL', k: 'small' }, ...wrapWords(details.email, chars).map((t): Row => ({ t, k: 'text' })));
    return rows;
  });
  const right = panel(
    lw + cw,
    rw,
    H,
    c,
    (_fs, chars) => [
      { t: 'MANUFACTURED BY', k: 'head' },
      { t: MANUFACTURER, k: 'bold' },
      ...wrapWords(MANUFACTURER_ADDRESS, chars).map((t): Row => ({ t, k: 'text' })),
      { t: '', k: 'gap' },
      { t: `FSSAI Lic. No.: ${FSSAI}`, k: 'bold' },
    ],
    ['BATCH NO.:', 'MFG. DATE:', 'EXP. DATE:', 'M.R.P. RS.:', 'U.S.P. RS.:', '(INCL. OF ALL TAXES)'],
  );

  const edge = `<rect x="${lw}" y="0" width="0.4" height="${H}" fill="${c.T}" opacity=".12"/><rect x="${lw + cw - 0.4}" y="0" width="0.4" height="${H}" fill="${c.T}" opacity=".12"/>`;
  const box = opts.view === 'front' ? `${lw} 0 ${cw} ${H}` : `0 0 ${W} ${H}`;
  const [bw, bh] = opts.view === 'front' ? [cw, H] : [W, H];
  const size = opts.px ? ` width="${opts.px}" height="${Math.round((opts.px * bh) / bw)}"` : '';
  const inner = opts.view === 'front' ? `<rect x="${lw}" y="0" width="${cw}" height="${H}" fill="${c.S}"/>${front}` : `${left}${front}${right}${edge}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}"${size} role="img" aria-label="${esc(p.name)} label"><defs><clipPath id="${id}clip"><rect x="${opts.view === 'front' ? lw : 0}" y="0" width="${bw}" height="${bh}"/></clipPath></defs><g clip-path="url(#${id}clip)">${inner}</g></svg>`;
}

// -- Drawing the SVG to a picture (fonts are embedded, because a picture of an SVG cannot reach the page's fonts) --
let fontCss: Promise<string> | null = null;

async function fontFaces(): Promise<string> {
  fontCss ??= (async () => {
    const b64 = async (url: string) => {
      const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(bin);
    };
    const [anton, mont] = await Promise.all([b64('/fonts/anton-latin.woff2'), b64('/fonts/montserrat-latin.woff2')]);
    return `@font-face{font-family:Anton;src:url(data:font/woff2;base64,${anton}) format('woff2')}@font-face{font-family:Montserrat;font-weight:500 900;src:url(data:font/woff2;base64,${mont}) format('woff2')}`;
  })().catch((e) => {
    fontCss = null;
    throw e;
  });
  return fontCss;
}

/** Draws the label to a canvas `px` wide. */
/** Loads the label fonts ahead of time, so the first label on a 3D pack does not wait for them. */
export const warmLabelFonts = (): Promise<void> => fontFaces().then(() => undefined, () => undefined);

export async function renderCanvas(spec: LabelSpec, px: number): Promise<HTMLCanvasElement> {
  const css = await fontFaces();
  const svg = wrapSvg(spec, 'r' + Math.random().toString(36).slice(2, 8), { px }).replace('<defs>', `<defs><style>${css}</style>`);
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((ok, fail) => {
    img.onload = () => ok();
    img.onerror = () => fail(new Error('Could not draw the label.'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const { w, h } = labelMm(spec.product);
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = Math.round((px * h) / w);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('Could not save the label picture.'))), type, quality));

export const designCount = TPLS.length as number;
export const designName = (i: number): string => TPLS[i].name;
