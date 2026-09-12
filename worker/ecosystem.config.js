/**
 * PM2 Process Configuration for Hostinger Cloud Server
 * Manages the WhatsApp Bulk Sending Worker 24/7 with auto-recovery and memory limits
 */

module.exports = {
  apps: [
    {
      name: 'whatsapp-broadcast-worker',
      script: './worker.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      merge_logs: true,
    },
  ],
};
