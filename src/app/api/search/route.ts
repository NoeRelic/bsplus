import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Movie, Series } from '@/lib/models';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  await connectDB();
  const query = q.toLowerCase();

  const movies = await Movie.find({ title: { $regex: new RegExp(query, 'i') } }).lean();
  const series = await Series.find({ title: { $regex: new RegExp(query, 'i') } }).lean();

  const moviesWithMeta = movies.map((m: any) => ({ ...m, mediaType: 'movie' }));
  const seriesWithMeta = series.map((s: any) => ({ ...s, mediaType: 'series' }));

  const results = [...moviesWithMeta, ...seriesWithMeta].slice(0, 5); // Return top 5

  return NextResponse.json({ results });
}
