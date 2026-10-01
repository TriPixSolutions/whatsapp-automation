import { randomUUID } from 'crypto';
import { database, checked } from './client';
import type { WorkflowDefinition, WorkflowExecutionLog, WorkflowSessionState } from '@/types/automations';

const DEFAULT_ID = process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';
const workspace = (id?: string) => !id || id === 'default' ? DEFAULT_ID : id;
const phone = (value: string) => `+${value.replace(/[^0-9]/g, '')}`;

function mapWorkflow(row: any): WorkflowDefinition {
  return { ...row.definition, id: row.id, workspaceId: row.workspace_id, name: row.name,
    isActive: row.is_active, executionCount: row.execution_count,
    createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapSession(row: any): WorkflowSessionState {
  return { ...row.session_data, id: row.id, workspaceId: row.workspace_id,
    phoneNumber: row.phone_number, workflowId: row.workflow_id, executionId: row.execution_id,
    currentNodeId: row.current_node_id, waitingFor: row.waiting_for,
    pausedAt: row.paused_at, expiresAt: row.expires_at };
}

function mapExecution(row: any): WorkflowExecutionLog {
  return { ...row.log_data, id: row.id, executionId: row.id, workflowId: row.workflow_id,
    workspaceId: row.workspace_id, phoneNumber: row.phone_number,
    status: row.status, startedAt: row.started_at, updatedAt: row.updated_at };
}

export const WorkflowsDB = {
  async list(workspaceId = DEFAULT_ID): Promise<WorkflowDefinition[]> {
    const rows = checked(await database().from('workflow_definitions').select('*')
      .eq('workspace_id', workspace(workspaceId)).order('updated_at', { ascending: false })) || [];
    return rows.map(mapWorkflow);
  },
  async get(id: string, workspaceId: string): Promise<WorkflowDefinition | null> {
    const row = checked(await database().from('workflow_definitions').select('*').eq('id', id)
      .eq('workspace_id', workspace(workspaceId)).maybeSingle());
    if (row) return mapWorkflow(row);
    if (id === 'wf_welcome_interactive') {
      try {
        const { buildProductionVipWorkflow } = await import('@/lib/automations/testCenterStore');
        const defaultWf = buildProductionVipWorkflow(workspaceId);
        return await this.save(defaultWf);
      } catch {
        return null;
      }
    }
    return null;
  },
  async save(definition: WorkflowDefinition): Promise<WorkflowDefinition> {
    const now = new Date().toISOString();
    const value = { ...definition, workspaceId: workspace(definition.workspaceId), updatedAt: now };
    const input = {
      id: value.id, workspace_id: value.workspaceId, name: value.name,
      is_active: value.isActive, execution_count: value.executionCount || 0,
      definition: value, created_at: value.createdAt || now, updated_at: now,
    };
    const existing = checked(await database().from('workflow_definitions').select('workspace_id')
      .eq('id', value.id).maybeSingle());
    if (existing && existing.workspace_id !== value.workspaceId) throw new Error('Workflow ID belongs to another workspace');
    const row = existing
      ? checked(await database().from('workflow_definitions').update(input).eq('id', value.id)
        .eq('workspace_id', value.workspaceId).select('*').single())
      : checked(await database().from('workflow_definitions').insert(input).select('*').single());
    return mapWorkflow(row);
  },
  async delete(id: string, workspaceId: string): Promise<boolean> {
    const rows = checked(await database().from('workflow_definitions').delete()
      .eq('id', id).eq('workspace_id', workspace(workspaceId)).select('id')) || [];
    return rows.length > 0;
  },
};

export const WorkflowSessionsDB = {
  async save(session: WorkflowSessionState): Promise<WorkflowSessionState> {
    const workspaceId = workspace(session.workspaceId);
    const cleanPhone = phone(session.phoneNumber);
    const row = checked(await database().from('workflow_sessions').upsert({
      id: session.id, workspace_id: workspaceId, phone_number: cleanPhone,
      workflow_id: session.workflowId, execution_id: session.executionId,
      current_node_id: session.currentNodeId, waiting_for: session.waitingFor,
      paused_at: session.pausedAt, expires_at: session.expiresAt,
      session_data: { ...session, workspaceId, phoneNumber: cleanPhone },
      claimed_at: null, claim_token: null, updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,phone_number' }).select('*').single());
    return mapSession(row);
  },
  async get(phoneNumber: string, workspaceId = DEFAULT_ID): Promise<WorkflowSessionState | null> {
    const id = workspace(workspaceId);
    const row = checked(await database().from('workflow_sessions').select('*')
      .eq('workspace_id', id).eq('phone_number', phone(phoneNumber)).maybeSingle());
    if (!row) return null;
    if (row.waiting_for !== 'delay' && Date.parse(row.expires_at) < Date.now()) {
      await this.delete(phoneNumber, id, row.id);
      return null;
    }
    // Safe lookup: Never delete the active customer session if workflow lookup fails!
    const workflow = await WorkflowsDB.get(row.workflow_id, id);
    if (!workflow) {
      console.warn(`[WorkflowSessionsDB] Workflow definition "${row.workflow_id}" not found in DB for session "${row.id}". Preserving session state.`);
    }
    return mapSession(row);
  },
  async delete(phoneNumber: string, workspaceId = DEFAULT_ID, expectedId?: string): Promise<boolean> {
    let query = database().from('workflow_sessions').delete().eq('workspace_id', workspace(workspaceId))
      .eq('phone_number', phone(phoneNumber));
    if (expectedId) query = query.eq('id', expectedId);
    const rows = checked(await query.select('id')) || [];
    return rows.length > 0;
  },
  async list(workspaceId = DEFAULT_ID): Promise<WorkflowSessionState[]> {
    const rows = checked(await database().from('workflow_sessions').select('*')
      .eq('workspace_id', workspace(workspaceId)).order('paused_at', { ascending: false })) || [];
    return rows.filter((row: any) => row.waiting_for === 'delay' || Date.parse(row.expires_at) > Date.now()).map(mapSession);
  },
  async claimDueDelays(limit = 10): Promise<Array<WorkflowSessionState & { claimToken: string }>> {
    const claimToken = randomUUID();
    const rows = checked(await database().rpc('claim_due_workflow_delays', { p_limit: limit, p_claim_token: claimToken })) || [];
    return rows.map((row: any) => ({ ...mapSession(row), claimToken }));
  },
  async releaseClaim(sessionId: string, claimToken: string): Promise<void> {
    checked(await database().from('workflow_sessions').update({ claimed_at: null, claim_token: null,
      updated_at: new Date().toISOString() }).eq('id', sessionId).eq('claim_token', claimToken));
  },
};

export const WorkflowExecutionsDB = {
  async get(executionId: string, workspaceId: string): Promise<WorkflowExecutionLog | null> {
    const row = checked(await database().from('workflow_executions').select('*').eq('id', executionId)
      .eq('workspace_id', workspace(workspaceId)).maybeSingle());
    return row ? mapExecution(row) : null;
  },
  async save(log: WorkflowExecutionLog): Promise<WorkflowExecutionLog> {
    const input = {
      id: log.executionId || log.id, workspace_id: workspace(log.workspaceId), workflow_id: log.workflowId,
      phone_number: phone(log.phoneNumber), contact_id: log.contactId || null, status: log.status,
      started_at: log.startedAt, completed_at: log.completedAt || null, log_data: log,
      updated_at: new Date().toISOString(),
    };
    const existing = checked(await database().from('workflow_executions').select('workspace_id')
      .eq('id', input.id).maybeSingle());
    if (existing && existing.workspace_id !== input.workspace_id) throw new Error('Execution ID belongs to another workspace');
    const row = existing
      ? checked(await database().from('workflow_executions').update(input).eq('id', input.id)
        .eq('workspace_id', input.workspace_id).select('*').single())
      : checked(await database().from('workflow_executions').insert(input).select('*').single());
    return mapExecution(row);
  },
  async list(filters: { workspaceId: string; workflowId?: string; phoneNumber?: string; limit?: number }): Promise<WorkflowExecutionLog[]> {
    let query = database().from('workflow_executions').select('*').eq('workspace_id', workspace(filters.workspaceId));
    if (filters.workflowId) query = query.eq('workflow_id', filters.workflowId);
    if (filters.phoneNumber) query = query.eq('phone_number', phone(filters.phoneNumber));
    const rows = checked(await query.order('started_at', { ascending: false }).limit(Math.min(filters.limit || 50, 500))) || [];
    return rows.map(mapExecution);
  },
};
