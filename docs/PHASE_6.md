# Phase 6 checkpoint: external service readiness

## Implemented

- Added a read-only `npm run check:production` command. It probes Supabase, Redis and the configured Meta Phone Number ID without printing credentials or sending a message.
- The checker also verifies session signing, worker authentication, the Meta App Secret required for webhook signatures and a public HTTPS callback origin.
- Added an explicit `npm run worker` command for the BullMQ campaign, follow-up and workflow-delay worker.
- The campaign worker now uses `META_GRAPH_API_VERSION` instead of a hard-coded endpoint version.
- Campaign logs no longer print recipient phone numbers or names.
- Environment documentation now states that Redis is required; the application has no in-memory campaign fallback.

## Live readiness result on 2026-10-01

- Supabase schema: ready.
- Session and worker secrets: ready.
- Redis: unavailable at the configured local address.
- Meta Phone Number ID probe: rejected with HTTP 401 / OAuth code 190, so the configured token is invalid or expired.
- Meta App Secret: missing, so inbound webhook signatures cannot be verified.
- Public application URL: local-only, so Meta cannot deliver webhooks to it.

No WhatsApp message was sent during these checks.

## Required external setup

Provide a valid permanent Meta System User token for the intended WABA and Phone Number ID, add the Meta App Secret, run a reachable Redis service, and deploy the app at a public HTTPS URL. Then rerun `npm run check:production`. Only after every check passes should a controlled send to an approved test recipient and a real inbound webhook be attempted.
