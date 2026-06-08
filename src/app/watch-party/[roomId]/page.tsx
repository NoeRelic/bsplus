import WatchPartyClient from '@/components/WatchPartyClient';
import { readDB } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export default async function WatchPartyPage({ params, searchParams }: { params: Promise<{ roomId: string }>, searchParams: Promise<{ mediaId: string, type: string }> }) {
  const { roomId } = await params;
  const { mediaId, type } = await searchParams;
  const db = await readDB();

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const profileId = cookieStore.get('profileId')?.value;

  let username = 'Misafir_' + Math.floor(Math.random() * 1000);

  if (token && profileId) {
    const payload = await verifyToken(token);
    if (payload) {
      const profile = db.profiles?.find(p => p.id === profileId && p.userId === payload.userId);
      if (profile) username = profile.name;
    }
  }

  let videoUrl = '';
  let videoUrlEN = '';
  let subtitleTR = '';
  let subtitleEN = '';
  let title = '';

  if (type === 'movie') {
    const movie = db.movies?.find(m => m.id === mediaId);
    if (!movie) return <div className="text-white text-center mt-20">Film bulunamadı.</div>;
    videoUrl = movie.videoUrl;
    videoUrlEN = movie.videoUrlEN || '';
    subtitleTR = movie.subtitleTR || '';
    subtitleEN = movie.subtitleEN || '';
    title = movie.title;
  } else if (type === 'episode') {
    const episode = db.episodes?.find(e => e.id === mediaId);
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
