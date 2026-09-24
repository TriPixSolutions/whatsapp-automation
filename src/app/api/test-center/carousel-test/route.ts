import { NextRequest, NextResponse } from 'next/server';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import { DEFAULT_WORKSPACE_ID } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action = 'send_test', // 'send_test' | 'simulate_click'
      phoneNumber = '+919876543210',
      carouselTitle = 'Featured Products Showcase',
      cards = [
        {
          headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
          title: 'Runner Pro Sneakers',
          description: 'Ultra-light breathable performance shoes. $129',
          buttons: [{ id: 'buy_shoes', title: 'Order Shoes' }],
        },
        {
          headerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
          title: 'Chronos Smart Watch',
          description: 'Titanium chassis, AMOLED sapphire glass. $249',
          buttons: [{ id: 'buy_watch', title: 'Order Watch' }],
        },
        {
          headerImage: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
          title: 'Aviator Sun Shades',
          description: 'Polarized UV400 classic gold frame. $79',
          buttons: [{ id: 'buy_glasses', title: 'Order Shades' }],
        },
      ],
      cardIndex = 0,
      buttonClickedId,
    } = body;

    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/[^0-9]/g, '')}`;

    if (action === 'simulate_click') {
      const targetCard = cards[cardIndex] || cards[0];
      const event = TestCenterStore.recordCarouselEvent({
        id: `car_evt_${Date.now()}`,
        timestamp: new Date().toISOString(),
        phoneNumber: cleanPhone,
        carouselTitle,
        totalCards: cards.length,
        cardIndex,
        cardTitle: targetCard?.title || `Card #${cardIndex + 1}`,
        cardViewed: true,
        cardClicked: true,
        buttonClickedId: buttonClickedId || targetCard?.buttons?.[0]?.id || 'btn_action',
        buttonTitle: targetCard?.buttons?.[0]?.title || 'Select',
        clickedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `Simulated carousel card interaction recorded for "${targetCard?.title}"`,
        event,
      });
    }

    // Dispatch carousel to recipient
    const metaResult = await WhatsAppMessageService.send({
      workspaceId: DEFAULT_WORKSPACE_ID,
      to: cleanPhone,
      type: 'carousel',
      bodyText: `Swipe through our ${carouselTitle} below:`,
      cards,
      bypassWindowCheck: true,
    });

    // Record initial view events for each card
    cards.forEach((card: any, idx: number) => {
      TestCenterStore.recordCarouselEvent({
        id: `car_evt_${Date.now()}_${idx}`,
        timestamp: new Date().toISOString(),
        phoneNumber: cleanPhone,
        carouselTitle,
        totalCards: cards.length,
        cardIndex: idx,
        cardTitle: card.title,
        cardViewed: true,
        cardClicked: false,
      });
    });

    return NextResponse.json({
      success: metaResult.success,
      messageId: metaResult.messageId,
      cardsCount: cards.length,
      metaResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const logs = TestCenterStore.getCarouselLogs(100);
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
