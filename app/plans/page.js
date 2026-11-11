'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getPlans, subscribe, getMe, getPaymentOptions, getPaymentStatus } from '../../lib/api';
import { trackPurchase } from '../../lib/metaPixel';
import { trackSnapPurchase, trackSnapStartCheckout } from '../../lib/snapPixel';

// -----------------------------------------------------------------------------
// Plans + payment result page.
//   /plans                              → plan cards; SUBSCRIBE → payment button(s)
//   /plans?status=success&amount&txn    → thank-you screen (+ Purchase pixel)
//   /plans?status=pending&txn           → "confirming your payment", checks by itself
//   /plans?status=failed | error        → message + plan cards again
// The payment buttons (SabPaisa / Cashfree) are the ones the admin has
// switched on for this site (GET /api/payment-options).
// -----------------------------------------------------------------------------

function safeRedirect(raw) {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

// Makes sure the video page we send someone to starts playing right away —
// the card/WATCH links already add this, but a destination reached some
// other way (an old link, a manual URL) gets it added here too.
function withAutoplay(path) {
  if (!path) return '/';
  if (/[?&]autoplay=1\b/.test(path)) return path;
  return `${path}${path.includes('?') ? '&' : '?'}autoplay=1`;
}

function isActive(user) {
  return (
    user?.subscriptionStatus === 'active' &&
    (!user.subscriptionExpiry || new Date(user.subscriptionExpiry) > new Date())
  );
}

const btnPrimary =
  'inline-block bg-gradient-to-r from-accent to-ruby text-white font-bold text-sm px-6 py-3 rounded-pill';

export default function PlansPage() {
  return (
    <Suspense fallback={null}>
      <PlansPageContent />
    </Suspense>
  );
}

function PlansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const redirectAfter = safeRedirect(searchParams.get('redirect'));
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState(null); // null = still loading
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  const [subscribingId, setSubscribingId] = useState(null);
  const [pickerPlan, setPickerPlan] = useState(null); // plan waiting for a payment button choice
  const purchaseFired = useRef(false);

  useEffect(() => {
    getPlans().then(setPlans).catch((err) => setError(err.message));
    getPaymentOptions()
      .then((res) => setMethods(res.methods || []))
      .catch(() => setMethods([]));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    getMe()
      .then((res) => {
        setMe(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
      .catch(() => {
        // stale/expired token — leave me unset, page just shows the plans grid
      });
  }, [status]);

  // Fire Meta Pixel Purchase exactly once per successful payment — guarded
  // by a ref so re-renders never send it twice. The amount and txn id come
  // straight from the redirect URL (set by the backend from the actual
  // Payment record), so this fires immediately without waiting on any other
  // data to load. The txn is also the event id the server sends, so Meta
  // counts the purchase once. trackPurchase never sends a ₹0/missing amount.
  useEffect(() => {
    if (status !== 'success' || purchaseFired.current) return;

    const amount = Number(searchParams.get('amount'));
    const eventId = searchParams.get('txn') || searchParams.get('orderId') || undefined;

    trackPurchase(amount, 'INR', eventId);
    trackSnapPurchase(amount, 'INR', eventId);
    purchaseFired.current = true;
  }, [status, searchParams]);

  function handleSubscribe(plan) {
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      const loginRedirect = redirectAfter ? `/plans?redirect=${encodeURIComponent(redirectAfter)}` : '/plans';
      router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }
    if (!methods || methods.length === 0) {
      setError('Payments are not available right now. Please try again in a little while.');
      return;
    }
    // One payment option → go straight to it. Several → let the customer choose.
    if (methods.length === 1) {
      pay(plan, methods[0].gateway);
    } else {
      setPickerPlan(plan);
    }
  }

  async function pay(plan, gateway) {
    setPickerPlan(null);
    // Snap's START_CHECKOUT right before leaving for the payment gateway.
    trackSnapStartCheckout({ price: plan.price, currency: 'INR', planId: plan._id });
    setSubscribingId(plan._id);
    try {
      const { redirectUrl } = await subscribe(plan._id, redirectAfter || undefined, gateway);
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err.message);
      setSubscribingId(null);
    }
  }

  const activeSubscriber = isActive(me);

  return (
    <main>
      <div className="bg-bg-raised border-b border-white/[0.06] px-4 sm:px-8 md:px-14 py-6 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Subscription Plan</h1>
        <p className="text-text-mid text-sm">
          <Link href="/" className="hover:text-text-hi">Home</Link>
          <span className="mx-2 text-text-low">›</span>
          <span className="text-text-hi">Subscription Plan</span>
        </p>
      </div>

      <div className="px-4 sm:px-8 md:px-14 py-8 sm:py-12">
        {status === 'success' ? (
          // Dedicated success screen — no plans grid underneath, no auto
          // redirect timer; the person clicks "Watch Now" themselves.
          <div className="max-w-md mx-auto bg-bg-card rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-600/15 border border-emerald-600/40 text-emerald-400 flex items-center justify-center text-2xl font-bold">
              ✓
            </div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white mb-1.5">Thank You!</h2>
            <p className="text-text-mid text-sm mb-6">
              Your payment was successful — your subscription is now active
              {(searchParams.get('plan') || me?.subscriptionPlan) && (
                <>
                  {' '}on the{' '}
                  <span className="text-text-hi font-semibold">{searchParams.get('plan') || me.subscriptionPlan}</span> plan
                </>
              )}
              .
            </p>
            <Link href={withAutoplay(redirectAfter)} className={btnPrimary}>
              Watch Now
            </Link>
          </div>
        ) : status === 'pending' ? (
          <PendingPayment txn={searchParams.get('txn')} redirectAfter={redirectAfter} />
        ) : (
          <>
            {status === 'failed' && (
              <div className="bg-danger/10 border border-danger/25 text-red-400 rounded-xl px-5 py-4 mb-6 text-sm font-semibold">
                Payment failed. No money was taken — please try again.
              </div>
            )}
            {status === 'error' && (
              <div className="bg-danger/10 border border-danger/25 text-red-400 rounded-xl px-5 py-4 mb-6 text-sm font-semibold">
                Something went wrong with the payment. If money was deducted, your plan will be activated
                automatically within a few minutes — please don&apos;t pay again.
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

            {activeSubscriber ? (
              <div className="max-w-md bg-bg-card rounded-2xl p-6 sm:p-8">
                <p className="text-text-mid text-sm mb-1.5">You&apos;re on the</p>
                <p className="font-display font-extrabold text-xl sm:text-2xl text-white mb-1.5">
                  {me.subscriptionPlan || 'active'} plan
                </p>
                {me.subscriptionExpiry && (
                  <p className="text-text-mid text-sm mb-6">
                    Active until {new Date(me.subscriptionExpiry).toLocaleDateString()}
                  </p>
                )}
                <Link href={redirectAfter ? withAutoplay(redirectAfter) : '/'} className={btnPrimary}>
                  {redirectAfter ? 'Back to video' : 'Browse content'}
                </Link>
              </div>
            ) : (
              <>
                {plans.length === 0 && !error && (
                  <p className="text-text-mid text-sm">No plans available yet — add one from the admin panel.</p>
                )}
                {methods && methods.length === 0 && plans.length > 0 && (
                  <p className="text-text-mid text-sm mb-6">
                    Payments are not available right now. Please try again in a little while.
                  </p>
                )}

                <div className="flex gap-4 sm:gap-6 flex-wrap">
                  {plans.map((plan) => (
                    <div key={plan._id} className="w-full max-w-[340px] sm:w-[280px] sm:max-w-none rounded-2xl overflow-hidden bg-bg-card">
                      <div className="bg-gradient-to-r from-accent to-ruby px-5 py-3 text-white font-bold text-sm">
                        {plan.durationDays} Day{plan.durationDays > 1 ? 's' : ''}
                        {plan.discountPercent > 0 && ` (${plan.discountPercent}% off)`}
                      </div>
                      <div className="p-6">
                        <p className="text-3xl font-display font-extrabold mb-1 text-white">₹ {plan.price}.00</p>
                        <div className="h-[2px] w-14 bg-ruby rounded-full mb-4" />
                        <p className="text-text-mid text-sm mb-1.5">{plan.durationDays} Day(s)</p>
                        <p className="text-text-mid text-sm mb-5">Device Limit - {plan.deviceLimit || 1}</p>
                        {plan.features?.length > 0 && (
                          <ul className="text-[13px] text-text-mid mb-5 flex flex-col gap-1.5">
                            {plan.features.map((f) => (
                              <li key={f}>✓ {f}</li>
                            ))}
                          </ul>
                        )}
                        <button
                          onClick={() => handleSubscribe(plan)}
                          disabled={subscribingId === plan._id || methods === null}
                          className="w-full bg-gradient-to-r from-accent to-ruby text-white font-bold text-sm py-3 rounded-lg disabled:opacity-60"
                        >
                          {subscribingId === plan._id ? 'Redirecting…' : 'SUBSCRIBE'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {pickerPlan && (
        <PaymentPicker
          plan={pickerPlan}
          methods={methods}
          onPick={(gateway) => pay(pickerPlan, gateway)}
          onClose={() => setPickerPlan(null)}
        />
      )}
    </main>
  );
}

// "How do you want to pay?" — one button per payment option this site has on.
function PaymentPicker({ plan, methods, onPick, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choose payment method"
    >
      <div className="w-full max-w-sm bg-bg-card rounded-2xl p-6 border border-white/[0.08]" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-extrabold text-lg text-white mb-1">Choose payment method</h2>
        <p className="text-text-mid text-sm mb-5">
          {plan.name} · ₹ {plan.price}.00 · {plan.durationDays} Day{plan.durationDays > 1 ? 's' : ''}
        </p>
        <div className="flex flex-col gap-3">
          {methods.map((m) => (
            <button
              key={m.gateway}
              onClick={() => onPick(m.gateway)}
              className="w-full text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-accent rounded-xl px-4 py-3.5 transition-colors"
            >
              <span className="block text-white font-bold text-sm">Pay with {m.label}</span>
              <span className="block text-text-low text-[12px] mt-0.5">UPI, cards, net banking</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 text-text-mid hover:text-text-hi text-sm py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

// Shown when the gateway hasn't confirmed yet (often slow UPI). Asks the
// backend every 10 s for up to 5 minutes; as soon as the payment is paid it
// moves to the success screen, failed → the failed message.
const POLL_MS = 10 * 1000;
const POLL_FOR_MS = 5 * 60 * 1000;

function PendingPayment({ txn, redirectAfter }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!txn) {
      setGaveUp(true);
      return undefined;
    }
    const started = Date.now();
    let stopped = false;
    let timer;

    async function check() {
      try {
        const p = await getPaymentStatus(txn);
        if (stopped) return;
        const redirect = redirectAfter || p.redirectPath;
        const redirectQs = redirect ? `&redirect=${encodeURIComponent(redirect)}` : '';
        if (p.status === 'paid') {
          router.replace(
            `/plans?status=success&amount=${p.amount}&plan=${encodeURIComponent(p.planName || '')}&txn=${encodeURIComponent(p.txn)}${redirectQs}`
          );
          return;
        }
        if (p.status === 'failed') {
          router.replace(`/plans?status=failed${redirectQs}`);
          return;
        }
      } catch {
        // network blip — just try again on the next tick
      }
      if (Date.now() - started > POLL_FOR_MS) {
        setGaveUp(true);
        return;
      }
      timer = setTimeout(check, POLL_MS);
    }

    check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [txn, redirectAfter, router]);

  return (
    <div className="max-w-md mx-auto bg-bg-card rounded-2xl p-6 sm:p-8 text-center">
      {!gaveUp ? (
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-[3px] border-white/15 border-t-accent animate-spin" aria-hidden="true" />
      ) : (
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl font-bold">
          !
        </div>
      )}
      <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white mb-1.5">
        {gaveUp ? 'Still confirming your payment' : 'Confirming your payment…'}
      </h2>
      <p className="text-text-mid text-sm mb-2">
        {gaveUp
          ? 'Your bank is taking longer than usual. If money was deducted, your plan will be activated automatically within a few minutes.'
          : 'This usually takes a few seconds. Please keep this page open.'}
      </p>
      <p className="text-text-hi text-sm font-semibold mb-6">Please don&apos;t pay again.</p>
      {gaveUp && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => window.location.reload()} className={btnPrimary}>
            Check again
          </button>
          <Link href="/" className="inline-block border border-white/15 text-text-hi font-bold text-sm px-6 py-3 rounded-pill">
            Go to Home
          </Link>
        </div>
      )}
    </div>
  );
}
