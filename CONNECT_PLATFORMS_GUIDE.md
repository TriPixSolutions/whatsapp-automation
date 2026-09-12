# Step-by-Step Guide: Connecting Open-Source & Free Cloud Platforms

This guide is designed for **complete beginners**. You do not need previous DevOps or cloud experience. By following these 4 simple steps, your WhatsApp Automation SaaS will be 100% live on GitHub, Supabase, Redis, and Vercel.

---

## 🚀 Overview of Free Tier Services

All of these platforms offer generous **100% Free Tiers** for development and testing:

| Service | Purpose | Free Tier Allowance | Link |
|---|---|---|---|
| **GitHub** | Code Repository | Unlimited Public/Private Repos | [github.com](https://github.com) |
| **Supabase** | PostgreSQL Database & Auth | 2 Free Databases, 500MB storage | [supabase.com](https://supabase.com) |
| **Upstash Redis** | Serverless Open-Source Redis (BullMQ) | 10,000 commands/day free | [upstash.com](https://upstash.com) |
| **Vercel** | Next.js Frontend & Webhooks Hosting | Unlimited serverless deployments | [vercel.com](https://vercel.com) |
| **Meta Cloud API** | WhatsApp Official Messaging | 1,000 free conversations/month | [developers.facebook.com](https://developers.facebook.com) |

---

## 1. 🐙 Step 1: Create a New GitHub Repository

We have already initialized the Git repository and committed all project files locally on your Mac in `whatsapp-auto-saas/`.

### How to push it to your GitHub:
1. Go to **[https://github.com/new](https://github.com/new)** in your browser.
2. Under **Repository name**, type:
   ```
   whatsapp-auto-saas
   ```
3. Choose **Public** or **Private**.
4. **Leave "Add a README file" UNCHECKED** (we already have a complete one).
5. Click **Create repository**.
6. On the next screen, copy the commands under **"…or push an existing repository from the command line"**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/whatsapp-auto-saas.git
   git branch -M main
   git push -u origin main
   ```
*(Replace `YOUR_USERNAME` with your actual GitHub username).*

---

## 2. ⚡ Step 2: Create a Free Supabase Project (Database)

1. Open **[https://database.new](https://database.new)** (or [supabase.com](https://supabase.com)) and click **Start your project** (sign in with your GitHub account).
2. Click **New Project**:
   - **Name**: `whatsapp-saas`
   - **Database Password**: Choose a strong password (save it).
   - **Region**: Choose the closest region to you (e.g. `Singapore` or `Frankfurt`).
3. Click **Create new project** (takes ~60 seconds to provision).

### Run the Database Tables:
1. In the left sidebar of Supabase, click the **SQL Editor** icon (`>_`).
2. Click **New query**.
3. Open the file [`supabase/schema.sql`](./supabase/schema.sql) from this project, copy the entire text, paste it into Supabase, and click **Run**.
4. Open the file [`supabase/seed.sql`](./supabase/seed.sql), copy the text, paste it into Supabase, and click **Run**.
   - *This automatically creates the 3 test contacts and the "Show me" interactive automation rule!*

### Copy your API Keys:
1. Go to **Project Settings &rarr; Data API**:
   - Copy **Project URL** (e.g. `https://xyzabcdef.supabase.co`).
   - Copy **anon / public key**.
   - Copy **service_role key** (under Secret Keys).

---

## 3. 🔴 Step 3: Create Free Cloud Redis (Upstash)

To power the background queue (BullMQ) without needing a dedicated Linux server immediately:

1. Go to **[https://upstash.com](https://upstash.com)** and sign in with GitHub.
2. Click **Create Database**:
   - **Name**: `whatsapp-queue`
   - **Type**: Regional
   - Choose a region near your Supabase database.
   - Click **Create**.
3. In your database dashboard, scroll down to the **Connect to your database** section:
   - Click the **Node.js (ioredis)** tab.
   - You will see a connection string like:
     ```
     rediss://default:AbCdEf123456@xyz-12345.upstash.io:6379
     ```
   - Copy this URL. This is your `REDIS_URL`.

---

## 4. ▲ Step 4: Deploy to Vercel in 2 Clicks

1. Go to **[https://vercel.com/new](https://vercel.com/new)** and sign in with GitHub.
2. Locate `whatsapp-auto-saas` from your GitHub repository list and click **Import**.
3. In the **Configure Project** screen:
   - Expand the **Environment Variables** section.
   - Add these variables:

| Key | Value from Previous Steps |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
| `REDIS_URL` | Your Upstash Redis URL |
| `META_ACCESS_TOKEN` | `EAAG_SAMPLE_TOKEN` (or Meta Token if you have one) |
| `META_PHONE_NUMBER_ID` | `109823485764321` (or your Meta Phone ID) |
| `META_WABA_ID` | `102938475610293` |
| `META_WEBHOOK_VERIFY_TOKEN` | `apex_luxury_secret_token_2025` |
| `DEFAULT_WORKSPACE_ID` | `00000000-0000-0000-0000-000000000001` |

4. Click **Deploy**.
5. Within 60 seconds, Vercel will give you a live production URL:
   `https://whatsapp-auto-saas-yourname.vercel.app`

---

## 5. 📱 Step 5: Connect Meta WhatsApp Cloud API (Free Test Account)

1. Go to **[https://developers.facebook.com](https://developers.facebook.com)** and log in with your Facebook account.
2. Click **My Apps &rarr; Create App &rarr; Other &rarr; Business**.
3. Select **WhatsApp &rarr; Set up**.
4. Meta will immediately provide:
   - A **Temporary Access Token**
   - A **Test Phone Number ID** (e.g. `109823485764321`)
5. In your Vercel app (or locally), open the **API & Settings** page (`/settings`):
   - Copy the generated Webhook Callback URL: `https://your-app.vercel.app/api/webhooks/meta`.
6. Return to Meta Developer Portal &rarr; **WhatsApp &rarr; Configuration**:
   - Paste the Callback URL.
   - Enter Verify Token: `apex_luxury_secret_token_2025`.
   - Click **Verify and Save**.
   - Under Webhook fields, check **messages**.

---

## 🎉 You're Done! Testing Your Live System

Open your live Vercel URL at `/dashboard#test-lab`:
- Click **Run Test Flow 1** &rarr; Verifies bulk outbound broadcasts.
- Click **Run Test Flow 2** &rarr; Verifies inbound `"Show me"` interactive 3-button responses!
