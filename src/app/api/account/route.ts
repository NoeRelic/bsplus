import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await readDB();
    const user = db.users.find(u => u.id === payload.userId);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ 
      user: { 
        username: user.username, 
        package: user.package,
        twoFactorEnabled: user.twoFactorEnabled 
      } 
    });
  } catch (err) {
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

    const { username, password, twoFactorEnabled } = await req.json();
    const db = await readDB();
    const userIndex = db.users.findIndex(u => u.id === payload.userId);

    if (userIndex === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Update username if provided and unique
    if (username && username !== db.users[userIndex].username) {
      if (db.users.find(u => u.username === username)) {
        return NextResponse.json({ error: 'Bu kullanıcı adı zaten alınmış.' }, { status: 400 });
      }
      db.users[userIndex].username = username;
    }

    // Update password if provided
    if (password) {
      db.users[userIndex].passwordHash = await bcrypt.hash(password, 10);
      // Optional: Update plainPassword too if you want admin to see it, but usually user changes it privately
      db.users[userIndex].plainPassword = password;
    }

    // Update 2FA
    if (twoFactorEnabled !== undefined) {
      db.users[userIndex].twoFactorEnabled = twoFactorEnabled;
    }

    await writeDB(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
