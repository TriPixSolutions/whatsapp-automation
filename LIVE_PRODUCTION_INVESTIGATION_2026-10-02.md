# Live production investigation — 2 October 2026

Release decision: **BLOCKED**. This is a verified investigation and repair record, not a claim that every module is ready.

## Connection root cause

The deployed application and Supabase are reachable. The authenticated dashboard showed “WhatsApp Not Connected / Attention Needed”. The workspace's saved credentials decrypt with the production encryption key, so this is not a missing database configuration or decryption failure.

A direct, read-only Graph API probe of the saved test Phone Number ID returned HTTP 401, OAuth code 190: the saved access-token session expired on 1 October 2026 at 09:00 PDT. Meta's authenticated test setup confirms the same Phone Number ID and WABA ID used by the workspace. Its token field is currently empty and offers “Generate token”. The app is published. A correct app/asset ID does not make an expired token valid.

The saved App Secret does not have Meta's expected 32-character hexadecimal format. Previous authenticated Hostinger runtime inspection showed requests reaching this workspace but failing HMAC signature verification. The actual Meta App Secret still needs to be entered and compared through a fresh signed event; format alone cannot establish equality.

No production Business App number was migrated, removed, registered, or disconnected. Only existing test assets were inspected. No secrets are included in this report.

Additional live root cause: the production workflow POST returned HTTP 403, “Cross-origin request rejected”. Middleware compared the public browser origin with Next’s internal reverse-proxy origin. Commit `13abd35` trusts only the configured public application origin, never arbitrary forwarded headers. Same-origin proxy requests and hostile-origin rejection are covered by regression tests. Hostinger shows this commit Completed / Current.

## Repairs

Code commit `bdd19af`: pushed to GitHub; Hostinger shows **Completed / Current**. The deployed browser displays the new loading state and explicit sandbox description.

- Dashboard displays the actual connection failure and no longer defaults unverified quality to GREEN.
- Settings preserves failed connection/save errors, exposes App ID and masked App Secret fields, and rejects malformed replacement App Secrets.
- Removed unsupported administrator username/password settings that gave the impression login credentials could be changed there.
- Automation editor waits for saved workflows instead of briefly displaying executable sample workflows; load/save failures are visible.
- Selected workflow tests filter both matching workflows and resumable sessions by selected workflow ID.
- Button/list/carousel test input is transmitted as the corresponding stable interaction ID.
- Failed and unmatched tests produce visible errors rather than silently returning nothing.
- Sandbox test description clearly states it sends no actual WhatsApp message.
- Connection probes use Authorization headers instead of embedding access tokens in request URLs; the outer test failure no longer logs an entire credential-bearing exception.

Production data repair: existing VIP workflow had 11 nodes and no trigger, despite being ACTIVE. Its prior definition was saved privately to `/tmp/vip-workflow-before-trigger-repair.json`. Added the missing keyword trigger and its edge to the existing welcome node, preserving the other nodes and edges. Supabase read-back and browser refresh show 12 nodes and 14 edges. This repair did not rebuild or delete the workflow.

Additional carousel repairs: missing/rejected carousel templates now fail explicitly without sending a substitute list. The editor and Test Center expose the approved carousel template name. Provider sends require a real `wamid` instead of generating successful-looking IDs. Carousel templates use template policy rather than the ordinary text care-window restriction. Test Center request latency is measured rather than hard-coded. Provider behavior is regression-tested; real carousel delivery remains blocked by credentials/template approval.

## Verification and infrastructure

99 automated tests pass, including new selected-workflow and wrong-session regression tests. TypeScript and production build pass. These tests include mocked providers and do not prove delivery to a real phone.

Live webhook GET challenge returned HTTP 200 with the exact challenge. A deliberately invalid signed POST was rejected with HTTP 401. These prove callback routing and signature rejection, not acceptance of a fresh Meta-signed event.

Live `/api/health`: HTTP 200; database and session services up. Public Meta guide: HTTP 200. Unauthenticated diagnostics, media, and automation APIs: HTTP 401. Production dependency audit: zero reported vulnerabilities in the installed runtime dependency tree.

After the proxy fix, a fresh browser test of the repaired selected VIP workflow matches “hello”, previews welcome/buttons, and reaches WAITING with a four-step trace. The pricing button subsequently completed its branch. A new session survived a full browser reload; `btn_catalog` resumed it into carousel preview, `buy_watch` resumed the card selection into the explicit wait-for-reply node, and a reply reached VIP tagging and COMPLETED with a 12-step trace. These are sandbox executions on the deployed server with the designated test contact; no actual WhatsApp delivery is claimed.

Scoped Supabase queries succeed for definitions, sessions, executions, jobs, contacts, conversations, and messages. The workspace contains persisted sessions and execution records. These historical records do not prove the current repaired workflow can receive a fresh signed Meta event.

Hostinger environment inspection did not find REDIS_URL or GEMINI_API_KEY/GEMINI_MODEL. A persistent Redis-backed worker and externally scheduled delay runner have not been verified. Existing SQL scheduler template is not an installed scheduler. No new paid infrastructure was provisioned.

Security: unauthenticated access protections verified; signed-session/tenant/scoped-storage behavior covered by automated tests. Full adversarial live multi-tenant testing, rate limits, and external-request egress validation remain unverified or incomplete. Do not treat a dependency audit as a complete security assessment.

## Remaining problems

- Expired Meta token and incorrect saved App Secret block real messaging/webhook acceptance.
- Real carousel delivery needs a valid supported Meta carousel configuration/template and a live delivery test; sandbox preview is insufficient.
- No verified persistent campaign worker, Redis service, minute scheduler, or restart/recovery test.
- AI provider configuration and full agent provisioning/training are incomplete.
- Team invitation UI still lacks a persisted invitation/access provisioning implementation; timezone selection is not persisted by the settings API.
- Google Sheets and some commerce/integration actions remain unavailable; unsupported actions must not be counted as functioning modules.
- Large-volume pagination and auxiliary Test Center log durability still need work.
- Optional connection-test/send-test routes still use direct Meta dispatch rather than a uniform outbound policy/persistence entry point.
- A complete fresh-account login/registration and second-tenant live isolation test were not performed during this session.

## Acceptance table

| # | Acceptance item | Result | Evidence / limit |
|---|---|---|---|
| 1 | Login | NOT VERIFIED | Existing authenticated session works; no fresh login performed |
| 2 | Dashboard | PASS | Opened authenticated deployed dashboard; actual warning confirmed |
| 3 | Workspace | PASS | Live settings/workspace and scoped database records accessible |
| 4 | Meta connection | FAIL | Saved token Graph probe: HTTP 401, code 190, expired session |
| 5 | Meta validation | BLOCKED | Full validation requires refreshed token and correct App Secret |
| 6 | Webhook verification | BLOCKED | Correct secret and fresh Meta subscription/challenge must be checked |
| 7 | Test webhook | BLOCKED | Prior real runtime requests failed signature verification |
| 8 | Real incoming WhatsApp | BLOCKED | Needs correct signing secret and user test-phone reply |
| 9 | Keyword trigger | BLOCKED | Missing live trigger repaired; fresh real inbound remains blocked |
| 10 | Workflow execution | NOT VERIFIED | Fresh deployed sandbox pricing/catalog workflows complete; real inbound execution still blocked |
| 11 | Outbound WhatsApp | BLOCKED | Current saved Meta token expired |
| 12 | Button interaction | BLOCKED | UI payload routing fixed; real click round trip pending credentials |
| 13 | Session persistence | PASS | Fresh sandbox waiting session resumed after full browser reload; real-message session remains unverified |
| 14 | Delay | BLOCKED | Persistent runner/scheduler not verified |
| 15 | Resume | BLOCKED | Sandbox button/card/reply resume passes; real signed event and delayed worker resume pending |
| 16 | Lead creation | NOT VERIFIED | Existing lead shown; no new lead-creation acceptance run |
| 17 | Media upload | NOT VERIFIED | Storage migration applied previously; no live upload acceptance run this session |
| 18 | Broadcast | BLOCKED | Token and Redis/worker infrastructure unresolved |
| 19 | Worker restart/recovery | BLOCKED | No verified production worker service |
| 20 | Page refresh/persistence | PASS | Repaired VIP definition visible after live reload and independent DB read-back |

## Required next actions

User: On the existing Meta TEST-number page, generate/refresh the token. Enter it and the matching App Secret from this app's Basic settings into SaaS Settings → WhatsApp Connection (or setup wizard), then save. Browser policy requires the human to enter and submit changed authentication credentials. Do not paste secrets into chat. Then send “hello” from the allowed test recipient to the test sender; after the workflow sends buttons, select a button for a real round trip. Do not touch the actual WhatsApp Business App number.

Infrastructure: provide a persistent Redis service, configure REDIS_URL, run the authenticated worker with the existing worker secret, install/verify the delay scheduler, configure the AI provider/model, and verify restart/recovery. Provisioning any paid plan requires explicit budget authorization.

Final category status: database **READY** for current reachable services; code/module completion **NEEDS FIX**; Meta/webhook/messaging/worker **BLOCKED**; complete live security/multi-tenant acceptance **NOT VERIFIED**.
