import { useEffect, useState, type FormEvent } from 'react';
import { COMPANY } from '../data/content';
import { CONTACT_EMAIL } from '../data/social';
import { WHATSAPP } from '../lib/config';

// Same topics, checks and sending as the form on the Contact page (/contact)
const TOPICS = ['Placing an order', 'My own formula', 'Label design', 'Bulk or repeat orders', 'Something else'];

const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

interface Props {
  title?: string;
  /** The customer's details already given in the order flow, to start the form with. */
  initial?: { name?: string; phone?: string; email?: string };
  /** What the customer is working on (brand, product…), added under the message for our team. */
  details?: Record<string, string>;
  onClose: () => void;
}

/** Help popup: the Contact page's message form, which opens WhatsApp (or email) with the message ready to send. */
export function HelpModal({ title = 'Connect with an expert', initial, details, onClose }: Props) {
  const [form, setForm] = useState({ name: initial?.name ?? '', phone: initial?.phone ?? '', email: initial?.email ?? '', topic: TOPICS[0], message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const extra = Object.entries(details ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);

  const text = () =>
    [
      `Hi ${COMPANY.name}, I'd like to talk about: ${form.topic}.`,
      '',
      form.message.trim(),
      '',
      ...(extra.length ? [...extra, ''] : []),
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      form.email.trim() ? `Email: ${form.email.trim()}` : '',
    ]
      .filter((l, i, a) => l !== '' || a[i - 1] !== '')
      .join('\n')
      .trim();

  const check = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Please tell us your name.';
    if (!/^[+\d][\d\s-]{7,}$/.test(form.phone.trim())) e.phone = 'Enter a phone number we can call.';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'That email address looks incomplete.';
    if (form.message.trim().length < 5) e.message = 'Write a few words about what you need.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!check()) return;
    window.open(wa(text()), '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };
  const mailHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${form.topic} | ${form.name.trim() || 'New inquiry'}`)}&body=${encodeURIComponent(text())}`;

  return (
    <div className="modal help-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-modal-title" onClick={onClose}>
      <div className="modal-box help-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-x modal-x" aria-label="Close" onClick={onClose}>×</button>
        {submitted ? (
          <div className="cform-card in-modal" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%', background: '#f0f8d9', color: 'var(--brand-d)', display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Inquiry Submitted!</h3>
            <p className="fine muted" style={{ maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>
              Your inquiry has been opened on WhatsApp. Our expert team will review your requirements and connect with you shortly.
            </p>
            <button type="button" className="btn btn-lime" onClick={onClose}>
              Back to preview
            </button>
          </div>
        ) : (
          <form className="cform-card in-modal" onSubmit={send} noValidate>
            <h3 id="help-modal-title">{title}</h3>
            <label className="cf">
              <span>Your name <b>*</b></span>
              <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="Enter your name" aria-invalid={!!errors.name} />
              {errors.name && <small className="cf-err">{errors.name}</small>}
            </label>
            <div className="cf-row">
              <label className="cf">
                <span>Phone <b>*</b></span>
                <input value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="+91 …" aria-invalid={!!errors.phone} />
                {errors.phone && <small className="cf-err">{errors.phone}</small>}
              </label>
              <label className="cf">
                <span>Email</span>
                <input value={form.email} onChange={set('email')} type="email" autoComplete="email" placeholder="you@brand.com" aria-invalid={!!errors.email} />
                {errors.email && <small className="cf-err">{errors.email}</small>}
              </label>
            </div>
            <label className="cf">
              <span>What is it about?</span>
              <select value={form.topic} onChange={set('topic')}>
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="cf">
              <span>Message <b>*</b></span>
              <textarea value={form.message} onChange={set('message')} rows={5} placeholder="Tell us what you need…" aria-invalid={!!errors.message} />
              {errors.message && <small className="cf-err">{errors.message}</small>}
            </label>
            <button type="submit" className="btn btn-lime cf-send">Submit & Connect on WhatsApp</button>
            <p className="cf-alt">This opens WhatsApp with your message ready to send. Prefer email? <a href={mailHref} onClick={() => setSubmitted(true)}>Send it by email instead</a>.</p>
          </form>
        )}
      </div>
    </div>
  );
}
