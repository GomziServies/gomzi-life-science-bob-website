import { useEffect, useRef, useState } from 'react';
import type { Product } from '../data/catalog';
import { readLogo } from '../lib/logo';
import type { LogoShift } from './LabelView';
import { listGalleryBanners, type GalleryBanner } from '../lib/api';
import { POUCH_LABELS, SACHET_LABELS } from '../data/bagLabels';

export type Pack = 'jar' | 'pouch' | 'sachet';

/** The packs a product comes in: powders in a tub or jar, a pouch or a sachet; peanut butter in a jar only; the instant mixes in a sachet only. */
export const packsOf = (product: Product): Pack[] => (product.group === 'well' || product.id === 'peanut' ? ['jar'] : product.unit === 'sachet' ? ['sachet'] : ['jar', 'pouch', 'sachet']);

/** The pack to show: the wanted one when the product comes in it, otherwise the product's own. */
export const fitPack = (product: Product, pack: Pack): Pack => (packsOf(product).includes(pack) ? pack : packsOf(product)[0]);

/** The packs written out, such as "Tub · Pouch · Sachet". */
export const packText = (product: Product): string => packsOf(product).map((p) => (p === 'jar' ? (product.unit === 'kg' ? 'Tub' : 'Jar') : p === 'pouch' ? 'Pouch' : 'Sachet')).join(' · ');

/** Switch the 3D view between the jar (or tub), a stand-up pouch and a sachet. */
export function PackToggle({ product, pack, onPack, className }: { product: Product; pack: Pack; onPack: (p: Pack) => void; className?: string }) {
  const options: [Pack, string][] = [['jar', product.unit === 'kg' ? 'Tub' : 'Jar'], ['pouch', 'Pouch'], ['sachet', 'Sachet']];
  const allowed = packsOf(product);
  if (allowed.length < 2) return null;
  return (
    <div className={'packtoggle' + (className ? ' ' + className : '')} role="group" aria-label="Pack type">
      {options.filter(([id]) => allowed.includes(id)).map(([id, name]) => (
        <button key={id} type="button" aria-pressed={pack === id} onClick={() => onPack(id)}>{name}</button>
      ))}
    </div>
  );
}

/** A small "Upload your logo" button; once a logo is set, two sliders move it left/right and up/down from the label's empty logo place. */
export function LogoPlacement({ logo, onLogo, shift, onShift }: { logo: string; onLogo: (logo: string) => void; shift: LogoShift; onShift: (s: LogoShift) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const choose = async (file: File | undefined) => {
    if (!file) return;
    try {
      setError('');
      onLogo(await readLogo(file));
      onShift({ dx: 0, dy: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That picture could not be read.');
    }
  };
  return (
    <div className="logoplace">
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { void choose(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="logoplace-row">
        {logo && <img className="logoplace-thumb" src={logo} alt="Your logo" />}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current?.click()}>{logo ? 'Change logo' : 'Upload your logo'}</button>
        {logo && <button type="button" className="linkbtn" onClick={() => { onLogo(''); onShift({ dx: 0, dy: 0 }); }}>Remove</button>}
      </div>
      {logo && (
        <div className="logoplace-sliders">
          <label>
            <span>← Left / Right →</span>
            <input type="range" min={-12} max={12} step={0.25} value={shift.dx} onChange={(e) => onShift({ ...shift, dx: Number(e.target.value) })} aria-label="Move the logo left or right" />
          </label>
          <label>
            <span>↑ Up / Down ↓</span>
            <input type="range" min={-30} max={30} step={0.5} value={shift.dy} onChange={(e) => onShift({ ...shift, dy: Number(e.target.value) })} aria-label="Move the logo up or down" />
          </label>
        </div>
      )}
      {error && <span className="logoplace-err">{error}</span>}
    </div>
  );
}

/** A small line under the label pickers for a customer who likes none of the labels: one tap leaves it to the design team. */
export function TeamChoice({ picked, onPick, className }: { picked: boolean; onPick: () => void; className?: string }) {
  return (
    <div className={'teamchoice' + (picked ? ' picked' : '') + (className ? ' ' + className : '')}>
      <span>{picked ? 'Added to your inquiry' : 'No label you like?'}</span>
      <button type="button" aria-pressed={picked} onClick={onPick}>
        {picked ? '✓ Made with Graphics team' : 'Made with Graphics team'}
      </button>
      {picked && (
        <button type="button" className="teamchoice-undo" onClick={onPick} aria-label="Take it back">
          Undo
        </button>
      )}
    </div>
  );
}

/** The labels to offer for a product in a pack: the ready pouch and sachet labels when the pouch or sachet is shown (for the powders that come in all three packs),
 * otherwise the ones our team saved in the template gallery. */
export function labelsFor(product: Product, pack: Pack): Promise<GalleryBanner[]> {
  if (pack !== 'jar' && packsOf(product).length === 3) return Promise.resolve(pack === 'pouch' ? POUCH_LABELS : SACHET_LABELS);
  return listGalleryBanners(product.templateCategory);
}

/** The label a product wears when nothing was picked: the first ready label for its pack (never a built-in drawing). */
export const defaultBagLabel = (product: Product, pack: Pack): GalleryBanner | null => (pack !== 'jar' && packsOf(product).length === 3 ? (pack === 'pouch' ? POUCH_LABELS[0] : SACHET_LABELS[0]) : null);
const firstJar = new Map<string, GalleryBanner | null>();
/** The first of our gallery labels for a product's jar (loaded once per kind of product). */
export function useFirstJarLabel(product: Product): GalleryBanner | null | undefined {
  const key = product.templateCategory;
  const [label, setLabel] = useState<GalleryBanner | null | undefined>(() => firstJar.get(key));
  useEffect(() => {
    if (firstJar.has(key)) return setLabel(firstJar.get(key));
    let live = true;
    listGalleryBanners(key)
      .then((list) => list[0] ?? null)
      .catch(() => null)
      .then((first) => {
        firstJar.set(key, first);
        if (live) setLabel(first);
      });
    return () => {
      live = false;
    };
  }, [key]);
  return label;
}

/** The label to put on the pack being shown, right now: a jar's wide wrap is never stretched onto a pouch or sachet (nor a pouch label onto a jar) while the
 * list of labels for the new pack is still loading. `null` means "wait for the label". */
export const labelOnPack = (product: Product, pack: Pack, picked: GalleryBanner | null): GalleryBanner | null => {
  if (pack !== 'jar' && packsOf(product).length === 3) return picked?.ownLogo ? picked : defaultBagLabel(product, pack);
  return picked?.ownLogo ? null : picked;
};
