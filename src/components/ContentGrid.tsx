'use client';

import { useState } from 'react';
import Link from 'next/link';
import SmartImage from './SmartImage';

interface ContentItem {
  id: string;
  title: string;
  bannerUrl: string;
  type?: string;
  categories?: string[];
  imdbRating?: number;
}

interface ContentGridProps {
  items: ContentItem[];
  mediaType: 'movie' | 'series';
}

export default function ContentGrid({ items, mediaType }: ContentGridProps) {
  const [visibleCount, setVisibleCount] = useState(60);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div className="flex flex-col items-center animate-fade-in-up">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 w-full">
        {visibleItems.map(item => (
          <Link key={item.id} href={mediaType === 'movie' ? `/watch/movie/${item.id}` : `/series/${item.id}`} className="aspect-[2/3] md:aspect-video lg:aspect-[2/3] relative group overflow-hidden rounded-xl cursor-pointer hover-neon-glow border border-white/5 bg-zinc-900 flex flex-col justify-end">
            <SmartImage src={item.bannerUrl} title={item.title} categories={item.categories} type={item.type || mediaType} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 md:w-6 md:h-6 ml-0.5 md:ml-1"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-1.5">
              <span className="font-medium text-sm md:text-base text-white line-clamp-2 drop-shadow-md leading-tight">{item.title}</span>
              
              <div className="flex flex-wrap gap-1.5 items-center">
                {item.imdbRating && (
                  <span className="text-[10px] md:text-xs font-bold text-[#e5b109] bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded border border-[#e5b109]/30">
                    IMDb {item.imdbRating}
                  </span>
                )}
                {item.categories && item.categories.length > 0 && (
                  <span className="text-[10px] md:text-xs text-zinc-300 line-clamp-1">
                    {item.categories.slice(0,2).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {hasMore && (
        <button 
          onClick={() => setVisibleCount(prev => prev + 60)}
          className="mt-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3.5 rounded-full font-semibold transition-colors flex items-center gap-2"
        >
          Daha Fazla Göster
          <span className="text-zinc-500 text-sm font-normal">({items.length - visibleCount})</span>
        </button>
      )}
    </div>
  );
}
