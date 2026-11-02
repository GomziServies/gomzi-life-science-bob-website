import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATALOG, GROUPS, type GroupId, type Product } from '../data/catalog';
import { FAQ, MADE_TO_ORDER, PACK_SIZES } from '../data/content';
import { packText } from '../components/LabelParts';
import { isTeamBanner, teamBanner, useOrder } from '../state/order';
import { WHATSAPP } from '../lib/config';
import { defaultQty } from '../lib/rules';
import { tintOf } from '../components/ProductJar';
import { Card3D } from '../components/Card3D';
import { Loading3d } from '../components/Loading3d';
import { startPreload } from '../lib/preload3d';
import { ProductModal } from '../components/ProductModal';
import type { LogoShift } from '../components/LabelView';
import { Seals } from '../components/Seals';
import { HeroStage, type TryStart } from '../components/HeroStage';
import { TryLabel } from '../components/TryLabel';
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

export function HomePage() {
  const [tab, setTab] = useState<Tab>('all');
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [packs, setPacks] = useState<Record<string, number>>({});
  const [detail, setDetail] = useState<Product | null>(null);
  const [pastHero, setPastHero] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [logo, setLogoState] = useState(loadLogo);
  const [shift, setShiftState] = useState<LogoShift>(loadLogoShift);
  const setShift = (s: LogoShift) => {
    setShiftState(s);
    storeLogoShift(s);
  };
  const [applied, setApplied] = useState<GalleryBanner | null>(null);
  const [tryStart, setTryStart] = useState<TryStart | null>(null);
  const setLogo = (l: string) => {
    setLogoState(l);
    storeLogo(l);
  };

  // every 3D model starts loading as the page opens; the page is shown when they are all in
  useEffect(() => {
    startPreload(CATALOG.filter((p) => !p.hidden).length);
  }, []);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > 560);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const targets = [document.querySelector('.cta'), document.querySelector('footer')].filter(Boolean) as Element[];
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
      setAtEnd(visible.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  const { cart, banners, customer, addToCart, removeFromCart, setFlavour, setPack, setBanner, clearBanner } = useOrder();
  const nav = useNavigate();
  // a gallery banner picked in the hero: add the product to the order and open that banner in the editor (the OTP step comes when they save)
  const editBanner = (productId: string, templateSlug: string) => {
    const p = CATALOG.find((x) => x.id === productId)!;
    if (!cart.some((l) => l.productId === productId)) addToCart({ productId, flavour: p.flavours[0], quantity: defaultQty(p, cart), packKg: 1 });
    // with a logo uploaded, the editor opens with that logo already set into the label's logo place
    nav(`/shop/customize/${productId}?template=${encodeURIComponent(templateSlug)}${logo ? '&logo=1' : ''}`);
  };
  // "Make your own": the product joins the order and the editor opens on our template gallery for it
  const openEditor = (productId: string) => {
    const p = CATALOG.find((x) => x.id === productId)!;
    if (!cart.some((l) => l.productId === productId)) addToCart({ productId, flavour: p.flavours[0], quantity: defaultQty(p, cart), packKg: 1 });
    nav(`/shop/customize/${productId}`);
  };
  const labelDetails = { brand: customer.brandName, phone: customer.phone, email: customer.email, address: customer.address, city: customer.city, pincode: customer.pincode };
  const lineOf = (id: string) => cart.find((l) => l.productId === id);
  // a customer who likes none of the labels leaves it to the design team: the product goes into the inquiry marked "Made by Parpics team"
  const teamOf = (id: string) => isTeamBanner(banners[id]);
  const toggleTeam = (product: Product, flavour: string) => {
    if (teamOf(product.id)) {
      clearBanner(product.id);
      return;
    }
    if (!lineOf(product.id)) addToCart({ productId: product.id, flavour, quantity: defaultQty(product, cart), packKg: packs[product.id] ?? 1 });
    setBanner(product.id, teamBanner());
  };
  const cards = (g: GroupId | 'all') => CATALOG.filter((p) => (g === 'all' || p.group === g) && !p.hidden);
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
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Gomzi Life Science LLP · Surat</span>
            <h1>Launch your own supplement brand in just <span className="mark">5 days.</span></h1>
            <div className="hl-box">
              <span className="hl-ic" aria-hidden>✎</span>
              <div>
                <b>Design your own logo and label yourself.</b>
                <span>Free, in our design studio, in a few minutes.</span>
              </div>
              <button type="button" onClick={() => openEditor('wp57')}>Try it</button>
            </div>
            <p className="hero-sub">Choose from ready formulations and we manufacture, fill and label your jars at our facility in Surat.</p>
            <div className="actions">
              <a className="btn btn-lime" href="#range">Explore products</a>
              <a className="btn btn-ghost" href={wa('Hi Gomzi, I want to talk to an expert about launching my own supplement brand.')}>Talk to an expert</a>
            </div>
            <Seals />
            <p className="hero-fine">5-day dispatch applies to ready formulations in stock once your label is approved and the order is confirmed. Custom formulations are scheduled once you approve the sample.</p>
          </div>
          <HeroStage details={labelDetails} logo={logo} onLogo={setLogo} onTry={(t) => openEditor(t.productId)} onEdit={editBanner} onBanner={setApplied} shift={shift} onShift={setShift} teamOf={teamOf} onTeam={(id) => toggleTeam(CATALOG.find((x) => x.id === id)!, picked[id] ?? CATALOG.find((x) => x.id === id)!.flavours[0])} />
        </div>
        <div className="wrap facts">
          <div className="fact"><b>50 kg</b>minimum order for protein</div>
          <div className="fact"><b>5 days</b>from confirmation to dispatch</div>
          <div className="fact"><b>18 months</b>shelf life on every batch</div>
          <div className="fact"><b>{CATALOG.filter((p) => !p.hidden).length} products</b>ready to put your name on</div>
        </div>
      </section>

      <section className="section" id="range">
        <div className="wrap">
          <span className="eyebrow">Product range</span>
          <h2>Ready to brand today</h2>
          <p className="lede">In stock and ready to carry your label this week. Pick a category and add products to your inquiry.</p>
          <div className="tabs" role="tablist" aria-label="Product categories">
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
                    <article className={`pcard${line ? ' picked' : ''}`} key={p.id}>
                      <div className="pcard-art" style={{ ['--tint' as string]: tintOf(p.id) }}>
                        <Card3D product={p} flavour={flavour} details={labelDetails} banner={applied} index={i} />
                        {line && <span className="picked-badge">Added</span>}
                        {p.comingSoon && <span className="soon-badge">Coming soon</span>}
                        <button type="button" className="eye" aria-label={`View ${p.name} details and all flavours`} title="View details" onClick={() => setDetail(p)}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                      </div>
                      <div className="pcard-body">
                        <span className="tag" style={{ color: tintOf(p.id) }}>{p.tag}</span>
                        <h3>{p.name}</h3>
                        {p.sub && <span className="muted">{p.sub}</span>}
                        <span className="sizes">{p.unit === 'kg' ? PACK_SIZES.map((x) => x.label).join(' · ') : (p.weight ?? '').toLowerCase()}</span>
                        {p.group !== 'well' && <span className="packs">{packText(p)}</span>}
                        {p.labelSize && <span className="label-size">Label size: {p.labelSize}</span>}
                        <div className="pcard-foot">
                          {p.comingSoon ? (
                            <button className="btn btn-ghost btn-sm" disabled>Coming soon</button>
                          ) : line ? (
                            <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(p.id)}>Remove</button>
                          ) : (
                            <button className="btn btn-lime btn-sm" onClick={() => addToCart({ productId: p.id, flavour, quantity: defaultQty(p, cart), packKg: 1 })}>
                              Add to inquiry
                            </button>
                          )}
                        </div>
                        {line && <span className="incart">✓ Added to your inquiry</span>}
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

      <section className="section soft" id="how">
        <div className="wrap">
          <span className="eyebrow">How it works</span>
          <h2>From cart to your own branded jars</h2>
          <p className="lede">All on this website, from choosing your products to placing the order.</p>
          <ol className="steps">
            {STEPS.map(([t, d]) => (
              <li key={t}>
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
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <div className="cta-card">
            <span className="eyebrow">Ready when you are</span>
            <h2>Let’s start your brand today.</h2>
            <p>You’re one step away from owning a supplement company.</p>
            <div className="actions">
              <a className="btn btn-lime" href="#range">Explore products</a>
              <Link className="btn btn-outline-light" to="/shop/brochure?print=1">Download brochure (PDF)</Link>
              <a className="btn btn-outline-light" href={wa('Hi Gomzi, I want to start my own supplement brand.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {cart.length > 0 && pastHero && !atEnd && (
        <div className="orderbar">
          <span>
            <b>{cart.length} product{cart.length > 1 ? 's' : ''} selected</b>
            <small>Next: your details, then your labels</small>
          </span>
          <Link className="btn btn-lime btn-sm" to="/shop/details">Continue</Link>
        </div>
      )}

      {detail && (
        <ProductModal
          product={detail}
          flavour={lineOf(detail.id)?.flavour ?? picked[detail.id] ?? detail.flavours[0]}
          inCart={!!lineOf(detail.id)}
          banner={applied?.thumb}
          pack={lineOf(detail.id)?.packKg ?? packs[detail.id] ?? 1}
          onPack={(kg) => {
            setPacks((s) => ({ ...s, [detail.id]: kg }));
            if (lineOf(detail.id)) setPack(detail.id, kg);
          }}
          onFlavour={(f) => pickFlavour(detail, f)}
          onAdd={() => addToCart({ productId: detail.id, flavour: picked[detail.id] ?? detail.flavours[0], quantity: defaultQty(detail, cart), packKg: packs[detail.id] ?? 1 })}
          onRemove={() => removeFromCart(detail.id)}
          onClose={() => setDetail(null)}
          details={labelDetails}
          logo={logo}
          onLogo={setLogo}
          shift={shift}
          onShift={setShift}
          onEdit={(slug) => editBanner(detail.id, slug)}
          team={teamOf(detail.id)}
          onTeam={() => toggleTeam(detail, picked[detail.id] ?? detail.flavours[0])}
        />
      )}
      {tryStart && <TryLabel start={tryStart} logo={logo} onLogo={setLogo} onClose={() => setTryStart(null)} />}
    </>
  );
}
