import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected internal routes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/campaigns',
  '/automations',
  '/contacts',
  '/settings',
  '/setup',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('pf_auth');
  const isAuthenticated = authCookie?.value === 'authenticated';

  // Check if current path starts with any protected prefix
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // If requesting a protected route and not authenticated -> redirect to login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to visit login page -> redirect to dashboard
  if (pathname === '/auth/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
