import { useEffect, useState } from 'react';
import type { Product } from '../data/catalog';
import { getBannerDisplayUrl, type Banner } from '../state/order';
import { ownDesign, tintOf } from './ProductJar';
import { LabelView, type BannerLike } from './LabelView';
import { PackToggle, type Pack } from './LabelParts';

export interface Product3DModalProps {
  product: Product;
  flavour: string;
  packKg?: number;
  banner?: Banner | null;
  brandName?: string;
  onClose: () => void;
  onEdit: () => void;
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
}: Product3DModalProps) {
  const [pack, setPack] = useState<Pack>('jar');

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

  const appliedBanner: BannerLike | null = (banner && displayUrl)
    ? {
        image: displayUrl,
        thumb: banner.thumbnail || displayUrl,
        title: `${product.name} Banner`,
        slug: banner.templateSlug,
      }
    : null;

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
          <LabelView
            className="pmodal-3d"
            mode="3d"
            spec={{
              product,
              flavour,
              design: ownDesign(product.id),
              details: specDetails,
            }}
            banner={appliedBanner}
            pack={pack}
            autoTurn={false}
          />
          <PackToggle className="pmodal-packs" product={product} pack={pack} onPack={setPack} />
          <span className="pmodal-hint">👆 Drag horizontally to rotate 360° and inspect all sides</span>
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
              <b>{product.unit === 'kg' ? `${packKg ?? 1} kg tub` : product.weight ?? product.unit}</b>
            </div>
            {product.labelSize && (
              <div className="spec-item">
                <span className="spec-label">Label Size:</span>
                <b>{product.labelSize}</b>
              </div>
            )}
          </div>

          {/* Banner Status Card */}
          <div className="pmodal-banner-status">
            <div className="banner-status-head">
              <span className="spec-label">Applied Banner:</span>
              {appliedBanner ? (
                <span className="badge done">✓ Custom Banner Active</span>
              ) : (
                <span className="badge">Standard Preview</span>
              )}
            </div>

            {appliedBanner ? (
              <div className="banner-status-body">
                <div className="banner-thumb-box">
                  <img src={appliedBanner.thumb || appliedBanner.image} alt="Applied banner preview" />
                </div>
                <div className="banner-info-text">
                  <p className="fine">This custom banner is rendered directly onto the 3D model above.</p>
                  {banner?.savedAt ? (
                    <span className="muted fine">
                      Saved {new Date(banner.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="fine muted">
                No custom banner applied yet. You can design one in the editor with your brand name, logo, and artwork.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="modal-actions" style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button type="button" className="btn btn-lime" onClick={onEdit}>
              {appliedBanner ? '✏️ Edit This Banner' : '✨ Customize / Design Banner'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
