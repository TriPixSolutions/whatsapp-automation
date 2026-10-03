import { randomUUID } from 'crypto';
import { database, checked } from './client';

const DEFAULT_ID = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
const workspace = (id: string) => id === 'default' ? DEFAULT_ID : id;

export type WebhookClaimResult = { state: 'claimed'; claimToken: string } | { state: 'processed' } | { state: 'busy' };

export const WebhookEventsDB = {
  async claim(metaEventId: string, eventType: string, payload: unknown, workspaceId = DEFAULT_ID): Promise<WebhookClaimResult> {
    if (!metaEventId) throw new Error('Webhook event ID is required');
    const claimToken = randomUUID();
    const state = checked(await database().rpc('claim_webhook_event', {
      p_workspace_id: workspace(workspaceId), p_meta_event_id: metaEventId,
      p_event_type: eventType, p_payload: payload, p_claim_token: claimToken,
    }));
    if (!['claimed', 'processed', 'busy'].includes(state)) throw new Error('Invalid webhook claim result');
    return state === 'claimed' ? { state, claimToken } : { state };
  },

  async complete(metaEventId: string, workspaceId: string, claimToken: string): Promise<void> {
    const rows = checked(await database().from('webhook_events').update({ status: 'processed', processed_at: new Date().toISOString(),
      last_error: null, updated_at: new Date().toISOString() }).eq('workspace_id', workspace(workspaceId))
      .eq('meta_event_id', metaEventId).eq('claim_token', claimToken).select('id')) || [];
    if (rows.length !== 1) throw new Error('Webhook claim was lost before completion');
  },

  async fail(metaEventId: string, workspaceId: string, claimToken: string, error: unknown): Promise<void> {
    const message = typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : 'Webhook processing failed';
    checked(await database().from('webhook_events').update({ status: 'failed', last_error: message.slice(0, 1000),
      claimed_at: null, claim_token: null, updated_at: new Date().toISOString() })
      .eq('workspace_id', workspace(workspaceId)).eq('meta_event_id', metaEventId).eq('claim_token', claimToken));
  },

  async latestProcessedAt(workspaceId = DEFAULT_ID): Promise<string | null> {
    const rows = checked(await database().from('webhook_events').select('processed_at')
      .eq('workspace_id', workspace(workspaceId)).eq('status', 'processed')
      .order('processed_at', { ascending: false }).limit(1)) || [];
    return rows[0]?.processed_at || null;
  },

  async list(workspaceId = DEFAULT_ID, limit = 50) {
    const rows = checked(await database().from('webhook_events').select('*')
      .eq('workspace_id', workspace(workspaceId))
      .order('created_at', { ascending: false }).limit(Math.min(Math.max(limit, 1), 200))) || [];
    return rows.map((row: any) => ({
      id: row.meta_event_id,
      workspaceId: row.workspace_id,
      timestamp: row.created_at,
      direction: 'incoming' as const,
      source: 'Meta WhatsApp Cloud API',
      eventType: row.event_type,
      payload: row.payload,
      responseStatus: row.status === 'failed' ? 500 : 200,
      responseBody: row.last_error ? { error: row.last_error } : { received: true },
      executionTimeMs: 0,
      signatureVerified: true,
      status: row.status === 'failed' ? 'failed' as const : row.status === 'ignored' ? 'ignored' as const : 'success' as const,
      error: row.last_error || undefined,
    }));
  },
};
