'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AVATAR_GALLERY, DEFAULT_AVATAR } from '@/lib/avatars';
import { PlusCircle, Lock, X } from 'lucide-react';

type Profile = {
  id: string;
  name: string;
  avatarUrl: string;
  pin?: string;
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userPackage, setUserPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'select' | 'create' | 'pin'>('select');
  
  // Create Profile State
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(DEFAULT_AVATAR);
  const [newPin, setNewPin] = useState('');
  const [creating, setCreating] = useState(false);

  // PIN State
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles');
      const data = await res.json();
      if (res.ok) {
        setProfiles(data.profiles);
        setUserPackage(data.package);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = async (profile: Profile) => {
    if (profile.pin) {
      setSelectedProfile(profile);
      setView('pin');
    } else {
      await loginProfile(profile.id);
    }
  };

  const loginProfile = async (profileId: string, pin?: string) => {
    try {
      const res = await fetch('/api/profiles/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, pin }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/');
      } else {
        setPinError(data.error || 'Hata');
      }
    } catch (err) {
      setPinError('Bağlantı hatası');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProfile) {
      loginProfile(selectedProfile.id, enteredPin);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, avatarUrl: newAvatar, pin: newPin }),
      });
      if (res.ok) {
        await fetchProfiles();
        setView('select');
        setNewName('');
        setNewPin('');
        setNewAvatar(DEFAULT_AVATAR);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (view === 'pin') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
        <button onClick={() => setView('select')} className="absolute top-8 left-8 text-white hover:text-zinc-300">
          <X className="w-8 h-8" />
        </button>
        <div className="text-center">
          <img src={selectedProfile?.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-md mx-auto mb-6" />
          <h1 className="text-white text-2xl font-bold mb-6">Profil Kilidi: {selectedProfile?.name}</h1>
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4 items-center">
            <input
              type="password"
              maxLength={4}
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white text-center text-2xl tracking-widest p-4 rounded-md w-32 focus:outline-none focus:border-blue-500"
              placeholder="****"
              autoFocus
            />
            {pinError && <p className="text-red-500">{pinError}</p>}
            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-md font-bold hover:bg-blue-500">
              Giriş
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-black text-white p-8 md:p-16">
        <button onClick={() => setView('select')} className="absolute top-8 right-8 text-white hover:text-zinc-300">
          <X className="w-8 h-8" />
        </button>
        <h1 className="text-4xl font-bold mb-8">Profil Ekle</h1>
        
        <form onSubmit={handleCreateProfile} className="max-w-4xl grid md:grid-cols-2 gap-12">
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-zinc-400 mb-2">Profil Adı</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-4 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-2">PIN Kodu (Opsiyonel - 4 Hane)</label>
              <input
                type="text"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-4 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Boş bırakılabilir"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 text-white py-4 rounded-md font-bold mt-4 hover:bg-blue-500 disabled:opacity-50"
            >
              {creating ? 'Oluşturuluyor...' : 'Profili Kaydet'}
            </button>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-lg h-[500px] overflow-y-auto border border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Avatar Seç</h2>
            <div className="mb-6">
              <img src={newAvatar} alt="Selected" className="w-32 h-32 rounded-md border-4 border-blue-500 mx-auto" />
            </div>
            {Object.entries(AVATAR_GALLERY).map(([category, avatars]) => (
              <div key={category} className="mb-8">
                <h3 className="text-zinc-400 mb-4">{category}</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {avatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewAvatar(url)}
                      className={`relative rounded-md overflow-hidden aspect-square border-2 transition-all ${newAvatar === url ? 'border-blue-500 scale-105' : 'border-transparent hover:border-zinc-500'}`}
                    >
                      <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      {userPackage === 'Iron' && (
        <div className="absolute top-0 left-0 w-full bg-yellow-600 text-black text-center py-3 font-bold px-4">
          Mevcut Paketiniz: Iron (Sadece Filmler). Dizileri izleyebilmek için <a href="/packages" className="underline hover:text-white">paketinizi yükseltin</a>.
        </div>
      )}
      <h1 className="text-white text-3xl md:text-5xl font-bold mb-12">Kim İzliyor?</h1>
      <div className="flex flex-wrap justify-center gap-8">
        {profiles.map((profile: any) => (
          <button
            key={profile.id}
            onClick={() => handleProfileSelect(profile)}
            className="flex flex-col items-center group transition-transform hover:-translate-y-2"
          >
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-md overflow-hidden border-4 border-transparent group-hover:border-blue-500 transition-colors mb-4">
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              {profile.pin && (
                <div className="absolute bottom-2 right-2 bg-black/70 p-1 rounded-full">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <span className="text-zinc-400 group-hover:text-white transition-colors text-lg">{profile.name}</span>
          </button>
        ))}

        {profiles.length < 5 && (
          <button
            onClick={() => setView('create')}
            className="flex flex-col items-center group transition-transform hover:-translate-y-2"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-md border-4 border-zinc-800 flex items-center justify-center group-hover:border-blue-500 transition-colors mb-4 bg-zinc-900/50">
              <PlusCircle className="w-16 h-16 text-zinc-600 group-hover:text-blue-500 transition-colors" />
            </div>
            <span className="text-zinc-400 group-hover:text-white transition-colors text-lg">Profil Ekle</span>
          </button>
        )}
      </div>
    </div>
  );
}
