import { CATALOG, productById, type Product } from '../data/catalog';
import { STOCK } from '../data/content';
import type { CartLine } from '../state/order';

// Order rules from the blueprint: protein is ordered in kg (50 kg across all protein products, flavours can be mixed),
// every sports or wellness product needs 50 jars or bottles.
export const MIN_PROTEIN_KG = 50;
export const MIN_UNITS = 50;

/** How much one tap on + / − changes the quantity. */
export const stepOf = (p: Product) => (p.unit === 'kg' ? 10 : 50);

/** The smallest quantity one line may have (protein is checked in total as well, see `cartIssues`). */
export const minOf = (p: Product) => (p.unit === 'kg' ? 10 : MIN_UNITS);

/** What is in stock for this flavour (kg for protein, jars or bottles for the rest). */
export const stockOf = (p: Product, flavour: string): number => STOCK[p.id]?.[flavour] ?? Infinity;

export const proteinKg = (cart: CartLine[]) => cart.reduce((sum, l) => (productById(l.productId)?.unit === 'kg' ? sum + l.quantity : sum), 0);

/** The quantity a product starts with when it is added: 50 kg for the first protein, then 10 kg more; 50 units otherwise. */
export const defaultQty = (p: Product, cart: CartLine[]): number => (p.unit === 'kg' ? (proteinKg(cart) >= MIN_PROTEIN_KG ? 10 : MIN_PROTEIN_KG) : MIN_UNITS);

/** Plain-words problems with the quantities in a cart; empty when the order can go ahead. */
export function cartIssues(cart: CartLine[]): string[] {
  const issues: string[] = [];
  for (const l of cart) {
    const p = CATALOG.find((x) => x.id === l.productId);
    if (!p) continue;
    if (l.quantity < minOf(p)) issues.push(`${p.name}: at least ${minOf(p)} ${p.unit === 'kg' ? 'kg' : p.unit + 's'}`);
    if (l.quantity > stockOf(p, l.flavour)) issues.push(`${p.name}: only ${stockOf(p, l.flavour)} ${p.unit === 'kg' ? 'kg' : p.unit + 's'} in stock`);
  }
  const kg = proteinKg(cart);
  if (kg > 0 && kg < MIN_PROTEIN_KG) issues.push(`Protein: ${MIN_PROTEIN_KG} kg in total across your protein products (you have ${kg} kg)`);
  return issues;
}
