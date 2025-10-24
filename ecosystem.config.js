module.exports = {
  apps: [
    {
      name: 'learnings-nextjs',
      script: 'npm',
      args: 'start',
      cwd: './learnings',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: 'localhost'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: 'localhost'
      },
      // PM2 specific configurations
      watch: false, // Disable file watching in production
      ignore_watch: ['node_modules', '.next', 'logs'],
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Auto restart configurations
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Health monitoring
      health_check_grace_period: 3000,
      // Process management
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'your-username',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-git-repository',
      path: '/var/www/learnings',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
