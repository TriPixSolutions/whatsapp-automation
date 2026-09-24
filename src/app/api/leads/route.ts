import { NextRequest, NextResponse } from 'next/server';
import { LeadCapturePipeline } from '@/lib/leads/leadPipeline';
import { getAdminClient } from '@/lib/supabase/server';
import { ContactsDB, MessagesDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function detectIntent(text: string, tags: string[] = []): string {
  const lower = (text || '').toLowerCase();
  if (tags.includes('price_inquiry') || /\b(price|pricing|cost|how much|rate|quote)\b/i.test(lower)) {
    return 'Asked Price';
  }
  if (tags.includes('order_inquiry') || /\b(order|how to order|buy now|buy|purchase|book)\b/i.test(lower)) {
    return 'Wants to Order';
  }
  if (tags.includes('available_inquiry') || /\b(available|in stock|stock|inventory)\b/i.test(lower)) {
    return 'Stock Check';
  }
  if (tags.includes('delivery_inquiry') || /\b(delivery|shipping|courier|ship|dispatch)\b/i.test(lower)) {
    return 'Delivery Charge';
  }
  if (tags.includes('priority') || /\b(interested|need details|send details|more info)\b/i.test(lower)) {
    return 'High Interest';
  }
  return 'General Inquiry';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterIntent = searchParams.get('intent');
    const filterStatus = searchParams.get('status');
    const search = (searchParams.get('search') || '').toLowerCase();

    // 1. Fetch contacts from local DB repository
    const contacts = ContactsDB.list({ limit: 200 });

    // 2. Fetch all messages to associate the latest conversation message
    const allMessages = MessagesDB.list({ limit: 1000 });

    const leads = contacts.map((contact) => {
      // Find latest message for this contact
      const contactPhoneClean = contact.phoneNumber.replace(/[^0-9]/g, '');
      const messagesForContact = allMessages.filter(
        (m) => m.phoneNumber.replace(/[^0-9]/g, '') === contactPhoneClean
      );
      const latestMsg = messagesForContact[0];
      const lastMessageContent = latestMsg?.content || (contact.metadata as any)?.lastMessage || 'New lead captured via Meta Ad';
      const lastActivityTime = latestMsg?.createdAt || contact.updatedAt || contact.createdAt;

      const intent = detectIntent(lastMessageContent, contact.tags);
      const isPriority =
        contact.tags.includes('priority') ||
        ['Asked Price', 'Wants to Order', 'Stock Check', 'Delivery Charge', 'High Interest'].includes(intent);

      const status = (contact.metadata as any)?.status || (isPriority ? 'priority' : 'new');
      const assignedAgent = (contact.metadata as any)?.assignedAgent || (isPriority ? 'Sales Specialist' : 'Unassigned');

      return {
        id: contact.id,
        name: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Prospective Buyer',
        firstName: contact.firstName,
        lastName: contact.lastName,
        phoneNumber: contact.phoneNumber,
        lastMessage: lastMessageContent,
        intent,
        isPriority,
        status,
        assignedAgent,
        tags: contact.tags,
        lastActivity: lastActivityTime,
        createdAt: contact.createdAt,
      };
    });

    // Apply filtering
    let filtered = leads;

    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          l.phoneNumber.toLowerCase().includes(search) ||
          l.lastMessage.toLowerCase().includes(search)
      );
    }

    if (filterIntent && filterIntent !== 'all') {
      filtered = filtered.filter((l) => l.intent.toLowerCase().includes(filterIntent.toLowerCase()));
    }

    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter((l) => l.status === filterStatus);
    }

    // Sort by priority first, then most recent activity
    filtered.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    return NextResponse.json({
      leads: filtered,
      totalCount: filtered.length,
      priorityCount: filtered.filter((l) => l.isPriority).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, phone_number, firstName, first_name, lastName, last_name, source = 'meta_leads', tags, metadata } = body;

    const rawPhone = phoneNumber || phone_number;
    if (!rawPhone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const result = await LeadCapturePipeline.ingest({
      phoneNumber: rawPhone,
      firstName: firstName || first_name,
      lastName: lastName || last_name,
      source,
      tags: tags || ['lead', 'meta_inbound'],
      metadata,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to capture lead' }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, phoneNumber, status, assignedAgent, tag } = body;

    let contact = id ? ContactsDB.getById(id) : null;
    if (!contact && phoneNumber) {
      contact = ContactsDB.getByPhone(phoneNumber);
    }

    if (!contact) {
      return NextResponse.json({ error: 'Lead contact not found' }, { status: 404 });
    }

    const currentMeta = (contact.metadata || {}) as Record<string, any>;
    const updatedMeta = {
      ...currentMeta,
      ...(status ? { status } : {}),
      ...(assignedAgent ? { assignedAgent } : {}),
      lastUpdated: new Date().toISOString(),
    };

    const currentTags = new Set(contact.tags || []);
    if (tag) currentTags.add(tag);
    if (status === 'priority') currentTags.add('priority');

    const updated = ContactsDB.upsert({
      ...contact,
      phoneNumber: contact.phoneNumber,
      tags: Array.from(currentTags),
      metadata: updatedMeta,
    });

    return NextResponse.json({ success: true, contact: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
