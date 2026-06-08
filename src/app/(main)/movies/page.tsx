import { readDB } from '@/lib/db';
import FilterableContentGrid from '@/components/FilterableContentGrid';
export default async function MoviesPage() {
  const db = await readDB();
  const moviesList = db.movies || [];

  return (
    <div className="px-8 md:px-16 pb-24">
      <h1 className="text-3xl font-bold mb-8">Filmler</h1>
      
      {moviesList.length === 0 ? (
        <p className="text-zinc-500">Gösterilecek film bulunamadı.</p>
      ) : (
        <FilterableContentGrid items={moviesList} mediaType="movie" />
      )}
    </div>
  );
}
