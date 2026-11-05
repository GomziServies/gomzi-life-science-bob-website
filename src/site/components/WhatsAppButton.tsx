import { WHATSAPP } from '../lib/config';

/** The WhatsApp floating button in the corner. */
export function WhatsAppButton() {
  return (
    <a
      className="wa-float"
      href={`https://wa.me/${WHATSAPP}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <img
        className="wa-img"
        src="/icons/whatsapp.png"
        alt="Chat on WhatsApp"
        width={58}
        height={58}
      />
    </a>
  );
}
