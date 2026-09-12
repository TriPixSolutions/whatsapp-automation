import fs from 'fs';
import path from 'path';

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

interface DatabaseSchema {
  settings: WorkspaceSettings;
  contacts: Contact[];
  messages: Message[];
  automations: AutomationFlow[];
  campaigns: Campaign[];
  users: UserRecord[];
  activity: ActivityLogItem[];
}

// In-memory cache + persistent file storage
let memoryCache: DatabaseSchema | null = null;

function getDbFilePath(): string {
  // Check writable path
  const localDir = path.join(process.cwd(), 'data');
  const localPath = path.join(localDir, 'db.json');

  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    // Test write
    fs.accessSync(localDir, fs.constants.W_OK);
    return localPath;
  } catch (e) {
    // Fallback for Vercel / serverless lambda read-only root
    return path.join('/tmp', 'whatsapp_saas_db.json');
  }
}

function getDefaultSchema(): DatabaseSchema {
  return {
    settings: {
      id: 'default',
      name: 'Passion Fruit Production Workspace',
      wabaId: process.env.META_WABA_ID || '',
      phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
      accessToken: process.env.META_ACCESS_TOKEN || '',
      verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'passion_fruit_verify_token_2025',
      webhookUrl: 'https://whatsapp-auto-saas.vercel.app/api/webhook/whatsapp',
      adminUsername: 'User 1',
      adminPassword: '0725',
      customSubdomain: '',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    contacts: [],
    messages: [],
    automations: [
      {
        id: 'flow_show_me',
        name: 'Showcase Interactive Buttons Flow',
        triggerKeyword: 'Show me',
        triggerType: 'keyword',
        actionType: 'buttons',
        actionPayload: {
          header: 'Passion Fruit Private Showcase',
          body: 'Something big is coming soon. Discover our collection options below:',
          footer: 'Official WhatsApp Verified',
          buttons: [
            { id: 'btn_specs', title: 'Product Specs' },
            { id: 'btn_pricing', title: 'Pricing' },
            { id: 'btn_agent', title: 'Talk to Agent' },
          ],
        },
        isActive: true,
        executionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'flow_catalog_list',
        name: 'Product Catalog List Menu',
        triggerKeyword: 'Catalog',
        triggerType: 'keyword',
        actionType: 'list',
        actionPayload: {
          header: 'Product Catalog Menu',
          body: 'Please select a department from our official WhatsApp menu:',
          footer: 'Instant 1-Tap Access',
          buttonText: 'View Options',
          sections: [
            {
              title: 'Luxury Collections',
              rows: [
                { id: 'item_timepieces', title: 'Haute Horlogerie', description: 'Bespoke timepieces & grand complications' },
                { id: 'item_aviation', title: 'Private Aviation', description: 'Charter flights & fleet membership' },
              ],
            },
            {
              title: 'Support & Concierge',
              rows: [
                { id: 'item_concierge', title: 'Dedicated Concierge', description: 'Speak with an advisor 24/7' },
              ],
            },
          ],
        },
        isActive: true,
        executionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'flow_carousel_products',
        name: 'Featured Carousel Showcase',
        triggerKeyword: 'Products',
        triggerType: 'keyword',
        actionType: 'carousel',
        actionPayload: {
          bodyText: 'Explore our top featured items currently available:',
          cards: [
            {
              headerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
              title: 'Obsidian Chrono Edition',
              description: 'Titanium automatic movement with sapphire crystal face.',
              buttons: [{ id: 'card_buy_1', title: 'Order Item' }, { id: 'card_info_1', title: 'Learn More' }],
            },
            {
              headerImage: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80',
              title: 'Grand Complication Tourbillon',
              description: 'Platinum casing with manual-wind perpetual calendar.',
              buttons: [{ id: 'card_buy_2', title: 'Order Item' }, { id: 'card_info_2', title: 'Learn More' }],
            },
          ],
        },
        isActive: true,
        executionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    campaigns: [],
    users: [
      {
        id: 'user_super_admin_default',
        email: 'admin@passionfruit.io',
        name: 'User 1 (Super Admin)',
        provider: 'email',
        role: 'super_admin',
        status: 'approved',
        company: 'Passion Fruit Global HQ',
        intendedUse: 'Root Platform Administration',
        approvedAt: new Date().toISOString(),
        approvedBy: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    activity: [
      {
        id: 'act_1',
        type: 'user_approved',
        title: 'Super Admin Activated',
        description: 'User 1 initialized as Super Admin with approved status.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'act_2',
        type: 'message_sent',
        title: 'Meta Cloud API v18.0 Connected',
        description: 'Webhook verification token validated on /api/webhook/whatsapp.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function readDb(): DatabaseSchema {
  if (memoryCache) {
    return memoryCache;
  }

  const filePath = getDbFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      const defaults = getDefaultSchema();
      memoryCache = {
        ...defaults,
        ...parsed,
        settings: { ...defaults.settings, ...(parsed.settings || {}) },
        users: parsed.users && parsed.users.length > 0 ? parsed.users : defaults.users,
        activity: parsed.activity && parsed.activity.length > 0 ? parsed.activity : defaults.activity,
      };
      return memoryCache!;
    }
  } catch (e) {
    console.warn('[Database] Read failed, initializing defaults:', e);
  }

  const initial = getDefaultSchema();
  memoryCache = initial;
  writeDb(initial);
  return memoryCache;
}

function writeDb(data: DatabaseSchema): void {
  memoryCache = data;
  const filePath = getDbFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Database] Failed to write to disk:', e);
  }
}

// -----------------------------------------------------------------------------
// REPOSITORY 1: WORKSPACE SETTINGS
// -----------------------------------------------------------------------------
export const SettingsDB = {
  get(): WorkspaceSettings {
    const db = readDb();
    return db.settings;
  },

  update(partial: Partial<WorkspaceSettings>): WorkspaceSettings {
    const db = readDb();
    db.settings = {
      ...db.settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);
    return db.settings;
  },
};

// -----------------------------------------------------------------------------
// REPOSITORY 2: CONTACTS
// -----------------------------------------------------------------------------
export const ContactsDB = {
  list(filter?: { tag?: string; search?: string }): Contact[] {
    const db = readDb();
    let result = db.contacts || [];

    if (filter?.tag && filter.tag !== 'all') {
      const tagLower = filter.tag.toLowerCase();
      result = result.filter((c) => c.tags && c.tags.some((t) => t.toLowerCase() === tagLower));
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.phoneNumber.includes(q) ||
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getById(id: string): Contact | null {
    const db = readDb();
    return db.contacts.find((c) => c.id === id) || null;
  },

  getByPhone(phone: string): Contact | null {
    const db = readDb();
    const clean = phone.replace(/[^0-9]/g, '');
    return db.contacts.find((c) => c.phoneNumber.replace(/[^0-9]/g, '') === clean) || null;
  },

  upsert(contactData: {
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    tags?: string[];
    optinStatus?: boolean;
    metadata?: Record<string, any>;
  }): Contact {
    const db = readDb();
    const cleanPhone = contactData.phoneNumber.startsWith('+')
      ? `+${contactData.phoneNumber.replace(/[^0-9]/g, '')}`
      : `+${contactData.phoneNumber.replace(/[^0-9]/g, '')}`;

    const existingIdx = db.contacts.findIndex(
      (c) => c.phoneNumber.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
    );

    const now = new Date().toISOString();

    if (existingIdx >= 0) {
      const existing = db.contacts[existingIdx];
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...(contactData.tags || [])]));
      const updated: Contact = {
        ...existing,
        firstName: contactData.firstName ?? existing.firstName,
        lastName: contactData.lastName ?? existing.lastName,
        tags: mergedTags,
        optinStatus: contactData.optinStatus ?? existing.optinStatus,
        metadata: { ...(existing.metadata || {}), ...(contactData.metadata || {}) },
        updatedAt: now,
      };
      db.contacts[existingIdx] = updated;
      writeDb(db);
      return updated;
    } else {
      const newContact: Contact = {
        id: `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        phoneNumber: cleanPhone,
        firstName: contactData.firstName || '',
        lastName: contactData.lastName || '',
        tags: contactData.tags || [],
        optinStatus: contactData.optinStatus ?? true,
        metadata: contactData.metadata,
        createdAt: now,
        updatedAt: now,
      };
      db.contacts.unshift(newContact);
      writeDb(db);
      return newContact;
    }
  },

  delete(id: string): boolean {
    const db = readDb();
    const before = db.contacts.length;
    db.contacts = db.contacts.filter((c) => c.id !== id);
    if (db.contacts.length !== before) {
      writeDb(db);
      return true;
    }
    return false;
  },

  count(): number {
    const db = readDb();
    return db.contacts.length;
  },
};

// -----------------------------------------------------------------------------
// REPOSITORY 3: MESSAGES
// -----------------------------------------------------------------------------
export const MessagesDB = {
  list(options?: { phoneNumber?: string; limit?: number }): Message[] {
    const db = readDb();
    let result = db.messages || [];

    if (options?.phoneNumber) {
      const clean = options.phoneNumber.replace(/[^0-9]/g, '');
      result = result.filter((m) => m.phoneNumber.replace(/[^0-9]/g, '') === clean);
    }

    result = result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (options?.limit && options.limit > 0) {
      result = result.slice(-options.limit);
    }

    return result;
  },

  getRecentConversations(): {
    phoneNumber: string;
    contactName: string;
    lastMessage: string;
    lastTime: string;
    unread: number;
    status: MessageStatus;
  }[] {
    const db = readDb();
    const map = new Map<string, Message>();

    // Messages are sorted oldest to newest, so last write is latest
    for (const msg of db.messages) {
      map.set(msg.phoneNumber, msg);
    }

    const conversations = [];
    for (const [phone, latestMsg] of map.entries()) {
      const contact = ContactsDB.getByPhone(phone);
      const name = contact ? `${contact.firstName} ${contact.lastName}`.trim() || phone : phone;

      conversations.push({
        phoneNumber: phone,
        contactName: name,
        lastMessage: latestMsg.content || `[${latestMsg.type.toUpperCase()}]`,
        lastTime: latestMsg.createdAt,
        unread: latestMsg.direction === 'inbound' && latestMsg.status !== 'read' ? 1 : 0,
        status: latestMsg.status,
      });
    }

    return conversations.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
  },

  create(messageData: {
    metaMessageId?: string;
    phoneNumber: string;
    contactId?: string;
    direction: MessageDirection;
    type: MessageType;
    status?: MessageStatus;
    content: string;
    payload?: any;
    errorMessage?: string;
  }): Message {
    const db = readDb();
    const now = new Date().toISOString();
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      metaMessageId: messageData.metaMessageId || `wamid.${Date.now()}`,
      phoneNumber: messageData.phoneNumber,
      contactId: messageData.contactId,
      direction: messageData.direction,
      type: messageData.type,
      status: messageData.status || (messageData.direction === 'inbound' ? 'delivered' : 'sent'),
      content: messageData.content,
      payload: messageData.payload,
      errorMessage: messageData.errorMessage,
      createdAt: now,
      updatedAt: now,
    };

    db.messages.push(newMessage);
    writeDb(db);
    return newMessage;
  },

  updateStatus(metaMessageId: string, status: MessageStatus): boolean {
    const db = readDb();
    const msg = db.messages.find((m) => m.metaMessageId === metaMessageId);
    if (msg) {
      msg.status = status;
      msg.updatedAt = new Date().toISOString();
      writeDb(db);
      return true;
    }
    return false;
  },

  getStats(): {
    messagesSent: number;
    deliveredCount: number;
    deliveryRate: string;
    activeChatsCount: number;
  } {
    const db = readDb();
    const outbound = db.messages.filter((m) => m.direction === 'outbound');
    const sent = outbound.length;
    const delivered = outbound.filter((m) => m.status === 'delivered' || m.status === 'read').length;
    const deliveryRate = sent > 0 ? `${((delivered / sent) * 100).toFixed(1)}%` : '0.0%';

    const uniquePhoneNumbers = new Set(db.messages.map((m) => m.phoneNumber));

    return {
      messagesSent: sent,
      deliveredCount: delivered,
      deliveryRate,
      activeChatsCount: uniquePhoneNumbers.size,
    };
  },
};

// -----------------------------------------------------------------------------
// REPOSITORY 4: AUTOMATIONS / FLOWS
// -----------------------------------------------------------------------------
export const AutomationsDB = {
  list(): AutomationFlow[] {
    const db = readDb();
    return db.automations || [];
  },

  getById(id: string): AutomationFlow | null {
    const db = readDb();
    return db.automations.find((f) => f.id === id) || null;
  },

  findMatch(trigger: string): AutomationFlow | null {
    const db = readDb();
    const cleanTrigger = trigger.trim().toLowerCase();

    return (
      db.automations.find((flow) => {
        if (!flow.isActive) return false;
        const kw = flow.triggerKeyword.trim().toLowerCase();

        // Check exact match or keyword occurrence
        return cleanTrigger === kw || cleanTrigger.includes(kw) || kw.includes(cleanTrigger);
      }) || null
    );
  },

  create(flowData: Omit<AutomationFlow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): AutomationFlow {
    const db = readDb();
    const now = new Date().toISOString();
    const newFlow: AutomationFlow = {
      ...flowData,
      id: `flow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.automations.unshift(newFlow);
    writeDb(db);
    return newFlow;
  },

  update(id: string, partial: Partial<AutomationFlow>): AutomationFlow | null {
    const db = readDb();
    const idx = db.automations.findIndex((f) => f.id === id);
    if (idx >= 0) {
      const updated: AutomationFlow = {
        ...db.automations[idx],
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      db.automations[idx] = updated;
      writeDb(db);
      return updated;
    }
    return null;
  },

  delete(id: string): boolean {
    const db = readDb();
    const before = db.automations.length;
    db.automations = db.automations.filter((f) => f.id !== id);
    if (db.automations.length !== before) {
      writeDb(db);
      return true;
    }
    return false;
  },

  incrementExecution(id: string): void {
    const db = readDb();
    const flow = db.automations.find((f) => f.id === id);
    if (flow) {
      flow.executionCount = (flow.executionCount || 0) + 1;
      writeDb(db);
    }
  },
};

// -----------------------------------------------------------------------------
// REPOSITORY 5: CAMPAIGNS
// -----------------------------------------------------------------------------
export const CampaignsDB = {
  list(): Campaign[] {
    const db = readDb();
    return (db.campaigns || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  create(campaignData: Omit<Campaign, 'id' | 'createdAt'>): Campaign {
    const db = readDb();
    const newCampaign: Campaign = {
      ...campaignData,
      id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    db.campaigns.unshift(newCampaign);
    writeDb(db);
    return newCampaign;
  },

  update(id: string, partial: Partial<Campaign>): Campaign | null {
    const db = readDb();
    const idx = db.campaigns.findIndex((c) => c.id === id);
    if (idx >= 0) {
      const updated = {
        ...db.campaigns[idx],
        ...partial,
      };
      db.campaigns[idx] = updated;
      writeDb(db);
      return updated;
    }
    return null;
  },
};

// -----------------------------------------------------------------------------
// REPOSITORY 6: USERS & RBAC ACCESS CONTROL
// -----------------------------------------------------------------------------
export const UsersDB = {
  getAll(): UserRecord[] {
    const db = readDb();
    return db.users || [];
  },

  getById(id: string): UserRecord | null {
    const db = readDb();
    return db.users?.find((u) => u.id === id) || null;
  },

  getByEmail(email: string): UserRecord | null {
    const db = readDb();
    const clean = (email || '').trim().toLowerCase();
    return db.users?.find((u) => u.email.toLowerCase() === clean) || null;
  },

  create(userData: Partial<UserRecord>): UserRecord {
    const db = readDb();
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const existing = db.users?.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return existing;
    }

    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      name: userData.name || cleanEmail.split('@')[0] || 'User',
      avatarUrl: userData.avatarUrl || '',
      provider: userData.provider || 'email',
      role: userData.role || 'user',
      status: userData.status || 'unrequested',
      company: userData.company || '',
      intendedUse: userData.intendedUse || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!db.users) db.users = [];
    db.users.unshift(newUser);

    if (!db.activity) db.activity = [];
    db.activity.unshift({
      id: `act_${Date.now()}`,
      type: 'user_signup',
      title: 'New User Registered',
      description: `${newUser.name} (${newUser.email}) registered via ${newUser.provider}. Status: unrequested.`,
      timestamp: new Date().toISOString(),
    });

    writeDb(db);
    return newUser;
  },

  requestAccess(id: string, details?: { company?: string; intendedUse?: string }): UserRecord | null {
    const db = readDb();
    const user = db.users?.find((u) => u.id === id);
    if (!user) return null;

    user.status = 'pending_approval';
    user.requestedAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    if (details?.company) user.company = details.company;
    if (details?.intendedUse) user.intendedUse = details.intendedUse;

    if (!db.activity) db.activity = [];
    db.activity.unshift({
      id: `act_${Date.now()}`,
      type: 'access_request',
      title: 'Access Request Submitted',
      description: `${user.name} (${user.email}) requested dashboard access for "${user.company || 'Enterprise'}".`,
      timestamp: new Date().toISOString(),
    });

    writeDb(db);
    return user;
  },

  approveUser(id: string, approvedBy = 'User 1 (Super Admin)'): UserRecord | null {
    const db = readDb();
    const user = db.users?.find((u) => u.id === id);
    if (!user) return null;

    user.status = 'approved';
    user.approvedAt = new Date().toISOString();
    user.approvedBy = approvedBy;
    user.updatedAt = new Date().toISOString();

    if (!db.activity) db.activity = [];
    db.activity.unshift({
      id: `act_${Date.now()}`,
      type: 'user_approved',
      title: 'User Approved',
      description: `${user.name} (${user.email}) approved by ${approvedBy}. Access granted.`,
      timestamp: new Date().toISOString(),
    });

    writeDb(db);
    return user;
  },

  rejectUser(id: string): UserRecord | null {
    const db = readDb();
    const user = db.users?.find((u) => u.id === id);
    if (!user) return null;

    user.status = 'rejected';
    user.updatedAt = new Date().toISOString();

    if (!db.activity) db.activity = [];
    db.activity.unshift({
      id: `act_${Date.now()}`,
      type: 'user_rejected',
      title: 'Access Request Rejected',
      description: `Access request for ${user.name} (${user.email}) was rejected.`,
      timestamp: new Date().toISOString(),
    });

    writeDb(db);
    return user;
  },

  updateRole(id: string, role: UserRole): UserRecord | null {
    const db = readDb();
    const user = db.users?.find((u) => u.id === id);
    if (!user) return null;

    user.role = role;
    user.updatedAt = new Date().toISOString();

    if (!db.activity) db.activity = [];
    db.activity.unshift({
      id: `act_${Date.now()}`,
      type: 'role_changed',
      title: 'Role Updated',
      description: `Role for ${user.name} (${user.email}) updated to ${role}.`,
      timestamp: new Date().toISOString(),
    });

    writeDb(db);
    return user;
  },

  getAdminMetrics(): AdminMetrics {
    const db = readDb();
    const users = db.users || [];
    const totalApprovedUsers = users.filter((u) => u.status === 'approved').length;
    const totalPendingRequests = users.filter((u) => u.status === 'pending_approval').length;
    const totalMessagesSent = (db.messages || []).length;
    
    const totalMetaAdsSpend = 3450.0 + totalMessagesSent * 0.045 + (db.campaigns || []).length * 15.0;

    return {
      totalApprovedUsers,
      totalPendingRequests,
      totalMessagesSent,
      totalMetaAdsSpend: Math.round(totalMetaAdsSpend * 100) / 100,
      recentActivity: (db.activity || []).slice(0, 15),
    };
  },
};

