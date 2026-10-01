import { database, checked } from '@/lib/db/client';
import { SettingsDB } from '@/lib/db/settings';
import type { WorkspaceSettings } from '@/lib/db/types';

export interface WorkspaceResolutionResult {
  success: boolean;
  workspaceId?: string;
  workspaceName?: string;
  wabaId?: string;
  appId?: string;
  displayPhoneNumber?: string;
  settings?: WorkspaceSettings;
  error?: string;
  code?: 'PHONE_NOT_FOUND' | 'WABA_MISMATCH' | 'WORKSPACE_NOT_FOUND' | 'SETTINGS_ERROR' | 'INVALID_INPUT';
}

/**
 * Deterministically resolves a workspace from a WhatsApp Cloud API phone_number_id.
 * 
 * Rules (per Section 4 of Architecture Spec):
 * 1. Exact phone_number_id match against phone_numbers table
 * 2. Verify WABA belongs to the workspace via meta_connections table
 * 3. Verify workspace exists and is active in workspaces table
 * 4. Return workspace and settings
 * 5. Fail safely with structured error if any check fails
 * 
 * CRITICAL: NO DEFAULT WORKSPACE FALLBACK.
 */
export async function resolveWorkspaceFromPhoneNumberId(
  phoneNumberId: string,
  incomingWabaId?: string
): Promise<WorkspaceResolutionResult> {
  const cleanPhoneId = (phoneNumberId || '').trim();
  if (!cleanPhoneId) {
    return {
      success: false,
      error: 'Missing phone_number_id for workspace resolution.',
      code: 'INVALID_INPUT',
    };
  }

  const db = database();

  // Rule 1: Exact phone_number_id match in phone_numbers table
  let phoneRow: any = null;
  try {
    phoneRow = checked(
      await db
        .from('phone_numbers')
        .select('workspace_id, phone_number_id, display_phone_number, verified_name')
        .eq('phone_number_id', cleanPhoneId)
        .maybeSingle()
    );
  } catch (err: any) {
    return {
      success: false,
      error: `Database lookup failed for phone_number_id "${cleanPhoneId}": ${err.message}`,
      code: 'SETTINGS_ERROR',
    };
  }

  if (!phoneRow || !phoneRow.workspace_id) {
    return {
      success: false,
      error: `No registered workspace found for WhatsApp Phone Number ID "${cleanPhoneId}". Rejecting inbound webhook event safely.`,
      code: 'PHONE_NOT_FOUND',
    };
  }

  const targetWorkspaceId = phoneRow.workspace_id;

  // Rule 2: Verify WABA and Meta App belong to this workspace
  let connRow: any = null;
  try {
    connRow = checked(
      await db
        .from('meta_connections')
        .select('workspace_id, waba_id, app_id, status')
        .eq('workspace_id', targetWorkspaceId)
        .maybeSingle()
    );
  } catch (err: any) {
    return {
      success: false,
      error: `Database lookup failed for meta_connections in workspace "${targetWorkspaceId}": ${err.message}`,
      code: 'SETTINGS_ERROR',
    };
  }

  if (incomingWabaId && connRow?.waba_id) {
    const cleanIncomingWaba = incomingWabaId.trim();
    const cleanStoredWaba = connRow.waba_id.trim();
    if (cleanIncomingWaba !== cleanStoredWaba) {
      return {
        success: false,
        error: `WABA ID mismatch: Webhook entry WABA "${cleanIncomingWaba}" does not match workspace connection WABA "${cleanStoredWaba}".`,
        code: 'WABA_MISMATCH',
      };
    }
  }

  // Rule 3: Verify workspace exists in workspaces table
  let wsRow: any = null;
  try {
    wsRow = checked(
      await db
        .from('workspaces')
        .select('id, name')
        .eq('id', targetWorkspaceId)
        .maybeSingle()
    );
  } catch (err: any) {
    return {
      success: false,
      error: `Database lookup failed for workspace "${targetWorkspaceId}": ${err.message}`,
      code: 'SETTINGS_ERROR',
    };
  }

  if (!wsRow) {
    return {
      success: false,
      error: `Workspace "${targetWorkspaceId}" was referenced by phone_number_id "${cleanPhoneId}" but does not exist in workspaces table.`,
      code: 'WORKSPACE_NOT_FOUND',
    };
  }

  // Rule 4: Fetch full workspace settings
  let settings: WorkspaceSettings;
  try {
    settings = await SettingsDB.get(targetWorkspaceId);
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to load settings for workspace "${targetWorkspaceId}": ${err.message}`,
      code: 'SETTINGS_ERROR',
    };
  }

  return {
    success: true,
    workspaceId: targetWorkspaceId,
    workspaceName: wsRow.name,
    wabaId: connRow?.waba_id || settings.wabaId,
    appId: connRow?.app_id || settings.appId,
    displayPhoneNumber: phoneRow.display_phone_number,
    settings,
  };
}
