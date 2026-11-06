// Product list from the Gomzi Life Science blueprint (stock list, Aug 2026).
export type GroupId = 'protein' | 'sports' | 'food' | 'well';

export interface Product {
  id: string;
  /** Gallery category holding this product's saved templates; empty shows every template. */
  templateCategory: string;
  /** A cup label from the template gallery (its slug) that the product's 3D cup wears until the customer saves their own (peanut butter). */
  cupLabel?: string;
  /** The product's label size, width x height (shown on the card and in its details). */
  labelSize?: string;
  /** Ingredient details supplied as an image, shown in the product's details instead of the standard note. */
  detailImage?: string;
  group: GroupId;
  name: string;
  /** Shown on the website with "Coming soon"; it cannot be added to an inquiry yet. */
  comingSoon?: boolean;
  /** Kept in the data but not shown on the website. */
  hidden?: boolean;
  sub: string;
  unit: 'kg' | 'jar' | 'bottle' | 'sachet';
  flavours: string[];
  tag: string;
  weight?: string;
}

const P3 = ['Chocolate', 'Mawa Kulfi', 'Coffee'];
// The six flavours the brochure lists for the protein powders. Whey Protein, Plant Protein and Yeast Protein all use this same list.
const POWDER_FLAVOURS = ['Mawa Kulfi', 'Chocolate', 'Cookies & Cream', 'Coffee', 'Belgian Chocolate', 'Brownie Chocolate'];
// The peanut butters of the brochure (smooth, crunchy and high-protein).
const PEANUT_FLAVOURS = ['Natural (Smooth/Crunch)', 'Chocolate (Smooth/Crunch)', 'Classic (Smooth/Crunch)', 'Elaichi (Smooth/Crunch)', 'America Classic (Smooth/Crunch)', 'White Chocolate Crispy', 'White Chocolate Crispy (High Protein)', 'Chocolate Crispy', 'Chocolate Crispy (High Protein)', 'Jaggery (High Protein)', 'Mango Chia Seeds'];

export const CATALOG: Product[] = [
  { id: 'wp57', templateCategory: 'whey-protein', group: 'protein', name: 'Whey Protein', sub: '', unit: 'kg', flavours: POWDER_FLAVOURS, tag: 'PROTEIN POWDER' },
  { id: 'wp40', templateCategory: 'whey-protein', group: 'protein', hidden: true, name: 'Whey Protein 40%', sub: '40% protein', unit: 'kg', flavours: P3, tag: '40% PROTEIN' },
  { id: 'wp30', templateCategory: 'whey-protein', group: 'protein', hidden: true, name: 'Whey Protein 30%', sub: '30% protein', unit: 'kg', flavours: P3, tag: '30% PROTEIN' },
  { id: 'wpi', templateCategory: 'whey-protein', group: 'protein', name: 'Whey Protein Isolate', sub: '90% protein', unit: 'kg', flavours: POWDER_FLAVOURS, tag: '90% ISOLATE' },
  { id: 'wpc', templateCategory: 'whey-protein', group: 'protein', name: 'Whey Protein Concentrate', sub: '80% protein', unit: 'kg', flavours: POWDER_FLAVOURS, tag: '80% CONCENTRATE' },
  { id: 'wp60', templateCategory: 'whey-protein', group: 'protein', name: 'Whey Protein 60%', sub: '60% protein · economical', unit: 'kg', flavours: POWDER_FLAVOURS, tag: '60% PROTEIN' },
  { id: 'gainer', templateCategory: 'whey-protein', group: 'protein', name: 'Mass Gainer', sub: 'Recovery blend · BCAA 2:1:1', unit: 'kg', flavours: POWDER_FLAVOURS, tag: 'MASS GAINER' },
  { id: 'wpe', templateCategory: 'whey-protein', group: 'protein', name: 'Whey Protein Blend', sub: 'Economy range', unit: 'kg', flavours: P3, tag: 'DAILY PROTEIN' },
  { id: 'yeast', templateCategory: 'whey-protein', group: 'protein', name: 'Yeast Protein', sub: 'Vegan protein', unit: 'kg', flavours: POWDER_FLAVOURS, tag: 'VEGAN PROTEIN' },
  { id: 'plant', templateCategory: 'whey-protein', group: 'protein', name: 'Plant Protein', sub: 'Vegan protein', unit: 'kg', flavours: POWDER_FLAVOURS, tag: 'PLANT BASED' },
  { id: 'cre', templateCategory: 'creatine', group: 'sports', name: 'Creatine Monohydrate', sub: 'Unflavoured or Lemon · 250 g jar', unit: 'jar', flavours: ['Unflavoured', 'Lemon'], tag: 'MONOHYDRATE', weight: '250 G' },
  { id: 'bcaa', templateCategory: 'bcaa-amino', group: 'sports', name: 'BCAA 2:1:1', sub: 'Tangy Orange · 250 g jar', unit: 'jar', flavours: ['Tangy Orange'], tag: '2:1:1 RECOVERY', weight: '250 G' },
  { id: 'pre', templateCategory: 'pre-workout', group: 'sports', name: 'Pre-Workout', sub: 'Fruit Punch · 250 g jar', unit: 'jar', flavours: ['Fruit Punch', 'Mix Fruit'], tag: 'ENERGY & FOCUS', weight: '250 G' },
  { id: 'eaa', templateCategory: 'bcaa-amino', group: 'sports', name: 'EAA', sub: 'Orange · 250 g jar', unit: 'jar', flavours: ['Orange'], tag: 'GAIN · RECOVER · REFUEL', weight: '250 G' },
  { id: 'fatburner', templateCategory: 'pre-workout', group: 'sports', name: 'Fat Burner', sub: 'Blueberry · 250 g jar', unit: 'jar', flavours: ['Blueberry'], tag: 'L-CARNITINE FORMULA', weight: '250 G' },
  { id: 'peanut', templateCategory: 'peanut-butter', cupLabel: 'label-500-g-3c00c5', group: 'food', name: 'Peanut Butter', sub: 'Smooth, crunchy & high-protein · jar', unit: 'jar', flavours: PEANUT_FLAVOURS, tag: 'PEANUT BUTTER' },
  { id: 'tea', templateCategory: '', group: 'food', name: 'Instant Protein Spiced Milk Tea', sub: 'Zero added sugar · 14 g sachet', unit: 'sachet', flavours: ['Masala Chai'], tag: 'PROTEIN TEA', weight: '14 G' },
  { id: 'mocha', templateCategory: '', group: 'food', name: 'Instant Protein Mocha Coffee', sub: 'Zero added sugar · 14 g sachet', unit: 'sachet', flavours: ['Mocha'], tag: 'PROTEIN COFFEE', weight: '14 G' },
  { id: 'biotin', templateCategory: '', group: 'well', name: 'Biotin', sub: '60 capsules', unit: 'bottle', flavours: ['Standard'], tag: 'DIETARY SUPPLEMENT', weight: '60 CAPSULES' },
  { id: 'd3k2', templateCategory: '', group: 'well', name: 'Vitamin D3 + K2', sub: '60 tablets', unit: 'bottle', flavours: ['Standard'], tag: 'DIETARY SUPPLEMENT', weight: '60 TABLETS' },
  { id: 'multi', templateCategory: '', group: 'well', name: 'Multivitamin', sub: '60 tablets', unit: 'bottle', flavours: ['Standard'], tag: 'DIETARY SUPPLEMENT', weight: '60 TABLETS' },
  { id: 'calc', templateCategory: '', group: 'well', name: 'Calcium', sub: '60 tablets', unit: 'bottle', flavours: ['Standard'], tag: 'DIETARY SUPPLEMENT', weight: '60 TABLETS' },
  { id: 'omega', templateCategory: '', group: 'well', name: 'Omega-3 1000 mg', sub: '60 softgels', unit: 'bottle', flavours: ['Standard'], tag: '1000 MG SOFTGELS', weight: '60 SOFTGELS' },
  { id: 'pcos', templateCategory: '', group: 'well', name: 'PCOS Support', sub: '60 tablets', unit: 'bottle', flavours: ['Standard'], tag: 'DIETARY SUPPLEMENT', weight: '60 TABLETS' },
  { id: 'liver', templateCategory: '', group: 'well', name: 'Liver Health', sub: '60 tablets', unit: 'bottle', flavours: ['Standard'], tag: 'DIETARY SUPPLEMENT', weight: '60 TABLETS' },
  { id: 'vitc', templateCategory: '', labelSize: '7 in × 7 cm', detailImage: '/products/vitamin-c-ingredients.png', group: 'well', name: 'Vitamin C', sub: '60 chewable tablets', unit: 'bottle', flavours: ['Standard'], tag: 'DIETARY SUPPLEMENT', weight: '60 CHEWABLES' },
  { id: 'gummies', templateCategory: '', group: 'well', name: 'Gummies', sub: '60 gummies', unit: 'bottle', flavours: ['Mixed Fruit', 'Orange', 'Strawberry'], tag: 'CHEWABLE GUMMIES', weight: '60 GUMMIES' },
  { id: 'drops', templateCategory: '', group: 'well', name: 'Drops', sub: '30 ml dropper bottle', unit: 'bottle', flavours: ['Unflavoured'], tag: 'LIQUID DROPS', weight: '30 ML' },
];

// From Instant Protein Spiced Milk Tea to the end of the list, every product is "Coming soon".
const SOON_FROM = CATALOG.findIndex((p) => p.id === 'tea');
CATALOG.forEach((p, i) => {
  if (i >= SOON_FROM) p.comingSoon = true;
});

export const GROUPS: Record<GroupId, { title: string; note: string }> = {
  protein: { title: 'Protein powders', note: '500 g, 1 kg or 2 kg jars' },
  sports: { title: 'Sports supplements', note: '250 g jars' },
  food: { title: 'Peanut butter & instant mixes', note: 'Peanut butter jars and 14 g instant sachets' },
  well: { title: 'Wellness range', note: 'Bottles of 60' },
};

export const MIN_QTY = 50;

export const productById = (id: string) => CATALOG.find((p) => p.id === id);
