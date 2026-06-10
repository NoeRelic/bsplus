import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import { connectDB } from '@/lib/mongoose';
import { Config } from '@/lib/models';
import { Settings } from 'lucide-react';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connectDB();
  const config = JSON.parse(JSON.stringify(await Config.findOne({ key: "mainConfig" }).lean()));
  const maintenance = config?.maintenance || false;

  if (maintenance) {
    return (
      <div className="min-h-screen bg-[#06060a] flex flex-col items-center justify-center text-white p-8 text-center">
        <Settings className="w-24 h-24 text-[#9155fd] animate-spin mb-8 shadow-[0_0_30px_rgba(145,85,253,0.5)] rounded-full" style={{ animationDuration: '3s' }} />
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-neon-glow">Sistem Bakımda</h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">
          Şu anda size daha iyi hizmet verebilmek için büyük çaplı bir güncelleme yapıyoruz. 
          Sistemimiz kısa süre içerisinde çok daha güçlü bir şekilde geri dönecektir.
        </p>
        <div className="mt-8 text-[#5579fd] font-bold text-glow">BS+ Reborn Edition</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060a] text-white flex">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-20 transition-all duration-300 min-w-0">
        {children}
      </main>
    </div>
  );
}
