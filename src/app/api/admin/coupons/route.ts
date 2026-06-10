import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Coupon } from '@/lib/models';
import crypto from 'crypto';

export async function GET() {
  try {
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, package: pkg, durationDays, maxUses } = body;

    if (!code || !durationDays || durationDays <= 0) {
      return NextResponse.json({ error: 'Geçersiz bilgiler.' }, { status: 400 });
    }

    await connectDB();
    
    // Check if exists
    const existing = await Coupon.findOne({ code });
    if (existing) {
      return NextResponse.json({ error: 'Bu kupon kodu zaten mevcut.' }, { status: 400 });
    }

    const newCoupon = {
      id: crypto.randomUUID(),
      code: code.toUpperCase(),
      package: pkg || 'Diamond',
      durationDays: Number(durationDays),
      maxUses: Number(maxUses) || 1,
      currentUses: 0,
      active: true,
      createdAt: new Date().toISOString()
    };

    await Coupon.create(newCoupon);
    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });
    }

    await connectDB();
    await Coupon.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
