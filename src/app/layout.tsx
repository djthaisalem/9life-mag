import type { Metadata } from 'next'
import Script from 'next/script'
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
      <body>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-T8J9M81QPY" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-T8J9M81QPY');`}
        </Script>
        <Suspense fallback={null}><ReferralVisitTracker /></Suspense>
        {children}
      </body>
    </html>
  )
}
