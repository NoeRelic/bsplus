import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const db = await readDB();
    const user = db.users.find(u => u.id === payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const profileId = cookieStore.get('profileId')?.value;
    const profile = db.profiles.find(p => p.id === profileId && p.userId === payload.userId);

    const allNotifications = db.notifications || [];
    const userPackage = user.package;

    const visibleNotifications = allNotifications.filter(n => {
      return !n.targetPackage || n.targetPackage === 'All' || n.targetPackage === userPackage;
    });

    const readIds = profile?.readNotifications || [];
    
    // Sort by created at descending
    visibleNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ notifications: visibleNotifications, readIds });
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
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { action, notificationId } = await req.json();
    const db = await readDB();

    const profileId = cookieStore.get('profileId')?.value;
    const profileIdx = db.profiles.findIndex(p => p.id === profileId && p.userId === payload.userId);

    if (profileIdx === -1) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    if (action === 'markRead') {
      if (!db.profiles[profileIdx].readNotifications) {
        db.profiles[profileIdx].readNotifications = [];
      }
      if (!db.profiles[profileIdx].readNotifications.includes(notificationId)) {
        db.profiles[profileIdx].readNotifications.push(notificationId);
        await writeDB(db);
      }
      return NextResponse.json({ success: true });
    }
    
    if (action === 'markAllRead') {
      const allNotifications = db.notifications || [];
      const user = db.users.find(u => u.id === payload.userId);
      const visibleIds = allNotifications.filter(n => !n.targetPackage || n.targetPackage === 'All' || n.targetPackage === user?.package).map(n => n.id);
      
      db.profiles[profileIdx].readNotifications = Array.from(new Set([...(db.profiles[profileIdx].readNotifications || []), ...visibleIds]));
      await writeDB(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
