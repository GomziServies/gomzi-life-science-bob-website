/**
 * Prepares a peanut butter cup label off the page's main thread: finds the curved wrap, lays it flat and cuts out the lid
 * sticker (see cupLabel.ts). Reading and unrolling a print layout takes long enough to freeze the page while it runs.
 */
import { detectCupWrap, unrollWrap } from '../../editor/packaging/cupWrap';

const READ_MAX = 2400;
const FLAT_WIDTH = 2048;

const scope = self as unknown as { onmessage: ((e: MessageEvent<{ id: number; src: string }>) => void) | null; postMessage(m: unknown): void };

const sized = (img: ImageBitmap, width: number) => {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round((w * img.height) / Math.max(1, img.width)));
  const canvas = new OffscreenCanvas(w, h);
  const g = canvas.getContext('2d', { willReadFrequently: true })!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  return { canvas, pixels: g.getImageData(0, 0, w, h) };
};

async function make(src: string) {
  const img = await createImageBitmap(await (await fetch(src)).blob());
  const fit = detectCupWrap(sized(img, 600).pixels);
  if (!fit) return null;
  const big = sized(img, Math.min(READ_MAX, img.width));
  const flat = unrollWrap(big.pixels, fit, FLAT_WIDTH);
  const c = new OffscreenCanvas(flat.width, flat.height);
  const g = c.getContext('2d')!;
  const data = g.createImageData(flat.width, flat.height);
  data.data.set(flat.data);
  g.putImageData(data, 0, 0);
  const image = await c.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
  let lid: Blob | null = null;
  if (fit.lid) {
    const k = big.canvas.width / fit.width;
    const r = fit.lid.r * k;
    const s = new OffscreenCanvas(Math.max(2, Math.round(2 * r)), Math.max(2, Math.round(2 * r)));
    const sg = s.getContext('2d')!;
    sg.beginPath();
    sg.arc(s.width / 2, s.height / 2, s.width / 2, 0, Math.PI * 2);
    sg.clip();
    sg.drawImage(big.canvas, fit.lid.x * k - r, fit.lid.y * k - r, 2 * r, 2 * r, 0, 0, s.width, s.height);
    lid = await s.convertToBlob({ type: 'image/png' });
  }
  return { image, width: flat.width, height: flat.height, lid };
}

scope.onmessage = (e) => {
  const { id, src } = e.data;
  make(src)
    .then((art) => scope.postMessage({ id, art }))
    .catch((err) => scope.postMessage({ id, error: String(err) }));
};
