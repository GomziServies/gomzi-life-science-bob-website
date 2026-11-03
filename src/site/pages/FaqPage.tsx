import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FAQ_GROUPS } from '../data/guides';
import { WHATSAPP } from '../lib/config';

const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/** Every question, in six groups, with a search box and a group filter. */
export function FaqPage() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const needle = q.trim().toLowerCase();

  const groups = useMemo(
    () =>
      FAQ_GROUPS.filter((g) => group === 'all' || g.id === group)
        .map((g) => ({ ...g, items: g.items.filter(([a, b]) => !needle || a.toLowerCase().includes(needle) || b.toLowerCase().includes(needle)) }))
        .filter((g) => g.items.length > 0),
    [needle, group],
  );
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="guide">
      <section className="section guide-head">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span>FAQ</span></nav>
          <h1 className="page-title">Questions people ask</h1>
          <p className="lede">Quick answers about ordering, quantities, labels, formulas and delivery. Can’t find yours? Our team is a message away.</p>
          <label className="faq-search">
            <span className="sr-only">Search the questions</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, for example “minimum”, “logo” or “5 days”" />
          </label>
          <div className="faq-pills" role="group" aria-label="Question groups">
            <button type="button" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>All</button>
            {FAQ_GROUPS.map((g) => (
              <button key={g.id} type="button" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>{g.title}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="section guide-faq" aria-label="Questions and answers">
        <div className="wrap narrow">
          {total === 0 ? (
            <p className="faq-none">No question matches “{q}”. Try another word, or <a href={wa('Hi Gomzi, I have a question: ' + q)} target="_blank" rel="noopener noreferrer">ask our team on WhatsApp</a>.</p>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="faq-group" id={g.id}>
                <h2>{g.title}</h2>
                {g.items.map(([a, b]) => (
                  <details key={a}>
                    <summary>{a}</summary>
                    <p>{b}</p>
                  </details>
                ))}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="cta" aria-label="Still have a question">
        <div className="wrap">
          <div className="cta-card">
            <span className="eyebrow">Still have a question?</span>
            <h2>Talk to an expert.</h2>
            <p>Tell us about your brand and we will guide you from the first product to your first batch.</p>
            <div className="actions">
              <a className="btn btn-lime" href={wa('Hi Gomzi, I want to talk to an expert about launching my own supplement brand.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              <Link className="btn btn-outline-light" to="/how-it-works">How it works</Link>
              <Link className="btn btn-outline-light" to="/products">Explore products</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
