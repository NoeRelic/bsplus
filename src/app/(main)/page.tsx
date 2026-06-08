import { readDB } from '@/lib/db';
import Link from 'next/link';
import HeroSlider from '@/components/HeroSlider';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import WorldCupSection from '@/components/WorldCupSection';

export default async function HomePage() {
  const db = await readDB();
  // Limit to 24 items on the homepage to prevent browser crash
  const movies = db.movies?.slice(0, 24) || [];
  const series = db.series?.slice(0, 24) || [];

  // Top 5 content for Hero Slider (Mix of movies and series)
  const heroItems = [
    ...(movies.slice(0, 3).map(m => ({ ...m, type: 'movie' }))),
    ...(series.slice(0, 2).map(s => ({ ...s, type: 'series' })))
  ].filter(i => i.bannerUrl);

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const profileId = cookieStore.get('profileId')?.value;
  
  let continueWatching: any[] = [];
  
  if (token && profileId) {
    const payload = await verifyToken(token);
    if (payload) {
      const profile = db.profiles?.find(p => p.id === profileId && p.userId === payload.userId);
      if (profile && profile.progress && profile.progress.length > 0) {
        const sortedProgress = [...profile.progress].sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime());
        
        continueWatching = sortedProgress.map(p => {
          let media: any;
          let title = '';
          let bannerUrl = '';
          let link = '';
          if (p.type === 'movie') {
            media = db.movies?.find(m => m.id === p.videoId);
            if (media) {
              title = media.title;
              bannerUrl = media.bannerUrl;
              link = `/watch/movie/${media.id}?t=${Math.floor(p.time)}`;
            }
          } else {
            media = db.episodes?.find(e => e.id === p.videoId);
            if (media) {
              const seriesObj = db.series?.find(s => s.id === media.seriesId);
              title = seriesObj ? `${seriesObj.title} - S${media.seasonNumber}E${media.episodeNumber}` : media.title;
              bannerUrl = seriesObj?.bannerUrl || ''; 
              link = `/watch/episode/${media.id}?t=${Math.floor(p.time)}`;
            }
          }
          if (!media || !bannerUrl) return null;
          
          let percent = 0;
          if (p.duration && p.duration > 0) {
            percent = (p.time / p.duration) * 100;
          } else {
            percent = Math.max(10, Math.min(90, (p.time / 3600) * 100)); // Estimate based on 1 hr
          }
          if (percent > 95) return null; // Already finished
          
          return { ...p, title, bannerUrl, link, percent };
        }).filter(Boolean).slice(0, 10);
      }
    }
  }

  return (
    <div className="pb-24 animate-fade-in-up">
      <HeroSlider items={heroItems} />

      <div className="px-8 md:px-16 flex flex-col gap-16">
        {continueWatching.length > 0 && (
          <section className="animate-fade-in-up">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <span className="w-2 h-8 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
              Kaldığın Yerden Devam Et
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 -mx-4 scrollbar-hide">
              {continueWatching.map(item => (
                <Link key={item.videoId} href={item.link} className="min-w-[240px] md:min-w-[280px] aspect-video relative group overflow-hidden rounded-xl cursor-pointer transition-all duration-500 hover:scale-[1.08] hover:z-30 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] border border-transparent">
                  <img src={item.bannerUrl} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 flex flex-col justify-end p-4">
                    <span className="font-bold text-lg text-white group-hover:-translate-y-2 transition-transform duration-500 line-clamp-1">{item.title}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-zinc-800">
                    <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,1)]" style={{ width: `${item.percent}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="animate-fade-in-up delay-100">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
            Popüler Filmler
          </h2>
          {movies.length === 0 ? (
            <p className="text-zinc-500">Henüz film eklenmemiş.</p>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 -mx-4 scrollbar-hide">
              {movies.map(movie => (
                <Link key={movie.id} href={`/watch/movie/${movie.id}`} className="min-w-[240px] md:min-w-[280px] aspect-video relative group overflow-hidden rounded-xl cursor-pointer transition-all duration-500 hover:scale-[1.08] hover:z-30 hover-neon-glow border border-transparent">
                  <img src={movie.bannerUrl} alt={movie.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
                    <span className="font-bold text-lg text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{movie.title}</span>
                    <span className="text-blue-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100 font-medium">Hemen İzle</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="animate-fade-in-up delay-200">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
            Öne Çıkan Diziler
          </h2>
          {series.length === 0 ? (
            <p className="text-zinc-500">Henüz dizi eklenmemiş.</p>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 -mx-4 scrollbar-hide">
              {series.map(s => (
                <Link key={s.id} href={`/series/${s.id}`} className="min-w-[240px] md:min-w-[280px] aspect-video relative group overflow-hidden rounded-xl cursor-pointer transition-all duration-500 hover:scale-[1.08] hover:z-30 hover-neon-glow border border-transparent">
                  <img src={s.bannerUrl} alt={s.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
                    <span className="font-bold text-lg text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{s.title}</span>
                    <span className="text-blue-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100 font-medium">Bölümleri İncele</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── 2026 Dünya Kupası ─────────────────────────────────────── */}
        <section className="animate-fade-in-up delay-300">
          <WorldCupSection />
        </section>
      </div>
    </div>
  );
}
