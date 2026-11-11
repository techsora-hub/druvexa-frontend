// Meta Pixel client helper.
//
// Pixel ID(s) come straight from NEXT_PUBLIC_META_PIXEL_IDS in .env —
// comma-separated when there are multiple (e.g. one per media buyer/ad
// account). That's the only thing to edit when cloning this codebase for a
// new client site.
//
// Pattern: window.fbq is replaced with a synchronous queue-stub the moment
// this module runs, so any call made before the real fbevents.js script
// finishes loading (it's injected async) still gets queued and replayed
// once the real pixel code attaches itself to the same window.fbq function.
// No tracked event is ever lost to load timing.

// Normalizes "123, 456,789" / ["123", 456] / "123" into a clean string[].
export function parsePixelIds(pixelIds) {
  const list = Array.isArray(pixelIds) ? pixelIds : String(pixelIds ?? '').split(',');
  return [...new Set(list.map((id) => String(id).trim()).filter(Boolean))];
}

// Ids already fbq('init', id)-ed in this page load — a plain
// fbq('track', ...) with no id automatically fans out to every pixel
// that's been init'd, so multiple pixels just means calling init more
// than once, not duplicating any of the track calls below.
const initedPixelIds = new Set();

export function ensureStub() {
  if (typeof window === 'undefined') return;
  if (window.fbq) return;

  const fbq = function (...args) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  window.fbq = fbq;
  window._fbq = window._fbq || fbq;
}

// pixelIds: a single id, a comma-separated string of ids, or an array of ids —
// every one gets its own fbq('init', ...), so one trackPageView/trackPurchase
// call below reaches all of them.
export function initMetaPixel(pixelIds) {
  if (typeof window === 'undefined') return;
  const ids = parsePixelIds(pixelIds);
  if (ids.length === 0) return;

  ensureStub();

  ids.forEach((id) => {
    if (initedPixelIds.has(id)) return;
    window.fbq('init', id);
    initedPixelIds.add(id);
  });

  if (!document.getElementById('meta-pixel-script')) {
    const script = document.createElement('script');
    script.id = 'meta-pixel-script';
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
}

// Fallback event id — used only when no real order/txn id is available, so
// PageView/Purchase dedup (and the server-side Conversions API calls
// matched on eventID/event_id) never breaks for lack of one.
export function generateEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// eventId: pass the SAME id you send to the backend's
// /api/meta-capi/pageview call (see MetaPixelRouteTracker.jsx) so Meta can
// dedup the browser + server copies of this PageView instead of double-
// counting it.
export function trackPageView(eventId) {
  if (typeof window === 'undefined' || !window.fbq) return;
  const resolvedEventId = eventId || generateEventId();
  window.fbq('track', 'PageView', {}, { eventID: resolvedEventId });
}

// amount: number (required — a ₹0 or missing amount is never sent as a Purchase)
// currency: ISO currency code, defaults to INR
// eventId: the order/txn id when one is known; falls back to a generated id
export function trackPurchase(amount, currency = 'INR', eventId) {
  if (typeof window === 'undefined') return;
  if (!amount || amount <= 0) return;

  // The payment-success page's effect can run BEFORE the route tracker's
  // init effect on a fresh production load (window.fbq still undefined) —
  // that silently dropped the Purchase. Initialising here (idempotent: no
  // duplicate init, no duplicate script tag) guarantees fbq exists, and the
  // stub queues this call until fbevents.js finishes loading.
  initMetaPixel(parsePixelIds(process.env.NEXT_PUBLIC_META_PIXEL_IDS));
  if (!window.fbq) return;

  const resolvedEventId = eventId || generateEventId();

  window.fbq(
    'track',
    'Purchase',
    { value: amount, currency },
    { eventID: resolvedEventId }
  );
}