'use client'

import { createContext, useContext } from 'react'

type CmsCapabilities = {
  music: string
  stars: string
}

const CmsCapabilityContext = createContext<CmsCapabilities>({ music: '', stars: '' })

export function CmsCapabilityProvider({ musicCapability, starsCapability, children }: Readonly<{
  musicCapability: string
  starsCapability: string
  children: React.ReactNode
}>) {
  return (
    <CmsCapabilityContext.Provider value={{ music: musicCapability, stars: starsCapability }}>
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
