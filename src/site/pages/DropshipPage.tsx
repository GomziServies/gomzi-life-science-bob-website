import { Link } from 'react-router-dom';
import { WHATSAPP } from '../lib/config';
import { Illus } from '../components/Illus';
import { Seo } from '../components/Seo';

const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

const Ic = ({ d }: { d: string[] }) => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((x) => <path key={x} d={x} />)}
  </svg>
);

const QUICK = [
  'Dropshipping is a way of selling where you take the order, but you do not keep the stock or ship the parcel yourself.',
  'You fix your label with us once. When your customer places an order with you, you send us the order details.',
  'We pack the product with your label and deliver it to your customer, so you can spend your time building your brand.',
];

const CARDS: { icon: string[]; title: string; text: string }[] = [
  { icon: ['M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z', 'M3.5 7.5 12 12l8.5-4.5', 'M12 12v9'], title: 'No stock to hold', text: 'You do not store products or pack parcels. We make them, pack them and send them, so your space and your time stay free.' },
  { icon: ['M4 5.5h16v13H4z', 'M4 14.5l4.5-4 4 3.5 3-2.5L20 15'], title: 'Your label, fixed once', text: 'Design your label in our free studio, see it on a 3D pack, and fix it. Every order that follows goes out with the same label.' },
  { icon: ['M3 7h11v9H3z', 'M14 10h4l3 3v3h-7', 'M7 19a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z', 'M17 19a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z'], title: 'Delivered to your customer', text: 'We deliver each order straight to your customer’s address, packed with your brand on it, from our facility in Surat.' },
];

const SECTIONS: { id: string; title: string; image: string; alt: string; body: string[]; list?: string[]; link?: { to: string; label: string }; ordered?: boolean }[] = [
  {
    id: 'sell',
    title: 'You sell under your brand, we handle the rest',
    image: 'dropship-store',
    alt: 'A phone showing a new order for a protein tub with your brand label',
    body: ['You run the brand: your name, your customers and your selling price. Take orders the way that suits you, through your own store, social media or WhatsApp.', 'Behind the scenes, we do the making and the delivering.'],
    list: ['Choose your products and flavours from our range.', 'Fix your label once in our design studio. It stays on file for every order.', 'Your customer orders from you, at the price you decide.'],
    link: { to: '/custom-labels', label: 'About custom labels »' },
  },
  {
    id: 'flow',
    title: 'How an order travels',
    image: 'dropship-delivery',
    alt: 'A parcel packed at the Gomzi facility travelling by truck to your customer’s home',
    body: [],
    list: [
      'A customer places an order with you.',
      'You send us the order: the product, the flavour and your customer’s delivery address.',
      'We pack it with your fixed label and deliver it to your customer.',
      'You keep the difference between your selling price and the price you pay us.',
    ],
    ordered: true,
    link: { to: '/contact', label: 'Talk to our team »' },
  },
];

const STEPS: { n: number; title: string; text: string }[] = [
  { n: 1, title: 'Fix your label', text: 'Choose your products, design your label with your logo, and check it on a 3D pack. Our team prepares the print-ready file.' },
  { n: 2, title: 'Sell under your brand', text: 'Take orders from your own customers through your store, social media or WhatsApp, at the price you choose.' },
  { n: 3, title: 'Send us the order', text: 'Share the product, the flavour and your customer’s delivery address with our team.' },
  { n: 4, title: 'We deliver to your customer', text: 'We pack the order with your label and deliver it to your customer’s door from our facility in Surat.' },
];

/** Dropshipping with Gomzi: the brand fixes its label once, takes orders, and Gomzi packs and delivers each order to the brand's customer. */
export function DropshipPage() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return (
    <div className="plp">
      <Seo
        title="Dropshipping with Gomzi: Your Label, Our Delivery | Gomzi"
        description="Fix your label once, take orders under your own brand, and we pack and deliver each order to your customer from our facility in Surat. See how dropshipping works with Gomzi."
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How dropshipping works with Gomzi Life Science',
            step: STEPS.map((s) => ({ '@type': 'HowToStep', position: s.n, name: s.title, text: s.text })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Dropshipping', item: `${origin}/dropshipping` },
            ],
          },
        ]}
      />

      <section className="plp-hero">
        <div className="wrap plp-hero-grid">
          <div className="plp-hero-art">
            <Illus name="dropship-hero" width={640} height={400} alt="Four steps: your customer orders, you send us the order, we pack it with your label, and it is delivered" eager />
          </div>
          <div className="plp-hero-copy">
            <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span>Dropshipping</span></nav>
            <h1>How Dropshipping Works with Gomzi</h1>
            <p>Fix your label once. When your customer orders from you, send us the order and we pack it and deliver it to them, under your brand.</p>
            <div className="plp-hero-cta">
              <a className="btn btn-lime" href={wa('Hi Gomzi, I want to know how dropshipping works with my own label.')} target="_blank" rel="noopener noreferrer">Talk to our team</a>
              <Link className="btn btn-ghost" to="/products">Explore products</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="plp-quick">
        <div className="wrap">
          <h2>Dropshipping: quick view</h2>
          <ol>
            {QUICK.map((q, i) => (
              <li key={q}><b>{i + 1}.</b><p>{q}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="plp-cards" aria-label="Why dropship with Gomzi">
        <div className="wrap plp-cards-grid">
          {CARDS.map((c) => (
            <article key={c.title} className="plp-card">
              <span className="plp-ic"><Ic d={c.icon} /></span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="plp-sections">
        <div className="wrap">
          {SECTIONS.map((s, i) => (
            <article key={s.id} id={s.id} className={`plp-row${i % 2 ? ' flip' : ''}`}>
              <div className="plp-pic"><Illus name={s.image} width={520} height={440} alt={s.alt} /></div>
              <div className="plp-txt">
                <h2>{s.title}</h2>
                {s.body.map((t) => <p key={t}>{t}</p>)}
                {s.list && (
                  <ol className="plp-list">
                    {s.list.map((l, k) => (
                      <li key={l}><span>{k + 1}.</span>{l}</li>
                    ))}
                  </ol>
                )}
                {s.ordered && <p className="plp-terms">Pricing, minimum quantities and delivery areas are agreed with our team when you set up. Talk to us and we will explain how it works for your brand.</p>}
                {s.link && <Link className="plp-link" to={s.link.to}>{s.link.label}</Link>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="plp-steps" aria-label="Step by step">
        <div className="wrap">
          <h2>Step by step process</h2>
          <div className="plp-steps-grid">
            {STEPS.map((s) => (
              <article key={s.n} className="plp-step">
                <span className="plp-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta" aria-label="Get started">
        <div className="wrap">
          <div className="cta-card">
            <span className="eyebrow">Ready when you are</span>
            <h2>Sell under your brand. We deliver.</h2>
            <p>Tell us about your brand and we will set up your label and your orders.</p>
            <div className="actions">
              <a className="btn btn-lime" href={wa('Hi Gomzi, I want to start dropshipping with my own brand.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              <Link className="btn btn-outline-light" to="/custom-labels">Custom labels</Link>
              <Link className="btn btn-outline-light" to="/how-private-label-works">How private label works</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
