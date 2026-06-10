import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Profile } from '@/lib/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { profileId, pin } = await req.json();
    if (!profileId) return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });

    await connectDB();
    const profile = await Profile.findOne({ id: profileId, userId: payload.userId }).lean();

    if (!profile) {
      return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 });
    }

    if (profile.pin && profile.pin !== pin) {
      return NextResponse.json({ error: 'Hatalı PIN' }, { status: 403 });
    }

    const response = NextResponse.json({ success: true, profile });
    
    // Set profile cookie
    response.cookies.set('profileId', profile.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
