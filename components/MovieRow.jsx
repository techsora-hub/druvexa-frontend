'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CrownIcon } from './Navbar';
import { cardHref } from '../lib/cardHref';

const GRADIENTS = [
  'from-[#3A2050] to-[#7A2E4E]',
  'from-[#1E2A4E] to-[#3E5A8E]',
  'from-[#4E3320] to-[#8E5A2E]',
  'from-[#2A3A28] to-[#5E7A3E]',
  'from-[#3A2140] to-[#7C3F8C]',
];

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

// arrows: only pass true for rows like "You May Also Like" on detail pages
// — home page rows stay plain-scroll.
export default function MovieRow({ title, items, viewAllHref, arrows = false }) {
  const scrollRef = useRef(null);

  if (!items || items.length === 0) return null;

  function scrollBy(delta) {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  return (
    <div className="mb-10 relative">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-8 md:px-14">
        <h2 className="font-display font-bold text-base sm:text-lg text-white">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-accent text-[12.5px] font-bold hover:text-accent-dim">
            View All
          </Link>
        )}
      </div>

      <div className="relative">
        <div ref={scrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto scroll-row px-4 sm:px-8 md:px-14 pb-1.5 scroll-smooth">
          {items.map((item, i) => (
            <Link
              key={item._id || item.slug}
              href={cardHref(item)}
              className="flex-none w-[128px] sm:w-[150px] md:w-[168px] group"
            >
              <div
                className={`h-[190px] sm:h-[222px] md:h-[248px] rounded-xl relative flex items-end p-2.5 sm:p-3 overflow-hidden transition-transform group-hover:-translate-y-1 group-hover:ring-2 group-hover:ring-accent/60 ${
                  !item.poster ? `bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}` : 'bg-bg-card'
                }`}
              >
                {item.poster && (
                  <Image src={item.poster} alt={item.title} fill sizes="(max-width: 639px) 128px, (max-width: 767px) 150px, 168px" className="object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                {/* crown badge — indicates subscription-locked content */}
                <span className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-ruby flex items-center justify-center shadow-lg">
                  <CrownIcon size={10} className="text-white sm:hidden" />
                  <CrownIcon size={11} className="text-white hidden sm:block" />
                </span>

                <span className="relative z-10 font-display font-bold text-[12px] sm:text-[13.5px] text-white leading-snug">
                  {item.title}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {arrows && items.length > 3 && (
          <>
            <button
              onClick={() => scrollBy(-500)}
              aria-label="Scroll left"
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-ruby hover:bg-ruby-dim items-center justify-center text-white shadow-lg transition-colors"
            >
              <ChevronLeft width={16} height={16} />
            </button>
            <button
              onClick={() => scrollBy(500)}
              aria-label="Scroll right"
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-ruby hover:bg-ruby-dim items-center justify-center text-white shadow-lg transition-colors"
            >
              <ChevronRight width={16} height={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}