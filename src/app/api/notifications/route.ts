import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { User, Profile, Notification } from '@/lib/models';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ id: payload.userId }).lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const profileId = cookieStore.get('profileId')?.value;
    const profile = await Profile.findOne({ id: profileId, userId: payload.userId }).lean();

    const allNotifications = await Notification.find().lean();
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
    await connectDB();

    const profileId = cookieStore.get('profileId')?.value;
    const profile = await Profile.findOne({ id: profileId, userId: payload.userId });

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    if (action === 'markRead') {
      if (!profile.readNotifications) {
        profile.readNotifications = [];
      }
      if (!profile.readNotifications.includes(notificationId)) {
        profile.readNotifications.push(notificationId);
        await profile.save();
      }
      return NextResponse.json({ success: true });
    }
    
    if (action === 'markAllRead') {
      const allNotifications = await Notification.find().lean();
      const user = await User.findOne({ id: payload.userId }).lean();
      const visibleIds = allNotifications.filter(n => !n.targetPackage || n.targetPackage === 'All' || n.targetPackage === user?.package).map(n => n.id);
      
      profile.readNotifications = Array.from(new Set([...(profile.readNotifications || []), ...visibleIds]));
      await profile.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
