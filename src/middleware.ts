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
  const status = statusCookie?.value || (isAuthenticated && role === 'super_admin' ? 'approved' : 'new_user');

  // 1. Backward compatibility redirects
  if (pathname === '/welcome' || pathname.startsWith('/welcome/')) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }
  if (pathname === '/super-admin' || pathname.startsWith('/super-admin/')) {
    return NextResponse.redirect(new URL('/super-admin-control', request.url));
  }

  // 2. Isolated Super Admin route guard: /super-admin-control
  if (pathname === '/super-admin-control' || pathname.startsWith('/super-admin-control/')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', '/super-admin-control');
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'super_admin') {
      // Normal users cannot access this page. Redirect back to dashboard or onboarding.
      return NextResponse.redirect(new URL(status === 'approved' ? '/dashboard' : '/onboarding', request.url));
    }
    return NextResponse.next();
  }

  // 3. The "Onboarding" / "Request Access" route: /onboarding
  if (pathname === '/onboarding') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    if (status === 'approved') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 4. Core Workspace Routes Protection
  const isWorkspaceRoute = WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isWorkspaceRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Gated state: if not approved (new_user, pending_approval, rejected), route to onboarding
    if (status !== 'approved') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.next();
  }

  // 5. If already logged in and viewing login/signup, route accordingly
  if ((pathname === '/auth/login' || pathname === '/auth/signup') && isAuthenticated) {
    if (status === 'approved') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/onboarding', request.url));
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
