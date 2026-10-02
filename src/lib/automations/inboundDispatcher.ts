import { ContactsDB, MessagesDB, ConversationsDB } from '@/lib/db';
import { FollowUpEngine } from '@/lib/followup/followupEngine';
import { AdvancedWorkflowEngine } from './advancedWorkflowEngine';
import { TestCenterStore } from './testCenterStore';
import type { NormalizedInboundEvent, InboundPipelineResult } from './normalizedEvent';

/** Canonical application pipeline. Transport authentication and atomic event claims
 * are owned by the webhook boundary; test events are explicitly simulated. */
export class InboundAutomationDispatcher {
  static async dispatch(event: NormalizedInboundEvent): Promise<InboundPipelineResult> {
    if (!event.workspaceId || event.workspaceId === 'default') throw new Error('An explicit resolved workspace is required');
    const workspaceId = event.workspaceId;
    const phone = `+${event.phoneNumber.replace(/[^0-9]/g, '')}`;
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) throw new Error('Invalid recipient number');
    const content = event.text || event.interaction?.title || event.interaction?.id || '';
    const contact = await ContactsDB.upsert({ phoneNumber: phone,
      ...(event.metadata?.firstName ? { firstName: event.metadata.firstName } : {}),
      ...(event.metadata?.lastName ? { lastName: event.metadata.lastName } : {}),
    }, workspaceId);
    await MessagesDB.create({metaMessageId:event.messageId,phoneNumber:phone,contactId:contact.id,
      direction:'inbound',type:event.interaction?'interactive':event.rawType as any,
      status:'delivered',content,payload:{ interaction:event.interaction,isSimulation:event.isTestSimulation }},workspaceId);
    // Simulations must not open the real customer-care window.
    if (!event.isTestSimulation && !event.metadata?.synthetic) await ConversationsDB.recordInbound(phone,contact.id,workspaceId,event.messageId,
      new Date(Math.min(Number(event.timestamp)*1000||Date.now(),Date.now())).toISOString());
    if (!event.isTestSimulation && !event.metadata?.synthetic) await FollowUpEngine.cancelPendingOnReply(phone,workspaceId);
    const executions: any[] = [];
    const base: InboundPipelineResult = {success:true,event,matchedWorkflowsCount:0,matchedWorkflowNames:[],sessionAction:'none',executions,trace:[{step:'Inbound persisted',status:'passed',timestamp:new Date().toISOString(),details:{synthetic:Boolean(event.metadata?.synthetic || event.isTestSimulation),deliveryMode:event.deliveryMode}}]};
    let triggerType: any = event.interaction?.kind === 'carousel_button' ? 'carousel_click' : event.interaction ? 'button_click' : 'keyword';
    const payload = {text:content,from:phone,buttonId:event.interaction?.id,buttonTitle:event.interaction?.title,
      cardIndex:event.interaction?.cardIndex,cardButtonId:event.interaction?.cardButtonId};
    let matches = await AdvancedWorkflowEngine.matchWorkflows(triggerType,payload,workspaceId);
    const session = await TestCenterStore.getActiveSession(phone,workspaceId,event.isTestSimulation);
    if (session) {
      if (!event.interaction && matches.length) {
        await TestCenterStore.clearSession(phone,workspaceId,session.id,event.isTestSimulation);
        base.sessionAction=session.waitingFor==='delay'?'interrupted_delay':'cleared';
      } else if (session.waitingFor==='delay') {
        base.sessionAction='preserved_delay'; return base;
      } else {
        const action = session.waitingFor==='carousel_selection' || event.interaction?.kind==='carousel_button' ? 'carousel_click' : event.interaction?'button_click':'reply';
        const resumed = await AdvancedWorkflowEngine.resumeWorkflowExecution(session,{action,...payload},event.isTestSimulation);
        if (!resumed) return {...base,success:!event.isTestSimulation,error:'No branch matched the interaction',code:'NO_MATCHING_BRANCH'};
        executions.push(resumed); base.sessionAction='resumed';base.resumedSessionId=session.id;
        base.matchedWorkflowsCount=1;base.success=resumed.status!=='failed';return base;
      }
    }
    if (!matches.length && triggerType==='keyword') {
      matches=await AdvancedWorkflowEngine.matchWorkflows('incoming_message',payload,workspaceId);
      triggerType='incoming_message';
    }
    if (event.interaction && !matches.length) return {...base, success:!event.isTestSimulation, code:'NO_ACTIVE_SESSION', error:'Start the workflow before testing its reply button.'};
    for (const workflow of matches) {
      executions.push(await AdvancedWorkflowEngine.executeWorkflow(workflow,{workflowId:workflow.id,workspaceId,
        phoneNumber:phone,contactId:contact.id,triggerType,triggerPayload:payload,isTestSimulation:event.isTestSimulation}));
    }
    base.matchedWorkflowsCount=matches.length;base.matchedWorkflowNames=matches.map(w=>w.name);
    base.success=executions.every(e=>e.status!=='failed');
    if(!base.success)base.error='Workflow action failed. Inspect the execution trace.';
    return base;
  }
}
