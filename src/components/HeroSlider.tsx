'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import SmartImage from './SmartImage';

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
    <div className="relative w-full h-[70vh] md:h-[85vh] xl:h-[95vh] bg-[#06060a] mb-12 overflow-hidden group rounded-b-[40px] shadow-[0_20px_50px_rgba(145,85,253,0.1)] border-b border-white/5">
      {items.map((currentItem, index) => (
        <motion.div
          key={currentItem.id || index}
          initial={false}
          animate={{ opacity: index === currentIndex ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className={`absolute inset-0 ${index === currentIndex ? 'z-20 pointer-events-auto' : 'z-0 pointer-events-none'}`}
        >
          {/* Smooth, performance-friendly gradients instead of heavy blur */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-[#06060a]/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06060a]/95 via-[#06060a]/50 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06060a]/60 via-transparent to-transparent z-10 pointer-events-none" />
          
          <SmartImage 
            src={currentItem.bannerUrl} 
            title={currentItem.title}
            categories={currentItem.categories}
            type={currentItem.type}
            loading={index === 0 ? "eager" : "lazy"}
            className="absolute inset-0 w-full h-full object-cover scale-[1.02] transform transition-transform duration-[10s] ease-out group-hover:scale-[1.05] -z-10 opacity-70"
          />
          
          <div className="absolute bottom-12 left-0 z-20 p-6 md:p-12 lg:p-20 w-full lg:w-2/3 xl:w-1/2">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={index === currentIndex ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ delay: index === currentIndex ? 0.3 : 0, duration: 0.6 }}
              className="text-4xl md:text-6xl xl:text-7xl font-display font-bold mb-4 tracking-tight drop-shadow-2xl text-white text-neon-glow"
            >
              {currentItem.title}
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={index === currentIndex ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ delay: index === currentIndex ? 0.4 : 0, duration: 0.6 }}
              className="text-base md:text-lg text-zinc-300 mb-8 line-clamp-3 md:line-clamp-4 font-light max-w-xl drop-shadow-md"
            >
              {currentItem.story || "En popüler dizi ve filmleri tek seferlik paketlerle, sınırsızca izleyin. Şimdi keşfetmeye başlayın."}
            </motion.p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={index === currentIndex ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ delay: index === currentIndex ? 0.5 : 0, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link 
                href={currentItem.type === 'movie' ? `/watch/movie/${currentItem.id}` : `/series/${currentItem.id}`} 
                className="bg-gradient-to-r from-[#9155fd] to-[#5579fd] text-white px-8 py-3.5 md:py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(145,85,253,0.4)] hover:shadow-[0_0_30px_rgba(145,85,253,0.6)] hover:scale-105 flex items-center justify-center gap-2 text-sm md:text-base border border-white/20"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {currentItem.type === 'movie' ? 'Hemen İzle' : 'Bölümleri İncele'}
              </Link>
              <Link 
                href={currentItem.type === 'movie' ? "/movies" : "/series"} 
                className="glass hover:bg-white/10 text-white px-8 py-3.5 md:py-4 rounded-2xl font-semibold transition-all hover:scale-105 flex items-center justify-center text-sm md:text-base"
              >
                Daha Fazla Bilgi
              </Link>
            </motion.div>
          </div>
        </motion.div>
      ))}
      
      {/* Optimized Dots */}
      <div className="absolute bottom-8 right-6 md:bottom-12 md:right-12 z-30 flex gap-2.5">
        {items.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrentIndex(i)}
            aria-label={`Slayt ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-[#9155fd] shadow-[0_0_10px_rgba(145,85,253,0.8)]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
