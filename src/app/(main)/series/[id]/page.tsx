import { connectDB } from '@/lib/mongoose';
import { Series, User, Profile, Episode } from '@/lib/models';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import FavoriteButtonClient from '@/components/FavoriteButtonClient';
import CommentsSectionClient from '@/components/CommentsSectionClient';
import SeasonEpisodePicker from '@/components/SeasonEpisodePicker';
import SmartImage from '@/components/SmartImage';

export default async function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const series = JSON.parse(JSON.stringify(await Series.findOne({ id }).lean()));

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const profileId = cookieStore.get('profileId')?.value;
  let isFavorite = false;
  let userPackage = 'Iron';

  if (token && profileId) {
    const payload = await verifyToken(token);
    if (payload) {
      const user = JSON.parse(JSON.stringify(await User.findOne({ id: payload.userId }).lean()));
      if (user) userPackage = user.package;

      const profile = JSON.parse(JSON.stringify(await Profile.findOne({ id: profileId, userId: payload.userId }).lean()));
      if (profile?.favorites?.some((f: any) => f.id === id)) {
        isFavorite = true;
      }
    }
  }

  if (!series) {
    return <div className="px-16 pt-12 text-zinc-400">Dizi bulunamadı.</div>;
  }

  const episodes: any[] = JSON.parse(JSON.stringify(await Episode.find({ seriesId: series.id }).lean())) || [];
  const seasons = Array.from(new Set(episodes.map((e: any) => e.seasonNumber as number))).sort((a, b) => a - b);

  // Group episodes by season
  const episodesBySeason: Record<number, any[]> = {};
  for (const ep of episodes) {
    if (!episodesBySeason[ep.seasonNumber]) episodesBySeason[ep.seasonNumber] = [];
    episodesBySeason[ep.seasonNumber].push(ep);
  }

  const firstEpisode = episodes
    .filter((e: any) => e.seasonNumber === seasons[0])
    .sort((a: any, b: any) => a.episodeNumber - b.episodeNumber)[0];

  return (
    <div className="pb-24 min-h-screen bg-black text-white">
      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <div className="relative w-full h-[55vh] bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent z-10" />
        {series.bannerUrl ? (
          <SmartImage
            src={series.bannerUrl}
            title={series.title}
            categories={series.categories}
            type="series"
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <SmartImage
            src=""
            title={series.title}
            categories={series.categories}
            type="series"
            className="w-full h-full object-cover object-top"
          />
        )}

        <div className="absolute bottom-0 left-0 z-20 p-8 md:p-14 w-full md:w-3/4">
          <div className="flex flex-col gap-3">
            {/* Meta badges */}
            <div className="flex gap-2 flex-wrap">
              {series.categories?.map((cat: string) => (
                <span key={cat} className="text-xs bg-blue-700/60 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-600/40">
                  {cat}
                </span>
              ))}
              {seasons.length > 0 && (
                <span className="text-xs bg-zinc-700/70 text-zinc-300 px-2.5 py-0.5 rounded-full border border-zinc-600/40">
                  {seasons.length} Sezon · {episodes.length} Bölüm
                </span>
              )}
              {series.imdbRating && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2.5 py-0.5 rounded-full border border-yellow-500/30 font-bold">
                  ⭐ {series.imdbRating}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-2xl">
              {series.title}
            </h1>

            {series.story && (
              <p className="text-base text-zinc-300 max-w-xl leading-relaxed line-clamp-3">
                {series.story}
              </p>
            )}

            <div className="flex gap-3 items-center mt-2 flex-wrap">
              {userPackage === 'Iron' ? (
                <Link
                  href="/packages"
                  className="inline-flex items-center gap-2 bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:shadow-[0_0_28px_rgba(234,179,8,0.7)]"
                >
                  🔒 Paket Yükselt
                </Link>
              ) : firstEpisode ? (
                <Link
                  href={`/watch/episode/${firstEpisode.id}`}
                  className="inline-flex items-center gap-2 bg-white text-black px-7 py-3 rounded-lg font-bold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  İzlemeye Başla
                </Link>
              ) : (
                <button disabled className="bg-zinc-700 text-zinc-500 px-7 py-3 rounded-lg font-bold cursor-not-allowed">
                  Bölüm Yok
                </button>
              )}
              <FavoriteButtonClient id={series.id} type="series" initialFavorite={isFavorite} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Episodes Section ─────────────────────────────────────────── */}
      <div className="px-6 md:px-14 mt-10">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
          Bölümler
          {seasons.length > 0 && (
            <span className="text-sm font-normal text-zinc-500">{seasons.length} sezon, {episodes.length} bölüm</span>
          )}
        </h2>

        {seasons.length === 0 ? (
          <p className="text-zinc-500">Bu dizi için henüz bölüm eklenmemiş.</p>
        ) : (
          <SeasonEpisodePicker
            seasons={seasons}
            episodesBySeason={episodesBySeason}
            userPackage={userPackage}
          />
        )}

        {/* ── Comments ─────────────────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <CommentsSectionClient mediaId={series.id} />
        </div>
      </div>
    </div>
  );
}
