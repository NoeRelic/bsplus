import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Profile, User } from '@/lib/models';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const userProfiles = await Profile.find({ userId: payload.userId }).lean();
    const user = await User.findOne({ id: payload.userId }).lean();

    return NextResponse.json({ profiles: userProfiles, package: user?.package || 'Iron' });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, avatarUrl, pin } = await req.json();

    if (!name || !avatarUrl) {
      return NextResponse.json({ error: 'Name and Avatar are required' }, { status: 400 });
    }

    await connectDB();
    const userProfiles = await Profile.find({ userId: payload.userId }).lean();

    if (userProfiles.length >= 5) {
      return NextResponse.json({ error: 'Maksimum 5 profil oluşturabilirsiniz.' }, { status: 400 });
    }

    const newProfile = {
      id: crypto.randomUUID(),
      userId: payload.userId as string,
      name,
      avatarUrl,
      pin: pin || undefined
    };

    await Profile.create(newProfile);

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
