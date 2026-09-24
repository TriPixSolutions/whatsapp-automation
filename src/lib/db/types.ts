import {
  User,
  Workspace,
  WorkspaceMember,
  MetaConnection,
  PhoneNumber,
  Contact as BaseContact,
  Conversation,
  MessageLog,
  MessageDirection,
  MessageType,
  MessageStatus,
  AutomationFlow as BaseAutomationFlow,
  AutomationStep,
  Campaign as BaseCampaign,
  Lead,
  MediaAsset,
  ScheduledJob,
  WebhookEvent,
  UserRole,
  UserStatus,
} from '@/types';

export * from '@/types';

export interface WorkspaceSettings {
  id: string;
  name: string;
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
  catalogId?: string;
  appId?: string;
  appSecret?: string;
  adAccountId?: string;
  tokenExpiresAt?: string;
  adminUsername?: string;
  adminPassword?: string;
  customSubdomain?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  workspaceId?: string;
  workspace_id?: string;
  phoneNumber: string;
  phone_number?: string;
  firstName: string;
  first_name?: string;
  lastName: string;
  last_name?: string;
  tags: string[];
  optinStatus: boolean;
  optin_status?: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  workspaceId?: string;
  workspace_id?: string;
  conversationId?: string;
  metaMessageId?: string;
  meta_message_id?: string;
  phoneNumber: string;
  phone_number?: string;
  contactId?: string;
  contact_id?: string;
  direction: MessageDirection;
  type: MessageType;
  status: MessageStatus;
  content: string;
  mediaUrl?: string;
  media_url?: string;
  payload?: any;
  errorMessage?: string;
  error_message?: string;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export type FlowTriggerType = 'keyword' | 'button_click' | 'list_selection' | 'exact_match' | 'lead_created';
export type FlowActionType = 'text' | 'buttons' | 'list' | 'carousel';

export interface ButtonActionPayload {
  header?: string;
  body: string;
  footer?: string;
  buttons: { id: string; title: string }[];
}

export interface ListActionPayload {
  header?: string;
  body: string;
  footer?: string;
  buttonText: string;
  sections: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[];
}

export interface CarouselCard {
  headerImage?: string;
  title: string;
  description: string;
  buttons: { id: string; title: string }[];
}

export interface CarouselActionPayload {
  bodyText: string;
  cards: CarouselCard[];
}

export interface TextActionPayload {
  text: string;
}

export interface AutomationFlow {
  id: string;
  workspaceId?: string;
  workspace_id?: string;
  name: string;
  triggerKeyword: string;
  trigger_keyword?: string;
  triggerType: FlowTriggerType;
  trigger_type?: string;
  trigger_value?: string;
  actionType: FlowActionType;
  action_type?: string;
  actionPayload: TextActionPayload | ButtonActionPayload | ListActionPayload | CarouselActionPayload;
  action_payload?: any;
  isActive: boolean;
  is_active?: boolean;
  executionCount: number;
  execution_count?: number;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Campaign {
  id: string;
  workspaceId?: string;
  workspace_id?: string;
  name: string;
  campaign_name?: string;
  templateName: string;
  template_name?: string;
  targetTag: string;
  target_tag?: string;
  status: 'pending' | 'processing' | 'completed' | 'paused' | 'failed' | 'stopped';
  totalRecipients: number;
  total_recipients?: number;
  sentCount: number;
  sent_count?: number;
  deliveredCount: number;
  delivered_count?: number;
  readCount: number;
  read_count?: number;
  repliedCount?: number;
  failedCount: number;
  failed_count?: number;
  variables?: Record<string, string>;
  scheduledAt?: string;
  createdAt: string;
  created_at?: string;
  completedAt?: string;
  completed_at?: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash?: string;
  password_hash?: string;
  name: string;
  avatarUrl?: string;
  avatar_url?: string;
  provider?: 'email' | 'google';
  role: UserRole;
  status: UserStatus;
  company?: string;
  intendedUse?: string;
  intended_use?: string;
  requestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  lastLoginAt?: string;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface ActivityLogItem {
  id: string;
  type:
    | 'user_signup'
    | 'access_request'
    | 'user_approved'
    | 'user_rejected'
    | 'role_changed'
    | 'message_sent'
    | 'campaign_dispatched';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AdminMetrics {
  totalApprovedUsers: number;
  totalPendingRequests: number;
  totalMessagesSent: number;
  totalMetaAdsSpend: number;
  totalContacts?: number;
  totalCampaigns?: number;
  totalAutomations?: number;
  recentActivity: ActivityLogItem[];
}

export interface DataDeletionRecord {
  id: string;
  confirmationCode: string;
  userId?: string;
  email?: string;
  status: 'completed' | 'pending';
  details: string;
  requestedAt: string;
  completedAt?: string;
}

export interface IntegrationRecord {
  id: string;
  userId: string;
  platform: 'shopify' | 'woocommerce';
  storeName?: string;
  accessToken?: string;
  siteUrl?: string;
  consumerKey?: string;
  consumerSecret?: string;
  webhookSecret?: string;
  connectedAt: string;
  updatedAt: string;
}
