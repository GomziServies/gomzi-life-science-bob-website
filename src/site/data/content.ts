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
  wpi: {serving:'35 g (1 level scoop)', rows:[['Energy','113.47 kcal','378.23 kcal'],['Total protein','25.05 g','73.39 g'],['Carbohydrates','5.50 g','14.69 g'],['Added sugar','0 g','0 g'],['Dietary fibre','1.78 g','5.39 g'],['Total fat','1.92 g','2.96 g'],['Saturated fatty acid','0.66 g','2.0 g'],['Polyunsaturated fatty acid','0.52 g','1.57 g'],['Monounsaturated fatty acid','1.54 g','4.66 g'],['Trans fatty acid','0.04 g','0.12 g'],['Cholesterol','0.02 g','0.06 g'],['Potassium','158.8 mg','481.21 mg'],['Sodium','135.5 mg','410.60 mg']]},
  wpc: {serving:'35 g (1 level scoop)', rows:[['Energy','133.72 kcal','382.06 kcal'],['Protein','24 g','68.57 g'],['Total carbohydrates','5.38 g','15.37 g'],['Total sugar','5.3 g','15.14 g'],['Added sugars','0 g','0 g'],['Total fat','1.8 g','5.14 g'],['Saturated fatty acid','0.62 g','1.77 g'],['Polyunsaturated fatty acid','0.48 g','1.37 g'],['Monounsaturated fatty acid','0.99 g','2.83 g'],['Trans fat','0 g','0 g'],['Cholesterol','28 mg','80 mg'],['Potassium','230 mg','657.14 mg'],['Sodium','150 mg','428.57 mg']]},
  wp60: {serving:'35 g (1 level scoop)', rows:[['Energy','135 kcal','386 kcal'],['Protein','22 g','62.9 g'],['Carbohydrate','8 g','22.9 g'],['Total sugars','3.5 g','10 g'],['Added sugars','0 g','0 g'],['Total fat','1.7 g','4.9 g'],['Saturated fat','1.1 g','3.1 g'],['Trans fat','0 g','0 g'],['Sodium','110 mg','314 mg']]},
  gainer: {serving:'35 g (1 level scoop)', rows:[['Energy','—','387.01 kcal'],['Total protein','—','17.5 g'],['Carbohydrates','—','76.8 g'],['Added sugar','—','0 g'],['Dietary fibre','—','1.15 g'],['Total fat','—','1.09 g'],['Saturated fatty acid','—','0.47 g'],['Polyunsaturated fatty acid','—','0.38 g'],['Monounsaturated fatty acid','—','0.97 g'],['Trans fatty acid','—','0.07 g'],['Cholesterol','—','0 g'],['Potassium','—','172.67 mg'],['Sodium','—','138.89 mg'],['Recovery blend BCAA 2:1:1 · L-Leucine','—','1333 mg'],['L-Isoleucine','—','666 mg'],['L-Valine','—','666 mg']]},
  peanut: {serving:'32 g', rows:[['Energy','199 kcal','622 kcal'],['Protein','9 g','28 g'],['Carbohydrate','5 g','16 g'],['Dietary fibre','2 g','6 g'],['Total sugar','1 g','3 g'],['Added sugar','0 g','0 g'],['Total fat','14 g','45 g'],['Saturated fat','2 g','7 g'],['Polyunsaturated fat','5 g','15 g'],['Monounsaturated fat','7 g','23 g'],['Trans fat','0 g','0 g'],['Cholesterol','0 mg','0 mg'],['Sodium','53 mg','165 mg']]},
  tea: {serving:'14 g', rows:[['Energy','46.5 kcal','332 kcal'],['Protein','4.6 g','32.8 g'],['Total carbohydrates','6.8 g','48.5 g'],['Total sugars','5.5 g','39.3 g'],['Added sugars','0 g','0 g'],['Dietary fibre','0.2 g','1.5 g'],['Total fat','0.1 g','0.8 g'],['Sodium','123.6 mg','883 mg']]},
  mocha: {serving:'14 g', rows:[['Energy','45.3 kcal','323.6 kcal'],['Protein','4.4 g','31.4 g'],['Total carbohydrates','6.2 g','44.3 g'],['Total sugars','5.2 g','37.1 g'],['Added sugars','0 g','0 g'],['Dietary fibre','0.2 g','1.4 g'],['Total fat','0.14 g','1 g'],['Sodium','117.3 mg','838 mg']]},
  yeast: {serving:'35 g', rows:[['Energy','~126 kcal','~360 kcal'],['Protein','24.00 g','68.57 g'],['Total carbohydrates','~2.80 g','~8.00 g'],['Total sugars','~0 g','~0 g'],['Added sugars','0 g','0 g'],['Total fat','~0.74 g','~2.10 g'],['Saturated fat','~0.18 g','~0.50 g'],['Trans fat','0 g','0 g'],['Sodium','~70 mg','~200 mg'],['Dietary fibre','~3.50 g','~10.00 g']]}
};

export const MADE_TO_ORDER = [
  'IGNITE energy drink mix',
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
