'use client';

import { useState } from 'react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  title: string;
  categories?: string[];
  type?: 'movie' | 'series' | string;
}

const getGradientForCategory = (categories?: string[], type?: string) => {
  const cat = categories && categories.length > 0 ? categories[0].toLowerCase() : '';
  
  if (cat.includes('aksiyon') || cat.includes('macera')) return 'from-red-900 to-black';
  if (cat.includes('bilim kurgu') || cat.includes('fantastik')) return 'from-blue-900 to-indigo-950';
  if (cat.includes('korku') || cat.includes('gerilim')) return 'from-stone-900 to-black';
  if (cat.includes('komedi') || cat.includes('animasyon')) return 'from-orange-600 to-amber-900';
  if (cat.includes('dram') || cat.includes('romantik')) return 'from-rose-900 to-pink-950';
  
  // Default based on type
  if (type === 'movie') return 'from-blue-900 to-black';
  if (type === 'series') return 'from-purple-900 to-black';
  
  return 'from-zinc-800 to-black'; // Fallback
};

export default function SmartImage({ src, alt, title, categories, type, className, ...props }: SmartImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    const gradient = getGradientForCategory(categories, type);
    return (
      <div className={`relative flex flex-col items-center justify-center bg-gradient-to-br ${gradient} ${className} overflow-hidden`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        
        {/* Initials or Icon */}
        <span className="text-4xl md:text-6xl font-display font-bold text-white/30 mb-2">
          {title.charAt(0).toUpperCase()}
        </span>
        <span className="text-xs md:text-sm font-medium text-white/50 text-center px-2 line-clamp-2">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || title}
      className={className}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}
