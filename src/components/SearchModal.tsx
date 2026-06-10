'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Film, Tv } from 'lucide-react';
import Link from 'next/link';

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setIsSearching(true);
      const delayDebounceFn = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(data.results || []);
            setIsSearching(false);
          })
          .catch(() => setIsSearching(false));
      }, 400);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
      <div 
        className="absolute inset-0 bg-[#06060a]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-[#12121a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(145,85,253,0.15)] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex items-center px-4 py-4 border-b border-white/10">
          <Search className="w-6 h-6 text-[#9155fd] mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Film, dizi veya tür ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="p-1 hover:bg-white/10 rounded-lg transition-colors mr-2">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          )}
          <button type="button" onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            Kapat
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isSearching ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-[#9155fd] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col p-2">
              {searchResults.map((res: any) => (
                <div 
                  key={res.id}
                  onClick={() => {
                    router.push(res.mediaType === 'movie' ? `/watch/movie/${res.id}` : `/series/${res.id}`);
                    onClose();
                  }}
                  className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                >
                  <img src={res.bannerUrl} alt={res.title} className="w-16 h-24 object-cover rounded-lg shadow-md" />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg group-hover:text-[#5579fd] transition-colors">{res.title}</span>
                    <span className="text-zinc-400 text-sm flex items-center gap-1 mt-1">
                      {res.mediaType === 'movie' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                      {res.mediaType === 'movie' ? 'Film' : 'Dizi'} 
                      {res.year && ` • ${res.year}`}
                    </span>
                  </div>
                </div>
              ))}
              <button 
                onClick={handleSubmit}
                className="mt-2 p-3 text-center text-[#9155fd] hover:text-[#5579fd] hover:bg-white/5 rounded-xl transition-colors font-bold"
              >
                Tüm Sonuçları Gör
              </button>
            </div>
          ) : searchQuery.trim().length > 1 ? (
            <div className="p-8 text-center text-zinc-500">
              "{searchQuery}" için sonuç bulunamadı.
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-600">
              Ne izlemek istersin? Yazmaya başla...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
