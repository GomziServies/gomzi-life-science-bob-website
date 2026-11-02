import { useEffect, useRef, useState } from 'react';
import type { Product } from '../data/catalog';
import { designName, logoGuide, type Details } from '../lib/labelArt';
import { pictureSize, readLogo } from '../lib/logo';
import { FlatLabel, type LogoShift } from './LabelView';

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

/** Upload (or replace, or remove) the logo, with the exact size of the logo area on the chosen label. */
export function LogoBox({ product, design, logo, onLogo }: { product: Product; design: number; logo: string; onLogo: (logo: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [size, setSize] = useState({ w: 0, h: 0 });
  const guide = logoGuide(product, design);

  useEffect(() => {
    let live = true;
    if (logo) void pictureSize(logo).then((s) => live && setSize(s));
    else setSize({ w: 0, h: 0 });
    return () => {
      live = false;
    };
  }, [logo]);

  const pick = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      onLogo(await readLogo(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That logo could not be used.');
    }
  };
  const small = logo && size.w > 0 && size.w < guide.pxW * 0.6 && size.h < guide.pxH * 0.6;

  return (
    <div className="logobox">
      <input ref={input} type="file" accept=".png,.jpg,.jpeg,.webp" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="logobox-row">
        <button type="button" className="btn btn-lime btn-sm" onClick={() => input.current?.click()}>{logo ? 'Change logo' : 'Upload your logo'}</button>
        {logo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onLogo('')}>Remove</button>}
        {logo && <img className="logobox-thumb" src={logo} alt="Your logo" />}
      </div>
      <span className="logobox-size">
        Logo area on this label: <b>{guide.mmW} × {guide.mmH} mm</b>. Use a PNG with a transparent background, at least <b>{guide.pxW} × {guide.pxH} px</b>.
      </span>
      {small && <span className="logobox-warn">Your logo is {size.w} × {size.h} px, so it may print soft. A bigger file will be sharper.</span>}
      {error && <span className="logobox-warn">{error}</span>}
    </div>
  );
}

/** The label designs to pick from, each shown as its front panel. */
export function DesignPicks({ product, flavour, designs, current, onPick, details, logo }: { product: Product; flavour: string; designs: number[]; current: number; onPick: (d: number) => void; details: Details; logo?: string }) {
  return (
    <div className="dpicks" role="group" aria-label="Label design">
      {designs.map((d) => (
        <button key={d} type="button" className="dpick" aria-pressed={d === current} onClick={() => onPick(d)} title={designName(d)}>
          <FlatLabel spec={{ product, flavour, design: d, details, logo }} view="front" className="dpick-art" />
          <span>{designName(d)}</span>
        </button>
      ))}
    </div>
  );
}

/** A small line under the label pickers for a customer who likes none of the labels: one tap leaves it to the design team. */
export function TeamChoice({ picked, onPick, className }: { picked: boolean; onPick: () => void; className?: string }) {
  return (
    <div className={'teamchoice' + (picked ? ' picked' : '') + (className ? ' ' + className : '')}>
      <span>{picked ? 'Added to your inquiry' : 'No label you like?'}</span>
      <button type="button" aria-pressed={picked} onClick={onPick}>
        {picked ? '✓ Made with Parpics team' : 'Made with Parpics team'}
      </button>
      {picked && (
        <button type="button" className="teamchoice-undo" onClick={onPick} aria-label="Take it back">
          Undo
        </button>
      )}
    </div>
  );
}
