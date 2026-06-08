'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Giriş yapılamadı.');
      } else {
        router.push('/profiles');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/ab180a27-b661-44d7-a6d9-940cb32f2f4a/7fb62e44-31fd-4e1c-bba3-1e7412d4d124/TR-tr-20231009-popsignuptwoweeks-perspective_alpha_website_large.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="absolute top-0 left-0 p-8 z-10">
        {/* We can use standard img tag instead of Next.js Image for external URLs without config */}
        <img 
          src="https://r.resimlink.com/7tyeHIkaXUV.png" 
          alt="BS+ Logo" 
          className="h-12 object-contain"
        />
      </div>

      <div className="relative z-10 w-full max-w-[450px] bg-black/80 p-16 rounded-xl border border-blue-900/30 backdrop-blur-sm">
        <h1 className="text-white text-3xl font-bold mb-8">Giriş Yap</h1>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-900/70 text-white px-4 py-4 rounded-md border border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all peer placeholder-transparent"
              placeholder="Kullanıcı Adı"
              required
            />
            <label className="absolute left-4 top-4 text-zinc-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-400 bg-zinc-900/70 px-1 -ml-1">
              Kullanıcı Adı
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900/70 text-white px-4 py-4 rounded-md border border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all peer placeholder-transparent"
              placeholder="Şifre"
              required
            />
            <label className="absolute left-4 top-4 text-zinc-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-400 bg-zinc-900/70 px-1 -ml-1">
              Şifre
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Oturum Aç'}
          </button>

          <div className="mt-8 text-zinc-400 text-sm">
            BS+'a yeni misiniz?{' '}
            <a href="/packages" className="text-white hover:underline decoration-blue-500 underline-offset-4">
              Şimdi paket satın alın.
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
