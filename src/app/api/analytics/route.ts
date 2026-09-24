import { NextRequest, NextResponse } from 'next/server';
import { MessagesDB, CampaignsDB, AutomationsDB, ConversationsDB, ContactsDB, SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
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
    const targetWorkspaceId = user.workspaceId || searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID;

    // Fetch live statistics
    const stats = MessagesDB.getStats(targetWorkspaceId);
    const campaigns = CampaignsDB.list(targetWorkspaceId);
    const automations = AutomationsDB.list(targetWorkspaceId);
    const conversations = ConversationsDB.list(targetWorkspaceId);
    const contacts = ContactsDB.list({ workspaceId: targetWorkspaceId });
    const settings = SettingsDB.get(targetWorkspaceId);

    // Compute strictly authentic metrics
    const connectedNumbersCount = settings.phoneNumberId ? 1 : 0;
    const sent = stats.messagesSent || 0;
    const delivered = stats.deliveredCount || 0;
    const read = stats.readCount || 0;
    const failed = stats.failedCount || 0;
    const replies = conversations.filter((c) => c.last_inbound_at).length;

    // Lead Conversions (Contacts in 'Won' or 'Qualified' / Total)
    const wonCount = contacts.filter((c) => c.stage === 'won' || c.stage === 'customer').length;
    const qualifiedCount = contacts.filter((c) => c.stage === 'qualified').length;
    const totalLeads = contacts.length;
    const leadConversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

    // Automation performance
    const totalExecutions = automations.reduce((acc, a) => acc + (a.executionCount || 0), 0);
    const activeAutomationsCount = automations.filter((a) => a.isActive !== false).length;

    // Broadcast performance
    const broadcastTotalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || c.sent_count || 0), 0);
    const broadcastTotalDelivered = campaigns.reduce((acc, c) => acc + (c.deliveredCount || c.delivered_count || 0), 0);
    const broadcastDeliveryRate = broadcastTotalSent > 0 ? Math.round((broadcastTotalDelivered / broadcastTotalSent) * 100) : 0;

    return NextResponse.json({
      metrics: {
        connectedNumbers: connectedNumbersCount,
        messagesSent: sent,
        delivered,
        read,
        replies,
        conversions: wonCount,
        failedMessages: failed,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
        readRate: delivered > 0 ? Math.round((read / delivered) * 100) : 0,
        replyRate: read > 0 ? Math.round((replies / read) * 100) : 0,
        leadConversionRate,
        automationPerformance: {
          activeAutomations: activeAutomationsCount,
          totalExecutions,
        },
        broadcastPerformance: {
          totalBroadcasts: campaigns.length,
          totalSent: broadcastTotalSent,
          totalDelivered: broadcastTotalDelivered,
          deliveryRate: broadcastDeliveryRate,
        },
      },
      campaigns: campaigns.slice(0, 10),
      automations: automations.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
