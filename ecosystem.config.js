module.exports = {
  apps: [
    {
      name: 'web-portal-staging',
      script: 'npx',
      args: 'serve -s /var/www/web-portal/build -l 3003 --no-clipboard',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      cwd: '/var/www/web-portal',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      error_file: '/var/www/web-portal/logs/pm2-error.log',
      out_file: '/var/www/web-portal/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

