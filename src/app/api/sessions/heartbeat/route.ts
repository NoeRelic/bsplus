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

    // In a real Next.js app, IP can be extracted from req.headers.get('x-forwarded-for') or req.ip
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const db = await readDB();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

    // Clean up old sessions
    db.activeSessions = db.activeSessions.filter(s => new Date(s.lastActive) > fiveMinutesAgo);

    // Get active sessions for this user
    const userSessions = db.activeSessions.filter(s => s.userId === payload.userId);

    // Count distinct IPs
    const distinctIPs = new Set(userSessions.map(s => s.ipAddress));

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
    const existingSessionIndex = db.activeSessions.findIndex(s => s.profileId === profileId);
    if (existingSessionIndex > -1) {
      db.activeSessions[existingSessionIndex].lastActive = now.toISOString();
      db.activeSessions[existingSessionIndex].ipAddress = ipAddress;
    } else {
      db.activeSessions.push({
        userId: payload.userId as string,
        profileId,
        ipAddress,
        lastActive: now.toISOString(),
      });
    }

    await writeDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
