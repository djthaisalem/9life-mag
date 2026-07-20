import 'server-only'

import { assertProductionPersistence } from '@/lib/runtime-security'

export async function getPayloadClient() {
  assertProductionPersistence()
  const [{ getPayload }, { default: config }] = await Promise.all([
    import('payload'),
    import('@/payload.config'),
  ])

  return getPayload({
    config,
  })
}
