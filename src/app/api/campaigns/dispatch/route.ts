import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, mockStore, isSupabaseConfigured } from '@/lib/supabase/server';
import { enqueueCampaignJob } from '@/lib/queue/redis';
import { MetaWhatsAppClient } from '@/lib/meta/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, workspaceId, templateName = 'teaser_alert', targetTag = 'teaser_list' } = body;

    if (!campaignId || !workspaceId) {
      return NextResponse.json(
        { error: 'campaignId and workspaceId are required fields.' },
        { status: 400 }
      );
    }

    console.log(`[Dispatch API] Campaign ${campaignId} dispatch requested for tag '${targetTag}'`);

    const supabase = getAdminClient();

    // 1. Update status to processing
    if (supabase) {
      await supabase
        .from('campaigns')
        .update({ status: 'processing' })
        .eq('id', campaignId);
    } else {
      const camp = mockStore.campaigns.find((c) => c.id === campaignId);
      if (camp) camp.status = 'processing';
    }

    // 2. Enqueue in BullMQ Redis Queue
    const enqueueResult = await enqueueCampaignJob({
      campaignId,
      workspaceId,
      templateName,
      targetTag,
    });

    // 3. If running in simulated/fallback mode (no live Redis connection on developer workstation),
    // perform safe in-process dispatch to fulfill Test Flow 1 requirements immediately!
    if (enqueueResult.mode !== 'bullmq_redis') {
      console.log('[Dispatch API] Running in-process background simulation for test flow...');

      (async () => {
        try {
          let contacts: any[] = [];

          if (supabase) {
            let q = supabase
              .from('contacts')
              .select('id, phone_number, first_name, last_name, tags')
              .eq('workspace_id', workspaceId)
              .eq('optin_status', true);

            if (targetTag && targetTag !== 'all') {
              q = q.contains('tags', [targetTag]);
            }
            const res = await q;
            contacts = res.data || [];
          } else {
            contacts = mockStore.contacts.filter(
              (c) => targetTag === 'all' || c.tags.includes(targetTag)
            );
          }

          let sent = 0;
          for (const contact of contacts) {
            // Respect rate limit delay 50ms
            await new Promise((r) => setTimeout(r, 50));

            const sendRes = await MetaWhatsAppClient.sendTemplate({
              phoneNumberId: process.env.META_PHONE_NUMBER_ID || '109823485764321',
              accessToken: process.env.META_ACCESS_TOKEN || 'EAAG_SAMPLE_TOKEN',
              to: contact.phone_number,
              templateName,
            });

            if (supabase) {
              await supabase.from('messages_log').insert({
                workspace_id: workspaceId,
                contact_id: contact.id,
                message_meta_id: sendRes.metaMessageId,
                direction: 'outbound',
                type: 'template',
                status: 'delivered',
                payload: {
                  template: templateName,
                  text: 'Something big is coming soon. Are you ready?',
                  recipient: contact.phone_number,
                },
              });
            } else {
              mockStore.messages.unshift({
                id: `msg_disp_${Date.now()}_${sent}`,
                workspace_id: workspaceId,
                contact_id: contact.id,
                message_meta_id: sendRes.metaMessageId,
                direction: 'outbound',
                type: 'template',
                status: 'delivered',
                payload: {
                  template: templateName,
                  text: 'Something big is coming soon. Are you ready?',
                },
                created_at: new Date().toISOString(),
              });
            }
            sent++;
          }

          if (supabase) {
            await supabase
              .from('campaigns')
              .update({
                status: 'completed',
                total_recipients: contacts.length,
                sent_count: sent,
                completed_at: new Date().toISOString(),
              })
              .eq('id', campaignId);
          } else {
            const camp = mockStore.campaigns.find((c) => c.id === campaignId);
            if (camp) {
              camp.status = 'completed';
              camp.total_recipients = contacts.length;
              camp.sent_count = sent;
            }
          }
        } catch (err) {
          console.error('[In-Process Dispatch Error]:', err);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign dispatched successfully to queue.',
      jobId: enqueueResult.jobId,
      mode: enqueueResult.mode,
    });
  } catch (error: any) {
    console.error('[Campaign Dispatch Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
