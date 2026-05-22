/** @type {import('next').NextConfig} */

let nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@sentry/nextjs'],

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

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
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },

          // iOS PWA + Firebase Notifications
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), notifications=(self)',
          },

          {
            key: 'Content-Security-Policy',
            value: [
              // Base
              "default-src 'self'",

              // Scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.gstatic.com",

              // Styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              // Fonts
              "font-src 'self' https://fonts.gstatic.com data:",

              // Images
              "img-src 'self' data: blob: https:",

              // API / Firebase / Supabase / Stripe
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://firebase.googleapis.com https://fcm.googleapis.com https://fcmregistrations.googleapis.com https://firebaseinstallations.googleapis.com https://www.googleapis.com",

              // Frames
              "frame-src https://js.stripe.com",

              // Workers / Service Workers
              "worker-src 'self' blob: https://www.gstatic.com",

              // Manifest
              "manifest-src 'self'",

              // Media
              "media-src 'self' blob:",

              // Disable object/embed
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },

      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/timbre/:qrCode',
        destination: '/visitor/:qrCode',
      },
    ]
  },
}

// Sentry solo si está configurado
try {
  if (
    process.env.SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN
  ) {
    const { withSentryConfig } = require('@sentry/nextjs')

    nextConfig = withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    })
  }
} catch {
  // Sentry no configurado
}

module.exports = nextConfig