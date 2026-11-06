import type { Banner } from '../state/order';

/** What a finished background upload adds to the label it was started for. */
export interface UploadResult {
  savedAt: number;
  patch: Partial<Banner>;
}

/**
 * A saved label is shown at once from the picture in the browser; its PNG, PDF and design file upload afterwards.
 * The latest upload per product is kept here so the inquiry can wait for it before it is sent.
 */
const uploads = new Map<string, Promise<UploadResult>>();

export function trackUpload(productId: string, upload: Promise<UploadResult>) {
  uploads.set(productId, upload);
}

/** Waits for every upload still running and returns what each one produced, by product. */
export async function finishUploads(): Promise<Record<string, UploadResult>> {
  const entries = await Promise.all([...uploads].map(async ([id, p]) => [id, await p.catch(() => null)] as const));
  return Object.fromEntries(entries.filter((e): e is readonly [string, UploadResult] => e[1] !== null));
}

/** The labels with any finished uploads that the saved state has not picked up yet. */
export function withUploads(banners: Record<string, Banner>, done: Record<string, UploadResult>): Record<string, Banner> {
  const merged = { ...banners };
  for (const [id, r] of Object.entries(done)) {
    const b = merged[id];
    if (b && b.savedAt === r.savedAt) merged[id] = { ...b, ...r.patch };
  }
  return merged;
}
