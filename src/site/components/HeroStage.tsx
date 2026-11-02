import { useEffect, useState } from 'react';
import { productById } from '../data/catalog';
import { listGalleryBanners, type GalleryBanner } from '../lib/api';
import { designCount, type Details } from '../lib/labelArt';
import { ProductJar, ownDesign } from './ProductJar';
import { LabelView, type LogoShift } from './LabelView';
import { DesignPicks, LogoBox, LogoPlacement, PackToggle, type Pack } from './LabelParts';

// The box starts with these products; the jar shows one of them, a different one each time the page opens
const LIST = ['wp57', 'plant', 'yeast', 'cre', 'bcaa', 'pre'];
const TILE_NAME: Record<string, string> = { wp57: 'Whey Protein' };
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** Five designs to choose from: the product's own, then four others picked at random. */
const designsFor = (productId: string) => {
  const first = ownDesign(productId);
  const others = Array.from({ length: designCount }, (_, i) => i).filter((i) => i !== first).sort(() => Math.random() - 0.5);
  return [first, ...others.slice(0, 4)];
};

export interface TryStart {
  productId: string;
  design: number;
}

interface Props {
  details: Details;
  logo: string;
  onLogo: (logo: string) => void;
  /** Where the customer moved their logo from the label's empty logo place. */
  shift: LogoShift;
  onShift: (shift: LogoShift) => void;
  onTry: (start: TryStart) => void;
  /** Open this gallery banner in the editor for the product. */
  onEdit: (productId: string, templateSlug: string) => void;
  /** The banner the customer picked (null when none is picked): the range below shows it on every product. */
  onBanner?: (banner: GalleryBanner | null) => void;
}

/** The top of the page: a 3D jar that flips round wearing one of five labels, with the logo upload and the way into "Try it". */
export function HeroStage({ details, logo, onLogo, shift, onShift, onTry, onEdit, onBanner }: Props) {
  const [shown] = useState(() => pick(LIST));
  const [chosen, setChosen] = useState<string | null>(null);
  const [designs, setDesigns] = useState(() => designsFor(shown));
  const [design, setDesign] = useState(designs[0]);
  const [banners, setBanners] = useState<GalleryBanner[] | null>(null);
  const [banner, setBanner] = useState<GalleryBanner | null>(null);
  const [pack, setPack] = useState<Pack>('jar');
  const product = productById(chosen ?? shown)!;

  // the real banners our team saved in the template gallery for this product
  useEffect(() => {
    let live = true;
    setBanners(null);
    setBanner(null);
    listGalleryBanners(product.templateCategory)
      .then((list) => {
        if (!live) return;
        const five = list; // every label, the picker shows six and scrolls
        setBanners(five);
        // the jar wears a real banner: the first one once a product is picked, a random one before that
        setBanner(chosen ? (five[0] ?? null) : (pick(five) ?? null));
      })
      .catch(() => live && setBanners([]));
    return () => {
      live = false;
    };
  }, [product.templateCategory, chosen]);
  useEffect(() => {
    onBanner?.(chosen ? banner : null);
  }, [chosen, banner]); // eslint-disable-line react-hooks/exhaustive-deps
  const flavour = product.flavours[0];
  const spec = { product, flavour, design, details, logo: logo || undefined };

  const choose = (id: string) => {
    const next = designsFor(id);
    setChosen(id);
    setDesigns(next);
    setDesign(next[0]);
  };

  return (
    <div className="hero-right">
      <div className="stage">
        <div className="blob" aria-hidden />
        <LabelView spec={spec} mode="3d" className="stage-jar" banner={banner} pack={pack} logo={logo || undefined} logoShift={shift} autoTurn={false} />
        <PackToggle className="stage-packs" product={product} pack={pack} onPack={setPack} />
      </div>
      <div className="lbox">
        {chosen === null ? (
          <>
            <div className="lbox-head">
              <b>Pick a product</b>
              <span>See its label on the jar.</span>
            </div>
            <div className="ptiles">
              {LIST.map((id) => {
                const p = productById(id)!;
                return (
                  <button key={id} type="button" className="ptile" onClick={() => choose(id)}>
                    <ProductJar className="ptile-jar" product={p} brand={details.brand} />
                    <span>{TILE_NAME[id] ?? p.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="lbox-head">
              <button type="button" className="lbox-back" onClick={() => setChosen(null)}>‹ Back</button>
              <b>{TILE_NAME[product.id] ?? product.name}</b>
              <span>Pick a banner. Drag the jar to turn it.</span>
            </div>
            {banners === null ? (
              <span className="lbox-note">Loading our banners…</span>
            ) : banners.length > 0 ? (
              <>
                <div className="dpicks" role="group" aria-label="Banner">
                  {banners.map((b) => (
                    <button key={b.slug} type="button" className="dpick" aria-pressed={banner?.slug === b.slug} onClick={() => setBanner(b)} title={b.title}>
                      <img className="dpick-img" src={b.thumb} alt={b.title} loading="lazy" />
                    </button>
                  ))}
                </div>
                <LogoPlacement logo={logo} onLogo={onLogo} shift={shift} onShift={onShift} />
                <div className="lbox-actions">
                  <button type="button" className="btn btn-lime btn-sm" disabled={!banner} onClick={() => banner && onEdit(product.id, banner.slug)}>Make with my logo</button>
                </div>
              </>
            ) : (
              <>
                <DesignPicks product={product} flavour={flavour} designs={designs} current={design} onPick={setDesign} details={details} logo={logo || undefined} />
                <LogoBox product={product} design={design} logo={logo} onLogo={onLogo} />
                <button type="button" className="btn btn-dark btn-sm lbox-try" onClick={() => onTry({ productId: product.id, design })}>
                  Try it on your product
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
