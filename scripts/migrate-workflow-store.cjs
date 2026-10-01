// One-time bridge from the legacy local JSON store to the durable workflow tables.
// Read-only by default. Pass --apply only after applying the workflow runtime migration.
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { createClient } = require('@supabase/supabase-js');

const storePath = path.resolve(process.cwd(), 'data', 'test_center_store.json');
const apply = process.argv.includes('--apply');
const defaultWorkspace = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
const normalizeWorkspace = value => !value || value === 'default' ? defaultWorkspace : value;
const normalizePhone = value => `+${String(value || '').replace(/[^0-9]/g, '')}`;

(async () => {
  if (!fs.existsSync(storePath)) throw new Error('Legacy workflow store was not found');
  const state = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const workflows = Object.values(state.workflows || {});
  const executions = state.executionLogs || [];
  const sessions = Object.values(state.workflowSessions || {});
  console.log(`Legacy store: ${workflows.length} workflows, ${executions.length} executions, ${sessions.length} sessions`);
  if (!apply) {
    console.log('Dry run only. Apply the database migration, then rerun with --apply.');
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase URL and service-role key are required');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const checked = async promise => { const result = await promise; if (result.error) throw new Error(result.error.message); return result.data; };
  const workflowIds = new Set(workflows.map(item => item.id));
  for (const item of workflows) {
    const workspaceId = normalizeWorkspace(item.workspaceId);
    await checked(db.from('workflow_definitions').upsert({ id: item.id, workspace_id: workspaceId,
      name: item.name || 'Untitled Workflow', is_active: item.isActive !== false,
      execution_count: item.executionCount || 0, definition: { ...item, workspaceId },
      created_at: item.createdAt || new Date().toISOString(), updated_at: item.updatedAt || new Date().toISOString(),
    }, { onConflict: 'id' }));
  }
  for (const item of executions.filter(value => workflowIds.has(value.workflowId))) {
    await checked(db.from('workflow_executions').upsert({ id: item.executionId || item.id,
      workspace_id: normalizeWorkspace(item.workspaceId), workflow_id: item.workflowId,
      phone_number: normalizePhone(item.phoneNumber), contact_id: item.contactId || null,
      status: item.status, started_at: item.startedAt, completed_at: item.completedAt || null,
      log_data: item, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' }));
  }
  for (const item of sessions.filter(value => workflowIds.has(value.workflowId))) {
    const workspaceId = normalizeWorkspace(item.workspaceId);
    const phoneNumber = normalizePhone(item.phoneNumber);
    await checked(db.from('workflow_sessions').upsert({ id: item.id, workspace_id: workspaceId,
      phone_number: phoneNumber, workflow_id: item.workflowId, execution_id: item.executionId,
      current_node_id: item.currentNodeId, waiting_for: item.waitingFor,
      paused_at: item.pausedAt, expires_at: item.expiresAt,
      session_data: { ...item, workspaceId, phoneNumber }, updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,phone_number' }));
  }
  console.log('Legacy workflow state migrated successfully. Keep the JSON file as a backup until live verification passes.');
})().catch(error => { console.error(`Migration failed: ${error.message}`); process.exitCode = 1; });
