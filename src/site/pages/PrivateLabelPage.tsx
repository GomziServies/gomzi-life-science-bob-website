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
  'Private label means a product made by a manufacturer and sold under your own brand name, with your own label on the pack.',
  'You choose a ready formulation (or ask us to build your own) and design the label. We manufacture, fill and label it at our facility in Surat.',
  'You launch under your name, without owning a factory. We stay behind the scenes, making and labelling every batch.',
];

const CARDS: { icon: string[]; title: string; text: string }[] = [
  { icon: ['M3 21h18', 'M5 21V9l7-4 7 4v12', 'M9 21v-6h6v6'], title: 'No factory needed', text: 'We manufacture at our own facility in Surat. FSSAI licensed, GMP, HACCP, Halal and Kosher certified, and FDA registered.' },
  { icon: ['M4 5.5h16v13H4z', 'M4 14.5l4.5-4 4 3.5 3-2.5L20 15'], title: 'Your name on every pack', text: 'Design your own label and logo in our free studio, see it on a 3D pack, and our team prepares the print-ready file.' },
  { icon: ['M12 3 4.5 6v5.5c0 4.4 3.1 8.3 7.5 9.5 4.4-1.2 7.5-5.1 7.5-9.5V6L12 3Z', 'm8.8 12 2.2 2.2 4.2-4.4'], title: 'Made to last', text: 'Every batch has an 18-month shelf life, and each ready product has a fixed, printed nutrition table you can stand behind.' },
];

const SECTIONS: { id: string; title: string; image: string; alt: string; body: string[]; list?: string[]; link?: { to: string; label: string } }[] = [
  {
    id: 'formula',
    title: 'Choose a ready formulation, or build your own',
    image: 'formulation',
    alt: 'A protein tub with a brand label, a scoop of powder and a lab flask',
    body: ['Most brands start with a ready formulation. It is already made, with a fixed nutrition table, so you can put your name on it and launch in days.', 'If you want something that is yours alone, our formulation team develops your own whey, pre-workout or a brand-new product with you after a short call.'],
    list: ['Ready formulations: whey protein, plant and yeast protein, mass gainer, creatine, BCAA, EAA, pre-workout, peanut butter and wellness.', 'Your own formula: revised until you approve it; a brand-new product has unlimited revisions.'],
    link: { to: '/products', label: 'See the range »' },
  },
  {
    id: 'label',
    title: 'Your label wraps the pack in three panels',
    image: 'labeling',
    alt: 'A three-panel label sheet wrapping onto a protein tub',
    body: ['Every label has three panels. On one side, “marketed by” carries your brand, address and customer care number. In the middle is your front design. On the other, “manufactured by” carries our details and FSSAI licence number, with boxes for batch number, dates and price.', 'Start from a ready template, let AI Studio make designs for you, or add your own logo. Prefer not to design? Leave it to our design team.'],
    link: { to: '/custom-labels', label: 'About custom labels »' },
  },
  {
    id: 'quantities',
    title: 'Minimum quantities that suit a new brand',
    image: 'quantities',
    alt: 'Stacked cartons tagged with the minimum order quantities',
    body: ['You do not need a big first order. You can mix flavours and products in one inquiry.'],
    list: ['Protein: 50 kg in total across all your protein products, and you can mix flavours.', 'Sports and wellness: 50 jars or bottles of each product.', 'Quantities move in steps of 10 kg for protein and 50 units for everything else.', 'The inquiry page tells you, in plain words, if a quantity is below the minimum or above what is in stock.'],
  },
  {
    id: 'dispatch',
    title: 'From confirmed order to dispatch',
    image: 'dispatch',
    alt: 'A five-day calendar beside a delivery truck carrying branded cartons',
    body: ['For ready formulations that are in stock, we dispatch within 5 days once your label is approved and the order is confirmed.', 'Your own formula takes a little longer, because it is scheduled once you approve the sample. Our team will tell you the timing when they call you.'],
    link: { to: '/faq', label: 'Read the FAQ »' },
  },
];

const STEPS: { n: number; title: string; text: string }[] = [
  { n: 1, title: 'Choose your products', text: 'Pick from our ready formulations, choose flavours and set your quantity, or ask for your own formula.' },
  { n: 2, title: 'Design your label', text: 'Use a template, AI Studio or your own logo, and check it on a 3D pack. Or leave it to our design team.' },
  { n: 3, title: 'Send your inquiry', text: 'Share your brand details, confirm your phone with an OTP and send. Our expert team calls you to confirm.' },
  { n: 4, title: 'We make and dispatch', text: 'We manufacture, fill and label your products at our Surat facility, then dispatch them to you.' },
];

/** How private-label supplements work with Gomzi, from the idea to the dispatch, with its own illustrations. */
export function PrivateLabelPage() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return (
    <div className="plp">
      <Seo
        title="How Private-Label Supplements Work | Made in Surat | Gomzi"
        description="See how Gomzi turns your idea into a branded supplement: choose a formulation, design your label, send your inquiry, and we manufacture, fill, label and dispatch from Surat."
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to launch a private-label supplement with Gomzi Life Science',
            step: STEPS.map((s) => ({ '@type': 'HowToStep', position: s.n, name: s.title, text: s.text })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'How private label works', item: `${origin}/how-private-label-works` },
            ],
          },
        ]}
      />

      <section className="plp-hero">
        <div className="wrap plp-hero-grid">
          <div className="plp-hero-art">
            <Illus name="hero" width={640} height={400} alt="Three steps: formulate, label and dispatch" eager />
          </div>
          <div className="plp-hero-copy">
            <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span>How private label works</span></nav>
            <h1>How Private-Label Supplements Work</h1>
            <p>Learn how Gomzi turns your idea into a branded product, from choosing a formulation to the day it leaves our facility in Surat.</p>
            <div className="plp-hero-cta">
              <Link className="btn btn-lime" to="/products">Explore products</Link>
              <Link className="btn btn-ghost" to="/how-it-works">How ordering works</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="plp-quick">
        <div className="wrap">
          <h2>Private label: quick view</h2>
          <ol>
            {QUICK.map((q, i) => (
              <li key={q}><b>{i + 1}.</b><p>{q}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="plp-cards" aria-label="Why brands choose private label">
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
            <h2>Your idea, our facility.</h2>
            <p>Choose your first products and design your label. Our team will take it from there.</p>
            <div className="actions">
              <Link className="btn btn-lime" to="/products">Explore products</Link>
              <Link className="btn btn-outline-light" to="/custom-branding">Custom branding</Link>
              <a className="btn btn-outline-light" href={wa('Hi Gomzi, I want to start my own supplement brand.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
