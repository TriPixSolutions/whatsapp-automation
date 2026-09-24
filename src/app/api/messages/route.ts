import { NextRequest, NextResponse } from 'next/server';
import { MessagesDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { getAuthorizedUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID;
    const phoneNumber = searchParams.get('phoneNumber') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

    const messages = MessagesDB.list({ workspaceId, phoneNumber, limit });
    const conversations = MessagesDB.getRecentConversations(workspaceId);
    const stats = MessagesDB.getStats(workspaceId);

    return NextResponse.json({
      messages,
      conversations,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
