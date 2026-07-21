import 'server-only'

function isWeakSecret(value?: string | null) {
  const secret = value?.trim() ?? ''
  return !secret || secret === 'replace-me'
}

export function getRuntimeSecret(envKey: string, fallbackLabel: string) {
  const configured = process.env[envKey]?.trim()

  if (!isWeakSecret(configured)) {
    return configured
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${envKey}_is_required`)
  }

  return `${fallbackLabel}-dev-only-secret`
}

export function canUseDevelopmentSeeds() {
  return process.env.NODE_ENV !== 'production'
}

export function assertProductionPersistence() {
  if (process.env.NODE_ENV !== 'production') return

  // File storage is allowed only for an explicitly marked demo deployment.
  const isFileStorageDemo = process.env.SITE_USER_STORAGE_DRIVER === 'file'
    && process.env.ALLOW_FILE_STORAGE_IN_PRODUCTION === 'true'

  if (process.env.SITE_USER_STORAGE_DRIVER !== 'payload' && !isFileStorageDemo) {
    throw new Error('production_requires_payload_storage')
  }

  if (isFileStorageDemo) return

  if (!process.env.DATABASE_URI || process.env.DATABASE_URI === 'postgres://postgres:postgres@localhost:5432/9life_mag') {
    throw new Error('production_database_uri_is_required')
  }

  if (isWeakSecret(process.env.PAYLOAD_SECRET)) {
    throw new Error('production_payload_secret_is_required')
  }
}
