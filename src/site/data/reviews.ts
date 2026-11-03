/** What our clients say. The section on the home page shows (and scrolls) whatever is listed, and stays hidden while this list is empty. */
export interface Review {
  /** The brand, and the file of its logo in public/clients (without .png), such as 'valeo'. */
  brand: string;
  logo: string;
  /** What they said. */
  text: string;
  /** Who said it and where from, such as "Rahul Shah, Founder · Mumbai". Leave out to show no line. */
  by?: string;
  /** 1 to 5; leave out to show no stars. */
  stars?: number;
}

// DRAFT TEXT: these quotes were written as placeholders from facts about our service (5-day dispatch, own label design, Surat plant).
// Before they are shown to the public, replace each with the client's real, approved words, and add `by` and `stars` once the client agrees.
export const REVIEWS: Review[] = [
  { brand: 'Yodha Fuel', logo: 'yodha-fule', text: 'Our first batch was filled, labelled and dispatched on the promised day. A smooth start for a new brand.' },
  { brand: 'One Shot Energy', logo: 'one-shot-energy', text: 'Designing our own label right on the website was easy, and the jars looked exactly like the 3D preview.' },
  { brand: 'FZ Nutrition', logo: 'fz', text: 'The team guided us on flavours and pack sizes, and kept us updated until the order reached us.' },
  { brand: 'Dexter King Nutrition', logo: 'dexter-king', text: 'Clean packing, a neat label fit and the quality we wanted for our range. We reorder with confidence.' },
  { brand: 'War Ant Nutrition', logo: 'ant-war', text: 'From formulation to finished jars, everything came from one place. That saved us a lot of running around.' },
  { brand: 'NX Nutri Lab', logo: 'nx-nutrilabs', text: 'Responsive team and clear communication. Our questions on ingredients were answered the same day.' },
  { brand: 'Valeo Nutrition', logo: 'valeo', text: 'The flavour range and the label options let us launch a full line without a large first order.' },
  { brand: 'Aura Whey', logo: 'aura-whey', text: 'The product looks premium on the shelf, and the team stayed with us through every step of the label.' },
  { brand: 'Go Rich Nutrition', logo: 'go-rich-nutrition', text: 'A dependable manufacturing partner: consistent batches, honest timelines and good support.' },
  { brand: 'Mcore Nutrition', logo: 'mcore-nutrition', text: 'We could see our label on the jar before ordering. That removed the guesswork for us.' },
  { brand: 'Steel Stage', logo: 'steel-stage', text: 'Quick to respond and easy to work with. The finished packs matched what we approved.' },
];
