import { useEffect, useRef, useState } from 'react';
import type { Product } from '../data/catalog';
import type { GalleryBanner } from '../lib/api';
import { LabelView } from './LabelView';
import { defaultBagLabel, packsOf, useFirstJarLabel, type Pack } from './LabelParts';
import { ProductJar, ownDesign } from './ProductJar';
import type { Details } from '../lib/labelArt';
import { notePicture, useLoading3d, useTick } from '../lib/preload3d';

const NAMES: Record<Pack, (p: Product) => string> = { jar: (p) => (p.unit === 'kg' ? 'Tub' : 'Jar'), pouch: () => 'Pouch', sachet: () => 'Sachet' };

/** Pictures of each pack, already taken, so a card that scrolls back into view shows them at once. */
const shots = new Map<string, string>();
// change this when the drawing of a pack changes (new caps, new models): older saved pictures are then dropped
const SHOT_VERSION = 'v4-pack-labels';
const shotKey = (p: Product, flavour: string, banner: GalleryBanner | null | undefined, details: Details, pack: Pack) => JSON.stringify([SHOT_VERSION, p.id, flavour, banner?.slug ?? '', details.brand, pack]);

/** The finished pictures are also kept in the browser's own storage, so a product is drawn in 3D once, not again at every visit or reload. */
const DB_NAME = 'gomzi-card-shots';
const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('shots');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
let warmed = false;
const warming: Promise<void> =
  typeof indexedDB === 'undefined'
    ? Promise.resolve().then(() => void (warmed = true))
    : openDb()
        .then(
          (db) =>
            new Promise<void>((resolve) => {
              const store = db.transaction('shots', 'readwrite').objectStore('shots');
              const cur = store.openCursor();
              cur.onsuccess = () => {
                const c = cur.result;
                if (!c) return resolve();
                if (typeof c.key === 'string' && c.key.startsWith(`["${SHOT_VERSION}"`) && typeof c.value === 'string') shots.set(c.key, c.value);
                else c.delete(); // a picture from an older drawing
                c.continue();
              };
              cur.onerror = () => resolve();
            })
        )
        .catch(() => undefined)
        .then(() => void (warmed = true));
const saveShot = (key: string, url: string) => {
  if (typeof indexedDB === 'undefined') return;
  void openDb()
    .then((db) => void db.transaction('shots', 'readwrite').objectStore('shots').put(url, key))
    .catch(() => undefined);
};

/** At most two packs are drawn in 3D at a time across all the cards, so a slow computer is never asked for a dozen at once. */
const MAX_BUILDS = 2;
let builds = 0;
const waiting = new Set<() => void>();
// nothing new is drawn while the visitor is scrolling, so the page never has to scroll and draw 3D at the same moment
let lastScroll = 0;
let calmTimer: number | undefined;
if (typeof window !== 'undefined') {
  window.addEventListener(
    'scroll',
    () => {
      lastScroll = performance.now();
      window.clearTimeout(calmTimer);
      calmTimer = window.setTimeout(() => waiting.forEach((wake) => wake()), 220);
    },
    { passive: true }
  );
}
const takeSlot = () => (builds < MAX_BUILDS && performance.now() - lastScroll > 200 ? (builds++, true) : false);
const freeSlot = () => {
  builds = Math.max(0, builds - 1);
  waiting.forEach((wake) => wake());
};

/** A product card's picture: the product's 3D models (tub or jar, pouch, sachet) one after another every two seconds. Each pack is drawn in 3D once, in the
 * background, one at a time; the card then fades between the finished pictures, which costs nothing to show and cannot stutter. */
export function Card3D({ product, flavour, details, banner, index = 99 }: { product: Product; flavour: string; details: Details; banner?: GalleryBanner | null; index?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const packs = packsOf(product);
  const [live, setLive] = useState(false);
  const [, bump] = useState(0);
  const [heldPack, setHeldPack] = useState<Pack | null>(null);
  const clock = useTick();
  const { done } = useLoading3d();
  const shownRef = useRef<Pack | null>(null);
  const [gaveUp, setGaveUp] = useState<Pack[]>([]);
  const [wake, setWake] = useState(0);
  const [warm, setWarm] = useState(warmed);
  // every pack wears a ready label: the one picked on the page (jar only), else the first of its kind; never a built-in drawing
  const firstJar = useFirstJarLabel(product);
  const bannerOf = (pack: Pack): GalleryBanner | null | undefined => (pack === 'jar' ? (banner ?? firstJar) : (defaultBagLabel(product, pack) ?? banner));
  useEffect(() => {
    if (!warm) void warming.then(() => setWarm(true));
  }, [warm]);
  const holding = useRef<Pack | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver((en) => setLive(en[0]?.isIntersecting ?? false), { rootMargin: '1500px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // the models are fetched as soon as the first card is on screen
    if (live) void import('./JarScene').then((m) => m.preloadModels());
  }, [live]);

  // pictures already taken (the visitor came back to this page) count towards the loading screen at once
  useEffect(() => {
    if (!warm) return;
    if (packs.some((p) => shots.has(shotKey(product, flavour, bannerOf(p), details, p)))) notePicture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warm, firstJar]);

  const active = warm && firstJar !== undefined && (live || (!done && index < 9)); // the top cards draw behind the loading screen; the others as they come within a screen or so of the view
  const key = (pack: Pack) => shotKey(product, flavour, bannerOf(pack), details, pack);
  const ready = packs.filter((p) => shots.has(key(p)));
  const next = active ? packs.find((p) => !shots.has(key(p)) && !gaveUp.includes(p)) : undefined;

  // a card waits for one of the drawing places; it keeps it until its picture is taken (or 40 s have passed)
  useEffect(() => {
    const poke = () => setWake((n) => n + 1);
    waiting.add(poke);
    return () => {
      waiting.delete(poke);
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
  }, [next, wake]);
  const building = holding.current === next ? next : undefined;
  useEffect(() => {
    if (!building) return;
    const t = window.setTimeout(() => setGaveUp((g) => [...g, building]), 40000);
    return () => window.clearTimeout(t);
  }, [building]);

  // every card changes pack at the same moment (the shared clock); a pack that is not drawn yet is skipped
  const wanted = packs[clock % packs.length];
  if (!heldPack && ready.includes(wanted)) shownRef.current = wanted;
  if (heldPack && ready.includes(heldPack)) shownRef.current = heldPack;
  const shown = shownRef.current && ready.includes(shownRef.current) ? shownRef.current : (ready[0] ?? null);
  const order = shown ? ready.indexOf(shown) : 0;

  return (
    <div className="card3d" ref={host}>
      {shown ? (
        ready.map((id) => <img key={id} className={`card3d-shot${id === shown ? ' on' : ready.indexOf(id) < order ? ' before' : ' after'}`} src={shots.get(key(id))} decoding="async" alt={id === shown ? product.name : ''} draggable={false} />)
      ) : (
        <ProductJar className="jar-card" product={product} flavour={flavour} banner={banner?.thumb} />
      )}
      {building && (
        <div className="card3d-build" aria-hidden>
          <LabelView
            key={building}
            className="card3d-view"
            mode="3d"
            px={1200}
            spec={{ product, flavour, design: ownDesign(product.id), details, logo: undefined }}
            banner={bannerOf(building) ?? undefined}
            pack={building}
            autoTurn={false}
            onSnapshot={(url) => {
              const first = !packs.some((p) => shots.has(key(p)));
              shots.set(key(building), url);
              saveShot(key(building), url);
              bump((n) => n + 1);
              if (first) notePicture();
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
              onClick={() => setHeldPack(id)}
            >
              {NAMES[id](product)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
