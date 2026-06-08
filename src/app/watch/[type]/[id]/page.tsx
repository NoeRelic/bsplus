import { readDB } from '@/lib/db';
import PlayerClient from '@/components/PlayerClient';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import TitleScreenWrapper from '@/components/TitleScreenWrapper';

export default async function WatchPage({ params }: { params: Promise<{ type: string, id: string }> }) {
  const { type, id } = await params;
  const db = await readDB();

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const profileId = cookieStore.get('profileId')?.value;
  let initialTime = 0;

  let isFavorite = false;
  let userPackage = 'Iron';
  let initialPrefs = {};

  if (token && profileId) {
    const payload = await verifyToken(token);
    if (payload) {
      const user = db.users?.find(u => u.id === payload.userId);
      if (user) userPackage = user.package;

      const profile = db.profiles?.find(p => p.id === profileId && p.userId === payload.userId);
      if (profile) {
        if (profile.progress) {
          const prog = profile.progress.find(p => p.videoId === id);
          if (prog) initialTime = prog.time;
        }
        if (profile.favorites) {
          isFavorite = profile.favorites.some(f => f.id === id && f.type === type);
        }
        if (profile.preferences) {
          initialPrefs = profile.preferences;
        }
      }
    }
  }

  // Package Restrictions
  if (type === 'episode') {
    if (userPackage === 'Iron') {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-8">
          <h1 className="text-3xl text-red-500 font-bold mb-4">Paketiniz Yetersiz</h1>
          <p className="text-zinc-300 mb-8 max-w-xl">
            Mevcut "Iron" paketiniz sadece filmlere erişim sağlar. Dizileri izleyebilmek için lütfen paketinizi yükseltin.
          </p>
          <a href="/packages" className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-md text-white font-bold transition-colors">Paketleri İncele</a>
        </div>
      );
    }
  }

  let videoUrl = '';
  let videoUrlEN = '';
  let subtitleTR = '';
  let subtitleEN = '';
  let title = '';
  let story = '';
  let bannerUrl = '';
  let nextEpisodeUrl = '';
  let similarItems: any[] = [];
  let dubType: 'dublaj' | 'altyazi' | undefined = undefined;

  let director = '';
  let cast: any[] = [];

  if (type === 'movie') {
    const movie = db.movies?.find(m => m.id === id);
    if (!movie) return <div className="text-white text-center mt-20">Film bulunamadı.</div>;
    videoUrl = movie.videoUrl;
    videoUrlEN = movie.videoUrlEN || '';
    subtitleTR = movie.subtitleTR || '';
    subtitleEN = movie.subtitleEN || '';
    title = movie.title;
    story = movie.story || '';
    bannerUrl = movie.bannerUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80';
    director = movie.director || '';
    cast = movie.cast || [];

    // Similar movies
    similarItems = (db.movies || [])
      .filter(m => m.id !== id && m.type === movie.type)
      .slice(0, 4)
      .map(m => ({ ...m, mediaType: 'movie' }));
  } else if (type === 'episode') {
    const episode = db.episodes?.find((e: any) => e.id === id);
    if (!episode) return <div className="text-white text-center mt-20">Bölüm bulunamadı.</div>;
    const series = db.series?.find((s: any) => s.id === episode.seriesId);

    // Detect language variant of THIS episode
    const isDublaj = /dublaj/i.test(episode.title);
    const isAltyazi = /altyaz/i.test(episode.title);
    dubType = isDublaj ? 'dublaj' : isAltyazi ? 'altyazi' : undefined;

    // Find sibling: same series, same season, same episode number, but different language
    const sibling = (db.episodes || []).find((e: any) =>
      e.seriesId === episode.seriesId &&
      e.seasonNumber === episode.seasonNumber &&
      e.episodeNumber === episode.episodeNumber &&
      e.id !== episode.id &&
      // Sibling must be the "other" language
      ((isDublaj && /altyaz/i.test(e.title)) ||
       (isAltyazi && /dublaj/i.test(e.title)) ||
       (!isDublaj && !isAltyazi)) // if no lang marker, just pick a sibling anyway
    );

    videoUrl = episode.videoUrl;
    // If THIS is Altyazı, set altyazı as primary and sibling (Dublaj) as secondary
    // If THIS is Dublaj (or unknown), keep as-is
    let siblingUrl = sibling?.videoUrl || episode.videoUrlEN || '';

    if (isAltyazi && sibling) {
      // Swap: play altyazı first, dublaj as "EN" slot
      videoUrl = episode.videoUrl;
      siblingUrl = sibling.videoUrl;
    } else if (isDublaj && sibling) {
      // Primary = Dublaj, secondary = Altyazı
      videoUrl = episode.videoUrl;
      siblingUrl = sibling.videoUrl;
    }

    videoUrlEN = siblingUrl;
    subtitleTR = episode.subtitleTR || '';
    subtitleEN = episode.subtitleEN || '';
    title = series ? `${series.title} - S${episode.seasonNumber}E${episode.episodeNumber}` : episode.title;
    story = episode.story || series?.story || '';
    bannerUrl = episode.bannerUrl || series?.bannerUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80';
    if (series) {
      director = series.director || '';
      cast = series.cast || [];
    }

    // Auto-Play Next Episode Logic — skip sibling duplicates, advance by unique episode number
    const allEps: any[] = (db.episodes || []).filter((e: any) => e.seriesId === episode.seriesId);
    // Build ordered unique (season, epNumber) pairs
    const uniquePairs = Array.from(
      new Map(
        allEps
          .sort((a: any, b: any) => a.seasonNumber !== b.seasonNumber ? a.seasonNumber - b.seasonNumber : a.episodeNumber - b.episodeNumber)
          .map((e: any) => [`${e.seasonNumber}_${e.episodeNumber}`, e])
      ).values()
    );
    const currentPairIndex = uniquePairs.findIndex((e: any) =>
      e.seasonNumber === episode.seasonNumber && e.episodeNumber === episode.episodeNumber
    );
    if (currentPairIndex > -1 && currentPairIndex < uniquePairs.length - 1) {
      const nextEp: any = uniquePairs[currentPairIndex + 1];
      nextEpisodeUrl = `/watch/episode/${nextEp.id}`;
    }

  } else {
    return <div className="text-white text-center mt-20">Geçersiz içerik tipi.</div>;
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col">
      <TitleScreenWrapper 
        title={title}
        story={story}
        bannerUrl={bannerUrl}
        mediaId={id}
        mediaType={type as 'movie' | 'series'}
        initialFavorite={isFavorite}
      >
        <PlayerClient 
          videoUrl={videoUrl} 
          videoUrlEN={videoUrlEN}
          subtitleTR={subtitleTR}
          subtitleEN={subtitleEN}
          title={title} 
          initialTime={initialTime}
          mediaId={type === 'movie' ? id : undefined}
          mediaType={type === 'movie' ? 'movie' : undefined}
          initialFavorite={isFavorite}
          nextEpisodeUrl={nextEpisodeUrl || undefined}
          similarItems={similarItems.length > 0 ? similarItems : undefined}
          initialPrefs={initialPrefs}
          dubType={dubType}
        />
      </TitleScreenWrapper>

      {/* DETAYLAR (CAST & YÖNETMEN) */}
      <div className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-10 animate-fade-in-up delay-300">
        
        {/* Watch Party Butonu */}
        <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-white">{title}</h1>
            <p className="text-zinc-400">Bu içeriği yalnız izlemek zorunda değilsin.</p>
          </div>
          <a 
            href={`/watch-party/${Math.random().toString(36).substring(2, 10)}?mediaId=${id}&type=${type}&host=true`}
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center gap-2 hover:scale-105"
          >
            <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            Beraber İzle (Oda Kur)
          </a>
        </div>
        
        {/* Yönetmen ve Ekip Özeti */}
        {(director || cast.length > 0) && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white/90">Ekip ve Oyuncular</h2>
            {director && (
              <div className="mb-6">
                <span className="text-zinc-400 font-medium">Yönetmen: </span>
                <span className="text-white font-bold">{director}</span>
              </div>
            )}

            {/* Oyuncular Carousel */}
            {cast.length > 0 && (
              <div className="flex overflow-x-auto gap-6 pb-4 custom-scrollbar">
                {cast.map((c, i) => (
                  <div key={i} className="flex flex-col items-center min-w-[120px] gap-3 group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#9155fd] transition-all duration-300 shadow-lg">
                      <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm text-white/90 truncate max-w-[120px]">{c.name}</div>
                      <div className="text-xs text-zinc-400 truncate max-w-[120px]">{c.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
