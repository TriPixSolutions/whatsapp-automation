import { randomUUID } from 'crypto';
import { database, checked } from '@/lib/db/client';
import { ContactsDB, ConversationsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { AdvancedWorkflowEngine } from '@/lib/automations/advancedWorkflowEngine';
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
      const contact = await ContactsDB.upsert(
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
      const leadId = randomUUID();
      checked(await database().from('leads').insert({
        id: leadId, workspace_id: workspaceId, contact_id: contact.id,
        phone_number: cleanPhone, first_name: input.firstName || '', last_name: input.lastName || '',
        status: 'new', metadata: { source: input.source, ...(input.metadata || {}) },
      }));

      // 3. Create Conversation Record for Workspace & Contact
      const conversation = await ConversationsDB.recordOutbound(cleanPhone, contact.id, workspaceId);

      let initialMessageSent = false;
      let followUpsScheduled = 0;

      // 4. Automation Triggered
      if (input.triggerAutomation !== false) {
        const payload = { ...input.metadata, text: 'lead_created', from: cleanPhone, source: input.source, leadId };
        const workflows = await AdvancedWorkflowEngine.matchWorkflows('meta_lead_form', payload, workspaceId);
        for (const workflow of workflows) {
          const execution = await AdvancedWorkflowEngine.executeWorkflow(workflow, {
            workflowId: workflow.id, workspaceId, phoneNumber: cleanPhone, contactId: contact.id,
            triggerType: 'meta_lead_form', triggerPayload: payload, isTestSimulation: false,
          });
          if (execution.status === 'failed') throw new Error('Lead saved, but its automation failed. Inspect the workflow execution trace.');
          initialMessageSent ||= execution.steps.some(step => step.status === 'message_sent');
        }
        // Follow-ups must be explicit configured workflow actions, never guessed template names.

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
