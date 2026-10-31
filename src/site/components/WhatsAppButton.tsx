import { WHATSAPP } from '../lib/config';

/** The round green WhatsApp button in the corner, like on the company website. */
export function WhatsAppButton() {
  return (
    <a className="wa-float" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="#fff" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.800zM8.700 7.500c-.2 0-.5.100-.7.400-.3.300-1 1-1 2.400s1 2.700 1.200 2.900c.1.200 2 3.100 4.900 4.300 2.400 1 2.900.8 3.400.7.500-.1 1.700-.7 1.900-1.400.2-.7.200-1.300.2-1.400-.1-.1-.3-.2-.6-.3l-1.800-.9c-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.6.100-.3-.1-1.200-.4-2.200-1.400-.8-.7-1.400-1.600-1.500-1.900-.2-.3 0-.4.100-.6l.4-.5c.1-.2.200-.3.300-.5.100-.2.100-.3 0-.5l-.8-2c-.2-.5-.4-.5-.6-.5z" />
      </svg>
    </a>
  );
}
