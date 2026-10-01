# Stabilization audit — phase 1

Date: 2026-09-30

## Product goal

A multi-workspace WhatsApp SaaS with reliable account connections, visual automations, bulk campaigns, scheduled follow-ups, configurable AI agents, business knowledge, images, lead qualification, and human handoff. Work is deliberately phased. This is an initial architecture/runtime audit and a bounded first repair, not an exhaustive certification of every screen or integration.

## Phase 1 changes

- Live message calls no longer silently report simulated delivery when credentials are absent or sandbox mode is set. Local service simulation requires explicit `allowSimulation`; workflow message-node simulation stays separate from real dispatch.
- Message-node simulations do not contact Meta even when live credentials exist. Live message nodes require actual delivery and use the normal conversation-window check.
- Live text, button/list headers and bodies, footers, and media captions use interpolated workflow variables.
- Webhooks deduplicate individual messages and individual delivery states rather than discarding a whole batch or treating every status for one message as the same event.
- Processing exceptions release the local event claim so a retry can run. This is not durable exactly-once processing: partial side effects and process restarts still require a durable inbox/outbox design.
- Every webhook change resolves its destination separately; unknown phone connections are rejected instead of being silently routed to the default account.
- Production webhooks require signatures; supplied invalid signatures fail in every environment. Missing app secrets fail explicitly. Verification accepts only the configured token and no longer logs tokens.
- Legacy automation replies, fallback AI replies, and follow-up cancellation retain the inbound workspace. Legacy/fallback reply errors are surfaced instead of counting unsuccessful sends as success.
- Inbound contact profiles are matched by sender ID; template quick replies use button-click triggers.
- Workspaces with no workflows no longer inherit all other workspaces' workflows.
- Outgoing read receipts no longer clear unread incoming conversations.
- The webhook handler was simplified; successful events still populate inspector telemetry.

## Validation

- `npm run test:core`: 10 passing regression tests, isolated mocked I/O; no real WhatsApp recipients or database writes.
- `npm run lint`: TypeScript check passes. Despite its name, this command is not an ESLint check.
- `npm run build`: production build passed. Inspector telemetry was subsequently restored and covered by the final TypeScript/regression run.
- `git diff --check`: passes.

No deployment or real Meta send was performed. A build and mocked tests do not establish that the configured Meta app, access token, subscribed WABA, phone number, templates, or public callback work in production.

## Remaining verified architectural problems

| Priority | Area and source | Finding / next repair |
| --- | --- | --- |
| Critical | `src/lib/db/index.ts`, `ecosystem.config.js` | Settings use one shared object and ignore the requested workspace. Most runtime reads use process memory while writes asynchronously mirror to Supabase; they do not consistently reload persisted state. PM2 config starts two web processes. Make the database authoritative and keep all settings, contacts, conversations and runs scoped to a workspace. |
| Critical | `src/middleware.ts`, `src/app/api/automations/route.ts` | Middleware decodes JWT payloads without signature verification and trusts compatibility cookies. Several handlers lack independent authorization; DAG updates/deletes access workflow IDs without ownership checks. Unify verified sessions and enforce workspace ownership on every API operation. |
| Critical | `supabase/schema.sql` | Several policies labeled service-role access use unrestricted `USING (true)` without restricting the role. Replace with explicit tenant access policies and verify them with two accounts before SaaS launch. |
| High | `src/lib/automations/testCenterStore.ts` | JSON persistence uses full-file writes and merges without transactional concurrency. Default workflow seeding can overwrite edited seeded workflows when node/edge counts change. Move definitions, sessions and logs to durable versioned storage; remove auto-activation of demo data. |
| High | `src/lib/automations/advancedWorkflowEngine.ts` | Delay nodes save waiting sessions, but no scheduled caller of `delay_expired` was found. Add a durable job that resumes the exact execution/node and supports cancellation and retries. |
| High | `src/app/api/campaigns/dispatch/route.ts`, `src/lib/queue/campaignQueue.ts` | Campaigns accept workspace IDs from request data. Pause/resume/stop/retry alter local campaign state without directly managing queued execution. Bind to session workspace and implement worker-observed control state and per-recipient idempotency. |
| High | `worker/worker.js`, `supabase/schema.sql` | Worker queries `meta_connections.phone_number_id`, but the provided schema stores that field in `phone_numbers`. Align schema and runtime lookup; avoid cross-workspace environment-credential fallback. |
| High | `src/lib/followup/followupEngine.ts`, `worker/worker.js` | Follow-ups use memory plus best-effort database inserts. Polling marks jobs running without an atomic pending-state claim. Custom text is stored but template dispatch primarily consumes template name. Define one durable job payload and reliable claim/retry/delivery rules. |
| High | `src/lib/webhook/webhookInbound.ts`, webhook route | Processing still happens before acknowledgement and deduplication is process-local. Advanced execution errors can be caught internally. Persist inbound events, acknowledge promptly, and execute with a retryable worker and explicit failure state. |
| High | `src/lib/webhook/webhookAiAssistant.ts`, advanced workflow AI node | Inbound AI uses a fixed prompt and a hard-coded model. AI nodes call the provider/send service directly rather than sharing all message-node simulation behavior. Add separate agent records, knowledge sources, model configuration, conversation context, tools and human handoff; ensure all simulated actions are isolated. |
| High | `src/lib/db/index.ts`, `src/lib/crypto.ts` | Default administrator credentials and fallback cryptographic secrets remain in source. Replace bootstrap defaults with explicit setup, environment validation and a migration strategy. |
| Medium | README, scripts, legacy and DAG engines | Documentation claims exceed current behavior, multiple engines overlap, some node behavior is placeholder, and existing test scripts are excluded from the TypeScript command. Consolidate after reliable execution is in place, using tests to preserve needed features. |

## Step-by-step continuation

1. **Foundation:** verified authentication, tenant ownership, authoritative database reads/writes, schema alignment, explicit setup. Prove workspace A cannot access workspace B and state survives restart.
2. **Reliable core execution:** durable webhook inbox, workflow runs, outgoing delivery, delay/resume, button/list replies. Prove inbound text -> personalized reply -> button -> branch -> scheduled follow-up with a dedicated test number.
3. **Campaigns and follow-ups:** recipient eligibility, approved templates, scheduling, worker controls, partial retry, deduplication, accurate receipts.
4. **AI agents:** create/edit agents, role and business instructions, uploaded knowledge, image selection, initial enquiry agent, follow-up agent, lead-priority agent, and human handoff. Start with configurable knowledge retrieval; do not assume model fine-tuning is required.
5. **Cleanup and release validation:** remove confirmed redundant code and demo behavior, simplify UI setup and errors, then run a controlled real WhatsApp acceptance journey and deployment checks.

## Next live acceptance inputs

A dedicated recipient/test number and the intended Meta app/phone connection are required to test real delivery. Verify configuration without printing tokens. Do not test by broadcasting to existing customers.
