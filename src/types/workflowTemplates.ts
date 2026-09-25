import { WorkflowNode, VisualWorkflowEdge, AutomationTriggerType } from '@/types/automations';

export type TemplateCategory =
  | 'All'
  | 'Trigger Testing'
  | 'Interactive Buttons'
  | 'E-Commerce & Carousel'
  | 'Schedulers & Delays'
  | 'Lead Capture & CRM'
  | 'Full Demos';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  purpose: string;
  version: string;
  triggerType: AutomationTriggerType;
  triggerKeyword?: string;
  nodes: WorkflowNode[];
  edges: VisualWorkflowEdge[];
  tags: string[];
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedRuntimeMs?: number;
  highlightFeatures: string[];
  author?: string;
  isOfficial?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateImportResult {
  success: boolean;
  workflowId: string;
  workflowName: string;
  nodeCount: number;
  edgeCount: number;
  message: string;
}
