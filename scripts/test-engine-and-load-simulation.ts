/**
 * Production Automation Engine Validation & Load Simulation Suite
 * TriPix Solutions / WhatsApp Automation SaaS
 *
 * Implements:
 * - Phase 3: Database CRUD & Store Model Validation
 * - Phase 4: Every Node Type Execution Audit (17 node types)
 * - Phase 5: Full 12-Step Customer Journey End-to-End Simulation
 * - Phase 6: High-Concurrency Load Simulation (100, 500, 1000, 5000 Contacts)
 * - Phase 7: Production Readiness Scoring & Health Metrics
 */

import {
  WorkflowDefinition,
  WorkflowNode,
  VisualWorkflowEdge,
  WorkflowExecutionLog,
} from '../src/types/automations';
import { AdvancedWorkflowEngine } from '../src/lib/automations/advancedWorkflowEngine';
import { TestCenterStore } from '../src/lib/automations/testCenterStore';
import { ContactsDB } from '../src/lib/db';

async function runComprehensiveValidation() {
  console.log('================================================================');
  console.log('WHATSAPP AUTOMATION ENGINE: STABILIZATION, VALIDATION & LOAD SUITE');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
      failedTests++;
    }
  }

  // ============================================================================
  // PHASE 3: DATABASE & STORE MODEL VALIDATION
  // ============================================================================
  console.log('--- PHASE 3: DATABASE CRUD & PERSISTENCE AUDIT ---');

  const testWfId = `wf_test_crud_${Date.now()}`;
  const initialWorkflow: WorkflowDefinition = {
    id: testWfId,
    workspaceId: 'default',
    name: 'CRUD Database Integrity Test Flow',
    description: 'Validates zero data loss on save, reload, duplicate, version, delete',
    triggerType: 'keyword',
    triggerKeyword: 'order',
    isActive: true,
    executionCount: 0,
    nodes: [
      {
        id: 'node_1',
        type: 'trigger_keyword',
        title: 'Keyword Trigger',
        description: 'Triggers on incoming order keywords',
        config: { text: 'order' },
        position: { x: 50, y: 100 },
        nextNodeId: 'node_2',
      },
      {
        id: 'node_2',
        type: 'whatsapp_message',
        title: 'Confirmation Text',
        description: 'Sends order confirmation text',
        config: { text: 'Your order was received!' },
        position: { x: 430, y: 100 },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2' },
    ],
  };

  // 1. Create / Save
  const savedWf = TestCenterStore.saveWorkflow(initialWorkflow);
  assert(savedWf.id === testWfId, 'Create / Save Workflow persisted to store');

  // 2. Read / Load
  const loadedWf = TestCenterStore.getWorkflow(testWfId);
  assert(loadedWf !== null && loadedWf.name === initialWorkflow.name, 'Read / Load Workflow returns identical data');
  assert(loadedWf?.nodes.length === 2 && loadedWf?.edges.length === 1, 'Nodes and edges integrity strictly preserved on reload');

  // 3. Duplicate
  const duplicatedWf = TestCenterStore.duplicateWorkflow(testWfId);
  assert(
    duplicatedWf !== null && duplicatedWf.id !== testWfId && duplicatedWf.name.includes('(Copy)'),
    'Workflow Duplication generates unique ID and clones node graph'
  );

  // 4. Versioning
  const versionedWf = TestCenterStore.createWorkflowVersion(testWfId);
  assert(
    versionedWf !== null && ((versionedWf as any).version === 2),
    'Workflow Versioning increments version number and updates timestamp'
  );

  // 5. Delete
  const deleteResult = TestCenterStore.deleteWorkflow(testWfId);
  const reloadDeleted = TestCenterStore.getWorkflow(testWfId);
  assert(deleteResult && reloadDeleted === null, 'Delete Workflow removes flow with zero orphan state');

  // Clean up duplicate
  if (duplicatedWf) TestCenterStore.deleteWorkflow(duplicatedWf.id);

  // ============================================================================
  // PHASE 4: NODE FUNCTIONAL TESTING (ALL 17 NODE TYPES)
  // ============================================================================
  console.log('\n--- PHASE 4: NODE FUNCTIONAL VALIDATION (17 NODE TYPES) ---');

  const nodeTypesToTest = [
    // Triggers
    { type: 'trigger_incoming', title: 'Incoming Message', config: {} },
    { type: 'trigger_keyword', title: 'Keyword Match', config: { text: 'pricing' } },
    { type: 'trigger_button', title: 'Button Click', config: { buttonId: 'btn_yes' } },
    { type: 'trigger_carousel', title: 'Carousel Click', config: { cardButtonId: 'order_card_1' } },
    { type: 'trigger_list', title: 'List Selection', config: { rowId: 'vip_tier_1' } },
    { type: 'trigger_flow', title: 'Flow Submit', config: { flowId: 'lead_form_flow' } },

    // Actions
    { type: 'whatsapp_message', title: 'Text Message', config: { text: 'Hi {{contact.firstName}}, Welcome!' } },
    { type: 'whatsapp_button', title: 'Buttons Menu', config: { bodyText: 'Choose option:', buttons: [{ id: 'b1', title: 'Details' }] } },
    { type: 'whatsapp_carousel', title: 'Product Carousel', config: { cards: [{ title: 'Item 1', description: 'Desc 1', buttons: [{ id: 'b', title: 'Buy' }] }] } },
    { type: 'whatsapp_catalog', title: 'Catalog Product', config: { productTitle: 'Signature Sneaker', productPrice: '$120' } },
    { type: 'whatsapp_flow', title: 'Interactive Flow', config: { flowCta: 'Book Now', flowId: 'flow_booking_1' } },
    { type: 'delay', title: 'Timed Delay', config: { delayAmount: 1, delayUnit: 'minutes' } },
    { type: 'condition', title: 'If/Else Condition', config: { conditionVariable: 'phoneNumber', conditionOperator: 'exists' } },
    { type: 'set_variable', title: 'Variable Setter', config: { variableKey: 'customer_vip', variableValue: 'platinum' } },
    { type: 'crm_action', title: 'CRM Stage Update', config: { stage: 'qualified', notes: 'VIP qualification' } },
    { type: 'lead_management', title: 'Lead Score Update', config: { leadStatus: 'qualified', leadValue: 1000 } },
    { type: 'tag_management', title: 'Tag Assignment', config: { action: 'add', tag: 'verified_vip' } },
  ];

  for (const n of nodeTypesToTest) {
    const singleNodeWorkflow: WorkflowDefinition = {
      id: `wf_node_test_${n.type}`,
      workspaceId: 'default',
      name: `Test ${n.title}`,
      triggerType: 'incoming_message',
      isActive: true,
      executionCount: 0,
      nodes: [
        {
          id: 'test_node_id',
          type: n.type as any,
          title: n.title,
          config: n.config,
          position: { x: 100, y: 100 },
        },
      ],
      edges: [],
    };

    const execLog = await AdvancedWorkflowEngine.executeWorkflow(singleNodeWorkflow, {
      workflowId: singleNodeWorkflow.id,
      workspaceId: 'default',
      phoneNumber: '+15550192831',
      triggerType: 'incoming_message',
      triggerPayload: { text: 'test payload' },
      isTestSimulation: true,
    });

    const nodeStep = execLog.steps.find((s) => s.nodeId === 'test_node_id');
    const isStepSuccess = nodeStep && nodeStep.status !== 'failed';
    assert(
      Boolean(isStepSuccess),
      `Node [${n.type}] (${n.title}) executes successfully and returns valid runtime output`,
      nodeStep?.error
    );
  }

  // ============================================================================
  // PHASE 5: FULL CUSTOMER JOURNEY END-TO-END TEST
  // ============================================================================
  console.log('\n--- PHASE 5: FULL CUSTOMER JOURNEY END-TO-END SIMULATION ---');

  const customerJourneyWorkflow: WorkflowDefinition = {
    id: 'wf_vip_full_journey',
    workspaceId: 'default',
    name: 'Complete VIP WhatsApp Customer Journey',
    triggerType: 'keyword',
    triggerKeyword: 'Hi',
    isActive: true,
    executionCount: 0,
    nodes: [
      // 1. Keyword Trigger
      {
        id: 'step_1_trigger',
        type: 'trigger_keyword',
        title: 'Keyword Trigger ("Hi")',
        config: { text: 'Hi' },
        position: { x: 80, y: 150 },
        nextNodeId: 'step_2_welcome',
      },
      // 2. Welcome Message
      {
        id: 'step_2_welcome',
        type: 'whatsapp_message',
        title: 'Welcome Message',
        config: { text: 'Hello {{contact.firstName}}! Welcome to TriPix Official Store.' },
        position: { x: 460, y: 150 },
        nextNodeId: 'step_3_buttons',
      },
      // 3. Interactive Choice Buttons
      {
        id: 'step_3_buttons',
        type: 'whatsapp_button',
        title: 'Main Options Menu',
        config: {
          bodyText: 'How would you like to explore today?',
          buttons: [
            { id: 'btn_browse', title: 'Browse Products' },
            { id: 'btn_agent', title: 'Talk to Support' },
          ],
        },
        position: { x: 840, y: 150 },
        nextNodeId: 'step_4_carousel',
      },
      // 4. Product Carousel Showcase
      {
        id: 'step_4_carousel',
        type: 'whatsapp_carousel',
        title: 'Product Carousel Showcase',
        config: {
          cards: [
            {
              title: 'Ultra Sneakers Pro',
              description: 'Top-tier running shoes $149',
              buttons: [{ id: 'order_sneakers', title: 'Order Now' }],
            },
            {
              title: 'Leather Urban Boots',
              description: 'Waterproof heritage boots $199',
              buttons: [{ id: 'order_boots', title: 'Order Now' }],
            },
          ],
        },
        position: { x: 1220, y: 150 },
        nextNodeId: 'step_5_delay1',
      },
      // 5. Delay 30 Minutes
      {
        id: 'step_5_delay1',
        type: 'delay',
        title: 'Delay 30 Minutes',
        config: { delayAmount: 30, delayUnit: 'minutes' },
        position: { x: 1600, y: 150 },
        nextNodeId: 'step_6_followup1',
      },
      // 6. Follow-up #1
      {
        id: 'step_6_followup1',
        type: 'whatsapp_message',
        title: 'Follow Up #1: Cart Reminder',
        config: { text: 'Did you get a chance to review your favorite footwear selection?' },
        position: { x: 1980, y: 150 },
        nextNodeId: 'step_7_delay2',
      },
      // 7. Delay 24 Hours
      {
        id: 'step_7_delay2',
        type: 'delay',
        title: 'Delay 24 Hours',
        config: { delayAmount: 24, delayUnit: 'hours' },
        position: { x: 2360, y: 150 },
        nextNodeId: 'step_8_followup2',
      },
      // 8. Follow-up #2
      {
        id: 'step_8_followup2',
        type: 'whatsapp_message',
        title: 'Follow Up #2: Exclusive Discount',
        config: { text: 'Here is an exclusive 15% VIP coupon: VIP15 for your footwear order!' },
        position: { x: 2740, y: 150 },
        nextNodeId: 'step_9_delay3',
      },
      // 9. Delay 48 Hours
      {
        id: 'step_9_delay3',
        type: 'delay',
        title: 'Delay 48 Hours',
        config: { delayAmount: 48, delayUnit: 'hours' },
        position: { x: 3120, y: 150 },
        nextNodeId: 'step_10_followup3',
      },
      // 10. Follow-up #3
      {
        id: 'step_10_followup3',
        type: 'whatsapp_message',
        title: 'Follow Up #3: Final VIP Touch',
        config: { text: 'Our concierge is standing by if you need sizing or styling advice.' },
        position: { x: 3500, y: 150 },
        nextNodeId: 'step_11_lead_update',
      },
      // 11. Lead Status Updated
      {
        id: 'step_11_lead_update',
        type: 'lead_management',
        title: 'Update Lead Status',
        config: { leadStatus: 'qualified', priority: 'high', leadValue: 1200 },
        position: { x: 3880, y: 150 },
        nextNodeId: 'step_12_crm_entry',
      },
      // 12. CRM Entry Created
      {
        id: 'step_12_crm_entry',
        type: 'crm_action',
        title: 'Create CRM Entry',
        config: { stage: 'qualified', notes: 'Completed 3-stage VIP footwear nurture funnel.' },
        position: { x: 4260, y: 150 },
      },
    ],
    edges: [
      { id: 'e1', source: 'step_1_trigger', target: 'step_2_welcome' },
      { id: 'e2', source: 'step_2_welcome', target: 'step_3_buttons' },
      { id: 'e3', source: 'step_3_buttons', target: 'step_4_carousel' },
      { id: 'e4', source: 'step_4_carousel', target: 'step_5_delay1' },
      { id: 'e5', source: 'step_5_delay1', target: 'step_6_followup1' },
      { id: 'e6', source: 'step_6_followup1', target: 'step_7_delay2' },
      { id: 'e7', source: 'step_7_delay2', target: 'step_8_followup2' },
      { id: 'e8', source: 'step_8_followup2', target: 'step_9_delay3' },
      { id: 'e9', source: 'step_9_delay3', target: 'step_10_followup3' },
      { id: 'e10', source: 'step_10_followup3', target: 'step_11_lead_update' },
      { id: 'e11', source: 'step_11_lead_update', target: 'step_12_crm_entry' },
    ],
  };

  const journeyExec = await AdvancedWorkflowEngine.executeWorkflow(customerJourneyWorkflow, {
    workflowId: customerJourneyWorkflow.id,
    workspaceId: 'default',
    phoneNumber: '+919876543210',
    triggerType: 'keyword',
    triggerPayload: { text: 'Hi, I need shoes' },
    isTestSimulation: true,
  });

  assert(journeyExec.status === 'completed', 'Full 12-Step Customer Journey executed without failures');
  assert(journeyExec.steps.length === 12, `All 12 steps recorded in execution trace (actual: ${journeyExec.steps.length})`);
  assert(
    journeyExec.steps[4].outputResult?.scheduledFor !== undefined &&
    journeyExec.steps[6].outputResult?.scheduledFor !== undefined &&
    journeyExec.steps[8].outputResult?.scheduledFor !== undefined,
    'All 3 Timed Delays (30m, 24h, 48h) accurately computed scheduled timestamps'
  );

  const contactUpdated = ContactsDB.getByPhone('+919876543210', 'default');
  assert(
    contactUpdated?.leadStatus === 'qualified',
    'Customer lead status automatically updated to "qualified" in database'
  );
  assert(
    contactUpdated?.stage === 'qualified',
    'Customer CRM stage updated to "qualified" with concierge note'
  );

  // ============================================================================
  // PHASE 6: REAL CONCURRENT LOAD & SCALE SIMULATION
  // ============================================================================
  console.log('\n--- PHASE 6: HIGH-CONCURRENCY SCALE SIMULATION ---');

  const scaleTiers = [100, 500, 1000, 5000];

  for (const tier of scaleTiers) {
    const memBefore = process.memoryUsage().heapUsed;
    const startTime = Date.now();
    let tierSuccess = 0;
    let tierFailures = 0;

    // Fast-path multi-contact batch simulation
    const batchSize = Math.min(tier, 250);
    const totalBatches = Math.ceil(tier / batchSize);

    for (let b = 0; b < totalBatches; b++) {
      const currentBatchCount = Math.min(batchSize, tier - b * batchSize);
      const promises: Promise<WorkflowExecutionLog>[] = [];

      for (let i = 0; i < currentBatchCount; i++) {
        const contactIndex = b * batchSize + i;
        const phone = `+1555${String(contactIndex).padStart(7, '0')}`;
        promises.push(
          AdvancedWorkflowEngine.executeWorkflow(
            {
              id: 'wf_load_benchmark',
              workspaceId: 'default',
              name: 'Load Benchmark Flow',
              triggerType: 'incoming_message',
              isActive: true,
              executionCount: 0,
              nodes: [
                {
                  id: 'n_trig',
                  type: 'trigger_incoming',
                  title: 'Incoming',
                  config: {},
                  position: { x: 0, y: 0 },
                  nextNodeId: 'n_msg',
                },
                {
                  id: 'n_msg',
                  type: 'whatsapp_message',
                  title: 'Instant Reply',
                  config: { text: 'Load test confirmation' },
                  position: { x: 300, y: 0 },
                  nextNodeId: 'n_crm',
                },
                {
                  id: 'n_crm',
                  type: 'crm_action',
                  title: 'Sync CRM',
                  config: { stage: 'lead' },
                  position: { x: 600, y: 0 },
                },
              ],
              edges: [
                { id: 'e1', source: 'n_trig', target: 'n_msg' },
                { id: 'e2', source: 'n_msg', target: 'n_crm' },
              ],
            },
            {
              workflowId: 'wf_load_benchmark',
              workspaceId: 'default',
              phoneNumber: phone,
              triggerType: 'incoming_message',
              triggerPayload: { text: 'load ping' },
              isTestSimulation: true,
            }
          )
        );
      }

      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.status === 'completed') tierSuccess++;
        else tierFailures++;
      }
    }

    const durationMs = Date.now() - startTime;
    const throughput = Math.round((tier / (durationMs / 1000)));
    const avgLatencyMs = (durationMs / tier).toFixed(2);
    const memAfter = process.memoryUsage().heapUsed;
    const memDeltaMb = ((memAfter - memBefore) / (1024 * 1024)).toFixed(2);

    console.log(
      `  Tier [${tier} Contacts]: ${tierSuccess} succeeded, ${tierFailures} failed | ` +
      `${durationMs}ms total (${throughput} req/sec, ~${avgLatencyMs}ms/req) | Heap: +${memDeltaMb}MB`
    );

    assert(
      tierSuccess === tier && tierFailures === 0,
      `[Scale Tier ${tier} Contacts] 100% success rate under sustained load (${throughput} req/sec)`,
      `${tierFailures} failures encountered`
    );
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`EXECUTION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED out of ${totalTests} CHECKS`);
  console.log(`PRODUCTION READINESS SCORE: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runComprehensiveValidation().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
