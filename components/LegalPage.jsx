// Shared layout for the public info/policy pages (about, contact, terms,
// privacy, refund, disclaimer). Navbar + Footer come from app/layout.js.
// Site name and support email come from .env.local (see lib/site.js).
// Re-exported here because the policy pages import them from this file.
import { SITE_NAME, SUPPORT_EMAIL } from '../lib/site';

export { SITE_NAME, SUPPORT_EMAIL };

export function SupportLine() {
  if (!SUPPORT_EMAIL) return null;
  return (
    <p>
      Email us at{' '}
      <a className="text-accent hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
        {SUPPORT_EMAIL}
      </a>
      .
    </p>
  );
}

export default function LegalPage({ title, updated, children }) {
  return (
    <main className="px-4 sm:px-8 md:px-14 py-10 sm:py-14 max-w-3xl">
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl mb-2">{title}</h1>
      {updated ? <p className="text-text-low text-[12px] mb-8">Last updated: {updated}</p> : <div className="mb-8" />}
      <div className="flex flex-col gap-4 text-[14px] leading-relaxed text-text-mid [&_h2]:text-text-hi [&_h2]:font-bold [&_h2]:text-[16px] [&_h2]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
    </main>
  );
}