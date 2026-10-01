# AI WhatsApp Sales & Support Platform

> **Stabilization in progress:** accounts, settings, messages, conversations, workflows, webhook claims, campaigns and scheduled follow-ups now require a working Supabase database plus random `AUTH_SESSION_SECRET` and `WORKER_SECRET` values. Run `npm run check:setup`, `npm run check:production`, `npm test`, and `npm run build`. See [the phase 5 checkpoint](docs/PHASE_5.md) for implemented fixes and remaining work. Older capability and deployment claims below are not a production-readiness guarantee.

> **The enterprise-grade commercial platform engineered to capture more leads, close more sales, and deliver instant 24/7 customer support directly inside WhatsApp.** Built for high-growth businesses and modern e-commerce brands with official Meta Cloud API v18.0 integration, autonomous AI sales assistants, and Hostinger Cloud Startup PM2 clustering.

---

## 🌟 Core Business Capabilities

Businesses buy three things: **More Leads**, **More Sales**, and **Faster Support**.

- **Autonomous AI Sales & Support**: Instant, human-like answers powered by Gemini/OpenAI that qualify leads, recommend catalog items, and resolve customer questions in under 3 seconds.
- **In-Chat WhatsApp Checkout**: Direct interactive checkout flows (`checkout_*`, `buy_*`) with zero-friction payment links and instant order confirmations.
- **Shared Multi-Agent Team Inbox**: Real-time live conversation syncing without page reload (2.5s polling), multi-agent assignment, private notes, and official read receipt ticks (`✓`, `✓✓`, blue `✓✓`).
- **Targeted Broadcast Campaigns**: Paced BullMQ worker with explicit recipient IDs and persisted per-recipient results. Actual throughput and Meta rate limits depend on the connected account.
- **Omnichannel E-Commerce Sync**: Direct catalog and customer webhooks for Shopify, WooCommerce, Google Sheets, and custom CRM systems.
- **Live Sales & Conversion Analytics**: Dedicated `/analytics` dashboard with multi-step funnel tracking (Inquiries &rarr; AI Qualified &rarr; Catalog Viewed &rarr; Checkout Initiated), revenue attribution, and 1-click CSV audit exports.

---

## 🚀 Infrastructure & Deployment: Hostinger Cloud Startup

Engineered specifically for **Hostinger Cloud Startup** and modern Linux VPS servers:

- **Standalone Node.js Server**: Built with `output: 'standalone'` in `next.config.ts`, generating `.next/standalone/server.js` with self-contained dependencies and optimal memory footprint.
- **PM2 Process Management**: [`ecosystem.config.js`](./ecosystem.config.js) runs one web process and one worker with automatic recovery and separate logs. Webhook claims are persisted in Supabase so multiple web processes do not rely on process-local deduplication.
- **Zero Third-Party Vendor Lock-In**: Fully removed Vercel telemetry and platform dependencies.
- **Nginx Reverse Proxy & SSL**: Step-by-step setup with Let's Encrypt Certbot provided in [`HOSTINGER_DEPLOYMENT.md`](./HOSTINGER_DEPLOYMENT.md).

---

## 📁 Project Architecture

All components strictly follow single-responsibility modular architecture:

```
whatsapp-auto-saas/
├── .env.example                     # Production environment variable reference
├── HOSTINGER_DEPLOYMENT.md          # Complete Hostinger Cloud Startup setup guide
├── ecosystem.config.js              # PM2 cluster configuration
├── package.json                     # Standalone Next.js production dependencies
├── next.config.ts                   # Standalone Node.js compilation & security headers
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Commercial homepage orchestrator (33 lines)
│   │   ├── solutions/               # Solutions & feature deep-dives
│   │   ├── pricing/                 # Commercial transparent pricing tiers
│   │   ├── integrations/            # Shopify, WooCommerce, Meta Cloud matrix
│   │   ├── about/                   # Infrastructure, security & privacy overview
│   │   ├── contact/                 # Contact & enterprise discovery form
│   │   ├── dashboard/               # Live command center with DashboardHero
│   │   ├── analytics/               # Revenue attribution & conversion funnel
│   │   ├── inbox/                   # Omnichannel shared team inbox
│   │   ├── automations/             # 4-node WhatsApp visual flow builder
│   │   ├── campaigns/               # Broadcast campaign dispatch & logs
│   │   ├── contacts/                # Opted-in customer CRM & CSV bulk importer
│   │   ├── settings/                # WABA credentials & security key vault
│   │   └── api/
│   │       ├── ai/chat/             # Gemini/OpenAI streaming assistant
│   │       ├── webhook/whatsapp/    # Official Meta Cloud API v18.0 webhook
│   │       ├── catalog/sync/        # Meta Commerce Catalog batch sync
│   │       └── campaigns/dispatch/  # Async queue broadcast dispatcher
│   ├── components/
│   │   ├── home/                    # Modular landing page blocks (< 120 lines each)
│   │   ├── solutions/               # Solutions hero & interactive cards
│   │   ├── pricing/                 # Pricing hero & comparison tiers
│   │   ├── integrations/            # Integrations hero & connection grid
│   │   ├── about/                   # About hero & enterprise security specs
│   │   ├── contact/                 # Contact hero & validation form
│   │   ├── dashboard/               # Dashboard hero & performance widgets
│   │   ├── analytics/               # Analytics hero & funnel visualization
│   │   ├── settings/                # Settings hero & credential managers
│   │   ├── sidebar/                 # Modular navigation & profile components
│   │   ├── PublicNav.tsx            # Sticky header with active path indicators
│   │   └── PublicFooter.tsx         # Comprehensive legal & platform footer
│   └── lib/
│       ├── meta/                    # Official Meta Graph API v18.0 client
│       ├── webhook/                 # Handshake, checkout, inbound & AI assistant
│       └── db/                      # In-memory and persistent storage drivers
```

---

## ⚡ Quick Start

### 1. Configure Environment
```bash
cp .env.example .env.local
```
Add your **Meta Phone Number ID**, **WhatsApp Business Account (WABA) ID**, and **System User Access Token**.
Also configure `META_APP_SECRET`, a public HTTPS `NEXT_PUBLIC_APP_URL`, and a reachable Redis instance.

### 2. Install & Build Standalone
```bash
npm install
npm run build
```

### 3. Run Standalone Node.js Server
```bash
npm run start:standalone
```

Start the background worker in a second process:
```bash
npm run worker
```

### 4. Run with PM2 in Production
```bash
npm run start:pm2
```

---

## 🛠️ Verification & Testing

Run the active validation commands:
```bash
npm run check:setup
npm run check:production
npm test
npm run lint
```

`check:production` performs read-only live probes for Supabase, Redis, Meta credentials, webhook signing configuration and the public HTTPS callback URL. It does not send a WhatsApp message.

---

## 📜 License & Compliance

Complies with the official [Meta WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy) and [Meta Commerce Terms](https://www.facebook.com/legal/commerce_product_merchant_agreement). Zero consumer chat logs are stored without consent.
