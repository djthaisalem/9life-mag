'use client'

import { createContext, useContext } from 'react'
import type { CmsScope } from '@/lib/cms-role-policy'

type CmsCapabilities = Record<CmsScope, string>

const CmsCapabilityContext = createContext<CmsCapabilities>({
  api_security: '',
  booking: '',
  stars: '',
  content: '',
  music: '',
  artists: '',
  overview: '',
  private_contacts: '',
})

export function CmsCapabilityProvider({ capabilities, children }: Readonly<{
  capabilities: CmsCapabilities
  children: React.ReactNode
}>) {
  return (
    <CmsCapabilityContext.Provider value={capabilities}>
      {children}
    </CmsCapabilityContext.Provider>
  )
}

export function useCmsMusicCapability() {
  return useContext(CmsCapabilityContext).music
}

export function useCmsStarsCapability() {
  return useContext(CmsCapabilityContext).stars
}

export function useCmsCapability(scope: CmsScope) {
  return useContext(CmsCapabilityContext)[scope]
}
