import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongoose';
import { User, Coupon } from '@/lib/models';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { code, username, password } = await req.json();

    if (!code || !username || !password) {
      return NextResponse.json({ error: 'Tüm alanları doldurun.' }, { status: 400 });
    }

    await connectDB();

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon || !coupon.active || coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş kupon kodu.' }, { status: 400 });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'Bu kullanıcı adı zaten alınmış.' }, { status: 400 });
    }

    // Calculate trial expiry
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + coupon.durationDays);

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      id: crypto.randomUUID(),
      username,
      passwordHash,
      plainPassword: password, // As per original design choice
      package: coupon.package,
      isTrial: true,
      trialExpiresAt: trialExpiresAt.toISOString(),
      createdAt: new Date().toISOString()
    });

    // Update coupon usage
    coupon.currentUses += 1;
    await coupon.save();

    const token = await signToken({ userId: newUser.id, package: newUser.package, isBanned: false });

    const response = NextResponse.json({ 
      success: true, 
      user: { id: newUser.id, username: newUser.username, package: newUser.package } 
    });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Coupon apply error:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
