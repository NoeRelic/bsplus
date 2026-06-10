import WatchPartyClient from '@/components/WatchPartyClient';
import { connectDB } from '@/lib/mongoose';
import { Profile, Movie, Episode } from '@/lib/models';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export default async function WatchPartyPage({ params, searchParams }: { params: Promise<{ roomId: string }>, searchParams: Promise<{ mediaId: string, type: string }> }) {
  const { roomId } = await params;
  const { mediaId, type } = await searchParams;
  await connectDB();

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const profileId = cookieStore.get('profileId')?.value;

  let username = 'Misafir_' + Math.floor(Math.random() * 1000);

  if (token && profileId) {
    const payload = await verifyToken(token);
    if (payload) {
      const profile = await Profile.findOne({ id: profileId, userId: payload.userId }).lean();
      if (profile) username = profile.name;
    }
  }

  let videoUrl = '';
  let videoUrlEN = '';
  let subtitleTR = '';
  let subtitleEN = '';
  let title = '';

  if (type === 'movie') {
    const movie = await Movie.findOne({ id: mediaId }).lean();
    if (!movie) return <div className="text-white text-center mt-20">Film bulunamadı.</div>;
    videoUrl = movie.videoUrl;
    videoUrlEN = movie.videoUrlEN || '';
    subtitleTR = movie.subtitleTR || '';
    subtitleEN = movie.subtitleEN || '';
    title = movie.title;
  } else if (type === 'episode') {
    const episode = await Episode.findOne({ id: mediaId }).lean();
    if (!episode) return <div className="text-white text-center mt-20">Bölüm bulunamadı.</div>;
    videoUrl = episode.videoUrl;
    videoUrlEN = episode.videoUrlEN || '';
    subtitleTR = episode.subtitleTR || '';
    subtitleEN = episode.subtitleEN || '';
    title = episode.title;
  } else {
    return <div className="text-white text-center mt-20">Geçersiz içerik tipi. (Type: {type}, ID: {mediaId})</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 flex flex-col md:flex-row overflow-hidden">
      <WatchPartyClient 
        roomId={roomId}
        username={username}
        videoUrl={videoUrl}
        videoUrlEN={videoUrlEN}
        subtitleTR={subtitleTR}
        subtitleEN={subtitleEN}
        title={title}
      />
    </div>
  );
}
