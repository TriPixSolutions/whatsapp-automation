import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import assert from 'assert';
import { SettingsDB, MessagesDB, ContactsDB, ConversationsDB, DEFAULT_WORKSPACE_ID } from '../src/lib/db';
import { WhatsAppMessageService } from '../src/lib/whatsapp/messageService';
import { MetaWhatsAppClient } from '../src/lib/meta/api';
import { handleWebhookInboundMessages } from '../src/lib/webhook/webhookInbound';
import { handleWebhookStatuses } from '../src/lib/webhook/webhookStatus';
import { handleWebhookVerification } from '../src/lib/webhook/webhookVerification';
import { encryptToken, decryptToken, hashPassword, verifyPassword } from '../src/lib/crypto';
import fs from 'fs';
import path from 'path';

async function runPreDeploymentValidation() {
  console.log('==============================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE PRE-DEPLOYMENT VALIDATION');
  console.log('==============================================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function record(name: string, passed: boolean, details?: string) {
    totalChecks++;
    if (passed) {
      passedChecks++;
      console.log(`✅ [PASS] ${name}`);
      if (details) console.log(`   └─ ${details}`);
    } else {
      console.error(`❌ [FAIL] ${name}`);
      if (details) console.error(`   └─ ${details}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Check No Hardcoded Template Names in Setup Connection Flow
  // ---------------------------------------------------------------------------
  const setupPageCode = fs.readFileSync(path.join(__dirname, '../src/app/setup/page.tsx'), 'utf8');
  const hasTemplateInTest = setupPageCode.includes("templateName: 'teaser_alert'") || setupPageCode.includes('type: \'template\'');
  const hasCorrectText = setupPageCode.includes('WhatsApp connection successful. Test message from TriPix SaaS.');
  const usesTextMessage = setupPageCode.includes("type: 'text'");
  
  record('1. No Template Names in Connection Test Flow', !hasTemplateInTest, 'Verified setup/page.tsx does not use templateName or type: template in test flow');
  record('2. Connection Test Uses Simple Text Message API', usesTextMessage, 'Verified handleSendTestMessage uses type: text');
  record('3. Correct Exact Text Message Content', hasCorrectText, 'Verified message is: "WhatsApp connection successful. Test message from TriPix SaaS."');

  // ---------------------------------------------------------------------------
  // 2. Credentials & Environment Loading
  // ---------------------------------------------------------------------------
  const settings = SettingsDB.get(DEFAULT_WORKSPACE_ID);
  record('4. Phone Number ID Loaded', Boolean(settings.phoneNumberId), `Phone Number ID: ${settings.phoneNumberId}`);
  record('5. WABA ID Loaded', Boolean(settings.wabaId), `WABA ID: ${settings.wabaId}`);
  record('6. Access Token Loaded', Boolean(settings.accessToken), `Access Token present (${settings.accessToken ? settings.accessToken.slice(0, 10) + '...' : 'none'})`);
  record('7. Webhook Verify Token Loaded', Boolean(settings.verifyToken), `Verify Token: ${settings.verifyToken}`);

  // ---------------------------------------------------------------------------
  // 3. Phone Number Sanitization for Test & Production Numbers
  // ---------------------------------------------------------------------------
  // @ts-ignore - access private static for test
  const cleanPhone = MetaWhatsAppClient['cleanPhone'];
  const testNum1 = cleanPhone('+1 (555) 019-2831');
  const testNum2 = cleanPhone('+91 98765 43210');
  const testNum3 = cleanPhone('15550192831');
  const phonesClean = testNum1 === '15550192831' && testNum2 === '919876543210' && testNum3 === '15550192831';
  record('8. Phone Sanitization (Meta Test & Production Numbers)', phonesClean, `Cleaned test: ${testNum1}, prod: ${testNum2}`);

  // ---------------------------------------------------------------------------
  // 4. Test Message Dispatch via WhatsAppMessageService
  // ---------------------------------------------------------------------------
  const testPhone = '+15550192831';
  const dispatchResult = await WhatsAppMessageService.send({
    to: testPhone,
    type: 'text',
    text: 'WhatsApp connection successful. Test message from TriPix SaaS.',
    bypassWindowCheck: true,
  });

  record('9. WhatsApp Test Message Dispatch Succeeded', dispatchResult.success, `Message ID: ${dispatchResult.metaMessageId}`);
  record('10. Outbound Message Saved in Database', Boolean(dispatchResult.savedMessage && dispatchResult.savedMessage.content.includes('WhatsApp connection successful')), `DB Content: "${dispatchResult.savedMessage?.content}"`);

  // ---------------------------------------------------------------------------
  // 5. Error Code 132001 & Meta Error Parsing
  // ---------------------------------------------------------------------------
  const parsed132001 = MetaWhatsAppClient.parseMetaError({
    isAxiosError: true,
    response: {
      data: {
        error: {
          code: 132001,
          message: 'Template name does not exist in the translation',
        },
      },
    },
  });
  const handles132001 = parsed132001.code === 132001 && parsed132001.message.includes('Template Does Not Exist');
  record('11. Meta Error Parsing (#132001 Template Missing)', handles132001, parsed132001.message);

  // ---------------------------------------------------------------------------
  // 6. Webhook Verification Handshake
  // ---------------------------------------------------------------------------
  const { NextRequest } = await import('next/server');
  const handshakeReq = new NextRequest(
    `http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_abc_123&hub.verify_token=${encodeURIComponent(settings.verifyToken)}`
  );
  const handshakeRes = handleWebhookVerification(handshakeReq);
  const handshakeBody = await handshakeRes.text();
  record('12. Webhook GET Verification Handshake', handshakeRes.status === 200 && handshakeBody === 'test_challenge_abc_123', `Challenge returned: "${handshakeBody}" (HTTP ${handshakeRes.status})`);

  // ---------------------------------------------------------------------------
  // 7. Webhook Delivery Status Receipts (Delivered -> Read)
  // ---------------------------------------------------------------------------
  if (dispatchResult.metaMessageId) {
    const testMsgId = dispatchResult.metaMessageId;
    
    // Status update 1: delivered
    handleWebhookStatuses([
      { id: testMsgId, status: 'delivered', timestamp: `${Math.floor(Date.now() / 1000)}` },
    ]);
    const deliveredStatus = MessagesDB.getByMetaId(testMsgId)?.status;
    
    // Status update 2: read
    handleWebhookStatuses([
      { id: testMsgId, status: 'read', timestamp: `${Math.floor(Date.now() / 1000)}` },
    ]);
    const readStatus = MessagesDB.getByMetaId(testMsgId)?.status;

    const statusUpdatesWork = deliveredStatus === 'delivered' && readStatus === 'read';
    record('13. Webhook Delivery Status Receipts (DELIVERED -> READ)', statusUpdatesWork, `Status progression confirmed: delivered (${deliveredStatus}) -> read (${readStatus})`);
  } else {
    record('13. Webhook Delivery Status Receipts (DELIVERED -> READ)', false, 'No message ID to test');
  }

  // ---------------------------------------------------------------------------
  // 8. Webhook Inbound Message & 24h Window Opening
  // ---------------------------------------------------------------------------
  const inboundPhone = '15559876543';
  await handleWebhookInboundMessages([
    {
      from: inboundPhone,
      id: `wamid.inbound_test_${Date.now()}`,
      timestamp: `${Math.floor(Date.now() / 1000)}`,
      type: 'text',
      text: { body: 'Hello, this is a test inbound customer reply' },
    },
  ]);
  const isWindowNowOpen = ConversationsDB.isWindowOpen(`+${inboundPhone}`, DEFAULT_WORKSPACE_ID);
  const inboundSaved = MessagesDB.list({ workspaceId: DEFAULT_WORKSPACE_ID, phoneNumber: `+${inboundPhone}` }).length > 0;
  record('14. Webhook Inbound Message Processing', inboundSaved, 'Inbound message saved and linked to conversation');
  record('15. 24-Hour Customer Care Window Opened', isWindowNowOpen, 'Conversation window status: OPEN');

  // ---------------------------------------------------------------------------
  // 9. Crypto Engine & Password Hashing
  // ---------------------------------------------------------------------------
  const rawToken = 'EAAB_test_token_secret_12345';
  const encrypted = encryptToken(rawToken);
  const decrypted = decryptToken(encrypted);
  const cryptoWorks = encrypted.startsWith('enc:gcm:') && decrypted === rawToken;
  record('16. AES-256-GCM Token Encryption Engine', cryptoWorks, 'Encrypted at rest with GCM tag and IV, decrypted correctly');

  const testPass = 'SuperSecret2026!';
  const passHash = hashPassword(testPass);
  const passVerified = verifyPassword(testPass, passHash);
  record('17. PBKDF2 Password Hashing & Verification', passVerified, 'PBKDF2 SHA-512 authentication verified');

  // ---------------------------------------------------------------------------
  // 10. Summary
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log(`📊 PRE-DEPLOYMENT VALIDATION REPORT: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  console.log('==============================================================================\n');

  if (passedChecks !== totalChecks) {
    console.error('Validation FAILED! Not all checks passed.');
    process.exit(1);
  } else {
    console.log('🎉 ALL CHECKS PASSED PERFECTLY! System is 100% deployment ready.');
  }
}

runPreDeploymentValidation().catch(err => {
  console.error('Unexpected validation failure:', err);
  process.exit(1);
});
