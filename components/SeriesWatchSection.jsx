'use client';

import { useRef, useState } from 'react';
import DetailHero from './DetailHero';
import EpisodeList from './EpisodeList';

// Client Component wrapper that holds the ONE shared "which video is
// currently playing" state for a series page — clicking an episode card
// below updates the same state that drives the hero player above.
export default function SeriesWatchSection({ series, firstEpisode }) {
  const [playingUrl, setPlayingUrl] = useState(null);
  const heroRef = useRef(null);

  function handlePlayingUrlChange(url) {
    setPlayingUrl(url);
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <div ref={heroRef}>
        <DetailHero
          content={series}
          contentType="series"
          ctaLabel="WATCH WEBSERIES"
          videoTarget={firstEpisode ? { seriesId: series._id, episodeId: firstEpisode._id } : null}
          playingUrl={playingUrl}
          onPlayingUrlChange={handlePlayingUrlChange}
        />
      </div>

      <EpisodeList
        seriesId={series._id}
        episodes={series.episodes || []}
        playingUrl={playingUrl}
        onPlayingUrlChange={handlePlayingUrlChange}
      />
    </>
  );
}