import { NextRequest, NextResponse } from 'next/server';
import { ContactsDB, CompaniesDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { getAuthorizedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID;
    const contactId = searchParams.get('contactId');

    if (contactId) {
      const contact = ContactsDB.getById(contactId, workspaceId);
      if (!contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      }
      const timeline = ContactsDB.getTimeline(contactId);
      return NextResponse.json({ contact, timeline });
    }

    const contacts = ContactsDB.list({ workspaceId });
    const companies = CompaniesDB.list(workspaceId);

    // Compute pipeline metrics
    const stages = {
      lead: contacts.filter((c) => (c.stage || 'lead') === 'lead'),
      contacted: contacts.filter((c) => c.stage === 'contacted'),
      qualified: contacts.filter((c) => c.stage === 'qualified'),
      opportunity: contacts.filter((c) => c.stage === 'opportunity'),
      customer: contacts.filter((c) => c.stage === 'customer'),
    };

    return NextResponse.json({
      contacts,
      companies,
      stages,
      totalContacts: contacts.length,
      totalCompanies: companies.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, contactId, note, stage, leadScore, assignedAgent, companyData } = body;

    if (action === 'add_note' && contactId && note) {
      const newNote = ContactsDB.addNote(contactId, {
        authorName: user.name || 'Sales Agent',
        content: note,
      });
      return NextResponse.json({ success: true, note: newNote });
    }

    if (action === 'update_stage' && contactId && stage) {
      const contact = ContactsDB.getById(contactId);
      if (contact) {
        contact.stage = stage;
        ContactsDB.addTimelineEvent(contactId, {
          type: 'stage_changed',
          title: 'Pipeline Stage Updated',
          description: `Stage changed to ${stage.toUpperCase()}`,
        });
        return NextResponse.json({ success: true, contact });
      }
    }

    if (action === 'update_score' && contactId && leadScore !== undefined) {
      const contact = ContactsDB.getById(contactId);
      if (contact) {
        contact.leadScore = Number(leadScore);
        return NextResponse.json({ success: true, contact });
      }
    }

    if (action === 'assign_agent' && contactId && assignedAgent) {
      const contact = ContactsDB.getById(contactId);
      if (contact) {
        contact.assignedAgent = assignedAgent;
        ContactsDB.addTimelineEvent(contactId, {
          type: 'agent_assigned',
          title: 'Agent Reassigned',
          description: `Assigned to ${assignedAgent}`,
        });
        return NextResponse.json({ success: true, contact });
      }
    }

    if (action === 'create_company' && companyData?.name) {
      const company = CompaniesDB.upsert(companyData);
      return NextResponse.json({ success: true, company });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
