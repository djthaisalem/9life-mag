'use client'

import { createContext, useContext } from 'react'

const CmsMusicCapabilityContext = createContext('')

export function CmsCapabilityProvider({ musicCapability, children }: Readonly<{
  musicCapability: string
  children: React.ReactNode
}>) {
  return (
    <CmsMusicCapabilityContext.Provider value={musicCapability}>
      {children}
    </CmsMusicCapabilityContext.Provider>
  )
}

export function useCmsMusicCapability() {
  return useContext(CmsMusicCapabilityContext)
}
