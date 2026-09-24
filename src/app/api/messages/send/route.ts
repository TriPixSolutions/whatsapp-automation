import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import { DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { getAuthorizedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const toPhone = body.recipient || body.to || body.phoneNumber;
    const messageText = body.text || body.content?.text || body.content || '';
    const messageType = body.type || 'text';

    if (!toPhone) {
      return NextResponse.json({ error: 'Recipient phone number is required' }, { status: 400 });
    }

    console.log(`[Send Message API] Dispatching message to: ${toPhone} (Type: ${messageType}, BypassWindow: ${Boolean(body.bypassWindowCheck)})`);
    if (messageType === 'template' || body.templateName) {
      console.log('[Send Message API] Template Params:', {
        templateName: body.templateName,
        languageCode: body.languageCode || 'en_US',
        components: body.components,
      });
    }

    const result = await WhatsAppMessageService.send({
      workspaceId: body.workspaceId || DEFAULT_WORKSPACE_ID,
      to: toPhone,
      type: messageType,
      text: messageText,
      templateName: body.templateName,
      languageCode: body.languageCode,
      components: body.components,
      headerText: body.header,
      bodyText: messageText,
      footerText: body.footer,
      buttonText: body.buttonText,
      buttons: body.buttons,
      sections: body.sections,
      cards: body.cards,
      mediaUrl: body.mediaUrl,
      mediaId: body.mediaId,
      caption: body.caption,
      filename: body.filename,
      catalogId: body.catalogId,
      productRetailerId: body.productRetailerId,
      productSections: body.productSections,
      bypassWindowCheck: Boolean(body.bypassWindowCheck),
    });

    if (!result.success) {
      console.error('[Send Message API] Dispatch failed:', {
        to: toPhone,
        type: messageType,
        error: result.error,
        errorCode: result.errorCode,
        windowClosed: result.windowClosed,
      });
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
          windowClosed: result.windowClosed,
          message: result.savedMessage,
        },
        { status: result.windowClosed ? 422 : 400 }
      );
    }

    console.log(`[Send Message API] Dispatch succeeded for ${toPhone}. Meta ID: ${result.metaMessageId}`);

    return NextResponse.json({
      success: true,
      messageId: result.metaMessageId,
      message: result.savedMessage,
    });
  } catch (err: any) {
    console.error('[Send API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
