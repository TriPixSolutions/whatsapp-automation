# Phase 4 checkpoint: durable workflow runtime

## Implemented

- Visual workflow definitions now read and write `workflow_definitions` through an awaited Supabase repository. Builder IDs remain text values, avoiding the UUID mismatch in the legacy `automations` table.
- Waiting sessions now live in `workflow_sessions`, uniquely keyed by workspace and phone number. Session reads validate the owning workspace and workflow. Expired reply sessions are removed; due delay sessions remain available for the runner.
- Execution traces now persist in `workflow_executions`. Reads require a workspace and are limited to that tenant.
- The delay runner claims due rows transactionally with `FOR UPDATE SKIP LOCKED`. Claims expire after five minutes so a crashed worker can be retried. Failed runs retain their waiting session and release the claim; successful runs delete only the exact session they resumed.
- Workflow matching, inbound resume, builder CRUD, template imports, diagnostics, simulations and test flows now await the database runtime.
- Removed the duplicate DAG write into the incompatible legacy automation path.
- Added `scripts/migrate-workflow-store.cjs`. It is read-only by default and reports the legacy JSON contents. After applying the SQL migration, run `npm run migrate:workflows -- --apply` once to copy compatible definitions, execution logs and waiting sessions. Keep the JSON file as a backup until live verification passes.
- Template import and template-test endpoints independently require an authorized user and ignore client-supplied workspace IDs. The template test now saves its inbound message in the signed-in workspace.
- Meta API logs, webhook logs and delivery receipts are now filtered by workspace. Manual webhook replay can only select an event visible to the signed-in workspace.

## Database changes

Apply `supabase/migrations/20260930_workflow_runtime.sql` after the earlier service-role and message/conversation migrations. It creates:

- `workflow_definitions`
- `workflow_executions`
- `workflow_sessions`
- `claim_due_workflow_delays(limit, claim_token)`

The complete empty-database schema contains the same objects. The migration grants access only to the service role. It was reviewed and covered through repository/RPC contract tests, but could not be executed against PostgreSQL because the configured Supabase hostname still fails DNS resolution and no local PostgreSQL runtime is installed.

## Validation

- 40 isolated tests pass, including workflow persistence across repository instances, tenant isolation for matching phone numbers, exact-session deletion, execution history isolation, expiration behavior, delay claims, runner authentication and log isolation.
- TypeScript validation passes.
- Worker and migration scripts pass Node syntax checks.
- The production build passes. The built-server smoke test passes for the login page, protected APIs, Google impersonation rejection, OAuth state, worker endpoint authentication and logout.
- The migration dry run found 2 workflow definitions, 39 execution logs and 0 active sessions in the legacy JSON store. It performed no database writes.

## Remaining limits

The configured Supabase host is still unavailable (`ENOTFOUND`), so the migration was not applied and live persistence was not verified. Until the database is fixed and migrations are applied, the new workflow endpoints will correctly fail instead of falling back to JSON state.

The database claim prevents two workers from claiming the same delay at the same time and supports retry after a stale claim. It still cannot guarantee exactly-once WhatsApp delivery if a process crashes after Meta accepts a send but before execution state is saved. Per-node idempotency keys and a durable outgoing-message outbox are required for that guarantee.

Legacy simple automations, campaigns, templates, companies, integrations, telemetry logs and webhook deduplication still contain memory or local-file paths. AI agents, knowledge sources, training, qualification, image selection and human handoff remain later phases. The application is not ready for production deployment yet.
