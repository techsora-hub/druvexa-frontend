import { getSeriesDetail, getRelatedToSeries } from '../../../lib/api';
import SeriesWatchSection from '../../../components/SeriesWatchSection';
import MovieRow from '../../../components/MovieRow';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function SeriesDetailPage({ params }) {
  let series;
  let related = [];

  try {
    series = await getSeriesDetail(params.slug);
  } catch (err) {
    if (err.status === 404) return notFound();
    return (
      <div className="px-4 sm:px-8 md:px-14 py-20 text-center text-text-mid">
        Couldn&apos;t load this series right now.
      </div>
    );
  }

  try {
    related = await getRelatedToSeries(params.slug);
  } catch {
    // related content is a nice-to-have — page still works without it
  }

  const firstEpisode = series.episodes?.[0];

  return (
    <main>
      <SeriesWatchSection series={series} firstEpisode={firstEpisode} />

      {related.length > 0 && <MovieRow title="You May Also Like" items={related} arrows />}
    </main>
  );
}