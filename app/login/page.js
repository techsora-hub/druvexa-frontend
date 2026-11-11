'use client';

// -----------------------------------------------------------------------------
// Druvexa landing / login page. A slowly turning 3D ring of posters (like a
// carousel seen from the front) over a blurred poster backdrop, and a glass
// sign-in card. No brand name or logo on the page. Logged-out visitors (and
// ad clicks) land here via middleware.js. The OTP is the site's real login
// (lib/api.js).
//
// Posters come from public/landing/posters/poster-01.webp ... poster-13.webp
// (already in the repo). Fonts come from public/landing/fonts/.
// -----------------------------------------------------------------------------

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { sendOtp, verifyOtp } from '../../lib/api';
import { trackSnapSignUp } from '../../lib/snapPixel';
import './landing.css';

const POSTERS = Array.from({ length: 13 }, (_, i) => `/landing/posters/poster-${String(i + 1).padStart(2, '0')}.webp`);
const RING_SECONDS = 52; // one full turn of the poster ring
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

function safeRedirect(raw) {
  if (!raw) return '/';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

const onlyDigits = (v) => String(v || '').replace(/\D/g, '');

// Accepts typed or pasted "+91 98765-43210", "098765 43210", etc.
function normalisePhone(raw) {
  let d = onlyDigits(raw);
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
  if (d.length > 10 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
}

function phoneProblem(d) {
  if (!d) return 'Please enter your mobile number.';
  if (d.length < 10) return 'Enter a valid 10-digit mobile number.';
  if (!/^[6-9]/.test(d)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
  return '';
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="dx-blank" />}>
      <Landing />
    </Suspense>
  );
}

function Landing() {
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));

  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState('phone'); // phone | otp | done
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLeft, setResendLeft] = useState(0);
  const [front, setFront] = useState(0);

  const busyRef = useRef(false);
  const loggedInRef = useRef(false);
  const fieldRef = useRef(null);
  const otpRef = useRef(null);

  // Already logged in → straight on to where they were going.
  useEffect(() => {
    if (localStorage.getItem('token')) window.location.replace(redirect);
    else setChecking(false);
  }, [redirect]);

  // Full-screen page: no page scroll behind it while it is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Backdrop follows the ring: every few seconds it fades to the poster that
  // is turning to the front.
  useEffect(() => {
    if (checking) return undefined;
    const t = setInterval(() => setFront((n) => (n + 1) % POSTERS.length), RING_SECONDS * 1000 / POSTERS.length);
    return () => clearInterval(t);
  }, [checking]);

  // Resend countdown.
  useEffect(() => {
    if (resendLeft <= 0) return undefined;
    const t = setTimeout(() => setResendLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendLeft]);

  // Android Chrome: read the code straight from the SMS (WebOTP API).
  useEffect(() => {
    if (step !== 'otp' || typeof window === 'undefined' || !('OTPCredential' in window)) return undefined;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then((cred) => {
        const c = onlyDigits(cred && cred.code).slice(0, OTP_LENGTH);
        if (c.length === OTP_LENGTH) {
          setCode(c);
          verify(c);
        }
      })
      .catch(() => {});
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function fail(text) {
    setInfo('');
    setError(text);
    const f = fieldRef.current;
    if (f) {
      f.classList.remove('dx-shake');
      void f.offsetWidth; // restart the shake animation
      f.classList.add('dx-shake');
    }
  }

  function finishLogin(token, user) {
    loggedInRef.current = true;
    localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    setStep('done');
    // Full reload so middleware re-checks with the new login cookie.
    window.location.href = redirect;
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    if (busyRef.current) return;
    const problem = phoneProblem(phone);
    if (problem) {
      fail(problem);
      return;
    }
    busyRef.current = true;
    setError('');
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res && res.requiresOtp === false) {
        trackSnapSignUp('phone');
        finishLogin(res.token, res.user);
        return;
      }
      setCode('');
      setInfo('');
      setStep('otp');
      setResendLeft(RESEND_SECONDS);
    } catch (err) {
      if (!loggedInRef.current) fail(err.message || "Couldn't send the OTP. Please try again.");
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  async function verify(value) {
    if (busyRef.current) return;
    const c = onlyDigits(value);
    if (c.length !== OTP_LENGTH) {
      fail(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    busyRef.current = true;
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const { token, user } = await verifyOtp(phone, c);
      finishLogin(token, user);
    } catch (err) {
      if (!loggedInRef.current) {
        setCode('');
        fail(err.message || 'That code didn’t work. Please try again.');
        if (otpRef.current) otpRef.current.focus();
      }
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  async function resend() {
    if (busyRef.current || resendLeft > 0) return;
    busyRef.current = true;
    setResendLeft(RESEND_SECONDS);
    try {
      await sendOtp(phone);
      setError('');
      setInfo('A new code is on its way.');
    } catch (err) {
      setResendLeft(0);
      setInfo('');
      setError(err.message || "Couldn't resend the code. Please try again.");
    } finally {
      busyRef.current = false;
    }
  }

  function changeNumber() {
    setStep('phone');
    setCode('');
    setError('');
    setInfo('');
    setResendLeft(0);
  }

  if (checking) return <div className="dx-blank" />;

  const done = step === 'done';

  return (
    <div className="dx-root">
      {/* Backdrop: the poster turning to the front, blurred */}
      <div className="dx-back" aria-hidden="true">
        {POSTERS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className={i === front ? 'is-on' : ''} decoding="async" />
        ))}
      </div>
      <div className="dx-shade" aria-hidden="true" />

      <main className="dx-stage">
        {/* 3D poster ring */}
        <div className="dx-ring-wrap" aria-hidden="true">
          <div className="dx-ring" style={{ '--dx-n': POSTERS.length, '--dx-spin': `${RING_SECONDS}s` }}>
            {POSTERS.map((src, i) => (
              <div key={src} className="dx-card3d" style={{ '--dx-i': i }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" decoding="async" draggable="false" />
              </div>
            ))}
          </div>
          <div className="dx-floor" />
        </div>

        <header className="dx-intro">
          <span className="dx-pill"></span>
          <h2 className="dx-headline">
            Tonight&rsquo;s top picks <span>are waiting.</span>
          </h2>
        </header>

        <section className={`dx-card${done ? ' is-success' : ''}`} aria-labelledby="dx-title">
          <h1 className="dx-card__title" id="dx-title">
            {done ? 'Welcome' : step === 'otp' ? 'Verify your number' : 'Sign in with mobile'}
          </h1>
          <p className="dx-card__sub">
            {done && 'Signing you in…'}
            {step === 'phone' && 'We’ll send a one-time password by SMS.'}
            {step === 'otp' && (
              <>
                Code sent to <strong>+91 {phone.slice(0, 5)} {phone.slice(5)}</strong>
              </>
            )}
          </p>

          {step === 'phone' && (
            <form className="dx-step" key="phone" onSubmit={handleSendOtp} noValidate>
              <div ref={fieldRef} className={`dx-field${error ? ' is-invalid' : ''}`}>
                <span className="dx-field__prefix">
                  <IndiaFlag />
                  <span>+91</span>
                </span>
                <input
                  id="dxPhone"
                  className="dx-field__input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Mobile number"
                  aria-label="Mobile number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(normalisePhone(e.target.value));
                    setError('');
                  }}
                />
              </div>
              <p className="dx-msg" role="alert" aria-live="polite">
                {error}
              </p>
              <button className={`dx-btn${loading ? ' is-loading' : ''}`} type="submit" disabled={loading} aria-busy={loading}>
                <span className="dx-btn__label">Get OTP</span>
                <span className="dx-btn__spinner" aria-hidden="true" />
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form
              className="dx-step"
              key="otp"
              onSubmit={(e) => {
                e.preventDefault();
                verify(code);
              }}
              noValidate
            >
              <div ref={fieldRef} className={`dx-field dx-field--otp${error ? ' is-invalid' : ''}`}>
                <input
                  id="dxOtp"
                  ref={otpRef}
                  className="dx-field__input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder={'•'.repeat(OTP_LENGTH)}
                  aria-label="One-time password"
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    const c = onlyDigits(e.target.value).slice(0, OTP_LENGTH);
                    setCode(c);
                    setError('');
                    if (c.length === OTP_LENGTH) verify(c); // auto-submit
                  }}
                />
              </div>
              <p className={`dx-msg${info && !error ? ' is-info' : ''}`} role="alert" aria-live="polite">
                {error || info}
              </p>
              <button className={`dx-btn${loading ? ' is-loading' : ''}`} type="submit" disabled={loading} aria-busy={loading}>
                <span className="dx-btn__label">Verify &amp; Continue</span>
                <span className="dx-btn__spinner" aria-hidden="true" />
              </button>
              <div className="dx-links">
                <button className="dx-link" type="button" onClick={changeNumber}>
                  Change number
                </button>
                <button className="dx-link" type="button" onClick={resend} disabled={resendLeft > 0}>
                  {resendLeft > 0 ? `Resend in 0:${String(resendLeft).padStart(2, '0')}` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          <ul className="dx-perks" aria-label="What you get">
            <li>
              <Tick /> HD streaming
            </li>
            <li>
              <Tick /> Any device
            </li>
            <li>
              <Tick /> Secure OTP login
            </li>
          </ul>

          <p className="dx-legal">
           
          </p>
        </section>
      </main>
    </div>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" opacity=".18" />
      <path d="M4.6 8.3l2.2 2.2 4.6-4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IndiaFlag() {
  return (
    <svg className="dx-flag" viewBox="0 0 30 20" width="26" height="17" aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#f28c28" />
      <rect y="13.33" width="30" height="6.67" fill="#138a36" />
      <circle cx="15" cy="10" r="2.7" fill="none" stroke="#1a3a8f" strokeWidth=".8" />
    </svg>
  );
}
