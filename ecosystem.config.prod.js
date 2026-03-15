module.exports = {
  apps: [
    {
      name: 'web-portal-prod',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      cwd: '/var/www/web-portal-prod',
      env: {
        NODE_ENV: 'production',
        PORT: 4003,
        BUILD_DIR: '/var/www/web-portal-prod/build'
      },
      error_file: '/var/www/web-portal-prod/logs/pm2-error.log',
      out_file: '/var/www/web-portal-prod/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
