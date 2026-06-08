'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroSlider({ items }: { items: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000); // Rotate every 8 seconds
    return () => clearInterval(interval);
  }, [items]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] bg-black mb-16 overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
          <img 
            src={currentItem.bannerUrl} 
            alt={currentItem.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 z-20 p-8 md:p-16 w-full md:w-2/3 lg:w-1/2">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-extrabold mb-6 text-glow leading-tight"
            >
              {currentItem.title}
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-zinc-300 mb-10 line-clamp-3 font-light drop-shadow-lg"
            >
              {currentItem.story || "En popüler dizi ve filmleri tek seferlik paketlerle, sınırsızca izleyin. Şimdi keşfetmeye başlayın."}
            </motion.p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex gap-6"
            >
              <Link href={currentItem.type === 'movie' ? `/watch/movie/${currentItem.id}` : `/series/${currentItem.id}`} className="bg-blue-600 text-white px-10 py-4 rounded-md font-bold hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] hover:scale-105 flex items-center justify-center">
                {currentItem.type === 'movie' ? 'Oynat' : 'Bölümleri İncele'}
              </Link>
              <Link href={currentItem.type === 'movie' ? "/movies" : "/series"} className="glass text-white px-10 py-4 rounded-md font-bold hover:bg-white/20 transition-all hover:scale-105">
                Daha Fazla Bilgi
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Dots */}
      <div className="absolute bottom-8 right-8 z-30 flex gap-2">
        {items.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrentIndex(i)}
            className={`w-3 h-3 rounded-full transition-all ${i === currentIndex ? 'bg-blue-500 scale-125' : 'bg-white/30 hover:bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
}
