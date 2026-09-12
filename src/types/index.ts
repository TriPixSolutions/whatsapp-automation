export type Workspace = {
  id: string;
  name: string;
  meta_access_token?: string | null;
  phone_number_id?: string | null;
  waba_id?: string | null;
  webhook_verify_token?: string | null;
  created_at: string;
  updated_at?: string;
};

export type Contact = {
  id: string;
  workspace_id: string;
  phone_number: string;
  first_name?: string | null;
  last_name?: string | null;
  tags: string[];
  optin_status: boolean;
  created_at: string;
  updated_at?: string;
};

export type Campaign = {
  id: string;
  workspace_id: string;
  campaign_name: string;
  template_name: string;
  target_tag?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_recipients?: number;
  sent_count?: number;
  failed_count?: number;
  created_at: string;
  completed_at?: string | null;
};

export type MessageLog = {
  id: string;
  workspace_id: string;
  contact_id?: string | null;
  message_meta_id?: string | null;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'template' | 'interactive';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  payload?: any;
  created_at: string;
  contact?: Contact | null;
};

export type InteractiveButton = {
  id: string;
  title: string;
};

export type ActionPayload = {
  header?: string;
  body: string;
  footer?: string;
  buttons?: InteractiveButton[];
  sections?: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[];
};

export type AutomationFlow = {
  id: string;
  workspace_id: string;
  trigger_keyword: string;
  action_type: 'text' | 'buttons' | 'list';
  action_payload: ActionPayload;
  is_active: boolean;
  created_at: string;
};

export type MetaTemplate = {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  body: string;
  header?: string;
  footer?: string;
  buttons?: { type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string }[];
};
