import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/lib/models';
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

    await connectDB();
    const user = await User.findOne({ id: payload.userId }).lean();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ 
      user: { 
        username: user.username, 
        package: user.package
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

    const { username, password, currentPassword } = await req.json();
    await connectDB();
    const user = await User.findOne({ id: payload.userId });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!currentPassword) {
      return NextResponse.json({ error: 'Mevcut şifreniz gereklidir.' }, { status: 400 });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Mevcut şifreniz yanlış.' }, { status: 400 });
    }

    const updates: any = {};

    // Update username if provided and unique
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username }).lean();
      if (existingUser) {
        return NextResponse.json({ error: 'Bu kullanıcı adı zaten alınmış.' }, { status: 400 });
      }
      updates.username = username;
    }

    // Update password if provided
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
      updates.plainPassword = password;
    }

    if (Object.keys(updates).length > 0) {
      await User.findOneAndUpdate({ id: payload.userId }, { $set: updates });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
