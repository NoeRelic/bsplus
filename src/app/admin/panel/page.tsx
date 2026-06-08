'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LogOut, Plus, Ban, CheckCircle, Copy, Trash, 
  LayoutDashboard, Users, Film, Tv, PlaySquare, 
  MonitorPlay, ListVideo, MessageSquare, Settings, Menu, X, Search, Bell
} from 'lucide-react';

function CastEditor({ initialCast }: { initialCast?: any[] }) {
  const [cast, setCast] = useState<any[]>(initialCast || []);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const addMember = () => {
    if (!name || !role) return;
    setCast([...cast, { name, role, photoUrl: photoUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + name }]);
    setName(''); setRole(''); setPhotoUrl('');
  };

  return (
    <div className="md:col-span-2 border border-[rgba(255,255,255,0.12)] p-4 rounded-lg bg-[rgba(0,0,0,0.2)]">
      <h3 className="text-sm font-bold text-[rgba(255,255,255,0.8)] uppercase mb-4">Oyuncu & Ekip (Cast)</h3>
      
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Oyuncu Adı" className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-3 py-2 rounded-lg outline-none focus:border-[#9155fd]" />
        <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Filmdeki Rolü" className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-3 py-2 rounded-lg outline-none focus:border-[#9155fd]" />
        <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="Fotoğraf URL (Opsiyonel)" className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-3 py-2 rounded-lg outline-none focus:border-[#9155fd]" />
        <button type="button" onClick={addMember} className="bg-[#9155fd] text-white px-4 py-2 rounded-lg hover:bg-[#a674ff] transition-colors"><Plus className="w-5 h-5"/></button>
      </div>

      <div className="flex gap-3 flex-wrap">
        {cast.map((c, i) => (
          <div key={i} className="flex items-center gap-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] pr-3 rounded-full overflow-hidden">
            <img src={c.photoUrl} alt={c.name} className="w-10 h-10 object-cover" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{c.name}</span>
              <span className="text-xs text-gray-400">{c.role}</span>
            </div>
            <button type="button" onClick={() => setCast(cast.filter((_, idx)=>idx!==i))} className="ml-2 text-red-500 hover:text-red-400"><X className="w-4 h-4"/></button>
          </div>
        ))}
      </div>
      <input type="hidden" name="cast" value={JSON.stringify(cast)} />
    </div>
  );
}


export default function AdminPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [editMovie, setEditMovie] = useState<any>(null);
  const [editSeries, setEditSeries] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      if (json.error) {
        alert('API Hatası: ' + json.error);
        setData({ users: [], movies: [], series: [], episodes: [], channels: [], livePlaylists: [], comments: [] });
      } else {
        setData(json);
      }
    } catch (err) {
      console.error(err);
      setData({ users: [], movies: [], series: [], episodes: [], channels: [], livePlaylists: [], comments: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, payload: any) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    const result = await res.json();
    if (result.success) {
      if (result.user) {
        alert(`Kullanıcı oluşturuldu!\nUsername: ${result.user.username}\nPassword: ${result.user.password}`);
      }
      fetchData();
    } else {
      alert('Hata: ' + result.error);
    }
  };

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Analitikler', icon: LayoutDashboard },
    { id: 'users', label: 'Kullanıcılar', icon: Users },
    { id: 'movies', label: 'Filmler', icon: Film },
    { id: 'series', label: 'Diziler', icon: Tv },
    { id: 'episodes', label: 'Bölümler', icon: PlaySquare },
    { id: 'channels', label: 'Canlı Kanallar', icon: MonitorPlay },
    { id: 'playlists', label: 'Toplu Ekleme', icon: ListVideo },
    { id: 'comments', label: 'Yorum Yönetimi', icon: MessageSquare },
    { id: 'notifications', label: 'Bildirim Merkezi', icon: Bell },
    { id: 'system', label: 'Sistem Ayarları', icon: Settings },
  ];

  if (loading) return <div className="min-h-screen bg-[#28243d] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#9155fd] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex h-screen bg-[#28243d] text-[rgba(255,255,255,0.87)] font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#312d4b] shadow-[0_4px_8px_rgba(0,0,0,0.4)] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-6 mt-2">
          <span className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="bg-[#9155fd] text-white px-2 py-1 rounded-lg shadow-lg shadow-[#9155fd]/40">BS+</span>
            Materio
          </span>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
          <div className="text-xs font-semibold text-[rgba(255,255,255,0.38)] uppercase tracking-wider mb-4 ml-4">Yönetim Paneli</div>
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id} 
              onClick={() => { setTab(item.id); setSidebarOpen(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                tab === item.id 
                  ? 'bg-gradient-to-r from-[#9155fd] to-[#c482ff] text-white shadow-md shadow-[#9155fd]/40 font-medium' 
                  : 'text-[rgba(255,255,255,0.68)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 m-4 md:m-6 bg-[#312d4b]/95 backdrop-blur-md rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[rgba(255,255,255,0.38)]">
              <Search className="w-5 h-5" />
              <input type="text" placeholder="Arama yap..." className="bg-transparent border-none outline-none text-[rgba(255,255,255,0.87)] placeholder-[rgba(255,255,255,0.38)]" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[rgba(255,255,255,0.68)] hover:text-white relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#312d4b]"></span>
            </button>
            <div className="w-px h-6 bg-[rgba(255,255,255,0.12)]"></div>
            <button 
              onClick={() => {
                document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                router.push('/admin/login');
              }} 
              className="flex items-center gap-2 text-[rgba(255,255,255,0.68)] hover:text-white"
            >
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-8 h-8 rounded-full bg-[#9155fd]" />
            </button>
          </div>
        </header>
        
        {/* Scrollable View */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24 scrollbar-hide">
          
          {tab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Toplam Kullanıcı', value: data.users?.length || 0, icon: Users, color: '#9155fd' },
                { title: 'Toplam Film', value: data.movies?.length || 0, icon: Film, color: '#56ca00' },
                { title: 'Toplam Dizi', value: data.series?.length || 0, icon: Tv, color: '#ffb400' },
                { title: 'Canlı Kanal', value: data.channels?.length || 0, icon: MonitorPlay, color: '#ff4c51' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-[#312d4b] p-6 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex items-center justify-between">
                  <div>
                    <div className="text-[rgba(255,255,255,0.6)] text-sm font-medium mb-2">{stat.title}</div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </div>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'users' && (
            <div className="bg-[#312d4b] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="p-6 border-b border-[rgba(255,255,255,0.12)] flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-xl font-bold">Kullanıcı Listesi</h2>
                <div className="flex gap-4">
                  <select id="newPackage" className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-2 rounded-lg outline-none focus:border-[#9155fd]">
                    <option value="Iron">Iron Paket</option>
                    <option value="Gold">Gold Paket</option>
                    <option value="Diamond">Diamond Paket</option>
                  </select>
                  <button 
                    onClick={() => handleAction('createUser', { package: (document.getElementById('newPackage') as HTMLSelectElement).value })}
                    className="bg-[#9155fd] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#804bdf] transition-colors shadow-lg shadow-[#9155fd]/30 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Yeni Üret
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-[rgba(255,255,255,0.02)]">
                    <tr className="text-[rgba(255,255,255,0.6)] text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium border-b border-[rgba(255,255,255,0.12)]">Kullanıcı</th>
                      <th className="px-6 py-4 font-medium border-b border-[rgba(255,255,255,0.12)]">Paket</th>
                      <th className="px-6 py-4 font-medium border-b border-[rgba(255,255,255,0.12)]">Durum</th>
                      <th className="px-6 py-4 font-medium border-b border-[rgba(255,255,255,0.12)]">Aksiyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users?.slice(0, 50).map((u: any) => (
                      <tr key={u.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9155fd] to-[#c482ff] flex items-center justify-center font-bold text-xs">
                              {u.username.substring(0,2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{u.username}</span>
                              {u.plainPassword && (
                                <span className="text-xs text-[rgba(255,255,255,0.6)] flex items-center gap-1">
                                  Şifre: {u.plainPassword}
                                  <button onClick={() => { navigator.clipboard.writeText(`${u.username}:${u.plainPassword}`); alert('Kopyalandı!'); }} className="hover:text-white"><Copy className="w-3 h-3"/></button>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.package === 'Diamond' ? 'bg-[#9155fd]/20 text-[#9155fd]' : u.package === 'Gold' ? 'bg-[#ffb400]/20 text-[#ffb400]' : 'bg-[rgba(255,255,255,0.12)] text-gray-300'}`}>
                            {u.package}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                          {u.isBanned ? <span className="bg-[#ff4c51]/20 text-[#ff4c51] px-3 py-1 rounded-full text-xs font-medium">Banlı</span> : <span className="bg-[#56ca00]/20 text-[#56ca00] px-3 py-1 rounded-full text-xs font-medium">Aktif</span>}
                        </td>
                        <td className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleAction('banUser', { username: u.username })} className="text-[rgba(255,255,255,0.6)] hover:text-[#ffb400] transition-colors p-2" title="Banla/Aç">
                              <Ban className="w-5 h-5" />
                            </button>
                            <button onClick={() => { if(confirm('Silinsin mi?')) handleAction('deleteUser', { username: u.username }) }} className="text-[rgba(255,255,255,0.6)] hover:text-[#ff4c51] transition-colors p-2" title="Sil">
                              <Trash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'movies' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[#312d4b] p-6 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
                <h2 className="text-xl font-bold mb-6">{editMovie ? 'Filmi Düzenle' : 'Yeni Film Ekle'}</h2>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  
                  const fileTR = form.querySelector<HTMLInputElement>('input[name="fileTR"]')?.files?.[0];
                  const fileEN = form.querySelector<HTMLInputElement>('input[name="fileEN"]')?.files?.[0];
                  
                  let subtitleTR = fd.get('subtitleTR') as string || undefined;
                  let subtitleEN = fd.get('subtitleEN') as string || undefined;
                  
                  if (fileTR) {
                    const uploadFd = new FormData(); uploadFd.append('file', fileTR);
                    const res = await fetch('/api/upload', { method: 'POST', body: uploadFd });
                    const data = await res.json();
                    if (data.success) subtitleTR = data.url;
                  }
                  if (fileEN) {
                    const uploadFd = new FormData(); uploadFd.append('file', fileEN);
                    const res = await fetch('/api/upload', { method: 'POST', body: uploadFd });
                    const data = await res.json();
                    if (data.success) subtitleEN = data.url;
                  }

                  const payload: any = {
                    title: fd.get('title'), type: fd.get('type'), story: fd.get('story'),
                    bannerUrl: fd.get('bannerUrl'), videoUrl: fd.get('videoUrl'), videoUrlEN: fd.get('videoUrlEN'),
                    director: fd.get('director'),
                    cast: fd.get('cast'),
                    subtitleTR, subtitleEN
                  };

                  if (editMovie) { handleAction('editMovie', { id: editMovie.id, ...payload }); setEditMovie(null); } 
                  else { handleAction('addMovie', payload); }
                  form.reset();
                }}>
                  <input name="title" defaultValue={editMovie?.title} placeholder="Film İsmi" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full" />
                  <div className="md:col-span-2 flex gap-4">
                    <input name="type" defaultValue={editMovie?.type} placeholder="Türü (Aksiyon, Dram vs.)" required className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd]" />
                    <input name="director" defaultValue={editMovie?.director} placeholder="Yönetmen" className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd]" />
                  </div>
                  <div className="md:col-span-2">
                    <textarea name="story" defaultValue={editMovie?.story} placeholder="Hikayesi" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full min-h-[100px]" />
                  </div>
                  <input name="bannerUrl" defaultValue={editMovie?.bannerUrl} placeholder="Kapak Resmi URL" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full" />
                  
                  <CastEditor initialCast={editMovie?.cast} />
                  <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
                    <input id="movieVideoUrl" name="videoUrl" defaultValue={editMovie?.videoUrl} placeholder="TR Video URL (Ana Kaynak)" required className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd]" />
                    <button type="button" onClick={async () => {
                      const url = (document.getElementById('movieVideoUrl') as HTMLInputElement).value;
                      if(!url) return alert('Önce TR Video URL alanını doldurun.');
                      alert('M3U8 taranıyor... Lütfen bekleyin.');
                      try {
                        const res = await fetch('/api/admin/scan-m3u8', { method: 'POST', body: JSON.stringify({ url }) });
                        const result = await res.json();
                        if (result.success && result.tracks && result.tracks.length > 0) {
                          alert(`M3U8 içinden ${result.tracks.length} adet dublaj seçeneği bulundu:\n` + result.tracks.map((t:any) => t.name).join(', '));
                          // In a real advanced app, we'd save these tracks to the movie object, but since Hls.js auto-detects them anyway when loading the TR URL, we just need to let the user know they exist.
                          // Setting a flag on the form or letting Hls handle it works. Our Player already supports auto-detect if we update PlayerClient.
                        } else {
                          alert('M3U8 içinde ekstra dublaj kanalı bulunamadı veya düz mp4/mkv linki girdiniz.');
                        }
                      } catch(e) { alert('Tarama başarısız.'); }
                    }} className="bg-[#56ca00] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4eb700] transition-colors whitespace-nowrap">M3U8 Dublajlarını Tara</button>
                  </div>
                  <input name="videoUrlEN" defaultValue={editMovie?.videoUrlEN} placeholder="Orijinal Ses URL (Opsiyonel / 2. Kaynak)" className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full md:col-span-2" />
                  
                  <div className="md:col-span-2 grid grid-cols-2 gap-6 pt-4 border-t border-[rgba(255,255,255,0.12)]">
                    <div>
                      <label className="text-xs text-[rgba(255,255,255,0.6)] mb-2 block uppercase tracking-wider">TR Altyazı (.vtt)</label>
                      <input type="file" name="fileTR" accept=".vtt" className="w-full text-sm text-[rgba(255,255,255,0.6)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#9155fd]/20 file:text-[#9155fd] hover:file:bg-[#9155fd]/30" />
                      <input type="hidden" name="subtitleTR" defaultValue={editMovie?.subtitleTR} />
                    </div>
                    <div className="flex items-end justify-end gap-4">
                      {editMovie && <button type="button" onClick={() => setEditMovie(null)} className="px-6 py-2 rounded-lg text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">İptal</button>}
                      <button type="submit" className="bg-[#9155fd] text-white px-8 py-2.5 rounded-lg font-medium hover:bg-[#804bdf] transition-colors shadow-lg shadow-[#9155fd]/30">{editMovie ? 'Güncelle' : 'Ekle'}</button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="bg-[#312d4b] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-6">
                <h3 className="text-lg font-bold mb-4">Film Arşivi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.movies?.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-3 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                      <img src={m.bannerUrl} alt={m.title} className="w-12 h-16 object-cover rounded shadow-md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{m.title}</div>
                        <div className="text-xs text-[rgba(255,255,255,0.6)]">{m.type}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setEditMovie(m)} className="text-[rgba(255,255,255,0.6)] hover:text-[#9155fd]"><Settings className="w-4 h-4"/></button>
                        <button onClick={() => { if(confirm('Emin misiniz?')) handleAction('deleteMovie', { id: m.id }) }} className="text-[rgba(255,255,255,0.6)] hover:text-[#ff4c51]"><Trash className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BİLDİRİMLER */}
          {tab === 'notifications' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[#312d4b] p-6 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
                <h2 className="text-xl font-bold mb-6">Yeni Bildirim Gönder</h2>
                <form className="grid grid-cols-1 gap-6" onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  handleAction('sendNotification', Object.fromEntries(fd));
                  (e.target as HTMLFormElement).reset();
                }}>
                  <div className="flex gap-4">
                    <input name="title" placeholder="Bildirim Başlığı (Örn: Yeni Film Eklendi!)" required className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd]" />
                    <select name="targetPackage" className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd]">
                      <option value="All" className="bg-[#312d4b]">Tüm Kullanıcılar</option>
                      <option value="Iron" className="bg-[#312d4b]">Sadece Iron</option>
                      <option value="Gold" className="bg-[#312d4b]">Sadece Gold</option>
                      <option value="Diamond" className="bg-[#312d4b]">Sadece Diamond</option>
                    </select>
                  </div>
                  <textarea name="message" placeholder="Bildirim İçeriği" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full min-h-[100px]" />
                  <input name="link" placeholder="Yönlendirilecek Link (Opsiyonel)" className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full" />
                  <div className="flex justify-end">
                    <button type="submit" className="bg-[#9155fd] text-white px-8 py-2.5 rounded-lg font-medium hover:bg-[#804bdf] transition-colors shadow-lg shadow-[#9155fd]/30">Gönder</button>
                  </div>
                </form>
              </div>

              <div className="bg-[#312d4b] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-6">
                <h3 className="text-lg font-bold mb-4">Geçmiş Bildirimler</h3>
                <div className="flex flex-col gap-4">
                  {data.notifications?.slice().reverse().map((n: any) => (
                    <div key={n.id} className="flex justify-between items-start bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-4 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[#9155fd]">{n.title}</span>
                          <span className="text-xs bg-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded-full text-[rgba(255,255,255,0.6)]">{n.targetPackage}</span>
                          <span className="text-xs text-[rgba(255,255,255,0.4)]">{new Date(n.createdAt).toLocaleString('tr-TR')}</span>
                        </div>
                        <p className="text-sm text-[rgba(255,255,255,0.8)]">{n.message}</p>
                        {n.link && <a href={n.link} className="text-xs text-blue-400 hover:underline mt-2 inline-block">Link: {n.link}</a>}
                      </div>
                      <button onClick={() => { if(confirm('Silinsin mi?')) handleAction('deleteNotification', { id: n.id }) }} className="text-[rgba(255,255,255,0.4)] hover:text-[#ff4c51] p-2">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {!data.notifications?.length && <div className="text-[rgba(255,255,255,0.4)] text-sm">Henüz bildirim gönderilmedi.</div>}
                </div>
              </div>
            </div>
          )}

          {/* SİSTEM AYARLARI */}
          {tab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#312d4b] p-8 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><CheckCircle className="w-32 h-32" /></div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-[#9155fd]">Veritabanı Yedekleme</h2>
                <p className="text-[rgba(255,255,255,0.6)] mb-8 max-w-sm relative z-10">Mevcut tüm verilerinizi JSON formatında cihazınıza indirebilirsiniz. Güvenliğiniz için haftalık yedek önerilir.</p>
                <button 
                  onClick={async () => {
                    const res = await fetch('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'backupDatabase' }) });
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `bsplus-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
                  }}
                  className="bg-[#9155fd] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#804bdf] shadow-lg shadow-[#9155fd]/30 relative z-10"
                >
                  Yedeği İndir
                </button>
              </div>

              <div className="bg-[#312d4b] p-8 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] border border-[#ff4c51]/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-[#ff4c51]"><Ban className="w-32 h-32" /></div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-[#ff4c51]">Sistem Bakım Modu</h2>
                <p className="text-[rgba(255,255,255,0.6)] mb-8 max-w-sm relative z-10">Aktif edildiğinde sadece yöneticiler siteye erişebilir. Diğer tüm kullanıcılar bakım ekranı ile karşılaşır.</p>
                <div className="flex items-center gap-4 relative z-10">
                  <button 
                    onClick={() => { if(confirm('Bakım modunu değiştirmek istediğinize emin misiniz?')) handleAction('toggleMaintenance', {}); }}
                    className={`${data.maintenance ? 'bg-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(255,255,255,0.2)]' : 'bg-[#ff4c51] text-white hover:bg-[#e04347] shadow-lg shadow-[#ff4c51]/30'} px-6 py-2.5 rounded-lg font-medium transition-all`}
                  >
                    {data.maintenance ? 'Sistemi Yayına Al' : 'Bakım Modunu Başlat'}
                  </button>
                  {data.maintenance && <span className="bg-[#ff4c51]/20 text-[#ff4c51] px-3 py-1 rounded-full text-xs font-bold animate-pulse border border-[#ff4c51]/50">Şu an Aktif</span>}
                </div>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {tab === 'comments' && (
            <div className="bg-[#312d4b] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="p-6 border-b border-[rgba(255,255,255,0.12)]">
                <h2 className="text-xl font-bold">Kullanıcı Yorumları (Onay Merkezi)</h2>
              </div>
              <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
                {data.comments?.slice().reverse().map((c: any) => (
                  <li key={c.id} className="p-6 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <img src={c.profileAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.profileName}`} className="w-12 h-12 rounded-full bg-black/50" alt="" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white">{c.profileName}</span>
                            <span className="text-[#ffb400] text-sm">⭐ {c.rating}/5</span>
                            {c.status === 'pending' && <span className="bg-[#ffb400]/20 text-[#ffb400] text-xs px-2 py-0.5 rounded-full border border-[#ffb400]/50">Onay Bekliyor</span>}
                            {c.status === 'approved' && <span className="bg-[#56ca00]/20 text-[#56ca00] text-xs px-2 py-0.5 rounded-full border border-[#56ca00]/50">Yayında</span>}
                          </div>
                          <div className="text-[rgba(255,255,255,0.87)] bg-black/20 p-3 rounded-lg border border-[rgba(255,255,255,0.06)] mt-2">
                            "{c.content}"
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2">
                        {c.status === 'pending' && (
                          <button onClick={() => handleAction('approveComment', { id: c.id })} className="bg-[#56ca00]/20 text-[#56ca00] px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#56ca00]/30 transition-colors">
                            Onayla
                          </button>
                        )}
                        <button onClick={() => { if(confirm('Emin misiniz?')) handleAction('deleteComment', { id: c.id }) }} className="bg-[#ff4c51]/20 text-[#ff4c51] px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#ff4c51]/30 transition-colors">
                          Sil
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {(!data.comments || data.comments.length === 0) && (
                  <div className="p-8 text-center text-[rgba(255,255,255,0.38)]">Kayıtlı yorum bulunmuyor.</div>
                )}
              </ul>
            </div>
          )}

          {/* SERIES TAB */}
          {tab === 'series' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[#312d4b] p-6 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
                <h2 className="text-xl font-bold mb-6">{editSeries ? 'Diziyi Düzenle' : 'Yeni Dizi Ekle'}</h2>
                <form className="grid grid-cols-1 gap-6" onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const payload = Object.fromEntries(fd);
                  if (editSeries) { handleAction('editSeries', { id: editSeries.id, ...payload }); setEditSeries(null); } 
                  else { handleAction('addSeries', payload); }
                  (e.target as HTMLFormElement).reset();
                }}>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input name="title" defaultValue={editSeries?.title} placeholder="Dizi İsmi" required className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd]" />
                    <input name="director" defaultValue={editSeries?.director} placeholder="Yönetmen" className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd]" />
                  </div>
                  <textarea name="story" defaultValue={editSeries?.story} placeholder="Hikayesi" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full min-h-[100px]" />
                  <input name="bannerUrl" defaultValue={editSeries?.bannerUrl} placeholder="Kapak Resmi URL" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full" />
                  <CastEditor initialCast={editSeries?.cast} />
                  <div className="flex justify-end gap-4 mt-2">
                    {editSeries && <button type="button" onClick={() => setEditSeries(null)} className="px-6 py-2 rounded-lg text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">İptal</button>}
                    <button type="submit" className="bg-[#9155fd] text-white px-8 py-2.5 rounded-lg font-medium hover:bg-[#804bdf] transition-colors shadow-lg shadow-[#9155fd]/30">{editSeries ? 'Güncelle' : 'Ekle'}</button>
                  </div>
                </form>
              </div>
              <div className="bg-[#312d4b] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-6">
                <h3 className="text-lg font-bold mb-4">Dizi Arşivi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.series?.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-3 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                      <img src={s.bannerUrl} alt={s.title} className="w-12 h-16 object-cover rounded shadow-md" />
                      <div className="flex-1 min-w-0 font-medium truncate">{s.title}</div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setEditSeries(s)} className="text-[rgba(255,255,255,0.6)] hover:text-[#9155fd]"><Settings className="w-4 h-4"/></button>
                        <button onClick={() => { if(confirm('Silinsin mi?')) handleAction('deleteSeries', { id: s.id }) }} className="text-[rgba(255,255,255,0.6)] hover:text-[#ff4c51]"><Trash className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EPISODES TAB */}
          {tab === 'episodes' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[#312d4b] p-6 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
                <h2 className="text-xl font-bold mb-6">Yeni Bölüm Ekle</h2>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const fd = new FormData(form);
                  const fileTR = form.querySelector<HTMLInputElement>('input[name="fileTR"]')?.files?.[0];
                  let subtitleTR = fd.get('subtitleTR') as string || undefined;
                  if (fileTR) {
                    const uploadFd = new FormData(); uploadFd.append('file', fileTR);
                    const res = await fetch('/api/upload', { method: 'POST', body: uploadFd });
                    const data = await res.json();
                    if (data.success) subtitleTR = data.url;
                  }
                  handleAction('addEpisode', {
                    seriesId: fd.get('seriesId'), seasonNumber: fd.get('seasonNumber'), episodeNumber: fd.get('episodeNumber'),
                    title: fd.get('title'), videoUrl: fd.get('videoUrl'), subtitleTR
                  });
                  form.reset();
                }}>
                  <select name="seriesId" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full md:col-span-2">
                    <option value="" className="bg-[#312d4b]">Dizi Seçin</option>
                    {data.series?.map((s: any) => <option key={s.id} value={s.id} className="bg-[#312d4b]">{s.title}</option>)}
                  </select>
                  <input name="seasonNumber" type="number" placeholder="Sezon No" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full" />
                  <input name="episodeNumber" type="number" placeholder="Bölüm No" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full" />
                  <input name="title" placeholder="Bölüm Adı" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full md:col-span-2" />
                  
                  <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
                    <input id="episodeVideoUrl" name="videoUrl" placeholder="Video URL (.m3u8 / .mp4)" required className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd]" />
                    <button type="button" onClick={async () => {
                      const url = (document.getElementById('episodeVideoUrl') as HTMLInputElement).value;
                      if(!url) return alert('Önce Video URL alanını doldurun.');
                      alert('M3U8 taranıyor... Lütfen bekleyin.');
                      try {
                        const res = await fetch('/api/admin/scan-m3u8', { method: 'POST', body: JSON.stringify({ url }) });
                        const result = await res.json();
                        if (result.success && result.tracks && result.tracks.length > 0) {
                          alert(`M3U8 içinden ${result.tracks.length} adet dublaj seçeneği bulundu:\n` + result.tracks.map((t:any) => t.name).join(', '));
                        } else {
                          alert('M3U8 içinde ekstra dublaj kanalı bulunamadı veya düz mp4/mkv linki girdiniz.');
                        }
                      } catch(e) { alert('Tarama başarısız.'); }
                    }} className="bg-[#56ca00] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4eb700] transition-colors whitespace-nowrap">M3U8 Dublajlarını Tara</button>
                  </div>
                  <input name="videoUrlEN" placeholder="Orijinal Ses URL (Opsiyonel / 2. Kaynak)" className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full md:col-span-2" />

                  <div className="md:col-span-2 flex items-center justify-between mt-2 pt-4 border-t border-[rgba(255,255,255,0.12)]">
                    <div>
                      <label className="text-xs text-[rgba(255,255,255,0.6)] mb-2 block uppercase tracking-wider">TR Altyazı (.vtt)</label>
                      <input type="file" name="fileTR" accept=".vtt" className="w-full text-sm text-[rgba(255,255,255,0.6)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#9155fd]/20 file:text-[#9155fd]" />
                    </div>
                    <button type="submit" className="bg-[#9155fd] text-white px-8 py-2.5 rounded-lg font-medium hover:bg-[#804bdf] transition-colors shadow-lg shadow-[#9155fd]/30">Ekle</button>
                  </div>
                </form>
              </div>
              <div className="bg-[#312d4b] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-6">
                <h3 className="text-lg font-bold mb-4">Son Eklenen Bölümler</h3>
                <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {data.episodes?.slice().reverse().map((ep: any) => {
                    const series = data.series?.find((s:any) => s.id === ep.seriesId);
                    return (
                      <li key={ep.id} className="py-4 flex justify-between items-center hover:bg-[rgba(255,255,255,0.02)] transition-colors px-2 rounded-lg">
                        <span className="font-medium text-white">{series?.title} <span className="text-[#9155fd]">S{ep.seasonNumber}E{ep.episodeNumber}</span>: <span className="text-[rgba(255,255,255,0.6)]">{ep.title}</span></span>
                        <button onClick={() => { if(confirm('Silinsin mi?')) handleAction('deleteEpisode', { id: ep.id }) }} className="text-[rgba(255,255,255,0.6)] hover:text-[#ff4c51]"><Trash className="w-5 h-5"/></button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* CHANNELS TAB */}
          {tab === 'channels' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[#312d4b] p-6 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
                <h2 className="text-xl font-bold mb-6">Canlı Kanal Ekle</h2>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => {
                  e.preventDefault(); const fd = new FormData(e.currentTarget);
                  handleAction('addChannel', Object.fromEntries(fd)); e.currentTarget.reset();
                }}>
                  <input name="name" placeholder="Kanal İsmi" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full" />
                  <input name="logoUrl" placeholder="Logo URL (Opsiyonel)" className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full" />
                  <input name="streamUrl" placeholder="Yayın URL (m3u8)" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#9155fd] w-full md:col-span-2" />
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit" className="bg-[#9155fd] text-white px-8 py-2.5 rounded-lg font-medium hover:bg-[#804bdf] transition-colors shadow-lg shadow-[#9155fd]/30">Kanalı Ekle</button>
                  </div>
                </form>
              </div>
              <div className="bg-[#312d4b] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] p-6">
                <h3 className="text-lg font-bold mb-4">Kanallar</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.channels?.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-4 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                      {c.logoUrl && <img src={c.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />}
                      <span className="flex-1 font-medium truncate">{c.name}</span>
                      <button onClick={() => { if(confirm('Emin misiniz?')) handleAction('deleteChannel', { id: c.id }) }} className="text-[rgba(255,255,255,0.6)] hover:text-[#ff4c51]"><Trash className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PLAYLISTS TAB */}
          {tab === 'playlists' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[#312d4b] p-6 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] border border-[#ffb400]/20">
                <h2 className="text-xl font-bold mb-2 text-[#ffb400]">Canlı TV Playlist URL Entegrasyonu</h2>
                <p className="text-[rgba(255,255,255,0.6)] mb-6 text-sm">Sisteme M3U linki ekleyin. Kanallar otomatik senkronize olur.</p>
                <form className="flex gap-4 items-end" onSubmit={(e) => {
                  e.preventDefault(); handleAction('addLivePlaylist', Object.fromEntries(new FormData(e.currentTarget))); e.currentTarget.reset();
                }}>
                  <div className="flex-1">
                    <input name="name" placeholder="Playlist İsmi" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#ffb400] w-full mb-4" />
                    <input name="url" placeholder="M3U veya M3U8 URL'si" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#ffb400] w-full" />
                  </div>
                  <button type="submit" className="bg-[#ffb400] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#e5a200] transition-colors shadow-lg shadow-[#ffb400]/30 h-fit mb-1">Ekle</button>
                </form>
                <ul className="mt-6 divide-y divide-[rgba(255,255,255,0.06)]">
                  {data.livePlaylists?.map((p: any) => (
                    <li key={p.id} className="py-4 flex justify-between items-center">
                      <div><div className="font-bold">{p.name}</div><div className="text-sm text-[#ffb400]">{p.url}</div></div>
                      <button onClick={() => { if(confirm('Silinsin mi?')) handleAction('deleteLivePlaylist', { id: p.id }) }} className="text-[#ff4c51] hover:text-[#e04347]"><Trash className="w-5 h-5"/></button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#312d4b] p-6 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.2)] border border-[#56ca00]/20">
                <h2 className="text-xl font-bold mb-2 text-[#56ca00]">Film / Dizi Toplu Ekleme (M3U)</h2>
                <p className="text-[rgba(255,255,255,0.6)] mb-6 text-sm">Bir .m3u dosyası yükleyerek yüzlerce içeriği saniyeler içinde kalıcı olarak veritabanınıza ekleyebilirsiniz.</p>
                <form className="flex flex-col gap-4" onSubmit={async (e) => {
                  e.preventDefault(); 
                  const form = e.currentTarget;
                  const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
                  const categorySelect = form.querySelector('select[name="category"]') as HTMLSelectElement;
                  
                  if (!fileInput.files || fileInput.files.length === 0) return;
                  const file = fileInput.files[0];
                  const category = categorySelect.value;
                  
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const text = event.target?.result as string;
                    const lines = text.split(/\r?\n/);
                    
                    let parsedItems = [];
                    let currentTitle = '';
                    let currentBanner = '';
                    let currentCategory = '';
                    
                    for (const line of lines) {
                      const l = line.trim();
                      if (!l) continue;
                      
                      if (l.startsWith('#EXTINF:')) {
                        const commaIdx = l.lastIndexOf(',');
                        currentTitle = commaIdx > -1 ? l.substring(commaIdx + 1).trim() : 'İsimsiz İçerik';
                        const logoMatch = l.match(/tvg-logo="([^"]+)"/);
                        currentBanner = logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80';
                        const groupMatch = l.match(/group-title="([^"]+)"/);
                        currentCategory = groupMatch ? groupMatch[1].trim() : '';
                      } 
                      else if (!l.startsWith('#')) {
                        parsedItems.push({
                          title: currentTitle,
                          bannerUrl: currentBanner,
                          category: currentCategory,
                          videoUrl: l
                        });
                        currentTitle = ''; currentBanner = ''; currentCategory = '';
                      }
                    }
                    
                    if (parsedItems.length === 0) return alert('Dosyada geçerli link bulunamadı.');
                    
                    // Chunk and send
                    const chunkSize = 500;
                    let successCount = 0;
                    
                    for (let i = 0; i < parsedItems.length; i += chunkSize) {
                      const chunk = parsedItems.slice(i, i + chunkSize);
                      try {
                        const res = await fetch('/api/admin/playlist-chunk', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ category, items: chunk })
                        });
                        if (res.ok) successCount += chunk.length;
                      } catch (err) {
                        console.error(err);
                      }
                    }
                    
                    alert(`Toplam ${successCount} içerik başarıyla aktarıldı!`);
                    fetchData();
                    form.reset();
                  };
                  reader.readAsText(file);
                }}>
                  <select name="category" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg outline-none focus:border-[#56ca00] w-full">
                    <option value="auto">Otomatik Algıla (Akıllı Tarama)</option>
                    <option value="movie">Sadece Filmler Olarak Ekle</option>
                    <option value="series">Sadece Diziler Olarak Ekle</option>
                  </select>
                  <input type="file" name="file" accept=".m3u,.m3u8" required className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white px-4 py-3 rounded-lg w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#56ca00]/20 file:text-[#56ca00]" />
                  <button type="submit" className="bg-[#56ca00] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4eb700] transition-colors shadow-lg shadow-[#56ca00]/30 mt-2">İçe Aktar</button>
                </form>
                <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.1)]">
                  <button onClick={() => { if(confirm('M3U ile eklenmiş tüm film ve diziler silinecek. Emin misiniz?')) handleAction('bulkDeleteM3U', {}) }} className="bg-[#ff4c51] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04347] transition-colors shadow-lg shadow-[#ff4c51]/30 w-full flex items-center justify-center gap-2">
                    <Trash className="w-5 h-5" /> Toplu Eklenenleri Temizle
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
