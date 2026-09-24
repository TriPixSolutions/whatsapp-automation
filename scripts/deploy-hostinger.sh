#!/bin/bash
# ==============================================================================
# Hostinger Cloud Startup - Automated Production Deployment Script
# WhatsApp Automation SaaS Platform
# ==============================================================================

set -e

echo "🚀 Starting Hostinger Cloud Startup Deployment..."

# 1. Ensure required directories
mkdir -p logs
mkdir -p data

# 2. Check Node.js and PM2
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v20+ first."
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# 3. Install dependencies
echo "📦 Installing project dependencies..."
npm ci --prefer-offline --no-audit

# 4. Build Next.js application
echo "🏗️ Building Next.js production bundle..."
npm run build

# 5. Copy public and static assets to standalone output (required for Next.js standalone on VPS)
echo "📁 Copying static assets for standalone server..."
mkdir -p .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/ 2>/dev/null || true

# 6. Install worker dependencies if separate
if [ -f "worker/package.json" ]; then
    echo "📦 Installing worker dependencies..."
    (cd worker && npm install --production)
fi

# 7. Start or reload PM2 services
echo "🔄 Reloading PM2 processes..."
pm2 startOrReload ecosystem.config.js --env production

# 8. Save PM2 list so processes restart on server reboot
pm2 save

echo "✅ Deployment completed successfully!"
echo "🌐 Verify system health: curl -I http://localhost:3000/api/health"
