# OTT Frontend (Next.js)

One codebase for every site of a hub. Each site is its own deployment with
its own `.env.local` (name, logo, api address, pixels) and logo files.

## Setup

```bash
npm install
cp .env.example .env.local   # fill it in — every variable is explained there
npm run dev                  # http://localhost:3000 (backend must be running)
```

## A new site

1. Copy this folder, set `.env.local` (`NEXT_PUBLIC_SITE_NAME`,
   `NEXT_PUBLIC_API_URL=https://api.<domain>/api`, pixels).
2. Put the site's logo in `public/logo.png` and a square icon in `app/icon.png`.
3. Add the site in the admin panel (Sites page) with the same domain.
4. `npm run build && npm start` (PM2).

## Payment flow

- `/plans` shows this site's plans (`GET /api/plans`) and only the payment
  buttons the admin has switched on (`GET /api/payment-options`). One option
  → straight to it; several → the customer picks.
- The gateway returns to `/plans?status=…`:
  - `success` — thank-you screen, Purchase pixel (event id = transaction id,
    the same id the server sends, so Meta counts it once)
  - `pending` — "confirming your payment": asks the backend every 10 s for up
    to 5 minutes and moves on by itself; tells the customer not to pay again
  - `failed` / `error` — message, plans shown again

## Structure

```
app/                pages (home, series, movies, plans, login, policy pages)
app/plans/page.js   plans, payment buttons, payment result screens
app/mock-payment/   fake gateway for local testing (backend USE_MOCK_PAYMENT=true)
components/         Navbar, Footer, SiteLogo, HeroBanner, rows, player, …
lib/api.js          every backend call
lib/site.js         site name / logo / support email from .env.local
middleware.js       sends logged-out visitors to /login (policy pages stay public)
```
