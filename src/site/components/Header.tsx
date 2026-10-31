import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOrder } from '../state/order';
import { Logo } from './Logo';

const LINKS: [string, string][] = [
  ['/shop#range', 'Products'],
  ['/shop#how', 'How it works'],
  ['/shop#faq', 'FAQ'],
];

export function Header() {
  const { cart, customer } = useOrder();
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  // A menu left open must not follow the customer to the next page
  useEffect(() => setOpen(false), [pathname, hash]);

  return (
    <header className="top">
      <div className="wrap">
        <Link to="/shop" className="logo" aria-label="Gomzi Life Science LLP home">
          <Logo height={42} />
        </Link>
        <nav className="nav" aria-label="Main">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
        <Link to={cart.length ? (customer.verificationId ? '/shop/customize' : '/shop/details') : '/shop#range'} className="cartbtn">
          Your inquiry <span className="cnt">{cart.length}</span>
        </Link>
        <button className="menubtn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
        </button>
      </div>
      {open && (
        <nav className="mobilenav" aria-label="Mobile">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
      )}
    </header>
  );
}
