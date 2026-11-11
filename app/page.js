import HeroBanner from '../components/HeroBanner';
import MovieRow from '../components/MovieRow';
import { getSeriesList, getMoviesList, getHeroBanners, getRowOrder, getCategories } from '../lib/api';

export const revalidate = 60;

const LATEST_KEY = '__latest__';
const TRENDING_KEY = '__trending__';
const MAX_ROWS = 12;

export default async function HomePage() {
  let series = [];
  let movies = [];
  let heroBanners = [];
  let rowOrder = [];
  let categories = [];
  let loadError = null;

  try {
    const [seriesRes, moviesRes, bannersRes, rowOrderRes, categoriesRes] = await Promise.all([
      getSeriesList(1, 30),
      getMoviesList(1, 30),
      getHeroBanners(),
      getRowOrder().catch(() => ({ order: [] })),
      getCategories().catch(() => []),
    ]);
    series = (seriesRes.data || []).map((s) => ({ ...s, type: 'series' }));
    movies = (moviesRes.data || []).map((m) => ({ ...m, type: 'movie' }));
    heroBanners = bannersRes || [];
    rowOrder = rowOrderRes?.order || [];
    categories = categoriesRes || [];
  } catch (err) {
    loadError = err.message;
  }

  if (loadError) {
    return (
      <div className="px-4 sm:px-8 md:px-14 py-20 text-center text-text-mid">
        <p className="mb-2">Couldn&apos;t load content right now.</p>
        <p className="text-sm text-text-low">{loadError}</p>
      </div>
    );
  }

  const allContent = [...series, ...movies];
  const latestMovies = [...movies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  const trending = allContent.filter((item) => item.isTrending).slice(0, 10);
  // NOTE: "Movies & Series" (mixed) and genre-tag auto-shelves are both
  // removed — every shelf below "Latest Movies" / "Trending Now" now comes
  // from an admin-curated Category (built + ordered from the admin panel).

  const rowRegistry = new Map();
  if (latestMovies.length > 0) {
    rowRegistry.set(LATEST_KEY, { title: 'Latest Movies', items: latestMovies, viewAllHref: '/movies' });
  }
  rowRegistry.set(TRENDING_KEY, {
    title: 'Trending Now',
    items: trending.length ? trending : series,
    viewAllHref: '/series',
  });
  categories.forEach((cat) => {
    if (cat.items?.length > 0) rowRegistry.set(cat._id, { title: cat.name, items: cat.items });
  });

  const orderedKeys = rowOrder.filter((key) => rowRegistry.has(key));
  const defaultRemaining = [
    LATEST_KEY,
    TRENDING_KEY,
    ...categories.filter((cat) => cat.items?.length > 0).map((cat) => cat._id),
  ].filter((key) => rowRegistry.has(key) && !orderedKeys.includes(key));

  const rowKeys = [...orderedKeys, ...defaultRemaining].slice(0, MAX_ROWS);

  return (
    <main>
      {heroBanners.length > 0 ? (
        <HeroBanner banners={heroBanners} />
      ) : (
        <div className="px-4 sm:px-8 md:px-14 py-16 text-center text-text-mid">
          No hero banners yet — add one from the admin panel.
        </div>
      )}

      <div className="pt-8 pb-16">
        {rowKeys.map((key) => {
          const row = rowRegistry.get(key);
          return (
            <MovieRow
              key={key}
              title={row.title}
              items={row.items.slice(0, 10)}
              viewAllHref={row.viewAllHref}
            />
          );
        })}
      </div>
    </main>
  );
}