const fs = require('node:fs')

// PowerShell 5 cannot parse object keys that differ only by case. PM2 contains
// Windows environment variables such as username/USERNAME, so encode them as rows.
const processes = JSON.parse(fs.readFileSync(0, 'utf8').replace(/^\uFEFF/, ''))
const selected = processes.filter((item) => item.name === '9life-mag').map((item) => ({
  name: item.name,
  pid: item.pid,
  pm2_env: {
    exec_interpreter: item.pm2_env.exec_interpreter,
    pm_exec_path: item.pm2_env.pm_exec_path,
    status: item.pm2_env.status,
  },
  environment: Object.entries(item.pm2_env.env || {}).map(([name, value]) => ({ name, value })),
}))
process.stdout.write(JSON.stringify(selected))
