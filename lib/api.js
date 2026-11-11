const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // send the login cookie
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.code = body.code;
    throw err;
  }

  return res.json();
}

// ---------- Public content ----------
export function getSeriesList(page = 1, limit = 20) {
  return apiFetch(`/series?page=${page}&limit=${limit}`);
}

export function getSeriesDetail(slug) {
  return apiFetch(`/series/${slug}`);
}

export function getMoviesList(page = 1, limit = 20) {
  return apiFetch(`/movies?page=${page}&limit=${limit}`);
}

export function getMovieDetail(slug) {
  return apiFetch(`/movies/${slug}`);
}

export function getPlans() {
  return apiFetch('/plans');
}

// ---------- Hero banners (admin-managed, shown on home page carousel) ----------
export function getHeroBanners() {
  return apiFetch('/hero-banners');
}

// ---------- Related content ----------
export function getRelatedToSeries(slug) {
  return apiFetch(`/series/${slug}/related`);
}

export function getRelatedToMovie(slug) {
  return apiFetch(`/movies/${slug}/related`);
}

// ---------- Watchlist ----------
export function addToWatchlist(contentType, contentId) {
  return apiFetch('/watchlist', {
    method: 'POST',
    body: JSON.stringify({ contentType, contentId }),
  });
}

export function removeFromWatchlist(contentId) {
  return apiFetch(`/watchlist/${contentId}`, { method: 'DELETE' });
}

export function getWatchlist(page = 1, limit = 20) {
  return apiFetch(`/watchlist?page=${page}&limit=${limit}`);
}

// ---------- Auth ----------
export function sendOtp(phone) {
  return apiFetch('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone, code) {
  return apiFetch('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export function getMe() {
  return apiFetch('/auth/me');
}

// Clears the httpOnly auth cookie server-side — localStorage alone doesn't
// end the session, since the backend actually authenticates off this
// cookie, not anything readable from the browser.
export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}
// ---------- Locked video (requires login + active subscription) ----------
export function getEpisodeVideo(seriesId, episodeId) {
  return apiFetch(`/series/${seriesId}/episodes/${episodeId}/video`);
}

export function getMovieVideo(movieId) {
  return apiFetch(`/movies/${movieId}/video`);
}

// ---------- Subscription / payment ----------
// The payment buttons this site shows — switched on/off in the admin panel.
// → { methods: [{ gateway: 'sabpaisa', label: 'SabPaisa' }, ...] }
export function getPaymentOptions() {
  return apiFetch('/payment-options');
}

// gateway: the button the customer pressed ('sabpaisa' | 'cashfree').
export function subscribe(planId, redirect, gateway) {
  return apiFetch('/subscribe', {
    method: 'POST',
    body: JSON.stringify({ planId, redirect, gateway }),
  });
}

// One of the customer's own payments — used while it is being confirmed.
// → { status: 'pending' | 'paid' | 'failed', txn, amount, planName, redirectPath }
export function getPaymentStatus(txn) {
  return apiFetch(`/payment/status/${encodeURIComponent(txn)}`);
}

// ---------- Continue watching ----------
export function getContinueWatching(page = 1, limit = 10) {
  return apiFetch(`/watch-history?page=${page}&limit=${limit}`);
}

// ---------- Home page row order (built-in sections + categories) ----------
export function getRowOrder() {
  return apiFetch('/row-order');
}

// ---------- Admin-curated categories (home page shelves) ----------
export function getCategories() {
  return apiFetch('/categories');
}