'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { logout as logoutRequest } from '../lib/api';
import SiteLogo from './SiteLogo';
import { SITE_NAME } from '../lib/site';

const TABS = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/series', label: 'Series' },
];

export function CrownIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 18h18l1.2-9-5.2 3.5L12 5l-5 7.5L1.8 9 3 18z" />
    </svg>
  );
}

function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userLabel, setUserLabel] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef(null);

  // Re-checks localStorage every time the route changes (not just on first
  // mount) — the navbar lives in the root layout and never remounts on a
  // client-side navigation, so without this it kept showing LOGIN after a
  // successful login (or the account menu after logout) until a manual
  // page refresh. router.push() from the login page / mock-payment flow
  // changes `pathname`, which is what triggers this to pick the token up.
  useEffect(() => {
    // simple client-side check — the real gate is server-side on locked routes
    setLoggedIn(!!localStorage.getItem('token'));
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const digits = user?.phone?.slice(-4) || '';
      setUserLabel(digits ? `USER_${digits}` : 'ACCOUNT');
    } catch {
      setUserLabel('ACCOUNT');
    }
  }, [pathname]);

  useEffect(() => {
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    // The real session lives in an httpOnly cookie the backend set on
    // login — localStorage was never more than a display convenience, so
    // clearing only that left the cookie behind and every locked video
    // kept playing after "logout". This tells the backend to clear it.
    try {
      await logoutRequest();
    } catch {
      // even if the request fails (e.g. offline), still clear the local
      // side below so the UI doesn't stay stuck showing "logged in"
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // The navbar doesn't remount on a client-side navigation, so without
    // resetting this state here, the "logged in" dropdown kept showing
    // even after the token was cleared — this is what actually makes
    // logout take effect immediately instead of needing a manual refresh.
    setLoggedIn(false);
    setUserLabel('');
    setMenuOpen(false);
    setMobileOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-50 bg-bg/90 backdrop-blur border-b border-white/10">
      <div className="flex items-center justify-between px-4 sm:px-8 md:px-14 py-3 md:py-4">
        <div className="flex items-center gap-11">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="md:hidden w-9 h-9 -ml-1.5 flex items-center justify-center text-text-hi"
          >
            {mobileOpen ? <CloseIcon width={20} height={20} /> : <MenuIcon width={20} height={20} />}
          </button>

          <Link href="/" aria-label={`${SITE_NAME} home`} className="flex items-center">
            <span className="md:hidden"><SiteLogo size={24} /></span>
            <span className="hidden md:inline"><SiteLogo size={32} /></span>
          </Link>
          <div className="hidden md:flex gap-8 text-[15px] font-semibold tracking-[0.08em]">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`pb-1 border-b-2 transition-colors ${
                  pathname === tab.href
                    ? 'text-text-hi border-accent'
                    : 'text-[#E6E1D6] border-transparent hover:text-accent'
                }`}
              >
                {tab.label.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            aria-label="Search"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-hi transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </button>
          <Link
            href="/plans"
            aria-label="Plans"
            className="h-9 sm:h-11 w-9 sm:w-auto sm:px-5 rounded-full border-[1.5px] border-accent text-accent hover:bg-accent/10 flex items-center justify-center gap-2 text-[14px] font-bold transition-colors"
          >
            <CrownIcon size={16} />
            <span className="hidden sm:inline">Go Premium</span>
          </Link>
          {loggedIn ? (
            <div className="relative ml-0.5 sm:ml-1" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px] font-semibold text-text-hi"
              >
                <span className="hidden sm:inline">{userLabel}</span>
                <span className="sm:hidden">ACC</span>
                <span className="text-text-low text-[10px]">▾</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-40 bg-bg-card border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                  <Link
                    href="/plans"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-[13px] text-text-mid hover:bg-bg-raised hover:text-text-hi"
                  >
                    My Plan
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-red-400 hover:bg-bg-raised"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-gradient-to-r from-[#FF4D6D] via-[#FF7A45] to-[#FF9F1C] hover:opacity-90 text-white font-bold text-[12px] sm:text-[13px] px-4 sm:px-6 py-2.5 rounded-pill transition-opacity ml-0.5 sm:ml-1"
            >
              LOGIN
            </Link>
          )}
        </div>
      </div>

      {/* mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1 bg-bg-raised">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setMobileOpen(false)}
              className={`px-2 py-2.5 rounded-lg text-sm font-bold ${
                pathname === tab.href ? 'text-accent bg-white/5' : 'text-text-mid'
              }`}
            >
              {tab.label.toUpperCase()}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}