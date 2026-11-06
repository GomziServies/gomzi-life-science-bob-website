import { useSyncExternalStore } from 'react';

/** Shared state of the shop's 3D pictures: whether the models are loaded, how many first pictures are drawn, whether the page has been released from its loading screen, and the one clock every card changes pack by. */
/** The page waits behind its loading screen for the pictures of the cards at the top (what a visitor sees first); the other cards go on drawing right after, in order, usually before they are scrolled to. */
const FIRST_PICTURES = 9;
/** Show the products straight away instead of holding the page behind the loading screen until the first 3D pictures are drawn. */
const SHOW_AT_ONCE = true;
/** The longest the loading screen is ever shown. */
const MAX_WAIT_MS = 45000;
const CHANGE_MS = 3000;

let started = false;
let modelsLoaded = false;
let pictures = 0;
let released = false;
let tick = 0;
let clock: number | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const release = () => {
  if (released) return;
  released = true;
  emit();
  // every card changes pack at the same moment, once the page is shown
  clock = window.setInterval(() => {
    tick += 1;
    emit();
  }, CHANGE_MS);
};
const check = (needed: number) => {
  if (modelsLoaded && pictures >= needed) release();
};

/** Starts loading every 3D model at once; the page is shown when they are all loaded and the first cards have their first picture. */
export function startPreload(cardsAtTop: number) {
  if (started) return;
  started = true;
  const needed = Math.min(FIRST_PICTURES, Math.max(0, cardsAtTop));
  void import('./labelArt').then((m) => m.warmLabelFonts());
  void import('../components/JarScene')
    .then((m) => m.preloadModels())
    .catch(() => undefined)
    .finally(() => {
      modelsLoaded = true;
      emit();
      check(needed);
    });
  // the cards report their pictures: see notePicture
  neededPictures = needed;
  // the page is shown at once: every card shows its quick drawn jar until its 3D picture is ready, then swaps to it
  // (waiting behind a loading screen for the first pictures kept the products hidden for half a minute on a first visit)
  if (SHOW_AT_ONCE) release();
  else window.setTimeout(release, MAX_WAIT_MS); // never keep the page hidden for longer than this
}
let neededPictures = FIRST_PICTURES;

/** A page that shows product cards asks for the loading screen again until its first pictures are drawn (the models are already loaded after the first time). */
export function beginPage(cards: number) {
  if (!started) {
    startPreload(cards);
    return;
  }
  const needed = Math.min(FIRST_PICTURES, Math.max(0, cards));
  neededPictures = needed;
  pictures = 0;
  if (needed === 0 || SHOW_AT_ONCE) return;
  released = false;
  if (clock) window.clearInterval(clock);
  clock = undefined;
  emit();
  window.setTimeout(release, MAX_WAIT_MS);
}

/** A card has drawn its first picture. */
export function notePicture() {
  pictures += 1;
  emit();
  check(neededPictures);
}

export const useLoading3d = () => {
  const loaded = useSyncExternalStore(subscribe, () => (modelsLoaded ? 1 : 0));
  const shown = useSyncExternalStore(subscribe, () => pictures);
  const done = useSyncExternalStore(subscribe, () => released);
  return { done, loaded: loaded === 1, pictures: shown, needed: neededPictures };
};
/** The number of the current change: a card shows its pack number `tick` (round the packs it has). */
export const useTick = () => useSyncExternalStore(subscribe, () => tick);
export const pageReleased = () => released;
export const stopClock = () => clock && window.clearInterval(clock);
