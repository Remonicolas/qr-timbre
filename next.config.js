/** @type {import('next').NextConfig} */

let nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Fix para Next.js 15: reemplaza 'serverComponentsExternalPackages'
  serverExternalPackages: ['@sentry/nextjs'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
              "frame-src https://js.stripe.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ]
  },

  async rewrites() {
    return [
      { source: '/timbre/:qrCode', destination: '/visitor/:qrCode' },
    ]
  },
}

// PWA solo en producción
try {
  if (process.env.NODE_ENV === 'production') {
    const withPWA = require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      sw: '/service-worker.js',
      buildExcludes: [/middleware-manifest\.json$/],
    })
    nextConfig = withPWA(nextConfig)
  }
} catch { /* next-pwa no disponible */ }

// Sentry solo si está configurado
try {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const { withSentryConfig } = require('@sentry/nextjs')
    nextConfig = withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    })
  }
} catch { /* Sentry no configurado */ }

module.exports = nextConfig