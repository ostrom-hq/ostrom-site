// SPDX-License-Identifier: Apache-2.0
import type { Metadata, Viewport } from 'next'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { getMessages } from '@/i18n'
import { indexingFor, OG_IMAGE } from '@/lib/seo'
import { site } from '@/lib/site'
import { THEME_BOOT_SCRIPT } from '@/lib/theme'
import { archivo, azeret } from './fonts'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/brand.css'
import '@/styles/layout.css'
import '@/styles/home.css'
import '@/styles/pricing.css'
import '@/styles/pages.css'

const messages = getMessages()

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: { default: messages.meta.title, template: `%s · ${messages.meta.siteName}` },
  description: messages.meta.description,
  applicationName: messages.meta.siteName,
  // No canonical here: it would be inherited by every page that forgets its own. Each page declares it.
  robots: indexingFor(site),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: messages.meta.siteName,
    title: messages.meta.title,
    description: messages.meta.description,
    locale: 'en_US',
    images: [{ ...OG_IMAGE, alt: messages.meta.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: messages.meta.title,
    description: messages.meta.description,
    images: [OG_IMAGE.url],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F5F5' },
    { media: '(prefers-color-scheme: dark)', color: '#140E10' },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" className={`${archivo.variable} ${azeret.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          {messages.a11y.skipToContent}
        </a>
        <SiteHeader messages={messages} config={site} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter messages={messages} config={site} />
      </body>
    </html>
  )
}
