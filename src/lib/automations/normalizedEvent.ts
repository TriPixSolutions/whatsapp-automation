import { AutomationTriggerType, WorkflowDefinition, WorkflowNode } from '@/types/automations';

export interface NormalizedInteraction {
  kind: 'button_reply' | 'list_reply' | 'carousel_button' | 'template_button' | 'flow_response' | 'quick_reply';
  id: string; // stable identifier e.g. 'btn_catalog', 'buy_watch'
  title: string;
  payload?: any;
  cardIndex?: number;
  cardButtonId?: string;
}

export interface NormalizedInboundEvent {
  workspaceId: string;
  phoneNumber: string; // E.164 normalized format (+1..., +91...)
  messageId: string;
  timestamp: string;
  rawType: string;
  text?: string;
  interaction?: NormalizedInteraction;
  isTestSimulation: boolean; // true = sandbox delivery preview, false = live Meta API
  deliveryMode: 'sandbox' | 'live';
  metadata?: Record<string, any>;
}

export interface PipelineTraceStep {
  step: string;
  status: 'passed' | 'skipped' | 'failed';
  details?: any;
  timestamp: string;
}

export interface InboundPipelineResult {
  success: boolean;
  event: NormalizedInboundEvent;
  matchedWorkflowsCount: number;
  matchedWorkflowNames: string[];
  sessionAction: 'none' | 'resumed' | 'preserved_delay' | 'interrupted_delay' | 'cleared';
  resumedSessionId?: string;
  executions: any[];
  error?: string;
  code?: string;
  trace: PipelineTraceStep[];
}

/**
 * Escapes characters with special meaning in Regular Expressions.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalizes text for robust multi-lingual keyword comparison:
 * - Trims whitespace
 * - Converts to lower case
 * - Normalizes unicode (NFC)
 * - Collapses redundant internal whitespace
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Strips common punctuation from text boundaries while preserving alphanumeric
 * and non-ASCII (e.g. Malayalam, Arabic, Devanagari) characters.
 */
export function stripBoundaryPunctuation(text: string): string {
  if (!text) return '';
  // Unicode-safe stripping of leading and trailing punctuation symbols
  return text.replace(/^[!?,.:;\-~*#@%^&()\[\]{}'"]+|[!?,.:;\-~*#@%^&()\[\]{}'"]+$/gu, '');
}

/**
 * Evaluates whether incoming text matches the expected keyword(s) with support for:
 * - Comma or slash separated multiple keywords
 * - Exact match vs Contains match vs Starts-with
 * - Punctuation tolerance (e.g., "hello!" matches "hello")
 * - Regex safety (no crash on *, ?, +, etc.)
 * - Multilingual & Unicode support (Malayalam, Manglish, Hindi, etc.)
 */
export function matchKeywordRule(
  rawIncomingText: string,
  rawExpectedKeywords: string | string[],
  pattern: 'contains' | 'exact' | 'starts_with' | 'regex' = 'contains'
): { matched: boolean; matchedKeyword?: string } {
  const incoming = normalizeText(rawIncomingText);
  if (!incoming) return { matched: false };

  const incomingClean = stripBoundaryPunctuation(incoming);

  const keywordList: string[] = (
    Array.isArray(rawExpectedKeywords)
      ? rawExpectedKeywords
      : (rawExpectedKeywords || '').toString().split(/,|\//)
  )
    .map((k) => normalizeText(k))
    .filter(Boolean);

  if (keywordList.length === 0) {
    return { matched: true };
  }

  // Tokenize incoming text for word-boundary matching across all languages (Unicode aware)
  const tokens = incoming
    .split(/[\s,.;:!?\-_/\\()\[\]{}'"]+/)
    .map(stripBoundaryPunctuation)
    .filter(Boolean);

  for (const kw of keywordList) {
    const kwClean = stripBoundaryPunctuation(kw);

    if (pattern === 'exact') {
      // Direct exact match
      if (incoming === kw || incomingClean === kwClean) {
        return { matched: true, matchedKeyword: kw };
      }
    } else if (pattern === 'starts_with') {
      if (incoming.startsWith(kw) || incomingClean.startsWith(kwClean)) {
        return { matched: true, matchedKeyword: kw };
      }
    } else if (pattern === 'regex') {
      try {
        const regex = new RegExp(kw, 'iu');
        if (regex.test(incoming) || regex.test(incomingClean)) {
          return { matched: true, matchedKeyword: kw };
        }
      } catch {
        // malformed regex is handled safely without throwing
      }
    } else {
      // 'contains' (default)
      // 1. Direct substring match
      if (incoming.includes(kw) || (kwClean && incomingClean.includes(kwClean))) {
        return { matched: true, matchedKeyword: kw };
      }

      // 2. Token match (whole-word match safe for all Unicode / Malayalam)
      if (tokens.includes(kw) || (kwClean && tokens.includes(kwClean))) {
        return { matched: true, matchedKeyword: kw };
      }

      // 3. Safe RegExp word-boundary match (with escaped regex chars)
      try {
        const escaped = escapeRegex(kw);
        const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu');
        if (regex.test(incoming)) {
          return { matched: true, matchedKeyword: kw };
        }
      } catch {
        // Fallback already handled by substring & tokens
      }
    }
  }

  return { matched: false };
}

/**
 * Dynamically finds the trigger node in a workflow definition without assuming array index 0.
 */
export function findTriggerNode(workflow: WorkflowDefinition): WorkflowNode | undefined {
  if (!workflow.nodes || workflow.nodes.length === 0) return undefined;

  // 1. Check explicit trigger types
  const triggerByType = workflow.nodes.find((n) =>
    n.type === 'trigger' ||
    n.type === 'trigger_keyword' ||
    n.type === 'trigger_incoming' ||
    n.type === 'trigger_button' ||
    n.type.startsWith('trigger_') ||
    n.id === 'node_trigger' ||
    n.id === 'node-trigger'
  );
  if (triggerByType) return triggerByType;

  // 2. Check node with trigger configuration
  const triggerByConfig = workflow.nodes.find((n) =>
    Boolean(n.triggerKeyword || n.config?.keyword || n.config?.keywords || n.triggerType)
  );
  if (triggerByConfig) return triggerByConfig;

  // 3. Fallback to first node
  return workflow.nodes[0];
}

/**
 * Extracts expected keywords from a workflow definition and its trigger node safely.
 * Never extracts an action node's message body as a keyword.
 */
export function getWorkflowExpectedKeywords(workflow: WorkflowDefinition, triggerNode?: WorkflowNode): string {
  const node = triggerNode || findTriggerNode(workflow);
  const isTrigger = !node || node.type.startsWith('trigger') || node.id.includes('trigger');
  const nodeText = isTrigger ? (node?.config?.text || '') : '';

  return (
    node?.config?.keyword ||
    node?.config?.keywords ||
    node?.triggerKeyword ||
    nodeText ||
    workflow.triggerKeyword ||
    ''
  ).toString().trim();
}
