import { Link } from 'react-router-dom';
import { HOW_STEPS, PACKS, WAYS } from '../data/guides';
import { WHATSAPP } from '../lib/config';

const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

const ic = (d: string[]) => (
  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((x) => <path key={x} d={x} />)}
  </svg>
);
const ICONS = [
  ic(['M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z', 'M3.5 7.5 12 12l8.5-4.5', 'M12 12v9']),
  ic(['M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14A1.5 1.5 0 0 1 16 20.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5Z', 'M9.5 8.5h5', 'M9.5 12h5', 'M9.5 15.5h3']),
  ic(['M4 5.5h16v13H4z', 'M4 14.5l4.5-4 4 3.5 3-2.5L20 15', 'M15.5 8.6h.01']),
  ic(['M12 4.5C6.5 4.5 3 12 3 12s3.5 7.5 9 7.5 9-7.5 9-7.5-3.5-7.5-9-7.5Z', 'M12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z']),
  ic(['M21 3 10.5 13.5', 'M21 3l-6.5 18-4-7.5L3 9.5 21 3Z']),
];

/** "How it works" in full: every step in detail, the two ways to launch, and what each pack comes in. */
export function HowItWorksPage() {
  return (
    <div className="guide">
      <section className="section guide-head">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span>How it works</span></nav>
          <h1 className="page-title">From cart to your own branded jars</h1>
          <p className="lede">Everything happens on this website, from choosing your products to placing the order. Here is each step in detail, so you know exactly what to expect.</p>
          <ul className="guide-facts">
            <li><b>5 steps</b><span>all on this website</span></li>
            <li><b>OTP</b><span>confirms your phone number</span></li>
            <li><b>3D</b><span>preview before you send</span></li>
            <li><b>Free</b><span>label design studio</span></li>
          </ul>
        </div>
      </section>

      <section className="section guide-steps" aria-label="The five steps">
        <div className="wrap">
          <ol className="gsteps">
            {HOW_STEPS.map((s, i) => (
              <li key={s.title} className="gstep">
                <div className="gstep-rail" aria-hidden="true">
                  <span className="gstep-ic">{ICONS[i]}</span>
                </div>
                <div className="gstep-card">
                  <span className="gstep-n">Step {i + 1}</span>
                  <h2>{s.title}</h2>
                  <p className="gstep-sum">{s.summary}</p>
                  <b className="gstep-h">What you do</b>
                  <ul>{s.doList.map((d) => <li key={d}>{d}</li>)}</ul>
                  <p className="gstep-note"><span aria-hidden="true">ⓘ</span>{s.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section soft guide-ways" aria-label="Two ways to launch">
        <div className="wrap">
          <span className="eyebrow">Two ways to launch</span>
          <h2>Ready formulation or your own formula</h2>
          <p className="lede">Most brands start with a ready formulation and launch in days. If you want something of your own, our team builds it with you.</p>
          <div className="gways">
            {WAYS.map((w) => (
              <article key={w.title} className="gway">
                <header><h3>{w.title}</h3><span className="gway-tag">{w.tag}</span></header>
                <dl>
                  {w.rows.map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section guide-packs" aria-label="What each product comes in">
        <div className="wrap">
          <span className="eyebrow">Pack types</span>
          <h2>What each product comes in</h2>
          <div className="gpacks">
            {PACKS.map((p) => (
              <div key={p.title} className="gpack"><b>{p.title}</b><span>{p.text}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta" aria-label="Get started">
        <div className="wrap">
          <div className="cta-card">
            <span className="eyebrow">Ready to start?</span>
            <h2>Choose your first products.</h2>
            <p>Add them to your inquiry, design your labels and send. Our team will take it from there.</p>
            <div className="actions">
              <Link className="btn btn-lime" to="/products">Explore products</Link>
              <Link className="btn btn-outline-light" to="/how-private-label-works">How we make it</Link>
              <Link className="btn btn-outline-light" to="/faq">Read the FAQ</Link>
              <a className="btn btn-outline-light" href={wa('Hi Gomzi, I have a question about how ordering works.')} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
