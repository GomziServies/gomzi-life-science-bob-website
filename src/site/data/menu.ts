import { COLLECTIONS } from './collections';

/** One line in a dropdown: where it goes, its name, and a short note under it. */
export interface MenuItem {
  to: string;
  label: string;
  note?: string;
}

/** A top-level menu entry: a plain link, or a dropdown of items. `base` lists the paths that make it the current section. */
export interface MenuGroup {
  id: string;
  label: string;
  to?: string;
  items?: MenuItem[];
  /** The dropdown shows its items in two columns. */
  wide?: boolean;
  base: string[];
  /** Current only on exactly this path (Home), not on every page below it. */
  exact?: boolean;
}

export const MENU: MenuGroup[] = [
  { id: 'home', label: 'Home', to: '/', base: ['/'], exact: true },
  {
    id: 'products',
    label: 'Products',
    wide: true,
    base: ['/products'],
    items: [
      { to: '/products', label: 'All products', note: 'Browse the whole range' },
      ...COLLECTIONS.map((c): MenuItem => ({ to: `/products?c=${c.id}`, label: c.title, note: c.note })),
    ],
  },
  {
    id: 'custom',
    label: 'Custom',
    base: ['/custom-labels', '/custom-branding'],
    items: [
      { to: '/custom-labels', label: 'Custom labels', note: 'Design your own label, free' },
      { to: '/custom-branding', label: 'Custom branding', note: 'Labels, packs, formulas and our design team' },
    ],
  },
  {
    id: 'how',
    label: 'How it works',
    base: ['/how-it-works', '/how-private-label-works', '/dropshipping', '/faq', '/brochure'],
    items: [
      { to: '/how-it-works', label: 'Ordering step by step', note: 'From cart to your branded jars' },
      { to: '/how-private-label-works', label: 'How private label works', note: 'Formulate, label and dispatch' },
      { to: '/dropshipping', label: 'Dropshipping', note: 'Your label, our delivery' },
      { to: '/faq', label: 'FAQ', note: 'Questions people ask' },
      { to: '/brochure', label: 'Product brochure', note: 'Flavours and nutrition tables' },
    ],
  },
  { id: 'about', label: 'About', to: '/about', base: ['/about'] },
  { id: 'contact', label: 'Contact', to: '/contact', base: ['/contact'] },
];

/** Whether this path belongs to the group (so its menu entry shows as current). */
export const groupIsCurrent = (g: MenuGroup, pathname: string): boolean => {
  const here = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  return g.base.some((b) => here === b || (!g.exact && here.startsWith(b + '/')));
};
