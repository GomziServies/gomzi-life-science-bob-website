import type { GalleryBanner } from '../lib/api';

/** Ready labels for the pouch and the sachet: each is the front and back of the pack joined into one picture (made from the print files),
 * so the 3D pouch and sachet wear the front on the front and the back on the back. They carry their own brand, so no logo is added. */
const L = (slug: string, title: string, width: number): GalleryBanner => ({
  slug: `bag-${slug}`,
  title,
  image: `/labels/bag/${slug}.webp`,
  thumb: `/labels/bag/${slug}-thumb.webp`,
  width,
  height: 1500,
  ownLogo: true,
});

const SACHETS: GalleryBanner[] = [
  L('nutra-coconut', 'Coconut Vanilla, 33 g sachet', 2045),
  L('nutra-cappuccino', 'Cappuccino, 33 g sachet', 2045),
  L('boosta-mawa-kulfi', 'Mawa Kulfi, 35 g sachet', 2045),
  L('boosta-chocolate', 'Chocolate, 35 g sachet', 2045),
  L('wavx-mawa-kulfi', 'Mawa Kulfi Blast, 35 g sachet', 2045),
];

const POUCHES: GalleryBanner[] = [
  L('go-rich-chocolate', 'Whey Concentrate Chocolate, 1 kg pouch', 2555),
  L('rep-nineteen', 'Isolate Dark Choco, 1 kg pouch', 2555),
  L('youtrition-isolate', 'Whey Isolate Chocolate, 1.5 kg pouch', 3050),
];

// every label can be worn by either pack; each pack lists its own kind first
export const SACHET_LABELS: GalleryBanner[] = [...SACHETS, ...POUCHES];
export const POUCH_LABELS: GalleryBanner[] = [...POUCHES, ...SACHETS];
