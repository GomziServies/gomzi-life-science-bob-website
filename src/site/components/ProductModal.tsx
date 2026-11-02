import { useEffect, useState } from 'react';
import type { Product } from '../data/catalog';
import { BROCHURE, PACK_SIZES } from '../data/content';
import { listGalleryBanners, type GalleryBanner } from '../lib/api';
import { type Details } from '../lib/labelArt';
import { LabelView, type LogoShift } from './LabelView';
import { LogoPlacement, PackToggle, packText, type Pack } from './LabelParts';
import { ProductJar, ownDesign, tintOf } from './ProductJar';

interface Props {
  product: Product;
  flavour: string;
  inCart: boolean;
  banner?: string;
  /** The jar size in kg for protein powders (other products have one fixed size). */
  pack: number;
  onPack: (kg: number) => void;
  onFlavour: (flavour: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
  /** The brand details the label is drawn with. */
  details: Details;
  logo: string;
  onLogo: (logo: string) => void;
  shift: LogoShift;
  onShift: (shift: LogoShift) => void;
  /** Open this label in the editor for the product (no logo needed yet: it is added there). */
  onEdit: (slug: string) => void;
}

/** One product in full: its jar, pack types, label size and every flavour to choose from. */
export function ProductModal({ product, flavour, inCart, banner, pack, onPack, onFlavour, onAdd, onRemove, onClose, details, onEdit, logo, onLogo, shift, onShift }: Props) {
  const [labels, setLabels] = useState<GalleryBanner[] | null>(null);
  const [label, setLabel] = useState<GalleryBanner | null>(null);
  const [shape, setShape] = useState<Pack>('jar');
  const threeD = product.group !== 'well';

  // the first five labels our team made for this kind of product: the customer turns the jar and clicks one to wear it
  useEffect(() => {
    let live = true;
    setLabels(null);
    setLabel(null);
    listGalleryBanners(product.templateCategory)
      .then((list) => {
        if (!live) return;
        const five = list; // every label, the picker shows six and scrolls
        setLabels(five);
        setLabel(five[0] ?? null);
      })
      .catch(() => live && setLabels([]));
    return () => {
      live = false;
    };
  }, [product.templateCategory]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`${product.name} details`} onClick={onClose}>
      <div className="modal-box pmodal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-x modal-x" aria-label="Close" onClick={onClose}>×</button>
        <div className="pmodal-art" style={{ ['--tint' as string]: tintOf(product.id) }}>
          {threeD ? (
            <LabelView className="pmodal-3d" mode="3d" spec={{ product, flavour, design: ownDesign(product.id), details, logo: undefined }} banner={label} pack={shape} logo={logo || undefined} logoShift={shift} autoTurn={false} />
          ) : (
            <ProductJar className="jar-card" product={product} flavour={flavour} banner={banner} />
          )}
          {threeD && <PackToggle className="pmodal-packs" product={product} pack={shape} onPack={setShape} />}
          {threeD && <span className="pmodal-hint">Drag to turn it and see both sides</span>}
        </div>
        <div className="pmodal-info">
          <span className="tag" style={{ color: tintOf(product.id) }}>{product.tag}</span>
          <h3>{product.name}</h3>
          {product.sub && <span className="muted">{product.sub}</span>}
          {product.group !== 'well' && <span className="packs">{packText(product)}</span>}
          {product.unit === 'kg' ? (
            <>
              <b className="pmodal-h">Sizes</b>
              <div className="flv" role="group" aria-label="Jar size">
                {PACK_SIZES.map((s) => (
                  <button key={s.kg} type="button" aria-pressed={s.kg === pack} onClick={() => onPack(s.kg)}>{s.label}</button>
                ))}
              </div>
            </>
          ) : (
            product.weight && <span className="size-fixed">Size: <b>{product.weight.toLowerCase()}</b></span>
          )}
          {product.labelSize && <span className="label-size">Label size: {product.labelSize}</span>}
          {product.flavours.length > 1 && (
            <>
              <b className="pmodal-h">All flavours ({product.flavours.length})</b>
              <div className="flv" role="group" aria-label="Flavour">
                {product.flavours.map((f) => (
                  <button key={f} type="button" aria-pressed={f === flavour} onClick={() => onFlavour(f)}>{f}</button>
                ))}
              </div>
            </>
          )}
          {BROCHURE[product.id] && (
            <div className="brochure-info">
              <b className="pmodal-h">From the brochure</b>
              <p>{BROCHURE[product.id].about}</p>
              {BROCHURE[product.id].facts && (
                <dl>
                  {BROCHURE[product.id].facts!.map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              )}
              {BROCHURE[product.id].lists?.map(([title, items]) => (
                <div key={title}>
                  <span className="brochure-h">{title}</span>
                  <ul>{items.map((it) => <li key={it}>{it}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
          {labels && labels.length > 0 && (
            <>
              <b className="pmodal-h">Labels</b>
              <div className="dpicks pmodal-labels" role="group" aria-label="Label">
                {labels.map((b) => (
                  <button key={b.slug} type="button" className="dpick" aria-pressed={label?.slug === b.slug} onClick={() => setLabel(b)} title={b.title}>
                    <img className="dpick-img" src={b.thumb} alt={b.title} loading="lazy" />
                  </button>
                ))}
              </div>
            </>
          )}
          {labels && labels.length > 0 && <LogoPlacement logo={logo} onLogo={onLogo} shift={shift} onShift={onShift} />}
          <div className="modal-actions">
            {inCart ? (
              <button type="button" className="btn btn-ghost" onClick={onRemove}>Remove from inquiry</button>
            ) : (
              <button type="button" className="btn btn-lime" onClick={onAdd}>Add to inquiry</button>
            )}
            {label && <button type="button" className="btn btn-dark" onClick={() => onEdit(label.slug)}>Edit this label</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
