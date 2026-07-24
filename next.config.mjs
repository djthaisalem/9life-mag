const scriptSource = process.env.NODE_ENV === 'production'
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    // Multipart audio uploads need headroom beyond MUSIC_MAX_UPLOAD_MB.
    proxyClientMaxBodySize: 1100 * 1024 * 1024,
  },
  serverExternalPackages: [
    'payload',
    '@payloadcms/db-postgres',
    '@payloadcms/drizzle',
    '@payloadcms/richtext-lexical',
    '@payloadcms/storage-s3',
    'drizzle-kit',
    'esbuild',
    'file-type',
  ],
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; ${scriptSource}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; media-src 'self' blob: https:; connect-src 'self' https://*.r2.cloudflarestorage.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.facebook.com https://w.soundcloud.com`,
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  }
}

export default nextConfig
