'use client';

import { useState } from 'react';
import Link from 'next/link';

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
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full">
        {visibleItems.map(item => (
          <Link key={item.id} href={mediaType === 'movie' ? `/watch/movie/${item.id}` : `/series/${item.id}`} className="aspect-[2/3] relative group overflow-hidden rounded-md cursor-pointer transition-transform hover:scale-105 z-10 hover:z-20 border border-zinc-800">
            <img src={item.bannerUrl} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <span className="font-bold text-lg text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{item.title}</span>
              {item.categories && item.categories.length > 0 && (
                <div className="flex gap-2 mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                  {item.categories.slice(0,2).map((cat: string) => (
                    <span key={cat} className="text-xs bg-white/20 px-2 py-1 rounded-md text-zinc-300 font-medium">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
              {item.imdbRating && (
                <div className="flex items-center gap-1 mt-2 text-yellow-500 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                  <span className="text-sm font-bold">⭐ {item.imdbRating}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      
      {hasMore && (
        <button 
          onClick={() => setVisibleCount(prev => prev + 60)}
          className="mt-12 bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        >
          Daha Fazla Göster ({items.length - visibleCount} kaldı)
        </button>
      )}
    </div>
  );
}
