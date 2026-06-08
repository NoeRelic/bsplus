'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

export default function FavoriteButtonClient({ id, type, initialFavorite }: { id: string, type: 'movie'|'series', initialFavorite: boolean }) {
  const [isFav, setIsFav] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type })
      });
      const data = await res.json();
      if (data.success) {
        setIsFav(data.isFavorite);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleFav}
      className={`p-3 rounded-md border flex items-center justify-center transition-colors ${isFav ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' : 'bg-transparent border-zinc-600 text-white hover:border-white'}`}
      title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
    >
      <Heart className={`w-6 h-6 ${isFav ? 'fill-current' : ''}`} />
    </button>
  );
}
