import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface Props {
  title: string;
  description: string;
  /** Keep the page out of search results (order steps, thank-you pages). */
  noindex?: boolean;
  /** Structured data (schema.org) for the page, as plain objects. */
  jsonLd?: object[];
}

const SITE = 'Gomzi Life Science LLP';
const OG_IMAGE = '/og-gomzi.png';

/** Sets (or creates) one <meta> tag. */
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** The page's own title, description, canonical link, social-sharing tags and structured data, set for search engines and link previews. */
export function Seo({ title, description, noindex, jsonLd }: Props) {
  const { pathname } = useLocation();
  const json = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const origin = window.location.origin;
    const url = origin + pathname;
    const image = origin + OG_IMAGE;
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:site_name', SITE);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
    if (!json) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.seo = 'page';
    script.text = json;
    document.head.appendChild(script);
    return () => script.remove();
  }, [title, description, noindex, pathname, json]);

  return null;
}
