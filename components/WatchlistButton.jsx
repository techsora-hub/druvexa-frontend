'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addToWatchlist, removeFromWatchlist } from '../lib/api';

export default function WatchlistButton({ contentType, contentId, initialInWatchlist = false }) {
  const router = useRouter();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(contentId);
        setInWatchlist(false);
      } else {
        await addToWatchlist(contentType, contentId);
        setInWatchlist(true);
      }
    } catch (err) {
      // non-fatal — watchlist is a nice-to-have, don't block the page on it
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 ${
        inWatchlist
          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40'
          : 'bg-emerald-600 text-white hover:bg-emerald-500'
      }`}
    >
      {inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
    </button>
  );
}