import { NextRequest, NextResponse } from 'next/server';
import { database, checked } from '@/lib/db/client';
import { SettingsDB, DEFAULT_WORKSPACE_ID } from '@/lib/db';
import { resolveWorkspaceFromPhoneNumberId } from '@/lib/meta/resolver';
import { AdvancedWorkflowEngine } from '@/lib/automations/advancedWorkflowEngine';
import { TestCenterStore } from '@/lib/automations/testCenterStore';
import { matchKeywordRule } from '@/lib/automations/normalizedEvent';
import { META_GRAPH_VERSION } from '@/lib/meta/validation';
import axios from 'axios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetPhoneId = searchParams.get('phoneId') || '1343260565532810';
  const autoSubscribe = searchParams.get('subscribe') === 'true';

  const report: Record<string, any> = {
    timestamp: new Date().toISOString(),
    serverEnv: process.env.NODE_ENV || 'production',
  };

  // 1. Test Deterministic Workspace Resolution
  const resolution = await resolveWorkspaceFromPhoneNumberId(targetPhoneId);
  report.resolution = {
    targetPhoneId,
    success: resolution.success,
    workspaceId: resolution.workspaceId,
    workspaceName: resolution.workspaceName,
    wabaId: resolution.wabaId,
    appId: resolution.appId,
    displayPhone: resolution.displayPhoneNumber,
    error: resolution.error,
  };

  const resolvedWsId = resolution.workspaceId || DEFAULT_WORKSPACE_ID;

  // 2. Inspect Active Workflows in Workspace
  try {
    const workflows = (await TestCenterStore.listWorkflows(resolvedWsId)).filter((w) => w.isActive);
    const testKeywords = ['hello', 'Hello', 'HELLO', ' hello ', 'hello!', 'random text'];
    const keywordEvaluation = testKeywords.map((kw) => {
      const matches = workflows.filter((w) => {
        const triggerNode = w.nodes?.find((n) => n.type.startsWith('trigger') || n.id.includes('trigger'));
        const rawKw = triggerNode?.config?.keyword || w.triggerKeyword || '';
        return matchKeywordRule(kw, rawKw, w.triggerMatchPattern || 'contains').matched;
      });
      return {
        keyword: kw,
        matched: matches.length > 0,
        matchedWorkflows: matches.map((m) => ({ id: m.id, name: m.name })),
      };
    });

    report.workflows = {
      activeCount: workflows.length,
      activeWorkflows: workflows.map((w) => ({
        id: w.id,
        name: w.name,
        triggerType: w.triggerType,
        triggerKeyword: w.triggerKeyword,
        triggerMatchPattern: w.triggerMatchPattern,
      })),
      keywordEvaluation,
    };
  } catch (err: any) {
    report.workflows = { error: err.message };
  }

  // 3. Inspect Recent Webhook Events in Database
  try {
    const db = database();
    const recentEvents = checked(
      await db
        .from('webhook_events')
        .select('id, workspace_id, meta_event_id, event_type, status, created_at, last_error')
        .order('created_at', { ascending: false })
        .limit(20)
    );
    report.recentWebhookEvents = recentEvents || [];
  } catch (err: any) {
    report.recentWebhookEvents = { error: err.message };
  }

  // 4. Inspect Recent Inbound Messages
  try {
    const db = database();
    const recentMessages = checked(
      await db
        .from('messages')
        .select('id, phone_number, direction, type, content, status, created_at, error_message')
        .order('created_at', { ascending: false })
        .limit(10)
    );
    report.recentMessages = recentMessages || [];
  } catch (err: any) {
    report.recentMessages = { error: err.message };
  }

  // 5. Inspect Meta WABA Subscribed Apps via Meta Graph API
  if (resolution.settings?.accessToken && resolution.settings?.wabaId) {
    const wabaId = resolution.settings.wabaId;
    const cleanToken = resolution.settings.accessToken;

    try {
      const subRes = await axios.get(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${wabaId}/subscribed_apps`,
        {
          headers: { Authorization: `Bearer ${cleanToken}` },
          timeout: 8000,
        }
      );

      const subscribedData = subRes.data?.data || [];
      report.metaWabaSubscription = {
        status: 'queried',
        isSubscribed: Array.isArray(subscribedData) && subscribedData.length > 0,
        subscribedApps: subscribedData,
      };

      // If not subscribed and autoSubscribe requested, execute POST /{wabaId}/subscribed_apps
      if (
        (!Array.isArray(subscribedData) || subscribedData.length === 0 || autoSubscribe) &&
        subRes.status === 200
      ) {
        try {
          const postRes = await axios.post(
            `https://graph.facebook.com/${META_GRAPH_VERSION}/${wabaId}/subscribed_apps`,
            {},
            {
              headers: { Authorization: `Bearer ${cleanToken}` },
              timeout: 10000,
            }
          );
          report.metaWabaSubscription.autoSubscribeResult = postRes.data;
          report.metaWabaSubscription.isSubscribed = true;
        } catch (postErr: any) {
          report.metaWabaSubscription.autoSubscribeError = postErr.response?.data || postErr.message;
        }
      }
    } catch (graphErr: any) {
      report.metaWabaSubscription = {
        status: 'error',
        error: graphErr.response?.data || graphErr.message,
      };
    }
  } else {
    report.metaWabaSubscription = {
      status: 'unconfigured',
      reason: 'WABA ID or Access Token missing in workspace settings.',
    };
  }

  return NextResponse.json(report);
}
