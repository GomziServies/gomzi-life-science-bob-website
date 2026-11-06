import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpModal } from './HelpModal';
import { useOrder } from '../state/order';

/** Pages that show the floating help button (the label studio has its own). */
const HELP_PAGES = ['/', '/products', '/details'];

/** The round "?" button in the corner: opens the same help form as the label studio. */
export function HelpButton() {
  const { pathname } = useLocation();
  const { customer } = useOrder();
  const [open, setOpen] = useState(false);
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (!HELP_PAGES.includes(path)) return null;

  return (
    <>
      <button type="button" className="help-float" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Help" title="Help: ask our team">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>
      {open && (
        <HelpModal
          initial={{ name: customer.fullName, phone: customer.phone, email: customer.email }}
          details={{ Brand: customer.brandName }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
