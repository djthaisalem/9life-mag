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

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
const siteOrigin = siteUrl.origin
const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteOrigin}/#organization`,
      name: '9LIFE MAG',
      url: `${siteOrigin}/`,
      logo: {
        '@type': 'ImageObject',
        url: new URL('/icon.png', siteOrigin).toString(),
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteOrigin}/#website`,
      url: `${siteOrigin}/`,
      name: '9LIFE MAG',
      inLanguage: 'vi-VN',
      publisher: { '@id': `${siteOrigin}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteOrigin}/tim-kiem?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData).replace(/</g, '\\u003c') }}
        />
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
