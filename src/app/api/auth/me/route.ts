import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UsersDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('pf_user_id')?.value;
    const statusCookie = cookieStore.get('pf_status')?.value;
    const roleCookie = cookieStore.get('pf_role')?.value;

    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const user = UsersDB.getById(userId);
    if (!user) {
      const unauthResponse = NextResponse.json({
        authenticated: false,
        user: null,
      });
      unauthResponse.cookies.set('pf_auth', '', { path: '/', maxAge: 0 });
      unauthResponse.cookies.set('pf_user_id', '', { path: '/', maxAge: 0 });
      unauthResponse.cookies.set('pf_status', '', { path: '/', maxAge: 0 });
      unauthResponse.cookies.set('pf_role', '', { path: '/', maxAge: 0 });
      return unauthResponse;
    }

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
