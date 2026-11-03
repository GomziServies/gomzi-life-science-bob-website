import { Link } from 'react-router-dom';

/** Three short guides, written from what we offer: each opens the part of the site it talks about. */
const GUIDES: { title: string; text: string; to: string; hash?: boolean }[] = [
  {
    title: 'How to launch your own supplement brand',
    text: 'Pick a ready formulation, add your name and label, and we manufacture, fill and label your jars at our facility in Surat. See every step from cart to dispatch.',
    to: '/how-private-label-works',
  },
  {
    title: 'Whey Isolate, Concentrate or Blend?',
    text: 'Compare our whey range side by side: 90% isolate, 80% concentrate, 60% and the everyday blend, with protein levels, absorption and best use from our brochure.',
    to: '/brochure',
  },
  {
    title: 'Design your own label, free',
    text: 'Choose a template in our design studio, add your logo and see the result on a 3D tub, pouch or sachet before you place your inquiry.',
    to: '/products',
  },
];

export function Learn() {
  return (
    <section className="learn" aria-label="Learn more">
      <div className="wrap">
        <h2>Learn more about launching your supplement brand</h2>
        <div className="learn-grid">
          {GUIDES.map((g) => {
            const body = (
              <>
                <h3>{g.title}</h3>
                <p>{g.text}</p>
                <span className="learn-go" aria-hidden="true">»</span>
              </>
            );
            return g.hash ? (
              <a key={g.title} className="learn-card" href={g.to}>{body}</a>
            ) : (
              <Link key={g.title} className="learn-card" to={g.to}>{body}</Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
