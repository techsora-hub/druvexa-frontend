// Snapchat Pixel (snaptr) client helper — mirrors lib/metaPixel.js's
// stub/queue pattern so both pixels follow the exact same load-order
// guarantees (no event is lost to the real script loading async).
//
// Pixel id comes from NEXT_PUBLIC_SNAP_PIXEL_ID in .env. Only one pixel is
// supported (Snap doesn't have Meta's multi-pixel-per-event convention),
// so there's no parsePixelIds() equivalent here.

let initedPixelId = null;

export function ensureSnapStub() {
  if (typeof window === 'undefined') return;
  if (window.snaptr) return;

  const snaptr = function (...args) {
    if (snaptr.handleRequest) {
      snaptr.handleRequest(...args);
    } else {
      snaptr.queue.push(args);
    }
  };
  snaptr.queue = [];

  window.snaptr = snaptr;
}

// Runs the moment this module is first imported — by ANY file that needs a
// tracking function (SnapPixelRouteTracker, DetailHero, plans/page, etc.) —
// which happens while the JS bundle is being parsed, well before React
// mounts anything or runs a single effect. This is deliberately NOT left to
// initSnapPixel()'s own useEffect: that effect lives in
// SnapPixelRouteTracker specifically, and on a page like a movie/series
// detail page, DetailHero's own "fire VIEW_CONTENT on mount" effect could
// otherwise run before SnapPixelRouteTracker's effect has had a chance to
// create window.snaptr, silently dropping the event (trackSnapViewContent
// no-ops when window.snaptr doesn't exist yet — no error, just a missing
// event). Calling it here instead removes that race entirely: by the time
// any component's effects run, the stub already exists.
ensureSnapStub();

// userEmail is optional — passed straight to snaptr('init', ...) for Snap's
// advanced-matching, exactly like the base code the user pasted. Leave it
// undefined for a logged-out visitor.
export function initSnapPixel(pixelId, userEmail) {
  if (typeof window === 'undefined' || !pixelId) return;

  ensureSnapStub();

  if (initedPixelId !== pixelId) {
    window.snaptr('init', pixelId, userEmail ? { user_email: userEmail } : {});
    initedPixelId = pixelId;
  }

  if (!document.getElementById('snap-pixel-script')) {
    const script = document.createElement('script');
    script.id = 'snap-pixel-script';
    script.async = true;
    script.src = 'https://sc-static.net/scevent.min.js';
    document.head.appendChild(script);
  }
}

export function trackSnapPageView() {
  if (typeof window === 'undefined' || !window.snaptr) return;
  window.snaptr('track', 'PAGE_VIEW');
}

// contentId/category: whatever identifies the movie/series being viewed —
// Snap's dashboard groups VIEW_CONTENT by item_category, so pass the kind
// of content ("movie" / "series"), not the title.
export function trackSnapViewContent({ contentId, category } = {}) {
  if (typeof window === 'undefined' || !window.snaptr) return;
  const params = {};
  if (contentId) params.item_ids = [String(contentId)];
  if (category) params.item_category = category;
  window.snaptr('track', 'VIEW_CONTENT', params);
}

// Fired once, right after a brand-new account is created (the same moment
// Meta's SIGN_UP-equivalent would fire) — never on a returning user's login.
export function trackSnapSignUp(signUpMethod = 'phone') {
  if (typeof window === 'undefined' || !window.snaptr) return;
  window.snaptr('track', 'SIGN_UP', { sign_up_method: signUpMethod });
}

// Fired when someone clicks SUBSCRIBE, just before the redirect to the
// payment gateway — mirrors Meta's would-be AddToCart/InitiateCheckout spot.
export function trackSnapStartCheckout({ price, currency = 'INR', planId } = {}) {
  if (typeof window === 'undefined' || !window.snaptr) return;
  if (!price || price <= 0) return;
  const params = { price, currency, number_items: 1 };
  if (planId) params.item_ids = [String(planId)];
  window.snaptr('track', 'START_CHECKOUT', params);
}

// amount/currency/eventId follow the exact same contract as
// metaPixel.trackPurchase — a ₹0/missing amount is never sent.
export function trackSnapPurchase(amount, currency = 'INR', eventId) {
  if (typeof window === 'undefined' || !window.snaptr) return;
  if (!amount || amount <= 0) return;

  const params = { price: amount, currency, number_items: 1 };
  if (eventId) params.transaction_id = String(eventId);

  window.snaptr('track', 'PURCHASE', params);
}