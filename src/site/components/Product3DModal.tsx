import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../data/catalog';
import { getBannerDisplayUrl, useOrder, type Banner } from '../state/order';
import { ownDesign, tintOf } from './ProductJar';
import { LabelView, type BannerLike } from './LabelView';
import { PackToggle, defaultBagLabel, packsOf, useFirstJarLabel, type Pack } from './LabelParts';
import { HelpModal } from './HelpModal';
import { jarKind } from '../lib/labelArt';
import { cupArtCached, cupArtFrom, type CupArt } from '../lib/cupLabel';

export interface Product3DModalProps {
  product: Product;
  flavour: string;
  packKg?: number;
  banner?: Banner | null;
  brandName?: string;
  onClose: () => void;
  /** Opens the label studio for the pack being shown (jar, pouch or sachet). */
  onEdit: (pack: Pack) => void;
  /** "View cart": by default opens the cart page (/details); a page already showing the cart passes its own (closing the preview). */
  onViewCart?: () => void;
}

/**
 * Interactive 3D product preview modal.
 * Shows the rotatable 3D jar/tub/pouch with the customer's applied banner wrapped completely around it.
 * Uses local high-resolution data URLs to prevent S3 private CORS/403 access issues.
 */
export function Product3DModal({
  product,
  flavour,
  packKg,
  banner,
  brandName = '',
  onClose,
  onEdit,
  onViewCart,
}: Product3DModalProps) {
  const nav = useNavigate();
  const { customer } = useOrder();
  const [helpOpen, setHelpOpen] = useState(false);
  const viewCart = onViewCart ?? (() => nav('/details'));
  // the saved label belongs to one pack (a jar wrap unless it was made for the pouch or sachet): the window opens on that pack
  const labelPack: Pack = banner?.pack && packsOf(product).includes(banner.pack) ? banner.pack : 'jar';
  const [pack, setPack] = useState<Pack>(labelPack);
  const firstJar = useFirstJarLabel(product);

  // Handle ESC key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll while modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Resolves the local displayable image URL (data URL or local blob, avoiding inaccessible S3 URLs)
  const displayUrl = getBannerDisplayUrl(banner);

  // A peanut butter cup label is a print layout (curved wrap + round lid sticker): its wrap is laid flat for the cup's side
  // and its sticker goes on the lid. `cupArt` is that, for the saved label's picture; undefined while it is being made.
  const cupLabel = jarKind(product) === 'cup' && labelPack === 'jar' && !!displayUrl;
  // a label already prepared (the inquiry lists do it as they show) opens straight on the cup, with no waiting
  const [cupArt, setCupArt] = useState<{ src: string; art: CupArt | null } | undefined>(() => {
    const known = cupLabel && displayUrl ? cupArtCached(displayUrl) : undefined;
    return known === undefined ? undefined : { src: displayUrl, art: known };
  });
  useEffect(() => {
    if (!cupLabel || !displayUrl) return;
    let live = true;
    void cupArtFrom(displayUrl).then((art) => live && setCupArt({ src: displayUrl, art }));
    return () => {
      live = false;
    };
  }, [cupLabel, displayUrl]);
  const flat = cupLabel && cupArt?.src === displayUrl ? cupArt.art : null;
  const cupPending = cupLabel && cupArt?.src !== displayUrl;

  const appliedBanner: BannerLike | null = (banner && displayUrl)
    ? flat
      ? // the saved cup label: its wrap laid flat, its sticker on the lid (no logo is placed on the flat picture)
        { image: flat.image, thumb: banner.thumbnail || displayUrl, width: flat.width, height: flat.height, title: `${product.name} label`, slug: banner.templateSlug, noLogo: true, lidImage: flat.lid ?? undefined }
      : {
          image: displayUrl,
          thumb: banner.thumbnail || displayUrl,
          title: `${product.name} label`,
          slug: banner.templateSlug,
          // a pouch or sachet label already carries its brand: no logo is placed on it
          ...(labelPack !== 'jar' ? { ownLogo: true } : {}),
        }
    : null;
  // the customer's label on the pack it was made for; the other packs wear their ready sample label
  const mine = pack === labelPack ? appliedBanner : null;

  const specDetails = {
    brand: brandName.trim() || 'YOUR BRAND',
    phone: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
  };

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} 3D Preview`}
      onClick={onClose}
    >
      <div className="modal-box pmodal product-3d-modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-x modal-x" aria-label="Close 3D preview" onClick={onClose} />

        {/* 3D Visualizer Stage */}
        <div className="pmodal-art" style={{ ['--tint' as string]: tintOf(product.id) }}>
          <button
            type="button"
            className="pmodal-art-help"
            onClick={() => setHelpOpen(true)}
            aria-haspopup="dialog"
            aria-label="Help"
            title="Need help? Connect with an expert"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <span>Help</span>
          </button>
          <LabelView
            className="pmodal-3d"
            zoomable
            mode="3d"
            spec={{
              product,
              flavour,
              design: ownDesign(product.id),
              details: specDetails,
            }}
            // a cup's saved label is a print layout: it is never put on the cup as it is (that shows a tiny label on a tall white cup
            // until the flat wrap is ready), so the spinner shows until then
            banner={pack === 'jar' ? (cupPending ? null : (mine ?? firstJar)) : (mine ?? defaultBagLabel(product, pack) ?? appliedBanner)}
            waiting={pack === 'jar' && ((!mine && firstJar === undefined) || (!!mine && cupPending))}
            pack={pack}
            autoTurn={false}
          />
          <PackToggle className="pmodal-packs" product={product} pack={pack} onPack={setPack} />
          <span className="pmodal-hint">Drag to turn it all the way round</span>
        </div>

        {/* Product and Banner Controls */}
        <div className="pmodal-info">
          <div className="pmodal-header">
            <span className="tag" style={{ color: tintOf(product.id) }}>
              {product.tag}
            </span>
            <h3>{product.name}</h3>
            {product.sub && <span className="muted">{product.sub}</span>}
          </div>

          <div className="pmodal-specs">
            <div className="spec-item">
              <span className="spec-label">Flavour:</span>
              <b>{flavour}</b>
            </div>
            <div className="spec-item">
              <span className="spec-label">Package Size:</span>
              <b>{product.unit === 'kg' ? `${packKg ?? 1} kg jar` : product.weight ?? product.unit}</b>
            </div>
            {product.labelSize && (
              <div className="spec-item">
                <span className="spec-label">Label Size:</span>
                <b>{product.labelSize}</b>
              </div>
            )}
          </div>

          {/* The label on the pack */}
          <div className="pmodal-banner-status">
            <div className="banner-status-head">
              <span className="spec-label">Your label</span>
              {appliedBanner ? (
                <span className="badge done">On the pack</span>
              ) : (
                <span className="badge">Sample label</span>
              )}
            </div>

            {appliedBanner ? (
              <div className="banner-status-body">
                <div className="banner-thumb-box">
                  <img src={appliedBanner.thumb || appliedBanner.image} alt="Your label" />
                </div>
                <div className="banner-info-text">
                  <p className="fine">Your label is wrapped on the pack. Turn it to see every side.</p>
                  {banner?.savedAt ? (
                    <span className="muted fine">
                      Saved {new Date(banner.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="fine muted">
                You have not saved a label for this product yet. The pack shows a sample label. Design yours in the studio with your brand name, logo and artwork.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="modal-actions" style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button type="button" className="btn btn-lime" onClick={() => onEdit(pack)}>
              {appliedBanner ? 'Edit this label' : 'Design your label'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setHelpOpen(true)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              Help
            </button>
          </div>
          <button type="button" className="btn btn-dark btn-block pmodal-cart" onClick={viewCart}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
              <path d="M2.5 3h2.6l2.6 12.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21.5 7H6" />
            </svg>
            View cart
          </button>
        </div>
      </div>

      {helpOpen && (
        <HelpModal
          title="Connect with an expert"
          initial={{
            name: customer?.fullName ?? '',
            phone: customer?.phone ?? '',
            email: customer?.email ?? '',
          }}
          details={{
            Brand: brandName.trim() || customer?.brandName || '',
            Product: product.name,
            Flavour: flavour,
            Pack: pack,
            ...(pack === 'jar' && packKg ? { Size: `${packKg} kg jar` } : {}),
            ...(appliedBanner?.slug ? { Template: appliedBanner.slug } : {}),
          }}
          onClose={() => setHelpOpen(false)}
        />
      )}
    </div>
  );
}
