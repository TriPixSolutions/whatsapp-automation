# Production remediation report — 2 October 2026

## Outcome

Local remediation is implemented and regression-tested. Production is **BLOCKED** pending configuration, additive database migration and live end-to-end acceptance. This report does not promise zero bugs, mark sandbox sends as deliveries, or imply deployment was completed.

Repository: TriPixSolutions/whatsapp-automation, branch main. Starting commit: `2147e4f`. Recovery tag: `remediation-backup-2026-10-02-2147e4f`. No production data reset, customer deletion, credential guessing or key rotation was performed.

## Audit findings checked against current code

| Original finding | Verification and remediation |
| --- | --- |
| Public webhook diagnostics leak data and change subscriptions | Confirmed. Removed public middleware exception; handler now authenticates administrators, scopes events to session workspace, returns only event metadata and has no subscription side effect. |
| Decryption returns ciphertext; encryption returns plaintext on errors | Confirmed. Both now fail closed with an actionable credential error. Production encryption requires ENCRYPTION_KEY. Reconnecting can explicitly replace both old credentials without decrypting broken values. |
| Lead/media IDs violate UUID columns and DB errors ignored | Confirmed. Leads and media use UUIDs and checked database writes. Failed lead automation is surfaced; guessed welcome/follow-up templates were removed. |
| Media files are not stored | Confirmed. Private Supabase Storage upload, MIME/content checks, 16MB cap, hash, tenant-scoped retrieval/deletion and metadata-failure cleanup implemented. A storage asset is not falsely labeled a Meta-uploaded media ID. |
| Companies/templates/integrations use memory | Confirmed. Companies/templates now use tenant-scoped persistent repositories. Removed unused integration memory repository rather than advertise an unimplemented connection. E-commerce integration and invitation features remain outside verified capability. |
| Two inbound engines and an unused dispatcher | Confirmed. Real inbound adapter and synthetic inbound tests call one dispatcher and existing persistent DAG engine. Removed unused ordered engine, legacy localStorage Meta module and generic automatic AI fallback. AI must be an explicit configured workflow action. |
| Fake chatbot Save | Confirmed. /chatbot redirects to the working /automations builder. Legacy flat flow creation/test endpoints are retired with actionable errors; persisted workflows remain available. |
| Test Center can report success while production fails | Confirmed. Shared application pipeline, clear simulation flag, synthetic events cannot open real customer care windows, sandbox sessions use a separate session key. A sandbox pass remains distinct from live delivery and does not validate Meta signatures. |
| Graph version invalid, downgrade to v22 required | Not established by evidence. Code had inconsistent defaults (v21/v25). Central configuration now uses META_GRAPH_API_VERSION, default v25.0. No blind downgrade. Official Meta documentation availability and asset support require a live check; audit version assertion is not accepted as proof. |
| Queue silently dispatches inline when Redis unavailable | Already corrected before this pass. Retained fail-closed enqueue behavior; corrected BullMQ job IDs containing colons and removed worker localhost fallback. Live Redis connectivity is blocked. |
| Delays lack automatic resume | Existing durable sessions/atomic claims, authenticated delay endpoint and background runner already present and regression-tested. Actual worker uptime/restart on the selected Hostinger plan is not verified. |
| Tenant ID accepted from body | Current campaign routes already resolve session workspace. Added credential mutation administrator checks and phone/WABA ownership preflight before writes. Repository isolation tests pass. |
| Missing log indexes / slow lead association | Added composite indexes in migration; reduced latest-message association from repeated filtering to one lookup map. Large-tenant query pagination/search still needs load testing and improvement. |
| Hardcoded connected/version/agent assertions | Removed global always-connected pill and static version/uptime/compliance assertions in affected UI. Lead assignment no longer guesses a Sales Specialist. Metadata presence is not labeled verified webhook health. |
| Unused auth/Prisma dependencies | Verified no runtime imports. Removed next-auth, its Prisma adapter and Prisma. Custom authentication remains. |

## Additional bugs repaired

- Standalone build now copies browser CSS/JavaScript/public assets; a visual preview exposed missing assets in the previous startup path.
- Failed workflow action stops traversal; later actions no longer run after its failure.
- Google Sheets stub no longer reports an actual append. Unconfigured API/webhook actions fail.
- Workflow HTTP destinations require an administrator-approved exact HTTPS hostname, reject redirects and use a timeout. Administrators must approve public service hosts only; infrastructure egress restrictions are still required for strong DNS/private-network protection.
- AI actions fail without provider key/model; sandbox AI does not call a provider or send to a real recipient.
- Customer-care condition reads the actual conversation window instead of returning true.
- Outbound message persistence excludes access tokens and full service options.
- Removed raw payload/customer-content console logging from Meta client and workflow execution paths. Authorized execution traces remain available.
- Cookie-authenticated private API mutations reject a supplied foreign Origin.
- Workflow creation/update validates node count, unique IDs, existing edge targets, next-node references and a single trigger. Runtime loop guard remains; full design-time reachability and per-node schema validation are not yet exhaustive.
- Data deletion callback rejects invalid signatures; requests persist as pending, not completed. Public status excludes private user identity. Actual deletion fulfillment needs an authenticated administrative process and is not claimed complete.

## Files and migrations

Core changes: `src/lib/automations/inboundDispatcher.ts`, `advancedWorkflowEngine.ts`, `validateWorkflow.ts`, `src/lib/webhook/webhookInbound.ts`, `src/lib/db/{settings,business,deletions,workflows,index}.ts`, `src/lib/crypto.ts`, `src/lib/whatsapp/messageService.ts`, `src/lib/meta/{api,config,validation}.ts`, `shared/meta-config.cjs`, automation/test/media/settings/Meta routes, queue/worker, middleware and Header.

New guide: `/meta-setup-guide`, linked from the application header. Covers app/assets/token distinctions, callback and WABA subscriptions, real inbound proof, custom workflows, reply sessions, carousel requirements, workers and troubleshooting.

New additive migration: `supabase/migrations/20261002_business_media.sql`. Adds company fields and query indexes, creates a **private** workspace-media bucket. Applied to production on 2 October 2026; company columns and private bucket were independently verified through Supabase API. It does not delete existing customer data. Verify the bucket remains private if one already exists; ON CONFLICT does not silently change an existing bucket.

Credential rotation: `scripts/rotate-credentials.cjs`. Explicit old/new keys, dry-run default, validates every record before writes, --apply creates a restricted encrypted snapshot and uses concurrency checks. Use a maintenance window; it is not one transaction across all connections. On interruption, reconcile from the recovery snapshot before switching service keys. It was not run against production.

## Validation performed

- TypeScript: passed.
- Automated tests: 91 passed, zero failures. Tests use explicit mocked I/O/stateful fake database; they do not send customer messages.
- Production build: passed on the updated application .
- Dependency audit: zero reported vulnerabilities after removing unused dependencies. A clean package audit does not prove absence of application vulnerabilities.
- Git whitespace validation: passed.
- New regressions: checked lead UUID/insert failure and canonical lead workflow execution; wrong-key/tampered ciphertext, production missing encryption key, raw-byte signature checks, durable company/template isolation, explicit credential recovery, connection ownership preflight, administrator diagnostics, pending deletion privacy, malformed custom graphs, sandbox/live session separation, real storage bytes, MIME spoofing, storage rollback and media tenant isolation.
- Existing regressions include authenticated workspace isolation, delivery receipt deduplication, webhook claim retry, branch matching, carousel/list payloads, message-window checks, persistent workflows/sessions/traces, due-delay claims and worker overlap protection.

Guide smoke test: served the built standalone application, viewed the page in the browser, and verified the styled guide renders. Fixed the missing standalone assets discovered by this check. No live account or WhatsApp action was performed.

## Read-only configuration probe

`npm run check:production` reads local .env files and probes connected external services. These are **not a dump of Hostinger deployment settings**:

| Probe | Result |
| --- | --- |
| Session signing | PASS |
| Worker authentication secret | PASS |
| Stable encryption key, minimum 32 characters | FAIL |
| Local webhook signature secret | FAIL |
| Local public HTTPS application URL | FAIL |
| Supabase base tables | Accessible; new business/media migration missing |
| Redis connectivity | FAIL, connection failed |
| Local Meta environment token | FAIL, HTTP 401 / code 190 |

The local Meta probe does not establish the validity of a different token stored in a workspace connection. No secret values/customer messages were printed. That probe was from the previous local validation. In this continuation, authenticated dashboards became available. Production ENCRYPTION_KEY was copied securely to ignored .env.local without rotation; stored connection credentials decrypt successfully. Saved App Secret has an unexpected format and the saved workspace token returns HTTP 401 / Meta code 190. Hostinger logs independently show incoming signed requests failing HMAC verification.

## Release sequence

1. Preserve database backup and deployment rollback. Apply the additive migration in the correct Supabase project and verify company fields/private bucket. Keep service-role keys server-only.
2. Set the real deployed HTTPS NEXT_PUBLIC_APP_URL, server Supabase URL/key, stable original ENCRYPTION_KEY, session signing secret and WORKER_SECRET. Never substitute a new encryption key for old ciphertext without rotation/reconnection.
3. Replace expired Meta token; reconnect correct App ID/App Secret, WABA and Phone Number IDs. Verify assigned assets/permissions. Follow /meta-setup-guide.
4. Verify both app callback/messages subscription and WABA subscribed_apps. Send a real inbound hello; inspect a persisted workspace event and workflow trace.
5. Configure reachable Redis and a supported persistent worker/external runner. Verify delayed workflows and broadcasts survive restart and retries.
6. Configure provider-supported GEMINI_MODEL and key for AI. Set approved public WORKFLOW_HTTP_ALLOWED_HOSTS only for integrations you use.
7. Rebuild/restart web and worker, execute the 20 live acceptance checks in the readiness report, then approve release.

After successful local build, 91 tests and release checks, commit eb12a25 was pushed to main during this continuation to deploy the critical security fixes and enable live acceptance. Hostinger completed deployment of eb12a25; current deployment confirmed in the dashboard. Overall production acceptance remains blocked by credentials and worker infrastructure; build completion alone does not establish readiness.

## Continuation evidence

- Supabase SQL execution reported success; company field and private media bucket API checks both passed.
- Hostinger already contains Supabase, session, worker and encryption settings. Missing local settings were not assumed missing in production.
- Live health endpoint returned 200 with database/session services up before deployment.
- Old deployed diagnostics returned 200 anonymously and guide returned 404: verified reason to deploy the tested fix. After deployment: health 200, anonymous diagnostics 401, media 401, unauthenticated worker 401, guide 200 and CSS 200.
- Correct App Secret and replacement Meta token must be entered privately by the owner; browser credential-change policy requires user handoff for entry/submission.
- Redis and persistent worker are not configured among the observed production environment variables. The scheduler template in scripts/supabase-workflow-scheduler.template.sql is prepared but not installed; it does not replace the campaign worker.

Live release smoke checks completed: deployed guide content and browser assets passed; database/session health passed; diagnostics and worker authorization passed. Live SaaS account sign-in and Meta send/receive acceptance await owner credential handoff. No real customer message was sent during these checks.
