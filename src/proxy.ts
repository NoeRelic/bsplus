import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Suppress harmless ECONNRESET / aborted errors that happen when the
// browser closes a connection mid-response (e.g., during large imports).
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (err: any) => {
    if (err?.code === 'ECONNRESET' || err?.message === 'aborted') return;
    console.error('[uncaughtException]', err);
  });
  process.on('unhandledRejection', (reason: any) => {
    if (reason?.code === 'ECONNRESET' || reason?.message === 'aborted') return;
    console.error('[unhandledRejection]', reason);
  });
}

const PUBLIC_ROUTES = ['/login', '/packages', '/watch/live'];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore static assets, api routes (except maybe some?), and internal Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|svg|mp4|m3u8|ts)$/)
  ) {
    return NextResponse.next();
  }

  // Handle Admin Panel routing strictly
  if (pathname.startsWith('/admin')) {
    const adminToken = req.cookies.get('adminToken')?.value;
    if (pathname === '/admin/login') {
      if (adminToken === 'b.batin123') {
        return NextResponse.redirect(new URL('/admin/panel', req.url));
      }
      return NextResponse.next();
    }
    
    // For any other /admin routes, must have correct token
    if (adminToken !== 'b.batin123') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const token = req.cookies.get('token')?.value;

  if (!token) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // Verify JWT
  const payload = await verifyToken(token);
  
  if (!payload || payload.isBanned) {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('token');
    return response;
  }

  // Logged in user trying to access login page
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/profiles', req.url));
  }

  // Profile check for content pages
  // Content pages are any page that is not /login, /packages, /profiles
  const isContentRoute = !isPublicRoute && pathname !== '/profiles';
  const profileId = req.cookies.get('profileId')?.value;

  if (isContentRoute && !profileId) {
    return NextResponse.redirect(new URL('/profiles', req.url));
  }

  // Profile page: if already has profile selected, optionally we could let them in, but they can always change profile
  // Actually, if they are on /profiles, they are selecting a profile, so it's fine.

  // Package restrictions (Iron package can't access /series)
  if (pathname.startsWith('/series') && payload.package === 'Iron') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
