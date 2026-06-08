import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    if (adminToken !== 'b.batin123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const category = formData.get('category') as string; // 'movie' | 'series' | 'live'
    
    const db = await readDB();

    if (category === 'live') {
      const url = formData.get('url') as string;
      const name = formData.get('name') as string || 'Canlı Yayın Listesi';
      if (!url) return NextResponse.json({ error: 'Live TV için URL zorunludur' }, { status: 400 });
      
      if (!db.livePlaylists) db.livePlaylists = [];
      db.livePlaylists.push({
        id: crypto.randomUUID(),
        name,
        url
      });
      await writeDB(db);
      return NextResponse.json({ success: true, message: 'Live TV playlist başarıyla eklendi.' });
    }

    // For movies/series, read the uploaded file
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Film/Dizi için M3U dosyası zorunludur' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);
    
    let movieCount = 0;
    let seriesCount = 0;
    let currentTitle = '';
    let currentBanner = '';
    let currentCategory = '';

    for (const line of lines) {
      const l = line.trim();
      if (!l) continue;
      
      if (l.startsWith('#EXTINF:')) {
        const commaIdx = l.lastIndexOf(',');
        if (commaIdx > -1) {
          currentTitle = l.substring(commaIdx + 1).trim();
        } else {
          currentTitle = 'İsimsiz İçerik';
        }
        
        const logoMatch = l.match(/tvg-logo="([^"]+)"/);
        currentBanner = logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80';

        const groupMatch = l.match(/group-title="([^"]+)"/);
        currentCategory = groupMatch ? groupMatch[1].trim() : '';
      } 
      else if (!l.startsWith('#')) {
        const videoUrl = l;
        
        // Smart Auto Detect Logic
        let isSeries = false;
        let seriesTitle = currentTitle;
        let seasonNumber = 1;
        let episodeNumber = 1;

        if (category === 'auto') {
          const groupLower = currentCategory.toLowerCase();
          const titleLower = currentTitle.toLowerCase();
          
          if (groupLower.includes('dizi') || groupLower.includes('series') || groupLower.includes('sezon')) {
            isSeries = true;
          }
          
          // Regex to catch "Breaking Bad S01 E05" or "Breaking Bad S1E5" or "S01E05"
          const seMatch = currentTitle.match(/(.*?)\s*S(\d+)\s*E(\d+)/i) || currentTitle.match(/(.*?)\s*Sezon\s*(\d+)\s*Bölüm\s*(\d+)/i);
          if (seMatch) {
            isSeries = true;
            seriesTitle = seMatch[1] ? seMatch[1].trim() : currentTitle;
            seasonNumber = parseInt(seMatch[2], 10);
            episodeNumber = parseInt(seMatch[3], 10);
            if (!seriesTitle) seriesTitle = `Dizi (${currentCategory})`;
          } else if (isSeries) {
            // Extract ep number if possible, e.g. "Bolum 5"
            const epMatch = currentTitle.match(/Bölüm\s*(\d+)/i) || currentTitle.match(/Bolum\s*(\d+)/i);
            if (epMatch) episodeNumber = parseInt(epMatch[1], 10);
          }
        } else {
          isSeries = (category === 'series');
        }

        if (!isSeries) {
          db.movies.push({
            id: crypto.randomUUID(),
            title: currentTitle,
            type: 'Film',
            story: '',
            isM3U: true,
            bannerUrl: currentBanner,
            videoUrl: videoUrl,
            categories: currentCategory ? [currentCategory] : [],
          });
          movieCount++;
        } else {
          // Series Logic: Find existing series or create new
          if (!db.series) db.series = [];
          if (!db.episodes) db.episodes = [];
          
          let existingSeries = db.series.find(s => s.title.toLowerCase() === seriesTitle.toLowerCase());
          let seriesId = '';
          
          if (existingSeries) {
            seriesId = existingSeries.id;
          } else {
            seriesId = crypto.randomUUID();
            db.series.push({
              id: seriesId,
              title: seriesTitle,
              story: '',
              isM3U: true,
              bannerUrl: currentBanner,
              categories: currentCategory ? [currentCategory] : [],
            });
            seriesCount++;
          }
          
          db.episodes.push({
            id: crypto.randomUUID(),
            seriesId: seriesId,
            seasonNumber: seasonNumber,
            episodeNumber: episodeNumber,
            title: currentTitle, // Orijinal adı
            videoUrl: videoUrl
          });
        }
        
        // Reset
        currentTitle = '';
        currentBanner = '';
      }
    }

    await writeDB(db);
    
    // Background scanner'ı ateşle
    import('@/lib/scanner').then(m => m.startBackgroundScan()).catch(console.error);

    return NextResponse.json({ success: true, message: `${movieCount} Film ve ${seriesCount} Dizi başarıyla aktarıldı. Dublaj taraması arka planda başladı.` });

  } catch (err: any) {
    console.error('Playlist Import Error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
