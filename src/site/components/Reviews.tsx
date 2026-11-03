import { REVIEWS, type Review } from '../data/reviews';

const Stars = ({ n }: { n: number }) => (
  <span className="rv-stars" role="img" aria-label={`${n} out of 5`}>
    {'★★★★★'.slice(0, n)}<i>{'★★★★★'.slice(n)}</i>
  </span>
);

/** What clients say about us, scrolling by like the client logos. Hidden until there are reviews. */
export function Reviews({ list = REVIEWS }: { list?: Review[] }) {
  if (!list.length) return null;
  const base = import.meta.env.BASE_URL;
  // a short list is repeated so the track is always wider than the screen
  const reps = Math.max(1, Math.ceil(8 / list.length));
  const once = Array.from({ length: reps }, () => list).flat();
  const row = (copy: number) =>
    once.map((r, i) => (
      <li key={`${copy}-${i}`} className="rv-card" aria-hidden={copy > 0 || undefined}>
        <img className="rv-logo" src={`${base}clients/${r.logo}.png`} alt={copy > 0 ? '' : r.brand} loading="lazy" draggable={false} />
        <h3>{r.brand}</h3>
        <p>“{r.text}”</p>
        {(r.by || r.stars) && (
          <div className="rv-by">
            {r.by && <b>{r.by}</b>}
            {r.stars ? <Stars n={Math.min(5, Math.max(1, r.stars))} /> : null}
          </div>
        )}
      </li>
    ));
  return (
    <section className="reviews" aria-label="Client reviews">
      <div className="wrap">
        <span className="eyebrow">Reviews</span>
        <h2>What our clients say</h2>
      </div>
      <div className="clients-view">
        <ul className="clients-track rv-track">{row(0)}{row(1)}</ul>
      </div>
    </section>
  );
}
