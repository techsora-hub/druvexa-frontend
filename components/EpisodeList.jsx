'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CrownIcon } from './Navbar';
import { getEpisodeVideo } from '../lib/api';

const GRADIENTS = [
  'from-[#3A2050] to-[#7A2E4E]',
  'from-[#1E2A4E] to-[#3E5A8E]',
  'from-[#4E3320] to-[#8E5A2E]',
  'from-[#2A3A28] to-[#5E7A3E]',
  'from-[#3A2140] to-[#7C3F8C]',
];

// playingUrl / onPlayingUrlChange come from the parent SeriesWatchSection —
// this component no longer has its own player or its own playing-video
// state. Clicking an episode card fetches that episode's stream and hands
// the URL up to the parent, which is what actually drives the hero player
// above.
export default function EpisodeList({ seriesId, episodes, playingUrl, onPlayingUrlChange }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  if (!episodes || episodes.length === 0) return null;

  async function handlePlay(episodeId) {
    setError(null);
    setLoadingId(episodeId);
    try {
      const { hlsMasterUrl } = await getEpisodeVideo(seriesId, episodeId);
      onPlayingUrlChange(hlsMasterUrl);
    } catch (err) {
      if (err.code === 'LOGIN_REQUIRED') {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (err.code === 'SUBSCRIPTION_REQUIRED') {
        router.push('/plans');
      } else if (err.status === 409) {
        setError('This video is still being processed — please try again in a few minutes.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-8 md:px-14">
        <h2 className="font-display font-bold text-base sm:text-lg text-white">Episodes</h2>
      </div>

      {error && <p className="text-sm text-red-400 mb-4 px-4 sm:px-8 md:px-14">{error}</p>}

      <div className="flex gap-3 sm:gap-4 overflow-x-auto scroll-row px-4 sm:px-8 md:px-14 pb-1.5">
        {episodes.map((ep, i) => (
          <button
            key={ep._id}
            onClick={() => handlePlay(ep._id)}
            disabled={loadingId === ep._id}
            className="flex-none w-[128px] sm:w-[150px] md:w-[168px] group text-left disabled:opacity-70"
          >
            <div
              className={`h-[190px] sm:h-[222px] md:h-[248px] rounded-xl relative flex items-end p-2.5 sm:p-3 overflow-hidden transition-transform group-hover:-translate-y-1 group-hover:ring-2 group-hover:ring-accent/60 ${
                !ep.thumbnail ? `bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}` : 'bg-bg-card'
              }`}
            >
              {ep.thumbnail && (
                <Image
                  src={ep.thumbnail}
                  alt={`Episode ${ep.episodeNumber}`}
                  fill
                  sizes="(max-width: 639px) 128px, (max-width: 767px) 150px, 168px"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

              <span className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-ruby flex items-center justify-center shadow-lg">
                {loadingId === ep._id ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CrownIcon size={10} className="text-white" />
                )}
              </span>

              <span className="relative z-10 font-display font-bold text-[12px] sm:text-[13.5px] text-white leading-snug">
                Episode {ep.episodeNumber}
                {ep.title ? ` — ${ep.title}` : ''}
              </span>
            </div>
            <p className="text-[11px] sm:text-[12px] text-text-mid mt-2">Season {ep.season}</p>
          </button>
        ))}
      </div>
    </div>
  );
}