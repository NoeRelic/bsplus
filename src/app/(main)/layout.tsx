import Navbar from '@/components/Navbar';
import { readDB } from '@/lib/db';
import { Settings } from 'lucide-react';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = await readDB();

  if (db.maintenance) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8 text-center">
        <Settings className="w-24 h-24 text-blue-500 animate-spin mb-8" style={{ animationDuration: '3s' }} />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Sistem Bakımda</h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">
          Şu anda size daha iyi hizmet verebilmek için büyük çaplı bir güncelleme yapıyoruz. 
          Sistemimiz kısa süre içerisinde çok daha güçlü bir şekilde geri dönecektir.
        </p>
        <div className="mt-8 text-blue-500 font-bold">BS+ Ultimate Edition</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}
