# Phase 3 checkpoint: message persistence and scheduled workflow delays

## Changes

- Replaced process-memory messages and conversations with separate asynchronous Supabase repositories. Callers now await reads/writes. Queries use the caller's workspace; contact ownership is checked before a message is saved.
- Duplicate provider message IDs preserve the original row instead of resetting delivery state. Compare-and-set receipt updates prevent late or concurrent `sent`/`failed` receipts from replacing `read`. Failed sends no longer invent a provider message ID.
- Added `20260930_message_conversations.sql`. Its conversation-event RPC atomically records an event and updates unread counts/timestamps, using a workspace/event unique key to avoid counting inbound retries twice. Inbound provider timestamps determine the 24-hour window; outbound activity does not reopen it. Inbox summaries query the latest message per phone, and outbound statistics use database counts.
- Workflow session lookup, listing and clearing are workspace-scoped. A due delay remains resumable instead of being deleted as expired; ordinary expired reply sessions still expire. Customer replies cannot advance a delay early.
- Added an authenticated internal delay runner and a worker poller. The worker requests a scan every 15 seconds; each scan resumes up to ten due sessions. Overlapping scans are suppressed within the web process. Use the same random `WORKER_SECRET` (minimum 32 characters) for web and worker. The optional `WORKFLOW_RUNNER_URL` defaults to localhost port 3000; use the configured application port or URL in other deployments.
- Long delays in simulations fast-forward without creating live scheduled sessions. Invalid delay amounts/units fail explicitly. Session writes use temporary-file replacement and report immediate persistence failures.
- Worker environment loading now reads the project `.env.local` and `.env`, and database administration requires the service-role key.

## Validation

39 isolated regression tests pass. New coverage includes repository reloading, workspace isolation, duplicate messages, concurrent/out-of-order receipts, outbound-only counts, policy windows, conversation RPC arguments, session restart/disk failure behavior, actual delay-branch execution, simulation isolation, runner authentication and overlapping worker scans. Database tests use a fake backend: they do not prove the SQL migration executes on PostgreSQL.

TypeScript, worker JavaScript syntax checks and the production build pass. Built-server smoke passed for the login page, three protected APIs, Google impersonation rejection, OAuth state, worker endpoint authentication and logout. The temporary server was stopped after the test.

`npm run check:setup` still reports `ENOTFOUND` for the configured Supabase hostname. Both session and worker secrets are configured locally; no values were printed. No SQL was applied remotely, no production worker was started, and no real WhatsApp messages were sent.

## Deployment requirements and remaining limits

Fix the intended Supabase URL/service-role credentials privately, compare the live schema, then apply the phase 2 policy migration and `supabase/migrations/20260930_message_conversations.sql`. For a new empty database only, use the complete schema. The new message/conversation paths depend on these database tables and RPCs. Verify restart persistence, incoming messages, unread counts and delivery receipts against a controlled real recipient after setup.

The delay runner is an interim single-host implementation. Workflow definitions, execution logs and sessions still use the local JSON store. Keep one web process and persistent local storage; do not scale this across replicas. Its process lock is not a distributed lock, and a crash after consuming a waiting session can interrupt the remaining nodes. It does not provide exactly-once delivery, crash recovery of in-progress runs or transactional node execution. Moving workflows/runs to the database with claims and idempotent node dispatch remains the next core task.

Durable webhook execution deduplication, campaign/follow-up dispatch recovery, remaining Test Center/demo paths, broader tenant authorization and configurable AI agents/business knowledge still need work. The complete SaaS is not production-ready yet.
