export interface WorkspaceSettings {
  id: string;
  name: string;
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
  adminUsername: string;
  adminPassword: string;
  customSubdomain: string;
  updatedAt: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  tags: string[];
  optinStatus: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'interactive' | 'template' | 'list' | 'carousel';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  metaMessageId?: string;
  phoneNumber: string;
  contactId?: string;
  direction: MessageDirection;
  type: MessageType;
  status: MessageStatus;
  content: string;
  payload?: any;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type FlowTriggerType = 'keyword' | 'button_click' | 'list_selection' | 'exact_match';
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
  name: string;
  triggerKeyword: string;
  triggerType: FlowTriggerType;
  actionType: FlowActionType;
  actionPayload: TextActionPayload | ButtonActionPayload | ListActionPayload | CarouselActionPayload;
  isActive: boolean;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  templateName: string;
  targetTag: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  variables?: Record<string, string>;
  createdAt: string;
  completedAt?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'agent' | 'user';
export type UserStatus = 'unrequested' | 'pending_approval' | 'approved' | 'rejected';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  avatarUrl?: string;
  provider: 'email' | 'google';
  role: UserRole;
  status: UserStatus;
  company?: string;
  intendedUse?: string;
  requestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogItem {
  id: string;
  type: 'user_signup' | 'access_request' | 'user_approved' | 'user_rejected' | 'role_changed' | 'message_sent' | 'campaign_dispatched';
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
  recentActivity: ActivityLogItem[];
}

