import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MENU, groupIsCurrent } from '../data/menu';
import { useOrder } from '../state/order';
import { Logo } from './Logo';

const Caret = () => (
  <svg className="nav-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export function Header() {
  const { cart, customer } = useOrder();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const { pathname, search } = useLocation();
  const nav = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // A menu left open must not follow the customer to the next page
  useEffect(() => {
    setOpen(false);
    setMenu(null);
  }, [pathname, search]);

  // a dropdown closes on Escape and when the click lands outside the menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null);
    const onDown = (e: PointerEvent) => {
      if (nav.current && !nav.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, []);

  // the header tightens (and gains a shadow) once the page is scrolled
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 24));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // with a mouse a dropdown opens on hover (and stays a moment when the pointer slips off); by touch or keyboard it opens on click
  const hoverIn = (id: string) => (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(timer.current);
    setMenu(id);
  };
  const hoverOut = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMenu(null), 160);
  };

  return (
    <header className={`top${scrolled ? ' scrolled' : ''}`}>
      <div className="top-bar" aria-hidden="true">
        <span>Ready formulations dispatched in 5 days</span>
        <i />
        <span>Manufactured in Surat · 18-month shelf life</span>
      </div>
      <div className="top-main">
        <div className="wrap">
          <button className="menubtn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span /><span /><span />
          </button>
          <Link to="/" className="logo" aria-label="Gomzi Life Science LLP home">
            <Logo height={32} />
          </Link>
          <nav className="nav2 nav-inline" aria-label="Main" ref={nav}>
            {MENU.map((g) => {
              const current = groupIsCurrent(g, pathname);
              if (!g.items) {
                return (
                  <Link key={g.id} to={g.to!} className={`nav-link${current ? ' on' : ''}`} aria-current={current ? 'page' : undefined}>{g.label}</Link>
                );
              }
              const shown = menu === g.id;
              return (
                <div key={g.id} className="nav-item" onPointerEnter={hoverIn(g.id)} onPointerLeave={hoverOut} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setMenu((m) => (m === g.id ? null : m))}>
                  <button type="button" className={`nav-link${current ? ' on' : ''}${shown ? ' open' : ''}`} aria-haspopup="true" aria-expanded={shown} aria-controls={`menu-${g.id}`} onClick={() => setMenu(shown ? null : g.id)}>
                    {g.label}<Caret />
                  </button>
                  <div id={`menu-${g.id}`} className={`nav-panel${g.wide ? ' wide' : ''}${shown ? ' show' : ''}`}>
                    {g.items.map((it) => (
                      <Link key={it.to} to={it.to} className="nav-sub" tabIndex={shown ? 0 : -1}>
                        <b>{it.label}</b>
                        {it.note && <small>{it.note}</small>}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
          <Link to={cart.length ? (customer.verificationId ? '/customize' : '/details') : '/products'} className="cartbtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.1 2.75a.9.9 0 0 1 1-.46l.3.1c.6.22 1.1.4 1.5.6.45.22.8.5 1.1.9.3.42.4.87.45 1.37l.04.5h10.64c1.7 0 3.2 0 3.65.58.44.58.27 1.45-.08 3.19l-.5 2.42c-.31 1.53-.47 2.3-1.02 2.74-.55.45-1.33.45-2.89.45h-5.3c-2.8 0-4.18 0-5.05-.92C5.06 13.6 5 12.6 5 9.65V7c0-.74 0-1.24-.04-1.62-.04-.36-.11-.55-.2-.68-.09-.13-.22-.25-.52-.4-.33-.16-.77-.31-1.44-.55l-.26-.09a.9.9 0 0 1-.44-1.15Z"/><circle cx="7.5" cy="19.5" r="1.5"/><circle cx="16.5" cy="19.5" r="1.5"/></svg>
            <span className="cartbtn-t">Your inquiry</span> <span className="cnt" key={cart.length}>{cart.length}</span>
          </Link>
        </div>
      </div>
      {open && (
        <nav className="mobilenav" aria-label="Mobile">
          {MENU.map((g) =>
            g.items ? (
              <details key={g.id} className="mn-group" open={groupIsCurrent(g, pathname)}>
                <summary className={groupIsCurrent(g, pathname) ? 'on' : undefined}>{g.label}<Caret /></summary>
                <div className="mn-items">
                  {g.items.map((it) => (
                    <Link key={it.to} to={it.to}>{it.label}</Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link key={g.id} to={g.to!} className={`mn-link${groupIsCurrent(g, pathname) ? ' on' : ''}`}>{g.label}</Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
