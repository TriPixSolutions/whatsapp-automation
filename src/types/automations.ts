// ==============================================================================
// WHATSAPP AUTOMATION PLATFORM 2.0 - COMPREHENSIVE TYPE DEFINITIONS
// ==============================================================================

export type AutomationTriggerType =
  | 'incoming_message'
  | 'keyword'
  | 'exact_match'
  | 'contains_text'
  | 'new_contact'
  | 'meta_lead_form'
  | 'facebook_lead'
  | 'instagram_lead'
  | 'manual_trigger'
  | 'scheduled_trigger'
  | 'delay_trigger'
  | 'contact_tag'
  | 'broadcast_reply'
  | 'first_message'
  | 'customer_reply'
  | 'webhook_trigger'
  | 'api_trigger'
  | 'imported_contact'
  | 'button_click'
  | 'carousel_click'
  | 'qr_scan';

export type PlatformMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'pdf'
  | 'template'
  | 'interactive_button'
  | 'quick_reply'
  | 'list'
  | 'carousel'
  | 'cta_button'
  | 'product'
  | 'product_carousel'
  | 'contact_card'
  | 'location'
  | 'coupon';

export type WorkflowActionType =
  | 'delay_minutes'
  | 'delay_hours'
  | 'delay_days'
  | 'if_else'
  | 'conditional_logic'
  | 'tag_contact'
  | 'remove_tag'
  | 'update_contact'
  | 'assign_lead'
  | 'send_notification'
  | 'stop_workflow'
  | 'jump_to_step'
  | 'split_workflow'
  | 'random_split'
  | 'ab_testing'
  | 'webhook_request'
  | 'api_request'
  | 'google_sheet_update'
  | 'crm_update'
  | 'create_task'
  | 'send_message';

export type NodeExecutionStatus =
  | 'queued'
  | 'started'
  | 'trigger_fired'
  | 'node_executed'
  | 'message_sent'
  | 'message_delivered'
  | 'message_read'
  | 'node_paused'
  | 'waiting_user_action'
  | 'workflow_resumed'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface VisualWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  animated?: boolean;
}

export type VisualNodeType =
  // 16 Core Standards Requested by User
  | 'trigger'
  | 'message'
  | 'delay'
  | 'condition'
  | 'button'
  | 'list'
  | 'carousel'
  | 'flow'
  | 'ai_agent'
  | 'api_request'
  | 'webhook'
  | 'tag'
  | 'assign_agent'
  | 'wait'
  | 'branch'
  | 'end'
  // Specific & Aliased Triggers
  | 'trigger_incoming'
  | 'trigger_keyword'
  | 'trigger_button'
  | 'trigger_carousel'
  | 'trigger_list'
  | 'trigger_flow'
  // WhatsApp Messages & Actions
  | 'whatsapp_message'
  | 'whatsapp_button'
  | 'whatsapp_list'
  | 'whatsapp_carousel'
  | 'whatsapp_catalog'
  | 'whatsapp_flow'
  | 'message_media'
  | 'message_template'
  | 'message_location'
  // Logic & Routing
  | 'conditional_logic'
  | 'multi_branch'
  | 'wait_for_reply'
  // AI Nodes
  | 'ai'
  | 'ai_sentiment'
  | 'ai_smart_reply'
  | 'ai_handoff'
  // CRM & Contacts
  | 'crm_action'
  | 'lead_management'
  | 'tag_management'
  | 'crm_note'
  // External Integrations
  | 'google_sheets'
  | 'api_node'
  | 'webhook_node'
  | 'api';

export interface NodeValidationError {
  nodeId: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface WorkflowTreeNode {
  id: string;
  title: string;
  type: string;
  depth: number;
  branchLabel?: string;
  children: WorkflowTreeNode[];
  hasError?: boolean;
  errorMessage?: string;
}

export interface WorkflowNode {
  id: string;
  type: VisualNodeType | string;
  title: string;
  description?: string;
  triggerType?: AutomationTriggerType;
  triggerKeyword?: string;
  messageType?: PlatformMessageType;
  actionType?: WorkflowActionType;
  config: {
    // Message contents
    text?: string;
    mediaUrl?: string;
    caption?: string;
    fileName?: string;
    templateName?: string;
    languageCode?: string;
    templateParams?: Record<string, string>;
    headerText?: string;
    bodyText?: string;
    footerText?: string;
    buttonText?: string;
    buttons?: { id: string; title: string; type?: 'reply' | 'url' | 'call' | 'copy_code'; url?: string; phone?: string; code?: string }[];
    sections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
    cards?: {
      headerImage?: string;
      title: string;
      description: string;
      buttons: { id: string; title: string; url?: string }[];
    }[];
    // Catalog & Products
    catalogId?: string;
    retailerId?: string;
    productTitle?: string;
    productPrice?: string;
    productSubtitle?: string;
    // WhatsApp Flows
    flowId?: string;
    flowTitle?: string;
    flowCta?: string;
    flowScreen?: string;
    // Location / Contact / Coupon
    latitude?: number;
    longitude?: number;
    locationName?: string;
    locationAddress?: string;
    contactName?: string;
    contactPhone?: string;
    couponCode?: string;
    discountPercentage?: number;
    // Delays & Waiting
    delayAmount?: number;
    delayUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
    timeoutMinutes?: number;
    timeoutUnit?: 'minutes' | 'hours' | 'days';
    // Conditions & Branches
    conditionVariable?: string;
    conditionOperator?: 'equals' | 'contains' | 'not_equals' | 'exists' | 'greater_than' | 'less_than' | 'replied_within_24h';
    conditionValue?: string;
    trueNextNodeId?: string;
    falseNextNodeId?: string;
    splitRatio?: number;
    branches?: { id: string; label: string; conditionValue?: string }[];
    // Tagging / Lead Assign / CRM
    tag?: string;
    removeTag?: string;
    action?: 'add' | 'remove';
    assigneeEmail?: string;
    stage?: string;
    notes?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    leadStatus?: 'new' | 'contacted' | 'qualified' | 'disqualified' | 'converted';
    scoreIncrement?: number;
    leadValue?: number;
    // External integrations
    webhookUrl?: string;
    webhookMethod?: 'POST' | 'GET' | 'PUT' | 'DELETE';
    webhookHeaders?: Record<string, string>;
    webhookBody?: string;
    apiUrl?: string;
    apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    crmEntity?: string;
    sheetName?: string;
    operation?: 'append_row' | 'update_row' | 'lookup_row';
    columns?: Record<string, string>;
    taskTitle?: string;
    [key: string]: any;
  };
  position?: { x: number; y: number };
  nextNodeId?: string;
}

export interface WorkflowDefinition {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  triggerType: AutomationTriggerType;
  triggerKeyword: string;
  triggerMatchPattern?: 'exact' | 'contains' | 'starts_with' | 'regex';
  nodes: WorkflowNode[];
  edges?: VisualWorkflowEdge[];
  isActive: boolean;
  debugModeEnabled?: boolean;
  executionCount: number;
  stats?: {
    enteredCount: number;
    completedCount: number;
    droppedCount: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    clickedCount: number;
    repliedCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionTraceStep {
  nodeId: string;
  nodeType: string;
  nodeTitle: string;
  status: NodeExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  inputPayload?: any;
  outputResult?: any;
  metaCall?: {
    endpoint: string;
    requestPayload: any;
    responseStatus: number;
    responseData: any;
    metaMessageId?: string;
    errorCode?: number;
    errorMessage?: string;
  };
  error?: string;
}

export interface WorkflowSessionState {
  id: string;
  workspaceId: string;
  phoneNumber: string;
  contactId?: string;
  workflowId: string;
  executionId: string;
  currentNodeId: string;
  waitingFor: 'button_click' | 'reply' | 'carousel_selection' | 'delay';
  waitingOptions?: {
    id: string;
    title: string;
    index?: number;
    type?: string;
  }[];
  variables: Record<string, any>;
  pausedAt: string;
  resumedAt?: string;
  expiresAt: string;
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionLog {
  id: string;
  executionId: string;
  workflowId: string;
  workflowName: string;
  workspaceId: string;
  phoneNumber: string;
  contactId?: string;
  triggerType: AutomationTriggerType;
  triggerValue: string;
  status: 'running' | 'waiting' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentNodeId?: string;
  waitingFor?: string;
  waitingOptions?: any;
  startedAt: string;
  pausedAt?: string;
  resumedAt?: string;
  completedAt?: string;
  totalDurationMs: number;
  steps: ExecutionTraceStep[];
  metaResponses: {
    messageId?: string;
    status: string;
    timestamp: string;
    error?: string;
  }[];
  debugTrace?: Record<string, any>;
}

export interface MessageDeliveryReceipt {
  id: string;
  metaMessageId: string;
  phoneNumber: string;
  contactName?: string;
  workflowId?: string;
  messageType: PlatformMessageType;
  queuedAt: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  errorCode?: number;
  errorMessage?: string;
}

export interface MetaApiLog {
  id: string;
  workspaceId: string;
  timestamp: string;
  direction: 'outbound_request' | 'inbound_callback';
  endpoint: string;
  method: string;
  phoneNumberId?: string;
  wabaId?: string;
  messageId?: string;
  templateName?: string;
  templateLanguage?: string;
  httpStatus: number;
  requestBody: any;
  responseBody: any;
  deliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed';
  errorCode?: number;
  errorMessage?: string;
  latencyMs: number;
}

export interface WebhookLogItem {
  id: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  source: string;
  eventType: string;
  payload: any;
  responseStatus: number;
  responseBody: any;
  executionTimeMs: number;
  signatureVerified: boolean;
  status: 'success' | 'failed' | 'ignored';
  error?: string;
}

export interface ButtonTestEvent {
  id: string;
  timestamp: string;
  phoneNumber: string;
  buttonType: 'quick_reply' | 'url' | 'call' | 'copy_code';
  buttonId: string;
  buttonTitle: string;
  viewed: boolean;
  clicked: boolean;
  clickedAt?: string;
  responsePayload?: any;
}

export interface CarouselTestEvent {
  id: string;
  timestamp: string;
  phoneNumber: string;
  carouselTitle: string;
  totalCards: number;
  cardIndex: number;
  cardTitle: string;
  cardViewed: boolean;
  cardClicked: boolean;
  buttonClickedId?: string;
  buttonTitle?: string;
  clickedAt?: string;
}

export interface MetaValidationResult {
  timestamp: string;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  checklist: {
    id: string;
    name: string;
    description: string;
    status: 'pass' | 'fail' | 'warn';
    details: string;
    critical: boolean;
  }[];
  details: {
    webhookActive: boolean;
    webhookVerified: boolean;
    accessTokenValid: boolean;
    phoneNumberConnected: boolean;
    wabaConnected: boolean;
    permissionsAvailable: boolean;
    templateAvailable: boolean;
    apiReachable: boolean;
    qualityRating: string;
    verifiedName: string;
    displayPhoneNumber: string;
  };
}

export interface ProductionReadinessReport {
  timestamp: string;
  overallScore: number; // 0 - 100
  verdict: 'READY_FOR_PRODUCTION' | 'NEEDS_CONFIGURATION' | 'CRITICAL_FAILURES';
  checks: {
    category: string;
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    remediation?: string;
  }[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}
