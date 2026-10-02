import { normalizeMetaWebhookMessage } from '@/lib/automations/normalizedEvent';
import { InboundAutomationDispatcher } from '@/lib/automations/inboundDispatcher';
import { DEFAULT_WORKSPACE_ID } from '@/lib/db';
export interface MetaMessageObject {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: { text: string; payload: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  video?: { id: string; mime_type: string; sha256: string; caption?: string };
  audio?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; filename: string; mime_type: string; sha256: string; caption?: string };
}


export async function handleWebhookInboundMessages(messages: MetaMessageObject[], contactsList?: any[], workspaceId: string = DEFAULT_WORKSPACE_ID) {
  for (const message of messages) {
    const event = normalizeMetaWebhookMessage(message, contactsList, '', workspaceId);
    const result = await InboundAutomationDispatcher.dispatch(event);
    if (!result.success) throw new Error(result.error || 'Inbound workflow execution failed');
  }
}
