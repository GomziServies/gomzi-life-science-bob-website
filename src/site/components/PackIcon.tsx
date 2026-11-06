import { useEffect, useState } from 'react';
import type { Product } from '../data/catalog';
import { cupArtFrom } from '../lib/cupLabel';
import { PLACEHOLDER } from '../lib/labelArt';
import { LabelView, type BannerLike } from './LabelView';
import { useFirstJarLabel } from './LabelParts';
import { ProductJar, ownDesign } from './ProductJar';

interface Props {
  product: Product;
  flavour?: string;
  brand?: string;
  /** The saved label's picture, if any. */
  banner?: string;
  className?: string;
}

/** Pictures of the 3D cup already taken, by label: a row that comes back shows its cup at once. */
const shots = new Map<string, string>();

/**
 * The 3D view leaves room round the pack (for turning and zooming); a small icon needs the pack itself, so the picture is
 * cut to what is drawn in it (everything not transparent), with a hair of margin.
 */
function cropToPack(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true });
      if (!g) return resolve(url);
      g.drawImage(img, 0, 0);
      const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
      let x0 = width, y0 = height, x1 = -1, y1 = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] > 12) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      if (x1 < 0) return resolve(url);
      const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03);
      const [cx, cy] = [Math.max(0, x0 - pad), Math.max(0, y0 - pad)];
      const [cw, ch] = [Math.min(width, x1 + pad + 1) - cx, Math.min(height, y1 + pad + 1) - cy];
      const out = document.createElement('canvas');
      out.width = cw;
      out.height = ch;
      out.getContext('2d')!.drawImage(c, cx, cy, cw, ch, 0, 0, cw, ch);
      resolve(out.toDataURL('image/webp', 0.92));
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

/**
 * The small product picture in the inquiry lists. A peanut butter cup is shown as the same 3D cup the product cards show
 * (wearing the saved label, its wrap laid flat and its sticker on the lid, or else the default peanut butter label), drawn
 * once by the shop's shared card renderer; every other product keeps its drawn jar.
 */
export function PackIcon(props: Props) {
  return props.product.cupLabel ? <CupIcon {...props} /> : <ProductJar className={props.className} product={props.product} flavour={props.flavour} brand={props.brand} banner={props.banner} />;
}

function CupIcon({ product, flavour, brand = '', banner, className }: Props) {
  const firstJar = useFirstJarLabel(product);
  // the saved label laid out for the cup (undefined while that is being made)
  const [saved, setSaved] = useState<{ src: string; label: BannerLike | null } | undefined>(undefined);
  useEffect(() => {
    if (!banner) return;
    let live = true;
    void cupArtFrom(banner).then(
      (art) =>
        live &&
        setSaved({
          src: banner,
          label: art ? { image: art.image, thumb: art.image, width: art.width, height: art.height, noLogo: true, lidImage: art.lid ?? undefined } : { image: banner, thumb: banner },
        })
    );
    return () => {
      live = false;
    };
  }, [banner]);

  const label: BannerLike | null | undefined = banner ? (saved?.src === banner ? saved.label : undefined) : firstJar;
  const key = `${product.id}|${flavour ?? ''}|${banner ?? label?.slug ?? ''}`;
  const [, bump] = useState(0);
  const shot = shots.get(key);

  return (
    <div className={`pack-icon ${className ?? ''}`}>
      {shot ? <img src={shot} alt={product.name} draggable={false} /> : <span className="pack-icon-wait" aria-label={`${product.name}: loading`} role="img" />}
      {!shot && label !== undefined && (
        <div className="pack-icon-build" aria-hidden>
          <LabelView
            className="pack-icon-view"
            mode="3d"
            px={800}
            spec={{ product, flavour: flavour ?? product.flavours[0], design: ownDesign(product.id), details: { ...PLACEHOLDER, brand }, logo: undefined }}
            banner={label ?? undefined}
            autoTurn={false}
            snapshotOnly
            onSnapshot={(url) => {
              void cropToPack(url).then((cropped) => {
                shots.set(key, cropped);
                bump((n) => n + 1);
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
