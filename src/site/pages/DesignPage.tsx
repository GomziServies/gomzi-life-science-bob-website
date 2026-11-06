import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { productById } from '../data/catalog';
import { ProductJar } from '../components/ProductJar';
import { HelpModal } from '../components/HelpModal';
import { defaultQty } from '../lib/rules';
import { useOrder, type BannerOrigin } from '../state/order';
import { EDITOR_API, EDITOR_URL } from '../lib/config';
import { getLogoSlot, makeThumbnail, uploadFile, type LogoSlot } from '../lib/api';
import { loadLogo, loadLogoShift } from '../lib/logo';
import { trackUpload } from '../lib/bannerUploads';
import { loadDesign, saveDesign } from '../lib/savedDesigns';
import { defaultBagLabel, packsOf } from '../components/LabelParts';
import type { GalleryBanner } from '../lib/api';
import { createBlankDocument } from '../../lib/document';
import type { DoryDocument } from '../../types/document';

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

/** A picture read into a data URL, so the editor can draw and export it whichever site the editor runs on. */
async function pictureData(src: string): Promise<string> {
  const res = await fetch(src);
  if (!res.ok) throw new Error('The label could not be opened.');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The label could not be opened.'));
    reader.readAsDataURL(blob);
  });
}

/** A design made of one ready pouch or sachet label: the whole front-and-back picture as the bottom layer, to write and draw on. */
async function documentFromLabel(label: GalleryBanner, name: string): Promise<DoryDocument> {
  const src = await pictureData(new URL(label.image, window.location.origin).href);
  const { w, h } = await pictureSize(src);
  const doc = createBlankDocument(w, h, { unit: 'px' });
  doc.pages[0].objects.push({
    id: crypto.randomUUID(),
    name,
    type: 'image',
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    width: w,
    height: h,
    scaleX: doc.width / w,
    scaleY: doc.height / h,
    src,
    visible: true,
    locked: false,
  } as unknown as DoryDocument['pages'][number]['objects'][number]);
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
  // ?pack=pouch|sachet: the label for that pack opens in the editor (the ready pouch or sachet label the card shows); otherwise the jar's templates
  const packParam = search.get('pack');
  const bagPack = product && (packParam === 'pouch' || packParam === 'sachet') && packsOf(product).includes(packParam) ? packParam : null;
  const bagLabel = product && bagPack ? defaultBagLabel(product, bagPack) : null;
  const { cart, customer, banners, setBanner, patchBanner, addToCart } = useOrder();
  const nav = useNavigate();
  // ?saved=1 ("Edit label" on a saved label): the editor reopens that label as it was saved. `savedDesign` is undefined while
  // it is read from this browser, null when there is none (a label saved before designs were kept): its template opens instead.
  const savedBanner = banners[productId];
  const editSaved = search.get('saved') === '1' && !!savedBanner;
  const [savedDesign, setSavedDesign] = useState<{ doc: unknown } | null | undefined>(undefined);
  useEffect(() => {
    if (!editSaved || !savedBanner) return;
    let live = true;
    void loadDesign(productId, savedBanner.savedAt).then((doc) => live && setSavedDesign(doc == null ? null : { doc }));
    return () => {
      live = false;
    };
    // read once, for the label that was saved when the page opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSaved, productId]);
  const reopen = editSaved && savedDesign ? savedDesign.doc : null;
  // a label saved before designs were kept opens its template (when it came from one)
  const fallbackTemplate = editSaved && savedDesign === null && !template && savedBanner?.templateSlug && !savedBanner.templateSlug.startsWith('bag-') ? savedBanner.templateSlug : '';
  const [error, setError] = useState('');
  // the label studio inside the page has finished opening
  const [ready, setReady] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const inCart = cart.some((l) => l.productId === productId);

  // opening this address directly (or from a link) puts the product into the inquiry, as "Make your own" does
  useEffect(() => {
    if (product && !product.comingSoon && !inCart) addToCart({ productId, flavour: product.flavours[0], quantity: defaultQty(product, cart), packKg: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, inCart]);

  useEffect(() => {
    const editorOrigin = new URL(EDITOR_URL, window.location.href).origin;

    // the design this page hands the editor when it asks for one: the pouch / sachet label, or the template with the customer's logo
    const hostDoc = reopen
      ? () => Promise.resolve(reopen)
      : bagLabel && bagPack
      ? () => documentFromLabel(bagLabel, bagPack === 'pouch' ? 'Pouch label' : 'Sachet label')
      : logoMode
        ? () => documentWithLogo(template, logo, loadLogoShift())
        : null;

    const onMessage = async (ev: MessageEvent) => {
      if (ev.origin === editorOrigin && hostDoc) {
        const ask = ev.data as { source?: string; type?: string; productId?: string } | null;
        if (ask?.source === 'doory-editor' && ask.type === 'ready' && ask.productId === productId) {
          try {
            const design = await hostDoc();
            (ev.source as Window | null)?.postMessage({ source: 'doory-host', type: 'load', productId, doc: design }, ev.origin);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'The template could not be opened.');
          }
          return;
        }
      }
      const msg = ev.data as Partial<EditorSavedMessage> | null;
      if (ev.origin !== editorOrigin || msg?.source !== 'doory-editor' || msg.type !== 'saved' || msg.productId !== productId || !msg.png) return;
      const png = msg.png;
      const stamp = Date.now();
      const brandPrefix = customer.brandName.trim() || 'brand';
      // The label is shown at once from the picture in the browser and the preview opens; the files upload behind it.
      const localUrl = URL.createObjectURL(png);
      // the design itself is kept in this browser, so "Edit label" can reopen the label as saved
      void saveDesign(productId, stamp, msg.doc);
      setBanner(productId, {
        origin: msg.origin ?? 'template',
        // a reopened label keeps the template it first came from
        templateSlug: msg.templateSlug ?? (reopen ? savedBanner?.templateSlug : undefined) ?? bagLabel?.slug,
        previewUrl: localUrl,
        pdfUrl: '',
        jsonUrl: '',
        savedAt: stamp,
        ...(bagPack ? { pack: bagPack } : {}),
      });

      const upload = Promise.all([
        makeThumbnail(png),
        uploadFile(png, `${brandPrefix}-${productId}-${stamp}.png`).catch((err) => {
          console.warn('Banner upload failed, keeping the local picture:', err);
          return localUrl;
        }),
        msg.pdf ? uploadFile(msg.pdf, `${brandPrefix}-${productId}-${stamp}.pdf`).catch(() => '') : Promise.resolve(''),
        uploadFile(new Blob([JSON.stringify(msg.doc)], { type: 'application/json' }), `${brandPrefix}-${productId}-${stamp}.json`).catch(() => ''),
      ]).then(([thumbnail, previewUrl, pdfUrl, jsonUrl]) => {
        const patch = { thumbnail, previewUrl, pdfUrl, jsonUrl };
        patchBanner(productId, stamp, patch);
        return { savedAt: stamp, patch };
      });
      trackUpload(productId, upload);

      nav(returnTo || `/details?preview=${productId}`);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [productId, customer.brandName, setBanner, patchBanner, nav, logoMode, logo, template, returnTo, bagLabel, bagPack, reopen, savedBanner?.templateSlug]);

  if (!product || product.comingSoon) return <Navigate to="/products" replace />;
  // the saved label is still being read from this browser: the editor opens once it is known what to open
  if (!inCart || (editSaved && savedDesign === undefined))
    return (
      <div className="editor-shell">
        <div className="editor-opening"><div className="load3d-spin" /><b>Opening the label studio…</b></div>
      </div>
    );
  const line = cart.find((l) => l.productId === productId);

  const filter: Record<string, string> = product.templateCategory ? { category: product.templateCategory } : {};
  // ?pack=pouch|sachet opens that pack's label straight in the editor (the design comes from this page);
  // ?template=<slug> opens that banner straight in the editor; otherwise the gallery opens first
  // ?saved=1 reopens the saved label (its design comes from this page), or its template when no design was kept
  const openTemplate = template || fallbackTemplate;
  const src = `${EDITOR_URL}/embed/${reopen || bagLabel || openTemplate || doc ? 'editor' : 'templates'}?${new URLSearchParams({
    ...(reopen || bagLabel ? { doc: 'message' } : openTemplate ? { template: openTemplate, ...(logoMode ? { doc: 'message' } : {}) } : doc ? { doc } : filter),
    product: productId,
    name: product.name,
    brand: customer.brandName,
    tag: product.tag,
  })}`;

  const backDestination = returnTo || '/details';

  return (
    <div className="editor-shell">
      <header className="editor-bar">
        <button type="button" className="editor-back" onClick={() => nav(backDestination)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></svg>
          <span>Back</span>
        </button>
        <div className="editor-prod">
          <ProductJar className="editor-jar" product={product} flavour={line?.flavour} />
          <span>
            <b>{product.name}</b>
            <small>{line?.flavour ? `${line.flavour} · ` : ''}Design your label</small>
          </span>
        </div>
        <span className="spacer" />
        <span className={`editor-hint${error ? ' err' : ''}`} role="status">
          {error || (reopen ? 'Your saved label: edit it, then press Save label' : bagPack ? `Edit your ${bagPack} label, then press Save label` : 'Pick a template, edit it, then press Save label')}
        </span>
      </header>
      <div className="editor-stage">
        {!ready && (
          <div className="editor-opening">
            <div className="load3d-spin" />
            <b>Opening the label studio…</b>
            <span>Your templates for {product.name} are on the way</span>
          </div>
        )}
        <iframe title="Label editor" src={src} allow="clipboard-write" onLoad={() => setReady(true)} />
        {ready && (
          <button type="button" className="editor-help" onClick={() => setHelpOpen(true)} aria-haspopup="dialog" aria-label="Help" title="Help: ask our team about this label">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </button>
        )}
      </div>

      {helpOpen && (
        <HelpModal
          initial={{ name: customer.fullName, phone: customer.phone, email: customer.email }}
          details={{
            Brand: customer.brandName,
            Product: product.name,
            Flavour: line?.flavour ?? '',
            Pack: bagPack ?? '',
            Template: template,
          }}
          onClose={() => setHelpOpen(false)}
        />
      )}
    </div>
  );
}
