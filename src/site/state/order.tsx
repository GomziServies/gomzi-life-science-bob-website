import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { productById } from '../data/catalog';

export type BannerOrigin = 'template' | 'ai' | 'blank' | 'graphics_team';

/** The name of the design team a customer can leave their label to. */
export const TEAM_NAME = 'Parpics team';

export interface CartLine {
  productId: string;
  flavour: string;
  quantity: number;
  /** Jar size for protein powders, in kg (0.5, 1 or 2). Printed on the label; other products ignore it. */
  packKg?: number;
}

export interface Banner {
  origin: BannerOrigin;
  templateSlug?: string;
  previewUrl: string;
  /** Small copy of the banner kept in the browser, so the list shows it even if the uploaded file's link cannot be opened. */
  thumbnail?: string;
  pdfUrl: string;
  jsonUrl: string;
  savedAt: number;
}

/**
 * Resolves the displayable image URL for a banner in the browser.
 * Always prefers the local data URL (thumbnail) over remote S3 URLs,
 * since the private S3 bucket forbids direct browser GET requests with 403 Forbidden.
 */
export function getBannerDisplayUrl(banner: Banner | undefined | null): string {
  if (!banner) return '';
  if (banner.thumbnail && banner.thumbnail.startsWith('data:')) {
    return banner.thumbnail;
  }
  if (banner.previewUrl && !banner.previewUrl.includes('amazonaws.com')) {
    return banner.previewUrl;
  }
  return banner.thumbnail || banner.previewUrl || '';
}

/** A label the customer leaves to the design team: it has no picture or files yet. */
export const teamBanner = (): Banner => ({ origin: 'graphics_team', previewUrl: '', pdfUrl: '', jsonUrl: '', savedAt: Date.now() });
export const isTeamBanner = (b: Banner | undefined | null) => b?.origin === 'graphics_team';

export interface Customer {
  fullName: string;
  brandName: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  verificationId: string;
}

interface OrderState {
  cart: CartLine[];
  banners: Record<string, Banner>; // keyed by productId
  customer: Customer;
}

const EMPTY_CUSTOMER: Customer = { fullName: '', brandName: '', phone: '', altPhone: '', email: '', address: '', city: '', pincode: '', verificationId: '' };
const KEY = 'banner-website:order:v1';

function load(): OrderState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // a label from the old graphics-team option has no picture: it is dropped
      const banners = Object.fromEntries(Object.entries(saved.banners ?? {}).filter(([, b]) => !(b as { graphicsTeam?: boolean }).graphicsTeam));
      // a product that is no longer in the range (an old saved inquiry) is dropped, so no page ever meets a line it cannot show
      const cart = (Array.isArray(saved.cart) ? saved.cart : []).filter((l: { productId?: string }) => !!l?.productId && !!productById(l.productId))
        // a flavour that is no longer offered (an old saved inquiry) becomes the product's first flavour
        .map((l: { productId: string; flavour?: string }) => {
          const p = productById(l.productId)!;
          return p.flavours.includes(l.flavour ?? '') ? l : { ...l, flavour: p.flavours[0] };
        });
      return { customer: EMPTY_CUSTOMER, ...saved, cart, banners };
    }
  } catch {
    /* storage unavailable: start empty */
  }
  return { cart: [], banners: {}, customer: EMPTY_CUSTOMER };
}

interface OrderApi extends OrderState {
  addToCart: (line: CartLine) => void;
  updateQty: (productId: string, quantity: number) => void;
  setFlavour: (productId: string, flavour: string) => void;
  setPack: (productId: string, packKg: number) => void;
  removeFromCart: (productId: string) => void;
  setBanner: (productId: string, banner: Banner) => void;
  clearBanner: (productId: string) => void;
  setCustomer: (patch: Partial<Customer>) => void;
  reset: () => void;
  allBannersDone: boolean;
}

const Ctx = createContext<OrderApi | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrderState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const api = useMemo<OrderApi>(
    () => ({
      ...state,
      addToCart: (line) => setState((s) => (s.cart.some((l) => l.productId === line.productId) || productById(line.productId)?.comingSoon ? s : { ...s, cart: [...s.cart, line] })),
      updateQty: (productId, quantity) => setState((s) => ({ ...s, cart: s.cart.map((l) => (l.productId === productId ? { ...l, quantity } : l)) })),
      setFlavour: (productId, flavour) => setState((s) => ({ ...s, cart: s.cart.map((l) => (l.productId === productId ? { ...l, flavour } : l)) })),
      setPack: (productId, packKg) => setState((s) => ({ ...s, cart: s.cart.map((l) => (l.productId === productId ? { ...l, packKg } : l)) })),
      removeFromCart: (productId) =>
        setState((s) => {
          const { [productId]: _gone, ...banners } = s.banners;
          return { ...s, cart: s.cart.filter((l) => l.productId !== productId), banners };
        }),
      setBanner: (productId, banner) => setState((s) => ({ ...s, banners: { ...s.banners, [productId]: banner } })),
      clearBanner: (productId) =>
        setState((s) => {
          const { [productId]: _gone, ...banners } = s.banners;
          return { ...s, banners };
        }),
      setCustomer: (patch) => setState((s) => ({ ...s, customer: { ...s.customer, ...patch } })),
      reset: () => setState({ cart: [], banners: {}, customer: EMPTY_CUSTOMER }),
      allBannersDone: state.cart.length > 0 && state.cart.every((l) => state.banners[l.productId]),
    }),
    [state],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useOrder(): OrderApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOrder must be used inside OrderProvider');
  return v;
}
