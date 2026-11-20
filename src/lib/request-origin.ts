export function isTrustedRequestOrigin(headers: Headers, protocol: string) {
  const origin = headers.get('origin')
  if (!origin) return process.env.NODE_ENV !== 'production'
  const host = headers.get('host')?.trim()
  if (!host) return false
  const forwardedProtocol = process.env.TRUST_PROXY_HEADERS === 'true'
    ? headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    : undefined
  try {
    return new URL(origin).origin === `${forwardedProtocol || protocol}://${host}`
  } catch {
    return false
  }
}
