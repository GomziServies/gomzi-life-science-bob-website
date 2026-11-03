import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY } from '../data/content';
import { CONTACT_EMAIL, MAPS_QUERY, SOCIAL_LINKS } from '../data/social';
import { WHATSAPP } from '../lib/config';
import { Seo } from '../components/Seo';

const TOPICS = ['Placing an order', 'My own formula', 'Label design', 'Bulk or repeat orders', 'Something else'];

const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

const Ic = ({ d }: { d: string[] }) => (
  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((x) => <path key={x} d={x} />)}
  </svg>
);

/** Contact: three quick ways to reach us, our address and map, and a message form that opens WhatsApp (or email) with the message ready. */
export function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', topic: TOPICS[0], message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const text = () =>
    [`Hi ${COMPANY.name}, I'd like to talk about: ${form.topic}.`, '', form.message.trim(), '', `Name: ${form.name.trim()}`, `Phone: ${form.phone.trim()}`, form.email.trim() ? `Email: ${form.email.trim()}` : ''].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');

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
  };
  const mailHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${form.topic} | ${form.name.trim() || 'New inquiry'}`)}&body=${encodeURIComponent(text())}`;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  return (
    <div className="contact">
      <Seo
        title="Contact Us: Talk to Gomzi Life Science in Surat"
        description="Call, WhatsApp or email Gomzi Life Science LLP about private-label supplements, your own formula, labels and bulk orders. Visit us at RJD Textile Park, Hazira Road, Surat."
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: COMPANY.name,
            url: `${origin}/`,
            telephone: COMPANY.tel,
            email: CONTACT_EMAIL,
            address: { '@type': 'PostalAddress', streetAddress: '443-444-445, 1st Floor, RJD Textile Park, Ichchhapor, Hazira Road', addressLocality: 'Surat', addressRegion: 'Gujarat', postalCode: '394510', addressCountry: 'IN' },
            sameAs: SOCIAL_LINKS.map((s) => s.href),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Contact', item: `${origin}/contact` },
            ],
          },
        ]}
      />

      <section className="section contact-hero">
        <svg className="hd hd-a" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2c1.6 11.4 10.6 20.4 22 22-11.4 1.6-20.4 10.6-22 22C22.4 34.6 13.4 25.6 2 24 13.4 22.4 22.4 13.4 24 2Z" fill="currentColor" /></svg>
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span>Contact</span></nav>
          <h1 className="page-title">Need help? Contact us</h1>
          <p className="lede">Questions about an order, your own formula or a label? Reach our team the way that suits you. We are happy to guide you from your first product to your first batch.</p>

          <div className="ccards">
            <a className="ccard" href={`mailto:${CONTACT_EMAIL}`}>
              <span className="ccard-ic"><Ic d={['M4 6h16v12H4z', 'm4 7 8 6 8-6']} /></span>
              <h2>Email us</h2>
              <p>Send your questions or details and our team will reply.</p>
              <span className="ccard-go">{CONTACT_EMAIL}</span>
            </a>
            <a className="ccard" href={`tel:${COMPANY.tel}`}>
              <span className="ccard-ic"><Ic d={['M13 2a9 9 0 0 1 9 9', 'M13 6a5 5 0 0 1 5 5', 'M13.8 16.6a1 1 0 0 0 1.2-.3l.4-.5A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.5.4a1 1 0 0 0-.3 1.2 14 14 0 0 0 6.4 6.4']} /></span>
              <h2>Call us</h2>
              <p>Talk to our team directly for quick answers.</p>
              <span className="ccard-go">{COMPANY.phone}</span>
            </a>
            <a className="ccard" href={wa('Hi Gomzi, I want to talk to an expert about launching my own supplement brand.')} target="_blank" rel="noopener noreferrer">
              <span className="ccard-ic"><Ic d={['M4 20l1.4-4A8 8 0 1 1 8 18.6L4 20Z', 'M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.1-1.8-1-.8.6c-.9-.4-1.7-1.2-2.1-2.1l.6-.8-1-1.8L9 9.5Z']} /></span>
              <h2>WhatsApp chat</h2>
              <p>Message us any time. For bulk and repeat orders, share your quantities and flavours.</p>
              <span className="ccard-go">Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      <section className="section contact-main" aria-label="Get in touch">
        <div className="wrap contact-grid">
          <div className="contact-info">
            <span className="eyebrow">Get in touch</span>
            <h2>Visit us or send a message</h2>
            <p className="lede">Tell us about your brand and what you want to make. We will call you back.</p>

            <h3>Address</h3>
            <a className="contact-line" href={`https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}`} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
              <span>{COMPANY.name}<br />{COMPANY.address}</span>
            </a>

            <h3>Reach us</h3>
            <a className="contact-line" href={`mailto:${CONTACT_EMAIL}`}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg><span>{CONTACT_EMAIL}</span></a>
            <a className="contact-line" href={`tel:${COMPANY.tel}`}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg><span>{COMPANY.phone}</span></a>

            <h3>Follow us</h3>
            <div className="contact-social">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
              ))}
            </div>
          </div>

          <form className="cform-card" onSubmit={send} noValidate>
            <h3>Send us a message</h3>
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
            <button type="submit" className="btn btn-lime cf-send">Send on WhatsApp</button>
            <p className="cf-alt">This opens WhatsApp with your message ready to send. Prefer email? <a href={mailHref}>Send it by email instead</a>.</p>
          </form>
        </div>
      </section>

      <section className="section contact-map" aria-label="Our location">
        <div className="wrap">
          <div className="map-box">
            <iframe title="Gomzi Life Science LLP on the map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`} />
          </div>
        </div>
      </section>

      <section className="section soft contact-help" aria-label="More help">
        <div className="wrap">
          <h2>Looking for quick answers first?</h2>
          <div className="chelp">
            <Link className="chelp-card" to="/faq">
              <p>The questions people ask most, answered: minimums, labels, your own formula and delivery.</p>
              <span>View FAQ »</span>
            </Link>
            <Link className="chelp-card" to="/how-it-works">
              <p>See every step from choosing products to sending your inquiry, and what to expect.</p>
              <span>How it works »</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
