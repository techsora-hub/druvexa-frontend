'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import WatchlistButton from './WatchlistButton';
import ShareButton from './ShareButton';
import RatingBadge from './RatingBadge';
import { formatCount } from '../lib/format';
import { getEpisodeVideo, getMovieVideo } from '../lib/api';
import { trackSnapViewContent } from '../lib/snapPixel';

function PlayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

// videoTarget: { seriesId, episodeId } for a series' first episode,
// { movieId } for a movie, or null if nothing is playable yet.
// Passed as plain data (not a function) because Server Components can't
// hand functions to Client Components across the boundary.
//
// playingUrl / onPlayingUrlChange are OPTIONAL — when a parent (like
// SeriesWatchSection) wants to control which video this hero plays (e.g. so
// an episode card below can drive this same player), it passes both. When
// they're left undefined (the Movie detail page, which has no episode
// list), this component falls back to its own internal state exactly like
// before, so nothing there changes.
export default function DetailHero({
  content,
  contentType,
  ctaLabel,
  videoTarget,
  playingUrl: controlledPlayingUrl,
  onPlayingUrlChange,
}) {
  const router = useRouter();
  const videoRef = useRef(null);
  const [internalPlayingUrl, setInternalPlayingUrl] = useState(null);
  const isControlled = controlledPlayingUrl !== undefined;
  const playingUrl = isControlled ? controlledPlayingUrl : internalPlayingUrl;
  const setPlayingUrl = isControlled ? onPlayingUrlChange : setInternalPlayingUrl;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const autoplayFired = useRef(false);

  // Fires Snap's VIEW_CONTENT once per content id — this component is the
  // one place both the movie detail page and the series detail page
  // (via SeriesWatchSection) render through, so it covers both without
  // needing to touch either page.js individually.
  useEffect(() => {
    if (!content?._id) return;
    trackSnapViewContent({ contentId: content._id, category: contentType });
  }, [content?._id, contentType]);

  // Attaches the HLS stream to the <video> element once a master playlist
  // URL is known. Safari has native HLS support (video.src works directly);
  // everything else (Chrome/Firefox/Edge) needs hls.js to do the segment
  // fetching + adaptive bitrate switching, since they don't support HLS
  // natively.
  useEffect(() => {
    if (!playingUrl || !videoRef.current) return;
    const video = videoRef.current;
    let hls;
    let cancelled = false;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playingUrl;
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(playingUrl);
          hls.attachMedia(video);
        } else {
          setError('Your browser does not support HLS video playback.');
        }
      });
    }

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
  }, [playingUrl]);

  async function handlePlay() {
    if (!videoTarget) return;
    setError(null);
    setLoading(true);
    try {
      const { hlsMasterUrl } = videoTarget.episodeId
        ? await getEpisodeVideo(videoTarget.seriesId, videoTarget.episodeId)
        : await getMovieVideo(videoTarget.movieId);
      setPlayingUrl(hlsMasterUrl);
    } catch (err) {
      if (err.code === 'LOGIN_REQUIRED') {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (err.code === 'SUBSCRIPTION_REQUIRED') {
        const backHere = `${window.location.pathname}?autoplay=1`;
        router.push(`/plans?redirect=${encodeURIComponent(backHere)}`);
      } else if (err.status === 409) {
        setError('This video is still being processed — please try again in a few minutes.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Coming from a fresh subscribe/login ("Watch Now" on the Thank You
  // screen, or a card click that found the person already subscribed) —
  // start playing immediately instead of making them click Play again.
  useEffect(() => {
    if (autoplayFired.current) return;
    if (typeof window === 'undefined' || !videoTarget) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoplay') === '1') {
      autoplayFired.current = true;
      handlePlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoTarget]);

  const tags = [...(content.genres || []), content.language].filter(Boolean);

  return (
    <div className="px-4 sm:px-8 md:px-14 pt-6 sm:pt-10 pb-6 sm:pb-8">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-9">
        {/* Left: thumbnail + play overlay + views/rating/watchlist/share row */}
        <div className="flex-[3]">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-bg-card">
            {content.poster && (
              <Image src={content.banner || content.poster} alt={content.title} fill className="object-cover" />
            )}
            {playingUrl ? (
              <video
                ref={videoRef}
                controls
                playsInline
                autoPlay
                className="absolute inset-0 w-full h-full bg-black"
              />
            ) : (
              <button
                onClick={handlePlay}
                disabled={loading || !videoTarget}
                aria-label="Play"
                className="absolute inset-0 flex items-center justify-center group disabled:cursor-not-allowed"
              >
                <span className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-ruby border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PlayIcon className="w-6 h-6 text-ruby translate-x-0.5" />
                  )}
                </span>
              </button>
            )}
          </div>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-text-mid text-[13px]">
                👁 {formatCount(content.viewCount)} Views
              </span>
              <RatingBadge rating={content.rating} />
            </div>
            <div className="flex items-center gap-2.5">
              <WatchlistButton
                contentType={contentType}
                contentId={content._id}
                initialInWatchlist={content.inWatchlist}
              />
              <ShareButton title={content.title} />
            </div>
          </div>
        </div>

        {/* Right: title, tags, CTA, description */}
        <div className="flex-[2] pt-1">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-3">{content.title}</h1>
          {tags.length > 0 && (
            <p className="text-text-mid text-sm mb-5">
              {tags.map((tag, i) => (
                <span key={tag}>
                  <span className="capitalize">{tag}</span>
                  {i < tags.length - 1 && <span className="mx-2 text-text-low">|</span>}
                </span>
              ))}
            </p>
          )}

          <button
            onClick={handlePlay}
            disabled={loading || !videoTarget || !!playingUrl}
            className="flex items-center gap-2 bg-accent hover:bg-accent-dim text-bg font-bold text-[13.5px] px-6 py-3 rounded-pill mb-6 disabled:opacity-60 transition-colors"
          >
            <PlayIcon className="w-4 h-4" />
            {ctaLabel}
          </button>

          {content.description && (
            <p className="text-text-mid text-sm leading-relaxed">{content.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}