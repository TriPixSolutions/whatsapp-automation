import { ContactsDB, ConversationsDB, AutomationsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import { FollowUpEngine } from '@/lib/followup/followupEngine';
import { getAdminClient } from '@/lib/supabase/server';

export interface IngestLeadInput {
  workspaceId?: string;
  source: 'meta_leads' | 'manual' | 'api' | 'imported' | 'ctwa';
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  triggerAutomation?: boolean;
}

export interface IngestLeadResult {
  success: boolean;
  leadId: string;
  contactId: string;
  conversationId: string;
  initialMessageSent: boolean;
  followUpsScheduled: number;
  error?: string;
}

export class LeadCapturePipeline {
  /**
   * Complete Lead Processing Pipeline:
   * Lead Created -> Contact Created -> Conversation Created -> Automation Triggered -> Follow-Ups Scheduled
   */
  static async ingest(input: IngestLeadInput): Promise<IngestLeadResult> {
    const workspaceId = input.workspaceId || DEFAULT_WORKSPACE_ID;
    const cleanPhone = input.phoneNumber.startsWith('+')
      ? input.phoneNumber
      : `+${input.phoneNumber.replace(/[^0-9]/g, '')}`;

    try {
      // 1. Create / Upsert Contact in workspace
      const contact = ContactsDB.upsert(
        {
          phoneNumber: cleanPhone,
          firstName: input.firstName || '',
          lastName: input.lastName || '',
          tags: input.tags || ['lead', input.source],
          metadata: {
            source: input.source,
            ...(input.metadata || {}),
          },
        },
        workspaceId
      );

      // 2. Persist Lead to Database
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const supabase = getAdminClient();
      if (supabase) {
        try {
          await supabase
            .from('leads')
            .insert({
              id: leadId,
              workspace_id: workspaceId,
              contact_id: contact.id,
              phone_number: cleanPhone,
              first_name: input.firstName,
              last_name: input.lastName,
              status: 'new',
              metadata: {
                source: input.source,
                ...(input.metadata || {}),
              },
            });
        } catch (err: any) {
          console.warn('[Lead Capture] Database insert warning:', err?.message || err);
        }
      }

      // 3. Create Conversation Record for Workspace & Contact
      const conversation = ConversationsDB.recordOutbound(cleanPhone, contact.id, workspaceId);

      let initialMessageSent = false;
      let followUpsScheduled = 0;

      // 4. Automation Triggered
      if (input.triggerAutomation !== false) {
        // Check for custom lead_created automation flow
        const leadFlow = AutomationsDB.findMatch('lead_created', workspaceId);

        if (leadFlow && leadFlow.actionType === 'buttons') {
          const payload = leadFlow.actionPayload as any;
          const res = await WhatsAppMessageService.send({
            workspaceId,
            to: cleanPhone,
            type: 'button',
            headerText: payload.header || 'Welcome!',
            bodyText: payload.body || `Hello ${input.firstName || 'there'}! Thanks for reaching out. How may we assist you?`,
            footerText: payload.footer,
            buttons: payload.buttons || [{ id: 'btn_help', title: 'Learn More' }],
            bypassWindowCheck: true, // Lead opt-in permits initial welcome
          });
          initialMessageSent = res.success;
          AutomationsDB.incrementExecution(leadFlow.id);
        } else {
          // Standard Meta-Approved Template Welcome
          const welcomeResult = await WhatsAppMessageService.send({
            workspaceId,
            to: cleanPhone,
            type: 'template',
            templateName: 'welcome_lead',
            languageCode: 'en_US',
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: input.firstName || 'there',
                  },
                ],
              },
            ],
          });
          initialMessageSent = welcomeResult.success;
        }

        // 5. Schedule Automated Follow-Up Sequence (T+10m, T+6h, T+24h)
        const followUpResult = await FollowUpEngine.scheduleSequence({
          phoneNumber: cleanPhone,
          contactId: contact.id,
          workspaceId,
        });
        followUpsScheduled = followUpResult.scheduledCount;
      }

      return {
        success: true,
        leadId,
        contactId: contact.id,
        conversationId: conversation.id,
        initialMessageSent,
        followUpsScheduled,
      };
    } catch (err: any) {
      console.error('[Lead Capture Pipeline Error]:', err);
      return {
        success: false,
        leadId: '',
        contactId: '',
        conversationId: '',
        initialMessageSent: false,
        followUpsScheduled: 0,
        error: err.message,
      };
    }
  }
}
