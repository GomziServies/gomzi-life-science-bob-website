import { AWS_FILES, AWS_FILES_HOST, CRM_API, EDITOR_API, EDITOR_MEDIA, EDITOR_URL } from './config';
import type { Customer, Banner, CartLine } from '../state/order';
import { productById } from '../data/catalog';

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (body?.message) throw new Error(body.message);
    // The dev proxy answers 500/502/504 without a message when fg-api is not running
    if (res.status >= 500) throw new Error('Could not reach the order server. Make sure fg-api is running (see VITE_CRM_PROXY in .env.example).');
    throw new Error(`Request failed (${res.status})`);
  }
  return body as T;
}

// -- OTP (existing fg-api inquiry OTP) --
/** In dev the OTP is not sent: the code is shown on screen and checked here. Set VITE_DEMO_OTP=false to use the real service. */
export const DEMO_OTP = import.meta.env.DEV && import.meta.env.VITE_DEMO_OTP !== 'false';
export const DEMO_OTP_CODE = '123456';
export const DEMO_VERIFICATION_ID = 'dev-otp';

export async function sendOtp(mobile: string): Promise<string> {
  if (DEMO_OTP) return DEMO_VERIFICATION_ID;
  const res = await fetch(`${CRM_API}/inquiry-otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile }),
  });
  const body = await json<{ data?: { verification_id: string } }>(res);
  return body.data!.verification_id;
}

export async function verifyOtp(verificationId: string, otp: string): Promise<void> {
  if (DEMO_OTP) {
    if (otp !== DEMO_OTP_CODE) throw new Error('Invalid OTP. In dev the code is ' + DEMO_OTP_CODE + '.');
    return;
  }
  const res = await fetch(`${CRM_API}/inquiry-otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verification_id: verificationId, otp }),
  });
  await json(res);
}

// -- Banner files -> S3 via the public file-upload route --
export async function uploadFile(file: Blob, name: string): Promise<string> {
  const form = new FormData();
  form.append('files', file, name);
  const res = await fetch(`${CRM_API}/banner-order/upload`, { method: 'POST', body: form });
  const body = await json<{ data?: { fileLocations: string[] } }>(res);
  const url = body.data?.fileLocations?.[0];
  if (!url) throw new Error('Upload failed');
  return url;
}

/** A small JPEG data URL of a banner PNG (about 480 px wide), cheap enough to keep in localStorage. */
export async function makeThumbnail(png: Blob, width = 2400): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(png);
    const scale = Math.min(1, width / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    return undefined;
  }
}

// -- Final submit: an inquiry with the products and the label picked for each --
export async function submitInquiry(customer: Customer, cart: CartLine[], banners: Record<string, Banner>): Promise<{ leadId: string; emailSent: boolean }> {
  const products = cart.map((line) => {
    const product = productById(line.productId)!;
    const banner = banners[line.productId];
    return {
      product_key: product.id,
      product_name: product.name,
      category: product.group,
      variant: line.flavour,
      quantity: line.quantity,
      unit: product.unit,
      pack_kg: product.unit === 'kg' ? (line.packKg ?? 1) : undefined,
      origin: banner.origin,
      template_slug: banner.templateSlug ?? '',
      preview_url: banner.origin === 'graphics_team' ? undefined : banner.previewUrl,
      pdf_url: banner.origin === 'graphics_team' ? undefined : banner.pdfUrl,
      json_url: banner.origin === 'graphics_team' ? undefined : banner.jsonUrl,
    };
  });

  const res = await fetch(`${CRM_API}/banner-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verification_id: customer.verificationId,
      full_name: customer.fullName,
      brand_name: customer.brandName,
      phone_number: customer.phone,
      alternate_phone: customer.altPhone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      pincode: customer.pincode,
      products,
    }),
  });
  const body = await json<{ data?: { lead_id: string; email_sent?: boolean } }>(res);
  // the server e-mails the customer their products and labels as it saves the inquiry, and says whether that went
  return { leadId: body.data!.lead_id, emailSent: body.data!.email_sent === true };
}

// -- Banner templates from the design-editor gallery --
export interface TemplateSummary {
  slug: string;
  title: string;
  thumbnail: string | null;
  width: number | null;
  height: number | null;
}

interface TemplateRow {
  slug: string;
  title: string;
  thumbnail_url: string | null;
  /** A large picture of the whole banner, for the 3D jar (absent on templates not yet rendered). */
  preview_url?: string | null;
  width: number | null;
  height: number | null;
}

export async function listTemplates(params: { category: string; q?: string }): Promise<TemplateSummary[]> {
  const query = new URLSearchParams({ category: params.category, page_size: '100' });
  if (params.q) query.set('q', params.q);
  const res = await fetch(`${EDITOR_API}/templates/?${query}`);
  const body = await json<{ results?: TemplateRow[] } | TemplateRow[]>(res);
  const rows = Array.isArray(body) ? body : (body.results ?? []);
  // Thumbnails are served by the editor site (/media/...), so resolve them against it
  return rows.map((t) => ({
    slug: t.slug,
    title: t.title,
    thumbnail: t.thumbnail_url ? new URL(t.thumbnail_url, EDITOR_URL).toString() : null,
    width: t.width,
    height: t.height,
  }));
}

/** A finished banner from the editor's template gallery, wrap-shaped so it fits round a jar. */
export interface GalleryBanner {
  slug: string;
  title: string;
  /** The banner's sharpest picture, read through the same origin (the 3D jar wraps it). */
  image: string;
  /** A small copy for lists and flat cards. */
  thumb: string;
  width: number;
  height: number;
  /** A ready pack label that already carries its own brand: no logo is placed on it. */
  ownLogo?: boolean;
  /** The picture to wrap while the sharp one loads, when `thumb` is not a small copy of the wrap (a ready pack label). */
  lowImage?: string;
}

/** A template's picture: from the S3 bucket when its address is one of the company's file links, otherwise from the editor's media folder. */
const mediaUrl = (url: string) => {
  const u = new URL(url, 'http://x');
  return u.hostname === AWS_FILES_HOST ? AWS_FILES + u.pathname : EDITOR_MEDIA + u.pathname.replace(/^\/media/, '');
};

/**
 * The jar draws the banner onto a canvas and uses it as a 3D texture, so the picture must come from
 * a host that sends CORS headers — a tainted canvas cannot be a WebGL texture. The file CDN sends
 * none, while the API serves the same preview with them, so read it from there. The `.webp` copy
 * also sidesteps the hotlink rule that answers 403 to cross-site requests for PNG and JPEG.
 */
const bannerImageUrl = (slug: string) => `${EDITOR_MEDIA}/templates/previews/${encodeURIComponent(slug)}.webp`;
/** Where the brand logo sat on a template's label, as shares of the picture (`x`, `y`, `w`, `h`), or null when the template has none. */
export interface LogoSlot {
  x: number;
  y: number;
  w: number;
  h: number;
}

const slotCache = new Map<string, Promise<LogoSlot | null>>();

export function getLogoSlot(slug: string): Promise<LogoSlot | null> {
  let hit = slotCache.get(slug);
  if (!hit) {
    hit = fetch(`${EDITOR_API}/templates/${encodeURIComponent(slug)}/`)
      .then((res) => json<{ document?: { meta?: { logoSlot?: LogoSlot } } }>(res))
      .then((t) => t.document?.meta?.logoSlot ?? null)
      .catch(() => null);
    slotCache.set(slug, hit);
  }
  return hit;
}

const bannerCache = new Map<string, Promise<GalleryBanner[]>>();

/** The real banners our team saved in the template gallery for a product category (only wrap-shaped ones). */
export function listGalleryBanners(category: string): Promise<GalleryBanner[]> {
  if (!category) return Promise.resolve([]);
  let hit = bannerCache.get(category);
  if (!hit) {
    hit = fetch(`${EDITOR_API}/templates/?${new URLSearchParams({ category, page_size: '100' })}`)
      .then((res) => json<{ results?: TemplateRow[] } | TemplateRow[]>(res))
      .then((body) => {
        const rows = Array.isArray(body) ? body : (body.results ?? []);
        return rows
          .filter((t) => t.thumbnail_url && t.width && t.height && t.width / t.height >= 2.2 && t.width / t.height <= 4.6)
          .map((t) => ({ slug: t.slug, title: t.title, image: bannerImageUrl(t.slug), thumb: mediaUrl(t.thumbnail_url!), width: t.width!, height: t.height! }));
      });
    hit.catch(() => bannerCache.delete(category));
    bannerCache.set(category, hit);
  }
  return hit;
}
