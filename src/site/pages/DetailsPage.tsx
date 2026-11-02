import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CATALOG, type Product } from '../data/catalog';
import { PACK_SIZES } from '../data/content';
import { cartIssues, minOf, stepOf, stockOf } from '../lib/rules';
import { isTeamBanner, TEAM_NAME, useOrder, getBannerDisplayUrl, type Customer } from '../state/order';
import { DEMO_OTP, DEMO_OTP_CODE, sendOtp, verifyOtp } from '../lib/api';
import { ProductJar } from '../components/ProductJar';
import { Product3DModal } from '../components/Product3DModal';
import { preloadJarScene } from '../components/LabelView';
import { Stepper } from '../components/Stepper';

type TextField = Exclude<keyof Customer, 'verificationId'>;

const FIELDS: [TextField, string, string][] = [
  ['fullName', 'Full name', 'name'],
  ['brandName', 'Brand name (max 16 characters)', 'organization'],
  ['phone', 'Mobile number', 'tel'],
  ['altPhone', 'Alternate mobile (optional)', 'tel'],
  ['email', 'Email', 'email'],
  ['city', 'City', 'address-level2'],
  ['pincode', 'PIN code', 'postal-code'],
];

export function DetailsPage() {
  const { cart, banners, customer, setCustomer, updateQty, setFlavour, setPack, removeFromCart } = useOrder();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const previewId = searchParams.get('preview');

  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Pre-warms 3D Three.js chunks in background for instant modal popup
  useEffect(() => {
    preloadJarScene();
  }, []);

  // 3D Preview modal state - auto-opens if ?preview=<productId> is present
  const [previewProduct, setPreviewProduct] = useState<Product | null>(() => {
    if (previewId) return CATALOG.find((x) => x.id === previewId) ?? null;
    return null;
  });

  useEffect(() => {
    if (previewId) {
      const found = CATALOG.find((x) => x.id === previewId);
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

  if (!cart.length) {
    return (
      <section className="section">
        <div className="wrap narrow panel done">
          <h2>Your inquiry is empty</h2>
          <p>Choose at least one product to continue.</p>
          <p><Link className="btn btn-lime" to="/shop#range">Choose products</Link></p>
        </div>
      </section>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const phoneOk = /^\d{10}$/.test(customer.phone.replace(/\s/g, ''));
  const emailOk = /\S+@\S+\.\S+/.test(customer.email);
  const issues = cartIssues(cart);
  const qtyOk = issues.length === 0;
  const brandOk = customer.brandName.trim().length > 0 && customer.brandName.length <= 16;

  // What is still needed, in plain words: shown beside the disabled button
  const missing = [
    !customer.fullName.trim() && 'your name',
    !brandOk && 'a brand name',
    !phoneOk && 'a 10-digit mobile number',
    !emailOk && 'a valid email',
    !customer.city.trim() && 'your city',
    !customer.pincode.trim() && 'a PIN code',
    !customer.address.trim() && 'your address',
    !qtyOk && 'quantities that meet the minimum',
    !confirmed && 'your confirmation',
    !verified && 'mobile verification',
  ].filter(Boolean) as string[];

  const onSend = () =>
    run(async () => {
      const id = await sendOtp(customer.phone.replace(/\s/g, ''));
      setCustomer({ verificationId: id });
      setSent(true);
    });

  const onVerify = () =>
    run(async () => {
      await verifyOtp(customer.verificationId, otp);
      setVerified(true);
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!missing.length) nav('/shop/customize');
  };

  return (
    <section className="section tight">
      <div className="wrap">
        <Stepper current={2} />
        <div className="details-layout">
          <form className="details-form" onSubmit={submit} noValidate>
            <h2>Your inquiry and details</h2>

            <div className="panel">
              <h3>Products</h3>
              <div className="qty-list">
                {cart.map((l) => {
                  const p = CATALOG.find((x) => x.id === l.productId)!;
                  const banner = banners[l.productId];
                  const bannerPic = getBannerDisplayUrl(banner);
                  return (
                    <div className="qty-row" key={l.productId}>
                      {/* Product jar with corner 3D eye badge - entire jar clickable for 3D inspection */}
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

                      <div className="grow">
                        <div className="prod-title-row">
                          <b>{p.name}</b>
                          <button
                            type="button"
                            className="link-preview-3d"
                            onClick={() => setPreviewProduct(p)}
                            title="Open 3D preview with banner"
                          >
                            👁 3D View
                          </button>
                        </div>
                        <span className="muted">per {p.unit}</span>
                        {isTeamBanner(banner) ? (
                          <div className="applied-pill">
                            <span className="badge done team">✓ Made with {TEAM_NAME}</span>
                            <button
                              type="button"
                              className="linkbtn mini-edit-link"
                              onClick={() =>
                                nav(
                                  `/shop/customize/${p.id}?returnTo=${encodeURIComponent(
                                    `/shop/details?preview=${p.id}`
                                  )}`
                                )
                              }
                            >
                              Design it myself
                            </button>
                          </div>
                        ) : banner ? (
                          <div className="applied-pill">
                            <span className="badge done">✓ Banner Applied</span>
                            <button
                              type="button"
                              className="linkbtn mini-edit-link"
                              onClick={() =>
                                nav(
                                  `/shop/customize/${p.id}?returnTo=${encodeURIComponent(
                                    `/shop/details?preview=${p.id}`
                                  )}`
                                )
                              }
                            >
                              Edit Banner
                            </button>
                          </div>
                        ) : (
                          <div className="applied-pill">
                            <button
                              type="button"
                              className="linkbtn mini-edit-link"
                              onClick={() =>
                                nav(
                                  `/shop/customize/${p.id}?returnTo=${encodeURIComponent(
                                    `/shop/details?preview=${p.id}`
                                  )}`
                                )
                              }
                            >
                              + Customize Banner
                            </button>
                          </div>
                        )}
                      </div>

                      <label className="mini">
                        <span>Flavour</span>
                        <select
                          value={l.flavour}
                          onChange={(e) => setFlavour(l.productId, e.target.value)}
                          disabled={p.flavours.length < 2}
                        >
                          {p.flavours.map((f) => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                      </label>

                      {p.unit === 'kg' && (
                        <label className="mini">
                          <span>Jar size</span>
                          <select
                            value={l.packKg ?? 1}
                            onChange={(e) => setPack(l.productId, Number(e.target.value))}
                          >
                            {PACK_SIZES.map((s) => (
                              <option key={s.kg} value={s.kg}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      <label className="mini">
                        <span>Quantity ({p.unit})</span>
                        <input
                          type="number"
                          min={minOf(p)}
                          max={Number.isFinite(stockOf(p, l.flavour)) ? stockOf(p, l.flavour) : undefined}
                          step={stepOf(p)}
                          value={l.quantity}
                          aria-invalid={l.quantity < minOf(p) || l.quantity > stockOf(p, l.flavour)}
                          onChange={(e) => updateQty(l.productId, Number(e.target.value))}
                        />
                      </label>
                      <button
                        type="button"
                        className="icon-x"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => removeFromCart(p.id)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              {issues.map((m) => (
                <p className="error" key={m}>
                  {m}
                </p>
              ))}
              <p className="muted fine">
                Protein: 50 kg in total across all protein products, and you can mix flavours. Sports and wellness: 50 jars or bottles of each product.
              </p>
            </div>

            <div className="panel">
              <h3>Your information</h3>
              <div className="form-grid">
                {FIELDS.map(([key, label, auto]) => (
                  <div className="field" key={key}>
                    <label htmlFor={key}>{label}</label>
                    <input
                      id={key}
                      autoComplete={auto}
                      inputMode={key === 'phone' || key === 'altPhone' || key === 'pincode' ? 'numeric' : undefined}
                      value={customer[key]}
                      maxLength={key === 'brandName' ? 16 : undefined}
                      disabled={verified && key === 'phone'}
                      aria-invalid={key === 'phone' && customer.phone.length > 0 && !phoneOk}
                      onChange={(e) => setCustomer({ [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="field">
                <label htmlFor="address">Delivery address</label>
                <textarea
                  id="address"
                  rows={2}
                  autoComplete="street-address"
                  value={customer.address}
                  onChange={(e) => setCustomer({ address: e.target.value })}
                />
              </div>

              <label className="agree">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                <span>I confirm these products and quantities are what I need.</span>
              </label>

              <div className="verify">
                <div>
                  <b>Mobile verification</b>
                  <span className="muted">We confirm your number with a one-time password.</span>
                </div>
                {verified ? (
                  <span className="badge done">✓ Verified</span>
                ) : !sent ? (
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !phoneOk} onClick={onSend}>
                    Send OTP
                  </button>
                ) : (
                  <div className="otp-row">
                    <input
                      aria-label="OTP"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-dark btn-sm"
                      disabled={busy || otp.length < 4}
                      onClick={onVerify}
                    >
                      Verify
                    </button>
                  </div>
                )}
              </div>
              {sent && !verified && DEMO_OTP && (
                <p className="badge">
                  Dev mode: your OTP is <b>{DEMO_OTP_CODE}</b>
                </p>
              )}
              {error && <p className="error">{error}</p>}
            </div>

            <div className="form-actions">
              <button className="btn btn-lime" disabled={missing.length > 0}>
                Continue: design your banners
              </button>
              {missing.length > 0 && (
                <span className="need">
                  Still needed: {missing.slice(0, 3).join(', ')}
                  {missing.length > 3 ? ` and ${missing.length - 3} more` : ''}
                </span>
              )}
            </div>
          </form>

          <aside className="details-side">
            <div className="panel sticky">
              <h3>Your products</h3>
              <ul className="mini-list">
                {cart.map((l) => {
                  const p = CATALOG.find((x) => x.id === l.productId)!;
                  return (
                    <li key={l.productId}>
                      <span>
                        {p.name} <small className="muted">× {l.quantity} {p.unit}</small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* 3D Preview Modal: rotatable, displays applied banner, and has direct Edit Banner button */}
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
                `/shop/details?preview=${previewProduct.id}`
              )}`
            );
          }}
        />
      )}
    </section>
  );
}
