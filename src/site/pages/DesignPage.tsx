import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { productById } from '../data/catalog';
import { useOrder, type BannerOrigin } from '../state/order';
import { EDITOR_API, EDITOR_URL } from '../lib/config';
import { getLogoSlot, makeThumbnail, uploadFile, type LogoSlot } from '../lib/api';
import { loadLogo, loadLogoShift } from '../lib/logo';

/** Message the embedded editor posts to this page when the customer presses Save. */
interface EditorSavedMessage {
  source: 'doory-editor';
  type: 'saved';
  productId: string;
  origin: BannerOrigin;
  templateSlug?: string;
  png: Blob;
  pdf: Blob;
  doc: unknown;
}

/** Slot used when a template does not say where its logo goes: the top middle of the label. */
const DEFAULT_SLOT: LogoSlot = { x: 0.44, y: 0.04, w: 0.12, h: 0.14 };

const pictureSize = (src: string) =>
  new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('The logo could not be read.'));
    img.src = src;
  });

interface TemplateDoc {
  width: number;
  height: number;
  pages: { objects: Record<string, unknown>[] }[];
  [key: string]: unknown;
}

/** The template's design with the customer's logo set as a picture layer in the logo place, moved by the amount they chose. */
async function documentWithLogo(slug: string, logo: string, shift: { dx: number; dy: number }): Promise<TemplateDoc> {
  const res = await fetch(`${EDITOR_API}/templates/${encodeURIComponent(slug)}/`);
  if (!res.ok) throw new Error('The template could not be opened.');
  const doc = ((await res.json()) as { document: TemplateDoc }).document;
  const slot = (await getLogoSlot(slug)) ?? DEFAULT_SLOT;
  const { w, h } = await pictureSize(logo);
  const [sx, sy, sw, sh] = [slot.x * doc.width, slot.y * doc.height, slot.w * doc.width, slot.h * doc.height];
  const fit = Math.min(sw / w, sh / h);
  const [dw, dh] = [w * fit, h * fit];
  doc.pages[0].objects.push({
    id: crypto.randomUUID(),
    name: 'Your logo',
    type: 'image',
    originX: 'left',
    originY: 'top',
    left: sx + (sw - dw) / 2 + (shift.dx / 100) * doc.width,
    top: sy + (sh - dh) / 2 + (shift.dy / 100) * doc.height,
    width: w,
    height: h,
    scaleX: fit,
    scaleY: fit,
    src: logo,
    visible: true,
    locked: false,
  });
  return doc;
}

/**
 * Full-screen design step for one product. The editor site's own template gallery opens here (filtered to the product's
 * type), then the template editor, then the AI studio if the customer asks for it. Save in the editor returns here.
 */
export function DesignPage() {
  const { productId = '' } = useParams();
  const [search] = useSearchParams();
  const template = search.get('template') ?? '';
  const doc = search.get('doc') ?? '';
  const returnTo = search.get('returnTo');
  // "Make with my logo": the editor is given the template with the customer's logo already placed
  const [logo] = useState(() => (search.get('logo') ? loadLogo() : ''));
  const logoMode = Boolean(logo && template);
  const product = productById(productId);
  const { cart, customer, setBanner } = useOrder();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const editorOrigin = new URL(EDITOR_URL, window.location.href).origin;

    const onMessage = async (ev: MessageEvent) => {
      if (ev.origin === editorOrigin && logoMode) {
        const ask = ev.data as { source?: string; type?: string; productId?: string } | null;
        if (ask?.source === 'doory-editor' && ask.type === 'ready' && ask.productId === productId) {
          try {
            const withLogo = await documentWithLogo(template, logo, loadLogoShift());
            (ev.source as Window | null)?.postMessage({ source: 'doory-host', type: 'load', productId, doc: withLogo }, ev.origin);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'The template could not be opened.');
          }
          return;
        }
      }
      const msg = ev.data as Partial<EditorSavedMessage> | null;
      if (ev.origin !== editorOrigin || msg?.source !== 'doory-editor' || msg.type !== 'saved' || msg.productId !== productId) return;
      setSaving(true);
      setError('');
      try {
        const stamp = Date.now();
        const brandPrefix = customer.brandName.trim() || 'brand';
        
        // Make thumbnail and attempt cloud upload with graceful local fallbacks
        const [thumbnail, previewUrl, pdfUrl, jsonUrl] = await Promise.all([
          makeThumbnail(msg.png!),
          uploadFile(msg.png!, `${brandPrefix}-${productId}-${stamp}.png`).catch((err) => {
            console.warn('Banner upload failed, falling back to local blob URL:', err);
            return URL.createObjectURL(msg.png!);
          }),
          uploadFile(msg.pdf!, `${brandPrefix}-${productId}-${stamp}.pdf`).catch(() => ''),
          uploadFile(new Blob([JSON.stringify(msg.doc)], { type: 'application/json' }), `${brandPrefix}-${productId}-${stamp}.json`).catch(() => ''),
        ]);

        setBanner(productId, {
          origin: msg.origin ?? 'template',
          templateSlug: msg.templateSlug,
          previewUrl,
          thumbnail,
          pdfUrl,
          jsonUrl,
          savedAt: stamp,
        });

        // Redirect back to returnTo if specified, otherwise default to /shop/details?preview=${productId}
        const destination = returnTo || `/shop/details?preview=${productId}`;
        nav(destination);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save your banner. Please try again.');
        setSaving(false);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [productId, customer.brandName, setBanner, nav, logoMode, logo, template, returnTo]);

  if (!product || !cart.some((l) => l.productId === productId)) return <Navigate to="/shop/customize" replace />;

  const filter: Record<string, string> = product.templateCategory ? { category: product.templateCategory } : {};
  // ?template=<slug> opens that banner straight in the editor; otherwise the gallery opens first
  const src = `${EDITOR_URL}/embed/${template || doc ? 'editor' : 'templates'}?${new URLSearchParams({
    ...(template ? { template, ...(logoMode ? { doc: 'message' } : {}) } : doc ? { doc } : filter),
    product: productId,
    name: product.name,
    brand: customer.brandName,
    tag: product.tag,
  })}`;

  const backDestination = returnTo || '/shop/details';

  return (
    <div className="editor-shell">
      <div className="editor-bar">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(backDestination)} disabled={saving}>
          Back to products
        </button>
        <b>{product.name}</b>
        <span className="spacer" />
        <span>{saving ? 'Saving your banner…' : error || 'Pick a template, edit it, then press Save banner'}</span>
      </div>
      <iframe title="Banner editor" src={src} allow="clipboard-write" />
    </div>
  );
}
