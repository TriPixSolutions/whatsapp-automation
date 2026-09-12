# AURA — WhatsApp Cloud API Automation SaaS

> **Enterprise-grade WhatsApp Automation platform built for luxury brands, high-ticket agencies, and private client lead generation.** Powered by Next.js App Router on Vercel, Supabase (PostgreSQL + Auth), and a Node.js BullMQ + Redis background worker on Hostinger Cloud Server.

---

## Key Features

- **Meta WhatsApp Cloud API (v18.0) Integration**: Direct official Cloud API connection for approved message templates and interactive conversational components.
- **High-Throughput Bulk Dispatch Worker**: Long-running background worker utilizing Redis and BullMQ, strictly throttled to 50ms intervals to conform to Meta rate limits.
- **Real-Time Webhook Engine (`/api/webhooks/meta`)**: Instant verification handshake (`hub.challenge`), automatic inbound lead capture, and instant automated response routing.
- **Interactive Conversational Automations**: Rule-based trigger engine (e.g. Inbound `"Show me"` &rarr; Instant 3 Quick Reply Buttons: `[Product Specs, Pricing, Talk to Agent]`).
- **Luxury Minimalist UI**: Dark obsidian surfaces, champagne gold accents, glassmorphism panels, and realistic WhatsApp smartphone simulator.
- **Bulk Audience CSV Ingestion**: Fast drag-and-drop CSV importer with E.164 phone normalization and segment tagging.
- **Interactive Test Lab**: Built-in verification engine allowing full execution and inspection of Test Flow 1 (Outbound Bulk) and Test Flow 2 (Inbound Interactive Automation).

---

## Tech Stack & Architecture

| Layer | Technology | Deployment Target |
|---|---|---|
| **Frontend & API Webhooks** | Next.js 15/16 (App Router), React, Tailwind CSS | Vercel |
| **Background Queue Worker** | Node.js, BullMQ, ioredis, PM2 | Hostinger Cloud Server |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Auth) | Supabase Cloud |
| **Message Broker** | Redis Server | Hostinger Cloud Server |
| **Messaging Infrastructure** | Meta WhatsApp Cloud API (Graph API v18.0) | Meta Platform |

---

## Directory Structure

```
whatsapp-auto-saas/
├── .env.example                     # Production environment variable template
├── DEPLOYMENT.md                    # Complete step-by-step production deployment guide
├── README.md                        # Project documentation
├── package.json                     # Next.js SaaS web application dependencies
├── tsconfig.json                    # TypeScript configuration
├── next.config.ts                   # Next.js configuration (serverExternalPackages)
├── tailwind.config.ts               # Custom luxury color tokens & gradients
├── supabase/
│   ├── schema.sql                   # Supabase SQL DDL schema with RLS & indexes
│   └── seed.sql                     # Seed test workspace, 3 VIP contacts & automation flow
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout with fonts and metadata
│   │   ├── page.tsx                 # Luxury landing page & portal redirect
│   │   ├── globals.css              # Custom styling & glassmorphism
│   │   ├── auth/
│   │   │   ├── login/page.tsx       # Supabase Auth Login (Email + Google OAuth)
│   │   │   └── signup/page.tsx      # Agency Workspace Registration
│   │   ├── dashboard/page.tsx       # Analytics & Test Scenario Lab (Flows 1 & 2)
│   │   ├── contacts/page.tsx        # Audience registry & Bulk CSV Importer
│   │   ├── campaigns/page.tsx       # Template selector, variable mapping & dispatch
│   │   ├── automations/page.tsx     # Rule-based interactive button builder
│   │   ├── settings/page.tsx        # Meta credentials & Webhook URL copy
│   │   └── api/
│   │       ├── webhooks/meta/route.ts   # Meta GET verification & POST inbound handler
│   │       ├── campaigns/dispatch/route.ts # BullMQ queue job pusher
│   │       ├── contacts/
│   │       │   ├── route.ts         # Contact queries & manual additions
│   │       │   └── import/route.ts  # Bulk CSV parser and upsert
│   │       └── test-flow/route.ts   # Test scenario execution runner
│   ├── components/
│   │   ├── Sidebar.tsx              # Minimalist luxury navigation
│   │   ├── Header.tsx               # Status bar with Meta connection indicator
│   │   ├── StatCard.tsx             # Glassmorphic KPI card with trend lines
│   │   ├── PhoneMockup.tsx          # Realistic smartphone interactive preview
│   │   └── CsvImporter.tsx          # Drag & drop audience CSV uploader
│   ├── lib/
│   │   ├── meta/api.ts              # Meta Graph API client (templates, buttons, text)
│   │   ├── queue/redis.ts           # BullMQ queue producer
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase client
│   │   │   └── server.ts            # Server Supabase client & test store
│   │   └── utils.ts                 # Class merger & phone formatters
│   └── types/
│       └── index.ts                 # TypeScript interfaces
└── worker/
    ├── package.json                 # Standalone worker dependencies
    ├── worker.js                    # BullMQ Worker with 50ms pacing & error trapping
    ├── ecosystem.config.js          # PM2 configuration for Hostinger Cloud Server
    └── README.md                    # Worker deployment & monitoring guide
```

---

## Quick Start (Local Development)

### 1. Database Setup
1. Open your Supabase project SQL Editor.
2. Run `supabase/schema.sql` followed by `supabase/seed.sql`.

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase, Meta, and Redis credentials.

### 3. Run the Next.js SaaS Web App
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the console.

### 4. Run the Background Worker
In a separate terminal:
```bash
cd worker
npm install
npm run dev
```

---

## Verification & Test Scenarios

The platform contains a built-in **Interactive Test Scenario Lab** at `/dashboard#test-lab`:
- **Test Flow 1 (Outbound Bulk)**: Dispatches `teaser_alert` (*"Something big is coming soon. Are you ready?"*) to the 3 seeded VIP contacts, throttles at 50ms, and updates `messages_log` with status `'delivered'`.
- **Test Flow 2 (Inbound Interactive Automation)**: Simulates an inbound prospect replying `"Show me"` and verifies the webhook engine instantly fires back a Meta Interactive Message with 3 Quick Reply buttons: `[Product Specs, Pricing, Talk to Agent]`.

For full production deployment instructions on Vercel and Hostinger VPS with PM2, consult [DEPLOYMENT.md](./DEPLOYMENT.md).
