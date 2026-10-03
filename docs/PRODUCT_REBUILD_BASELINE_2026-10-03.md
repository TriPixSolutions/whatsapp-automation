# Product rebuild baseline — 3 October 2026

This document records the recovery baseline before the controlled product rebuild begins.

## Recovery point

- Baseline commit: `93fa729`
- Recovery branch: `recovery/pre-product-rebuild-2026-10-03`
- Working branch: `rebuild/product-experience-2026-10-03`
- Production deployment at the start of this rebuild: Hostinger reported `93fa729` as Completed / Current.

## Verified working baseline

- Supabase-backed authentication, workspace resolution, settings, workflow definitions, sessions, executions, jobs, contacts, conversations, messages, and private workspace media storage exist.
- The existing Meta test phone number and WABA can be reached with the currently saved token.
- A real outbound text was accepted and later shown as read by Meta for the same provider message ID.
- The approved `hello_world` template was accepted by Meta and persisted with its real provider message ID.
- Meta displayed a real inbound `hello` from the designated test recipient.
- The canonical inbound route receives Meta requests and rejects invalid signatures.
- The selected-workflow sandbox can match the repaired keyword trigger, execute message/button branches, resume after a browser refresh, accept a card choice/reply, and complete while persisting its session and trace.
- Production build and 102 automated tests passed at the baseline commit.
- The public Meta setup guide and health endpoint returned HTTP 200.

## Known limitations at the baseline

- Real inbound execution was previously blocked by a saved App Secret mismatch. The new brief reports this as resolved; it must be re-verified without exposing the secret.
- Persistent production Redis, campaign worker, delay scheduler, AI provider configuration, and restart recovery were not verified.
- The approved carousel template layout did not match the generic quick-reply carousel configuration in the builder.
- Team invitation provisioning, timezone persistence, some integrations, large-volume pagination, and complete live multi-tenant acceptance were incomplete.
- The Test Center and builder expose too much implementation detail and contain multiple testing paths.
- A complete fresh login/signup, media upload/send, list reply, real button reply, real catalog continuation, delay/restart, broadcast worker, and concurrent-user acceptance run had not been completed.

## Safety constraints

- Do not reset or delete production data.
- Preserve existing workflows and their executable definitions.
- Use additive migrations with rollback or recovery notes.
- Use only the existing Meta test phone number and designated test recipient for real acceptance.
- Do not migrate, register, disconnect, or otherwise modify the user's production WhatsApp Business App number.
- Do not expose tokens, secrets, private webhook payloads, or customer data in logs or reports.

The detailed architecture audit and rebuild plan will be added after repository evidence has been mapped. No product UI or execution behavior has been changed by this baseline document.
