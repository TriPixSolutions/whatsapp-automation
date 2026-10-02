import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-server';
export async function POST(request: NextRequest) {
  if (!await getAuthorizedUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'This legacy test has been retired. Use Automation Lab with a saved workflow.' }, { status: 410 });
}
