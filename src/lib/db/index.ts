import { database, checked } from './client';
import { hashPassword, verifyPassword } from '@/lib/crypto';

export * from './types';
export { hashPassword, verifyPassword };

export const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001';

export { SettingsDB } from './settings';

export const WorkspacesDB = {
  async getById(workspaceId: string) {
    return checked(await database().from('workspaces').select('*').eq('id', workspaceId).maybeSingle());
  },
  async list() {
    return checked(await database().from('workspaces').select('*'));
  },
};

// ==============================================================================
// 2. CONTACTS REPOSITORY (Strict Tenant-Scoped)
// ==============================================================================
export { ContactsDB } from './contacts';

// ==============================================================================
// 2b. COMPANIES REPOSITORY
// ==============================================================================
export { CompaniesDB, TemplatesDB } from './business';

// ==============================================================================
// 3. MESSAGES & CONVERSATIONS REPOSITORY
// ==============================================================================
export { MessagesDB } from './messages';
export { ConversationsDB } from './conversations';
export { WorkflowsDB } from './workflows';
export { WebhookEventsDB } from './webhookEvents';
export { CampaignsDB } from './campaigns';
export { ScheduledJobsDB } from './scheduledJobs';

export { UsersDB } from './users';
export { DataDeletionDB } from './deletions';

export { WorkflowSessionsDB } from './workflows';

// ==============================================================================
// 11. WORKFLOW EXECUTIONS REPOSITORY (History, Traces & Observability)
// ==============================================================================
export { WorkflowExecutionsDB } from './workflows';
