import { Link, useLocation, useParams } from 'react-router-dom';
import { WHATSAPP } from '../lib/config';
import { Seo } from '../components/Seo';

interface DoneState {
  emailed?: boolean;
  to?: string;
  summary?: { name: string; flavour: string; quantity: number; unit: string }[];
}

/** The thank-you page after an inquiry is sent. */
export function DonePage() {
  const { leadId } = useParams();
  const state = (useLocation().state ?? {}) as DoneState;
  return (
    <section className="section done-page">
      <Seo noindex title="Inquiry sent | Gomzi Life Science LLP" description="Your inquiry has been sent to our team." />
      <div className="wrap narrow">
        <div className="done-card">
          <svg className="done-tick" viewBox="0 0 120 120" width="84" height="84" aria-hidden="true">
            <circle className="sent-disc" cx="60" cy="60" r="46" />
            <circle className="sent-circle" cx="60" cy="60" r="52" />
            <path className="sent-tick" d="M38 62 L54 78 L84 44" />
          </svg>
          <span className="eyebrow">Inquiry sent</span>
          <h1>Thank you. Our team will contact you shortly.</h1>
          <p className="done-ref">Reference <b>{leadId}</b></p>
          {state.emailed && state.to ? (
            <p className="done-mail">We have e-mailed your products and labels to <b>{state.to}</b>.</p>
          ) : (
            <p className="done-mail">Our team has your products and labels and will call you on the number you gave.</p>
          )}

          {state.summary && state.summary.length > 0 && (
            <ul className="done-list" aria-label="What you sent">
              {state.summary.map((l, i) => (
                <li key={i}>
                  <span>{l.name}{l.flavour && l.flavour !== 'Standard' ? ` · ${l.flavour}` : ''}</span>
                  <b>{l.quantity} {l.unit}</b>
                </li>
              ))}
            </ul>
          )}

          <ol className="done-next" aria-label="What happens next">
            <li><b>We review</b><span>Our team checks your products, quantities and labels.</span></li>
            <li><b>We call you</b><span>We confirm the details, prices and timing.</span></li>
            <li><b>We make and dispatch</b><span>Ready formulations in stock go out within 5 days of your label being approved.</span></li>
          </ol>

          <p className="actions">
            <a className="btn btn-lime" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, my inquiry reference is ${leadId}`)}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            <Link className="btn btn-ghost" to="/">Back to home</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
