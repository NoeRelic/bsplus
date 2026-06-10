import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('adminToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');
    const type = searchParams.get('type') || 'movie';

    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    let bannerUrl = '';

    if (type === 'movie') {
      // Use OMDB API for movies
      const res = await fetch(`https://www.omdbapi.com/?apikey=thewdb&t=${encodeURIComponent(title)}`);
      const data = await res.json();
      if (data.Response === 'True' && data.Poster && data.Poster !== 'N/A') {
        bannerUrl = data.Poster;
      }
    } else {
      // Use TVMaze API for series
      const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`);
      const data = await res.json();
      if (data && data.length > 0 && data[0].show && data[0].show.image && data[0].show.image.original) {
        bannerUrl = data[0].show.image.original;
      }
    }

    if (bannerUrl) {
      return NextResponse.json({ url: bannerUrl });
    } else {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
