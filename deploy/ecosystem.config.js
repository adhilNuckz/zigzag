module.exports = {
  apps: [{
    name: 'zigzag-server',
    script: 'src/index.js',
    cwd: './server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    // Do NOT log IPs or user data
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/dev/null',
    out_file: '/dev/null',
    merge_logs: true,
  }],
};
