import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes accessible without authentication
const PUBLIC_PAGE_PREFIXES = [
  '/',
  '/about',
  '/products',
  '/solutions',
  '/integrations',
  '/privacy-policy',
  '/terms-of-service',
  '/data-deletion',
  '/auth/login',
  '/auth/signup',
];

// Public API endpoints that must accept unauthenticated requests (webhooks, health checks, public callbacks)
const PUBLIC_API_PREFIXES = [
  '/api/webhook/whatsapp',
  '/api/webhooks/meta',
  '/api/meta/data-deletion',
  '/api/health',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/me',
];

// Workspace page routes that require approved status
const WORKSPACE_PAGES = [
  '/dashboard',
  '/inbox',
  '/campaigns',
  '/automations',
  '/contacts',
  '/settings',
  '/setup',
];

// Workspace API routes that perform Meta messaging or data mutations
const WORKSPACE_API_PREFIXES = [
  '/api/messages',
  '/api/campaigns',
  '/api/automations',
  '/api/contacts',
  '/api/settings',
  '/api/meta/stats',
  '/api/meta/oauth',
  '/api/test-flow',
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

  // 2. Allow public APIs unconditionally
  if (PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // 3. Super Admin Route Protection (/super-admin-control and /api/super-admin/*)
  const isSuperAdminRoute = pathname === '/super-admin-control' || pathname.startsWith('/super-admin-control/');
  const isSuperAdminApi = pathname.startsWith('/api/super-admin');

  if (isSuperAdminRoute || isSuperAdminApi) {
    if (!isAuthenticated) {
      if (isSuperAdminApi) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
      }
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', '/super-admin-control');
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'super_admin') {
      if (isSuperAdminApi) {
        return NextResponse.json({ error: 'Forbidden: Super Admin privileges required.' }, { status: 403 });
      }
      return NextResponse.redirect(new URL(status === 'approved' ? '/dashboard' : '/onboarding', request.url));
    }
    return NextResponse.next();
  }

  // 4. Workspace API Protection (Block all Meta and messaging actions if not approved)
  const isWorkspaceApi = WORKSPACE_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isWorkspaceApi) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }
    if (status !== 'approved') {
      return NextResponse.json(
        { error: 'Forbidden: Workspace access and Meta actions require approved status.' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 5. Onboarding Route (/onboarding)
  if (pathname === '/onboarding') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // If already approved, route straight to dashboard
    if (status === 'approved') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 6. Workspace UI Protection (/dashboard, /inbox, /campaigns, etc.)
  const isWorkspacePage = WORKSPACE_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isWorkspacePage) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (status !== 'approved') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.next();
  }

  // 7. Auth Pages (/auth/login, /auth/signup) - auto-forward if already authenticated
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
     * - public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
