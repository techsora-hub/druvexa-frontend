'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initMetaPixel, trackPageView, parsePixelIds, generateEventId } from '../../lib/metaPixel';

// Comma-separated — e.g. NEXT_PUBLIC_META_PIXEL_IDS="111111,222222,333333"
// for multiple pixels (different media buyers/ad accounts) on the same site.
const PIXEL_IDS = parsePixelIds(process.env.NEXT_PUBLIC_META_PIXEL_IDS);
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

function getCookie(name) {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

// Server-side twin of the client fbq('track','PageView') call below — same
// eventId, so Meta's Conversions API dedups them into one PageView instead
// of double-counting. Fire-and-forget: never let this slow down navigation
// or throw into the render (ad blockers / offline / backend hiccup must not
// break the page).
function sendServerPageView(eventId) {
  try {
    fetch(`${API_URL}/meta-capi/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        eventSourceUrl: window.location.href,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort
  }
}

// Owns loading + initializing the pixel and firing one PageView per route
// change (including the very first load), on both the client pixel and the
// server-side Conversions API. The caller (app/layout.js) wraps this in
// <Suspense> since useSearchParams() requires it.
export default function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didInit = useRef(false);

  useEffect(() => {
    if (PIXEL_IDS.length === 0 || didInit.current) return;
    didInit.current = true;
    initMetaPixel(PIXEL_IDS);
  }, []);

  useEffect(() => {
    if (PIXEL_IDS.length === 0) return;
    const eventId = generateEventId();
    trackPageView(eventId);
    sendServerPageView(eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}