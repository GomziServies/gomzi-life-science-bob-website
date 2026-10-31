/** The Gomzi Life Science LLP logo (mark and wordmark), from the company's own artwork. */
export function Logo({ height = 42 }: { height?: number; light?: boolean }) {
  return <img src="/brand/gomzi-life-science-logo.png" alt="Gomzi Life Science LLP" height={height} style={{ height, width: 'auto', display: 'block' }} />;
}
