import { useEffect } from 'react';
import { useLoading3d } from '../lib/preload3d';

/** Covers the page while the 3D models load and the first pictures are drawn; it fades away when they are all in. */
export function Loading3d() {
  const { done, loaded, pictures, needed } = useLoading3d();
  useEffect(() => {
    if (done) return;
    const html = document.documentElement;
    const was = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = was;
    };
  }, [done]);
  const step = (loaded ? 1 : 0) + Math.min(pictures, needed);
  const total = 1 + needed;
  return (
    <div className={`load3d${done ? ' gone' : ''}`} role="status" aria-live="polite" aria-hidden={done}>
      <div className="load3d-box">
        <div className="load3d-spin" />
        <b>Loading your 3D products…</b>
        <span>{loaded ? 'Drawing the first packs' : 'Loading the models'}</span>
        <div className="load3d-bar">
          <i style={{ width: `${Math.round((step / Math.max(1, total)) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
