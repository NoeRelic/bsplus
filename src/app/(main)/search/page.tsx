import fs from 'fs';
import path from 'path';
import Link from 'next/link';

async function searchContent(query: string) {
  try {
    const dbPath = path.join(process.cwd(), 'database.json');
    const dbContent = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    const q = query.toLowerCase();

    const matches = [];

    // Search movies
    if (db.movies) {
      for (const m of db.movies) {
        if (m.title.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q))) {
          matches.push({ ...m, mediaType: 'movie' });
        }
      }
    }

    // Search series
    if (db.series) {
      for (const s of db.series) {
        if (s.title.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))) {
          matches.push({ ...s, mediaType: 'series' });
        }
      }
    }

    return matches;
  } catch (error) {
    console.error("Arama hatası:", error);
    return [];
  }
}

export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  const results = q ? await searchContent(q) : [];

  return (
    <div className="pt-32 px-8 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">
        "{q}" için arama sonuçları <span className="text-zinc-500 text-xl">({results.length} sonuç)</span>
      </h1>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {results.map((item: any) => (
              <Link 
              key={item.id} 
              href={item.mediaType === 'movie' ? `/watch/movie/${item.id}` : `/watch/episode/${item.id}`} // Or series page if you have one
              className="group relative rounded-lg overflow-hidden cursor-pointer"
            >
              <img 
                src={item.bannerUrl || item.posterUrl} 
                alt={item.title} 
                className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-white font-bold">{item.title}</h3>
                <span className="text-xs text-blue-400 font-bold mt-1 uppercase">
                  {item.mediaType === 'movie' ? 'Film' : 'Dizi'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-zinc-400 text-xl">Aramanıza uygun sonuç bulunamadı.</p>
          <p className="text-zinc-600 mt-2">Lütfen farklı bir kelimeyle tekrar deneyin.</p>
        </div>
      )}
    </div>
  );
}
