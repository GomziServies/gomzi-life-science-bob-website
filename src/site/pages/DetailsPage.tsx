import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CATALOG, type Product } from '../data/catalog';
import { PACK_SIZES } from '../data/content';
import { cartIssues, minOf, stepOf, stockOf } from '../lib/rules';
import { isTeamBanner, TEAM_NAME, useOrder, getBannerDisplayUrl, type Customer } from '../state/order';
import { DEMO_OTP, DEMO_OTP_CODE, sendEmailOtp, sendOtp, verifyOtp } from '../lib/api';
import { PackIcon } from '../components/PackIcon';
import { Product3DModal } from '../components/Product3DModal';
import { preloadJarScene } from '../components/LabelView';
import { Stepper } from '../components/Stepper';
import { editsSaved, labelEditPath } from '../lib/labelLinks';

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
  // how the code was sent: to the WhatsApp number, or to the e-mail address when WhatsApp could not reach the customer
  const [via, setVia] = useState<'mobile' | 'email'>('mobile');
  const [whatsappFailed, setWhatsappFailed] = useState(false);
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
          <p><Link className="btn btn-lime" to="/#range">Choose products</Link></p>
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
      setVia('mobile');
      try {
        const id = await sendOtp(customer.phone.replace(/\s/g, ''));
        setCustomer({ verificationId: id });
        setSent(true);
        setWhatsappFailed(false);
      } catch (e) {
        setWhatsappFailed(true);
        throw e;
      }
    });

  const onSendEmail = () =>
    run(async () => {
      const id = await sendEmailOtp(customer.email);
      setVia('email');
      setCustomer({ verificationId: id });
      setSent(true);
      setOtp('');
    });

  const onVerify = () =>
    run(async () => {
      await verifyOtp(customer.verificationId, otp);
      setVerified(true);
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!missing.length) nav('/customize');
  };

  return (
    <section className="section tight">
      <div className="wrap">
        <Stepper current={2} />
        <div className="details-layout">
          <form className="details-form" onSubmit={submit} noValidate>
            <header className="dt-head">
              <span className="eyebrow">Step 2 of 4</span>
              <h2>Your inquiry and details</h2>
              <p className="lede">Check your products and quantities, then tell us who the order is for. Next you pick a label for each product.</p>
            </header>

            <div className="panel">
              <h3><span className="dt-n">1</span>Your products</h3>
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
                        title="Click to see this product in 3D with your label"
                        onClick={() => setPreviewProduct(p)}
                      >
                        <PackIcon
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
                            title="Open 3D preview with your label"
                          >
                            3D view
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
                                  `/customize/${p.id}?returnTo=${encodeURIComponent(
                                    `/details?preview=${p.id}`
                                  )}`
                                )
                              }
                            >
                              Design it myself
                            </button>
                          </div>
                        ) : banner ? (
                          <div className="applied-pill">
                            <span className="badge done">✓ Label added</span>
                            <button
                              type="button"
                              className="linkbtn mini-edit-link"
                              onClick={() => nav(labelEditPath(p.id, banner.pack, undefined, editsSaved(banner, banner.pack)))}
                            >
                              Edit label
                            </button>
                          </div>
                        ) : (
                          <div className="applied-pill">
                            <button
                              type="button"
                              className="linkbtn mini-edit-link"
                              onClick={() =>
                                nav(
                                  `/customize/${p.id}?returnTo=${encodeURIComponent(
                                    `/details?preview=${p.id}`
                                  )}`
                                )
                              }
                            >
                              + Add a label
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
              <h3><span className="dt-n">2</span>Your information</h3>
              <p className="dt-group">About you</p>
              <div className="form-grid">
                {FIELDS.filter(([k]) => ['fullName', 'phone', 'altPhone', 'email'].includes(k)).map(([key, label, auto]) => (
                  <div className="field" key={key}>
                    <label htmlFor={key}>{label}</label>
                    <input
                      id={key}
                      autoComplete={auto}
                      inputMode={key === 'phone' || key === 'altPhone' || key === 'pincode' ? 'numeric' : undefined}
                      value={customer[key]}
                      maxLength={key === 'brandName' ? 16 : undefined}
                      disabled={verified && (key === 'phone' || (key === 'email' && via === 'email'))}
                      aria-invalid={key === 'phone' && customer.phone.length > 0 && !phoneOk}
                      onChange={(e) => setCustomer({ [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <p className="dt-group">Your brand and delivery</p>
              <div className="form-grid">
                {FIELDS.filter(([k]) => ['brandName', 'city', 'pincode'].includes(k)).map(([key, label, auto]) => (
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
                  <b>{via === 'email' && sent ? 'Verify your e-mail' : 'Verify your mobile'}</b>
                  <span className="muted">{via === 'email' && sent ? `We e-mailed a one-time password to ${customer.email}.` : 'We send a one-time password to your WhatsApp to confirm your number.'}</span>
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
              {whatsappFailed && !verified && !(sent && via === 'email') && (
                <div className="otp-alt">
                  <span>WhatsApp did not work for this number. You can verify with your e-mail instead.</span>
                  <button type="button" className="btn btn-dark btn-sm" disabled={busy || !emailOk} onClick={onSendEmail}>
                    Send the code to my e-mail
                  </button>
                  {!emailOk && <small className="muted">Enter a valid e-mail above first.</small>}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button className="btn btn-lime" disabled={missing.length > 0}>
                Continue: pick your labels
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
            {/* the summary card and the "View more products" button stay together while the page scrolls */}
            <div className="dt-side-stack">
            <div className="panel sticky">
              <h3>Your inquiry</h3>
              <ul className="mini-list">
                {cart.map((l) => {
                  const p = CATALOG.find((x) => x.id === l.productId)!;
                  return (
                    <li key={l.productId}>
                      <span>{p.name}</span>
                      <b>{l.quantity} {p.unit}</b>
                    </li>
                  );
                })}
              </ul>
              <ol className="dt-next" aria-label="What happens next">
                <li><b>Details</b><span>You are here</span></li>
                <li><b>Labels</b><span>Pick or design a label for each product</span></li>
                <li><b>Send</b><span>We reply with prices and the next steps</span></li>
              </ol>
              <p className="dt-help">Need a hand? <Link to="/contact">Talk to our team</Link></p>
            </div>
            <Link to="/products" className="btn btn-lime btn-block">
              View more products
            </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* 3D Preview Modal: rotatable, shows the chosen label, with a direct way to edit it */}
      {previewProduct && (
        <Product3DModal
          product={previewProduct}
          flavour={cart.find((l) => l.productId === previewProduct.id)?.flavour ?? previewProduct.flavours[0]}
          packKg={cart.find((l) => l.productId === previewProduct.id)?.packKg}
          banner={banners[previewProduct.id]}
          brandName={customer.brandName}
          onClose={closePreview}
          // already on the cart page: closing the preview leaves the visitor at /details
          onViewCart={closePreview}
          onEdit={(pack) => nav(labelEditPath(previewProduct.id, pack, undefined, editsSaved(banners[previewProduct.id], pack)))}
        />
      )}
    </section>
  );
}
