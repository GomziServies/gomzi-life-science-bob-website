import { useEffect } from 'react';
import type { Product } from '../data/catalog';
import { COMPANY, CUSTOM_FORMULAS, NUTRITION, customFor } from '../data/content';
import { WHATSAPP } from '../lib/config';

/** The product's fixed nutrition table, and how to ask for your own formula. */
export function NutritionModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const n = NUTRITION[product.id];
  const options = customFor(product.id, product.group);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ask = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi ${COMPANY.name}, I want to discuss a custom formula for ${product.name}.`)}`;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`${product.name} nutrition table`} onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="icon-x modal-x" aria-label="Close" onClick={onClose}>×</button>
        <h3>{product.name}</h3>
        <p className="muted">{product.sub} · fixed formula</p>

        {product.detailImage ? (
          <>
            <img className="detail-img" src={product.detailImage} alt={`${product.name} ingredients`} />
            {product.labelSize && <p className="muted fine">Label size: {product.labelSize}</p>}
          </>
        ) : n ? (
          <>
            <table className="ntable">
              <thead>
                <tr><th>Nutrient</th><th>Per {n.serving}</th><th>Per 100 g</th></tr>
              </thead>
              <tbody>
                {n.rows.map((r) => (
                  <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="muted fine">Approximate values. This table is fixed and printed on your back label.</p>
          </>
        ) : (
          <div className="note-box">
            <span>This product uses our fixed formula. Its full nutrition table is printed on your back label and shared with your quotation.</span>
          </div>
        )}

        <b>Need a different formula?</b>
        <p className="muted fine">Your own formula is developed by our team after a call:</p>
        <ul className="cform">
          {options.map((k) => (
            <li key={k}>
              <span>{CUSTOM_FORMULAS[k].label}<small className="muted"> · {CUSTOM_FORMULAS[k].note}</small></span>
            </li>
          ))}
        </ul>
        <div className="modal-actions">
          <a className="btn wa btn-sm" href={ask} target="_blank" rel="noopener noreferrer">Talk to our team</a>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
