/** The words of the "How it works" and "FAQ" pages. Everything here comes from how the shop really works: its order rules, steps and offer. */

export interface StepDetail {
  title: string;
  summary: string;
  /** What the customer does at this step. */
  doList: string[];
  /** A good thing to know. */
  note: string;
}

export const HOW_STEPS: StepDetail[] = [
  {
    title: 'Add products',
    summary: 'Browse the range and add what you want to your inquiry. Mix products freely.',
    doList: [
      'Open a section, or the whole Products page, and press "Add to inquiry" on each product.',
      'Pick a flavour for each product. Protein comes in 500 g, 1 kg or 2 kg jars.',
      'Set the quantity: protein in steps of 10 kg, every other product in steps of 50 jars or bottles.',
    ],
    note: 'Protein needs 50 kg in total across all your protein products, and you can mix flavours. Each sports or wellness product needs 50 jars or bottles.',
  },
  {
    title: 'Share your details',
    summary: 'Tell us who the brand belongs to, so every label carries your name and address.',
    doList: [
      'Enter your name, brand name, phone and address.',
      'Confirm your phone number with a one-time code (OTP).',
      'Your brand details are printed on the label panels and shown on your 3D preview.',
    ],
    note: 'The OTP keeps your inquiry safe and lets our team reach the right person when they call you.',
  },
  {
    title: 'Pick your labels',
    summary: 'Choose a label for every product, and add your logo.',
    doList: [
      'Open a ready template for the product, or let AI Studio make designs for you.',
      'Upload your logo and place it where you want it. Our guide shows the exact label area and the picture size a sharp print needs.',
      'Turn the 3D jar, pouch or sachet to see the front, the back and the sides before you decide.',
      'No time to design? Leave the label to our design team and the product joins your inquiry marked "Made by our team".',
    ],
    note: 'Our design team opens every saved banner, makes print-ready adjustments and prepares the CMYK file.',
  },
  {
    title: 'Review everything',
    summary: 'See each product with its own label, quantity and flavour on one page.',
    doList: [
      'Check the label on every product, front and back.',
      'Check flavours and quantities. The page tells you in plain words if a quantity is below the minimum or above what is in stock.',
      'Go back and change anything you like before you send.',
    ],
    note: 'Nothing is final yet. Reviewing costs nothing and you can change your mind.',
  },
  {
    title: 'Send your inquiry',
    summary: 'Send it to our expert team. They check it and call you.',
    doList: [
      'Press send. Your inquiry, labels and details reach our team at once.',
      'Our expert team reviews your products and labels and calls you to confirm the details.',
      'Once your label is approved and the order is confirmed, production and dispatch start.',
    ],
    note: 'For ready formulations in stock, dispatch happens within 5 days of label approval and order confirmation.',
  },
];

/** The two ways to launch, side by side. */
export const WAYS: { title: string; tag: string; rows: [string, string][] }[] = [
  {
    title: 'Ready formulation',
    tag: 'Fastest',
    rows: [
      ['Formula and nutrition table', 'Fixed, already made and tested'],
      ['Time to dispatch', 'Within 5 days of label approval and order confirmation, for products in stock'],
      ['Minimum', '50 kg of protein in total, or 50 jars or bottles per product'],
      ['Your part', 'Choose products and flavours, design your label, send your inquiry'],
    ],
  },
  {
    title: 'Your own formula',
    tag: 'Made for you',
    rows: [
      ['Formula and nutrition table', 'Yours: custom whey, custom pre-workout or a brand-new product'],
      ['Time to dispatch', 'Scheduled once you approve the sample, so it takes longer'],
      ['Revisions', 'Revised until you approve (a brand-new product has unlimited revisions)'],
      ['Your part', 'Talk to our team, approve the sample, then label and order as usual'],
    ],
  },
];

/** What each product family comes in. */
export const PACKS: { title: string; text: string }[] = [
  { title: 'Protein powders', text: '500 g, 1 kg or 2 kg jars, also as stand-up pouches and sachets.' },
  { title: 'Sports supplements', text: '250 g jars: creatine, BCAA, EAA, pre-workout and fat burner.' },
  { title: 'Peanut butter & instant mixes', text: 'Peanut butter jars and 14 g instant sachets.' },
  { title: 'Wellness range', text: 'Bottles of 60, with gummies and drops.' },
];

export interface FaqGroup {
  id: string;
  title: string;
  items: [string, string][];
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'ordering',
    title: 'Ordering',
    items: [
      ['How do I order?', 'Pick your products and a label for each, then send your inquiry. Our expert team calls you to confirm the details.'],
      ['Why do I confirm my phone with an OTP?', 'It confirms the number is yours, keeps your inquiry safe and lets our team reach the right person when they call.'],
      ['Can I order several different products together?', 'Yes. Add as many products as you like to one inquiry. Protein products count together towards the 50 kg minimum, and flavours can be mixed.'],
      ['What happens after I send my inquiry?', 'Our expert team reviews your products and labels and calls you to confirm the details. Your order goes ahead once your label is approved and the order is confirmed.'],
      ['Are all products available to order now?', 'Products marked "Coming soon" cannot be ordered yet. Every other product is ready to carry your label.'],
    ],
  },
  {
    id: 'quantities',
    title: 'Quantities & stock',
    items: [
      ['What is the minimum order?', '50 kg for protein (you can mix flavours), and 50 jars or bottles for each sports or wellness product.'],
      ['How does the quantity change when I press + or −?', 'Protein moves in steps of 10 kg. Sports, food and wellness products move in steps of 50 jars or bottles.'],
      ['What jar sizes do protein powders come in?', '500 g, 1 kg or 2 kg. Protein is also available as stand-up pouches and sachets.'],
      ['What if I ask for more than is in stock?', 'The inquiry page tells you, in plain words, how much of that flavour is in stock, so you can lower the quantity or pick another flavour.'],
    ],
  },
  {
    id: 'labels',
    title: 'Labels & design',
    items: [
      ['I can’t design. What are my options?', 'Use our ready templates for every product, or let AI Studio make designs for you. Pick the one you like and send your inquiry.'],
      ['Can I add my own logo?', 'Yes. Upload it and place it on the label. The editor shows the exact logo area and the picture size you need for a sharp print.'],
      ['Can I see my label on the jar before I order?', 'Yes. Every product has a 3D preview of the jar, pouch or sachet that you can turn to see all sides.'],
      ['What if I would rather not design at all?', 'Choose "leave it to the design team". The product joins your inquiry marked as made by our team, and our designers prepare the label.'],
      ['Who finalises my banner?', 'Our design team opens your saved banner, makes print-ready adjustments and prepares the CMYK file.'],
    ],
  },
  {
    id: 'formulas',
    title: 'Formulas & products',
    items: [
      ['Can I change the formula or nutrition table?', 'The nutrition table of each ready product is fixed. For your own formula (custom whey, custom pre-workout or a brand-new product), ask our team and we will call you.'],
      ['What are made-to-order products?', 'Custom formulations that are planned after a short call with our formulation team, such as the IGNITE energy drink mix.'],
      ['Are there extra charges for my own formula?', 'Your own formula has a one-time development charge, offered per product. Our team will explain it when they call you.'],
      ['How many changes can I make to my own formula?', 'A custom whey or pre-workout is revised until you approve it, and a brand-new product has unlimited revisions.'],
    ],
  },
  {
    id: 'timing',
    title: 'Timing & quality',
    items: [
      ['Is 5 days real?', 'Yes, for ready formulations that are in stock. The 5 days start once your label is approved and the order is confirmed. Custom formulations take longer because you approve a sample first.'],
      ['What is the shelf life?', '18 months on every batch.'],
      ['Where are the products made?', 'At our own facility in Surat, Gujarat, where we manufacture, fill and label your jars.'],
      ['Which certifications do you hold?', 'FSSAI, GMP, HACCP, Halal and Kosher, and we are FDA registered. The seals are shown on our home page.'],
    ],
  },
];

/** Every question and answer, flat: used for the page's search tags. */
export const ALL_FAQ: [string, string][] = FAQ_GROUPS.flatMap((g) => g.items);
