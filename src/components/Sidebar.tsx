'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Tv, Trophy, Film, Search, ListVideo, Clock, LogOut, SearchIcon, Settings } from 'lucide-react';
import { useState } from 'react';
import SearchModal from './SearchModal';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Keşfet', icon: Home },
    { href: '/search', label: 'Arama', icon: SearchIcon, isSearchAction: true },
    { href: '/live', label: 'BS+ TV', icon: Tv, isNew: true },
    { href: '/movies', label: 'Filmler', icon: Film },
    { href: '/series', label: 'Diziler', icon: Tv },
    { href: '/catch-up', label: 'Kaldığın Yerden', icon: Clock },
    { href: '/playlists', label: 'Listelerim', icon: ListVideo },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <aside 
        className={`fixed top-0 left-0 h-full z-50 glass-heavy transition-all duration-300 hidden md:flex flex-col border-r border-white/5 py-8 ${isHovered ? 'w-64' : 'w-20'} shadow-[0_0_30px_rgba(145,85,253,0.15)]`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-center mb-12 px-4 h-12 overflow-hidden">
        <img 
          src="https://r.resimlink.com/7tyeHIkaXUV.png" 
          alt="BS+" 
          className={`object-contain transition-all duration-300 min-w-[80px] ${isHovered ? 'h-8' : 'h-6 opacity-0 md:opacity-100'}`} 
        />
      </div>

      <nav className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto scrollbar-hide">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
          const Icon = link.icon;
          
          if (link.isSearchAction) {
            return (
              <button 
                key={link.label}
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group text-zinc-400 hover:text-white hover:bg-white/5 w-full"
              >
                <div className="relative flex-shrink-0">
                  <Icon className="w-6 h-6 transition-colors group-hover:text-[#9155fd]" />
                </div>
                <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? 'opacity-100 max-w-[200px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-4'}`}>
                  {link.label}
                </span>
              </button>
            );
          }
          
          return (
            <Link 
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-gradient-to-r from-[#9155fd]/20 to-[#5579fd]/20 text-white shadow-[0_0_15px_rgba(145,85,253,0.2)] border border-[#9155fd]/30' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="relative flex-shrink-0">
                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-[#9155fd]' : 'group-hover:text-[#9155fd]'}`} />
                {link.isNew && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#5579fd] rounded-full animate-pulse shadow-[0_0_10px_rgba(85,121,253,0.8)]" />
                )}
              </div>
              <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? 'opacity-100 max-w-[200px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-4'}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-auto pt-4 border-t border-white/5 flex flex-col gap-2">
        <Link 
          href="/account"
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all group"
        >
          <Settings className="w-6 h-6 group-hover:text-white flex-shrink-0" />
          <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
            Ayarlar
          </span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-6 h-6 group-hover:text-red-400 flex-shrink-0" />
          <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
            Çıkış Yap
          </span>
        </button>
      </div>
    </aside>
    </>
  );
}
