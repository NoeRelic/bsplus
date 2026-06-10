'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/account')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setUsername(data.user.username);
        }
        setLoading(false);
      });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!currentPassword) {
      setError('Lütfen değişiklikleri onaylamak için mevcut şifrenizi girin.');
      return;
    }

    const payload: any = { username, currentPassword };
    if (password) {
      payload.password = password;
    }

    const res = await fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      setMessage('Hesap bilgileriniz başarıyla güncellendi.');
      setPassword('');
      setCurrentPassword('');
    } else {
      setError(data.error || 'Bir hata oluştu.');
    }
  };

  if (loading) return <div className="p-16 text-white text-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-8 flex justify-center">
      <div className="max-w-xl w-full">
        <h1 className="text-4xl font-bold mb-8">Hesap Ayarları</h1>
        
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-zinc-400 mb-2">Mevcut Paketiniz</h2>
            <p className="text-2xl font-bold text-blue-500">{user?.package} Paket</p>
          </div>

          {message && <div className="bg-green-500/20 text-green-500 p-4 rounded-md mb-6">{message}</div>}
          {error && <div className="bg-red-500/20 text-red-500 p-4 rounded-md mb-6">{error}</div>}

          <form onSubmit={handleUpdate} className="flex flex-col gap-6">
            <div>
              <label className="block text-zinc-400 mb-2 font-bold">Kullanıcı Adı</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white p-3 rounded-md focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-zinc-400 mb-2 font-bold">Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white p-3 rounded-md focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4 border-t border-zinc-800 mt-2">
              <label className="block text-zinc-400 mb-2 font-bold">Mevcut Şifreniz <span className="text-red-500">*</span></label>
              <p className="text-xs text-zinc-500 mb-2">Değişiklikleri kaydetmek için mevcut şifrenizi girmelisiniz.</p>
              <input 
                type="password" 
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white p-3 rounded-md focus:outline-none focus:border-red-500/50"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-md mt-4 transition-colors">
              Değişiklikleri Kaydet
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
