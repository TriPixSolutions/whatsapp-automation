import { encryptToken, decryptToken } from '@/lib/crypto';
import { database, checked } from './client';
import type { WorkspaceSettings } from './types';

const DEFAULT_ID = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
export const normalizeWorkspaceId = (id: string) => id === 'default' ? DEFAULT_ID : id;

export const SettingsDB = {
  async get(workspaceId: string = DEFAULT_ID): Promise<WorkspaceSettings> {
    const id = normalizeWorkspaceId(workspaceId);
    const db = database();
    const results = await Promise.all([
      db.from('workspaces').select('*').eq('id', id).maybeSingle(),
      db.from('meta_connections').select('*').eq('workspace_id', id).maybeSingle(),
      db.from('phone_numbers').select('*').eq('workspace_id', id).eq('is_default', true).maybeSingle(),
    ]);
    const [workspace, connection, phone] = results.map(checked);
    const env: Record<string, string | undefined> = id === DEFAULT_ID ? process.env : {};
    return {
      id, name: workspace?.name || 'Workspace',
      wabaId: connection?.waba_id ?? env.META_WABA_ID ?? '',
      phoneNumberId: phone?.phone_number_id ?? env.META_PHONE_NUMBER_ID ?? '',
      accessToken: decryptToken(connection?.access_token_encrypted ?? env.META_ACCESS_TOKEN ?? ''),
      appSecret: decryptToken(connection?.app_secret_encrypted ?? env.META_APP_SECRET ?? ''),
      verifyToken: connection?.webhook_verify_token ?? env.META_WEBHOOK_VERIFY_TOKEN ?? '',
      appId: connection?.app_id ?? env.META_APP_ID ?? '',
      catalogId: connection?.catalog_id ?? '', adAccountId: connection?.ad_account_id ?? '',
      customSubdomain: workspace?.custom_subdomain ?? '',
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhook/whatsapp`,
      createdAt: workspace?.created_at || new Date().toISOString(),
      updatedAt: connection?.updated_at || workspace?.updated_at || new Date().toISOString(),
    };
  },
  async getByWabaId(wabaId: string): Promise<WorkspaceSettings | null> {
    if (!wabaId) return null;
    const cleanWaba = wabaId.trim();
    const row = checked(await database().from('meta_connections').select('workspace_id').eq('waba_id', cleanWaba).maybeSingle());
    if (row?.workspace_id) return this.get(row.workspace_id);
    return null; // Strict tenant isolation: NO DEFAULT WORKSPACE FALLBACK
  },
  async getByPhoneNumberId(phoneNumberId: string): Promise<WorkspaceSettings | null> {
    if (!phoneNumberId) return null;
    const cleanPhoneId = phoneNumberId.trim();
    const row = checked(await database().from('phone_numbers').select('workspace_id').eq('phone_number_id', cleanPhoneId).maybeSingle());
    if (row?.workspace_id) {
      const conn = checked(await database().from('meta_connections').select('workspace_id, waba_id').eq('workspace_id', row.workspace_id).maybeSingle());
      if (conn) {
        const settings = await this.get(row.workspace_id);
        return { ...settings, phoneNumberId: cleanPhoneId };
      }
    }
    return null; // Strict tenant isolation: NO DEFAULT WORKSPACE FALLBACK
  },
  async getByVerifyToken(token: string): Promise<WorkspaceSettings | null> {
    if (!token) return null;
    const rows = checked(await database().from('meta_connections').select('workspace_id').eq('webhook_verify_token', token).limit(1));
    if (rows?.[0]) return this.get(rows[0].workspace_id);
    return process.env.META_WEBHOOK_VERIFY_TOKEN === token ? this.get(DEFAULT_ID) : null;
  },
  async update(partial: Partial<WorkspaceSettings>, workspaceId: string = DEFAULT_ID): Promise<WorkspaceSettings> {
    const id = normalizeWorkspaceId(workspaceId);
    const current = await this.get(id);
    const changes = Object.fromEntries(Object.entries(partial).filter(([, value]) => value !== undefined));
    const updated = { ...current, ...changes, id, updatedAt: new Date().toISOString() };
    const db = database();
    checked(await db.from('workspaces').upsert({ id, name: updated.name, custom_subdomain: updated.customSubdomain || null,
      updated_at: updated.updatedAt }, { onConflict: 'id' }));
    checked(await db.from('meta_connections').upsert({
      workspace_id: id, waba_id: updated.wabaId, access_token_encrypted: encryptToken(updated.accessToken),
      app_secret_encrypted: encryptToken(updated.appSecret || ''), webhook_verify_token: updated.verifyToken,
      app_id: updated.appId, catalog_id: updated.catalogId, ad_account_id: updated.adAccountId,
      status: updated.accessToken && updated.phoneNumberId ? 'connected' : 'disconnected', updated_at: updated.updatedAt,
    }, { onConflict: 'workspace_id' }));
    if (updated.phoneNumberId !== current.phoneNumberId) {
      // A phone ID already owned by another tenant must never be reassigned.
      const existing = checked(await db.from('phone_numbers').select('workspace_id').eq('phone_number_id', updated.phoneNumberId).maybeSingle());
      if (existing && existing.workspace_id !== id) throw new Error('Phone number belongs to another workspace');
      if (updated.phoneNumberId) {
        if (existing) {
          checked(await db.from('phone_numbers').update({ is_default: true }).eq('phone_number_id', updated.phoneNumberId).eq('workspace_id', id));
        } else {
          checked(await db.from('phone_numbers').insert({ workspace_id: id, phone_number_id: updated.phoneNumberId, display_phone_number: '', is_default: true }));
        }
      }
      if (current.phoneNumberId) checked(await db.from('phone_numbers').delete().eq('workspace_id', id).eq('phone_number_id', current.phoneNumberId));
    }
    return this.get(id);
  },
};
