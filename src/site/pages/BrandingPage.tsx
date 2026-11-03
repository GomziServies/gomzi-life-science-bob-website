import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { productById } from '../data/catalog';
import { WHATSAPP } from '../lib/config';
import { labelMm, logoGuide } from '../lib/labelArt';
import { ownDesign } from '../components/ProductJar';
import { Seo } from '../components/Seo';

const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const LABEL_IMG = `${import.meta.env.BASE_URL}labels/veda-fuel-label.webp`;

const BASE = import.meta.env.BASE_URL;
/** A real picture of a group of packs, set in a soft stage. */
const combo = (file: string, alt: string) => (
  <div className="brp-stage brp-combo">
    <img src={`${BASE}categories/${file}.webp`} alt={alt} loading="lazy" decoding="async" />
  </div>
);

interface Row {
  id: string;
  title: string;
  intro: string[];
  specs: [string, string][];
  note?: string;
  cta: ReactNode;
  visual: ReactNode;
}

/** Custom branding: what Gomzi puts your name on, one block at a time, each with the facts a brand owner asks about. */
export function BrandingPage() {
  const tub = productById('wp57')!;
  const g = logoGuide(tub, ownDesign(tub.id));
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  const rows: Row[] = [
    {
      id: 'label',
      title: 'Custom Label',
      intro: ['Every pack carries your own label: your logo, your brand name, your address and customer care number, and your design on the front.', 'Start from a ready template, let AI Studio make designs, or bring your own artwork. Designing in our studio is free.'],
      specs: [
        ['Label sizes', '450 × 140 mm protein tub · 310 × 85 mm jar · 177.8 × 70 mm bottle · 140 × 110 mm sachet'],
        ['Panels', 'Marketed by (you) · front design · manufactured by (us, with FSSAI number)'],
        ['Your logo', `Shown in the studio at the exact size; for a protein tub, ${g.mmW} × ${g.mmH} mm`],
        ['Print file', 'Our design team prepares the print-ready CMYK file'],
      ],
      cta: <Link className="btn btn-lime" to="/custom-labels">See custom labels</Link>,
      visual: (
        <div className="brp-stage brp-stage-label">
          <img src={LABEL_IMG} alt="A finished three-panel label, Veda Fuel Mawa Kulfi whey protein" width={2400} height={745} loading="lazy" decoding="async" />
        </div>
      ),
    },
    {
      id: 'pack',
      title: 'Your Own Pack',
      intro: ['Choose how your product reaches your customer: a protein tub, a stand-up pouch or a sachet, in the size that suits your range.', 'See your label on the pack in 3D, turn it round, and check every side before you send your inquiry.'],
      specs: [
        ['Protein powders', '500 g, 1 kg or 2 kg jars, also as stand-up pouches and sachets'],
        ['Sports supplements', '250 g jars: creatine, BCAA, EAA, pre-workout and fat burner'],
        ['Peanut butter & instant mixes', 'Peanut butter jars and 14 g instant sachets'],
        ['Wellness range', 'Bottles of 60, with gummies and drops'],
      ],
      cta: <Link className="btn btn-lime" to="/products">Explore products</Link>,
      visual: combo('whey', 'Whey protein tubs in three flavours, with a stand-up pouch and sachet available'),
    },
    {
      id: 'formula',
      title: 'Your Own Formula',
      intro: ['Want a product no one else sells? Our formulation team develops your own whey, your own pre-workout or a brand-new product with you, after a short call.', 'Ready formulations ship fast. Your own formula is scheduled once you approve the sample.'],
      specs: [
        ['What we can make', 'Custom whey · custom pre-workout · a brand-new product'],
        ['Revisions', 'Revised until you approve; a brand-new product has unlimited revisions'],
        ['Development', 'One-time development charge, offered per product'],
        ['Nutrition table', 'Yours, printed on your label (ready products have a fixed table)'],
      ],
      cta: <a className="btn btn-lime" href={wa('Hi Gomzi, I want to discuss my own formula for my supplement brand.')} target="_blank" rel="noopener noreferrer">Talk about your formula</a>,
      visual: combo('mto', 'A set of black supplement jars made to order with your own formula'),
    },
    {
      id: 'team',
      title: 'Our Design Team',
      intro: ['No time to design, or want a second pair of eyes? Leave the label to our design team.', 'The product joins your inquiry marked as made by our team, and our designers prepare the artwork and the print file for you.'],
      specs: [
        ['How it works', 'Choose “leave it to the design team” on any product'],
        ['What you share', 'Your logo and brand details; we do the rest'],
        ['Print file', 'Print-ready CMYK file, prepared by our team'],
        ['Check before print', 'Review every label on the pack in 3D before you confirm'],
      ],
      note: `The design team opens every saved label and makes print-ready adjustments.`,
      cta: <Link className="btn btn-lime" to="/contact">Contact our team</Link>,
      visual: (
        <div className="brp-stage brp-flat">
          <div className="brp-fronts">
            {[['nutra-cappuccino', 'Sachet label'], ['go-rich-chocolate', 'Pouch label'], ['rep-nineteen', 'Pouch label']].map(([f, t]) => (
              <figure key={f}>
                <img src={`${BASE}labels/bag/${f}-thumb.webp`} alt={`${t}, finished by the design team`} loading="lazy" decoding="async" />
                <figcaption>{t}</figcaption>
              </figure>
            ))}
          </div>
          <span className="brp-badge">Label size {labelMm(tub).w} × {labelMm(tub).h} mm on a tub</span>
        </div>
      ),
    },
  ];

  return (
    <div className="brp">
      <Seo
        title="Custom Branding Services for Supplement Brands | Gomzi"
        description="Put your own name on every pack: custom labels, your own pack type, your own formula and our design team, all made, filled and labelled in Surat."
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Custom branding services for supplement brands',
            serviceType: 'Private-label supplement branding',
            provider: { '@type': 'Organization', name: 'Gomzi Life Science LLP', url: `${origin}/` },
            areaServed: 'IN',
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Custom branding',
              itemListElement: rows.map((r) => ({ '@type': 'Offer', name: r.title, description: r.intro.join(' ') })),
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Custom branding', item: `${origin}/custom-branding` },
            ],
          },
        ]}
      />

      <section className="brp-head">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span>Custom branding</span></nav>
          <h1>Custom Branding Services</h1>
          <p className="brp-sub">We are serious about your brand. We help you grow it.</p>
        </div>
      </section>

      <section className="brp-quote">
        <div className="wrap">
          <p>“Gomzi makes, fills and labels your products in Surat. We believe your brand should be strong enough for customers to notice. With your own name on every pack, flavour and label, you can launch and grow your own supplement company. Take a look below at what we can brand for you.”</p>
        </div>
      </section>

      <section className="brp-rows" aria-label="What we brand for you">
        <div className="wrap">
          {rows.map((r, i) => (
            <article key={r.id} id={r.id} className={`brp-row${i % 2 ? ' flip' : ''}`}>
              <div className="brp-vis">{r.visual}<div className="brp-vis-cta">{r.cta}</div></div>
              <div className="brp-txt">
                <h2>{r.title}</h2>
                {r.intro.map((t) => <p key={t}>{t}</p>)}
                <ul className="brp-specs">
                  {r.specs.map(([k, v]) => (
                    <li key={k}><b>{k}:</b> {v}</li>
                  ))}
                </ul>
                {r.note && <p className="brp-note"><span aria-hidden="true">ⓘ</span>{r.note}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="brp-band" aria-label="Get started">
        <div className="wrap">
          <div className="brp-band-card">
            <h2>Start your own supplement brand</h2>
            <div className="actions">
              <Link className="btn btn-lime" to="/products">Explore products</Link>
              <a className="btn btn-outline-light" href={wa('Hi Gomzi, I want to start my own supplement brand.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
