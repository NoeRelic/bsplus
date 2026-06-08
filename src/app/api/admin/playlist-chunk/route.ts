import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { parseSeriesTitle } from '@/lib/series-parser';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('adminToken')?.value;
    if (adminToken !== 'b.batin123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, items } = await req.json();
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const db = await readDB();
    if (!db.series) db.series = [];
    if (!db.episodes) db.episodes = [];

    let movieCount = 0;
    let seriesCount = 0;

    for (const item of items) {
      const currentTitle = item.title?.trim() ?? '';
      const currentBanner = item.bannerUrl;
      const currentCategory = item.category ?? '';
      const videoUrl = item.videoUrl;

      // ── Determine if this is a series entry ──────────────────────────────
      let isSeries = false;

      if (category === 'auto') {
        const groupLower = currentCategory.toLowerCase();
        const titleLower = currentTitle.toLowerCase();
        isSeries =
          groupLower.includes('dizi') || groupLower.includes('series') || groupLower.includes('sezon') ||
          titleLower.includes('dizi') || titleLower.includes('sezon') || titleLower.includes('bölüm') ||
          titleLower.includes('bolum') || /s\d+e\d+/i.test(currentTitle) ||
          /\d+\s*\.?\s*s(?:ezon)?\b/i.test(currentTitle);
      } else {
        isSeries = (category === 'series');
      }

      if (!isSeries) {
        // ── Movie ────────────────────────────────────────────────────────────
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
        continue;
      }

      // ── Parse the raw title into structured info ─────────────────────────
      const parsed = parseSeriesTitle(currentTitle);
      const seriesTitle = parsed.seriesTitle || (currentCategory ? `Dizi (${currentCategory})` : currentTitle);

      // Skip entries that are season headers with no episode marker and no video
      // (they appear as duplicate "parent" rows in some M3U files)
      if (!parsed.hasEpisodeMarker && !videoUrl) {
        continue;
      }

      // ── Find or create the series ─────────────────────────────────────────
      let existingSeries = db.series.find(
        (s: any) => s.title.toLowerCase() === seriesTitle.toLowerCase()
      );
      let seriesId: string;

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

      // ── Add the episode ───────────────────────────────────────────────────
      db.episodes.push({
        id: crypto.randomUUID(),
        seriesId,
        seasonNumber: parsed.seasonNumber,
        episodeNumber: parsed.episodeNumber,
        title: currentTitle,
        videoUrl,
      });
    }

    await writeDB(db);

    // Background scan for metadata
    import('@/lib/scanner').then(m => m.startBackgroundScan()).catch(console.error);

    return NextResponse.json({ success: true, message: `Chunk processed. Added ${movieCount} movies, ${seriesCount} new series.` });
  } catch (err: any) {
    console.error('Playlist Chunk Import Error:', err);
    return NextResponse.json({ error: 'Server error', detail: err?.message }, { status: 500 });
  }
}
