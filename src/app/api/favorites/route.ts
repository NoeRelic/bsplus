import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const profileId = cookieStore.get('profileId')?.value;
    
    if (!token || !profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, type } = await req.json(); // id of movie/series, type: 'movie' | 'series'
    
    const db = await readDB();
    const profile = db.profiles.find(p => p.id === profileId && p.userId === payload.userId);
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    if (!profile.favorites) profile.favorites = [];

    const existingIndex = profile.favorites.findIndex(f => f.id === id);
    if (existingIndex > -1) {
      // Remove from favorites
      profile.favorites.splice(existingIndex, 1);
    } else {
      // Add to favorites
      profile.favorites.push({ id, type });
    }

    await writeDB(db);
    return NextResponse.json({ success: true, isFavorite: existingIndex === -1 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
