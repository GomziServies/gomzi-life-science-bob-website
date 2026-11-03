import { CATALOG } from '../data/catalog';
import { FAQ } from '../data/content';
import { Seo } from './Seo';

const SOCIAL = [
  'https://www.facebook.com/Gomzilifesciences',
  'https://www.instagram.com/gomzi_lifesciences/',
  'https://www.youtube.com/@Gomzilifesciences',
  'https://www.linkedin.com/in/gomzi-lifesciences-423558312/',
];

/** The home page's search tags and structured data (organisation, website, FAQ and product list) built from the shop's own data. */
export function HomeSeo() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: 'Gomzi Life Science LLP',
      url: `${origin}/`,
      logo: `${origin}/brand/gomzi-life-science-logo.png`,
      email: 'info@gomzilifesciences.in',
      description: 'Private-label nutraceutical and sports-nutrition manufacturer in Surat, India: whey protein, creatine, pre-workout and more, made, filled and labelled for your brand.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '443-444-445, 1st Floor, RJD Textile Park, Ichchhapor, Hazira Road',
        addressLocality: 'Surat',
        addressRegion: 'Gujarat',
        postalCode: '394510',
        addressCountry: 'IN',
      },
      sameAs: SOCIAL,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Gomzi Life Science LLP',
      url: `${origin}/`,
      publisher: { '@id': `${origin}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Private-label supplements we manufacture',
      itemListElement: CATALOG.filter((p) => !p.hidden && !p.comingSoon).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name })),
    },
  ];
  return (
    <Seo
      title="Private-Label Supplement Manufacturer in Surat | Gomzi"
      description="Launch your own supplement brand in 5 days. Private-label whey protein, creatine, pre-workout and more, made, filled and labelled in Surat. FSSAI, GMP, HACCP."
      jsonLd={jsonLd}
    />
  );
}
