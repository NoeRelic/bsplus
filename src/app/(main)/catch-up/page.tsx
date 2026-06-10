import { connectDB } from '@/lib/mongoose';
import { Profile, Movie, Episode, Series } from '@/lib/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Play } from 'lucide-react';

export default async function CatchUpPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const profileId = cookieStore.get('profileId')?.value;
  
  if (!token || !profileId) return <div className="pt-24 px-8 text-white">Lütfen giriş yapın.</div>;

  const payload = await verifyToken(token);
  if (!payload) return <div className="pt-24 px-8 text-white">Yetkisiz erişim.</div>;

  await connectDB();
  const profile = JSON.parse(JSON.stringify(await Profile.findOne({ id: profileId, userId: payload.userId }).lean()));
  
  if (!profile) return <div className="pt-24 px-8 text-white">Profil bulunamadı.</div>;

  const progress = profile.progress || [];
  
  // Sort by last watched, most recent first
  const sortedProgress = [...progress].sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime());

  if (sortedProgress.length === 0) {
    return (
      <div className="pt-24 px-8 min-h-screen bg-black text-white">
        <h1 className="text-3xl font-bold mb-8">Kaldığın Yerden</h1>
        <div className="text-zinc-500 mt-20 text-center">Henüz izlemeye başladığınız bir içerik yok.</div>
      </div>
    );
  }

  const movieIds = sortedProgress.filter(p => p.type === 'movie').map(p => p.videoId);
  const episodeIds = sortedProgress.filter(p => p.type === 'episode').map(p => p.videoId);
  
  const movies = JSON.parse(JSON.stringify(await Movie.find({ id: { $in: movieIds } }).lean()));
  const episodes = JSON.parse(JSON.stringify(await Episode.find({ id: { $in: episodeIds } }).lean()));
  
  const seriesIds = episodes.map((e: any) => e.seriesId);
  const series = JSON.parse(JSON.stringify(await Series.find({ id: { $in: seriesIds } }).lean()));

  return (
    <div className="pt-24 px-8 min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-8">Kaldığın Yerden</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {sortedProgress.map((p: any) => {
          let item: any = null;
          let link = '';
          
          if (p.type === 'movie') {
            item = movies.find((m: any) => m.id === p.videoId);
            link = `/watch/movie/${p.videoId}`;
          } else {
            item = episodes.find((e: any) => e.id === p.videoId);
            link = `/watch/episode/${p.videoId}`;
          }

          if (!item) return null;

          // For episodes, find the series banner
          let bannerUrl = item.bannerUrl;
          let title = item.title;
          
          if (p.type === 'episode') {
            const seriesObj = series.find((s: any) => s.id === item.seriesId);
            bannerUrl = seriesObj?.bannerUrl || '';
            title = `${seriesObj?.title} - S${item.seasonNumber}E${item.episodeNumber}`;
          }

          return (
            <Link key={p.videoId} href={link} className="block relative group overflow-hidden rounded-md transition-transform hover:scale-105 bg-zinc-900">
              <div className="relative">
                <img src={bannerUrl} alt={title} className="w-full h-auto object-cover aspect-[2/3] opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Play className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm truncate">{title}</h3>
                <div className="mt-2 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                   {/* We don't know total duration here easily unless saved in DB, so just show a generic bar or time if we had duration */}
                  <div className="bg-blue-500 h-full w-1/2"></div> 
                </div>
                <p className="text-xs text-zinc-500 mt-1">Devam Et</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
