export type UserRole = 'super_admin' | 'owner' | 'admin' | 'manager' | 'employee' | 'user';
export type UserStatus = 'new_user' | 'pending_approval' | 'approved' | 'rejected' | 'unrequested';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  role: UserRole;
  status: UserStatus;
  company?: string | null;
  intended_use?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Workspace {
  id: string;
  name: string;
  subdomain?: string | null;
  owner_id?: string | null;
  custom_subdomain?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
  created_at: string;
  updated_at?: string;
  user?: User;
}

export interface MetaConnection {
  id: string;
  workspace_id: string;
  waba_id: string;
  business_id?: string | null;
  app_id?: string | null;
  access_token_encrypted: string;
  webhook_verify_token: string;
  token_expires_at?: string | null;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
  catalog_id?: string | null;
  ad_account_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PhoneNumber {
  id: string;
  workspace_id: string;
  phone_number_id: string;
  display_phone_number: string;
  verified_name?: string | null;
  quality_rating: string;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  phone_number: string;
  phoneNumber?: string; // backward compat
  first_name?: string | null;
  firstName?: string | null; // backward compat
  last_name?: string | null;
  lastName?: string | null; // backward compat
  tags: string[];
  optin_status: boolean;
  optinStatus?: boolean; // backward compat
  metadata?: Record<string, any> | null;
  created_at: string;
  createdAt?: string; // backward compat
  updated_at?: string;
}

export type ConversationState = 'open' | 'closed' | 'expired' | 'archived';

export interface Conversation {
  id: string;
  workspace_id: string;
  contact_id: string;
  phone_number: string;
  last_inbound_at?: string | null;
  last_outbound_at?: string | null;
  window_expires_at?: string | null;
  state: ConversationState;
  assigned_agent_id?: string | null;
  unread_count: number;
  created_at: string;
  updated_at?: string;
  contact?: Contact | null;
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'template'
  | 'button'
  | 'list'
  | 'carousel'
  | 'catalog'
  | 'interactive';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageLog {
  id: string;
  workspace_id: string;
  conversation_id?: string | null;
  contact_id?: string | null;
  phone_number: string;
  meta_message_id?: string | null;
  direction: MessageDirection;
  type: MessageType;
  status: MessageStatus;
  content: string;
  media_url?: string | null;
  payload?: any;
  error_message?: string | null;
  created_at: string;
  updated_at?: string;
  contact?: Contact | null;
}

export interface InteractiveButton {
  id: string;
  title: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface ActionPayload {
  header?: string;
  body: string;
  footer?: string;
  buttonText?: string;
  buttons?: InteractiveButton[];
  sections?: ListSection[];
  cards?: {
    headerImage?: string;
    title: string;
    description: string;
    buttons: InteractiveButton[];
  }[];
}

export type AutomationTriggerType =
  | 'keyword'
  | 'button_reply'
  | 'list_reply'
  | 'lead_created'
  | 'tag_added'
  | 'inbound_any';

export type AutomationStepType =
  | 'trigger'
  | 'condition'
  | 'wait'
  | 'message'
  | 'image'
  | 'tag'
  | 'assign'
  | 'webhook'
  | 'end';

export interface AutomationStep {
  id: string;
  automation_id: string;
  step_order: number;
  step_type: AutomationStepType;
  payload: Record<string, any>;
  created_at: string;
}

export interface AutomationFlow {
  id: string;
  workspace_id: string;
  name: string;
  trigger_keyword?: string; // backward compat
  trigger_type: AutomationTriggerType;
  trigger_value: string;
  action_type?: 'text' | 'buttons' | 'list' | 'carousel'; // backward compat
  action_payload?: ActionPayload; // backward compat
  is_active: boolean;
  execution_count?: number;
  steps?: AutomationStep[];
  created_at: string;
  updated_at?: string;
}

export interface MetaTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED';
  body: string;
  header?: any;
  footer?: string | null;
  buttons?: { type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; [key: string]: any }[];
}

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  campaign_name?: string; // backward compat
  template_name: string;
  target_tag?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'paused' | 'failed' | 'stopped';
  total_recipients?: number;
  sent_count?: number;
  delivered_count?: number;
  read_count?: number;
  failed_count?: number;
  variables?: Record<string, any>;
  scheduled_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  workspace_id: string;
  source_id?: string | null;
  contact_id?: string | null;
  phone_number: string;
  first_name?: string | null;
  last_name?: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface MediaAsset {
  id: string;
  workspace_id: string;
  meta_media_id?: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash?: string | null;
  storage_path: string;
  public_url: string;
  created_at: string;
}

export interface ScheduledJob {
  id: string;
  workspace_id: string;
  job_type: 'follow_up' | 'campaign_batch' | 'window_check' | 'sync';
  reference_id: string;
  payload: Record<string, any>;
  scheduled_at: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';
  executed_at?: string | null;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  workspace_id?: string | null;
  meta_event_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'received' | 'processed' | 'ignored' | 'failed';
  created_at: string;
}
