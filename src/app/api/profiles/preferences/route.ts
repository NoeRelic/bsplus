import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Profile } from '@/lib/models';
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

    const { audio, subtitle, subColor, subSize } = await req.json(); 
    
    await connectDB();
    const profile = await Profile.findOne({ id: profileId, userId: payload.userId });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    if (!profile.preferences) {
      profile.preferences = {};
    }

    if (audio !== undefined) profile.preferences.audio = audio;
    if (subtitle !== undefined) profile.preferences.subtitle = subtitle;
    if (subColor !== undefined) profile.preferences.subColor = subColor;
    if (subSize !== undefined) profile.preferences.subSize = subSize;

    await profile.save();
    return NextResponse.json({ success: true, preferences: profile.preferences });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
