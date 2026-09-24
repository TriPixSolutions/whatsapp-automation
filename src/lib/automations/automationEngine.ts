import { WhatsAppMessageService } from '@/lib/whatsapp/messageService';
import { ContactsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { AutomationStep, AutomationStepType } from '@/types';
import { FollowUpEngine } from '@/lib/followup/followupEngine';

export interface WorkflowContext {
  workspaceId: string;
  phoneNumber: string;
  contactId: string;
  variables: Record<string, any>;
  hasCustomerReplied?: boolean;
  bypassWindowCheck?: boolean;
}

export class AutomationWorkflowEngine {
  /**
   * Executes an ordered multi-step automation workflow
   */
  static async executeWorkflow(
    steps: AutomationStep[],
    context: WorkflowContext
  ): Promise<{ success: boolean; executedSteps: number; error?: string }> {
    const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);
    let count = 0;

    for (const step of sorted) {
      count++;
      const payload = step.payload || {};

      switch (step.step_type) {
        case 'trigger':
          // Entry point validated
          break;

        case 'condition':
          if (payload.check === 'customer_replied') {
            if (context.hasCustomerReplied && payload.ifTrue === 'end') {
              return { success: true, executedSteps: count };
            }
          }
          break;

        case 'image':
        case 'message':
          await WhatsAppMessageService.send({
            workspaceId: context.workspaceId,
            to: context.phoneNumber,
            type: step.step_type === 'image' ? 'image' : (payload.type || 'text'),
            text: payload.text,
            mediaUrl: payload.mediaUrl,
            caption: payload.caption || payload.text,
            headerText: payload.header,
            bodyText: payload.body,
            footerText: payload.footer,
            buttons: payload.buttons,
            templateName: payload.templateName,
            bypassWindowCheck: context.bypassWindowCheck,
          });
          break;

        case 'tag':
          if (payload.addTag) {
            const contact = ContactsDB.getByPhone(context.phoneNumber, context.workspaceId);
            if (contact) {
              const tags = Array.from(new Set([...contact.tags, payload.addTag.toLowerCase()]));
              ContactsDB.upsert({ ...contact, tags }, context.workspaceId);
            }
          }
          break;

        case 'wait':
          // In real-time execution, small delays (<5s) can execute synchronously; longer delays are scheduled
          if (payload.delaySeconds && payload.delaySeconds <= 5) {
            await new Promise((r) => setTimeout(r, payload.delaySeconds * 1000));
          } else if (payload.delayHours || payload.delayMinutes || payload.delaySeconds) {
            const interval = payload.delayHours || (payload.delayMinutes ? payload.delayMinutes : 1);
            const unit = payload.delayHours ? 'hours' : (payload.delayMinutes ? 'minutes' : 'hours');
            await FollowUpEngine.scheduleCustomFollowUp({
              phoneNumber: context.phoneNumber,
              contactId: context.contactId,
              workspaceId: context.workspaceId,
              interval,
              unit,
              stepName: `Automation Wait ${interval}${unit[0]}`,
              bodyText: payload.nextMessageText,
            });
          }
          break;

        case 'assign':
          // Assign lead/contact to agent
          break;

        case 'webhook':
          if (payload.url) {
            try {
              await fetch(payload.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'automation_step_executed',
                  phoneNumber: context.phoneNumber,
                  contactId: context.contactId,
                  payload,
                }),
              });
            } catch (err) {
              console.warn('[Automation Webhook Step] Callback error:', err);
            }
          }
          break;

        case 'end':
          return { success: true, executedSteps: count };
      }
    }

    return { success: true, executedSteps: count };
  }
}
