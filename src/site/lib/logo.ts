const KEY = 'banner-website:logo:v1';

export const loadLogo = (): string => {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};

const SHIFT_KEY = 'banner-website:logo-shift:v1';

/** Where the customer moved their logo from the label's empty logo place (% of the picture's width and height). */
export const loadLogoShift = (): { dx: number; dy: number } => {
  try {
    const v = JSON.parse(localStorage.getItem(SHIFT_KEY) ?? '{}') as { dx?: number; dy?: number };
    return { dx: Number(v.dx) || 0, dy: Number(v.dy) || 0 };
  } catch {
    return { dx: 0, dy: 0 };
  }
};

export const storeLogoShift = (shift: { dx: number; dy: number }) => {
  try {
    localStorage.setItem(SHIFT_KEY, JSON.stringify(shift));
  } catch {
    /* kept for this visit only */
  }
};

export const storeLogo = (logo: string) => {
  try {
    if (logo) localStorage.setItem(KEY, logo);
    else localStorage.removeItem(KEY);
  } catch {
    /* too big for the browser's storage: it stays for this visit only */
  }
};

/** Reads a logo file into a PNG data address, at most 1600 px wide so it stays light but prints sharp. Transparency is kept. */
export async function readLogo(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error('Please choose a PNG, JPG or WebP picture.');
  if (file.size > 8 * 1024 * 1024) throw new Error('That picture is over 8 MB. Please choose a smaller one.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

/** The picture's own pixel size, to tell the customer whether it is big enough for the logo area. */
export const pictureSize = (src: string) =>
  new Promise<{ w: number; h: number }>((ok) => {
    const img = new Image();
    img.onload = () => ok({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => ok({ w: 0, h: 0 });
    img.src = src;
  });
