import { ALL_FAQ, HOW_STEPS } from '../data/guides';
import { Seo } from './Seo';

/** Search tags and structured data for the How it works page (a HowTo) and the FAQ page (a FAQPage). */
export function GuideSeo({ kind }: { kind: 'how' | 'faq' }) {
  if (kind === 'how') {
    return (
      <Seo
        title="How It Works: Launch Your Supplement Brand in 5 Steps | Gomzi"
        description="See every step of launching your own supplement brand with Gomzi: add products, share your details, design your label, review and send. Dispatch within 5 days."
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to launch your own supplement brand with Gomzi Life Science',
            step: HOW_STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: `${s.summary} ${s.doList.join(' ')}` })),
          },
        ]}
      />
    );
  }
  return (
    <Seo
      title="FAQ: Orders, Minimums, Labels & Delivery | Gomzi"
      description="Answers about minimum orders, quantities, label design, your own formula, the 5-day dispatch and shelf life for private-label supplements from Gomzi."
      jsonLd={[
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: ALL_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
      ]}
    />
  );
}
