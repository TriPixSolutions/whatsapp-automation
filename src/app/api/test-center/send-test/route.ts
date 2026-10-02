import { META_GRAPH_VERSION } from '@/lib/meta/config';
import { getAuthorizedUser } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { MetaWhatsAppClient } from '@/lib/meta/api';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { MessagesDB, ConversationsDB, ContactsDB, SettingsDB } from '@/lib/db';
import { MessageType } from '@/types';
import { PlatformMessageType } from '@/types/automations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const {
      type = 'text',
      phoneNumber = '+919876543210',
      text = 'Hello, this is a verified test message.',
      templateName = 'hello_world',
      mediaUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      caption = 'Check out this featured item!',
      buttons = [
        { id: 'btn_yes', title: 'Yes, Interested' },
        { id: 'btn_no', title: 'Not Now' },
      ],
      listTitle = 'Select an Option',
      listItems = [
        { id: 'item_1', title: 'Option 1', description: 'First tier option' },
        { id: 'item_2', title: 'Option 2', description: 'Second tier option' },
      ],
      carouselCards = [
        {
          headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
          title: 'Runner Pro Sneakers',
          description: 'Signature red athletic sneakers',
          buttons: [{ id: 'buy_card_1', title: 'Buy Now' }],
        },
        {
          headerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
          title: 'Chronos Smart Watch',
          description: 'Minimalist steel chronograph watch',
          buttons: [{ id: 'buy_card_2', title: 'View Details' }],
        },
      ],
      carouselTemplateName,
      flowId = 'flow_reg_9921',
      flowToken = 'token_abc123',
      location = { latitude: 28.6139, longitude: 77.2090, name: 'Connaught Place', address: 'New Delhi, India' },
      contactCard = { formattedName: 'Acme Support', phoneNumber: '+18005550199', org: 'Acme Global Corp' },
    } = body;

    const workspaceId = user.workspaceId!;
    const cleanPhone = `+${String(phoneNumber).replace(/[^0-9]/g, '')}`;

    // Get active Meta credentials from Settings
    const settings = await SettingsDB.get(workspaceId);
    const phoneNumberId = settings.phoneNumberId?.trim();
    const accessToken = settings.accessToken?.trim();
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Meta credentials are incomplete. Save a Phone Number ID and access token first.' },
        { status: 400 }
      );
    }

    const dispatchStarted = Date.now();
    let metaResult: any = null;
    let messageId = `wamid.HBgM${Date.now()}`;
    let sentContent = text;
    let dbType: MessageType = 'text';
    let platformType: PlatformMessageType = 'text';

    try {
      switch (type) {
        case 'text':
          dbType = 'text';
          platformType = 'text';
          sentContent = text;
          metaResult = await MetaWhatsAppClient.sendText({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            text,
          });
          break;

        case 'template':
          dbType = 'template';
          platformType = 'template';
          sentContent = `[Template: ${templateName}]`;
          metaResult = await MetaWhatsAppClient.sendTemplate({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            templateName,
            languageCode: 'en_US',
            components: templateName === 'hello_world' ? undefined : [
              {
                type: 'body',
                parameters: [{ type: 'text', text: 'Customer' }],
              },
            ],
          });
          break;

        case 'image':
          dbType = 'image';
          platformType = 'image';
          sentContent = caption || '[Image]';
          metaResult = await MetaWhatsAppClient.sendMedia({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            type: 'image',
            mediaUrl,
            caption,
          });
          break;

        case 'video':
          dbType = 'video';
          platformType = 'video';
          sentContent = caption || '[Video]';
          metaResult = await MetaWhatsAppClient.sendMedia({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            type: 'video',
            mediaUrl,
            caption,
          });
          break;

        case 'audio':
          dbType = 'audio';
          platformType = 'audio';
          sentContent = '[Audio]';
          metaResult = await MetaWhatsAppClient.sendMedia({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            type: 'audio',
            mediaUrl,
          });
          break;

        case 'document':
          dbType = 'document';
          platformType = 'document';
          sentContent = caption || '[Document]';
          metaResult = await MetaWhatsAppClient.sendMedia({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            type: 'document',
            mediaUrl,
            caption,
          });
          break;

        case 'button':
          dbType = 'button';
          platformType = 'interactive_button';
          sentContent = text;
          metaResult = await MetaWhatsAppClient.sendInteractiveButtons({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            bodyText: text,
            buttons,
          });
          break;

        case 'list':
          dbType = 'list';
          platformType = 'list';
          sentContent = text;
          metaResult = await MetaWhatsAppClient.sendInteractiveList({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            bodyText: text,
            buttonText: listTitle,
            sections: [
              {
                title: 'Available Options',
                rows: listItems,
              },
            ],
          });
          break;

        case 'carousel':
          dbType = 'carousel';
          platformType = 'carousel';
          sentContent = text;
          metaResult = await MetaWhatsAppClient.sendCarouselTemplate({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            // Native WhatsApp carousels require an approved carousel template.
            // Missing or rejected templates fail explicitly.
            templateName: carouselTemplateName || undefined,
            bodyText: text,
            cards: carouselCards,
          });
          break;

        case 'flow':
          dbType = 'interactive';
          platformType = 'interactive_button';
          sentContent = text;
          metaResult = await MetaWhatsAppClient.sendWhatsAppFlow({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            headerText: 'Registration',
            bodyText: text || 'Please complete this form to proceed.',
            footerText: 'Encrypted & Secure',
            flowId,
            flowToken,
            flowCta: 'Open Form',
          });
          break;

        case 'location':
          dbType = 'interactive';
          platformType = 'location';
          sentContent = `📍 Location: ${location.name || 'Pinned Location'}`;
          metaResult = await MetaWhatsAppClient.sendLocation({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            latitude: location.latitude,
            longitude: location.longitude,
            name: location.name,
            address: location.address,
          });
          break;

        case 'contact_card':
          dbType = 'interactive';
          platformType = 'contact_card';
          sentContent = `👤 Contact: ${contactCard.formattedName} (${contactCard.phoneNumber})`;
          metaResult = await MetaWhatsAppClient.sendContactCard({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            contactName: contactCard.formattedName,
            contactPhone: contactCard.phoneNumber,
            organization: contactCard.org,
          });
          break;

        default:
          metaResult = await MetaWhatsAppClient.sendText({
            phoneNumberId,
            accessToken,
            to: cleanPhone,
            text,
          });
          break;
      }

      if (!metaResult?.success || !metaResult.messageId) {
        return NextResponse.json(
          {
            success: false,
            error: metaResult?.error || 'Meta did not accept the message.',
            code: metaResult?.errorCode,
            subcode: metaResult?.errorSubcode,
          },
          { status: 400 }
        );
      }
      messageId = metaResult.messageId;
    } catch (apiErr: any) {
      console.warn('[TestCenter send-test] Meta API returned:', apiErr.message);
      return NextResponse.json(
        { success: false, error: apiErr.message || 'Meta API request failed.' },
        { status: 400 }
      );
    }

    // Persist the recipient only after Meta accepts the message. This prevents failed
    // test attempts from creating misleading contacts and conversation activity.
    const contact = await ContactsDB.upsert(
      {
        phoneNumber: cleanPhone,
        firstName: 'Test',
        lastName: 'Contact',
        tags: ['test_recipient'],
      },
      workspaceId
    );

    // 1. Record in DB
    const dbMessage = await MessagesDB.create({
      phoneNumber: cleanPhone,
      contactId: contact.id,
      direction: 'outbound',
      type: dbType,
      status: 'sent',
      content: sentContent,
      metaMessageId: messageId,
    }, workspaceId);

    await ConversationsDB.recordOutbound(cleanPhone, contact.id, workspaceId);

    // 2. Record Meta Log
    TestCenterStore.recordMetaLog({
      id: `meta_log_${Date.now()}`,
      workspaceId,
      timestamp: new Date().toISOString(),
      direction: 'outbound_request',
      endpoint: `/${META_GRAPH_VERSION}/${phoneNumberId}/messages`,
      method: 'POST',
      phoneNumberId,
      httpStatus: 200,
      requestBody: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: dbType,
      },
      responseBody: metaResult,
      latencyMs: Date.now() - dispatchStarted,
      deliveryStatus: 'sent',
    });

    // 3. Record Delivery Receipt
    TestCenterStore.recordDeliveryReceipt({
      id: `rcpt_${Date.now()}`,
      workspaceId,
      metaMessageId: messageId,
      phoneNumber: cleanPhone,
      messageType: platformType,
      queuedAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      messageId,
      dbMessage,
      metaResult,
      recipient: cleanPhone,
      type: dbType,
    });
  } catch (err: any) {
    console.error('[Send Test API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
