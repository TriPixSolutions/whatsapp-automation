import {
  hashPassword,
  verifyPassword,
  encryptToken,
  decryptToken,
  verifyMetaSignature,
} from '../src/lib/crypto';
import { signJwt, verifyJwt, SessionPayload } from '../src/lib/auth/jwt';
import {
  ContactsDB,
  MessagesDB,
  ConversationsDB,
  AutomationsDB,
  CampaignsDB,
  SettingsDB,
  UsersDB,
  WebhookEventsDB,
  DEFAULT_WORKSPACE_ID,
} from '../src/lib/db';
import { isConversationWindowOpen, WhatsAppMessageService } from '../src/lib/whatsapp/messageService';
import { FollowUpEngine } from '../src/lib/followup/followupEngine';
import { LeadCapturePipeline } from '../src/lib/leads/leadPipeline';
import { handleWebhookInboundMessages } from '../src/lib/webhook/webhookInbound';
import { handleWebhookStatuses } from '../src/lib/webhook/webhookStatus';

console.log('🧪 Starting WhatsApp Automation SaaS Architecture & Hardening Verification Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runTestSuite() {
  // =========================================================================
  // TEST SUITE 1: CRYPTOGRAPHIC SECURITY & ENCRYPTION
  // =========================================================================
  console.log('--- Suite 1: Cryptographic Security & AES-256-GCM ---');

  const plainSecret = 'EAAG_LIVE_SYSTEM_USER_ACCESS_TOKEN_XYZ_2026';
  const encrypted = encryptToken(plainSecret);
  assert(encrypted.startsWith('enc:gcm:'), 'AES-256-GCM token format has enc:gcm prefix');
  const decrypted = decryptToken(encrypted);
  assert(decrypted === plainSecret, 'Authenticated AES-256-GCM round-trip decryption succeeds');

  const testPassword = 'SecureTenantPassword#2026';
  const pHash = hashPassword(testPassword);
  assert(verifyPassword(testPassword, pHash), 'PBKDF2 password verification succeeds for correct password');
  assert(!verifyPassword('WrongPassword', pHash), 'PBKDF2 password verification fails for incorrect password');

  const webhookBody = JSON.stringify({ object: 'whatsapp_business_account' });
  const appSecret = 'my_test_app_secret_12345';
  const crypto = await import('crypto');
  const validSig = 'sha256=' + crypto.createHmac('sha256', appSecret).update(webhookBody).digest('hex');
  assert(verifyMetaSignature(webhookBody, validSig, appSecret), 'HMAC-SHA256 signature verification succeeds');
  assert(!verifyMetaSignature(webhookBody, 'sha256=invalidhash', appSecret), 'HMAC-SHA256 signature verification rejects spoofed header');

  // =========================================================================
  // TEST SUITE 2: AUTHENTICATION & SIGNED JWT SESSIONS
  // =========================================================================
  console.log('\n--- Suite 2: Signed JWT Session Management ---');

  const payload: SessionPayload = {
    userId: 'usr_test_101',
    email: 'admin@tenant.com',
    role: 'owner',
    status: 'approved',
    workspaceId: DEFAULT_WORKSPACE_ID,
  };

  const jwtToken = signJwt(payload);
  assert(typeof jwtToken === 'string' && jwtToken.split('.').length === 3, 'JWT is generated with 3 components (header.payload.signature)');

  const verifiedSession = verifyJwt(jwtToken);
  assert(verifiedSession !== null, 'Cryptographic JWT signature verification succeeds');
  assert(verifiedSession?.userId === 'usr_test_101', 'JWT payload extracts valid userId');
  assert(verifiedSession?.role === 'owner', 'JWT payload extracts valid RBAC role');

  const tamperedJwt = jwtToken.substring(0, jwtToken.length - 4) + 'abcd';
  assert(verifyJwt(tamperedJwt) === null, 'Tampered JWT signature is rejected');

  // =========================================================================
  // TEST SUITE 3: MULTI-TENANT DATABASE ISOLATION
  // =========================================================================
  console.log('\n--- Suite 3: Multi-Tenant Database Layer ---');

  const testPhone = '+15550998877';
  const contact = ContactsDB.upsert(
    {
      phoneNumber: testPhone,
      firstName: 'Alice',
      lastName: 'Smith',
      tags: ['vip', 'lead'],
    },
    DEFAULT_WORKSPACE_ID
  );
  assert(contact.phoneNumber === testPhone, 'Contact upsert returns normalized E.164 phone');

  const retrieved = ContactsDB.getByPhone(testPhone, DEFAULT_WORKSPACE_ID);
  assert(retrieved !== null && retrieved.firstName === 'Alice', 'Contact retrieval by phone succeeds');

  const msg = MessagesDB.create(
    {
      phoneNumber: testPhone,
      contactId: contact.id,
      direction: 'inbound',
      type: 'text',
      content: 'I want to see the new catalog',
    },
    DEFAULT_WORKSPACE_ID
  );
  assert(msg.direction === 'inbound', 'Inbound message logged with correct direction');

  // =========================================================================
  // TEST SUITE 4: 24-HOUR POLICY WINDOW ENGINE & CONVERSATIONS
  // =========================================================================
  console.log('\n--- Suite 4: 24-Hour Policy Window & ConversationsDB Engine ---');

  const recentTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
  assert(isConversationWindowOpen(recentTimestamp) === true, 'Window is OPEN within 24 hours of customer inbound message');

  const expiredTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
  assert(isConversationWindowOpen(expiredTimestamp) === false, 'Window is CLOSED after 24 hours');
  assert(isConversationWindowOpen(null) === false, 'Window is CLOSED if no inbound message timestamp exists');

  // Test ConversationsDB window state management
  const convPhone = '+15550776655';
  const cContact = ContactsDB.upsert({ phoneNumber: convPhone, firstName: 'Bob' });
  const recordedInbound = ConversationsDB.recordInbound(convPhone, cContact.id);
  assert(recordedInbound.state === 'open', 'ConversationsDB recordInbound sets state to open');
  assert(ConversationsDB.isWindowOpen(convPhone) === true, 'ConversationsDB reports window is open after inbound message');

  const recordedOutbound = ConversationsDB.recordOutbound(convPhone, cContact.id);
  assert(recordedOutbound.last_outbound_at !== null, 'ConversationsDB recordOutbound records outbound timestamp');

  // Free-form message succeeds when window is open
  const freeFormResult = await WhatsAppMessageService.send({
    to: convPhone,
    type: 'text',
    text: 'Here is your product specification document!',
  });
  assert(freeFormResult.success === true, 'Free-form text message allowed when 24h window is open');

  // Free-form message blocked when window is closed
  const closedPhone = '+15550009999';
  const closedContact = ContactsDB.upsert({ phoneNumber: closedPhone, firstName: 'ClosedCustomer' });
  // Ensure conversation window is expired
  const closedConv = ConversationsDB.recordOutbound(closedPhone, closedContact.id);
  closedConv.window_expires_at = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  closedConv.last_inbound_at = new Date(Date.now() - 26 * 3600000).toISOString(); // 26 hours ago
  closedConv.state = 'closed';

  const blockedResult = await WhatsAppMessageService.send({
    to: closedPhone,
    type: 'text',
    text: 'This should be blocked by 24h rule',
  });
  assert(blockedResult.windowClosed === true && blockedResult.errorCode === 131047, 'Free-form message blocked with #131047 when 24h window is closed');

  // Template message succeeds even when window is closed
  const templateResult = await WhatsAppMessageService.send({
    to: closedPhone,
    type: 'template',
    templateName: 'teaser_alert',
  });
  assert(templateResult.success === true, 'Template message allowed when 24h window is closed');

  // =========================================================================
  // TEST SUITE 5: LEAD CAPTURE PIPELINE & FOLLOW-UP ENGINE
  // =========================================================================
  console.log('\n--- Suite 5: Lead Capture & Follow-Up Automation ---');

  const leadPhone = '+15550223344';
  const leadResult = await LeadCapturePipeline.ingest({
    phoneNumber: leadPhone,
    firstName: 'Marcus',
    source: 'ctwa',
    triggerAutomation: true,
  });
  assert(leadResult.success === true, 'Lead capture pipeline successfully ingests lead');
  assert(Boolean(leadResult.contactId), 'Contact created on lead ingestion');
  assert(Boolean(leadResult.conversationId), 'Conversation created on lead ingestion');
  assert(leadResult.initialMessageSent === true, 'Initial welcome message dispatched on lead ingestion');
  assert(leadResult.followUpsScheduled === 3, 'Follow-up engine schedules 3 tiered sequences (T+10m, T+6h, T+24h)');

  // Test Custom Schedule (minutes, hours, days)
  const customFu = await FollowUpEngine.scheduleCustomFollowUp({
    phoneNumber: leadPhone,
    interval: 3,
    unit: 'days',
    templateName: 're_engagement_3d',
  });
  assert(Boolean(customFu.jobId), 'Follow-up engine schedules custom interval in days');

  // Simulate customer inbound reply: auto-cancel follow-ups
  const cancelled = await FollowUpEngine.cancelPendingOnReply(leadPhone);
  assert(cancelled >= 3, 'Follow-up engine automatically cancels pending follow-ups when customer replies');

  // =========================================================================
  // TEST SUITE 6: WEBHOOK EVENT DEDUPLICATION & STATUS UPDATES
  // =========================================================================
  console.log('\n--- Suite 6: Webhook Processing & Status Updating ---');

  const eventId = `wamid.event_${Date.now()}`;
  assert(WebhookEventsDB.isDuplicate(eventId) === false, 'New webhook event is not marked duplicate');
  assert(WebhookEventsDB.isDuplicate(eventId) === true, 'Repeated webhook event is correctly detected as duplicate and ignored');

  // Test message status receipts
  const testMsgMetaId = `wamid.test_status_${Date.now()}`;
  MessagesDB.create({
    metaMessageId: testMsgMetaId,
    phoneNumber: leadPhone,
    direction: 'outbound',
    type: 'template',
    status: 'sent',
    content: 'Template: welcome_lead',
  });

  handleWebhookStatuses([
    { id: testMsgMetaId, status: 'delivered' },
    { id: testMsgMetaId, status: 'read' },
  ]);

  const updatedMsg = MessagesDB.getByMetaId(testMsgMetaId);
  assert(updatedMsg?.status === 'read', 'Webhook status receipts correctly transition to read');

  // Test failed status receipt with error parsing
  const failedMetaId = `wamid.test_failed_${Date.now()}`;
  MessagesDB.create({
    metaMessageId: failedMetaId,
    phoneNumber: '+15550998877',
    direction: 'outbound',
    type: 'text',
    status: 'sent',
    content: 'Failed test message',
  });

  handleWebhookStatuses([
    {
      id: failedMetaId,
      status: 'failed',
      errors: [{ code: 131047, title: 'Re-engagement message required', message: 'Window expired' }],
    },
  ]);

  const failedMsg = MessagesDB.getByMetaId(failedMetaId);
  assert(failedMsg?.status === 'failed', 'Webhook failed status correctly recorded');
  assert(Boolean(failedMsg?.errorMessage), 'Error message details recorded on failed delivery receipt');

  console.log(`\n🎉 ALL TESTS PASSED! (${passedTests}/${totalTests} tests successful)`);
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test Suite execution error:', err);
  process.exit(1);
});
