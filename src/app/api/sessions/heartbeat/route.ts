import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { ActiveSession } from '@/lib/models';
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

    // In a real Next.js app, IP can be extracted from req.headers.get('x-forwarded-for') or req.ip
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    await connectDB();
    
    // Check trial expiration
    const { User, Profile, ActiveSession } = require('@/lib/models');
    const user = await User.findOne({ id: payload.userId }).lean();
    if (user && user.isTrial && user.trialExpiresAt) {
      const expiresAt = new Date(user.trialExpiresAt);
      if (expiresAt < new Date()) {
        await User.deleteOne({ id: user.id });
        await Profile.deleteMany({ userId: user.id });
        await ActiveSession.deleteMany({ userId: user.id });
        return NextResponse.json({ error: 'EXPIRED', message: 'Ücretsiz deneme süreniz dolmuştur, hesabınız silindi.' }, { status: 403 });
      }
    }

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

    // Clean up old sessions
    await ActiveSession.deleteMany({ lastActive: { $lt: fiveMinutesAgo.toISOString() } });

    // Get active sessions for this user
    const userSessions = await ActiveSession.find({ userId: payload.userId }).lean();

    // Count distinct IPs
    const distinctIPs = new Set(userSessions.map((s: any) => s.ipAddress));

    // Determine limits
    let limit = 1;
    if (payload.package === 'Gold') limit = 2;
    if (payload.package === 'Diamond') limit = 10;

    // Check if new IP and limits
    if (!distinctIPs.has(ipAddress) && distinctIPs.size >= limit) {
      return NextResponse.json({ 
        error: 'LIMIT_REACHED', 
        message: 'Şu Profil Şu Diziyi İzliyor. Aynı Anda İzlemek İstiyorsanız Paketinizi Yükseltin.' 
      }, { status: 403 });
    }

    // Update or create session for this profile
    const existingSession = await ActiveSession.findOne({ profileId });
    if (existingSession) {
      existingSession.lastActive = now.toISOString();
      existingSession.ipAddress = ipAddress;
      await existingSession.save();
    } else {
      await ActiveSession.create({
        userId: payload.userId as string,
        profileId,
        ipAddress,
        lastActive: now.toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
