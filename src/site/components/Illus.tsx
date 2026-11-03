// Pictures dropped into src/assets/process (webp, png or jpg, named like the illustration, e.g. hero.webp) take the place of the built-in drawings in public/process.
const found = import.meta.glob('../../assets/process/*.{webp,png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const custom: Record<string, string> = Object.fromEntries(Object.entries(found).map(([path, url]) => [path.split('/').pop()!.replace(/\.[^.]+$/, ''), url]));

/** One of the page illustrations: your own picture when there is one in src/assets/process, otherwise the built-in drawing. */
export function Illus({ name, alt, width, height, eager }: { name: string; alt: string; width: number; height: number; eager?: boolean }) {
  const src = custom[name] ?? `${import.meta.env.BASE_URL}process/${name}.svg`;
  return <img src={src} width={width} height={height} alt={alt} decoding="async" loading={eager ? undefined : 'lazy'} fetchPriority={eager ? 'high' : undefined} />;
}
