'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

// Browser storage is already separate per site (per domain), so the keys
// need no site name in them.
const VISITOR_ID_KEY = 'ott_visitor_id';
const COUNTED_KEY = 'ott_counted_click';
const VISIT_KEY = 'ott_counted_visit';
// NEXT_PUBLIC_API_URL may or may not end with "/api" — normalise to the root.
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

function getOrCreateVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

const hasAdParams = (p) => !!(p.get('fbclid') || p.get('utm_source'));

function sendClick(source) {
  fetch(`${API_ROOT}/api/media-dashboard/track-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId: getOrCreateVisitorId(), source }),
    keepalive: true,
  }).catch(() => {
    // Never let a tracking failure affect the visitor's page load.
  });
}

// Feeds the media-buyer dashboard (Unique Ad Clicks / Total Clicks / CR).
//
// 1. Ad link with fbclid / utm_source (on the URL, or nested inside
//    "redirect" — middleware.js sends logged-out visitors to
//    /login?redirect=<original url>): counted once per click, as before.
// 2. No such parameter (e.g. traffic that arrives through a redirect link
//    that drops them): every visit is counted once per browser session
//    (a refresh, the login redirect or moving between pages never counts
//    again; a new visit after the browser/tab session ends counts again).
//    Unique clicks = different visitors, so one person is still 1 unique.
//
// This deliberately does NOT touch the URL (the Meta Pixel needs fbclid in
// the address bar for its _fbc cookie).
export default function AdClickTracker() {
  const searchParams = useSearchParams();
  const lastKeyRef = useRef('');

  useEffect(() => {
    const top = new URLSearchParams(searchParams.toString());

    let src = hasAdParams(top) ? top : null;
    if (!src) {
      const redirectRaw = top.get('redirect');
      if (redirectRaw && redirectRaw.includes('?')) {
        const nested = new URLSearchParams(redirectRaw.slice(redirectRaw.indexOf('?') + 1));
        if (hasAdParams(nested)) src = nested;
      }
    }

    // 2. Plain visit — once per browser session.
    if (!src) {
      try {
        if (sessionStorage.getItem(VISIT_KEY) || sessionStorage.getItem(COUNTED_KEY)) return;
        sessionStorage.setItem(VISIT_KEY, '1');
      } catch {
        if (lastKeyRef.current) return;
      }
      lastKeyRef.current = 'visit';
      sendClick('direct');
      return;
    }

    // 1. Ad click with fbclid / utm_source.
    const fbclid = src.get('fbclid');
    const utmSource = src.get('utm_source');
    const key = fbclid ? `fb:${fbclid}` : `utm:${utmSource}`;

    if (lastKeyRef.current === key) return;
    try {
      if (sessionStorage.getItem(COUNTED_KEY) === key) {
        lastKeyRef.current = key;
        return;
      }
      sessionStorage.setItem(COUNTED_KEY, key);
      // This session is already counted as an ad click — don't add a
      // second "visit" for it.
      sessionStorage.setItem(VISIT_KEY, '1');
    } catch {
      // sessionStorage unavailable — the ref above still guards this page load.
    }
    lastKeyRef.current = key;
    sendClick(utmSource || 'facebook');
  }, [searchParams]);

  return null;
}
