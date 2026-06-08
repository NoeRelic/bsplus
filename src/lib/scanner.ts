import { readDB, writeDB } from './db';

export async function startBackgroundScan() {
  try {
    const db = await readDB();
    const movies = db.movies || [];
    let updated = false;

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i] as any;
      if (!movie.isM3U) continue;
      if (!movie.videoUrl.toLowerCase().includes('.m3u8')) continue;
      if (movie.videoUrlEN) continue; // Zaten taranmış

      try {
        const res = await fetch(movie.videoUrl, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) continue;
        const text = await res.text();
        const lines = text.split('\n');

        let foundDub = false;
        for (const line of lines) {
          if (line.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
            const nameMatch = line.match(/NAME="([^"]+)"/i);
            const uriMatch = line.match(/URI="([^"]+)"/i);
            
            if (nameMatch && uriMatch) {
              const name = nameMatch[1].toLowerCase();
              if (name.includes('eng') || name.includes('ingilizce') || name.includes('orijinal') || name.includes('original')) {
                const base = movie.videoUrl.substring(0, movie.videoUrl.lastIndexOf('/') + 1);
                const absoluteUri = uriMatch[1].startsWith('http') ? uriMatch[1] : base + uriMatch[1];
                movie.videoUrlEN = absoluteUri;
                foundDub = true;
                updated = true;
                break;
              }
            }
          }
        }
      } catch (err) {
        // timeout or error, skip
      }
    }

    if (updated) {
      await writeDB(db);
      console.log('Background scanner finished updating dubs!');
    }
  } catch (e) {
    console.error('Background scan error:', e);
  }
}
