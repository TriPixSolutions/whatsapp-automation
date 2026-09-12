# Hostinger Cloud Server Background Worker (BullMQ + Redis)

This worker handles high-throughput asynchronous WhatsApp broadcasts. It consumes campaign jobs from Redis, respects Meta WhatsApp Cloud API rate limits (50ms interval), logs message delivery directly to Supabase, and updates campaign status in real time.

## Quick Start on Hostinger Cloud Server (Ubuntu VPS)

### 1. Install Node.js & Redis
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y redis-server nodejs npm
sudo systemctl enable --now redis-server
sudo npm install -g pm2
```

### 2. Clone Worker Code & Configure Environment
Navigate to your worker directory:
```bash
cd /opt/whatsapp-worker
npm install
```

Create a `.env` file:
```bash
nano .env
```
Populate:
```env
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
META_ACCESS_TOKEN=your-meta-access-token
META_PHONE_NUMBER_ID=your-meta-phone-number-id
```

### 3. Launch with PM2
```bash
# Start worker process
pm2 start ecosystem.config.js

# Ensure it starts on system boot
pm2 startup
pm2 save

# Monitor worker logs in real time
pm2 logs whatsapp-broadcast-worker
```
