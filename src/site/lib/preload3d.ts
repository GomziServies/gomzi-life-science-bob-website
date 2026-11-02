import { useSyncExternalStore } from 'react';

/** Shared state of the shop's 3D pictures: whether the models are loaded, how many first pictures are drawn, whether the page has been released from its loading screen, and the one clock every card changes pack by. */
const FIRST_PICTURES = 6;
const MAX_WAIT_MS = 30000;
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
  void import('../components/JarScene')
    .then((m) => m.preloadModels())
    .catch(() => undefined)
    .finally(() => {
      modelsLoaded = true;
      emit();
      check(needed);
    });
  window.setTimeout(release, MAX_WAIT_MS); // never keep the page hidden for longer than this
  // the cards report their pictures: see notePicture
  neededPictures = needed;
}
let neededPictures = FIRST_PICTURES;

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
