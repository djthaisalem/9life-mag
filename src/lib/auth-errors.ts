// Payload uses these names for expected account authentication failures.
export function isCredentialError(error: unknown) {
  return error instanceof Error && ['AuthenticationError', 'LockedAuth', 'UnverifiedEmail'].includes(error.name)
}

// Never log error messages/query parameters: database errors can contain credentials.
export function summarizeAuthError(error: unknown) {
  const chain: Array<{ name: string; code?: string }> = []
  let current = error
  for (let depth = 0; depth < 4 && current instanceof Error; depth++) {
    const entry = current as Error & { code?: unknown; cause?: unknown }
    chain.push({
      name: entry.name.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 80),
      ...(typeof entry.code === 'string' && /^[A-Z0-9_]{2,40}$/.test(entry.code) ? { code: entry.code } : {}),
    })
    current = entry.cause
  }
  return chain
}
