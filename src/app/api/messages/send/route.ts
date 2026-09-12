import { NextRequest, NextResponse } from 'next/server';
import { SettingsDB, MessagesDB, ContactsDB } from '@/lib/db';
import { MetaWhatsAppClient } from '@/lib/meta/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const toPhone = body.recipient || body.to || body.phoneNumber;
    const messageText = body.text || body.content?.text || body.content || '';
    const messageType = body.type || 'text';

    if (!toPhone) {
      return NextResponse.json({ error: 'Recipient phone number is required' }, { status: 400 });
    }

    const settings = SettingsDB.get();
    const { phoneNumberId, accessToken } = settings;

    let metaResult: any = { success: false };
    const cleanPhone = toPhone.startsWith('+') ? toPhone : `+${toPhone.replace(/[^0-9]/g, '')}`;

    // If Meta API credentials are configured, execute live network request to Meta Graph API
    if (phoneNumberId && accessToken && !accessToken.includes('SAMPLE_TOKEN')) {
      if (messageType === 'text') {
        metaResult = await MetaWhatsAppClient.sendText({
          phoneNumberId,
          accessToken,
          to: cleanPhone,
          text: messageText,
        });
      } else if (messageType === 'buttons') {
        metaResult = await MetaWhatsAppClient.sendInteractiveButtons({
          phoneNumberId,
          accessToken,
          to: cleanPhone,
          headerText: body.header,
          bodyText: messageText,
          footerText: body.footer,
          buttons: body.buttons || [{ id: 'btn_1', title: 'Reply' }],
        });
      } else if (messageType === 'list') {
        metaResult = await MetaWhatsAppClient.sendInteractiveList({
          phoneNumberId,
          accessToken,
          to: cleanPhone,
          headerText: body.header,
          bodyText: messageText,
          footerText: body.footer,
          buttonText: body.buttonText || 'Options',
          sections: body.sections || [],
        });
      } else if (messageType === 'carousel') {
        metaResult = await MetaWhatsAppClient.sendCarouselTemplate({
          phoneNumberId,
          accessToken,
          to: cleanPhone,
          bodyText: messageText,
          cards: body.cards || [],
        });
      } else if (messageType === 'template') {
        metaResult = await MetaWhatsAppClient.sendTemplate({
          phoneNumberId,
          accessToken,
          to: cleanPhone,
          templateName: body.templateName,
          languageCode: body.languageCode || 'en_US',
          components: body.components,
        });
      }
    } else {
      // Local development / unconfigured fallback
      metaResult = {
        success: true,
        messageId: `wamid.local_${Date.now()}`,
        simulated: true,
      };
    }

    // Ensure contact exists in database
    const contact = ContactsDB.upsert({
      phoneNumber: cleanPhone,
    });

    // Save outbound message to Database
    const saved = MessagesDB.create({
      metaMessageId: metaResult.messageId || `wamid.${Date.now()}`,
      phoneNumber: cleanPhone,
      contactId: contact.id,
      direction: 'outbound',
      type: messageType,
      status: metaResult.success ? 'sent' : 'failed',
      content: messageText || `[${messageType.toUpperCase()}]`,
      payload: body,
      errorMessage: metaResult.error,
    });

    if (!metaResult.success && metaResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: metaResult.error,
          errorCode: metaResult.errorCode,
          message: saved,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: saved.metaMessageId,
      message: saved,
    });
  } catch (err: any) {
    console.error('[Send API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
