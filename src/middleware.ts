import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes accessible without authentication
const PUBLIC_PAGE_PREFIXES = [
  '/',
  '/about',
  '/products',
  '/solutions',
  '/integrations',
  '/pricing',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
  '/data-deletion',
  '/auth/login',
  '/auth/signup',
  '/admin/login',
];

// Public API endpoints that must accept unauthenticated requests (webhooks, health checks, public callbacks)
const PUBLIC_API_PREFIXES = [
  '/api/webhook/whatsapp',
  '/api/webhooks/meta',
  '/api/webhooks/shopify',
  '/api/webhooks/woocommerce',
  '/api/meta/data-deletion',
  '/api/health',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/me',
  '/api/auth/google',
  '/api/auth/request-access',
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
  '/analytics',
];

// Workspace API routes that perform Meta messaging or data mutations
const WORKSPACE_API_PREFIXES = [
  '/api/messages',
  '/api/campaigns',
  '/api/catalog',
  '/api/automations',
  '/api/contacts',
  '/api/settings',
  '/api/meta/stats',
  '/api/meta/oauth',
  '/api/meta/connection',
  '/api/meta/diagnostics',
  '/api/media',
  '/api/test-flow',
  '/api/ecommerce',
  '/api/integrations',
];

/**
 * Edge-safe URL redirect constructor
 */
function createEdgeRedirect(path: string, request: NextRequest, redirectParam?: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = '';
  if (redirectParam) {
    url.searchParams.set('redirect', redirectParam);
  }
  return NextResponse.redirect(url);
}

/**
 * Edge-safe lightweight JWT decoder
 */
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payloadStr.length % 4) payloadStr += '=';
    const json = atob(payloadStr);
    const payload = JSON.parse(json);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// In-memory sliding window IP rate limiter (Defense-in-depth protection)
const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    ipRateMap.set(ip, { count: 1, resetAt: now + windowMs });
    if (ipRateMap.size > 10000) {
      const iter = ipRateMap.keys();
      for (let i = 0; i < 2000; i++) ipRateMap.delete(iter.next().value!);
    }
    return false;
  }
  if (entry.count >= limit) {
    return true;
  }
  entry.count++;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  // Rate Limiting Protection for sensitive auth & public ingestion endpoints
  if (pathname === '/api/auth/login' || pathname === '/api/auth/signup') {
    if (isRateLimited(`auth_${clientIp}`, 30, 60000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 60 seconds.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  if (pathname === '/api/leads') {
    if (isRateLimited(`leads_${clientIp}`, 120, 60000)) {
      return NextResponse.json(
        { error: 'Lead ingestion rate limit exceeded. Please wait.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // Resolve session token from Cookie or Authorization: Bearer header
  let sessionToken = request.cookies.get('pf_session_token')?.value;
  if (!sessionToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    }
  }
  const decodedSession = sessionToken ? decodeJwtPayload(sessionToken) : null;

  const authCookie = request.cookies.get('pf_auth');
  const roleCookie = request.cookies.get('pf_role');
  const statusCookie = request.cookies.get('pf_status');

  const isAuthenticated = Boolean(decodedSession || authCookie?.value === 'authenticated');
  const role = decodedSession?.role || roleCookie?.value || 'employee';
  const status = decodedSession?.status || statusCookie?.value || (isAuthenticated && (role === 'super_admin' || role === 'owner') ? 'approved' : 'pending_approval');

  // 1. Backward compatibility & Route Aliasing
  if (pathname === '/welcome' || pathname.startsWith('/welcome/') || pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
    return createEdgeRedirect('/pending', request);
  }
  if (pathname === '/super-admin' || pathname.startsWith('/super-admin/')) {
    return createEdgeRedirect('/admin', request);
  }

  // 2. Allow public APIs unconditionally
  if (PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // 3. Allow public pages if matched exactly
  const isPublicPage = PUBLIC_PAGE_PREFIXES.some((p) => pathname === p || (p !== '/' && pathname.startsWith(`${p}/`)));
  if (isPublicPage && !pathname.startsWith('/admin') && !pathname.startsWith('/dashboard')) {
    // If authenticated user visits login/signup, auto-redirect to destination
    if ((pathname === '/auth/login' || pathname === '/auth/signup') && isAuthenticated) {
      if (role === 'super_admin') {
        return createEdgeRedirect('/admin', request);
      }
      return createEdgeRedirect(status === 'approved' ? '/dashboard' : '/pending', request);
    }
    return NextResponse.next();
  }

  // 4. Super Admin Route Protection (/admin, /super-admin-control and /api/super-admin/*)
  const isSuperAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/super-admin-control' || pathname.startsWith('/super-admin-control/');
  const isSuperAdminApi = pathname.startsWith('/api/super-admin');

  if (isSuperAdminRoute || isSuperAdminApi) {
    if (!isAuthenticated) {
      if (isSuperAdminApi) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
      }
      return createEdgeRedirect('/auth/login', request, '/admin');
    }
    if (role !== 'super_admin' && role !== 'owner') {
      if (isSuperAdminApi) {
        return NextResponse.json({ error: 'Forbidden: Super Admin privileges required.' }, { status: 403 });
      }
      return createEdgeRedirect(status === 'approved' ? '/dashboard' : '/pending', request);
    }
    return NextResponse.next();
  }

  // 5. Pending Approval Route (/pending)
  if (pathname === '/pending') {
    if (!isAuthenticated) {
      return createEdgeRedirect('/auth/login', request);
    }
    if (status === 'approved') {
      return createEdgeRedirect('/dashboard', request);
    }
    return NextResponse.next();
  }

  // 6. Workspace API Protection
  const isWorkspaceApi = WORKSPACE_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isWorkspaceApi) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 });
    }
    if (status !== 'approved' && role !== 'super_admin' && role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Workspace access requires account approval.' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 7. Workspace UI Pages Protection (/dashboard, /inbox, /campaigns, etc.)
  const isWorkspacePage = WORKSPACE_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isWorkspacePage) {
    if (!isAuthenticated) {
      return createEdgeRedirect('/auth/login', request, pathname);
    }
    if (status !== 'approved' && role !== 'super_admin' && role !== 'owner') {
      return createEdgeRedirect('/pending', request);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
