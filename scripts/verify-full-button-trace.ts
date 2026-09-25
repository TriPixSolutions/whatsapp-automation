import { handleWebhookInboundMessages, MetaMessageObject } from '../src/lib/webhook/webhookInbound';
import { TestCenterStore, buildProductionVipWorkflow } from '../src/lib/automations/testCenterStore';
import { DEFAULT_WORKSPACE_ID, ContactsDB } from '../src/lib/db';

async function runCompleteTrace() {
  console.log('================================================================================');
  console.log('   FULL END-TO-END EXECUTION TRACE: BUTTON CLICK TO NODE EXECUTION AUDIT        ');
  console.log('================================================================================\n');

  const testPhone = '+919999900001';
  const workspaceId = DEFAULT_WORKSPACE_ID;

  // Setup: Register Production VIP Workflow and reset session
  const workflow = buildProductionVipWorkflow(workspaceId);
  TestCenterStore.saveWorkflow(workflow);
  TestCenterStore.clearSession(testPhone, workspaceId);

  // ---------------------------------------------------------------------------
  // PHASE 0: User sends "hello"
  // ---------------------------------------------------------------------------
  console.log('>>> [PHASE 0] Customer initiates conversation: "hello"');
  const helloPayload: MetaMessageObject = {
    from: '919999900001',
    id: `wamid.msg_hello_${Date.now()}`,
    timestamp: `${Math.floor(Date.now() / 1000)}`,
    type: 'text',
    text: { body: 'hello' },
  };

  await handleWebhookInboundMessages([helloPayload], [{ profile: { name: 'Audit VIP Customer' } }], workspaceId);

  const initialSession = TestCenterStore.getActiveSession(testPhone, workspaceId);
  console.log('\n[PHASE 0 SESSION STATE]:', initialSession ? {
    sessionFound: true,
    sessionId: initialSession.id,
    workflowId: initialSession.workflowId,
    currentNodeId: initialSession.currentNodeId,
    waitingFor: initialSession.waitingFor,
    options: initialSession.waitingOptions?.map(o => `${o.title} (${o.id})`),
  } : 'NOT FOUND');

  if (!initialSession) {
    throw new Error('FAILED: Session not created after initial "hello" message');
  }

  // ---------------------------------------------------------------------------
  // TEST SCENARIO A: Customer clicks "Browse Catalog" (btn_catalog)
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('>>> [TEST SCENARIO A] Customer clicks "Browse Catalog" (btn_catalog)');
  console.log('================================================================================');
  const catalogPayload: MetaMessageObject = {
    from: '919999900001',
    id: `wamid.btn_catalog_${Date.now()}`,
    timestamp: `${Math.floor(Date.now() / 1000)}`,
    type: 'interactive',
    interactive: {
      type: 'button_reply',
      button_reply: {
        id: 'btn_catalog',
        title: 'Browse Catalog',
      },
    },
  };

  await handleWebhookInboundMessages([catalogPayload], [{ profile: { name: 'Audit VIP Customer' } }], workspaceId);

  // ---------------------------------------------------------------------------
  // TEST SCENARIO B: Customer clicks "Get Pricing" (btn_pricing)
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('>>> [TEST SCENARIO B] Customer clicks "Get Pricing" (btn_pricing)');
  console.log('================================================================================');
  // Reset to button menu state for Scenario B
  TestCenterStore.saveSession({
    id: `sess_pricing_test_${Date.now()}`,
    workspaceId,
    phoneNumber: testPhone,
    workflowId: workflow.id,
    executionId: `exec_pricing_${Date.now()}`,
    currentNodeId: 'node_button_menu',
    waitingFor: 'button_click',
    variables: { phoneNumber: testPhone },
    pausedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  });

  const pricingPayload: MetaMessageObject = {
    from: '919999900001',
    id: `wamid.btn_pricing_${Date.now()}`,
    timestamp: `${Math.floor(Date.now() / 1000)}`,
    type: 'interactive',
    interactive: {
      type: 'button_reply',
      button_reply: {
        id: 'btn_pricing',
        title: 'Get Pricing',
      },
    },
  };

  await handleWebhookInboundMessages([pricingPayload], [{ profile: { name: 'Audit VIP Customer' } }], workspaceId);

  // ---------------------------------------------------------------------------
  // TEST SCENARIO C: Customer clicks "Talk To Expert" (btn_agent)
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('>>> [TEST SCENARIO C] Customer clicks "Talk To Expert" (btn_agent)');
  console.log('================================================================================');
  // Reset to button menu state for Scenario C
  TestCenterStore.saveSession({
    id: `sess_expert_test_${Date.now()}`,
    workspaceId,
    phoneNumber: testPhone,
    workflowId: workflow.id,
    executionId: `exec_expert_${Date.now()}`,
    currentNodeId: 'node_button_menu',
    waitingFor: 'button_click',
    variables: { phoneNumber: testPhone },
    pausedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  });

  const expertPayload: MetaMessageObject = {
    from: '919999900001',
    id: `wamid.btn_agent_${Date.now()}`,
    timestamp: `${Math.floor(Date.now() / 1000)}`,
    type: 'interactive',
    interactive: {
      type: 'button_reply',
      button_reply: {
        id: 'btn_agent',
        title: 'Talk To Expert',
      },
    },
  };

  await handleWebhookInboundMessages([expertPayload], [{ profile: { name: 'Audit VIP Customer' } }], workspaceId);

  console.log('\n================================================================================');
  console.log('                   VERIFICATION TRACE COMPLETE                                  ');
  console.log('================================================================================');
}

runCompleteTrace().catch(err => {
  console.error('[Trace Error]:', err);
  process.exit(1);
});
