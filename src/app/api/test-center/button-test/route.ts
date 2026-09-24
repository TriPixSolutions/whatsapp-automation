import { NextRequest, NextResponse } from 'next/server';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import { DEFAULT_WORKSPACE_ID, MessagesDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action = 'send_test', // 'send_test' | 'simulate_click'
      buttonType = 'quick_reply', // 'quick_reply' | 'url' | 'call' | 'copy_code'
      phoneNumber = '+919876543210',
      buttonId = 'btn_test_1',
      buttonTitle = 'Confirm Order',
      headerText = 'Interactive Button Lab',
      bodyText = 'Please test this interactive button below:',
      footerText = 'TriPix Testing Sandbox',
      url = 'https://example.com/checkout',
      phoneNumberToCall = '+919876543210',
      couponCode = 'TEST10',
    } = body;

    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;

    if (action === 'simulate_click') {
      const event = TestCenterStore.recordButtonEvent({
        id: `btn_evt_${Date.now()}`,
        timestamp: new Date().toISOString(),
        phoneNumber: cleanPhone,
        buttonType,
        buttonId,
        buttonTitle,
        viewed: true,
        clicked: true,
        clickedAt: new Date().toISOString(),
        responsePayload: {
          buttonId,
          buttonTitle,
          buttonType,
          action: 'clicked',
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Simulated button click recorded for "${buttonTitle}"`,
        event,
      });
    }

    // Dispatch real button message via Meta / WhatsAppMessageService
    let metaResult: any;

    if (buttonType === 'quick_reply') {
      metaResult = await WhatsAppMessageService.send({
        workspaceId: DEFAULT_WORKSPACE_ID,
        to: cleanPhone,
        type: 'button',
        headerText,
        bodyText,
        footerText,
        buttons: [
          { id: buttonId, title: buttonTitle.substring(0, 20) },
          { id: 'btn_help', title: 'Need Assistance' },
        ],
        bypassWindowCheck: true,
      });
    } else {
      // URL, Call, or Copy Code interactive templates or text with actionable link
      const ctaText =
        buttonType === 'url'
          ? `${bodyText}\n\n👉 [${buttonTitle}](${url})`
          : buttonType === 'call'
          ? `${bodyText}\n\n📞 Tap to call: ${phoneNumberToCall}`
          : `${bodyText}\n\n🎟 Promo Code: *${couponCode}* (Tap to copy)`;

      metaResult = await WhatsAppMessageService.send({
        workspaceId: DEFAULT_WORKSPACE_ID,
        to: cleanPhone,
        type: 'text',
        text: ctaText,
        bypassWindowCheck: true,
      });
    }

    const event = TestCenterStore.recordButtonEvent({
      id: `btn_evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      phoneNumber: cleanPhone,
      buttonType,
      buttonId,
      buttonTitle,
      viewed: true,
      clicked: false,
      responsePayload: metaResult,
    });

    return NextResponse.json({
      success: metaResult.success,
      messageId: metaResult.messageId,
      buttonType,
      event,
      metaResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const logs = TestCenterStore.getButtonLogs(100);
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
