'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (res.ok) {
        router.push('/admin/panel');
      } else {
        setError('Geçersiz Token');
      }
    } catch (err) {
      setError('Hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl w-full max-w-md">
        <h1 className="text-2xl text-white font-bold mb-6 text-center">Admin Girişi</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white p-3 rounded-md focus:outline-none focus:border-blue-500"
            placeholder="Gizli Token"
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-md transition-colors">
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
