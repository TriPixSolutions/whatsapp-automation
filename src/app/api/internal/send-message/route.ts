import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = process.env.WORKER_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: 'Worker is not configured' }, { status: 503 });
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const workspaceId = String(body.workspaceId || '');
    const to = String(body.to || '');
    const templateName = String(body.templateName || '');
    const languageCode = String(body.languageCode || 'en_US');
    if (!workspaceId || !/^\+?[1-9]\d{7,14}$/.test(to.replace(/[\s()-]/g, '')) || !templateName) {
      return NextResponse.json({ error: 'Workspace, E.164 recipient, and approved template name are required.' }, { status: 400 });
    }
    const result = await WhatsAppMessageService.send({
      workspaceId, to, type: 'template', templateName, languageCode, requireRealDelivery: true,
    });
    if (!result.success) return NextResponse.json({ error: result.error || 'Meta rejected the message.', details: result.details }, { status: 502 });
    return NextResponse.json({ success: true, messageId: result.messageId || result.metaMessageId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Message dispatch failed.' }, { status: 500 });
  }
}
