import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const db = await readDB();
  const query = q.toLowerCase();

  const movies = (db.movies || []).filter((m: any) => m.title.toLowerCase().includes(query)).map((m: any) => ({ ...m, mediaType: 'movie' }));
  const series = (db.series || []).filter((s: any) => s.title.toLowerCase().includes(query)).map((s: any) => ({ ...s, mediaType: 'series' }));

  const results = [...movies, ...series].slice(0, 5); // Return top 5

  return NextResponse.json({ results });
}
