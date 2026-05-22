import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/shared/query-provider'
import { ServiceWorkerRegistration } from '@/components/shared/service-worker-registration'
import { PWAInstallBanner } from '@/components/shared/pwa-install-banner'
import  PushInit  from '@/components/PushInit' // 👈 AGREGADO
import { APP_CONFIG } from '@/config/app'
import '@/styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url),
  title: {
    default: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: ['timbre QR', 'timbre virtual', 'QR doorbell', 'timbre inteligente', 'seguridad hogar'],
  authors: [{ name: 'QR Bell' }],
  creator: 'QR Bell',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: APP_CONFIG.url,
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    creator: APP_CONFIG.twitterHandle,
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QR Bell" />

        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-128x128.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />

        <link rel="apple-touch-startup-image" href="/icons/splash-1290x2796.png" />
        <link rel="apple-touch-startup-image" href="/icons/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" href="/icons/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" href="/icons/splash-750x1334.png" />

        <link rel="manifest" href="/manifest.json" />

        <meta name="theme-color" content="#4f6ef7" />
        <meta name="msapplication-TileColor" content="#4f6ef7" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />

        <meta name="format-detection" content="telephone=no" />
      </head>

      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
            <PWAInstallBanner />
            <ServiceWorkerRegistration />
            <PushInit /> {/* 👈 AGREGADO ACÁ */}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}