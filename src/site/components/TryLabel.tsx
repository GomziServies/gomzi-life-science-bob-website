import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATALOG, GROUPS, productById, type GroupId } from '../data/catalog';
import { useOrder } from '../state/order';
import { defaultQty } from '../lib/rules';
import { makeThumbnail, uploadFile } from '../lib/api';
import { designCount, designName, labelMm, renderCanvas, toBlob, type Details } from '../lib/labelArt';
import { jpegPdf } from '../lib/pdf';
import { ownDesign } from './ProductJar';
import { LabelView } from './LabelView';
import { DesignPicks, LogoBox, PackToggle, type Pack } from './LabelParts';
import type { TryStart } from './HeroStage';

interface Props {
  start: TryStart;
  logo: string;
  onLogo: (logo: string) => void;
  onClose: () => void;
}

/** Five designs to start with: the product's own and four others spread through the 15. */
const startDesigns = (productId: string, extra?: number) => {
  const own = ownDesign(productId);
  const list = [own, ...[3, 6, 9, 12].map((n) => (own + n) % designCount)];
  return extra !== undefined && !list.includes(extra) ? [extra, ...list.slice(0, 4)] : list;
};

/** "Try it": pick a product, pick a label, see it in 3D or flat, add the logo and details, and save it as that product's banner. */
export function TryLabel({ start, logo, onLogo, onClose }: Props) {
  const { cart, banners, customer, setCustomer, addToCart, setBanner } = useOrder();
  const [productId, setProductId] = useState(start.productId);
  const [design, setDesign] = useState(start.design);
  const [mode, setMode] = useState<'3d' | 'flat'>('3d');
  const [pack, setPack] = useState<Pack>('jar');
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState('');
  const nav = useNavigate();

  const product = productById(productId)!;
  // pouches and sachets are for the powders; tablets stay in their bottle
  const powder = product.group !== 'well';
  const line = cart.find((l) => l.productId === productId);
  const flavour = line?.flavour ?? product.flavours[0];
  const details: Details = { brand: customer.brandName, phone: customer.phone, email: customer.email, address: customer.address, city: customer.city, pincode: customer.pincode };
  const spec = { product, flavour, design, details, logo: logo || undefined };
  const designs = useMemo(() => (all ? Array.from({ length: designCount }, (_, i) => i) : startDesigns(productId, start.productId === productId ? start.design : undefined)), [all, productId, start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onClose]);

  const choose = (id: string) => {
    setProductId(id);
    setDesign(ownDesign(id));
    setAll(false);
    setJustSaved('');
    setError('');
  };

  const field = (key: keyof Details, name: keyof typeof customer) => ({
    value: details[key],
    onChange: (e: { target: { value: string } }) => setCustomer({ [name]: e.target.value }),
  });

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const mm = labelMm(product);
      const canvas = await renderCanvas(spec, Math.round((mm.w / 25.4) * 300));
      const png = await toBlob(canvas, 'image/png');
      const jpeg = new Uint8Array(await (await toBlob(canvas, 'image/jpeg', 0.95)).arrayBuffer());
      const pdf = jpegPdf(jpeg, canvas.width, canvas.height, mm.w, mm.h);

      // The editor's own document, so our team can open this label in the editor: one picture layer at the label's size
      const dw = Math.round((mm.w / 25.4) * 96);
      const dh = Math.round((mm.h / 25.4) * 96);
      const small = document.createElement('canvas');
      small.width = dw * 2;
      small.height = dh * 2;
      small.getContext('2d')!.drawImage(canvas, 0, 0, small.width, small.height);
      const doc = {
        schemaVersion: 1,
        width: dw,
        height: dh,
        unit: 'mm',
        pages: [
          {
            id: crypto.randomUUID(),
            name: 'Label',
            background: { type: 'solid', color: '#ffffff' },
            objects: [{ id: crypto.randomUUID(), name: 'Picture', type: 'image', originX: 'left', originY: 'top', left: 0, top: 0, width: small.width, height: small.height, scaleX: dw / small.width, scaleY: dh / small.height, src: small.toDataURL('image/jpeg', 0.9), visible: true, locked: false }],
          },
        ],
      };

      const stamp = Date.now();
      const name = `${(customer.brandName || 'label').replace(/[^\w-]+/g, '-')}-${productId}-${stamp}`;
      const [thumbnail, previewUrl, pdfUrl, jsonUrl] = await Promise.all([
        makeThumbnail(png),
        uploadFile(png, `${name}.png`),
        uploadFile(pdf, `${name}.pdf`),
        uploadFile(new Blob([JSON.stringify(doc)], { type: 'application/json' }), `${name}.json`),
      ]);
      if (!line) addToCart({ productId, flavour, quantity: defaultQty(product, cart), packKg: 1 });
      setBanner(productId, { origin: 'template', templateSlug: `quick-label-${designName(design).toLowerCase()}`, previewUrl, thumbnail, pdfUrl, jsonUrl, savedAt: stamp });
      setJustSaved(product.name);
      // Straight on to the editor with this label open, so the customer can change it and save the banner
      onClose();
      nav(`/shop/customize/${productId}?doc=${encodeURIComponent(jsonUrl)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your label. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tl-back" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="tl" role="dialog" aria-modal="true" aria-label="Try your label">
        <div className="tl-top">
          <div>
            <b>Try your label</b>
            <span>Pick a product and a label, add your logo and details, then save it.</span>
          </div>
          <button type="button" className="tl-x" aria-label="Close" onClick={onClose} disabled={busy}>×</button>
        </div>

        <div className="tl-body">
          <nav className="tl-prods" aria-label="Products">
            {(Object.keys(GROUPS) as GroupId[]).map((g) => (
              <div key={g} className="tl-group">
                <h4>{GROUPS[g].title}</h4>
                {CATALOG.filter((p) => p.group === g && !p.hidden).map((p) => (
                  <button key={p.id} type="button" aria-pressed={p.id === productId} onClick={() => choose(p.id)}>
                    <span>{p.name}</span>
                    {banners[p.id] && <i title="Label saved">✓</i>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="tl-main">
            <div className="tl-view">
              <div className="tl-toggle" role="group" aria-label="View">
                <button type="button" aria-pressed={mode === '3d'} onClick={() => setMode('3d')}>3D jar</button>
                <button type="button" aria-pressed={mode === 'flat'} onClick={() => setMode('flat')}>Flat label</button>
              </div>
              {mode === '3d' && powder && <PackToggle className="tl-packs" product={product} pack={pack} onPack={setPack} />}
              <LabelView spec={spec} mode={mode} pack={powder ? pack : 'jar'} px={3000} className={mode === '3d' ? 'tl-3d' : 'tl-flat'} />
              <span className="tl-size">Printed label: {labelMm(product).w} × {labelMm(product).h} mm</span>
            </div>

            <h4 className="tl-h">Label design</h4>
            <DesignPicks product={product} flavour={flavour} designs={designs} current={design} onPick={setDesign} details={details} logo={logo || undefined} />
            {!all && <button type="button" className="linkbtn" onClick={() => setAll(true)}>Show all {designCount} designs</button>}

            <h4 className="tl-h">Your logo</h4>
            <LogoBox product={product} design={design} logo={logo} onLogo={onLogo} />

            <h4 className="tl-h">Your details on the label</h4>
            <div className="tl-form">
              <label>Brand name<input {...field('brand', 'brandName')} maxLength={40} placeholder="Shown if you have no logo" /></label>
              <label>Customer care number<input {...field('phone', 'phone')} inputMode="tel" maxLength={15} /></label>
              <label>Email<input {...field('email', 'email')} type="email" /></label>
              <label className="wide">Address<textarea {...field('address', 'address')} rows={2} maxLength={160} /></label>
              <label>City<input {...field('city', 'city')} /></label>
              <label>Pincode<input {...field('pincode', 'pincode')} inputMode="numeric" maxLength={6} /></label>
            </div>
            <p className="fine">The manufacturer and licence details are Gomzi Life Science LLP's and are added for you.</p>
          </div>
        </div>

        <div className="tl-foot">
          <span className={error ? 'tl-err' : ''}>
            {error || (justSaved ? `✓ Saved for ${justSaved}. Pick another product, or continue with your order.` : (customer.brandName.trim() ? 'Saving adds this product to your order with this label.' : 'Add your brand name below to save this label.'))}
          </span>
          {justSaved && <Link className="btn btn-ghost btn-sm" to="/shop/details" onClick={onClose}>Continue to my order</Link>}
          <button type="button" className="btn btn-lime" onClick={() => void save()} disabled={busy || !customer.brandName.trim()}>
            {busy ? 'Saving…' : `Save label for ${product.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}
