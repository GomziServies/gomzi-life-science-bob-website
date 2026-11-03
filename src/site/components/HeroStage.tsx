import { useEffect, useState } from 'react';
import { productById } from '../data/catalog';
import type { GalleryBanner } from '../lib/api';
import type { Details } from '../lib/labelArt';
import { ProductJar } from './ProductJar';
import { LabelView, type LogoShift } from './LabelView';
import { LogoPlacement, PackToggle, TeamChoice, labelsFor, labelOnPack, type Pack } from './LabelParts';

// the products in the box; the page opens on the whey protein, wearing one of the ready labels
const LIST = ['wp57', 'plant', 'yeast', 'cre', 'bcaa', 'pre'];
const TILE_NAME: Record<string, string> = { wp57: 'Whey Protein' };

interface Props {
  details: Details;
  logo: string;
  onLogo: (logo: string) => void;
  /** Where the customer moved their logo from the label's empty logo place. */
  shift: LogoShift;
  onShift: (shift: LogoShift) => void;
  /** Open this gallery banner in the editor for the product. */
  onEdit: (productId: string, templateSlug: string) => void;
  /** The banner the customer picked (null when none is picked): the range below shows it on every product. */
  onBanner?: (banner: GalleryBanner | null) => void;
  /** Which products are left to the design team, and the way to leave one (or take it back). */
  teamOf: (productId: string) => boolean;
  onTeam: (productId: string) => void;
}

/** The top of the page: a 3D jar that flips round wearing one of five labels, with the logo upload and the way into "Try it". */
export function HeroStage({ details, logo, onLogo, shift, onShift, onEdit, onBanner, teamOf, onTeam }: Props) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [banners, setBanners] = useState<GalleryBanner[] | null>(null);
  const [banner, setBanner] = useState<GalleryBanner | null>(null);
  const [pack, setPack] = useState<Pack>('jar');
  const product = productById(chosen ?? LIST[0])!;

  // the real banners our team saved in the template gallery for this product
  useEffect(() => {
    let live = true;
    setBanners(null);
    setBanner(null);
    labelsFor(product, pack)
      .then((list) => {
        if (!live) return;
        const five = list; // every label, the picker shows six and scrolls
        setBanners(five);
        // the jar always wears one of the ready labels: the first one
        setBanner(five[0] ?? null);
      })
      .catch(() => live && setBanners([]));
    return () => {
      live = false;
    };
  }, [product.templateCategory, chosen, pack]);
  useEffect(() => {
    // only a jar label is worn by the range below; a pouch or sachet label is just for the pouch or sachet
    onBanner?.(chosen && pack === 'jar' ? banner : null);
  }, [chosen, banner, pack]); // eslint-disable-line react-hooks/exhaustive-deps
  const spec = { product, flavour: product.flavours[0], design: 0, details, logo: logo || undefined };

  const pickBanner = (b: GalleryBanner) => {
    setChosen(product.id);
    setBanner(b);
  };

  const choose = (id: string) => {
    setChosen(id);
  };

  return (
    <div className="hero-right">
      <div className="stage">
        <div className="blob" aria-hidden />
        <LabelView spec={spec} mode="3d" className="stage-jar" waiting={banner === null && banners !== null && banners.length > 0 || banners === null} banner={labelOnPack(product, pack, banner)} pack={pack} logo={logo || undefined} logoShift={shift} autoTurn={false} />
      </div>
      <div className="packrow"><PackToggle className="stage-packs" product={product} pack={pack} onPack={setPack} /></div>
      <div className="lbox lbox-live">
        <div className="pstrip" role="group" aria-label="Product">
          {LIST.map((id) => {
            const p = productById(id)!;
            return (
              <button key={id} type="button" className="pchip" aria-pressed={product.id === id} onClick={() => choose(id)}>
                <ProductJar className="pchip-jar" product={p} brand={details.brand} />
                <span>{TILE_NAME[id] ?? p.name}</span>
              </button>
            );
          })}
        </div>
        {banners === null ? (
          <span className="lbox-note">Loading our labels…</span>
        ) : banners.length > 0 ? (
          <>
            <div className="dpicks lstrip" role="group" aria-label="Label">
              {banners.map((b) => (
                <button key={b.slug} type="button" className="dpick" aria-pressed={banner?.slug === b.slug} onClick={() => pickBanner(b)} title={b.title}>
                  <img className={`dpick-img${b.ownLogo ? " bag" : ""}`} src={b.thumb} alt={b.title} loading="lazy" />
                </button>
              ))}
            </div>
            {!banner?.ownLogo && <LogoPlacement logo={logo} onLogo={onLogo} shift={shift} onShift={onShift} />}
            <div className="lbox-actions">
              {banner?.ownLogo ? (
                <span className="lbox-note">This label already has its own brand and details. We print it as it is.</span>
              ) : (
                <button type="button" className="btn btn-lime btn-sm" disabled={!banner} onClick={() => banner && onEdit(product.id, banner.slug)}>Make with my logo</button>
              )}
            </div>
            <TeamChoice picked={teamOf(product.id)} onPick={() => onTeam(product.id)} />
          </>
        ) : null}
      </div>
    </div>
  );
}
