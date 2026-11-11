'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initSnapPixel, trackSnapPageView } from '../../lib/snapPixel';

// Same role as MetaPixelRouteTracker.jsx, for the Snap pixel: loads +
// inits the pixel once, then fires one PAGE_VIEW per route change
// (including the very first load). Wrapped in <Suspense> by the caller
// (app/layout.js) since useSearchParams() requires it.
const SNAP_PIXEL_ID = process.env.NEXT_PUBLIC_SNAP_PIXEL_ID;

export default function SnapPixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didInit = useRef(false);

  useEffect(() => {
    if (!SNAP_PIXEL_ID || didInit.current) return;
    didInit.current = true;

    let userEmail;
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      userEmail = stored?.email || undefined;
    } catch {
      userEmail = undefined;
    }

    initSnapPixel(SNAP_PIXEL_ID, userEmail);
  }, []);

  useEffect(() => {
    if (!SNAP_PIXEL_ID) return;
    trackSnapPageView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}