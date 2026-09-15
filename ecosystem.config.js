module.exports = {
  apps: [
    {
      name: 'whatsapp-sales-support-platform',
      script: '.next/standalone/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: 'logs/pm2-err.log',
      out_file: 'logs/pm2-out.log',
      log_file: 'logs/pm2-combined.log',
      time: true,
    },
  ],
};
