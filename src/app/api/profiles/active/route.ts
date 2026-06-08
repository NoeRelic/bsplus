import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const profileId = cookieStore.get('profileId')?.value;
    
    if (!token || !profileId) return NextResponse.json({ error: 'Not selected' }, { status: 400 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await readDB();
    const profile = db.profiles.find(p => p.id === profileId && p.userId === payload.userId);

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
