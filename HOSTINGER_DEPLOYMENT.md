# Hostinger Cloud Startup Deployment Guide
## AI WhatsApp Sales & Support Platform

This production guide walks you through setting up and running the platform on a **Hostinger Cloud Startup** server (Ubuntu 22.04 / 24.04 LTS) with **Node.js 20**, **PM2 Process Manager**, and **Nginx Reverse Proxy with Free SSL**.

---

### 1. Server Prerequisites & Node.js 20 Installation

SSH into your Hostinger Cloud server:
```bash
ssh root@<YOUR_SERVER_IP>
```

Update system packages and install Node.js 20 LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update && sudo apt install -y nodejs git nginx ufw
sudo npm install -g pm2
```

Verify installations:
```bash
node -v    # v20.x.x
npm -v     # 10.x.x
pm2 -v     # 5.x.x
```

---

### 2. Clone Repository from GitHub

Navigate to `/var/www` and clone your project repository:
```bash
cd /var/www
git clone https://github.com/TriPixSolutions/whatsapp-automation.git whatsapp-platform
cd whatsapp-platform
npm ci
```

---

### 3. Configure Environment Variables

Create your production `.env.local` file:
```bash
cp .env.example .env.local
nano .env.local
```

Ensure the following variables are configured:
```env
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Meta WhatsApp Cloud API credentials
META_PHONE_NUMBER_ID=your_phone_number_id
META_WABA_ID=your_waba_id
META_ACCESS_TOKEN=your_permanent_system_user_token
META_APP_SECRET=your_meta_app_secret
META_WEBHOOK_VERIFY_TOKEN=your_custom_secure_verify_token

# Google Gemini / OpenAI key for AI Sales & Support replies
GEMINI_API_KEY=your_gemini_api_key

# Security
ENCRYPTION_KEY=your_32_character_hex_encryption_key
JWT_SECRET=your_random_jwt_secret_key
```

---

### 4. Build and Start with PM2

Run the production build:
```bash
npm run build
mkdir -p logs
```

Start the application in cluster mode with PM2:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

Useful PM2 commands:
- `pm2 status`: View running cluster instances and memory usage.
- `pm2 logs`: Stream real-time access and error logs.
- `npm run reload:pm2`: Zero-downtime cluster reload after GitHub updates.

---

### 5. Nginx Reverse Proxy Configuration

Create an Nginx server block:
```bash
sudo nano /etc/nginx/sites-available/whatsapp-platform
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 6. SSL Certificate (Certbot)

Install Certbot and enable free automatic HTTPS:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### 7. Continuous Deployment (Updating from GitHub)

Whenever you push new code to GitHub:
```bash
cd /var/www/whatsapp-platform
git pull origin main
npm ci
npm run build
npm run reload:pm2
```
Your application updates with **zero downtime**!
