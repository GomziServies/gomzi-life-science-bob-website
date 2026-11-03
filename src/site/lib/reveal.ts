import { useEffect } from 'react';

/** Sections below the first screen fade and rise into place as they are scrolled to. Off for visitors who prefer less motion; nothing is hidden without JavaScript. */
export function useReveal(selector = '.site .section, .site .clients, .site .reviews, .site .learn, .site .cta') {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.9);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).classList.add('reveal-in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.04 },
    );
    els.forEach((el) => {
      el.classList.add('reveal');
      io.observe(el);
    });
    return () => {
      io.disconnect();
      els.forEach((el) => el.classList.remove('reveal', 'reveal-in'));
    };
  }, [selector]);
}
