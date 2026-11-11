'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cardHref } from '../lib/cardHref';
import { SITE_NAME } from '../lib/site';

function ChevronLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GAP_REM = 1.25;

// banners: [{ _id, image, title, description, contentType, slug }, ...]
// from GET /api/hero-banners — admin-managed, not derived from trending.
export default function HeroBanner({ banners }) {
  const [index, setIndex] = useState(0);
  // On phones the "peek" effect (side slides poking in) has no room to
  // breathe, so slides go edge-to-edge there and only get the 84%-with-peek
  // treatment from `sm` up. Tracked via matchMedia so the transform math
  // below always matches what's actually on screen.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!banners || banners.length === 0) return null;

  const hasPeek = banners.length > 1 && !isMobile;
  const slideWidth = isMobile ? 100 : 84; // percent
  const peekPercent = isMobile ? 0 : (100 - slideWidth) / 2;

  function go(delta) {
    setIndex((i) => (i + delta + banners.length) % banners.length);
  }

  // Only wrap with phantom peek-slides when there are genuinely 2+ distinct
  // banners AND we're not on mobile — on mobile it's a plain one-per-screen
  // swiper instead.
  const workingBanners = hasPeek ? [banners[banners.length - 1], ...banners, banners[0]] : banners;
  const activeSlot = hasPeek ? index + 1 : index;

  function renderSlide(banner, i) {
    const isActive = i === activeSlot;
    const watchHref = cardHref({ type: banner.contentType, slug: banner.slug });

    // The frame takes the wide poster's own 16:9 shape on every screen, so
    // the poster fills it edge to edge (no side gaps, no side crop). On very
    // wide screens the height is capped at 75% of the window — then only a
    // little of the top/bottom is trimmed, never the sides.

    return (
      <div
        key={`${banner._id}-${i}`}
        className="relative flex-shrink-0 aspect-[16/9] max-h-[75vh] rounded-none sm:rounded-3xl overflow-hidden bg-bg-card"
        style={{
          width: `${slideWidth}%`,
          marginLeft: i === 0 ? `${peekPercent}%` : undefined,
        }}
      >
        {banner.image && (
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            sizes="(max-width: 639px) 100vw, 84vw"
            priority={isActive}
            className={`object-cover transition-[filter] duration-500 ${hasPeek && !isActive ? 'brightness-50' : ''}`}
          />
        )}

        {(isActive || !hasPeek) && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/30 sm:via-bg/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent" />

            <div className="relative z-10 h-full flex items-end px-4 sm:px-6 md:px-10 pb-4 sm:pb-10 md:pb-12 max-w-xl">
              <div>
                <h1 className="font-display font-extrabold text-lg sm:text-3xl md:text-5xl leading-tight mb-2 sm:mb-3 text-white line-clamp-2">
                  {banner.title}
                </h1>
                {banner.description && (
                  <p className="hidden sm:block text-text-mid text-sm leading-relaxed mb-5 max-w-md line-clamp-3">
                    {banner.description}
                  </p>
                )}
                <div className="flex gap-2 sm:gap-3">
                  <Link
                    href={watchHref}
                    className="bg-accent hover:bg-accent-dim text-bg font-bold text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3 rounded-pill flex items-center gap-2 transition-colors"
                  >
                    ▶ WATCH
                  </Link>
                  <Link
                    href="/plans"
                    className="bg-ruby hover:bg-ruby-dim text-white font-bold text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3 rounded-pill flex items-center gap-2 transition-colors"
                  >
                    BUY PLAN
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-bg">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{
          gap: hasPeek ? `${GAP_REM}rem` : 0,
          transform:
            banners.length > 1
              ? `translateX(calc(-${activeSlot} * (${slideWidth}% + ${hasPeek ? GAP_REM : 0}rem)))`
              : 'none',
        }}
      >
        {workingBanners.map(renderSlide)}
      </div>

      {hasPeek && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            style={{ left: `calc(${peekPercent}% + 12px)` }}
            className="absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-bg transition-colors"
          >
            <ChevronLeft width={18} height={18} />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next"
            style={{ right: `calc(${peekPercent}% + 12px)` }}
            className="absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-bg transition-colors"
          >
            <ChevronRight width={18} height={18} />
          </button>
        </>
      )}
      {!hasPeek && banners.length > 1 && isMobile && (
        <div className="flex justify-center gap-1.5 py-3">
          {banners.map((b, i) => (
            <button
              key={b._id}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-accent' : 'w-1.5 bg-white/25'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}