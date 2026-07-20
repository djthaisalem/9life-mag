module.exports = {
  apps: [
    {
      name: '9life-mag',
      cwd: '/var/www/9life-mag/current',
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
