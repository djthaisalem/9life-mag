const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const { parseEnv } = require('node:util')
const { migrateAuthSchema } = require('./migrate-auth-schema.cjs')

async function migrateStorageSchema(client) {
  await client.query('BEGIN')
  try {
    await client.query("SET LOCAL lock_timeout = '5s'")
    await client.query('ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar')
    await client.query('SELECT "id", "_objectkey" FROM "media" LIMIT 1')
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

async function main() {
  const [appRoot, dependencyRoot, backupFile] = process.argv.slice(2)
  if (!appRoot || !dependencyRoot || !backupFile || !fs.existsSync(backupFile) || !fs.statSync(backupFile).size) {
    throw new Error('A database backup is required before the additive storage schema migration.')
  }
  const configured = {}
  for (const name of ['.env', '.env.production', '.env.local', '.env.production.local']) {
    const filename = path.join(appRoot, name)
    if (fs.existsSync(filename)) Object.assign(configured, parseEnv(fs.readFileSync(filename, 'utf8')))
  }
  Object.assign(configured, process.env)
  if (configured.SITE_USER_STORAGE_DRIVER !== 'payload') {
    throw new Error('Storage schema migration requires the production Payload configuration.')
  }
  if (!configured.DATABASE_URI) throw new Error('DATABASE_URI is required.')
  const { Client } = createRequire(path.join(dependencyRoot, 'package.json'))('pg')
  const client = new Client({ connectionString: configured.DATABASE_URI, connectionTimeoutMillis: 15000 })
  try {
    await client.connect()
    await migrateStorageSchema(client)
    console.log('Storage schema verified: media._objectkey exists; existing media rows and object paths are unchanged.')
    await migrateAuthSchema(client)
    console.log('Auth schema verified: users.reset_password_requested_at exists; account credentials are unchanged.')
  } finally { await client.end() }
}

module.exports = { migrateStorageSchema }
if (require.main === module) {
  main().catch((error) => {
    console.error(`Storage schema migration failed (${error.code || 'configuration_or_connection'}). Deployment stopped.`)
    process.exitCode = 1
  })
}
