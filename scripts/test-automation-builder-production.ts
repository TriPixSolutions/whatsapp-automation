/**
 * Automated Production Test Suite for Node-Based Automation Builder
 * TriPix Solutions / WhatsApp Automation SaaS
 */

import {
  WorkflowDefinition,
  WorkflowNode,
  VisualWorkflowEdge,
} from '../src/types/automations';
import {
  validateWorkflow,
  autoArrangeDAG,
  buildWorkflowTree,
} from '../src/lib/automations/dagLayout';
import { TestCenterStore } from '../src/lib/automations/testCenterStore';
import { AdvancedWorkflowEngine } from '../src/lib/automations/advancedWorkflowEngine';

async function runTestSuite() {
  console.log('====================================================');
  console.log('STARTING AUTOMATION BUILDER PRODUCTION QA TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
      failed++;
    }
  }

  // TEST 1: Validation Engine - Detection of invalid nodes
  console.log('\n--- 1. VALIDATION ENGINE AUDIT ---');
  const invalidWorkflow: WorkflowDefinition = {
    id: 'test_invalid_wf',
    workspaceId: 'default',
    name: 'Invalid Test Workflow',
    triggerType: 'keyword',
    triggerKeyword: '',
    isActive: true,
    executionCount: 0,
    nodes: [
      {
        id: 'node_msg_blank',
        type: 'whatsapp_message',
        title: 'Empty Message',
        description: '',
        config: { text: '' }, // Should error: empty text
      },
      {
        id: 'node_btn_too_long',
        type: 'whatsapp_button',
        title: 'Long Buttons',
        description: '',
        config: {
          buttons: [
            { id: 'b1', title: 'This button title exceeds twenty characters limitation' }, // Should error: > 20 chars
          ],
        },
      },
      {
        id: 'node_bad_api',
        type: 'api_request',
        title: 'Invalid API',
        description: '',
        config: { apiUrl: 'ftp://bad-protocol.com' }, // Should error: not http/https
      },
      {
        id: 'node_bad_delay',
        type: 'delay',
        title: 'Negative Delay',
        description: '',
        config: { delayAmount: -5 }, // Should error: <= 0
      },
    ],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const validationErrors = validateWorkflow(invalidWorkflow);
  assert(
    validationErrors.some((e) => e.nodeId === 'node_msg_blank' && e.field === 'text'),
    'Validator flags empty message content'
  );
  assert(
    validationErrors.some((e) => e.nodeId === 'node_btn_too_long' && e.message.includes('20-character')),
    'Validator enforces Meta 20-character button limit'
  );
  assert(
    validationErrors.some((e) => e.nodeId === 'node_bad_api'),
    'Validator enforces valid HTTP/HTTPS URL on API requests'
  );
  assert(
    validationErrors.some((e) => e.nodeId === 'node_bad_delay'),
    'Validator catches negative delay values'
  );
  assert(
    validationErrors.some((e) => e.message.includes('requires an entry Trigger node')),
    'Validator enforces existence of entry Trigger node'
  );

  // TEST 2: DAG Layout Engine - Topological Auto-Arrangement
  console.log('\n--- 2. DAG AUTO-ARRANGE ALGORITHM AUDIT ---');
  const complexWorkflow: WorkflowDefinition = {
    id: 'test_complex_dag',
    workspaceId: 'default',
    name: 'Topological DAG Funnel',
    triggerType: 'keyword',
    triggerKeyword: 'vip',
    isActive: true,
    executionCount: 0,
    nodes: [
      { id: 'n_trig', type: 'trigger_keyword', title: 'Trigger', description: '', config: { text: 'vip' }, position: { x: 0, y: 0 } },
      { id: 'n_msg', type: 'whatsapp_message', title: 'Welcome', description: '', config: { text: 'Welcome' }, position: { x: 0, y: 0 } },
      { id: 'n_cond', type: 'conditional_logic', title: 'Condition', description: '', config: { conditionVariable: 'text' }, position: { x: 0, y: 0 } },
      { id: 'n_yes', type: 'whatsapp_message', title: 'Yes Path', description: '', config: { text: 'Yes VIP' }, position: { x: 0, y: 0 } },
      { id: 'n_no', type: 'whatsapp_message', title: 'No Path', description: '', config: { text: 'Standard' }, position: { x: 0, y: 0 } },
      { id: 'n_end', type: 'end', title: 'End', description: '', config: {}, position: { x: 0, y: 0 } },
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_msg' },
      { id: 'e2', source: 'n_msg', target: 'n_cond' },
      { id: 'e3', source: 'n_cond', sourceHandle: 'true', target: 'n_yes', label: 'Yes' },
      { id: 'e4', source: 'n_cond', sourceHandle: 'false', target: 'n_no', label: 'No' },
      { id: 'e5', source: 'n_yes', target: 'n_end' },
      { id: 'e6', source: 'n_no', target: 'n_end' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const arranged = autoArrangeDAG(complexWorkflow, 'LR');
  const trigNode = arranged.nodes.find((n) => n.id === 'n_trig')!;
  const msgNode = arranged.nodes.find((n) => n.id === 'n_msg')!;
  const condNode = arranged.nodes.find((n) => n.id === 'n_cond')!;
  const yesNode = arranged.nodes.find((n) => n.id === 'n_yes')!;
  const endNode = arranged.nodes.find((n) => n.id === 'n_end')!;

  assert(
    trigNode.position!.x < msgNode.position!.x &&
      msgNode.position!.x < condNode.position!.x &&
      condNode.position!.x < yesNode.position!.x &&
      yesNode.position!.x < endNode.position!.x,
    'Auto-Arrange produces strict left-to-right topological order'
  );

  // TEST 3: Workflow Structure Panel - Layer Tree Hierarchy
  console.log('\n--- 3. WORKFLOW STRUCTURE & LAYER TREE AUDIT ---');
  const tree = buildWorkflowTree(complexWorkflow);
  assert(tree.length === 1 && tree[0].id === 'n_trig', 'Tree root correctly identifies initial trigger node');
  assert(tree[0].children[0]?.id === 'n_msg', 'Tree maintains parent-child relationship (Trigger -> Message)');
  const conditionTreeNode = tree[0].children[0]?.children[0];
  assert(
    conditionTreeNode?.id === 'n_cond' && conditionTreeNode.children.length === 2,
    'Condition node branches split into Yes and No child tree nodes'
  );
  assert(
    conditionTreeNode.children.some((c) => c.branchLabel === 'Yes') &&
      conditionTreeNode.children.some((c) => c.branchLabel === 'No'),
    'Tree nodes reflect branch labels accurately'
  );

  // TEST 4: Database Save and Load Round-Trip Integrity
  console.log('\n--- 4. DATABASE & PERSISTENCE ROUND-TRIP AUDIT ---');
  const savedWf = TestCenterStore.saveWorkflow(complexWorkflow);
  assert(Boolean(savedWf && savedWf.id === complexWorkflow.id), 'Workflow successfully persisted to store');

  const loadedWf = TestCenterStore.getWorkflow(complexWorkflow.id);
  assert(Boolean(loadedWf), 'Workflow successfully reloaded from database');
  assert(loadedWf?.nodes.length === complexWorkflow.nodes.length, 'Reloaded node count matches original exactly');
  assert(loadedWf?.edges?.length === complexWorkflow.edges?.length, 'Reloaded edge count matches original exactly');
  assert(
    Boolean(loadedWf?.edges?.some((e) => e.sourceHandle === 'true' && e.label === 'Yes')),
    'Reloaded edges retain custom sourceHandle and branch labels'
  );

  // TEST 5: Execution Engine Simulation & Trace
  console.log('\n--- 5. EXECUTION ENGINE & LIVE PREVIEW SYNC AUDIT ---');
  const matchedWorkflows = AdvancedWorkflowEngine.matchWorkflows('keyword', { text: 'I want vip access' });
  assert(
    matchedWorkflows.some((w) => w.id === complexWorkflow.id),
    'Engine matches incoming keyword payload to active workflow trigger'
  );

  console.log('\n====================================================');
  console.log(`QA AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
