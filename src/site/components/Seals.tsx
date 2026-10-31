import { CERT_LOGOS } from '../data/content';

// The certification seals as drawn on the Gomzi Life Science blueprint: [name, status, colour].
const SEALS: [string, string, string][] = [
  ['FSSAI', 'Licensed', '#1F4E9A'],
  ['ISO', '22000:2018', '#1A237E'],
  ['GMP', 'Certified', '#2E7D32'],
  ['HACCP', 'Certified', '#0277BD'],
  ['HALAL', 'Certified', '#00695C'],
  ['KOSHER', 'Certified', '#6A1B9A'],
  ['FDA', 'Approved', '#0D47A1'],
];

function Seal({ name, status, color }: { name: string; status: string; color: string }) {
  const logo = CERT_LOGOS[name];
  if (logo) {
    return (
      <div className="seal" title={`${name} ${status}`}>
        <img src={logo} alt={`${name} ${status}`} />
      </div>
    );
  }
  const fontSize = name.length > 5 ? 9.5 : name.length > 4 ? 11 : 13;
  return (
    <div className="seal" title={`${name} ${status}`}>
      <svg viewBox="0 0 60 60" role="img" aria-label={`${name} ${status}`}>
        <circle cx="30" cy="30" r="29" fill="#fff" stroke="#E3E6EA" />
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          return <circle key={i} cx={30 + 26.5 * Math.cos(angle)} cy={30 + 26.5 * Math.sin(angle)} r="1.1" fill={color} />;
        })}
        <circle cx="30" cy="30" r="22" fill={color} />
        <path d="M30 12.5l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="#FFD54F" />
        <text x="30" y="35" textAnchor="middle" fontFamily="Plus Jakarta Sans, Arial, sans-serif" fontWeight="800" fontSize={fontSize} fill="#fff">{name}</text>
        <text x="30" y="43.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, Arial, sans-serif" fontWeight="600" fontSize="5.2" fill="#fff" opacity=".85">{status}</text>
      </svg>
    </div>
  );
}

/** "Certified and approved by": the seven certification seals. Official logo images can replace any seal (see CERT_LOGOS). */
export function Seals({ label = true }: { label?: boolean }) {
  return (
    <div className="seals" aria-label="Certifications">
      {label && <span className="seals-label">Certified and approved by</span>}
      {SEALS.map(([name, status, color]) => (
        <Seal key={name} name={name} status={status} color={color} />
      ))}
    </div>
  );
}
