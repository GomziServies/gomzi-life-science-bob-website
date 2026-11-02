import { useEffect, useRef, useState } from 'react';
import type { Product } from '../data/catalog';
import type { GalleryBanner } from '../lib/api';
import { LabelView } from './LabelView';
import { packsOf, type Pack } from './LabelParts';
import { ProductJar, ownDesign } from './ProductJar';
import type { Details } from '../lib/labelArt';

const NAMES: Record<Pack, (p: Product) => string> = { jar: (p) => (p.unit === 'kg' ? 'Tub' : 'Jar'), pouch: () => 'Pouch', sachet: () => 'Sachet' };

/** Pictures of each pack, already taken, so a card that scrolls back into view shows them at once. */
const shots = new Map<string, string>();
const shotKey = (p: Product, flavour: string, banner: GalleryBanner | null | undefined, details: Details, pack: Pack) => JSON.stringify([p.id, flavour, banner?.slug ?? '', details.brand, pack]);

/** At most two packs are drawn in 3D at a time across all the cards, so a slow computer is never asked for a dozen at once. */
const MAX_BUILDS = 2;
let builds = 0;
const waiting = new Set<() => void>();
const takeSlot = () => (builds < MAX_BUILDS ? (builds++, true) : false);
const freeSlot = () => {
  builds = Math.max(0, builds - 1);
  waiting.forEach((wake) => wake());
};

/** A product card's picture: the product's 3D models (tub or jar, pouch, sachet) one after another every two seconds. Each pack is drawn in 3D once, in the
 * background, one at a time; the card then fades between the finished pictures, which costs nothing to show and cannot stutter. */
export function Card3D({ product, flavour, details, banner }: { product: Product; flavour: string; details: Details; banner?: GalleryBanner | null }) {
  const host = useRef<HTMLDivElement>(null);
  const packs = packsOf(product);
  const [live, setLive] = useState(false);
  const [, bump] = useState(0);
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  const [gaveUp, setGaveUp] = useState<Pack[]>([]);
  const [tick, setTick] = useState(0);
  const holding = useRef<Pack | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver((en) => setLive(en[0]?.isIntersecting ?? false), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // the models are fetched as soon as the first card is on screen
    if (live) void import('./JarScene').then((m) => m.preloadModels());
  }, [live]);

  const key = (pack: Pack) => shotKey(product, flavour, banner, details, pack);
  const ready = packs.filter((p) => shots.has(key(p)));
  const next = live ? packs.find((p) => !shots.has(key(p)) && !gaveUp.includes(p)) : undefined;

  // a card waits for one of the drawing places; it keeps it until its picture is taken (or 40 s have passed)
  useEffect(() => {
    const wake = () => setTick((n) => n + 1);
    waiting.add(wake);
    return () => {
      waiting.delete(wake);
      if (holding.current) {
        holding.current = null;
        freeSlot();
      }
    };
  }, []);
  useEffect(() => {
    if (holding.current && holding.current !== next) {
      holding.current = null;
      freeSlot();
    }
    if (next && holding.current !== next && takeSlot()) {
      holding.current = next;
      bump((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next, tick]);
  const building = holding.current === next ? next : undefined;
  useEffect(() => {
    if (!building) return;
    const t = window.setTimeout(() => setGaveUp((g) => [...g, building]), 40000);
    return () => window.clearTimeout(t);
  }, [building]);

  useEffect(() => {
    if (!live || held || ready.length < 2) return;
    const t = window.setInterval(() => setAt((i) => i + 1), 2000);
    return () => window.clearInterval(t);
  }, [live, held, ready.length]);

  const shown = ready.length ? ready[at % ready.length] : null;
  return (
    <div className="card3d" ref={host}>
      {shown ? (
        ready.map((id) => <img key={id} className={`card3d-shot${id === shown ? ' on' : ''}`} src={shots.get(key(id))} alt={id === shown ? product.name : ''} draggable={false} />)
      ) : (
        <ProductJar className="jar-card" product={product} flavour={flavour} banner={banner?.thumb} />
      )}
      {building && (
        <div className="card3d-build" aria-hidden>
          <LabelView
            key={building}
            className="card3d-view"
            mode="3d"
            px={1400}
            spec={{ product, flavour, design: ownDesign(product.id), details, logo: undefined }}
            banner={banner ?? undefined}
            pack={building}
            autoTurn={false}
            onSnapshot={(url) => {
              shots.set(key(building), url);
              bump((n) => n + 1);
            }}
          />
        </div>
      )}
      {packs.length > 1 && (
        <div className="card3d-packs" role="group" aria-label="Pack type">
          {packs.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === shown}
              disabled={!shots.has(key(id))}
              onClick={() => {
                setAt(Math.max(0, ready.indexOf(id)));
                setHeld(true);
              }}
            >
              {NAMES[id](product)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
