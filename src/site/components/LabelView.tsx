import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { lookOf } from './ProductJar';
import { lum } from '../data/labelTemplates';
import { PANELS, jarKind, labelMm, renderCanvas, wrapSvg, type LabelSpec } from '../lib/labelArt';
import { getLogoSlot, type GalleryBanner, type LogoSlot } from '../lib/api';
import { fitPack, type Pack } from './LabelParts';

const JarScene = lazy(() => import('./JarScene'));

/** Pre-warms the 3D JarScene and Three.js chunk in background so opening 3D view is instantaneous. */
export function preloadJarScene() {
  void import('./JarScene');
}

/** In-memory canvas cache: prevents re-rasterizing identical banner textures on dialog reopen. */
const bannerCanvasCache = new Map<string, { canvas: HTMLCanvasElement; dark: boolean }>();

/** The label drawn to a canvas `px` wide, redrawn (after a short pause) whenever the design, logo or details change. */
/** Label pictures already drawn, so a card that scrolls back into view (or turns from tub to pouch) does not draw its label again. */
const wrapCache = new Map<string, HTMLCanvasElement>();

export function useWrap(spec: LabelSpec, px: number, enabled = true): HTMLCanvasElement | null {
  const key = JSON.stringify([spec.product.id, spec.flavour, spec.design, spec.logo?.length, spec.logo?.slice(-24), spec.details, px]);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(() => wrapCache.get(key) ?? null);
  useEffect(() => {
    if (!enabled) return;
    const cached = wrapCache.get(key);
    if (cached) {
      setCanvas(cached);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      renderCanvas(spec, px)
        .then((c) => {
          if (wrapCache.size > 40) wrapCache.delete(wrapCache.keys().next().value as string);
          wrapCache.set(key, c);
          if (live) setCanvas(c);
        })
        .catch(() => undefined);
    }, 140);
    return () => {
      live = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  return canvas;
}

/** A gallery banner's picture drawn to a canvas (for the jar's label), and whether its edges are dark (to pick the jar's colour). */
function useBannerCanvas(url: string | undefined, fallbackUrl?: string | undefined) {
  // If primary URL is an AWS S3 URL known to be blocked/private, prioritize fallback data URL
  const isPrivateS3 = url?.includes('amazonaws.com') || false;
  const initialUrl = (isPrivateS3 && fallbackUrl) ? fallbackUrl : (url || fallbackUrl);

  // Synchronous cache hit check: 0ms texture initialization on re-renders!
  const [state, setState] = useState<{ url: string; canvas: HTMLCanvasElement; dark: boolean } | null>(() => {
    if (initialUrl && bannerCanvasCache.has(initialUrl)) {
      return { url: initialUrl, ...bannerCanvasCache.get(initialUrl)! };
    }
    return null;
  });

  useEffect(() => {
    if (!initialUrl) return;
    if (bannerCanvasCache.has(initialUrl)) {
      setState({ url: initialUrl, ...bannerCanvasCache.get(initialUrl)! });
      return;
    }

    let live = true;
    const loadImg = (src: string, isFallback = false) => {
      const img = new Image();
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        if (!live) return;
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        let dark = true;
        try {
          const strip = Math.max(2, Math.round(canvas.height * 0.05));
          const px = [ctx.getImageData(0, 0, canvas.width, strip).data, ctx.getImageData(0, canvas.height - strip, canvas.width, strip).data];
          let sum = 0;
          let n = 0;
          for (const d of px) for (let i = 0; i < d.length; i += 4) { sum += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; }
          dark = sum / n < 128;
        } catch {
          /* unreadable: keep the dark jar */
        }
        bannerCanvasCache.set(initialUrl, { canvas, dark });
        setState({ url: initialUrl, canvas, dark });
      };
      img.onerror = () => {
        if (!live) return;
        if (!isFallback && fallbackUrl && fallbackUrl !== src) {
          loadImg(fallbackUrl, true);
        }
      };
      img.src = src;
    };

    loadImg(initialUrl);

    return () => {
      live = false;
    };
  }, [initialUrl, fallbackUrl]);

  return state && (state.url === url || state.url === fallbackUrl) ? state : null;
}

/** Where the customer moves their logo from the empty place, in % of the picture's width (`dx`) and height (`dy`). */
export interface LogoShift {
  dx: number;
  dy: number;
}

function useLogoSlot(slug: string | undefined) {
  const [state, setState] = useState<{ slug: string; slot: LogoSlot | null } | null>(null);
  useEffect(() => {
    if (!slug) return;
    let live = true;
    void getLogoSlot(slug).then((slot) => live && setState({ slug, slot }));
    return () => {
      live = false;
    };
  }, [slug]);
  return state && state.slug === slug ? state.slot : null;
}

/** The banner's canvas with the logo set into the logo place (fitted inside it, centred, then moved by `shift`); the banner itself when there is no logo or no place. */
function useLogoOnBanner(base: HTMLCanvasElement | null, slot: LogoSlot | null, logo: string | undefined, shift: LogoShift): HTMLCanvasElement | null {
  const [out, setOut] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!base || !slot || !logo) {
      setOut(null);
      return;
    }
    let live = true;
    const img = new Image();
    img.onload = () => {
      if (!live) return;
      const canvas = document.createElement('canvas');
      canvas.width = base.width;
      canvas.height = base.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(base, 0, 0);
      const [sx, sy, sw, sh] = [slot.x * base.width, slot.y * base.height, slot.w * base.width, slot.h * base.height];
      const fit = Math.min(sw / img.naturalWidth, sh / img.naturalHeight);
      const [w, h] = [img.naturalWidth * fit, img.naturalHeight * fit];
      ctx.drawImage(img, sx + (sw - w) / 2 + (shift.dx / 100) * base.width, sy + (sh - h) / 2 + (shift.dy / 100) * base.height, w, h);
      setOut(canvas);
    };
    img.src = logo;
    return () => {
      live = false;
    };
  }, [base, slot, logo, shift.dx, shift.dy]);
  return out;
}

export const FlatLabel = ({ spec, view = 'wrap', className }: { spec: LabelSpec; view?: 'wrap' | 'front'; className?: string }) => {
  const id = 'f' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const html = useMemo(() => wrapSvg(spec, id, { view }), [spec, id, view]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export interface BannerLike {
  slug?: string;
  title?: string;
  image: string;
  thumb?: string;
  width?: number;
  height?: number;
  ownLogo?: boolean;
  lowImage?: string;
}

interface Props {
  spec: LabelSpec;
  mode: '3d' | 'flat';
  /** Width, in pixels, the label is drawn at for the 3D jar. */
  px?: number;
  className?: string;
  /** A real banner from the template gallery or a custom banner, shown instead of the drawn label. */
  banner?: BannerLike | GalleryBanner | null;
  /** The pack shown in 3D: the jar (default), a pouch or a sachet. */
  pack?: Pack;
  /** The customer's logo for a gallery banner: shown in the banner's empty logo place, moved by `logoShift`. */
  logo?: string;
  logoShift?: LogoShift;
  /** The 3D pack turns by itself (default); off, it holds still on its front until dragged. */
  autoTurn?: boolean;
  /** Shows zoom in / zoom out buttons on the 3D pack. */
  zoomable?: boolean;
  /** Called once with a PNG of the finished 3D pack (see JarScene). */
  onSnapshot?: (dataUrl: string) => void;
  /** A ready label is still on its way: nothing is drawn meanwhile (no built-in design is ever shown instead). */
  waiting?: boolean;
}

/** The customer's label, either on a 3D jar that flips round or flat, as printed. */
const NO_SHIFT: LogoShift = { dx: 0, dy: 0 };

export function LabelView({ spec, mode, px = 2600, className, banner, pack = 'jar', logo, logoShift = NO_SHIFT, autoTurn = true, onSnapshot, waiting = false, zoomable = false }: Props) {
  const [broken, setBroken] = useState(false);
  const show3d = mode === '3d' && !broken;
  // a ready label is always what the pack wears; the drawn design is only for a product that has no ready label at all
  const ready = !!banner || waiting;
  const drawn = useWrap(spec, px, show3d && !ready);
  const lastCanvas = useRef<HTMLCanvasElement | null>(null);
  const lastKind = useRef<string>('');
  // only a picture that belongs to the label now wanted counts; one left over from the label before it never shows
  const realRaw = useBannerCanvas(banner?.image, banner?.thumb);
  const lowRaw = useBannerCanvas(banner?.lowImage ?? banner?.thumb);
  const mine = (r: { url: string } | null) => (r && banner && (r.url === banner.image || r.url === banner.thumb || r.url === banner.lowImage) ? r : null);
  const real = mine(realRaw) as typeof realRaw;
  const low = mine(lowRaw) as typeof lowRaw;
  const shown = real ?? low;
  const placed = useLogoOnBanner(real?.canvas ?? null, useLogoSlot(banner?.ownLogo ? undefined : banner?.slug), logo, logoShift);
  const { c } = lookOf(spec.product.id, spec.design);
  const kind3d = fitPack(spec.product, pack) === 'jar' ? jarKind(spec.product) : fitPack(spec.product, pack);
  // the protein bottle and the jars stay dark, whatever the label's colours; only the tablet bottle follows the label
  const jarColor = kind3d === 'tub' || kind3d === 'jar' ? '#151515' : banner ? (shown?.dark === false ? '#F1F1EE' : '#151515') : lum(c.S) > 0.5 ? '#F1F1EE' : '#151515';
  const base = labelMm(spec.product);
  
  const bw = (banner?.width && banner.width > 0) ? banner.width : (shown?.canvas?.width || 0);
  const bh = (banner?.height && banner.height > 0) ? banner.height : (shown?.canvas?.height || 0);
  const mm = (banner && bw > 0 && bh > 0) ? { w: base.w, h: (base.w * bh) / bw } : base;

  // while a new label loads, the pack keeps the label it had; with none yet, a spinner
  const bannerCanvas = placed ?? real?.canvas ?? low?.canvas ?? null;
  // a different kind of pack (jar, pouch, sachet) never wears the picture kept from another kind
  if (lastKind.current !== kind3d) {
    lastKind.current = kind3d;
    lastCanvas.current = null;
  }
  if (bannerCanvas) lastCanvas.current = bannerCanvas;
  const wrapCanvas = ready ? (bannerCanvas ?? lastCanvas.current) : drawn;
  if (ready && show3d && !wrapCanvas) {
    return (
      <div className={`lv-loading-placeholder ${className || ''}`}>
        <div className="lv-spinner" />
      </div>
    );
  }
  if (!show3d) {
    if (banner) return <img className={className ? className + ' lv-flat' : 'lv-flat'} src={banner.image} alt={banner.title ?? ''} />;
    return <FlatLabel spec={spec} className={className ? className + ' lv-flat' : 'lv-flat'} />;
  }
  return (
    <Suspense
      fallback={
        <div className={`lv-loading-placeholder ${className || ''}`}>
          <div className="lv-spinner" />
          <span className="lv-hint">Loading 3D view…</span>
        </div>
      }
    >
      <JarScene className={className} zoomable={zoomable} autoTurn={autoTurn} onSnapshot={onSnapshot} wrap={wrapCanvas} mm={mm} kind={kind3d} jarColor={jarColor} accent={banner ? undefined : c.P} panels={PANELS} onUnsupported={() => setBroken(true)} />
    </Suspense>
  );
}
