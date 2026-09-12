import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected core workspace routes that require approved access
const WORKSPACE_PREFIXES = [
  '/dashboard',
  '/inbox',
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
  const roleCookie = request.cookies.get('pf_role');
  const statusCookie = request.cookies.get('pf_status');

  const isAuthenticated = authCookie?.value === 'authenticated';
  const role = roleCookie?.value || 'user';
  // Default legacy sessions to approved for backward compatibility
  const status = statusCookie?.value || (isAuthenticated && role === 'super_admin' ? 'approved' : 'unrequested');

  // 1. Super Admin hidden route guard
  if (pathname === '/super-admin' || pathname.startsWith('/super-admin/')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'super_admin') {
      // Non-super-admins are barred from /super-admin
      return NextResponse.redirect(new URL(status === 'approved' ? '/dashboard' : '/welcome', request.url));
    }
    return NextResponse.next();
  }

  // 2. The "Welcome" / "Request Access" route
  if (pathname === '/welcome') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    if (status === 'approved') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 3. Core Workspace Routes Protection
  const isWorkspaceRoute = WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isWorkspaceRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Gated state: if not approved, send to Request Access page
    if (status !== 'approved') {
      return NextResponse.redirect(new URL('/welcome', request.url));
    }
    return NextResponse.next();
  }

  // 4. If already logged in and approved, redirect away from login/signup
  if ((pathname === '/auth/login' || pathname === '/auth/signup') && isAuthenticated) {
    if (status === 'approved') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/welcome', request.url));
    }
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
