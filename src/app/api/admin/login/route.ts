import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (token === 'b.batin123') {
      const response = NextResponse.json({ success: true });
      response.cookies.set('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      return response;
    } else {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
