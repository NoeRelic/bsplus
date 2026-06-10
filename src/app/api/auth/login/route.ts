import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ username }).lean();
    
    if (!user) {
      return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Hesabınız platformdan yasaklanmıştır.' }, { status: 403 });
    }

    if (user.isTrial && user.trialExpiresAt) {
      const expiresAt = new Date(user.trialExpiresAt);
      if (expiresAt < new Date()) {
        // Trial expired. Delete user account and profiles.
        await User.deleteOne({ id: user.id });
        const { Profile, ActiveSession } = require('@/lib/models');
        await Profile?.deleteMany({ userId: user.id });
        await ActiveSession?.deleteMany({ userId: user.id });
        return NextResponse.json({ error: 'Ücretsiz deneme süreniz dolmuştur, hesabınız silindi.' }, { status: 403 });
      }
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
    }

    // Sign the token
    const token = await signToken({ userId: user.id, package: user.package, isBanned: user.isBanned });
    
    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, username: user.username, package: user.package } 
    });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
