/** The range, in the eight sections shown as tiles on the home page. Each opens the Products page narrowed to its products (`ids`), or the made-to-order tab. */
export interface Collection {
  id: string;
  title: string;
  /** The products in it (catalogue ids); the first ones are drawn on the tile. */
  ids: string[];
  /** A short line under the title. */
  note: string;
  /** Opens the made-to-order tab instead of a list of products. */
  mto?: boolean;
}

export const COLLECTIONS: Collection[] = [
  { id: 'whey', title: 'Whey Protein', ids: ['wp57', 'wpi', 'wpc', 'wp60', 'wpe'], note: 'Isolate, concentrate and blends' },
  { id: 'plant', title: 'Plant & Yeast Protein', ids: ['plant', 'yeast'], note: 'Vegan and fermented proteins' },
  { id: 'gainer', title: 'Mass Gainer', ids: ['gainer'], note: 'Recovery blend, BCAA 2:1:1' },
  { id: 'aminos', title: 'Creatine & Aminos', ids: ['cre', 'bcaa', 'eaa'], note: 'Strength and recovery' },
  { id: 'pre', title: 'Pre-Workout & Fat Burner', ids: ['pre', 'fatburner'], note: 'Energy and focus' },
  { id: 'food', title: 'Peanut Butter & Instant Mixes', ids: ['peanut', 'tea', 'mocha'], note: 'Spreads and 14 g sachets' },
  { id: 'well', title: 'Wellness Range', ids: ['biotin', 'd3k2', 'multi', 'calc', 'omega', 'pcos', 'liver', 'vitc', 'gummies', 'drops'], note: 'Bottles, gummies and drops' },
  { id: 'mto', title: 'Made to Order', ids: ['pre'], note: 'Your own formula', mto: true },
];

export const collectionById = (id: string | null): Collection | undefined => COLLECTIONS.find((c) => c.id === id);
