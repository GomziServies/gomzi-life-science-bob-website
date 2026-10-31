import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATALOG, GROUPS, MIN_QTY, type GroupId } from '../data/catalog';
import { CERTS, COMPANY, MADE_TO_ORDER } from '../data/content';
import { Logo } from '../components/Logo';

/** The brochure: every product, and how to order. "Download" opens the print dialog, where PDF can be chosen. */
export function BrochurePage() {
  const [params] = useSearchParams();

  useEffect(() => {
    if (params.get('print') !== '1') return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [params]);

  return (
    <section className="section brochure">
      <div className="wrap narrow">
        <div className="brochure-actions no-print">
          <button className="btn btn-lime btn-sm" onClick={() => window.print()}>Download as PDF</button>
          <span className="muted">In the print window, choose “Save as PDF”.</span>
        </div>

        <header className="brochure-head">
          <Logo height={52} />
          <p>Launch your own supplement brand in just 5 days. Choose from ready formulations and we manufacture, fill and label your jars at our facility in Surat.</p>
        </header>

        {(Object.keys(GROUPS) as GroupId[]).map((g) => (
          <div key={g} className="brochure-group">
            <h3>{GROUPS[g].title}</h3>
            <p className="muted">{GROUPS[g].note}</p>
            <table className="ntable">
              <thead><tr><th>Product</th><th>Details</th><th>Unit</th></tr></thead>
              <tbody>
                {CATALOG.filter((p) => p.group === g && !p.hidden).map((p) => (
                  <tr key={p.id}><td>{p.name}</td><td>{p.sub}</td><td>per {p.unit}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="brochure-group">
          <h3>Made to order</h3>
          <p>{MADE_TO_ORDER.join('  ·  ')}</p>
        </div>

        <div className="brochure-group">
          <h3>Good to know</h3>
          <ul className="terms-list">
            <li>Minimum order: 50 kg for protein (flavours can be mixed) and {MIN_QTY} jars or bottles for each sports or wellness product.</li>
            <li>18 months shelf life on every batch.</li>
            <li>5-day dispatch applies to ready formulations in stock once your label is approved and the order is confirmed.</li>
          </ul>
        </div>

        <footer className="brochure-foot">
          <b>{COMPANY.name}</b>
          <span>{COMPANY.address}</span>
          <span>{COMPANY.phone} · {COMPANY.site}</span>
          <span>{CERTS.join(' · ')}</span>
        </footer>
      </div>
    </section>
  );
}
