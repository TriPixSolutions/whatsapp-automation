module.exports = {
  apps: [
    {
      name: 'whatsapp-saas-web',
      script: '.next/standalone/server.js',
      instances: 2, // Optimized for 2-4 vCPU Hostinger Cloud Startup
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '768M', // Prevent memory leaks on low-resource VPS
      node_args: '--max-old-space-size=768',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: 'logs/pm2-web-err.log',
      out_file: 'logs/pm2-web-out.log',
      log_file: 'logs/pm2-web-combined.log',
      time: true,
    },
    {
      name: 'whatsapp-saas-worker',
      script: 'worker/worker.js',
      instances: 1, // Single queue consumer prevents race conditions
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/pm2-worker-err.log',
      out_file: 'logs/pm2-worker-out.log',
      log_file: 'logs/pm2-worker-combined.log',
      time: true,
    },
  ],
};
