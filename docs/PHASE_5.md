# Phase 5 checkpoint: durable webhooks, campaigns and follow-ups

## Implemented

- Incoming Meta events now use an atomic `claim_webhook_event` database RPC. A completed event is acknowledged without running twice, an active claim returns an error so Meta retries, and a failed or stale claim can be retried.
- Webhook completion uses the exact workspace, Meta event ID and claim token. Failure details are retained in the database without treating a failed attempt as processed.
- Campaign records now use Supabase and database UUIDs. Campaign reads and updates require the owning workspace.
- Campaign queue jobs carry an explicit list of contact IDs. The worker rejects an empty target list, scopes the contact query and campaign update to the workspace, and no longer logs the entire job payload.
- Campaign recipient progress is stored in `campaign_contacts`. BullMQ retries skip recipients already marked sent, delivered or read. Missing Meta message IDs are treated as failures rather than replaced with fake IDs.
- A dispatch starts as pending and becomes processing only in the worker. Queue failure marks the campaign failed instead of leaving it permanently processing.
- Follow-ups now persist as UUID rows in `scheduled_jobs`. Phone numbers are normalized consistently and cancellation requires the workspace, phone, job type and pending state.
- The scheduled-job worker claims due rows transactionally with `FOR UPDATE SKIP LOCKED`, completes only with its claim token, and applies bounded exponential retry before terminal failure.
- Meta diagnostics no longer hard-code production readiness, successful webhook processing, token permissions, phone quality or compliance verification. The response distinguishes local configuration, a successful Meta probe and actual processed webhook history.
- The setup checker now includes campaigns, campaign recipients and scheduled jobs.

## Database changes

Apply these after the Phase 4 workflow migration:

1. `supabase/migrations/20260930_durable_webhooks.sql`
2. `supabase/migrations/20260930_durable_scheduled_jobs.sql`

The complete `supabase/schema.sql` contains the same columns, indexes, functions, grants and policies for a new database. On 2026-10-01 it was applied successfully to the new Supabase project. The database is intentionally fresh: `users`, `workspaces`, `workflow_definitions`, `contacts` and `messages` currently contain zero rows.

## Validation

- 48 isolated tests pass. The new coverage checks persistent campaign UUIDs and tenant isolation, atomic webhook claims, retryable webhook failures, scheduled-job persistence, tenant-scoped cancellation, claim-token completion and retry limits.
- TypeScript validation passes with `npm run lint`.
- Worker files pass Node syntax checks and `git diff --check` passes.
- The optimized Next.js production build passes.
- `npm run check:setup` confirms worker authentication, session signing and all 20 required tables are available in the live database.
- The workflow-delay and scheduled-job claim RPCs execute successfully against live PostgreSQL and return an empty result on the fresh database.
- The standalone startup wrapper loads `.env.local` before loading the Next.js server. The standalone homepage and `/api/health` both return HTTP 200; the health response reports the database and session signer as up.
- A live signup smoke test created an isolated user, workspace and membership, verified the signed `/api/auth/me` session, confirmed the public response omitted password fields, and then removed all test rows.

## Remaining limits

No real WhatsApp message or live Meta webhook was used in this phase. Supabase is ready, but end-to-end WhatsApp behavior still requires valid Meta credentials, a configured webhook URL, Redis and the worker process. No workflow-store migration was run because the new database has no real workspace yet; create the first account before importing any legacy local workflow definitions.

Campaign retries avoid resending recipients whose successful result reached `campaign_contacts`. A process crash after Meta accepts a message but before that database update can still cause a duplicate. A durable outbound outbox with provider idempotency handling is needed to close that crash window.

Campaign pause, resume and stop currently update persisted state, but the running worker does not yet poll that state between recipients. Template variable mapping is also not passed into the Meta template components yet.

Templates, companies, integrations and some telemetry/test-center stores still use process memory or local files. AI agent profiles, training/knowledge ingestion, lead qualification, media selection and human handoff are later phases. The application is still under stabilization and is not production ready.
