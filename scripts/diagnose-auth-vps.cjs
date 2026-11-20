const fs = require('node:fs')
const path = require('node:path')
const { parseEnv } = require('node:util')
const { createRequire } = require('node:module')

async function main() {
  const processes = JSON.parse(fs.readFileSync(0, 'utf8').replace(/^\uFEFF/, ''))
  const apps = processes.filter((item) => item.name === '9life-mag')
  if (apps.length !== 1) throw new Error('Expected one 9life-mag PM2 process.')
  const app = apps[0].pm2_env
  const runtimeRoot = path.dirname(app.pm_exec_path)
  const configured = {}
  for (const filename of ['.env', '.env.production', '.env.local', '.env.production.local']) {
    const fullPath = path.join(runtimeRoot, filename)
    if (fs.existsSync(fullPath)) Object.assign(configured, parseEnv(fs.readFileSync(fullPath, 'utf8')))
  }
  Object.assign(configured, app.env || {})
  const keys = ['DATABASE_URI', 'SITE_USER_STORAGE_DRIVER', 'CMS_ADMIN_EMAIL', 'CMS_ADMIN_OTP_CODE', 'CMS_SESSION_SECRET', 'SITE_SESSION_SECRET', 'PAYLOAD_SECRET', 'NEXT_PUBLIC_SITE_URL', 'TRUST_PROXY_HEADERS']
  for (const key of keys) if (typeof app[key] === 'string') configured[key] = app[key]
  const present = (name) => Boolean(configured[name]?.trim() && configured[name].trim() !== 'replace-me')
  const report = {
    runtime: { script: app.pm_exec_path, interpreter: app.exec_interpreter, status: app.status },
    config: {
      storage: configured.SITE_USER_STORAGE_DRIVER || 'file',
      siteUrl: configured.NEXT_PUBLIC_SITE_URL ? new URL(configured.NEXT_PUBLIC_SITE_URL).origin : null,
      trustProxyHeaders: configured.TRUST_PROXY_HEADERS === 'true',
      databaseConfigured: present('DATABASE_URI'),
      payloadSecretConfigured: present('PAYLOAD_SECRET'),
      siteSessionSecretConfigured: present('SITE_SESSION_SECRET'),
      cmsSessionSecretConfigured: present('CMS_SESSION_SECRET'),
      cmsAdminEmailConfigured: present('CMS_ADMIN_EMAIL'),
      cmsOtpConfigured: Boolean(configured.CMS_ADMIN_OTP_CODE?.trim()),
    },
  }
  if (configured.DATABASE_URI) {
    let client
    try {
      const { Client } = createRequire(path.join(runtimeRoot, 'package.json'))('pg')
      client = new Client({ connectionString: configured.DATABASE_URI, connectionTimeoutMillis: 10000 })
      await client.connect()
      await client.query('SET default_transaction_read_only = on')
      await client.query('SET statement_timeout = 15000')
      const columns = await client.query("SELECT table_name, column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('users', 'users_sessions', 'request_guards', 'request_guards_attempt_timestamps') ORDER BY table_name, ordinal_position")
      report.database = { columns: columns.rows }
      const userColumns = new Set(columns.rows.filter((row) => row.table_name === 'users').map((row) => row.column_name))
      if (['role', 'is_active', 'hash', 'salt', 'login_attempts', 'lock_until'].every((column) => userColumns.has(column))) {
        const users = await client.query("SELECT role, COUNT(*)::int AS accounts, COUNT(*) FILTER (WHERE is_active = true)::int AS active, COUNT(*) FILTER (WHERE lock_until > CURRENT_TIMESTAMP)::int AS locked, COUNT(*) FILTER (WHERE hash LIKE 'pbkdf2-sha256%')::int AS modern_hash, COUNT(*) FILTER (WHERE hash IS NOT NULL AND hash NOT LIKE 'pbkdf2-sha256%')::int AS legacy_hash FROM users GROUP BY role ORDER BY role")
        report.database.accounts = users.rows
        if (configured.CMS_ADMIN_EMAIL) {
          const admin = await client.query('SELECT role, is_active, login_attempts, (lock_until > CURRENT_TIMESTAMP) AS currently_locked, (hash IS NOT NULL AND salt IS NOT NULL) AS has_password FROM users WHERE lower(email) = lower($1)', [configured.CMS_ADMIN_EMAIL.trim()])
          report.database.configuredAdmin = admin.rows
        }
      }
      if (columns.rows.some((row) => row.table_name === 'request_guards' && row.column_name === 'attempt_count')) {
        const guards = await client.query("SELECT scope, COUNT(*)::int AS buckets, MAX(attempt_count) AS max_attempts FROM request_guards WHERE scope IN ('login', 'site-login', 'cms-login') GROUP BY scope")
        report.database.rateGuards = guards.rows
      }
    } catch (error) {
      report.databaseError = { name: error.name, code: error.code || error.cause?.code || null }
    } finally { if (client) await client.end().catch(() => {}) }
  }
  report.http = []
  for (const origin of ['https://9lifemag.com', 'https://www.9lifemag.com']) {
    for (const route of ['/api/auth/session/login', '/api/cms/session/login']) {
      try {
        // Invalid schema: no password, account lookup or login attempt is made.
        const response = await fetch(origin + route, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(20000) })
        const body = await response.json().catch(() => ({}))
        report.http.push({ origin, route, status: response.status, message: body.message || null })
      } catch (error) { report.http.push({ origin, route, error: error.name }) }
    }
  }
  console.log('=== AUTH DIAGNOSTICS (no passwords, OTPs or password hashes) ===')
  console.log(JSON.stringify(report, null, 2))
  console.log('=== END AUTH DIAGNOSTICS ===')
  if (process.argv.includes('--show-cms-otp')) {
    const otp = configured.CMS_ADMIN_OTP_CODE?.trim()
    console.log(`CMS OTP — view locally on VPS: ${otp || '(not configured)'}`)
  }
}

main().catch((error) => { console.error(`Auth diagnostics failed: ${error.name}; code=${error.code || 'unknown'}`); process.exitCode = 1 })
