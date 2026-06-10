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

    const { videoId, type, time, duration } = await req.json(); 
    
    await connectDB();
    const profile = await Profile.findOne({ id: profileId, userId: payload.userId });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    if (!profile.progress) profile.progress = [];

    const existingIndex = profile.progress.findIndex((p: any) => p.videoId === videoId);
    if (existingIndex > -1) {
      profile.progress[existingIndex].time = time;
      if (duration) profile.progress[existingIndex].duration = duration;
      profile.progress[existingIndex].lastWatched = new Date().toISOString();
    } else {
      profile.progress.push({
        videoId,
        type,
        time,
        duration,
        lastWatched: new Date().toISOString()
      });
    }

    profile.markModified('progress');
    await profile.save();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
