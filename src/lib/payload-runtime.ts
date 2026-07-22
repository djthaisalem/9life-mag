import 'server-only'

import { getPayloadClient } from '@/lib/payload-client'

export async function loadPayloadClient() {
  return getPayloadClient()
}
