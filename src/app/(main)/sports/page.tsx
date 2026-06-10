import { connectDB } from '@/lib/mongoose';
import { SportsChannel } from '@/lib/models';
import Link from 'next/link';
import { Play } from 'lucide-react';

export default async function SportsPage() {
  await connectDB();
  const channels = JSON.parse(JSON.stringify(await SportsChannel.find().lean())) || [];

  return (
    <div className="pt-24 px-8 min-h-screen bg-black text-white pb-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          Canlı Spor Kanalları 
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse font-medium">LIVE</span>
        </h1>
        <p className="text-zinc-400 mb-10 text-lg">Favori maçlarınızı ve spor müsabakalarını canlı takip edin.</p>

        {channels.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-xl">Şu an aktif spor kanalı bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {channels.map((channel: any) => (
              <Link key={channel.id} href={`/sports/${channel.id}`} className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 transition-all duration-300 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-1 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-24 h-24 rounded-full bg-white p-2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-contain" />
                </div>
                <h3 className="font-bold text-lg text-zinc-200 group-hover:text-white transition-colors">{channel.name}</h3>
                
                <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-16 h-16 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
