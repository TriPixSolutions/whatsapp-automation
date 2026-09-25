import { WorkflowTemplate, TemplateImportResult, TemplateCategory } from '@/types/workflowTemplates';
import { BUILTIN_WORKFLOW_TEMPLATES } from './workflowTemplatesData';
import { TestCenterStore } from './testCenterStore';
import { AutomationsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { WorkflowDefinition } from '@/types/automations';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CUSTOM_TEMPLATES_FILE = path.join(DATA_DIR, 'custom_workflow_templates.json');

// In-memory custom templates cache
let customTemplates: Record<string, WorkflowTemplate> = {};

function loadCustomTemplates() {
  try {
    if (fs.existsSync(CUSTOM_TEMPLATES_FILE)) {
      const raw = fs.readFileSync(CUSTOM_TEMPLATES_FILE, 'utf8');
      customTemplates = JSON.parse(raw);
    }
  } catch {
    customTemplates = {};
  }
}

function saveCustomTemplates() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CUSTOM_TEMPLATES_FILE, JSON.stringify(customTemplates, null, 2), 'utf8');
  } catch (err) {
    console.warn('[WorkflowTemplatesStore] Error saving custom templates:', err);
  }
}

loadCustomTemplates();

export const WorkflowTemplatesStore = {
  /**
   * Lists all available templates (built-in + custom)
   */
  listTemplates(category?: string, searchQuery?: string): WorkflowTemplate[] {
    loadCustomTemplates();
    const all = [...BUILTIN_WORKFLOW_TEMPLATES, ...Object.values(customTemplates)];

    return all.filter((tpl) => {
      // Category filter
      if (category && category !== 'All') {
        if (tpl.category !== category) return false;
      }
      // Search filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = tpl.name.toLowerCase().includes(q);
        const matchesDesc = tpl.description.toLowerCase().includes(q);
        const matchesPurpose = tpl.purpose.toLowerCase().includes(q);
        const matchesTags = tpl.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesKeyword = tpl.triggerKeyword?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesPurpose && !matchesTags && !matchesKeyword) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * Retrieves a specific template by ID
   */
  getTemplate(id: string): WorkflowTemplate | null {
    loadCustomTemplates();
    const foundBuiltin = BUILTIN_WORKFLOW_TEMPLATES.find((t) => t.id === id);
    if (foundBuiltin) return foundBuiltin;
    return customTemplates[id] || null;
  },

  /**
   * Imports a template into the active workspace as a live/editable Workflow DAG
   */
  importTemplate(
    templateId: string,
    workspaceId = DEFAULT_WORKSPACE_ID,
    customName?: string
  ): TemplateImportResult {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }

    const newWorkflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveName = customName || template.name;

    // Deep clone nodes and edges
    const clonedNodes = JSON.parse(JSON.stringify(template.nodes));
    const clonedEdges = JSON.parse(JSON.stringify(template.edges));

    const newWorkflow: WorkflowDefinition = {
      id: newWorkflowId,
      workspaceId,
      name: effectiveName,
      description: `Imported from template: ${template.name}. ${template.purpose}`,
      triggerType: template.triggerType || 'keyword',
      triggerKeyword: template.triggerKeyword || 'hello',
      triggerMatchPattern: 'contains',
      isActive: true,
      debugModeEnabled: true,
      executionCount: 0,
      stats: {
        enteredCount: 0,
        completedCount: 0,
        droppedCount: 0,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        clickedCount: 0,
        repliedCount: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: clonedNodes,
      edges: clonedEdges,
    };

    // Save into TestCenterStore
    TestCenterStore.saveWorkflow(newWorkflow);

    // Sync into legacy AutomationsDB for full platform visibility
    try {
      AutomationsDB.create(
        {
          id: newWorkflow.id,
          name: newWorkflow.name,
          triggerKeyword: newWorkflow.triggerKeyword,
          triggerType: 'keyword',
          actionType: 'buttons',
          actionPayload: { body: 'DAG Flow', buttons: [] } as any,
          isActive: true,
        },
        workspaceId
      );
    } catch {
      // non-blocking
    }

    return {
      success: true,
      workflowId: newWorkflowId,
      workflowName: effectiveName,
      nodeCount: clonedNodes.length,
      edgeCount: clonedEdges.length,
      message: `Template "${template.name}" successfully imported into your workflow automations!`,
    };
  },

  /**
   * Duplicates a template as a custom user template
   */
  duplicateTemplate(templateId: string, newName?: string): WorkflowTemplate {
    const original = this.getTemplate(templateId);
    if (!original) {
      throw new Error(`Template "${templateId}" not found`);
    }

    const newId = `custom_tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const copy: WorkflowTemplate = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: newName || `${original.name} (Copy)`,
      version: '1.0.0',
      isOfficial: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    customTemplates[newId] = copy;
    saveCustomTemplates();
    return copy;
  },

  /**
   * Converts a template into a transient WorkflowDefinition for dry-run or testing
   */
  getTransientWorkflow(templateId: string, workspaceId = DEFAULT_WORKSPACE_ID): WorkflowDefinition {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }

    return {
      id: `test_${template.id}_${Date.now()}`,
      workspaceId,
      name: `[Test] ${template.name}`,
      description: template.description,
      triggerType: template.triggerType || 'keyword',
      triggerKeyword: template.triggerKeyword || 'hello',
      triggerMatchPattern: 'contains',
      isActive: true,
      debugModeEnabled: true,
      executionCount: 0,
      nodes: JSON.parse(JSON.stringify(template.nodes)),
      edges: JSON.parse(JSON.stringify(template.edges)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
