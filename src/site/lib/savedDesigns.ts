/**
 * The editor's design of each saved label, kept in this browser (IndexedDB: a design can hold large pictures) so "Edit
 * label" reopens the label exactly as it was saved, not the template gallery. One design per product: saving again replaces it.
 */
const DB = 'gomzi-saved-designs';
const STORE = 'designs';

export interface SavedDesign {
  /** When the label was saved (the banner's `savedAt`), so a design is only reopened for the label it belongs to. */
  savedAt: number;
  doc: unknown;
}

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export async function saveDesign(productId: string, savedAt: number, doc: unknown): Promise<void> {
  if (typeof indexedDB === 'undefined' || doc == null) return;
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ savedAt, doc } satisfies SavedDesign, productId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* storage unavailable: "Edit label" then opens the label's template instead */
  }
}

/** The saved design of a product's label, or null when there is none (or it belongs to an older save than `savedAt`). */
export async function loadDesign(productId: string, savedAt?: number): Promise<unknown | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await open();
    const hit = await new Promise<SavedDesign | undefined>((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(productId);
      req.onsuccess = () => resolve(req.result as SavedDesign | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!hit || (savedAt !== undefined && hit.savedAt !== savedAt)) return null;
    return hit.doc;
  } catch {
    return null;
  }
}
