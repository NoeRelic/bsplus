import { readDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const profileId = cookieStore.get('profileId')?.value;
  
  if (!token || !profileId) return <div className="pt-24 px-8 text-white">Lütfen giriş yapın.</div>;

  const payload = await verifyToken(token);
  if (!payload) return <div className="pt-24 px-8 text-white">Yetkisiz erişim.</div>;

  const db = await readDB();
  const profile = db.profiles.find(p => p.id === profileId && p.userId === payload.userId);
  
  if (!profile) return <div className="pt-24 px-8 text-white">Profil bulunamadı.</div>;

  const favorites = profile.favorites || [];

  const favoriteMovies = favorites.filter(f => f.type === 'movie').map(f => db.movies.find(m => m.id === f.id)).filter(Boolean);
  const favoriteSeries = favorites.filter(f => f.type === 'series').map(f => db.series.find(s => s.id === f.id)).filter(Boolean);

  return (
    <div className="pt-24 px-8 min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-8">Favorilerim</h1>

      {favorites.length === 0 && (
        <div className="text-zinc-500 mt-20 text-center">Henüz favorilere eklediğiniz bir içerik yok.</div>
      )}

      {favoriteMovies.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Filmler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoriteMovies.map((m: any) => (
              <Link key={m.id} href={`/watch/movie/${m.id}`} className="block relative group overflow-hidden rounded-md transition-transform hover:scale-105">
                <img src={m.bannerUrl} alt={m.title} className="w-full h-auto object-cover aspect-[2/3]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="font-bold">{m.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {favoriteSeries.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Diziler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoriteSeries.map((s: any) => (
              <Link key={s.id} href={`/series/${s.id}`} className="block relative group overflow-hidden rounded-md transition-transform hover:scale-105">
                <img src={s.bannerUrl} alt={s.title} className="w-full h-auto object-cover aspect-[2/3]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="font-bold">{s.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
