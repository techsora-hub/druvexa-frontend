import { NextResponse } from 'next/server';

// Real, server-side gate — runs on Vercel/Node before any page renders, so
// it can't be bypassed by disabling JS or editing localStorage (unlike the
// old client-only check). It only checks that the "token" cookie is
// PRESENT, not that it's a valid/unexpired JWT — verifying the signature
// here would mean adding a JWT library to the frontend and shipping
// JWT_SECRET to it. The backend's requireAuth middleware already verifies
// the token on every real data/video request, so that remains the actual
// security boundary; this middleware is the fast UX-layer redirect so a
// logged-out visitor never even sees a page flash before being sent to
// /login.
//
// The backend sets this cookie on the site's own domain (".<site domain>",
// see backend/utils/cookieOptions.js), so it reaches both api.<site domain>
// and this frontend.
// Info/policy pages must be public — visitors, payment gateways and Meta's
// crawler need to open them without logging in.
const PUBLIC_PATHS = ['/login', '/about', '/contact', '/terms', '/privacy', '/refund', '/disclaimer'];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname + search);
  return NextResponse.redirect(loginUrl);
}

// Runs on everything except static assets, images, and Next internals —
// those should never be gated. API calls go straight to the backend
// (api.<site domain>) so they aren't matched here regardless.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|map)$).*)',
  ],
};