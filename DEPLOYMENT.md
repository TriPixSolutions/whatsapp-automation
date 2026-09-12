# Complete Deployment & Operations Handbook: WhatsApp Automation SaaS

This operational manual documents the step-by-step production deployment for the **AURA WhatsApp Automation SaaS Platform**, covering:
1. **Supabase Database & Authentication Setup** (DDL execution, RLS policies, Seed data).
2. **Meta Developer Portal & WhatsApp Cloud API Setup** (App creation, System User Token, Webhook verification, Template approval).
3. **Next.js Vercel Deployment** (App Router, Webhooks, API Routes).
4. **Hostinger Cloud Server Deployment** (Redis Server, Node.js BullMQ Worker, PM2 continuous process manager).
5. **End-to-End Verification Instructions** (Test Flow 1: Outbound Bulk Campaign & Test Flow 2: Inbound "Show me" Interactive Button Reply).

---

## 1. Supabase Setup (PostgreSQL & Auth)

### Step 1.1: Create Project
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Note down your **Project URL** and **API Keys** (`anon` key and `service_role` key) from **Project Settings &rarr; API**.

### Step 1.2: Execute Schema DDL
1. Navigate to the **SQL Editor** in your Supabase dashboard.
2. Open [`supabase/schema.sql`](./supabase/schema.sql).
3. Paste the contents into the SQL Editor and click **Run**.
4. This creates:
   - `workspaces`
   - `contacts` (with unique `(workspace_id, phone_number)` constraint)
   - `campaigns`
   - `messages_log`
   - `automation_flows`
   - All performance indexes (`GIN` on tags, btrees on foreign keys)
   - Row Level Security (RLS) policies.

### Step 1.3: Execute Seed Data
1. Open [`supabase/seed.sql`](./supabase/seed.sql) in the SQL Editor.
2. Click **Run**.
3. This populates:
   - Test workspace: `AURA Private Luxury Agency` (ID: `00000000-0000-0000-0000-000000000001`)
   - 3 VIP test contacts with tag `teaser_list`:
     - `+971501234567` (Julian Vance)
     - `+447700900123` (Lady Eleanor Sterling)
     - `+14155552671` (Marcus Castile)
   - Test campaign `teaser_alert`
   - Automation flow: Keyword `"Show me"` &rarr; 3 Interactive Buttons `[Product Specs, Pricing, Talk to Agent]`

---

## 2. Meta WhatsApp Cloud API Setup

### Step 2.1: Create Meta Developer App
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Click **My Apps &rarr; Create App**.
3. Select **Other** as the use case, then choose **Business**.
4. In the App Dashboard, locate **WhatsApp** and click **Set up**.

### Step 2.2: Obtain Permanent System User Access Token
1. Go to **Business Settings** in Meta Business Manager ([business.facebook.com](https://business.facebook.com)).
2. Navigate to **Users &rarr; System Users &rarr; Add**.
3. Create a System User (Role: **Admin**).
4. Click **Generate New Token**:
   - Select your App.
   - Token Expiration: **Never**.
   - Check permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
5. Copy the generated permanent token (`EAAG...`).

### Step 2.3: Configure Webhook
1. In the Meta App Dashboard, navigate to **WhatsApp &rarr; Configuration**.
2. Click **Edit** next to Webhook:
   - **Callback URL**: `https://your-app.vercel.app/api/webhooks/meta`
   - **Verify Token**: Enter the token configured in your workspace (Default: `apex_luxury_secret_token_2025`).
3. Click **Verify and Save**. Meta will immediately send a `GET` request with `hub.challenge`.
4. Under **Webhook Fields**, click **Manage** and subscribe to:
   - `messages` (inbound user messages & interactive button replies)
   - `message_template_status_update`

### Step 2.4: Create & Approve Meta Template (`teaser_alert`)
1. In Meta WhatsApp Manager, navigate to **Message Templates**.
2. Click **Create Template**:
   - **Category**: Marketing
   - **Name**: `teaser_alert`
   - **Language**: English (US)
   - **Body**: `Something big is coming soon. Are you ready?`
   - **Buttons (Optional)**: Quick Reply or Call To Action: `Discover Collection`
3. Submit for review (usually approved in minutes).

---

## 3. Next.js SaaS Web App Deployment on Vercel

### Step 3.1: Deploy Codebase
1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New &rarr; Project** and import the repository.
3. Configure the Root Directory if deploying the standalone subfolder (`whatsapp-auto-saas`), or root.

### Step 3.2: Set Environment Variables in Vercel
In Vercel **Project Settings &rarr; Environment Variables**, add:

| Variable | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-id.supabase.co` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase Service Role Key |
| `REDIS_URL` | `redis://default:pwd@hostinger-ip:6379` | Hostinger Redis connection |
| `META_ACCESS_TOKEN` | `EAAG...` | Permanent System User Token |
| `META_PHONE_NUMBER_ID` | `109823485764321` | Sender WhatsApp Phone Number ID |
| `META_WABA_ID` | `102938475610293` | WhatsApp Business Account ID |
| `META_WEBHOOK_VERIFY_TOKEN` | `apex_luxury_secret_token_2025` | Webhook verification secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-saas.vercel.app` | Production domain |
| `DEFAULT_WORKSPACE_ID` | `00000000-0000-0000-0000-000000000001` | Default workspace |

4. Click **Deploy**.

---

## 4. Hostinger Cloud Server Deployment (Worker & Redis)

### Step 4.1: Server Initialization (Hostinger Ubuntu VPS)
Connect to your Hostinger VPS via SSH:
```bash
ssh root@YOUR_HOSTINGER_SERVER_IP
```

Update system and install Redis & Node.js:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y redis-server curl git

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 Process Manager globally
sudo npm install -g pm2
```

### Step 4.2: Configure Redis
Edit the Redis configuration file:
```bash
sudo nano /etc/redis/redis.conf
```
1. Set `supervised systemd`.
2. (Optional, if connecting from outside Hostinger): Set `requirepass YOUR_STRONG_REDIS_PASSWORD` and update `bind 0.0.0.0`.
3. Restart Redis:
```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

Verify Redis is running:
```bash
redis-cli ping
# Output: PONG
```

### Step 4.3: Deploy the Worker Process
1. Clone the worker code into `/opt/whatsapp-worker`:
```bash
sudo mkdir -p /opt/whatsapp-worker
cd /opt/whatsapp-worker
```
Copy the contents of [`worker/`](./worker/) to this directory.

2. Install dependencies:
```bash
npm install
```

3. Create the production `.env` file:
```bash
nano .env
```
Paste your credentials:
```env
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_SUPABASE_URL=https://your-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
META_ACCESS_TOKEN=your-meta-permanent-token
META_PHONE_NUMBER_ID=your-meta-phone-number-id
```

4. Start Worker using PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. View live logs:
```bash
pm2 logs whatsapp-broadcast-worker
```

---

## 5. End-to-End Verification & Testing Protocol

### Test Flow 1: Outbound Bulk Campaign
1. Open your application at `https://your-app.vercel.app/dashboard#test-lab`.
2. Click **Run Test Flow 1 (Outbound Bulk)**.
3. **Execution Steps Verified**:
   - Fetches contacts tagged with `teaser_list`.
   - Iterates through the 3 seeded contacts:
     - `+971501234567` (Julian Vance)
     - `+447700900123` (Lady Eleanor)
     - `+14155552671` (Marcus Castile)
   - Sends the template `teaser_alert` with 50ms pacing.
   - Logs each dispatch to `messages_log` with status `'delivered'`.
   - Verifies the Hostinger worker processes all entries without crashing.

### Test Flow 2: Inbound Interactive Automation
1. On the dashboard, click **Run Test Flow 2 (Inbound "Show me")** or send an actual WhatsApp message with the exact phrase `"Show me"` to your WhatsApp Business Number.
2. **Execution Steps Verified**:
   - Inbound webhook POST arrives at `/api/webhooks/meta`.
   - Webhook engine logs the inbound message with text `"Show me"`.
   - Engine matches rule in `automation_flows` where trigger is `"Show me"`.
   - System instantly dispatches back an Interactive Quick Reply message with 3 buttons:
     1. `Product Specs`
     2. `Pricing`
     3. `Talk to Agent`
   - Outbound interactive message is logged to `messages_log`.
   - Both phone mockup and real device display the 3 structured buttons immediately.

---

## 6. Architecture & Maintenance Summary

- **Vercel**: Handles stateless HTTP requests, webhook verification (`hub.challenge`), and enqueuing broadcast jobs into Redis.
- **Hostinger Cloud VPS**: Hosts the Redis queue and the long-running PM2 Node.js worker process. Handles rate-limited batch dispatches (50ms) to Meta Cloud API.
- **Supabase**: Serves as the source of truth for all workspaces, contacts, campaigns, message delivery states, and automation rules.
