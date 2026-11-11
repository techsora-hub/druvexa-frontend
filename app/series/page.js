import MovieRow from '../../components/MovieRow';
import { getSeriesList } from '../../lib/api';

export const revalidate = 60;

export default async function SeriesListPage() {
  let series = [];
  try {
    const res = await getSeriesList(1, 40);
    series = (res.data || []).map((s) => ({ ...s, type: 'series' }));
  } catch (err) {
    return <div className="px-4 sm:px-8 md:px-14 py-20 text-text-mid">Couldn&apos;t load series right now.</div>;
  }

  return (
    <main className="pt-8 sm:pt-10 pb-16">
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl px-4 sm:px-8 md:px-14 mb-6 sm:mb-8 text-white">All Series</h1>
      <MovieRow title="Series" items={series} />
    </main>
  );
}