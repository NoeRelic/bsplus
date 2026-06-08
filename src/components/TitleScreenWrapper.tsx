'use client';

import { useState } from 'react';
import { Play, ArrowLeft } from 'lucide-react';
import FavoriteButtonClient from './FavoriteButtonClient';
import { useRouter } from 'next/navigation';

interface TitleScreenProps {
  title: string;
  story: string;
  bannerUrl: string;
  mediaId: string;
  mediaType: 'movie' | 'series';
  initialFavorite: boolean;
  children: React.ReactNode;
}

export default function TitleScreenWrapper({ title, story, bannerUrl, mediaId, mediaType, initialFavorite, children }: TitleScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();

  if (isPlaying) {
    return <div className="w-full h-screen bg-black animate-fade-in-up">{children}</div>;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black animate-fade-in-up">
      {/* Background Banner */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bannerUrl} 
          alt={title} 
          className="w-full h-full object-cover opacity-60 transform scale-105 transition-transform duration-[10000ms] ease-out hover:scale-100" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent" />
      </div>

      {/* Top Navbar Simulation */}
      <div className="absolute top-0 left-0 w-full p-8 z-50">
        <button onClick={() => router.back()} className="text-white hover:text-zinc-300 transition-colors">
          <ArrowLeft className="w-10 h-10" />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center px-12 md:px-24 max-w-6xl">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] animate-fade-in-up delay-100">{title}</h1>
        <p className="text-lg md:text-2xl text-zinc-300 mb-10 max-w-3xl line-clamp-4 drop-shadow-md animate-fade-in-up delay-200">
          {story || 'Bu içerik için henüz bir açıklama girilmemiştir.'}
        </p>

        <div className="flex items-center gap-4 animate-fade-in-up delay-300">
          <button 
            onClick={() => setIsPlaying(true)}
            className="flex items-center gap-3 bg-white text-black px-10 py-4 rounded-xl font-bold text-xl hover:bg-zinc-200 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.4)]"
          >
            <Play className="w-7 h-7 fill-current" /> Oynat
          </button>
          
          <div className="bg-zinc-800/80 backdrop-blur-md rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700 h-[60px] flex items-center px-2">
            <FavoriteButtonClient id={mediaId} type={mediaType === 'movie' ? 'movie' : 'series'} initialFavorite={initialFavorite} />
          </div>
        </div>
      </div>
    </div>
  );
}
