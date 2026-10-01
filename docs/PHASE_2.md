# Phase 2 checkpoint: accounts, settings, contacts and workspace boundaries

## Implemented

- Signed sessions are verified in both Edge middleware and server authorization. Browser-readable legacy cookies are display hints only; they no longer grant access. Stored membership, status and workspace are checked on each authorized request. Missing users are not recreated from session claims.
- Removed password-free Google impersonation through the login/signup JSON endpoints. Google OAuth now checks browser-bound state and verified email. Login, signup and profile responses omit password hashes.
- Added server logout to clear the HttpOnly session cookie and connected both logout buttons to it. New passwords use randomly salted scrypt; existing PBKDF2/SHA-256 hashes remain readable during migration.
- Contacts, tags, notes and activity timelines now read/write Supabase with awaited errors. Phone normalization uses the schema’s `workspace_id,phone_normalized` unique key; import, CRM and leads use the signed-in workspace. CRM edits explicitly persist rather than mutating a temporary object. Campaign recipient selection excludes opted-out contacts.
- Accounts and settings were extracted from the large in-memory repository into small Supabase repositories. Reads query the database; writes await database results. There is no seeded administrator login or process-memory account fallback.
- New signups provision a separate owner workspace with UUID identifiers and membership. Existing members are resolved from `workspace_members` rather than assigned to the default workspace.
- Settings read/write `workspaces`, `meta_connections` and `phone_numbers` according to the supplied schema. Shared default Meta credentials cannot silently become a different workspace's send credentials. Workers now resolve phone IDs from the correct table too.
- Workflow CRUD and campaign requests derive the workspace from the authenticated user; another workspace's known workflow ID is rejected. Contact lookup/delete no longer use the old cross-workspace memory fallback. These changes are not a claim that all remaining endpoints have been fully tenant-audited.
- Workflow lookup no longer reconstructs and saves demo templates as a side effect. Automatic demo seeding is opt-in. PM2 uses one web process while workflow sessions remain in a local JSON file.
- Added a service-role-only RLS migration, a real database health probe, and `npm run check:setup`. The admin database client no longer falls back to a public anonymous key.

## Configuration and verification

A new random `AUTH_SESSION_SECRET` was added to the ignored local environment file. Its value is not in source control or this report. The separate name deliberately avoids changing the encryption key used for existing Meta tokens. Deployment still needs its own session secret. Existing browser sessions must sign in again.

`npm test`: 28 regression tests passed. These cover signed/forged/expired sessions, revoked membership, Google impersonation, password handling, workflow ownership, settings/account reads across fresh repository instances, worker connection lookup and phase 1 messaging behavior. Database tests use an isolated stateful fake backend, not the inaccessible production database.

`npm run lint`: TypeScript passed. `node --check worker/worker.js`: passed. Production build passed. Built-server smoke passed: login page, three protected APIs rejecting forged cookies, Google impersonation rejection, OAuth state validation, and logout cookie clearing. The temporary server was stopped after testing.

`npm run check:setup`: **blocked by `ENOTFOUND` for the configured Supabase hostname**. Session signing is configured. Read-only database probes could not establish a connection. No remote schema/data writes or policy migrations were executed.

Consequently real signup/login, database persistence across restart, Meta connection save/load and real WhatsApp delivery are **not yet verified**. The application now reports failed database access instead of disguising it with temporary account/settings memory.

## Next required setup

Correct `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` in the ignored environment file using the intended project. Do not paste secrets into chat. Run `npm run check:setup`; review the existing schema before applying `supabase/migrations/20260930_service_role_policies.sql`. For a new empty database, install `supabase/schema.sql`. Do not rerun the whole schema blindly over a populated database.

The supplied schema and live schema have not been compared because the host is unreachable. Existing legacy accounts without `workspace_members` need a deliberate membership migration. Records that only ever lived in process memory cannot be recovered by a database read; preserve any exports or still-running server state before replacing that server.

## Remaining work

1. Complete live database setup and verify two accounts/workspaces, revoked membership, settings round trips and restart survival. Signup/settings and contact-tag updates currently use several checked database operations, not a single transaction; transactional provisioning and concurrent tag updates remain to be hardened.
2. Move conversations, messages, workflow definitions/runs and campaign control state out of the remaining memory/JSON stores. Finish ownership checks in the remaining legacy and Test Center endpoints. The entire SaaS is not yet safe to publish as a completed multi-tenant service.
3. Implement durable webhook execution, delay/resume and per-recipient campaign/follow-up retries.
4. Add configurable agents, business knowledge, image selection, lead scoring, follow-up agents and human handoff.
5. Remove remaining demo behavior and obsolete code, then test the complete real WhatsApp journey before deployment.

Existing token-encryption fallback behavior was preserved to avoid making saved tokens unreadable. Migrating encrypted credentials to a dedicated production encryption key remains a deployment task.
