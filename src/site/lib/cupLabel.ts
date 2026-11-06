import { bannerImageUrl, type GalleryBanner } from './api';
import { detectCupWrap, unrollWrap } from '../../editor/packaging/cupWrap';

/**
 * Peanut butter cup labels, ready for the shop's 3D cup. A cup label is a print layout: the curved wrap for the cup's
 * tapered side and a round sticker for its lid. The curved wrap is found and laid out flat, so it goes once round the cup
 * looking as printed, and the sticker is cut out for the lid. Each picture is done once per visit.
 */
export interface CupArt {
  /** The wrap laid flat (a picture address in this browser) and its size. */
  image: string;
  width: number;
  height: number;
  /** The round lid sticker, cut out on a transparent square, when the layout has one. */
  lid: string | null;
}

const cache = new Map<string, Promise<CupArt | null>>();

/** Widest the picture is read at (a 4000 px print layout is more than a 3D cup needs) and the flat wrap's width. */
const READ_MAX = 2400;
const FLAT_WIDTH = 2048;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The label picture could not be loaded.'));
    img.src = src;
  });

const canvasOf = (img: HTMLImageElement, width: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round((width * img.naturalHeight) / Math.max(1, img.naturalWidth)));
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, c.width, c.height);
  return { canvas: c, pixels: g.getImageData(0, 0, c.width, c.height) };
};

const blobUrl = (c: HTMLCanvasElement, type: string) =>
  new Promise<string | null>((resolve) => c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), type, 0.92));

/** Results already known, so a window that opens on a label done before can show it at once (no waiting, not even a frame). */
const done = new Map<string, CupArt | null>();
/** The prepared art for a picture, when it has been prepared already; `undefined` when it has not. */
export const cupArtCached = (src: string): CupArt | null | undefined => done.get(src);

/** The slow part, on the page's own thread: used when the browser has no worker or no OffscreenCanvas. */
function cupArtHere(src: string): Promise<CupArt | null> {
  return loadImage(src)
    .then(async (img) => {
      const fit = detectCupWrap(canvasOf(img, 600).pixels);
      if (!fit) return null;
      const big = canvasOf(img, Math.min(READ_MAX, img.naturalWidth));
      const flat = unrollWrap(big.pixels, fit, FLAT_WIDTH);
      const c = document.createElement('canvas');
      c.width = flat.width;
      c.height = flat.height;
      const g = c.getContext('2d')!;
      const pixels = g.createImageData(flat.width, flat.height);
      pixels.data.set(flat.data);
      g.putImageData(pixels, 0, 0);
      const image = await blobUrl(c, 'image/jpeg');
      if (!image) return null;
      // the lid sticker: its circle cut from the full picture, transparent round it
      let lid: string | null = null;
      if (fit.lid) {
        const k = big.canvas.width / fit.width;
        const r = fit.lid.r * k;
        const s = document.createElement('canvas');
        s.width = s.height = Math.max(2, Math.round(2 * r));
        const sg = s.getContext('2d')!;
        sg.beginPath();
        sg.arc(s.width / 2, s.height / 2, s.width / 2, 0, Math.PI * 2);
        sg.clip();
        sg.drawImage(big.canvas, fit.lid.x * k - r, fit.lid.y * k - r, 2 * r, 2 * r, 0, 0, s.width, s.height);
        lid = await blobUrl(s, 'image/png');
      }
      return { image, width: flat.width, height: flat.height, lid };
    })
    .catch(() => null);
}

/** One worker does all the label preparing, off the page's main thread (the page stays smooth while a label is read). */
let worker: Worker | null | undefined;
const waiting = new Map<number, { ok: (art: CupArt | null) => void; fail: () => void }>();
let nextId = 1;
function theWorker(): Worker | null {
  if (worker !== undefined) return worker;
  worker = null;
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  try {
    const w = new Worker(new URL('./cupLabel.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<{ id: number; art?: { image: Blob; width: number; height: number; lid: Blob | null } | null; error?: string }>) => {
      const job = waiting.get(e.data.id);
      if (!job) return;
      waiting.delete(e.data.id);
      if (e.data.error) return job.fail();
      const art = e.data.art;
      job.ok(art ? { image: URL.createObjectURL(art.image), width: art.width, height: art.height, lid: art.lid ? URL.createObjectURL(art.lid) : null } : null);
    };
    // a worker that cannot start: every waiting picture is prepared on the page instead, and so are the ones after
    w.onerror = () => {
      worker = null;
      w.terminate();
      for (const job of waiting.values()) job.fail();
      waiting.clear();
    };
    worker = w;
  } catch {
    worker = null;
  }
  return worker;
}

/** The flat wrap and lid sticker of a cup label picture (any address an <img> can load), or null when it is not a cup layout. */
export function cupArtFrom(src: string): Promise<CupArt | null> {
  let hit = cache.get(src);
  if (!hit) {
    const w = theWorker();
    const run = w
      ? new Promise<CupArt | null>((ok, fail) => {
          const id = nextId++;
          waiting.set(id, { ok, fail });
          w.postMessage({ id, src });
        }).catch(() => cupArtHere(src))
      : cupArtHere(src);
    hit = run.then((art) => {
      done.set(src, art);
      return art;
    });
    cache.set(src, hit);
  }
  return hit;
}

/** A cup label from the template gallery as a shop label: its wrap laid flat, its sticker for the lid. */
export function cupGalleryLabel(slug: string, title = 'Peanut butter label'): Promise<GalleryBanner | null> {
  return cupArtFrom(bannerImageUrl(slug)).then((art) =>
    // the template's own slug, so "Edit this label" opens it in the editor; no logo is placed on the flat picture
    art ? { slug, title, image: art.image, thumb: art.image, width: art.width, height: art.height, noLogo: true, lidImage: art.lid ?? undefined } : null
  );
}
