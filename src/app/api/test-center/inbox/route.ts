import { NextRequest, NextResponse } from 'next/server';
import { MessagesDB, ContactsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phone');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const allMessages = MessagesDB.list({
      workspaceId: DEFAULT_WORKSPACE_ID,
      phoneNumber: phoneNumber || undefined,
      limit,
    });

    const enrichedMessages = allMessages.map((msg) => {
      let category: 'incoming' | 'outgoing' | 'automation' | 'broadcast' | 'system' = 'outgoing';

      if (msg.direction === 'inbound') {
        category = 'incoming';
      } else if (msg.type === 'template') {
        category = 'broadcast';
      } else if (msg.type === 'interactive' || msg.type === 'button' || msg.type === 'carousel') {
        category = 'automation';
      } else if (msg.errorMessage) {
        category = 'system';
      }

      return {
        ...msg,
        category,
      };
    });

    // Sort chronologically ascending for chat view
    enrichedMessages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return NextResponse.json({
      messages: enrichedMessages,
      timestamp: new Date().toISOString(),
      count: enrichedMessages.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
