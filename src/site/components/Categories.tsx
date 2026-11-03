import { Link } from 'react-router-dom';
import { productById } from '../data/catalog';
import { COLLECTIONS } from '../data/collections';
import { ProductJar, tintOf } from './ProductJar';

const PICTURE: Record<string, boolean> = { whey: true, plant: true, gainer: true, aminos: true, pre: true, food: true, well: true, mto: true };

/** The range as eight picture tiles, set at slightly different heights; each opens the Products page for that section. */
export function Categories() {
  return (
    <section className="section cats" id="categories">
      <div className="wrap">
        <span className="eyebrow">Our range</span>
        <h2>Everything you can put your name on</h2>
        <p className="lede">Choose a section to see its products, flavours and pack sizes. Every product is ready to carry your label.</p>
        <div className="cat-grid">
          {COLLECTIONS.map((c) => {
            const shown = c.ids.slice(0, 3).map((id) => productById(id)).filter((p): p is NonNullable<ReturnType<typeof productById>> => !!p);
            const count = c.mto ? null : c.ids.filter((id) => productById(id) && !productById(id)!.hidden).length;
            return (
              <Link key={c.id} to={c.mto ? '/products?c=mto' : `/products?c=${c.id}`} className="cat" style={{ ['--tint' as string]: tintOf(shown[0]?.id ?? 'wp57') }}>
                <span className="cat-art" aria-hidden="true">
                  {PICTURE[c.id] ? (
                    <img className="cat-pic" src={`/categories/${c.id}.webp`} alt="" loading="lazy" decoding="async" />
                  ) : shown.map((p, i) => (
                    <ProductJar key={p.id} className={`cat-jar cat-jar-${i}${shown.length === 1 ? ' solo' : ''}`} product={p} />
                  ))}
                </span>
                <span className="cat-label">
                  <b>{c.title}</b>
                  <small>{count === null ? c.note : `${count} product${count === 1 ? '' : 's'} · ${c.note}`}</small>
                </span>
              </Link>
            );
          })}
        </div>
        <p className="cat-all">
          <Link className="btn btn-lime" to="/products">Browse all products</Link>
        </p>
      </div>
    </section>
  );
}
