import { Link, useParams } from 'react-router-dom';
import { WHATSAPP } from '../lib/config';

export function DonePage() {
  const { leadId } = useParams();
  return (
    <section className="section">
      <div className="wrap narrow panel done">
        <div className="tick" aria-hidden>✓</div>
        <span className="eyebrow">Inquiry received</span>
        <h2>Thank you! Your inquiry is with our team.</h2>
        <p>Reference: <b>{leadId}</b></p>
        <p>Our expert team will review your products and labels and call you on the number you gave.</p>
        <p className="actions">
          <a className="btn btn-lime" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, my inquiry reference is ${leadId}`)}`}>Chat on WhatsApp</a>
          <Link className="btn btn-ghost" to="/shop">Back to home</Link>
        </p>
      </div>
    </section>
  );
}
