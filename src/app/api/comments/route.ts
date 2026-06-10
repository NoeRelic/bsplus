import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Comment, Profile } from '@/lib/models';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get('mediaId');
    if (!mediaId) return NextResponse.json({ error: 'Media ID required' }, { status: 400 });

    await connectDB();
    const comments = await Comment.find({ mediaId, status: 'approved' }).lean();
    
    return NextResponse.json({ comments });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const profileId = cookieStore.get('profileId')?.value;

    if (!token || !profileId) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
    }

    await connectDB();
    const profile = await Profile.findOne({ id: profileId, userId: payload.userId }).lean();
    
    if (!profile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
    }

    const { mediaId, content, rating } = await req.json();

    if (!mediaId || !content || !rating) {
      return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 });
    }

    await Comment.create({
      id: crypto.randomUUID(),
      mediaId,
      profileId: profile.id,
      profileName: profile.name,
      profileAvatar: profile.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      content,
      rating: Number(rating),
      status: 'pending', // Requires admin approval
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: 'Yorumunuz alındı, yönetici onayından sonra yayınlanacaktır.' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
