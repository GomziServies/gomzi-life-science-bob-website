import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CATALOG, GROUPS, type GroupId, type Product } from '../data/catalog';
import { FAQ, MADE_TO_ORDER, PACK_SIZES } from '../data/content';
import { packText, type Pack } from '../components/LabelParts';
import { editsSaved, labelEditPath } from '../lib/labelLinks';
import { isTeamBanner, teamBanner, useOrder } from '../state/order';
import { WHATSAPP } from '../lib/config';
import { defaultQty } from '../lib/rules';
import { tintOf } from '../components/ProductJar';
import { Card3D } from '../components/Card3D';
import { Loading3d } from '../components/Loading3d';
import { beginPage } from '../lib/preload3d';
import { useReveal } from '../lib/reveal';
import { ProductDetail } from '../components/ProductDetail';
import { Seo } from '../components/Seo';
import { BROCHURE_FILE_NAME, BROCHURE_PDF } from '../data/brochure';
import type { LogoShift } from '../components/LabelView';
import { Seals } from '../components/Seals';
import { Clients } from '../components/Clients';
import { Reviews } from '../components/Reviews';
import { Learn } from '../components/Learn';
import { Categories } from '../components/Categories';
import { collectionById } from '../data/collections';
import { HeroStage } from '../components/HeroStage';
import { loadLogo, loadLogoShift, storeLogo, storeLogoShift } from '../lib/logo';
import type { GalleryBanner } from '../lib/api';

const STEPS = [
  ['Add products', 'Pick products, flavours and quantity.'],
  ['Share your details', 'Name, brand, phone and address, confirmed with an OTP.'],
  ['Pick your labels', 'Open a template for each product, or let AI make one, and add your logo.'],
  ['Review everything', 'See every product with its label before you send.'],
  ['Send your inquiry', 'Our expert team reviews your products and labels and calls you to confirm.'],
];

type Tab = GroupId | 'all' | 'mto';
const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/** The home page (the story and the range as tiles) and the Products page (every product, by section) are one component, so the cart and the product pop-ups work the same on both. */
export function HomePage({ view = 'home' }: { view?: 'home' | 'products' | 'product' }) {
  useReveal();
  const [params, setParams] = useSearchParams();
  const collection = view === 'products' ? collectionById(params.get('c')) : undefined;
  const [tab, setTab] = useState<Tab>(collection?.mto ? 'mto' : 'all');
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [packs, setPacks] = useState<Record<string, number>>({});
  // the pack (jar, pouch, sachet) picked on each product card: "Edit label" opens that pack's label
  const [cardPack, setCardPack] = useState<Record<string, Pack>>({});
  const { productId } = useParams();
  // on a product's own page, the product being shown
  const detail = view === 'product' ? CATALOG.find((p) => p.id === productId && !p.hidden) : undefined;
  const [logo, setLogoState] = useState(loadLogo);
  const [shift, setShiftState] = useState<LogoShift>(loadLogoShift);
  const setShift = (s: LogoShift) => {
    setShiftState(s);
    storeLogoShift(s);
  };
  const [applied, setApplied] = useState<GalleryBanner | null>(null);
  const setLogo = (l: string) => {
    setLogoState(l);
    storeLogo(l);
  };

  // every 3D model starts loading as the page opens; the page is shown when they are in (and, on the Products page, its first pictures are drawn)
  // runs before the first paint: the loading screen is already up when the page appears, so the flat pictures are never seen first
  useLayoutEffect(() => {
    beginPage(view === 'products' ? CATALOG.filter((p) => !p.hidden).length : view === 'product' && detail ? 1 : 0);
  }, [view, detail?.id]);

  // a tile on the home page can open the made-to-order tab
  useEffect(() => {
    if (view === 'products') setTab(collectionById(params.get('c'))?.mto ? 'mto' : 'all');
  }, [view, params]);

  const { cart, banners, customer, addToCart, removeFromCart, setFlavour, setPack, setBanner, clearBanner } = useOrder();
  const nav = useNavigate();
  // a gallery banner picked in the hero: add the product to the order and open that banner in the editor (the OTP step comes when they save)
  const editBanner = (productId: string, templateSlug: string) => {
    const p = CATALOG.find((x) => x.id === productId)!;
    if (!cart.some((l) => l.productId === productId)) addToCart({ productId, flavour: p.flavours[0], quantity: defaultQty(p, cart), packKg: 1 });
    // with a logo uploaded, the editor opens with that logo already set into the label's logo place
    nav(`/customize/${productId}?template=${encodeURIComponent(templateSlug)}${logo ? '&logo=1' : ''}`);
  };
  // "Make your own": the product joins the order and the editor opens on our template gallery for it
  const openEditor = (productId: string) => {
    const p = CATALOG.find((x) => x.id === productId)!;
    if (!cart.some((l) => l.productId === productId)) addToCart({ productId, flavour: p.flavours[0], quantity: defaultQty(p, cart), packKg: 1 });
    nav(`/customize/${productId}`);
  };
  const labelDetails = { brand: customer.brandName, phone: customer.phone, email: customer.email, address: customer.address, city: customer.city, pincode: customer.pincode };
  const lineOf = (id: string) => cart.find((l) => l.productId === id);
  // a customer who likes none of the labels leaves it to the design team: the product goes into the inquiry marked "Made by Graphics team"
  const teamOf = (id: string) => isTeamBanner(banners[id]);
  const toggleTeam = (product: Product, flavour: string) => {
    if (teamOf(product.id)) {
      clearBanner(product.id);
      return;
    }
    if (!lineOf(product.id)) addToCart({ productId: product.id, flavour, quantity: defaultQty(product, cart), packKg: packs[product.id] ?? 1 });
    setBanner(product.id, teamBanner());
  };
  const cards = (g: GroupId | 'all') => CATALOG.filter((p) => (g === 'all' || p.group === g) && !p.hidden && (!collection || collection.mto || collection.ids.includes(p.id)));
  const tabs: [Tab, string, number][] = [
    ['all', 'All', cards('all').length],
    ...(Object.keys(GROUPS) as GroupId[]).map((g): [Tab, string, number] => [g, GROUPS[g].title, cards(g).length]),
    ['mto', 'Made to order', MADE_TO_ORDER.length],
  ];

  const pickFlavour = (p: Product, flavour: string) => {
    setPicked((s) => ({ ...s, [p.id]: flavour }));
    if (lineOf(p.id)) setFlavour(p.id, flavour);
  };

  return (
    <>
      <Loading3d />
      {view === 'home' ? (
        <>
      <section className="hero">
        <Capsule className="hd hd-b" /><Leaf className="hd hd-c" />
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Gomzi Life Science LLP · Surat</span>
            <h1>Launch your own supplement brand in just <span className="mark">5 days.</span></h1>
            <div className="hl-box">
              <span className="hl-ic" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </span>
              <div>
                <b>Design your own logo and label yourself.</b>
                <span>Free, in our design studio, in a few minutes.</span>
              </div>
              <button type="button" onClick={() => openEditor('wp57')}>
                Try it <span aria-hidden="true" className="hl-arr">→</span>
              </button>
            </div>
            <p className="hero-sub">Choose from ready formulations and we manufacture, fill and label your jars at our facility in Surat.</p>
            <div className="actions">
              <Link className="btn btn-lime" to="/products">Explore products</Link>
              <a className="btn btn-ghost" href={wa('Hi Gomzi, I want to talk to an expert about launching my own supplement brand.')}>Talk to an expert</a>
            </div>
            <Seals />
            <p className="hero-fine">5-day dispatch applies to ready formulations in stock once your label is approved and the order is confirmed. Custom formulations are scheduled once you approve the sample.</p>
          </div>
          <HeroStage details={labelDetails} logo={logo} onLogo={setLogo} onEdit={editBanner} onBanner={setApplied} shift={shift} onShift={setShift} teamOf={teamOf} onTeam={(id) => toggleTeam(CATALOG.find((x) => x.id === id)!, picked[id] ?? CATALOG.find((x) => x.id === id)!.flavours[0])} />
        </div>
        <div className="wrap facts">
          <div className="fact"><span className="fact-ic">{FACT_ICONS.box}</span><b>50 kg</b>minimum order for protein</div>
          <div className="fact"><span className="fact-ic">{FACT_ICONS.truck}</span><b>5 days</b>from confirmation to dispatch</div>
          <div className="fact"><span className="fact-ic">{FACT_ICONS.shield}</span><b>18 months</b>shelf life on every batch</div>
          <div className="fact"><span className="fact-ic">{FACT_ICONS.grid}</span><b>{CATALOG.filter((p) => !p.hidden).length} products</b>ready to put your name on</div>
        </div>
      </section>

      <Clients />

      <Categories />

      <section className="section soft" id="how">
        <div className="wrap">
          <span className="eyebrow">How it works</span>
          <h2>From cart to your own branded jars</h2>
          <p className="lede">All on this website, from choosing your products to placing the order.</p>
          <ol className="steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="step-ic">{STEP_ICONS[i]}</span>
                <span className="step-n">Step {i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section soft faq" id="faq">
        <div className="wrap narrow">
          <span className="eyebrow">FAQ</span>
          <h2>Questions people ask</h2>
          {FAQ.slice(0, 3).map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
          <p className="faq-more"><Link to="/faq">See all questions »</Link></p>
        </div>
      </section>

      <Reviews />

      <Learn />
        </>
      ) : view === 'products' ? (
        <>
      <section className="section range-page" id="range">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span>Products</span>{collection && (<><span aria-hidden="true">›</span><span>{collection.title}</span></>)}</nav>
          <h1 className="page-title">{collection ? collection.title : 'All products'}</h1>
          <p className="lede">{collection ? collection.note + '. ' : ''}In stock and ready to carry your label this week. Pick a category and add products to your inquiry.</p>
          {collection && !collection.mto && (
            <p className="coll-chip">Showing {collection.title}. <button type="button" className="linkbtn plain" onClick={() => setParams({}, { replace: true })}>Show all products</button></p>
          )}
          <div className="tabs" role="tablist" aria-label="Product categories" hidden={!!collection}>
            {tabs.map(([id, title, n]) => (
              <button key={id} role="tab" className="tab" aria-selected={tab === id} aria-pressed={tab === id} onClick={() => setTab(id)}>
                {title} <span className="tabn">{n}</span>
              </button>
            ))}
          </div>

          {tab === 'mto' ? (
            <div className="mto-panel">
              <p className="muted">Custom formulations, planned after a short call with our formulation team.</p>
              <div className="mto">
                {MADE_TO_ORDER.map((m) => <span key={m}>{m}</span>)}
              </div>
              <p><a className="btn btn-dark btn-sm" href={wa('Hi Gomzi, I want to know more about a made-to-order product.')} target="_blank" rel="noopener noreferrer">Talk to our team</a></p>
            </div>
          ) : (
            <>
              {applied && (
                <div className="applied">
                  <img src={applied.thumb} alt="" />
                  <span>Your banner <b>{applied.title}</b> is shown on every product.</span>
                  <button type="button" className="linkbtn" onClick={() => setApplied(null)}>Show original labels</button>
                </div>
              )}
              {tab !== 'all' && <p className="muted">{GROUPS[tab].note}</p>}
              <div className="grid">
                {cards(tab).map((p, i) => {
                  const line = lineOf(p.id);
                  const flavour = line?.flavour ?? picked[p.id] ?? p.flavours[0];
                  return (
                    <article className={`pcard${line ? ' picked' : ''}`} key={p.id} style={{ ['--tint' as string]: tintOf(p.id), borderColor: line ? undefined : CARD_BORDER }}>
                      <div className="pcard-art" style={{ ['--tint' as string]: tintOf(p.id), background: CARD_BG, borderBottom: `1.5px solid ${CARD_BORDER}` }}>
                        <Card3D product={p} flavour={flavour} details={labelDetails} banner={applied} index={i} onPick={(pack) => setCardPack((s) => ({ ...s, [p.id]: pack }))} />
                        {line && <span className="picked-badge">Added</span>}
                        {p.comingSoon && <span className="soon-badge">Coming soon</span>}
                        <button type="button" className="eye" aria-label={`View ${p.name} details and all flavours`} title="View details" onClick={() => nav(`/products/${p.id}`)}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                      </div>
                      <div className="pcard-body">
                        <span className="tag" style={{ color: tintOf(p.id) }}>{p.tag}</span>
                        <h3><Link className="pcard-link" to={`/products/${p.id}`}>{p.name}</Link></h3>
                        {p.sub && <span className="muted">{p.sub}</span>}
                        <span className="sizes">{p.unit === 'kg' ? PACK_SIZES.map((x) => x.label).join(' · ') : (p.weight ?? '').toLowerCase()}</span>
                        {p.group !== 'well' && <span className="packs">{packText(p)}</span>}
                        {p.labelSize && <span className="label-size">Label size: {p.labelSize}</span>}
                        <div className={`pcard-foot${p.comingSoon ? '' : ' pcard-foot-two'}`}>
                          {p.comingSoon ? (
                            <button className="btn btn-ghost btn-sm" disabled>Coming soon</button>
                          ) : (
                            <>
                              {line ? (
                                <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(p.id)}>Remove</button>
                              ) : (
                                <button className="btn btn-outline btn-sm" onClick={() => addToCart({ productId: p.id, flavour, quantity: defaultQty(p, cart), packKg: 1 })}>
                                  Add to Cart (Inquiry)
                                </button>
                              )}
                              {/* the label studio puts the product into the inquiry if it is not there yet */}
                              <Link className="btn btn-lime btn-sm" to={labelEditPath(p.id, cardPack[p.id], undefined, editsSaved(banners[p.id], cardPack[p.id]))}>
                                Edit label
                              </Link>
                            </>
                          )}
                        </div>
                        {line && <span className="incart">✓ Added to cart</span>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          <div className="note-box">
            <span aria-hidden>ⓘ</span>
            <span>Every product comes with a fixed formula and nutrition table. Want a different formula? Talk to our team and they will call you.</span>
          </div>
        </div>
      </section>

        </>
      ) : detail ? (
        <ProductDetail
          product={detail}
          flavour={lineOf(detail.id)?.flavour ?? picked[detail.id] ?? detail.flavours[0]}
          inCart={!!lineOf(detail.id)}
          pack={lineOf(detail.id)?.packKg ?? packs[detail.id] ?? 1}
          onPack={(kg) => {
            setPacks((s) => ({ ...s, [detail.id]: kg }));
            if (lineOf(detail.id)) setPack(detail.id, kg);
          }}
          onFlavour={(f) => pickFlavour(detail, f)}
          onAdd={() => addToCart({ productId: detail.id, flavour: picked[detail.id] ?? detail.flavours[0], quantity: defaultQty(detail, cart), packKg: packs[detail.id] ?? 1 })}
          onRemove={() => removeFromCart(detail.id)}
          details={labelDetails}
          logo={logo}
          onLogo={setLogo}
          shift={shift}
          onShift={setShift}
          onEdit={(slug) => editBanner(detail.id, slug)}
          team={teamOf(detail.id)}
          onTeam={() => toggleTeam(detail, picked[detail.id] ?? detail.flavours[0])}
        />
      ) : (
        <section className="section">
          <Seo noindex title="Product not found | Gomzi Life Science LLP" description="This product could not be found." />
          <div className="wrap narrow">
            <h1 className="page-title">We couldn’t find that product</h1>
            <p className="lede">It may have moved. Browse the whole range and pick from there.</p>
            <Link className="btn btn-lime" to="/products">See all products</Link>
          </div>
        </section>
      )}

      <section className="cta">
        <div className="wrap">
          <div className="cta-card">
            <span className="eyebrow">{view === 'home' ? 'Ready when you are' : view === 'products' ? 'Not sure where to start?' : 'Like this product?'}</span>
            <h2>{view === 'home' ? 'Let’s start your brand today.' : view === 'products' ? 'Can’t find what you need?' : 'Make it your own.'}</h2>
            <p>{view === 'home' ? 'You’re one step away from owning a supplement company.' : view === 'products' ? 'Tell us what you have in mind and our team will suggest the right products and flavours.' : 'Add it to your inquiry, pick a label and see it on the pack in 3D.'}</p>
            <div className="actions">
              <Link className="btn btn-lime" to="/products">Explore products</Link>
              <a className="btn btn-outline-light" href={BROCHURE_PDF} download={BROCHURE_FILE_NAME}>Download brochure (PDF)</a>
              <a className="btn btn-outline-light" href={wa('Hi Gomzi, I want to start my own supplement brand.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

/* soft decorative shapes behind the hero, like scattered confetti */
const Capsule = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 64 28" aria-hidden="true"><rect x="1" y="1" width="62" height="26" rx="13" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M32 1h18a13 13 0 0 1 0 26H32Z" fill="currentColor" opacity=".35" /></svg>
);
const Leaf = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><path d="M8 40C6 20 20 6 42 6c0 22-12 36-30 36l-4-2Zm0 0C16 30 24 22 34 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
);

/** One background for every card, so any jar or label colour sits on the same soft lime with a light spotlight behind it. */
const CARD_BG = 'radial-gradient(70% 60% at 50% 46%, #fcfef5 0%, #f0f7d9 62%, #e5f0bf 100%)';
const CARD_BORDER = '#d2e29c';

/** One outline icon per step: products, details, labels, review, send. */
const ic = (d: string[]) => (
  <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((x) => <path key={x} d={x} />)}
  </svg>
);
const STEP_ICONS = [
  ic(['M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z', 'M3.5 7.5 12 12l8.5-4.5', 'M12 12v9']),
  ic(['M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14A1.5 1.5 0 0 1 16 20.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5Z', 'M9.5 8.5h5', 'M9.5 12h5', 'M9.5 15.5h3']),
  ic(['M4 5.5h16v13H4z', 'M4 14.5l4.5-4 4 3.5 3-2.5L20 15', 'M15.5 8.6h.01']),
  ic(['M12 4.5C6.5 4.5 3 12 3 12s3.5 7.5 9 7.5 9-7.5 9-7.5-3.5-7.5-9-7.5Z', 'M12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z']),
  ic(['M21 3 10.5 13.5', 'M21 3l-6.5 18-4-7.5L3 9.5 21 3Z']),
];

/** Small outline icons for the four facts under the hero. */
const fi = (d: string[]) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((x) => <path key={x} d={x} />)}
  </svg>
);
const FACT_ICONS = {
  box: fi(['M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z', 'M3.5 7.5 12 12l8.5-4.5', 'M12 12v9']),
  truck: fi(['M3 6.5h11v9H3z', 'M14 9.5h4l3 3v3h-7', 'M7 18.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z', 'M17 18.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z']),
  shield: fi(['M12 3 4.5 6v5.5c0 4.4 3.1 8.3 7.5 9.5 4.4-1.2 7.5-5.1 7.5-9.5V6L12 3Z', 'm8.8 12 2.2 2.2 4.2-4.4']),
  grid: fi(['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z']),
};
