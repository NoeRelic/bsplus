'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings, Search, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const delayDebounceFn = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => setSearchResults(data.results));
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    // In a real app we'd fetch the active profile details from an API based on profileId cookie
    // Since we don't have a specific GET /api/profiles/active, we can just fetch all and match cookie
    // or just leave a placeholder for now. Let's do a quick fetch
    const getActive = async () => {
      const res = await fetch('/api/profiles/active');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    };
    getActive();

    const getNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setReadIds(data.readIds || []);
        }
      } catch (e) {}
    };
    getNotifications();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/live', label: 'Canlı TV (Beta)', isNew: true },
    { href: '/movies', label: 'Filmler' },
    { href: '/series', label: 'Diziler' },
    { href: '/catch-up', label: 'Kaldığın Yerden' },
    { href: '/favorites', label: 'Favorilerim' },
    { href: '/playlists', label: 'Listelerim' },
  ];

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const handleMarkRead = (id: string, link?: string) => {
    if (!readIds.includes(id)) {
      setReadIds(prev => [...prev, id]);
      fetch('/api/notifications', { method: 'POST', body: JSON.stringify({ action: 'markRead', notificationId: id }) });
    }
    setNotificationsOpen(false);
    if (link) router.push(link);
  };
  
  const handleMarkAllRead = () => {
    setReadIds(notifications.map(n => n.id));
    fetch('/api/notifications', { method: 'POST', body: JSON.stringify({ action: 'markAllRead' }) });
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 px-8 py-4 flex items-center justify-between ${scrolled ? 'glass shadow-2xl py-3' : 'bg-gradient-to-b from-black/90 to-transparent'}`}>
      <div className="flex items-center gap-10">
        <Link href="/" className="transition-transform hover:scale-105">
          <img src="https://r.resimlink.com/7tyeHIkaXUV.png" alt="BS+" className="h-8 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        </Link>
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href} className="relative group">
                <Link 
                  href={link.href}
                  className={`text-sm font-medium transition-all duration-300 flex items-center gap-1 ${isActive ? 'text-white font-bold text-glow' : 'text-zinc-400 hover:text-white'}`}
                >
                  {link.isNew && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                  {link.label}
                </Link>
                {/* Hover Underline Glow */}
                <div className={`absolute -bottom-1 left-0 h-[2px] bg-blue-500 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.8)] ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex items-center gap-6">
        {profile && (
          <div className="flex items-center gap-3 cursor-pointer group">
            <span className="text-zinc-300 text-sm hidden md:block group-hover:text-white transition-colors">{profile.name}</span>
            <img src={profile.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-md border border-zinc-700 group-hover:border-blue-500 transition-colors shadow-lg" />
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-zinc-300 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5 hover:scale-110 transition-transform hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-[#141414] border border-zinc-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-fade-in-up">
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/40">
                <h3 className="font-bold text-white">Bildirimler</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Tümünü Okundu İşaretle</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">Hiç bildiriminiz yok.</div>
                ) : (
                  notifications.map(n => {
                    const isUnread = !readIds.includes(n.id);
                    return (
                      <div 
                        key={n.id}
                        onClick={() => handleMarkRead(n.id, n.link)}
                        className={`p-4 border-b border-zinc-800/50 cursor-pointer transition-colors ${isUnread ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'hover:bg-zinc-800/50'} relative group`}
                      >
                        {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-bold text-sm ${isUnread ? 'text-white' : 'text-zinc-300'}`}>{n.title}</span>
                          <span className="text-[10px] text-zinc-500">{new Date(n.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className={`text-xs ${isUnread ? 'text-zinc-300' : 'text-zinc-500'} line-clamp-2`}>{n.message}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Animated Search Bar */}
        <div className="relative">
          <form 
            onSubmit={handleSearchSubmit}
            className={`flex items-center transition-all duration-500 ${searchOpen ? 'bg-black/60 backdrop-blur-md border border-zinc-600 rounded-md w-48 lg:w-72' : 'w-9'}`}
          >
            <button 
              type="button"
              onClick={() => { setSearchOpen(!searchOpen); if(!searchOpen) setTimeout(() => document.getElementById('nav-search')?.focus(), 100); }}
              className="p-2 text-zinc-300 hover:text-white hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all flex-shrink-0 z-10"
            >
              <Search className="w-5 h-5" />
            </button>
            <input 
              id="nav-search"
              type="text"
              placeholder="Film, dizi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-transparent text-white text-sm outline-none transition-all duration-500 ${searchOpen ? 'w-full px-2 opacity-100' : 'w-0 px-0 opacity-0 pointer-events-none'}`}
            />
          </form>

          {/* Live Search Results Dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-md shadow-2xl overflow-hidden z-50 animate-fade-in-up">
              {searchResults.map((res: any) => (
                <div 
                  key={res.id} 
                  onClick={() => {
                    router.push(res.mediaType === 'movie' ? `/watch/movie/${res.id}` : `/series/${res.id}`);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer transition-colors border-b border-zinc-800/50 last:border-0"
                >
                  <img src={res.bannerUrl} alt={res.title} className="w-10 h-14 object-cover rounded-sm" />
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-bold truncate w-48">{res.title}</span>
                    <span className="text-zinc-500 text-xs">{res.mediaType === 'movie' ? 'Film' : 'Dizi'}</span>
                  </div>
                </div>
              ))}
              <div 
                onClick={handleSearchSubmit}
                className="p-3 text-center text-sm text-blue-400 hover:text-blue-300 hover:bg-zinc-800 cursor-pointer transition-colors font-bold"
              >
                Tüm Sonuçları Gör
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 border-l border-zinc-800 pl-4 ml-2">
          <button 
            onClick={() => router.push('/account')}
            title="Hesap Ayarları"
            className="text-zinc-400 hover:text-blue-400 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={handleLogout}
            title="Çıkış Yap"
            className="text-zinc-400 hover:text-red-400 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
