import { readDB, getDailyGoldSeries } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import Link from 'next/link';
import FilterableContentGrid from '@/components/FilterableContentGrid';

export default async function SeriesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? await verifyToken(token) : null;
  const userPackage = payload?.package || 'Iron';

  if (userPackage === 'Iron') {
    return (
      <div className="px-8 md:px-16 pt-12 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl text-red-500 font-bold mb-4">Erişim Engellendi</h1>
        <p className="text-zinc-400 mb-6">Iron paket sahipleri dizilere erişemez. Dizileri izlemek için paketinizi yükseltin.</p>
        <Link href="/packages" className="bg-blue-600 text-white px-8 py-3 rounded-md font-bold hover:bg-blue-500">
          Paketleri İncele
        </Link>
      </div>
    );
  }

  const db = await readDB();
  let seriesList = db.series || [];

  if (userPackage === 'Gold') {
    const dailyIds = await getDailyGoldSeries(db);
    seriesList = seriesList.filter(s => dailyIds.includes(s.id));
  }

  return (
    <div className="px-8 md:px-16 pb-24">
      <h1 className="text-3xl font-bold mb-8">Diziler {userPackage === 'Gold' && <span className="text-sm bg-yellow-600 text-black px-2 py-1 rounded ml-2 align-middle">Günün Dizileri (Gold)</span>}</h1>
      
      {seriesList.length === 0 ? (
        <p className="text-zinc-500">Gösterilecek dizi bulunamadı.</p>
      ) : (
        <FilterableContentGrid items={seriesList} mediaType="series" />
      )}
    </div>
  );
}
