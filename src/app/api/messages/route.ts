import { NextRequest, NextResponse } from 'next/server';
import { MessagesDB, ContactsDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

    const messages = MessagesDB.list({ phoneNumber, limit });
    const conversations = MessagesDB.getRecentConversations();
    const stats = MessagesDB.getStats();

    return NextResponse.json({
      messages,
      conversations,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
