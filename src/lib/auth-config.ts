import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { assertRuntimeConfigurationWritable, assertSafeConfigurationValues } from '@/lib/config-input-security'

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local')

export const AUTH_ENV_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'RESEND_API_KEY',
  'RESET_PASSWORD_FROM_EMAIL',
  'RESET_PASSWORD_FROM_NAME',
] as const

type AuthEnvKey = (typeof AUTH_ENV_KEYS)[number]

type AuthEnvMap = Record<AuthEnvKey, string>

export type AuthConfigSnapshot = {
  googleClientId: string
  googleClientSecretPreview: string
  hasGoogleClientSecret: boolean
  facebookAppId: string
  facebookAppSecretPreview: string
  hasFacebookAppSecret: boolean
  resendApiKeyPreview: string
  hasResendApiKey: boolean
  resetPasswordFromEmail: string
  resetPasswordFromName: string
  isSocialConfigured: boolean
  isResetConfigured: boolean
}

function emptyEnvMap(): AuthEnvMap {
  return {
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    FACEBOOK_APP_ID: '',
    FACEBOOK_APP_SECRET: '',
    RESEND_API_KEY: '',
    RESET_PASSWORD_FROM_EMAIL: '',
    RESET_PASSWORD_FROM_NAME: '',
  }
}

function parseEnvContent(content: string): Partial<AuthEnvMap> {
  const values: Partial<AuthEnvMap> = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match

    if (AUTH_ENV_KEYS.includes(key as AuthEnvKey)) {
      values[key as AuthEnvKey] = rawValue.replace(/^['"]|['"]$/g, '')
    }
  }

  return values
}

async function readEnvFileMap(): Promise<AuthEnvMap> {
  try {
    const content = await fs.readFile(ENV_FILE_PATH, 'utf8')
    return {
      ...emptyEnvMap(),
      ...parseEnvContent(content),
    }
  } catch {
    return emptyEnvMap()
  }
}

function readRuntimeMap(): AuthEnvMap {
  return {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ?? '',
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ?? '',
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
    RESET_PASSWORD_FROM_EMAIL: process.env.RESET_PASSWORD_FROM_EMAIL ?? '',
    RESET_PASSWORD_FROM_NAME: process.env.RESET_PASSWORD_FROM_NAME ?? '',
  }
}

function buildPreview(value: string) {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}••••${value.slice(-2)}`
}

export async function getAuthConfigSnapshot(): Promise<AuthConfigSnapshot> {
  const fileMap = await readEnvFileMap()
  const runtimeMap = readRuntimeMap()
  const merged = { ...fileMap, ...runtimeMap }

  return {
    googleClientId: merged.GOOGLE_CLIENT_ID,
    googleClientSecretPreview: buildPreview(merged.GOOGLE_CLIENT_SECRET),
    hasGoogleClientSecret: Boolean(merged.GOOGLE_CLIENT_SECRET),
    facebookAppId: merged.FACEBOOK_APP_ID,
    facebookAppSecretPreview: buildPreview(merged.FACEBOOK_APP_SECRET),
    hasFacebookAppSecret: Boolean(merged.FACEBOOK_APP_SECRET),
    resendApiKeyPreview: buildPreview(merged.RESEND_API_KEY),
    hasResendApiKey: Boolean(merged.RESEND_API_KEY),
    resetPasswordFromEmail: merged.RESET_PASSWORD_FROM_EMAIL,
    resetPasswordFromName: merged.RESET_PASSWORD_FROM_NAME,
    isSocialConfigured: Boolean(
      merged.GOOGLE_CLIENT_ID ||
        merged.GOOGLE_CLIENT_SECRET ||
        merged.FACEBOOK_APP_ID ||
        merged.FACEBOOK_APP_SECRET
    ),
    isResetConfigured: Boolean(merged.RESEND_API_KEY && merged.RESET_PASSWORD_FROM_EMAIL),
  }
}

export async function saveAuthConfig(values: {
  googleClientId: string
  googleClientSecret?: string
  facebookAppId: string
  facebookAppSecret?: string
  resendApiKey?: string
  resetPasswordFromEmail: string
  resetPasswordFromName: string
}) {
  assertRuntimeConfigurationWritable()
  assertSafeConfigurationValues(values)
  const current = await readEnvFileMap()

  const next: AuthEnvMap = {
    GOOGLE_CLIENT_ID: values.googleClientId.trim(),
    GOOGLE_CLIENT_SECRET: values.googleClientSecret?.trim() || current.GOOGLE_CLIENT_SECRET || '',
    FACEBOOK_APP_ID: values.facebookAppId.trim(),
    FACEBOOK_APP_SECRET: values.facebookAppSecret?.trim() || current.FACEBOOK_APP_SECRET || '',
    RESEND_API_KEY: values.resendApiKey?.trim() || current.RESEND_API_KEY || '',
    RESET_PASSWORD_FROM_EMAIL: values.resetPasswordFromEmail.trim(),
    RESET_PASSWORD_FROM_NAME: values.resetPasswordFromName.trim(),
  }

  let content = ''

  try {
    content = await fs.readFile(ENV_FILE_PATH, 'utf8')
  } catch {
    content = ''
  }

  const lines = content ? content.split(/\r?\n/) : []
  const writtenKeys = new Set<string>()
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) return line

    const key = match[1] as AuthEnvKey
    if (!AUTH_ENV_KEYS.includes(key)) return line

    writtenKeys.add(key)
    return `${key}=${next[key]}`
  })

  for (const key of AUTH_ENV_KEYS) {
    if (!writtenKeys.has(key)) {
      nextLines.push(`${key}=${next[key]}`)
    }
    process.env[key] = next[key]
  }

  await fs.writeFile(ENV_FILE_PATH, `${nextLines.filter(Boolean).join('\n')}\n`, 'utf8')

  return getAuthConfigSnapshot()
}

export async function getPasswordResetMailConfig() {
  const snapshot = await getAuthConfigSnapshot()

  if (!snapshot.hasResendApiKey || !snapshot.resetPasswordFromEmail) {
    return null
  }

  return {
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    fromEmail: snapshot.resetPasswordFromEmail,
    fromName: snapshot.resetPasswordFromName || '9LIFE MAG',
  }
}
