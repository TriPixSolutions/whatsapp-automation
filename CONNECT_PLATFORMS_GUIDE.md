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
| `META_ACCESS_TOKEN` | Your Meta Cloud API Access Token |
| `META_PHONE_NUMBER_ID` | Your Meta Phone Number ID |
| `META_WABA_ID` | Your WhatsApp Business Account ID |
| `META_WEBHOOK_VERIFY_TOKEN` | `passion_fruit_verify_token_2025` |

4. Click **Deploy**.
5. Within 60 seconds, your platform is live on Vercel:
   `https://whatsapp-auto-saas.vercel.app`

---

## 5. 📱 Step 5: Connect Meta WhatsApp Cloud API (Step-by-Step)

### A. Create Meta Developer App:
1. Go to **[https://developers.facebook.com](https://developers.facebook.com)** and log in with your Facebook account.
2. Click **My Apps** &rarr; **Create App**.
3. Select **Other** &rarr; Next &rarr; Select **Business** &rarr; Next.
4. Give your app a name (e.g. `Passion Fruit WhatsApp`) and select your Meta Business Account.
5. Click **Create app**.

### B. Add WhatsApp to Your App:
1. In the App Dashboard, find **WhatsApp** and click **Set up**.
2. Go to **WhatsApp &rarr; API Setup** in the left sidebar:
   - You will see a **Temporary Access Token** (valid 24h for instant testing).
   - You will see a **Phone number ID** (e.g. `109823485764321`).
   - You will see a **WhatsApp Business Account ID** (e.g. `102938475610293`).
   - Copy all 3 values.

### C. Connect Webhook to Passion Fruit:
1. Go to **WhatsApp &rarr; Configuration** in the left sidebar.
2. Under **Webhook**, click **Edit**:
   - **Callback URL**: `https://whatsapp-auto-saas.vercel.app/api/webhook/whatsapp`
   - **Verify Token**: `passion_fruit_verify_token_2025`
   - Click **Verify and save**.
3. Under **Webhook fields**, click **Manage**:
   - Find **`messages`** and click **Subscribe**.

### D. Save Credentials in Passion Fruit:
1. Log in to Passion Fruit at **[https://whatsapp-auto-saas.vercel.app/settings](https://whatsapp-auto-saas.vercel.app/settings)** (Username: `User 1`, Password: `0725`).
2. Paste:
   - **Phone Number ID**
   - **WhatsApp Business Account ID**
   - **Access Token**
   - **Verify Token**: `passion_fruit_verify_token_2025`
3. Click **Save Settings**.

### E. Get a Permanent (Never-Expiring) System User Access Token:
*Temporary tokens expire in 24 hours. For 24/7 production:*
1. Go to **[business.facebook.com/settings](https://business.facebook.com/settings)** (Meta Business Suite &rarr; Settings).
2. Click **Users &rarr; System Users** in the left sidebar.
3. Click **Add** &rarr; Name: `PF System User` &rarr; Role: **Admin**.
4. Click **Add Assets** &rarr; Assign your WhatsApp Business Account with **Full Control**.
5. Click **Generate New Token**:
   - Select your WhatsApp App.
   - Set Token Expiration: **Never**.
   - Check permissions: `whatsapp_business_messaging` and `whatsapp_business_management`.
   - Click **Generate Token** and copy it.
6. Paste this permanent token into your Passion Fruit **Settings** (`/settings`).

---

## 🎉 You're Done! Testing Your Live System

1. Open your live app at **[https://whatsapp-auto-saas.vercel.app/setup](https://whatsapp-auto-saas.vercel.app/setup)**.
2. In **Step 3: Test Webhook Handshake**, click **Verify Webhook Connection**.
3. In **Step 4: Send Live WhatsApp Message**, enter your mobile number and click **Send Live Message via WhatsApp**.
4. Send `"Show me"` from your phone to your Meta WhatsApp number to trigger your automated 3-button showcase!
