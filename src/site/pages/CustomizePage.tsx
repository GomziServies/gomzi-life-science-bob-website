import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { productById, type Product } from '../data/catalog';
import { useOrder, getBannerDisplayUrl } from '../state/order';
import { ProductJar } from '../components/ProductJar';
import { Product3DModal } from '../components/Product3DModal';
import { preloadJarScene } from '../components/LabelView';
import { Stepper } from '../components/Stepper';

export function CustomizePage() {
  const { cart, banners, customer, allBannersDone } = useOrder();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const previewId = searchParams.get('preview');

  // Pre-warms 3D Three.js chunks in background for instant modal popup
  useEffect(() => {
    preloadJarScene();
  }, []);

  // 3D Preview modal state - auto-opens if ?preview=<productId> is in the URL
  const [previewProduct, setPreviewProduct] = useState<Product | null>(() => {
    if (previewId) return productById(previewId) ?? null;
    return null;
  });

  useEffect(() => {
    if (previewId) {
      const found = productById(previewId);
      if (found) setPreviewProduct(found);
    }
  }, [previewId]);

  const closePreview = () => {
    setPreviewProduct(null);
    if (searchParams.has('preview')) {
      const next = new URLSearchParams(searchParams);
      next.delete('preview');
      setSearchParams(next, { replace: true });
    }
  };

  if (!cart.length) return <Navigate to="/shop" replace />;
  if (!customer.verificationId) return <Navigate to="/shop/details" replace />;

  const done = cart.filter((l) => banners[l.productId]).length;

  return (
    <section className="section">
      <div className="wrap narrow">
        <Stepper current={3} />
        <span className="eyebrow">Design your banners</span>
        <h2>Design a banner for each product</h2>
        <p>Choose a template or generate one with AI, edit your logo and text, then save. {done} of {cart.length} done.</p>
        <div className="progress" aria-hidden>
          <i style={{ width: `${(done / cart.length) * 100}%` }} />
        </div>

        <div className="prodlist">
          {cart.map((l) => {
            const p = productById(l.productId)!;
            const banner = banners[l.productId];
            const bannerPic = getBannerDisplayUrl(banner);
            return (
              <div className="prow" key={l.productId}>
                {/* 3D-enabled jar preview thumbnail with corner badge */}
                <div
                  className="jar-thumb-container"
                  title="Click to view realistic 3D model with banner"
                  onClick={() => setPreviewProduct(p)}
                >
                  <ProductJar
                    className="jar-sm"
                    product={p}
                    flavour={l.flavour}
                    brand={customer.brandName}
                    banner={bannerPic}
                  />
                  <button
                    type="button"
                    className="eye-preview-btn"
                    aria-label={`View 3D preview of ${p.name}`}
                    title="Open 3D preview"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewProduct(p);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>

                {/* Banner 2D preview, clickable to inspect in 3D */}
                <div
                  className={`thumb wide ${bannerPic ? 'clickable-preview' : ''}`}
                  title={bannerPic ? 'Click to view 3D model with this banner' : undefined}
                  onClick={() => {
                    if (bannerPic) setPreviewProduct(p);
                  }}
                  style={{ cursor: bannerPic ? 'pointer' : 'default', position: 'relative' }}
                >
                  {bannerPic ? (
                    <>
                      <img src={bannerPic} alt={`${p.name} banner`} />
                      <span className="thumb-3d-tag">👁 3D</span>
                    </>
                  ) : (
                    'No banner yet'
                  )}
                </div>

                <div className="grow">
                  <div className="prod-title-row">
                    <h3 style={{ margin: 0 }}>{p.name}</h3>
                    <button
                      type="button"
                      className="link-preview-3d"
                      onClick={() => setPreviewProduct(p)}
                      title="Open 3D preview with banner"
                    >
                      👁 3D View
                    </button>
                  </div>
                  <span>{l.flavour} · {l.quantity} {p.unit}</span>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {banner ? (
                      <span className="badge done">Banner saved ({banner.origin === 'ai' ? 'AI' : 'template'})</span>
                    ) : (
                      <span className="badge">Pending</span>
                    )}
                  </div>
                </div>

                <div className="acts" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setPreviewProduct(p)}
                    title="View 3D product preview"
                  >
                    👁 3D View
                  </button>
                  <Link
                    className={`btn btn-sm ${banner ? 'btn-ghost' : 'btn-lime'}`}
                    to={`/shop/customize/${p.id}?returnTo=${encodeURIComponent(`/shop/customize?preview=${p.id}`)}`}
                  >
                    {banner ? 'Change banner' : 'Choose banner'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ marginTop: 28 }}>
          <button className="btn btn-lime" disabled={!allBannersDone} onClick={() => nav('/shop/review')}>
            Review and submit
          </button>
          {!allBannersDone && <span style={{ marginLeft: 12 }} className="badge">Save a banner for every product to continue</span>}
        </p>
      </div>

      {/* 3D Preview Modal */}
      {previewProduct && (
        <Product3DModal
          product={previewProduct}
          flavour={cart.find((l) => l.productId === previewProduct.id)?.flavour ?? previewProduct.flavours[0]}
          packKg={cart.find((l) => l.productId === previewProduct.id)?.packKg}
          banner={banners[previewProduct.id]}
          brandName={customer.brandName}
          onClose={closePreview}
          onEdit={() => {
            nav(
              `/shop/customize/${previewProduct.id}?returnTo=${encodeURIComponent(
                `/shop/customize?preview=${previewProduct.id}`
              )}`
            );
          }}
        />
      )}
    </section>
  );
}
