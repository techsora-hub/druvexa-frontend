import { getMovieDetail, getRelatedToMovie } from '../../../lib/api';
import DetailHero from '../../../components/DetailHero';
import MovieRow from '../../../components/MovieRow';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function MovieDetailPage({ params }) {
  let movie;
  let related = [];

  try {
    movie = await getMovieDetail(params.slug);
  } catch (err) {
    if (err.status === 404) return notFound();
    return (
      <div className="px-4 sm:px-8 md:px-14 py-20 text-center text-text-mid">
        Couldn&apos;t load this movie right now.
      </div>
    );
  }

  try {
    related = await getRelatedToMovie(params.slug);
  } catch {
    // related content is a nice-to-have — page still works without it
  }

  return (
    <main>
      <DetailHero
        content={movie}
        contentType="movie"
        ctaLabel="WATCH MOVIE"
        videoTarget={{ movieId: movie._id }}
      />

      {related.length > 0 && <MovieRow title="You May Also Like" items={related} arrows />}
    </main>
  );
}