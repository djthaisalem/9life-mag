const fs = require('node:fs')
const path = require('node:path')
const { parseEnv } = require('node:util')
const { spawnSync } = require('node:child_process')

const [appRoot, pgDump, destination] = process.argv.slice(2)
if (!appRoot || !destination) throw new Error('Usage: backup-postgres.cjs <app-root> <pg-dump> <destination>')
const configured = {}
for (const name of ['.env', '.env.production', '.env.local', '.env.production.local']) {
  const filename = path.join(appRoot, name)
  if (fs.existsSync(filename)) Object.assign(configured, parseEnv(fs.readFileSync(filename, 'utf8')))
}
Object.assign(configured, process.env)
if (configured.PAYLOAD_DROP_DATABASE === 'true') throw new Error('PAYLOAD_DROP_DATABASE must be disabled before deployment.')
if (configured.SITE_USER_STORAGE_DRIVER !== 'payload') {
  console.log('File storage: deployment preserves and backs up the existing runtime data directory.')
  process.exit(0)
}
if (!configured.DATABASE_URI || !pgDump || !fs.existsSync(pgDump)) {
  throw new Error('Payload storage requires DATABASE_URI and pg_dump before deployment.')
}
const url = new URL(configured.DATABASE_URI)
const result = spawnSync(pgDump, ['--format=custom', '--file', destination], {
  windowsHide: true,
  stdio: ['ignore', 'ignore', 'pipe'],
  env: {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    ...(url.searchParams.has('sslmode') ? { PGSSLMODE: url.searchParams.get('sslmode') } : {}),
    PGCONNECT_TIMEOUT: '15',
  },
})
if (result.error || result.status !== 0 || !fs.existsSync(destination) || fs.statSync(destination).size === 0) {
  throw new Error('Database backup failed. Check pg_dump compatibility and database access; no deployment was performed.')
}
console.log('PostgreSQL backup completed.')
