# Controlled product rebuild audit — 3 October 2026

Status: **NEEDS FIX**. This is the pre-rebuild repository and live-state audit. It does not claim production readiness.

## 1. Current architecture

### Runtime request path

The intended live inbound path is already recognizable and should be preserved:

`Meta webhook -> signature verification -> workspace resolution -> durable webhook claim -> event normalization -> inbound persistence -> session lookup -> trigger match/resume -> workflow traversal -> outbound service -> message persistence -> delivery status update`

The concrete implementation is distributed across:

- `src/app/api/webhook/whatsapp/route.ts`: callback verification, destination resolution, HMAC verification, durable event claim and idempotency.
- `src/lib/automations/normalizedEvent.ts`: canonical inbound text/button/list/template normalization.
- `src/lib/automations/inboundDispatcher.ts`: contact/message persistence, live care-window state, session lookup, workflow match and resume.
- `src/lib/automations/advancedWorkflowEngine.ts`: trigger matching, node traversal, branches, sessions, delays and actions.
- `src/lib/whatsapp/messageService.ts`: care-window enforcement, credential selection, provider dispatch, retry and message ledger persistence.
- `src/lib/meta/api.ts`: low-level Meta Cloud API payloads.
- `src/lib/db/workflows.ts`: durable definitions, executions and sessions.
- `worker/worker.js`: Redis campaign jobs, scheduled follow-ups and HTTP-triggered delay scans.

The web application uses a custom signed, HttpOnly session cookie. Authenticated API routes resolve a database user and workspace before using the Supabase service-role client. Server queries are normally scoped explicitly by `workspace_id`.

### Data model

The primary durable runtime tables are `workflow_definitions`, `workflow_executions`, `workflow_sessions`, `webhook_events`, `scheduled_jobs`, `messages`, `conversations`, `contacts`, `media_assets`, `campaigns`, and `campaign_contacts`.

There is also an older automation representation in `automations` and `automation_steps`. It coexists with `workflow_definitions` and is not the canonical visual builder runtime.

### Product surfaces

- Dashboard: `/dashboard`
- Inbox: `/inbox`
- Contacts and Leads: `/contacts`, `/leads`
- Builder: `/automations`
- Templates: `/templates`
- Broadcasts: `/campaigns`
- Automation Lab: `/test-center`
- Settings and connection wizard: `/settings`, `/setup`
- Additional legacy/technical surfaces: `/crm`, `/chatbot`, `/analytics`, `/webhook-logs`, `/api-logs`

## 2. Working core to preserve

- **READY** — Deterministic workspace lookup from the Meta phone-number ID with no default-tenant fallback.
- **READY** — HMAC validation and durable, idempotent webhook claims.
- **READY** — Normalization of text, reply button, list reply and template-button events into stable interaction IDs.
- **READY** — Workspace-scoped persistence for workflow definitions, execution traces and waiting sessions.
- **READY** — Separate live and sandbox session keys (`+number` versus `sandbox:+number`).
- **READY** — Care-window enforcement and explicit template exception.
- **READY** — Real provider message IDs are required for live sends; fabricated provider success IDs were removed from the live path.
- **READY** — Private workspace media bucket, content-signature validation and workspace-scoped signed reads exist at API level.
- **READY** — The latest saved App Secret is accepted by Meta signatures: delivery status webhook events after the credential update are processed.
- **READY** — Baseline build and 102 automated tests passed at commit `93fa729`.

## 3. Broken or incomplete core

- **BLOCKED** — The saved Meta access token is currently rejected by outbound sends as expired/invalid (`#131009`). The ten most recent workflow executions inspected on 3 October failed at the welcome-message node for this reason.
- **NEEDS FIX** — Recent real inbound events reached the canonical pipeline, but most inspected events ended `failed` because the resulting outbound workflow action failed. One earlier inbound event was processed successfully. Signature receipt is working; end-to-end response health is not.
- **BLOCKED** — No persistent production worker/Redis/scheduler has been verified. Live delay, scheduled automation, campaign execution, retries and restart recovery cannot be considered ready.
- **NEEDS FIX** — `scheduled_trigger` is declared in types but has no complete independent scheduler-to-engine execution path.
- **NEEDS FIX** — List sessions are stored as generic `button_click`, reducing trace clarity and validation precision.
- **NEEDS FIX** — Carousel configuration is generic quick-reply/title-variable data, while the approved live carousel template inspected previously uses a different static-body/URL-button schema. Provider compatibility is not enforced from live template metadata.
- **NEEDS FIX** — Media upload is implemented at API/storage level, but builder nodes do not offer a complete select/upload/progress/replace/provider-send experience.
- **NEEDS FIX** — AI nodes can report a simulated result instead of executing a configured provider. Google Sheets is not a complete integration. Unsupported actions remain visible in the builder.
- **NOT VERIFIED** — Fresh signup/login, second-tenant isolation, concurrent-user sessions, live list reply, real button reply, real catalog continuation, live media, restart recovery and volume behavior.

## 4. Duplicate and legacy systems

### Outbound duplication

`WhatsAppMessageService` is intended to be canonical, but several routes bypass it and call `MetaWhatsAppClient` directly:

- Test Center `send-test` for text, template, media, buttons, list, carousel, flow, location and contact card.
- Meta connection test.
- Checkout helper.
- Campaign worker contains a separate provider sender and separate message-ledger implementation.

Consequences: different validation, care-window policy, retry behavior, persistence, error shapes and preview behavior.

### Test duplication

- `/api/test-center/simulate-trigger` uses the canonical dispatcher for message interactions but directly calls engine matching/execution for lead/webhook/API/manual tests.
- `/api/test-center/button-test` and `/api/test-center/carousel-test` provide separate send/simulate paths.
- `/api/automations/templates/test` is another transient engine test path.
- `src/lib/automations/testCenterStore.ts` mixes durable Supabase workflow state with local JSON/in-memory logs, fake sandbox recipients and seeded sample statistics.

### Workflow/model duplication

- More than 50 trigger/message/action aliases are exposed in types and UI, while the engine collapses many to the same behavior.
- `message`, `whatsapp_message`, `button`, `whatsapp_button`, `list`, `whatsapp_list`, `carousel`, and `whatsapp_carousel` are parallel names for a smaller set of product concepts.
- The builder page contains large hardcoded “production ready” sample workflows and invented analytics counts.
- `workflow_definitions` is canonical, while old `automations`/`automation_steps` remain in the schema.

### UI and preview duplication

- Builder cards, right-side preview, Test Center phone mockup and template preview each interpret node configuration independently.
- The preview is not produced from the same normalized outbound message contract that constructs Meta payloads.
- Desktop and mobile navigation define separate item arrays.

### Settings duplication and fake state

- Settings shows hardcoded approved templates rather than live/provider-synced templates.
- Team members are local React state; “Add Member” displays success but does not provision or persist access.
- Timezone is editable in the UI but is not persisted by the settings API.
- The setup wizard, Settings connection form and Test Center configuration form overlap heavily.

## 5. Unnecessary or risky product complexity

- The 2,000-line workflow engine, 1,200-line Test Center and multiple 700–900-line node editors make behavior difficult to reason about.
- The palette exposes unsupported or partially implemented AI, Sheets, commerce, flow and API concepts as if they were equally ready.
- Technical pages and raw logs are first-class product areas instead of advanced diagnostics.
- “Production Ready” labels and hardcoded statistics communicate confidence that runtime evidence does not support.
- Test Center renders internal database/provider payloads in the normal workflow result instead of reserving them for Advanced Debug.
- Dashboard and navigation split closely related Leads/Contacts and expose Analytics before the underlying metrics are consistently durable.

## 6. Security and tenant findings

- **READY** — Signed server sessions, user/workspace revalidation and workspace filters are present on core authenticated routes.
- **READY** — Meta secrets are encrypted at rest and masked in ordinary settings responses.
- **READY** — Media rows and storage paths are workspace scoped.
- **NEEDS FIX** — The application relies on service-role access, so every backend query must remain explicitly workspace scoped; a complete route-by-route tenant test is still required.
- **NEEDS FIX** — In-memory middleware rate limits do not coordinate across processes or deployments.
- **NEEDS FIX** — Public AI chat needs provider cost/rate controls and abuse testing.
- **NOT VERIFIED** — Full adversarial authorization, egress/SSRF, large file concurrency and cross-tenant ID collision tests.

## 7. Rebuild architecture

### Canonical inbound pipeline

Keep the existing webhook boundary, normalization and `InboundAutomationDispatcher`. All production and sandbox inbound events must enter the dispatcher. Sandbox events must remain explicitly synthetic and use isolated sessions.

### Canonical message contract and outbound pipeline

Introduce one provider-neutral `OutboundMessage` contract for text, media, template, buttons, list, carousel and catalog. It must perform validation once and feed all of:

1. WhatsApp-style preview.
2. Provider payload construction.
3. Canonical `WhatsAppMessageService` dispatch.
4. Message persistence and delivery tracking.
5. Human-readable error mapping.

No product route should call `MetaWhatsAppClient` directly except connection diagnostics and template/catalog metadata reads.

### Canonical workflow product model

Keep backward-compatible aliases at the persistence boundary, but show a smaller product vocabulary:

- Triggers: incoming/keyword, interaction, lead, schedule, webhook.
- Messages: text, media, template, buttons, list, approved carousel/catalog.
- Logic: condition and branches.
- Actions: contact/tag/assignment, integration webhook.
- Flow: delay, wait for reply, handoff, stop.

An adapter will map legacy node names to canonical node kinds so existing definitions continue to execute.

### Canonical testing model

- Sandbox: canonical dispatcher + canonical engine + canonical message model + simulated transport, isolated session, visible “not sent to WhatsApp” label.
- Real test: actual webhook and canonical outbound service, provider ID and delivery state.
- Advanced Debug: raw IDs, request diagnostics and database/provider details.

## 8. Controlled rebuild sequence

1. **P0 recovery and audit** — complete: recovery branch, baseline document, repository/live audit.
2. **P0 runtime health** — refresh the Meta token through the existing human credential handoff, verify fresh inbound -> response, and make expired-token health visible without claiming connection readiness.
3. **P1 canonical message model** — shared validation, preview and provider payload preparation; route every product send through `WhatsAppMessageService`.
4. **P1 interaction reliability** — stable ID validation, duplicate-ID prevention, branch validation, list/button/card session types, duplicate webhook and invalid interaction traces.
5. **P1 worker foundation** — verified Redis worker and scheduler, durable retry/lease behavior, restart tests and visible automation health.
6. **P1 builder rebuild** — simple categories, guided linear/branch view, WhatsApp preview beside the selected node, advanced fields hidden.
7. **P1 Automation Lab rebuild** — workflow selection, conversation simulator and plain-language execution timeline; advanced diagnostics collapsed.
8. **P2 media experience** — upload/progress/preview/replace/remove and canonical media send.
9. **P2 dashboard/navigation/settings** — simplified information architecture; real integration/team/template status only.
10. **P2 cleanup** — remove routes, aliases and local stores only after reference and migration checks prove they are unused.
11. **P0 acceptance** — automated suites, build, security/tenant tests, real Meta test-number text/button/catalog paths, delay and worker restart; final second audit.

## 9. Data migration strategy

- No destructive migration is required for the first rebuild stages.
- Add canonical message/node metadata fields only when needed.
- Keep `definition` JSON backward compatible and migrate node aliases lazily through an adapter.
- Do not delete legacy tables or fields until production reference logging proves they are unused.
- Back up each affected definition before automated backfill and retain a reversible migration record.

## 10. Phase 1 decision

The core should be preserved, but the product is **NEEDS FIX** and real outbound automation is currently **BLOCKED** by an expired Meta token. The rebuild should begin with canonical message/outbound architecture and runtime health, then simplify the UI around that proven behavior. A visual-only rewrite would hide the existing execution inconsistencies rather than solve them.
