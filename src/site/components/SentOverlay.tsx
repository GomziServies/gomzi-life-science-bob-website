import { useEffect } from 'react';

const BITS = Array.from({ length: 28 }, (_, i) => ({
  a: (i / 28) * 360 + (i % 3) * 7,
  d: 120 + ((i * 37) % 90),
  s: 6 + ((i * 11) % 7),
  t: (i % 4) * 0.05,
  c: ['#99c229', '#c5e063', '#1d2a08', '#ffffff', '#eef6d6'][i % 5],
}));

/** The full-screen "sent" moment: a ring that draws itself, a tick that follows, a burst of confetti and a short message. */
export function SentOverlay({ email, mailing }: { email: string; mailing: 'sent' | 'later' }) {
  // the page behind does not scroll while it is shown
  useEffect(() => {
    const was = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = was;
    };
  }, []);

  return (
    <div className="sent" role="alert" aria-live="assertive">
      <div className="sent-card">
        <div className="sent-art" aria-hidden="true">
          <span className="sent-ring r1" />
          <span className="sent-ring r2" />
          {BITS.map((b, i) => (
            <i key={i} className="sent-bit" style={{ ['--a' as string]: `${b.a}deg`, ['--d' as string]: `${b.d}px`, ['--s' as string]: `${b.s}px`, ['--t' as string]: `${b.t}s`, background: b.c }} />
          ))}
          <svg className="sent-svg" viewBox="0 0 120 120" width="120" height="120">
            <circle className="sent-disc" cx="60" cy="60" r="46" />
            <circle className="sent-circle" cx="60" cy="60" r="52" />
            <path className="sent-tick" d="M38 62 L54 78 L84 44" />
          </svg>
        </div>
        <h2 className="sent-title">Your inquiry was sent successfully</h2>
        <p className="sent-sub">Our team will contact you shortly.</p>
        <p className="sent-mail">
          {mailing === 'sent' && <>We have e-mailed your products and labels to <b>{email}</b></>}
          {mailing === 'later' && <>We have your inquiry. Our team will reach you on the number you gave.</>}
        </p>
        <span className="sent-bar" aria-hidden="true" />
      </div>
    </div>
  );
}
