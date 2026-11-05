const LIVE_BACKEND_ORIGIN = 'https://api.fggroup.in';
const IS_DEV = import.meta.env.DEV;

/** The frontend editor web origin (hosting /embed/templates, /embed/editor, etc.) */
export const EDITOR_URL = (import.meta.env.VITE_EDITOR_URL as string | undefined) ?? (typeof window !== 'undefined' ? window.location.origin : '');
export const CRM_API = (import.meta.env.VITE_CRM_API as string | undefined) ?? (IS_DEV ? '/crm/public/v1' : `${LIVE_BACKEND_ORIGIN}/crm/public/v1`);
export const EDITOR_API = (import.meta.env.VITE_EDITOR_API as string | undefined) ?? (IS_DEV ? '/api/v1' : `${LIVE_BACKEND_ORIGIN}/api/v1`);
export const WHATSAPP = (import.meta.env.VITE_WHATSAPP as string | undefined) ?? '918320077993';
/** Where the editor's pictures (template thumbnails) are read from. Same origin in dev (proxied), so they can be drawn on the 3D jar. */
export const EDITOR_MEDIA = (import.meta.env.VITE_EDITOR_MEDIA as string | undefined) ?? (IS_DEV ? '/media' : `${LIVE_BACKEND_ORIGIN}/media`);
/** Where the company's files in the S3 bucket are read from. In development this is the dev server's own /aws-files (it forwards to https://files.fggroup.in, so the browser sees one origin and 3D textures load without CORS); set VITE_AWS_FILES_URL=https://files.fggroup.in once the CDN sends CORS headers. */
export const AWS_FILES = (import.meta.env.VITE_AWS_FILES_URL as string | undefined) ?? (IS_DEV ? '/aws-files' : 'https://files.fggroup.in');
export const AWS_FILES_HOST = 'files.fggroup.in';
