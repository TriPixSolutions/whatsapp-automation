import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UsersDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get('pf_user_id')?.value;
    const userId = body.userId || cookieUserId;

    if (!userId) {
      return NextResponse.json({ error: 'User session not found. Please log in first.' }, { status: 401 });
    }

    const updated = UsersDB.requestAccess(userId, {
      company: body.company,
      intendedUse: body.intendedUse,
    });

    if (!updated) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      user: updated,
      message: 'Your request has been sent to the admin. Please wait for approval.',
    });

    response.cookies.set('pf_status', 'pending_approval', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Request access error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit request' }, { status: 500 });
  }
}
