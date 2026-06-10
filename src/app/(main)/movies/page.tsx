import { connectDB } from '@/lib/mongoose';
import { Movie } from '@/lib/models';
import FilterableContentGrid from '@/components/FilterableContentGrid';
export default async function MoviesPage() {
  await connectDB();
  const moviesList = JSON.parse(JSON.stringify(await Movie.find().lean())) || [];

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
