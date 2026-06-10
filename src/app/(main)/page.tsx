import { connectDB } from '@/lib/mongoose';
import { Movie, Series, Profile, Episode } from '@/lib/models';
import Link from 'next/link';
import HeroSlider from '@/components/HeroSlider';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import WorldCupSection from '@/components/WorldCupSection';
import SmartImage from '@/components/SmartImage';

export default async function HomePage() {
  await connectDB();
  // Limit to 24 items on the homepage to prevent browser crash
  const movies = JSON.parse(JSON.stringify(await Movie.find().limit(24).lean())) || [];
  const series = JSON.parse(JSON.stringify(await Series.find().limit(24).lean())) || [];

  // Top 5 content for Hero Slider (Mix of movies and series)
  const heroItems = [
    ...(movies.slice(0, 3).map((m: any) => ({ ...m, type: 'movie' }))),
    ...(series.slice(0, 2).map((s: any) => ({ ...s, type: 'series' })))
  ].filter(i => i.bannerUrl);

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const profileId = cookieStore.get('profileId')?.value;
  
  let continueWatching: any[] = [];
  
  if (token && profileId) {
    const payload = await verifyToken(token);
    if (payload) {
      const profile = JSON.parse(JSON.stringify(await Profile.findOne({ id: profileId, userId: payload.userId }).lean()));
      if (profile && profile.progress && profile.progress.length > 0) {
        const sortedProgress = [...profile.progress].sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime());
        
        const movieIds = sortedProgress.filter((p: any) => p.type === 'movie').map((p: any) => p.videoId);
        const episodeIds = sortedProgress.filter((p: any) => p.type === 'episode').map((p: any) => p.videoId);
        
        const allMovies = JSON.parse(JSON.stringify(await Movie.find({ id: { $in: movieIds } }).lean()));
        const allEpisodes = JSON.parse(JSON.stringify(await Episode.find({ id: { $in: episodeIds } }).lean()));
        
        const cSeriesIds = allEpisodes.map((e: any) => e.seriesId);
        const allSeries = JSON.parse(JSON.stringify(await Series.find({ id: { $in: cSeriesIds } }).lean()));

        continueWatching = sortedProgress.map((p: any) => {
          let media: any;
          let title = '';
          let bannerUrl = '';
          let link = '';
          let categories: string[] = [];
          if (p.type === 'movie') {
            media = allMovies.find((m: any) => m.id === p.videoId);
            if (media) {
              title = media.title;
              bannerUrl = media.bannerUrl || '';
              categories = media.categories || [];
              link = `/watch/movie/${media.id}?t=${Math.floor(p.time)}`;
            }
          } else {
            media = allEpisodes.find((e: any) => e.id === p.videoId);
            if (media) {
              const seriesObj = allSeries.find((s: any) => s.id === media.seriesId);
              title = seriesObj ? `${seriesObj.title} - S${media.seasonNumber}E${media.episodeNumber}` : media.title;
              bannerUrl = seriesObj?.bannerUrl || ''; 
              categories = seriesObj?.categories || [];
              link = `/watch/episode/${media.id}?t=${Math.floor(p.time)}`;
            }
          }
          if (!media) return null;
          
          let percent = 0;
          if (p.duration && p.duration > 0) {
            percent = (p.time / p.duration) * 100;
          } else {
            percent = Math.max(10, Math.min(90, (p.time / 3600) * 100)); // Estimate based on 1 hr
          }
          if (percent > 95) return null; // Already finished
          
          return { ...p, title, bannerUrl, categories, link, percent };
        }).filter(Boolean).slice(0, 10);
      }
    }
  }

  const topSeriesIds = series.map(s => s.id);
  const seriesEpisodes = JSON.parse(JSON.stringify(await Episode.find({ seriesId: { $in: topSeriesIds } }).lean()));

  return (
    <div className="pb-32 md:pb-24 animate-fade-in-up">
      {/* Cinematic Hero Wrapper */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#06060a] via-[#06060a]/50 to-transparent z-10 pointer-events-none" />
        <HeroSlider items={heroItems} />
      </div>

      <div className="px-4 md:px-8 lg:px-12 flex flex-col gap-12 md:gap-16 -mt-16 relative z-20">
        {continueWatching.length > 0 && (
          <section className="animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-display font-semibold mb-6 flex items-center gap-3 text-white/90">
              Kaldığın Yerden Devam Et
            </h2>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 pt-2 px-2 -mx-2 scrollbar-hide">
              {continueWatching.map(item => (
                <Link key={item.videoId} href={item.link} className="min-w-[260px] md:min-w-[320px] aspect-video relative group overflow-hidden rounded-2xl cursor-pointer hover-neon-glow glass">
                  <SmartImage src={item.bannerUrl} title={item.title} categories={item.categories} type={item.type} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06060a]/95 via-[#06060a]/20 to-transparent transition-opacity duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-[#9155fd]/50 shadow-[0_0_20px_rgba(145,85,253,0.5)]">
                      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <span className="font-medium text-sm md:text-base text-white line-clamp-1 drop-shadow-md">{item.title}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10 backdrop-blur-sm">
                    <div className="h-full bg-gradient-to-r from-[#5579fd] to-[#9155fd] shadow-[0_0_10px_rgba(145,85,253,0.8)] transition-all duration-500 rounded-r-full" style={{ width: `${item.percent}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="animate-fade-in-up delay-100">
          <h2 className="text-2xl md:text-3xl font-display font-semibold mb-6 flex items-center gap-3 text-white/90">
            Popüler Filmler
          </h2>
          {movies.length === 0 ? (
            <p className="text-zinc-500">Henüz film eklenmemiş.</p>
          ) : (
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 pt-2 px-2 -mx-2 scrollbar-hide">
              {movies.map(movie => {
                const hasDoubleSub = !!(movie.subtitleTR && movie.subtitleEN);
                return (
                  <Link key={movie.id} href={`/watch/movie/${movie.id}`} className="min-w-[200px] md:min-w-[280px] aspect-video relative group overflow-hidden rounded-2xl cursor-pointer hover-neon-glow glass">
                    <SmartImage src={movie.bannerUrl} title={movie.title} categories={movie.categories} type="movie" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                    {hasDoubleSub && (
                      <span className="absolute top-2.5 left-2.5 z-20 bg-black/40 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg border border-[#9155fd]/30">
                        Çift Altyazı
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-[#06060a]/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-1">
                      <span className="font-medium text-sm md:text-base text-white line-clamp-1 drop-shadow-md group-hover:text-neon-glow transition-all">{movie.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="animate-fade-in-up delay-200">
          <h2 className="text-2xl md:text-3xl font-display font-semibold mb-6 flex items-center gap-3 text-white/90">
            Öne Çıkan Diziler
          </h2>
          {series.length === 0 ? (
            <p className="text-zinc-500">Henüz dizi eklenmemiş.</p>
          ) : (
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 pt-2 px-2 -mx-2 scrollbar-hide">
              {series.map(s => {
                const sEps = seriesEpisodes.filter((e: any) => e.seriesId === s.id);
                const hasDoubleSub = sEps.some((e: any) => e.subtitleTR && e.subtitleEN);
                return (
                  <Link key={s.id} href={`/series/${s.id}`} className="min-w-[200px] md:min-w-[280px] aspect-video relative group overflow-hidden rounded-2xl cursor-pointer hover-neon-glow glass">
                    <SmartImage src={s.bannerUrl} title={s.title} categories={s.categories} type="series" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                    {hasDoubleSub && (
                      <span className="absolute top-2.5 left-2.5 z-20 bg-black/40 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg border border-[#9155fd]/30">
                        Çift Altyazı
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-[#06060a]/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-1">
                      <span className="font-medium text-sm md:text-base text-white line-clamp-1 drop-shadow-md group-hover:text-neon-glow transition-all">{s.title}</span>
                    </div>
                  </Link>
                );
              })}
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
