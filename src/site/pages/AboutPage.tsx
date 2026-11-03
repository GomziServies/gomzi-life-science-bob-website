import { Link } from 'react-router-dom';
import { COMPANY } from '../data/content';
import { CONTACT_EMAIL, SOCIAL_LINKS } from '../data/social';
import { WHATSAPP } from '../lib/config';
import { Illus } from '../components/Illus';
import { Seals } from '../components/Seals';
import { Seo } from '../components/Seo';

const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/** Everything on this page is taken from the company's own website (gomzilifesciences.in): its About and Founder pages and its home page. */
const FACTS: [string, string][] = [
  ['2024', 'founded in Surat, Gujarat'],
  ['5+', 'product categories'],
  ['6', 'certifications and approvals'],
  ['Export', 'ready certifications'],
];

const WHY: { title: string; text: string }[] = [
  { title: 'Support for smaller launches', text: 'Many new supplement founders have strong ideas but need a manufacturer willing to back a smaller launch with speed, quality and guidance. That is why we exist.' },
  { title: 'Brand launch support', text: 'We help with formulation, packaging, website and marketing setup, so you launch as a complete brand and not only a product.' },
  { title: 'Certified quality', text: 'We operate with FSSAI, GMP, HACCP, Kosher and Halal certifications, and we are FDA registered.' },
];

const JOURNEY: [string, string, string][] = [
  ['2023', 'The idea', 'We saw the gap between quality manufacturing and brand success.'],
  ['2024', 'Gomzi founded', 'A GMP facility was established in Surat, Gujarat.'],
  ['2024', 'FSSAI and GMP secured', 'Full regulatory compliance achieved.'],
  ['2024', 'Brand partners grow', 'We expanded into 5+ product categories.'],
  ['2026+', 'Looking ahead', 'Bringing trusted manufacturing to more Indian brands.'],
];

const STAGES: [string, string][] = [
  ['Idea and strategy', 'We help define the product category, audience and positioning.'],
  ['Formulation development', 'We build the right formulation and share samples for approval.'],
  ['Manufacturing and QC', 'We produce the approved batch with quality checks and documentation.'],
  ['Packaging design', 'We create compliant, premium packaging for retail and online.'],
  ['Website and marketing setup', 'We help you prepare for launch with a digital brand foundation.'],
];

const VALUES: [string, string][] = [
  ['Certified integrity', 'Quality is non-negotiable.'],
  ['Brand-builder mindset', 'We think like founders.'],
  ['Speed as a standard', 'Fast delivery is part of our system.'],
  ['Accessible craftsmanship', 'Great quality should be available at small minimum orders.'],
  ['Transparency', 'Clear pricing and clear formulation communication.'],
  ['Innovation', 'We keep creating differentiated products and flavours.'],
];

const QA: [string, string][] = [
  ['GMP-certified production', 'Manufactured to international Good Manufacturing Practice standards.'],
  ['Batch COA on every order', 'A Certificate of Analysis ships with every production run.'],
  ['Third-party lab testing', 'Independent verification of purity, potency and safety.'],
];

const FOR: [string, string][] = [
  ['Fitness creators', 'You have the audience. We give you the product. Launch your own line and own your revenue.'],
  ['Gym owners', 'Build loyalty and margin with a house brand your members trust and repurchase every month.'],
  ['Personal trainers', 'Give your clients a protein or supplement with your own name on it, and recommend what you trust.'],
  ['Dietitians and nutritionists', 'Offer supplements that fit your plans, under your own brand, instead of sending clients elsewhere.'],
  ['Pharma distributors', 'Add high-margin wellness products to your portfolio, with export-ready certifications.'],
  ['Startups and new brands', 'Start small, with low minimum orders and ready formulations, and launch without building a factory.'],
  ['Brands adding supplements', 'Already selling in fitness, food or wellness? Add a supplement line made, filled and labelled for you.'],
  ['E-commerce sellers', 'Sell your own branded supplements on your store or marketplaces, with a label you design yourself.'],
  ['Quick-commerce brands', 'Launch pack sizes and sachets built for fast-moving, small-basket orders, under your brand.'],
];

/** The company: why it exists, who founded it, how it grew, what it stands for and how it checks its quality. */
export function AboutPage() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return (
    <div className="plp abt">
      <Seo
        title="About Gomzi Life Science LLP | Supplement Manufacturer in Surat"
        description="Gomzi Life Science LLP is a Surat-based B2B nutraceutical manufacturing partner. Founded in 2024 by Dr. Gautam Jani, we support founders from idea to formulation, manufacturing, packaging and launch."
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About Gomzi Life Science LLP',
            url: `${origin}/about`,
            mainEntity: {
              '@type': 'Organization',
              name: COMPANY.name,
              url: `${origin}/`,
              foundingDate: '2024',
              founder: { '@type': 'Person', name: 'Dr. Gautam Jani', jobTitle: 'Founder and Managing Director' },
              email: CONTACT_EMAIL,
              telephone: COMPANY.tel,
              address: { '@type': 'PostalAddress', streetAddress: '443-444-445, 1st Floor, RJD Textile Park, Ichchhapor, Hazira Road', addressLocality: 'Surat', addressRegion: 'Gujarat', postalCode: '394510', addressCountry: 'IN' },
              sameAs: SOCIAL_LINKS.map((s) => s.href),
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'About', item: `${origin}/about` },
            ],
          },
        ]}
      />

      <section className="plp-hero">
        <div className="wrap plp-hero-grid">
          <div className="plp-hero-art">
            <Illus name="hero" width={640} height={400} alt="Formulate, label and dispatch: how Gomzi makes your brand" eager />
          </div>
          <div className="plp-hero-copy">
            <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span>About</span></nav>
            <h1>We help supplement founders build brands people trust</h1>
            <p>Gomzi Life Science LLP is a Surat-based B2B nutraceutical manufacturing partner for sports nutrition supplements, multivitamin tablets and whey protein. We support founders from idea to formulation, manufacturing, packaging and launch.</p>
            <div className="plp-hero-cta">
              <Link className="btn btn-lime" to="/products">Explore products</Link>
              <Link className="btn btn-ghost" to="/contact">Contact us</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="abt-stats" aria-label="At a glance">
        <div className="wrap abt-stats-grid">
          {FACTS.map(([b, s]) => (
            <div key={s}><b>{b}</b><span>{s}</span></div>
          ))}
        </div>
      </section>

      <section className="abt-why" aria-label="Why Gomzi exists">
        <div className="wrap">
          <h2 className="abt-h">Why Gomzi exists</h2>
          <div className="plp-cards-grid">
            {WHY.map((c) => (
              <article key={c.title} className="plp-card">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="abt-founder" aria-label="From our founder">
        <div className="wrap">
          <figure className="abt-quote">
            <span className="abt-qmark" aria-hidden="true">“</span>
            <blockquote>A great product manufactured well still fails if the brand around it isn’t ready. That’s why we don’t stop at the product. We support founders through formulation, packaging, and even their website, so they launch as a complete brand from day one.</blockquote>
            <figcaption><b>Dr. Gautam Jani</b><span>Founder and Managing Director</span></figcaption>
          </figure>
        </div>
      </section>

      <section className="abt-journey" aria-label="Our journey">
        <div className="wrap">
          <h2 className="abt-h">Our journey so far</h2>
          <ol className="abt-timeline">
            {JOURNEY.map(([year, title, text]) => (
              <li key={title}>
                <span className="abt-year">{year}</span>
                <b>{title}</b>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="abt-stages" aria-label="The brand launch journey">
        <div className="wrap">
          <h2 className="abt-h">The brand launch journey</h2>
          <p className="abt-sub">A simple five-step path that turns your supplement idea into a ready-to-sell product and brand. Most manufacturers stop at production. We go further and help you build a brand.</p>
          <ol className="abt-stagelist">
            {STAGES.map(([t, d], i) => (
              <li key={t}>
                <span>{i + 1}</span>
                <div><b>{t}</b><p>{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="abt-values" aria-label="Our core values">
        <div className="wrap">
          <h2 className="abt-h">Our core values</h2>
          <div className="abt-values-grid">
            {VALUES.map(([t, d]) => (
              <article key={t}>
                <b>{t}</b>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="abt-cert" aria-label="Quality assurance">
        <div className="wrap">
          <h2 className="abt-h">Every batch, verified</h2>
          <div className="abt-qa">
            {QA.map(([t, d]) => (
              <div key={t}><b>{t}</b><span>{d}</span></div>
            ))}
          </div>
          <div className="abt-seals"><Seals label={false} /></div>
        </div>
      </section>

      <section className="abt-for" aria-label="Who we work with">
        <div className="wrap">
          <h2 className="abt-h">Who we work with</h2>
          <div className="plp-cards-grid">
            {FOR.map(([t, d]) => (
              <article key={t} className="plp-card">
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
          <p className="abt-find">Find our address, phone and map on the <Link to="/contact">Contact page</Link>.</p>
        </div>
      </section>

      <section className="cta" aria-label="Get started">
        <div className="wrap">
          <div className="cta-card">
            <span className="eyebrow">Start with a conversation</span>
            <h2>Tell us about your brand.</h2>
            <p>Share your product idea and we will help you move from concept to manufacturing to launch.</p>
            <div className="actions">
              <a className="btn btn-lime" href={wa('Hi Gomzi, I would like to talk about launching my own supplement brand.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              <Link className="btn btn-outline-light" to="/contact">Contact us</Link>
              <Link className="btn btn-outline-light" to="/products">Explore products</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
