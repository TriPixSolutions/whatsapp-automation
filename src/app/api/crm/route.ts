import { NextRequest, NextResponse } from 'next/server';
import { ContactsDB, CompaniesDB } from '@/lib/db';
import { getAuthorizedUser } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const workspaceId = user.workspaceId!;
    const contactId = request.nextUrl.searchParams.get('contactId');
    if (contactId) {
      const contact = await ContactsDB.getById(contactId, workspaceId);
      if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      return NextResponse.json({ contact, timeline: await ContactsDB.getTimeline(contactId, workspaceId) });
    }
    const contacts = await ContactsDB.list({ workspaceId });
    const companies = CompaniesDB.list(workspaceId);
    const stages = {
      new_lead: contacts.filter(c => !c.stage || ['new_lead', 'lead', 'new'].includes(c.stage)),
      contacted: contacts.filter(c => c.stage === 'contacted'),
      qualified: contacts.filter(c => c.stage === 'qualified'),
      proposal_sent: contacts.filter(c => ['proposal_sent', 'opportunity'].includes(c.stage || '')),
      negotiation: contacts.filter(c => c.stage === 'negotiation'),
      won: contacts.filter(c => ['won', 'customer'].includes(c.stage || '')),
      lost: contacts.filter(c => c.stage === 'lost'),
    };
    return NextResponse.json({ contacts, companies, stages, totalContacts: contacts.length, totalCompanies: companies.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthorizedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const workspaceId = user.workspaceId!;
    const { action, contactId, note, stage, leadScore, assignedAgent, companyData } = await request.json();
    if (action === 'create_company' && companyData?.name) {
      return NextResponse.json({ success: true, company: CompaniesDB.upsert(companyData, workspaceId) });
    }
    if (!contactId) return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    const contact = await ContactsDB.getById(contactId, workspaceId);
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    if (action === 'add_note' && typeof note === 'string' && note.trim()) {
      const saved = await ContactsDB.addNote(contactId, { authorName: user.name, content: note.trim() }, workspaceId);
      return NextResponse.json({ success: true, note: saved });
    }
    let changes: Partial<typeof contact>;
    if (action === 'update_stage' && typeof stage === 'string') changes = { stage };
    else if (action === 'update_score' && Number.isFinite(Number(leadScore))) changes = { leadScore: Number(leadScore) };
    else if (action === 'assign_agent' && typeof assignedAgent === 'string') changes = { assignedAgent };
    else return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
    const updated = await ContactsDB.upsert({ phoneNumber: contact.phoneNumber, ...changes }, workspaceId);
    if (action === 'update_stage' || action === 'assign_agent') {
      await ContactsDB.addTimelineEvent(contactId, {
        type: action === 'update_stage' ? 'stage_changed' : 'agent_assigned',
        title: action === 'update_stage' ? 'Pipeline Stage Updated' : 'Agent Reassigned',
        description: action === 'update_stage' ? `Stage changed to ${stage}` : `Assigned to ${assignedAgent}`,
      }, workspaceId);
    }
    return NextResponse.json({ success: true, contact: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
