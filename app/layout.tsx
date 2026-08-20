import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/cookie/CookieBanner'
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton'
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, organizationJsonLd } from '@/lib/seo'

/* Font serviti da Next (self-hosted, preload, zero richieste a Google):
   niente @import dentro il CSS → niente layout shift al caricamento.
   Le variabili alimentano font-sans / font-serif in tailwind.config.ts. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Lumino — Studio digitale | Siti web su misura',
    /* Le altre pagine dichiarano solo il proprio titolo e il marchio si
       aggiunge da sé: senza template ognuna se lo riscrive, e prima o poi una
       se lo dimentica. */
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Lumino — Studio digitale | Siti web su misura',
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumino — Studio digitale | Siti web su misura',
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        {/* Dati strutturati dello studio: dicono a Google che cosa siamo, non
            solo che cosa scriviamo. Uno solo, sul layout, così vale ovunque. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </head>
      <body>
        {children}
        <WhatsAppFloatingButton />
        <CookieBanner />
      </body>
    </html>
  )
}
