import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import CookieBanner from '@/components/cookie/CookieBanner';
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton';

/* Font serviti da Next (self-hosted, preload, zero richieste a Google):
   niente @import dentro il CSS → niente layout shift al caricamento.
   Le variabili alimentano font-sans / font-serif in tailwind.config.ts. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bylumino.com'),
  title: 'Lumino — Studio digitale',
  description:
    'Studio digitale: siti su misura per ristoranti, hotel, aziende, retail e immobiliare. Progettiamo identità, interfacce e movimento.',
  openGraph: {
    title: 'Lumino — Studio digitale',
    description:
      'Diamo forma al sito che il tuo brand merita. Ristoranti, hotel, aziende, retail, immobiliare.',
    url: 'https://bylumino.com',
    siteName: 'Lumino',
    locale: 'it_IT',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        {children}
        <WhatsAppFloatingButton />
        <CookieBanner />
      </body>
    </html>
  );
}
