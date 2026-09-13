import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthorizedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthorizedUser();

    if (!user) {
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('pf_auth')?.value;
      
      const unauthResponse = NextResponse.json({
        authenticated: false,
        user: null,
      });

      // Only clear cookies if pf_auth is not set or truly invalid
      if (!authCookie) {
        unauthResponse.cookies.set('pf_auth', '', { path: '/', maxAge: 0 });
        unauthResponse.cookies.set('pf_user_id', '', { path: '/', maxAge: 0 });
        unauthResponse.cookies.set('pf_status', '', { path: '/', maxAge: 0 });
        unauthResponse.cookies.set('pf_role', '', { path: '/', maxAge: 0 });
      }
      return unauthResponse;
    }

    const cookieStore = await cookies();
    const statusCookie = cookieStore.get('pf_status')?.value;

    const response = NextResponse.json({
      authenticated: true,
      user,
    });

    // Sync cookie if status was updated by Super Admin
    if (user.status !== statusCookie) {
      response.cookies.set('pf_status', user.status, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
