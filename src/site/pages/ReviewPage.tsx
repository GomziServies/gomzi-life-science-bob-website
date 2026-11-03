import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { productById } from '../data/catalog';
import { isTeamBanner, TEAM_NAME, useOrder } from '../state/order';
import { submitInquiry } from '../lib/api';
import { ProductJar } from '../components/ProductJar';
import { Stepper } from '../components/Stepper';

export function ReviewPage() {
  const { cart, banners, customer, allBannersDone, reset } = useOrder();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  if (!allBannersDone) return <Navigate to="/customize" replace />;

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      const id = await submitInquiry(customer, cart, banners);
      reset();
      nav(`/done/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="wrap review">
        <div className="review-main">
          <Stepper current={4} />
          <span className="eyebrow">Final step</span>
          <h2>Review your inquiry</h2>

          <div className="panel brandbox">
            <div>
              <b>{customer.brandName}</b>
              <div>{customer.fullName} · {customer.phone}</div>
            </div>
            <div className="muted">{customer.address}, {customer.city} {customer.pincode}</div>
          </div>

          <div className="prodlist">
            {cart.map((l) => {
              const p = productById(l.productId)!;
              const banner = banners[l.productId];
              return (
                <div className="prow review-row" key={l.productId}>
                  <ProductJar className="jar-sm" product={p} flavour={l.flavour} brand={customer.brandName} />
                  <div className="thumb wide">{isTeamBanner(banner) ? <span className="team-thumb">Made with<br />{TEAM_NAME}</span> : banner ? <img src={banner.thumbnail || banner.previewUrl} alt={`${p.name} label`} /> : null}</div>
                  <div className="grow">
                    <h3 style={{ margin: 0 }}>{p.name}</h3>
                    <span className="muted">{l.flavour !== 'Standard' ? `${l.flavour} · ` : ''}{l.quantity} {p.unit}</span>
                  </div>
                  <Link className="btn btn-ghost btn-sm" to={`/customize/${p.id}`}>Change</Link>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="review-side">
          <div className="panel sticky">
            <h3>Send your inquiry</h3>
            <p className="muted fine">Our expert team will review your products and labels and call you to confirm the details.</p>
            <label className="agree">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>I confirm the products and labels above, and I am happy for the Gomzi team to contact me.</span>
            </label>

            {error && <p className="error">{error}</p>}

            <div className="pay-options">
              <button className="btn btn-lime btn-block" disabled={busy || !agreed} onClick={() => void send()}>
                {busy ? 'Sending…' : 'Send inquiry'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
