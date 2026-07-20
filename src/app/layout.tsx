import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { defaultShareMetadata } from '@/lib/seo'
import { ReferralVisitTracker } from '@/components/referral-visit-tracker'

export const metadata: Metadata = {
  ...defaultShareMetadata,
  title: { default: '9LIFE MAG | Nightlife, Music & Entertainment', template: '%s | 9LIFE MAG' },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body><Suspense fallback={null}><ReferralVisitTracker /></Suspense>{children}</body>
    </html>
  )
}
