// Details from the Gomzi Life Science blueprint that the product list itself does not carry.

export const STOCK: Record<string, Record<string, number>> = {
  "wp57": {
    "Chocolate": 680,
    "Mawa Kulfi": 950,
    "Coffee": 680
  },
  "wp40": {
    "Chocolate": 680,
    "Mawa Kulfi": 950,
    "Coffee": 680
  },
  "wp30": {
    "Chocolate": 220,
    "Mawa Kulfi": 350,
    "Coffee": 220
  },
  "wpe": {
    "Chocolate": 220,
    "Mawa Kulfi": 350,
    "Coffee": 220
  },
  "yeast": {
    "Coffee": 100
  },
  "plant": {
    "Chocolate": 100
  },
  "cre": {
    "Unflavoured": 500
  },
  "crel": {
    "Lemon": 500
  },
  "bcaa": {
    "Tangy Orange": 100
  },
  "pre": {
    "Fruit Punch": 500
  },
  "biotin": {
    "Standard": 500
  },
  "d3k2": {
    "Standard": 500
  },
  "multi": {
    "Standard": 500
  },
  "calc": {
    "Standard": 500
  },
  "omega": {
    "Standard": 600
  },
  "pcos": {
    "Standard": 500
  },
  "liver": {
    "Standard": 500
  },
  "vitc": {
    "Standard": 500
  },
  "gummies": {
    "Mixed Fruit": 500,
    "Orange": 500,
    "Strawberry": 500
  },
  "drops": {
    "Unflavoured": 500
  }
};

/** Fixed nutrition tables (approximate values): [nutrient, per serving, per 100 g]. Products without one use the standard note. */
export const NUTRITION: Record<string, { serving: string; rows: string[][] }> = {
  plant: {serving:'35 g', rows:[['Energy','143.5 kcal','410 kcal'],['Protein','25.00 g','71.43 g'],['Total carbohydrate','4.20 g','12.00 g'],['Total sugars','0.70 g','2.00 g'],['Added sugars','0 g','0 g'],['Total fat','1.93 g','5.50 g'],['Saturated fat','0.35 g','1.00 g'],['Trans fat','0 g','0 g'],['Cholesterol','0 mg','0 mg'],['Sodium','140 mg','400 mg'],['Potassium','245 mg','700 mg']]},
  yeast: {serving:'35 g', rows:[['Energy','~126 kcal','~360 kcal'],['Protein','24.00 g','68.57 g'],['Total carbohydrates','~2.80 g','~8.00 g'],['Total sugars','~0 g','~0 g'],['Added sugars','0 g','0 g'],['Total fat','~0.74 g','~2.10 g'],['Saturated fat','~0.18 g','~0.50 g'],['Trans fat','0 g','0 g'],['Sodium','~70 mg','~200 mg'],['Dietary fibre','~3.50 g','~10.00 g']]}
};

export const MADE_TO_ORDER = [
  '90% Whey Protein Isolate',
  '80% Whey Protein Concentrate',
  'Mass Gainer',
  'EAA',
  'Fat Burner',
  'IGNITE energy drink mix',
  'Instant Protein Spiced Milk Tea',
  'Instant Protein Mocha Coffee',
];

/** Your own formula: one-time development charges, offered per product. */
export const CUSTOM_FORMULAS = {
  whey: { label: 'Your own whey formula', note: 'Revised until you approve' },
  pre: { label: 'Your own pre-workout', note: 'Revised until you approve' },
  novel: { label: 'A brand-new product', note: 'Unlimited revisions' },
};
export const customFor = (id: string, group: string): (keyof typeof CUSTOM_FORMULAS)[] => (group === 'protein' ? ['whey', 'novel'] : id === 'pre' ? ['pre', 'novel'] : ['novel']);

export const FAQ: [string, string][] = [
  ['Is 5 days real?', 'Yes, for ready formulations that are in stock. The 5 days start once your label is approved and the order is confirmed. Custom formulations take longer because you approve a sample first.'],
  ['What is the minimum order?', '50 kg for protein (you can mix flavours), and 50 jars or bottles for each sports or wellness product.'],
  ['Can I change the formula or nutrition table?', 'The nutrition table of each ready product is fixed. For your own formula (custom whey, custom pre-workout or a brand-new product), ask our team and we will call you.'],
  ['I can’t design. What are my options?', 'Use our ready templates for every product, or let AI Studio make designs for you. Pick the one you like and send your inquiry.'],
  ['Who finalises my banner?', 'Our design team opens your saved banner, makes print-ready adjustments and prepares the CMYK file.'],
  ['How do I order?', 'Pick your products and a label for each, then send your inquiry. Our expert team calls you to confirm the details.'],
];

export const CERTS = ['FSSAI', 'ISO 22000:2018', 'GMP', 'HACCP', 'Halal', 'Kosher', 'FDA'];

/**
 * Official certification logos, when you have the files: put them in `banner-website/public/certs/` and list them here,
 * for example `{ FSSAI: '/certs/fssai.png', ISO: '/certs/iso.png' }`. A seal without a file is drawn as in the blueprint.
 */
export const CERT_LOGOS: Record<string, string> = {
  FSSAI: '/certs/fassai.webp',
  GMP: '/certs/gmp.webp',
  HACCP: '/certs/haccp.webp',
  HALAL: '/certs/halal.webp',
  KOSHER: '/certs/kosher.webp',
  FDA: '/certs/FDA-logo.webp',
};

/** The company website: this order site links to its policy and service pages. */
export const MAIN_SITE = 'https://www.gomzilifesciences.in';

export const PACK_SIZES = [
  { kg: 0.5, label: '500 g' },
  { kg: 1, label: '1 kg' },
  { kg: 2, label: '2 kg' },
];

export const COMPANY = {
  name: 'Gomzi Life Science LLP',
  address: '443 to 445, 1st Floor, RJD Textile Park, At. Ichchhapor, Hazira Road, Surat, Gujarat 394510',
  phone: '+91 83200 77993',
  tel: '+918320077993',
  site: 'gomzilifesciences.in',
};
