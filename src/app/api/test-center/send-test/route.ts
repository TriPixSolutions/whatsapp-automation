import { META_GRAPH_VERSION } from '@/lib/meta/config';
import { getAuthorizedUser } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { WhatsAppMessageService, SendWhatsAppMessageOptions } from '@/lib/whatsapp/messageService';
import { OutboundMessageKind, dbMessageType } from '@/lib/whatsapp/messageModel';
import { PlatformMessageType } from '@/types/automations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supportedTypes = new Set<OutboundMessageKind>([
  'text', 'template', 'image', 'video', 'audio', 'document', 'button', 'list',
  'carousel', 'catalog', 'flow', 'location', 'contact_card',
]);

function platformMessageType(kind: OutboundMessageKind): PlatformMessageType {
  if (kind === 'button') return 'interactive_button';
  if (kind === 'contact_card') return 'contact_card';
  if (kind === 'flow') return 'cta_button';
  return kind as PlatformMessageType;
}

export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const kind = String(body.type || 'text') as OutboundMessageKind;
    if (!supportedTypes.has(kind)) {
      return NextResponse.json({ success: false, error: `Unsupported test message type: ${kind}` }, { status: 400 });
    }

    const recipient = `+${String(body.phoneNumber || body.recipient || '').replace(/[^0-9]/g, '')}`;
    if (!/^\+[1-9]\d{6,14}$/.test(recipient)) {
      return NextResponse.json({ success: false, error: 'Enter a valid test recipient with country code.' }, { status: 400 });
    }

    const listItems = Array.isArray(body.listItems) ? body.listItems : [];
    const sendOptions: SendWhatsAppMessageOptions = {
      workspaceId: user.workspaceId!,
      to: recipient,
      type: kind,
      text: body.text,
      bodyText: body.bodyText || body.text,
      headerText: body.headerText,
      footerText: body.footerText,
      templateName: body.templateName || body.carouselTemplateName,
      languageCode: body.languageCode || 'en_US',
      components: body.components,
      buttons: body.buttons,
      buttonText: body.listTitle || body.buttonText,
      sections: body.sections || (listItems.length ? [{ title: body.sectionTitle || 'Available Options', rows: listItems }] : undefined),
      cards: body.carouselCards || body.cards,
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
      contact: body.contact || (body.contactCard ? {
        formattedName: body.contactCard.formattedName,
        phoneNumber: body.contactCard.phoneNumber,
        organization: body.contactCard.org,
      } : undefined),
      requireRealDelivery: true,
    };

    const dispatchStarted = Date.now();
    const result = await WhatsAppMessageService.send(sendOptions);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Meta did not accept the message.',
        code: result.errorCode,
        subcode: result.errorSubcode,
        windowClosed: result.windowClosed,
        dbMessage: result.savedMessage,
      }, { status: result.windowClosed ? 422 : 400 });
    }

    const messageId = result.metaMessageId!;
    const workspaceId = user.workspaceId!;
    const latencyMs = Date.now() - dispatchStarted;
    TestCenterStore.recordMetaLog({
      id: `meta_log_${Date.now()}`,
      workspaceId,
      timestamp: new Date().toISOString(),
      direction: 'outbound_request',
      endpoint: `/${META_GRAPH_VERSION}/${result.phoneNumberIdUsed}/messages`,
      method: 'POST',
      phoneNumberId: result.phoneNumberIdUsed,
      httpStatus: 200,
      requestBody: { messaging_product: 'whatsapp', recipient_type: 'individual', to: recipient, type: kind },
      responseBody: { success: true, messageId },
      latencyMs,
      deliveryStatus: 'sent',
    });
    TestCenterStore.recordDeliveryReceipt({
      id: `rcpt_${Date.now()}`,
      workspaceId,
      metaMessageId: messageId,
      phoneNumber: recipient,
      messageType: platformMessageType(kind),
      queuedAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      messageId,
      dbMessage: result.savedMessage,
      metaResult: { success: true, messageId, details: result.details },
      recipient,
      type: dbMessageType(kind),
    });
  } catch (error: any) {
    console.error('[Send Test API Error]:', error?.message || 'Unknown error');
    return NextResponse.json({ error: error?.message || 'Test message could not be sent.' }, { status: 500 });
  }
}
