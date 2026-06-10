'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Tv, Film, Search, Menu } from 'lucide-react';
import { useState } from 'react';
import SearchModal from './SearchModal';

export default function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const mainLinks = [
    { href: '/', label: 'Keşfet', icon: Home },
    { href: '/search', label: 'Ara', icon: Search, isSearchAction: true },
    { href: '/movies', label: 'Filmler', icon: Film },
    { href: '/series', label: 'Diziler', icon: Tv },
  ];

  const moreLinks = [
    { href: '/live', label: 'BS+ TV', isNew: true },
    { href: '/catch-up', label: 'Kaldığın Yerden' },
    { href: '/playlists', label: 'Listelerim' },
    { href: '/profiles', label: 'Profil Değiştir' },
    { href: '/account', label: 'Ayarlar' },
  ];

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      {/* Expanding Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[40] bg-[#06060a]/90 backdrop-blur-xl md:hidden flex flex-col justify-end pb-24 px-6 animate-fade-in-up">
          <div className="flex flex-col gap-4">
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-2xl glass border border-white/5 text-white active:scale-95 transition-transform"
              >
                <span className="font-display font-semibold text-lg">{link.label}</span>
                {link.isNew && (
                  <span className="bg-[#5579fd] text-white text-xs font-bold px-2 py-1 rounded-full shadow-[0_0_10px_rgba(85,121,253,0.5)]">
                    YENİ
                  </span>
                )}
              </Link>
            ))}
            <button 
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="mt-4 p-4 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold active:scale-95 transition-transform text-left"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-[50] glass-heavy border-t border-white/10 px-6 py-3 pb-safe md:hidden shadow-[0_-10px_40px_rgba(145,85,253,0.15)] rounded-t-3xl">
        <ul className="flex items-center justify-between max-w-md mx-auto">
          {mainLinks.map((link) => {
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
            const Icon = link.icon;
            
            if (link.isSearchAction) {
              return (
                <li key={link.label}>
                  <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center gap-1 p-2 group w-full">
                    <div className="relative p-2 rounded-xl transition-all duration-300 text-zinc-400 group-hover:text-white">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium transition-colors text-zinc-500">
                      {link.label}
                    </span>
                  </button>
                </li>
              );
            }
            
            return (
              <li key={link.href}>
                <Link href={link.href} className="flex flex-col items-center gap-1 p-2 group">
                  <div className={`relative p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#9155fd]/20 text-[#9155fd] shadow-[0_0_15px_rgba(145,85,253,0.3)]' : 'text-zinc-400 group-hover:text-white'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#9155fd]' : 'text-zinc-500'}`}>
                    {link.label}
                  </span>
                </Link>
              </li>
            );
          })}
          
          <li>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col items-center gap-1 p-2 group"
            >
              <div className={`relative p-2 rounded-xl transition-all duration-300 ${menuOpen ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-zinc-400 group-hover:text-white'}`}>
                <Menu className="w-6 h-6" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#5579fd] rounded-full shadow-[0_0_8px_rgba(85,121,253,0.8)]" />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${menuOpen ? 'text-white' : 'text-zinc-500'}`}>
                Diğer
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
