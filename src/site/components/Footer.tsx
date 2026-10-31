import { MAIN_SITE } from '../data/content';

// Footer laid out like the company website (gomzilifesciences.in), so this order site can sit inside it later.
// Links point to the main site's own pages.
const site = (path: string) => `${MAIN_SITE}${path}`;

const SERVICES: [string, string][] = [
  ['Private Label Supplements', site('/nutrition/white-labelling')],
  ['Whey Protein', site('/third-party-manufacturing/protein-powder')],
  ['Sports Nutrition', site('/third-party-manufacturing/sports-nutrition-supplements')],
  ['Multivitamin', site('/third-party-manufacturing/multivitamins-tablet')],
  ['Peanut Butter', site('/third-party-manufacturing/peanut-butter')],
];

const LINKS: [string, string][] = [
  ['Contact Us', site('/nutrition/contact-us')],
  ['AboutUs', site('/aboutUs')],
  ['Faq', '/shop#faq'],
];

const INFORMATION: [string, string][] = [
  ['Terms & Conditions', site('/nutrition/terms-condition-customer')],
  ['Return & Refund', site('/nutrition/return-and-refund-policy-customer')],
  ['Privacy Policy', site('/nutrition/privacy-policy-customer')],
  ['Cancellation Policy', site('/nutrition/cancellation-policy-customer')],
  ['Pricing Policy', site('/nutrition/pricing-policy-customer')],
  ['Shipping Policy', site('/nutrition/shipping-policy-customer')],
];

const CERTS: [string, string][] = [
  ['FSSAI', '/certs/fassai.webp'],
  ['GMP', '/certs/gmp.webp'],
  ['HACCP', '/certs/haccp.webp'],
  ['Halal', '/certs/halal.webp'],
  ['Kosher', '/certs/kosher.webp'],
  ['FDA', '/certs/FDA-logo.webp'],
];

const icon = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const;

const SOCIAL: { label: string; href: string; path: string }[] = [
  { label: 'Facebook', href: 'https://www.facebook.com/Gomzilifesciences', path: 'M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.3V13h2.7v8z' },
  { label: 'Instagram', href: 'https://www.instagram.com/gomzi_lifesciences/', path: 'M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7zM12 7.6a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8zm0 1.8a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zm4.6-2.9a1 1 0 1 1 0 2 1 1 0 0 1 0-2z' },
  { label: 'YouTube', href: 'https://www.youtube.com/@Gomzilifesciences', path: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gomzi-lifesciences-423558312/', path: 'M4.5 9h3v10.5h-3zM6 4.2a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM10 9h2.9v1.4h.1c.4-.8 1.4-1.7 3-1.7 3.1 0 3.7 2 3.7 4.7v6.1h-3v-5.4c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8v5.5h-3z' },
];

export function Footer() {
  return (
    <footer className="gf">
      <div className="gf-wrap">
        <div className="gf-col gf-brand">
          <h4>Gomzi Lifesciences LLP</h4>
          <p className="gf-tag">Your Trusted Partner For Premium Nutraceutical Manufacturing.</p>
          <a className="gf-strong" href="mailto:info@gomzilifesciences.in">Info@Gomzilifesciences.In</a>
          <a className="gf-strong gf-addr" href="https://www.google.com/maps?q=443,444,445,RJD+Textile+Park,Ichchhapor,Hazira+Road,Surat,Gujarat,394510" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#e11d1d" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.500a2.5 2.5 0 0 1 0 5z" /></svg>
            <span>443,444,445, 1st Floor, RJD Textile Park, At. Ichchhapor, Hazira Road, Surat, Gujarat 394510</span>
          </a>
        </div>

        <div className="gf-col">
          <h4>Services</h4>
          <ul>{SERVICES.map(([label, href]) => <li key={label}><a href={href}>{label}</a></li>)}</ul>
        </div>

        <div className="gf-col">
          <h4>Links</h4>
          <ul>{LINKS.map(([label, href]) => <li key={label}><a href={href}>{label}</a></li>)}</ul>
        </div>

        <div className="gf-col">
          <h4>Information</h4>
          <ul>{INFORMATION.map(([label, href]) => <li key={label}><a href={href}>{label}</a></li>)}</ul>
        </div>

        <div className="gf-col gf-follow">
          <h4>Follow Us</h4>
          <div className="gf-social">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Follow us on ${s.label}`}>
                <svg {...icon}><path d={s.path} /></svg>
              </a>
            ))}
          </div>
          <h4>Partner With Us</h4>
          <ul>
            <li><a href={`${MAIN_SITE}/`}>Become A Distributor</a></li>
            <li><a href={`${MAIN_SITE}/`}>Become An Affiliate</a></li>
          </ul>
          <div className="gf-certs" aria-label="Certifications">
            {CERTS.map(([name, src]) => <img key={name} src={src} alt={name} title={name} loading="lazy" />)}
          </div>
        </div>
      </div>
    </footer>
  );
}
