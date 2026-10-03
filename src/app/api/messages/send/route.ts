import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import { OutboundMessageKind } from '@/lib/whatsapp/messageModel';
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

    const result = await WhatsAppMessageService.send({
      // The signed session is the only source of workspace authority.
      workspaceId: user.workspaceId!,
      to: toPhone,
      type: messageType as OutboundMessageKind,
      text: messageText,
      phoneNumberId: body.phoneNumberId,
      accessToken: body.accessToken,
      requireRealDelivery: Boolean(body.requireRealDelivery || body.isConnectionTest),
      isConnectionTest: Boolean(body.isConnectionTest),
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
      mediaAssetId: body.mediaAssetId,
      caption: body.caption,
      filename: body.filename,
      catalogId: body.catalogId,
      productRetailerId: body.productRetailerId,
      productSections: body.productSections,
      flowId: body.flowId,
      flowToken: body.flowToken,
      flowCta: body.flowCta,
      flowScreen: body.flowScreen,
      location: body.location,
      contact: body.contact,
      bypassWindowCheck: Boolean(body.bypassWindowCheck),
    });

    if (!result.success) {
      console.error('[Send Message API] Dispatch failed:', {
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
          errorSubcode: result.errorSubcode,
          details: result.details,
          phoneNumberIdUsed: result.phoneNumberIdUsed,
          isSimulated: result.isSimulated || false,
          windowClosed: result.windowClosed,
          message: result.savedMessage,
        },
        { status: result.windowClosed ? 422 : 400 }
      );
    }

    console.log(`[Send Message API] ${messageType} dispatch succeeded.`);

    return NextResponse.json({
      success: true,
      messageId: result.metaMessageId,
      phoneNumberIdUsed: result.phoneNumberIdUsed,
      details: result.details,
      isSimulated: result.isSimulated || false,
      message: result.savedMessage,
    });
  } catch (err: any) {
    console.error('[Send API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
