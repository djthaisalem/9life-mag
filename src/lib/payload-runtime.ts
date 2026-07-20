import 'server-only'

import type { getPayloadClient as GetPayloadClient } from '@/lib/payload-client'

type PayloadClientFactory = typeof GetPayloadClient

export async function loadPayloadClient() {
  const runtimeImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<{ getPayloadClient: PayloadClientFactory }>

  const module = await runtimeImport('@/lib/payload-client')
  return module.getPayloadClient()
}
