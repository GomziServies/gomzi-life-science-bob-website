import { Link } from 'react-router-dom';
import { productById } from '../data/catalog';
import { WHATSAPP } from '../lib/config';
import { labelMm, logoGuide } from '../lib/labelArt';
import { ownDesign } from '../components/ProductJar';
import { Seo } from '../components/Seo';

const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/** One of our own finished labels, three panels wide (public/labels). */
const LABEL = { src: `${import.meta.env.BASE_URL}labels/veda-fuel-label.webp`, w: 2400, h: 745, alt: 'Veda Fuel Mawa Kulfi whey protein label: nutrition and ingredients on the left, the front design in the middle, benefits, usage and storage on the right' };

const Ic = ({ d }: { d: string[] }) => (
  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((x) => <path key={x} d={x} />)}
  </svg>
);

const WAYS: { title: string; text: string; icon: string[] }[] = [
  { title: 'Ready templates', text: 'Open a ready template for your product, in the colours and style that suit it, and make it yours.', icon: ['M4 5h16v14H4z', 'M4 10h16', 'M10 10v9'] },
  { title: 'AI Studio', text: 'No design skills? Let AI Studio make designs for you, then pick the one you like.', icon: ['M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3Z', 'M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z'] },
  { title: 'Your logo and artwork', text: 'Upload your logo and place it on the label. A guide shows the exact area and the picture size you need.', icon: ['M12 16V4', 'M7 9l5-5 5 5', 'M5 20h14'] },
  { title: 'Our design team', text: 'Prefer not to design? Leave it to our team. They prepare the label and the print-ready CMYK file.', icon: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'] },
];

const PANELS: { w: string; n: number; title: string; text: string }[] = [
  { w: '34.5%', n: 1, title: 'Nutrition & ingredients', text: 'The nutrition table, amino acid profile, ingredients and allergen details, so customers can read what is inside.' },
  { w: '34%', n: 2, title: 'Front design', text: 'Your logo, the product name, the flavour and your artwork: the part everyone sees first.' },
  { w: '31.5%', n: 3, title: 'Benefits, usage & storage', text: 'Why it works, how to use it, how to store it, and the net weight and servings.' },
];

const SIZE_ROWS: { label: string; id: string }[] = [
  { label: 'Protein tub', id: 'wp57' },
  { label: 'Sports jar', id: 'cre' },
  { label: 'Peanut butter jar', id: 'peanut' },
  { label: 'Wellness bottle', id: 'd3k2' },
  { label: 'Instant sachet', id: 'tea' },
];

const QA: [string, string][] = [
  ['What size are the labels?', 'Each pack has its own label size: 450 × 140 mm for protein tubs, 310 × 85 mm for jars, 177.8 × 70 mm for wellness bottles and 140 × 110 mm for sachets. The design studio opens at the right size for your product.'],
  ['Is designing the label free?', 'Yes. Designing your own label and logo in our design studio is free. Our team confirms everything else with you when they call.'],
  ['Can I use my own logo?', 'Yes. Upload it, place it on the label and move it until it looks right. The studio shows the exact logo area and the picture size you need for a sharp print.'],
  ['Who prepares the print file?', 'Our design team opens your saved label, makes any print-ready adjustments and prepares the CMYK file.'],
  ['Can I see the label on the pack before I order?', 'Yes. Every product has a 3D preview of the tub, pouch or sachet that you can turn to see the front, the back and the sides.'],
  ['What goes on the label besides my design?', 'Your brand details on the “marketed by” panel, our manufacturer details and FSSAI licence number on the “manufactured by” panel, and boxes for batch number, manufacturing and expiry dates and price.'],
];

/** The custom label service: what we make, the four ways to get a label, what is printed on it and its sizes. */
export function CustomLabelsPage() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  return (
    <div className="clp">
      <Seo
        title="Custom Supplement Labels: Design Your Own, Free | Gomzi"
        description="Design custom labels for your supplement brand in our free studio: ready templates, AI Studio, your own logo or our design team. See it in 3D and get a print-ready CMYK file."
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Custom supplement label design and printing',
            serviceType: 'Private-label supplement label design',
            provider: { '@type': 'Organization', name: 'Gomzi Life Science LLP', url: `${origin}/` },
            areaServed: 'IN',
            description: 'A free label design studio for supplement brands, with ready templates, AI-made designs, logo placement, a 3D preview and print-ready CMYK files prepared by our design team.',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: QA.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Custom labels', item: `${origin}/custom-labels` },
            ],
          },
        ]}
      />

      <section className="clp-hero">
        <div className="wrap">
          <div className="clp-copy">
            <p className="clp-eyebrow">Free label design studio</p>
            <h1>Custom Labels for Your Own Supplement Brand</h1>
            <p className="clp-lede">Launching a protein brand? Adding a new flavour? Design the label yourself in minutes, see it on a 3D pack, and our team prepares the print-ready file.</p>
            <div className="clp-cta">
              <Link className="btn btn-lime" to="/products">Design your label →</Link>
              <a className="btn btn-ghost" href={wa('Hi Gomzi, I want to talk to an expert about custom labels for my supplement brand.')} target="_blank" rel="noopener noreferrer">Talk to an expert</a>
            </div>
            <ul className="clp-chips">
              <li>Free design studio</li>
              <li>3D preview on every pack</li>
              <li>Print-ready CMYK files</li>
            </ul>
          </div>

          <figure className="clp-art">
            <div className="clp-shot">
              <img src={LABEL.src} width={LABEL.w} height={LABEL.h} alt={LABEL.alt} decoding="async" fetchPriority="high" />
            </div>
            <figcaption className="clp-marks">
              {PANELS.map((p) => (
                <span key={p.n} style={{ flexBasis: p.w }}><b>{p.n}</b>{p.title}</span>
              ))}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section clp-ways">
        <div className="wrap">
          <span className="eyebrow">Four ways to get your label</span>
          <h2>Design it your way</h2>
          <p className="lede">Start from a template, ask AI, bring your own artwork, or hand it to our team. Mix them as you like.</p>
          <div className="clp-cards">
            {WAYS.map((w) => (
              <article key={w.title} className="clp-card">
                <span className="clp-ic"><Ic d={w.icon} /></span>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft clp-anatomy">
        <div className="wrap">
          <span className="eyebrow">What goes on your label</span>
          <h2>One label, three panels</h2>
          <p className="lede">Your label wraps once around the pack and is read in three panels. This is one of our finished labels.</p>
          <div className="clp-wrap-box">
            <img className="clp-flat" src={LABEL.src} width={LABEL.w} height={LABEL.h} alt={LABEL.alt} loading="lazy" decoding="async" />
          </div>
          <div className="clp-panels">
            {PANELS.map((p) => (
              <div key={p.title} className="clp-panel" style={{ flexBasis: p.w }}>
                <b><i>{p.n}</i>{p.title}</b>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section clp-sizes">
        <div className="wrap">
          <span className="eyebrow">Label sizes</span>
          <h2>The right size for every pack</h2>
          <p className="lede">The studio opens at the exact size of your product’s label, and shows the logo area and the picture size a sharp print needs.</p>
          <div className="clp-table" role="table" aria-label="Label sizes">
            <div className="clp-tr clp-th" role="row"><span>Pack</span><span>Label size</span><span>Logo area</span><span>Logo picture (300 dpi)</span></div>
            {SIZE_ROWS.map((r) => {
              const p = productById(r.id);
              if (!p) return null;
              const mm = labelMm(p);
              const g = logoGuide(p, ownDesign(p.id));
              return (
                <div key={r.id} className="clp-tr" role="row">
                  <b>{r.label}</b>
                  <span data-k="Label size">{mm.w} × {mm.h} mm</span>
                  <span data-k="Logo area">{g.mmW} × {g.mmH} mm</span>
                  <span data-k="Logo picture">{g.pxW} × {g.pxH} px</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section soft clp-faq">
        <div className="wrap narrow">
          <span className="eyebrow">Questions about labels</span>
          <h2>Good to know</h2>
          {QA.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
          <p className="clp-more"><Link to="/faq">See all questions »</Link></p>
        </div>
      </section>

      <section className="cta" aria-label="Get started">
        <div className="wrap">
          <div className="cta-card">
            <span className="eyebrow">Ready to design?</span>
            <h2>Pick a product and make your label.</h2>
            <p>Choose a product, open the studio, add your logo and see it on the pack.</p>
            <div className="actions">
              <Link className="btn btn-lime" to="/products">Explore products</Link>
              <Link className="btn btn-outline-light" to="/how-it-works">How it works</Link>
              <a className="btn btn-outline-light" href={wa('Hi Gomzi, I have a question about custom labels.')} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
