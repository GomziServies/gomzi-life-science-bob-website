/** The brands that already sell under their own label made by us: logos that scroll by, round and round. */
const CLIENTS: [string, string][] = [
  ['Yodha Fuel', 'yodha-fule'],
  ['One Shot Energy', 'one-shot-energy'],
  ['FZ Nutrition', 'fz'],
  ['Dexter King Nutrition', 'dexter-king'],
  ['War Ant Nutrition', 'ant-war'],
  ['NX Nutri Lab', 'nx-nutrilabs'],
  ['Valeo Nutrition', 'valeo'],
  ['Aura Whey', 'aura-whey'],
  ['Go Rich Nutrition', 'go-rich-nutrition'],
  ['Mcore Nutrition', 'mcore-nutrition'],
  ['Steel Stage', 'steel-stage'],
];

export function Clients() {
  const base = import.meta.env.BASE_URL;
  const row = (copy: number) =>
    CLIENTS.map(([name, file]) => (
      <li key={`${copy}-${file}`} aria-hidden={copy > 0 || undefined}>
        <img src={`${base}clients/${file}.png`} alt={copy > 0 ? '' : name} loading="lazy" draggable={false} />
      </li>
    ));
  return (
    <section className="clients" aria-label="Our clients">
      <div className="wrap">
        <span className="eyebrow">Our clients</span>
        <h2>Brands that already trust Gomzi</h2>
      </div>
      <div className="clients-view">
        <ul className="clients-track">
          {row(0)}
          {row(1)}
        </ul>
      </div>
    </section>
  );
}
