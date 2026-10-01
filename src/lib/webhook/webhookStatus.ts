import { MessagesDB, MessageStatus, DEFAULT_WORKSPACE_ID } from '@/lib/db';

export interface MetaStatusObject {
  id: string;
  status: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: any[];
}

/**
 * Handles Meta Webhook status receipts (sent, delivered, read, failed)
 * Persists status updates, records error codes on failure, without clearing unread incoming messages.
 */
export async function handleWebhookStatuses(statuses: MetaStatusObject[], workspaceId = DEFAULT_WORKSPACE_ID) {
  if (!Array.isArray(statuses) || statuses.length === 0) return;

  for (const statusObj of statuses) {
    const metaId = statusObj.id;
    const statusValue = statusObj.status as MessageStatus;

    if (['sent', 'delivered', 'read', 'failed'].includes(statusValue)) {
      const errorMsg =
        statusObj.errors?.[0]?.message ||
        statusObj.errors?.[0]?.title ||
        (statusObj.errors?.[0]?.code ? `Meta Error #${statusObj.errors[0].code}` : undefined);

      console.log(`[Meta Webhook] Status update for message ${metaId}: ${statusValue}${errorMsg ? ` (${errorMsg})` : ''}`);
      await MessagesDB.updateStatus(metaId, statusValue, errorMsg, workspaceId);

      // Sync to Workflow Test Center delivery tracker
      try {
        const { TestCenterStore } = require('@/lib/automations/testCenterStore');
        TestCenterStore.updateDeliveryStatus(metaId, statusValue, errorMsg);
      } catch {
        // non-blocking
      }


    }
  }
}

