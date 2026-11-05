import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATALOG, GROUPS, type Product } from '../data/catalog';
import { BROCHURE, COMPANY, CUSTOM_FORMULAS, NUTRITION, PACK_SIZES, customFor } from '../data/content';
import type { GalleryBanner } from '../lib/api';
import { WHATSAPP } from '../lib/config';
import { labelMm, logoGuide, type Details } from '../lib/labelArt';
import { MIN_PROTEIN_KG, MIN_UNITS } from '../lib/rules';
import { LabelView, type LogoShift } from './LabelView';
import { LogoPlacement, PackToggle, TeamChoice, labelsFor, labelOnPack, packText, packsOf, type Pack } from './LabelParts';
import { ProductJar, ownDesign, tintOf } from './ProductJar';
import { Seo } from './Seo';
import { notePicture } from '../lib/preload3d';

interface Props {
  product: Product;
  flavour: string;
  inCart: boolean;
  pack: number;
  onPack: (kg: number) => void;
  onFlavour: (flavour: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  details: Details;
  logo: string;
  onLogo: (logo: string) => void;
  shift: LogoShift;
  onShift: (shift: LogoShift) => void;
  onEdit: (slug: string) => void;
  team: boolean;
  onTeam: () => void;
}

const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const unitWord = (p: Product) => (p.unit === 'kg' ? 'kg' : p.unit === 'jar' ? 'jars' : p.unit === 'bottle' ? 'bottles' : 'sachets');

/** One product on its own page: its 3D pack and label choices, what it is, every flavour, the nutrition table, label and pack details, and the products beside it. */
export function ProductDetail({ product, flavour, inCart, pack, onPack, onFlavour, onAdd, onRemove, details, logo, onLogo, shift, onShift, onEdit, team, onTeam }: Props) {
  const [labels, setLabels] = useState<GalleryBanner[] | null>(null);
  const [label, setLabel] = useState<GalleryBanner | null>(null);
  const [shape, setShape] = useState<Pack>('jar');
  const track = useRef<HTMLDivElement>(null);
  const at = labels && label ? labels.findIndex((b) => b.slug === label.slug) : -1;
  const step = (d: number) => {
    if (!labels || labels.length === 0) return;
    setLabel(labels[(Math.max(at, 0) + d + labels.length) % labels.length]);
  };
  // the chosen label slides to the middle of the strip (only the strip moves, not the page)
  useEffect(() => {
    const box = track.current;
    const el = box?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (box && el) box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.clientWidth) / 2, behavior: 'smooth' });
  }, [label?.slug]);

  useEffect(() => {
    let live = true;
    setLabels(null);
    setLabel(null);
    labelsFor(product, shape)
      .then((list) => {
        if (!live) return;
        setLabels(list);
        setLabel(list[0] ?? null);
      })
      .catch(() => live && setLabels([]));
    return () => {
      live = false;
    };
  }, [product.id, product.templateCategory, shape]);
  // a different product starts on its jar again
  useEffect(() => setShape('jar'), [product.id]);

  const info = BROCHURE[product.id];
  const n = NUTRITION[product.id];
  const options = customFor(product.id, product.group);
  const guide = logoGuide(product, ownDesign(product.id));
  const mm = labelMm(product);
  const related = CATALOG.filter((p) => p.group === product.group && p.id !== product.id && !p.hidden).slice(0, 4);
  const minText = product.unit === 'kg' ? `${MIN_PROTEIN_KG} kg of protein in total across all protein products (flavours can be mixed), in steps of 10 kg.` : `${MIN_UNITS} ${unitWord(product)} of each product, in steps of ${MIN_UNITS}.`;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const about = info?.about ?? `${product.name}${product.sub ? ` (${product.sub})` : ''}: a ready formulation from ${COMPANY.name}, made, filled and labelled for your brand in Surat.`;

  return (
    <div className="pd">
      <Seo
        title={`${product.name}: Private-Label Manufacturing in Surat | Gomzi`}
        description={`${about} Choose from ${product.flavours.length} flavour${product.flavours.length === 1 ? '' : 's'}, add your own label and see it in 3D. Made in Surat.`.slice(0, 300)}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: about,
            category: GROUPS[product.group].title,
            brand: { '@type': 'Organization', name: COMPANY.name },
            manufacturer: { '@type': 'Organization', name: COMPANY.name },
            image: `${origin}/og-gomzi.png`,
            url: `${origin}/products/${product.id}`,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Products', item: `${origin}/products` },
              { '@type': 'ListItem', position: 3, name: product.name, item: `${origin}/products/${product.id}` },
            ],
          },
        ]}
      />

      <section className="section pd-main">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span aria-hidden="true">›</span>
            <Link to="/products">Products</Link><span aria-hidden="true">›</span>
            <span>{GROUPS[product.group].title}</span><span aria-hidden="true">›</span>
            <span>{product.name}</span>
          </nav>

          <div className="pd-grid">
            <div className="pd-gallery">
              <div className="pd-stage" style={{ ['--tint' as string]: tintOf(product.id) }}>
                <LabelView className="pd-3d" zoomable mode="3d" spec={{ product, flavour, design: ownDesign(product.id), details, logo: undefined }} banner={labelOnPack(product, shape, label)} waiting={labels === null || (shape === 'jar' && !!label?.ownLogo)} pack={shape} logo={logo || undefined} logoShift={shift} autoTurn={false} onSnapshot={() => notePicture()} />
                <PackToggle className="pd-packs" product={product} pack={shape} onPack={setShape} />
                <span className="pd-hint">Drag to turn it and see every side</span>
              </div>
              {labels && labels.length > 0 && (
                <div className="pd-labels">
                  <div className="pd-labels-head">
                    <b>Choose a label</b>
                    <span>Label {at + 1} of {labels.length}</span>
                    <span className="pd-labels-btns">
                      <button type="button" aria-label="Previous label" onClick={() => step(-1)}>‹</button>
                      <button type="button" aria-label="Next label" onClick={() => step(1)}>›</button>
                    </span>
                  </div>
                  <div className="pd-thumbs" ref={track} role="group" aria-label="Label">
                    {labels.map((b, i) => (
                      <button key={b.slug} type="button" className="pd-thumb" aria-pressed={label?.slug === b.slug} onClick={() => setLabel(b)} title={b.title}>
                        <img className={b.ownLogo ? "bag" : undefined} src={b.thumb} alt={b.title} loading="lazy" />
                        <span>{i + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pd-info">
              <span className="tag" style={{ color: tintOf(product.id) }}>{product.tag}</span>
              <h1>{product.name}</h1>
              {product.sub && <p className="pd-sub">{product.sub}</p>}
              <div className="pd-badges">
                {product.comingSoon ? <span className="pd-badge soon">Coming soon</span> : <span className="pd-badge ok">Ready to brand</span>}
                {product.group !== 'well' && <span className="pd-badge">{packText(product)}</span>}
              </div>

              {product.unit === 'kg' ? (
                <div className="pd-block">
                  <b>Jar size</b>
                  <div className="flv" role="group" aria-label="Jar size">
                    {PACK_SIZES.map((s) => (
                      <button key={s.kg} type="button" aria-pressed={s.kg === pack} onClick={() => onPack(s.kg)}>{s.label}</button>
                    ))}
                  </div>
                </div>
              ) : (
                product.weight && <div className="pd-block"><b>Size</b><span>{product.weight.toLowerCase()}</span></div>
              )}

              {product.flavours.length > 1 && (
                <div className="pd-block">
                  <b>Flavour <small>({product.flavours.length})</small></b>
                  <div className="flv" role="group" aria-label="Flavour">
                    {product.flavours.map((f) => (
                      <button key={f} type="button" aria-pressed={f === flavour} onClick={() => onFlavour(f)}>{f}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pd-rule"><span aria-hidden="true">ⓘ</span><span><b>Minimum order:</b> {minText}</span></div>

              <div className="pd-actions">
                {product.comingSoon ? (
                  <button type="button" className="btn btn-ghost" disabled>Coming soon</button>
                ) : inCart ? (
                  <button type="button" className="btn btn-ghost" onClick={onRemove}>Remove from inquiry</button>
                ) : (
                  <button type="button" className="btn btn-lime" onClick={onAdd}>Add to inquiry</button>
                )}
                {label && !product.comingSoon && !label.ownLogo && <button type="button" className="btn btn-dark" onClick={() => onEdit(label.slug)}>Edit this label</button>}
                {inCart && <Link className="btn btn-ghost" to="/details">Continue</Link>}
              </div>
              {inCart && <span className="incart">✓ Added to your inquiry</span>}

              {labels && labels.length > 0 && !label?.ownLogo && <LogoPlacement logo={logo} onLogo={onLogo} shift={shift} onShift={onShift} />}
              {labels && labels.length > 0 && <TeamChoice picked={team} onPick={onTeam} />}

              <ul className="pd-trust">
                <li><b>5 days</b> dispatch for ready formulations in stock</li>
                <li><b>18 months</b> shelf life on every batch</li>
                <li><b>Made in Surat</b> · FSSAI · GMP · HACCP</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section soft pd-sections">
        <div className="wrap">
          <nav className="pd-jump" aria-label="On this page">
            <a href="#pd-about">About</a>
            {(n || product.detailImage) && <a href="#pd-nutrition">Nutrition</a>}
            <a href="#pd-label">Label &amp; packs</a>
            <a href="#pd-formula">Your own formula</a>
          </nav>

          <div className="pd-cards">
            <article className="pd-card" id="pd-about">
              <h2>About {product.name}</h2>
              <p>{about}</p>
              {info?.facts && (
                <dl className="pd-facts">
                  {info.facts.map(([k, v]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              )}
              {info?.lists?.map(([title, items]) => (
                <div key={title} className="pd-list">
                  <h3>{title}</h3>
                  <ul>{items.map((it) => <li key={it}>{it}</li>)}</ul>
                </div>
              ))}
            </article>

            {(n || product.detailImage) && (
              <article className="pd-card" id="pd-nutrition">
                <h2>Nutrition</h2>
                {product.detailImage ? (
                  <img className="detail-img" src={product.detailImage} alt={`${product.name} ingredients`} />
                ) : (
                  n && (
                    <>
                      <table className="ntable">
                        <thead>
                          <tr><th>Nutrient</th><th>Per {n.serving}</th><th>Per 100 g</th></tr>
                        </thead>
                        <tbody>
                          {n.rows.map((r) => (
                            <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="muted fine">Approximate values. This table is fixed and printed on your back label.</p>
                    </>
                  )
                )}
              </article>
            )}

            <article className="pd-card" id="pd-label">
              <h2>Label &amp; pack details</h2>
              <dl className="pd-facts">
                <div><dt>Packs</dt><dd>{packsOf(product).map((p) => (p === 'jar' ? (product.unit === 'bottle' ? 'Bottle' : 'Jar') : p === 'pouch' ? 'Pouch' : 'Sachet')).join(' · ')}</dd></div>
                <div><dt>Label size</dt><dd>{product.labelSize ?? `${mm.w} × ${mm.h} mm`}</dd></div>
                <div><dt>Logo area</dt><dd>{guide.mmW} × {guide.mmH} mm, at least {guide.pxW} × {guide.pxH} px for a sharp print</dd></div>
                <div><dt>Flavours</dt><dd>{product.flavours.length}</dd></div>
              </dl>
              <p className="muted fine">Pick any label above and add your logo. Our design team prepares the print-ready CMYK file.</p>
            </article>

            <article className="pd-card" id="pd-formula">
              <h2>Want your own formula?</h2>
              <p>The nutrition table of a ready product is fixed. If you want something different, our team develops it with you after a call.</p>
              <ul className="cform">
                {options.map((k) => (
                  <li key={k}><span>{CUSTOM_FORMULAS[k].label}<small className="muted"> · {CUSTOM_FORMULAS[k].note}</small></span></li>
                ))}
              </ul>
              <a className="btn btn-dark btn-sm" href={wa(`Hi ${COMPANY.name}, I want to discuss a custom formula for ${product.name}.`)} target="_blank" rel="noopener noreferrer">Talk to our team</a>
              <Link className="pd-more" to="/faq">More questions? See the FAQ »</Link>
            </article>

          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section pd-related">
          <div className="wrap">
            <h2>More from {GROUPS[product.group].title}</h2>
            <div className="pd-rel">
              {related.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="pd-relcard" style={{ ['--tint' as string]: tintOf(p.id) }}>
                  <ProductJar className="pd-reljar" product={p} />
                  <b>{p.name}</b>
                  <small>{p.sub || p.tag.toLowerCase()}</small>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
