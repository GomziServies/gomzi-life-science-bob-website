import Lenis from 'lenis';

let lenis: Lenis | null = null;

/** Eased, inertial mouse-wheel and keyboard scrolling for the whole shop. Touch screens keep their own native momentum. Off for visitors who prefer less motion. */
export function startSmoothScroll(): () => void {
  if (lenis || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined;
  const instance = new Lenis({ autoRaf: true, lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, anchors: true, allowNestedScroll: true });
  lenis = instance;
  return () => {
    instance.destroy();
    if (lenis === instance) lenis = null;
  };
}

/** Glides to the top of the page (the same way whether or not smooth scrolling is on). */
export const scrollToTop = () => (lenis ? lenis.scrollTo(0, { duration: 1.1 }) : window.scrollTo({ top: 0, behavior: 'smooth' }));

/** Holds the page still while the loading screen is up, and lets it move again afterwards. */
export const lockScroll = (lock: boolean) => (lock ? lenis?.stop() : lenis?.start());
