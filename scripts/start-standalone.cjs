const { createHash } = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { parseEnv } = require('node:util')

const projectRoot = path.resolve(__dirname, '..')

for (const filename of ['.env', '.env.local']) {
  const envPath = path.join(projectRoot, filename)
  if (!fs.existsSync(envPath)) continue
  Object.assign(process.env, parseEnv(fs.readFileSync(envPath, 'utf8')))
}

const requiredKeys = [
  'DATABASE_URI',
  'PAYLOAD_SECRET',
  'CMS_SESSION_SECRET',
  'SITE_SESSION_SECRET',
]
const missingKeys = requiredKeys.filter((key) => !process.env[key]?.trim())
if (missingKeys.length) {
  throw new Error(`Missing production environment variables: ${missingKeys.join(', ')}`)
}

const sessionFingerprint = createHash('sha256')
  .update(`${process.env.CMS_SESSION_SECRET}:${process.env.SITE_SESSION_SECRET}`)
  .digest('hex')
  .slice(0, 12)

process.env.NODE_ENV = 'production'
process.env.HOSTNAME ||= '0.0.0.0'
process.env.PORT ||= '3000'
process.chdir(projectRoot)

console.log(`9LIFE environment loaded. Session fingerprint: ${sessionFingerprint}`)

void import(pathToFileURL(path.join(projectRoot, '.next', 'standalone', 'server.js')).href)
