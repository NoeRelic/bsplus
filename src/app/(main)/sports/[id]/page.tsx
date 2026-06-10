import { connectDB } from '@/lib/mongoose';
import { SportsChannel } from '@/lib/models';
import SportsPlayer from '@/components/SportsPlayer';
import Link from 'next/link';

export default async function SportsChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const channel = JSON.parse(JSON.stringify(await SportsChannel.findOne({ id }).lean()));

  if (!channel) {
    return (
      <div className="pt-32 px-8 min-h-screen bg-black text-center text-white">
        <h1 className="text-3xl font-bold mb-4">Kanal Bulunamadı</h1>
        <p className="text-zinc-500 mb-8">Aradığınız spor kanalı bulunamadı veya silinmiş olabilir.</p>
        <Link href="/sports" className="text-blue-500 hover:underline">Spor Kanallarına Dön</Link>
      </div>
    );
  }

  // Need to pass a plain object to the Client Component
  const channelData = {
    name: channel.name,
    logoUrl: channel.logoUrl,
    streamUrl: channel.streamUrl
  };

  return (
    <div className="bg-black min-h-screen">
      <SportsPlayer channel={channelData} />
    </div>
  );
}
