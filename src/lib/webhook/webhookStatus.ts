import { MessagesDB, MessageStatus } from '@/lib/db';

export interface MetaStatusObject {
  id: string;
  status: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: any[];
}

/**
 * Handles Meta Webhook status receipts (sent, delivered, read, failed)
 */
export function handleWebhookStatuses(statuses: MetaStatusObject[]) {
  if (!Array.isArray(statuses) || statuses.length === 0) return;

  for (const statusObj of statuses) {
    const metaId = statusObj.id;
    const statusValue = statusObj.status as MessageStatus;

    if (['sent', 'delivered', 'read', 'failed'].includes(statusValue)) {
      console.log(`[Meta Webhook] Status update for message ${metaId}: ${statusValue}`);
      MessagesDB.updateStatus(metaId, statusValue);
    }
  }
}
