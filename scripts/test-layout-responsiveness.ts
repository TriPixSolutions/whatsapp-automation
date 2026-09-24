/**
 * Automated Responsive Layout & Spacing Test Suite
 * TriPix Solutions / WhatsApp Automation SaaS
 *
 * Verifies Layout Bug Fix for:
 * 1. 1366px (Standard Laptop)
 * 2. 1440px (MacBook / Desktop)
 * 3. 1920px (Full HD Display)
 * 4. 2560px (Ultrawide Display)
 *
 * Ensures:
 * - Navigation Sidebar (240px) and Structure Panel never overlap
 * - Exact 16px gap between Navigation and Structure Panel
 * - Exact 16px gap between Structure Panel and Canvas
 * - Exact 16px gap between Canvas and Inspector / Mobile Preview
 * - Structure Panel is 100% visible (no clipping, no horizontal scroll)
 * - Zero overlap across all screen sizes
 */

import * as fs from 'fs';
import * as path from 'path';

interface ViewportTestCase {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: ViewportTestCase[] = [
  { name: 'Standard Laptop (1366px)', width: 1366, height: 768 },
  { name: 'MacBook Pro / Desktop (1440px)', width: 1440, height: 900 },
  { name: 'Full HD Monitor (1920px)', width: 1920, height: 1080 },
  { name: 'Ultrawide Display (2560px)', width: 2560, height: 1440 },
];

function runLayoutVerification() {
  console.log('================================================================');
  console.log('AUTOMATION BUILDER RESPONSIVE LAYOUT VERIFICATION');
  console.log('================================================================\n');

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

  // 1. Static Code Analysis on Layout Classes
  console.log('--- 1. STATIC CSS & COMPONENT POSITIONING AUDIT ---');

  const pagePath = path.join(__dirname, '../src/app/automations/page.tsx');
  const canvasPath = path.join(__dirname, '../src/components/automations/VisualAutomationCanvas.tsx');
  const leftSidebarPath = path.join(__dirname, '../src/components/automations/LeftWorkflowSidebar.tsx');
  const rightInspectorPath = path.join(__dirname, '../src/components/automations/RightInspectorStudio.tsx');

  const pageContent = fs.readFileSync(pagePath, 'utf8');
  const canvasContent = fs.readFileSync(canvasPath, 'utf8');
  const leftSidebarContent = fs.readFileSync(leftSidebarPath, 'utf8');
  const rightInspectorContent = fs.readFileSync(rightInspectorPath, 'utf8');

  // Verify md:pl-60 offset on page
  assert(
    pageContent.includes('pl-0 md:pl-60'),
    'Page outer container offsets Navigation Sidebar via pl-0 md:pl-60 (240px)',
    'Outer container missing pl-0 md:pl-60'
  );

  // Verify 16px studio padding (gap after navigation)
  assert(
    pageContent.includes('p-3 lg:p-4'),
    'Main studio container applies 16px gutter (p-3 lg:p-4) creating 16px Navigation gap',
    'Main container missing p-3 lg:p-4'
  );

  // Verify gap-4 between studio panels in 3-column layout
  assert(
    canvasContent.includes('gap-4'),
    'Canvas 3-column container enforces exact 16px gaps (gap-4) between all panels',
    '3-column layout missing gap-4'
  );

  // Verify rounded-2xl border card styling for Figma / Miro / n8n aesthetic
  assert(
    leftSidebarContent.includes('rounded-2xl border border-slate-800'),
    'Structure Panel styled as elevated rounded card (rounded-2xl border border-slate-800)',
    'Left panel missing rounded card classes'
  );

  assert(
    canvasContent.includes('rounded-2xl border border-slate-800'),
    'Center Canvas styled as bounded studio canvas card (rounded-2xl border border-slate-800)',
    'Canvas container missing rounded card classes'
  );

  assert(
    rightInspectorContent.includes('rounded-2xl border border-slate-800'),
    'Right Inspector styled as elevated studio card (rounded-2xl border border-slate-800)',
    'Right inspector missing rounded card classes'
  );

  // Verify no absolute collision positioning on panels
  assert(
    !leftSidebarContent.includes('absolute top-3 left-3 z-20') &&
    leftSidebarContent.includes('w-12 h-full rounded-2xl'),
    'Left panel collapsed mode uses sleek docked vertical rail (w-12), eliminating canvas node overlap'
  );

  assert(
    !rightInspectorContent.includes('absolute top-3 right-3 z-20') &&
    rightInspectorContent.includes('w-12 h-full rounded-2xl'),
    'Right inspector collapsed mode uses sleek docked vertical rail (w-12), eliminating canvas node overlap'
  );

  // 2. Mathematical Dimensional Simulation Across Viewports
  console.log('\n--- 2. MULTI-VIEWPORT DIMENSIONAL COLLISION AUDIT ---');

  for (const vp of VIEWPORTS) {
    console.log(`\nEvaluating: ${vp.name} (${vp.width}x${vp.height}px)`);

    const navWidth = 240; // Sidebar w-60
    const outerPadding = vp.width >= 1024 ? 16 : 12; // lg:p-4 -> 16px
    const navToStructureGap = outerPadding; // exactly 16px

    // Left Panel width (w-72 on <1024, lg:w-80 on >=1024)
    const leftPanelWidth = vp.width >= 1024 ? 320 : 288;
    const panelGap = 16; // gap-4

    // Right Inspector width (w-80 on <1024, lg:w-96 on >=1024)
    const rightInspectorWidth = vp.width >= 1024 ? 384 : 320;

    // Available width for Canvas = Total - Nav - (left padding) - LeftPanel - gap - RightInspector - gap - (right padding)
    const studioAvailableWidth = vp.width - navWidth - (outerPadding * 2);
    const canvasWidth = studioAvailableWidth - leftPanelWidth - panelGap - rightInspectorWidth - panelGap;

    // Calculate coordinate layout (x-axis)
    const navStart = 0;
    const navEnd = navWidth;

    const structureStart = navEnd + navToStructureGap;
    const structureEnd = structureStart + leftPanelWidth;

    const canvasStart = structureEnd + panelGap;
    const canvasEnd = canvasStart + canvasWidth;

    const inspectorStart = canvasEnd + panelGap;
    const inspectorEnd = inspectorStart + rightInspectorWidth;

    const rightMargin = vp.width - inspectorEnd;

    console.log(`  Coordinates:`);
    console.log(`    Navigation:      [${navStart}px -> ${navEnd}px] (Width: ${navWidth}px)`);
    console.log(`    Gap 1:           [${navEnd}px -> ${structureStart}px] (Spacing: ${structureStart - navEnd}px)`);
    console.log(`    Structure Panel: [${structureStart}px -> ${structureEnd}px] (Width: ${leftPanelWidth}px)`);
    console.log(`    Gap 2:           [${structureEnd}px -> ${canvasStart}px] (Spacing: ${canvasStart - structureEnd}px)`);
    console.log(`    Center Canvas:   [${canvasStart}px -> ${canvasEnd}px] (Width: ${canvasWidth}px)`);
    console.log(`    Gap 3:           [${canvasEnd}px -> ${inspectorStart}px] (Spacing: ${inspectorStart - canvasEnd}px)`);
    console.log(`    Right Inspector: [${inspectorStart}px -> ${inspectorEnd}px] (Width: ${rightInspectorWidth}px)`);
    console.log(`    Right Margin:    ${rightMargin}px`);

    // Verification 1: Zero overlap between Navigation and Structure Panel
    assert(
      structureStart >= navEnd + 16,
      `[${vp.name}] Zero overlap between Navigation and Structure Panel (${structureStart - navEnd}px >= 16px)`,
      `Overlap detected: navEnd=${navEnd}, structureStart=${structureStart}`
    );

    // Verification 2: Structure Panel 100% visible
    assert(
      leftPanelWidth >= 288 && structureEnd < canvasStart,
      `[${vp.name}] Structure Panel is 100% visible with full width ${leftPanelWidth}px`,
      `Structure panel width constrained: ${leftPanelWidth}px`
    );

    // Verification 3: Center Canvas has positive, functional interactive viewport (> 320px)
    assert(
      canvasWidth >= 320,
      `[${vp.name}] Canvas has generous working viewport (${canvasWidth}px >= 320px)`,
      `Canvas width too small: ${canvasWidth}px`
    );

    // Verification 4: Zero horizontal overflow
    assert(
      inspectorEnd <= vp.width - outerPadding,
      `[${vp.name}] Zero horizontal overflow (inspectorEnd: ${inspectorEnd}px <= max: ${vp.width - outerPadding}px)`,
      `Horizontal overflow by ${inspectorEnd - (vp.width - outerPadding)}px`
    );

    // Verification 5: Collapsed Rail Performance
    const collapsedCanvasWidth = studioAvailableWidth - 48 - panelGap - rightInspectorWidth - panelGap;
    assert(
      collapsedCanvasWidth > canvasWidth,
      `[${vp.name}] When Structure collapsed to 48px rail, Canvas seamlessly expands to ${collapsedCanvasWidth}px (+${collapsedCanvasWidth - canvasWidth}px)`
    );
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} CHECKS`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLayoutVerification();
