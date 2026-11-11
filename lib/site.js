// -----------------------------------------------------------------------------
// This site's name, logo and contact email — set per site in .env.local, so
// one frontend codebase serves every site of a hub. Change them and rebuild
// (npm run build); nothing else in the code needs editing.
//
//   NEXT_PUBLIC_SITE_NAME=Zyora
//   NEXT_PUBLIC_LOGO_URL=/logo.png        (file in public/, or a full https URL)
//   NEXT_PUBLIC_SUPPORT_EMAIL=support@zyora.digital
//
// The browser tab icon is app/icon.png — replace that file per site.
// -----------------------------------------------------------------------------

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Zyora';
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || '/logo.png';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
