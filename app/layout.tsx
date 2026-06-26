import type { Metadata } from 'next';
import './globals.css';
import CookieBanner from '@/components/cookie/CookieBanner';

export const metadata: Metadata = {
  metadataBase: new URL('https://bylumino.com'),
  title: 'Lumino — Siti web per ristoranti',
  description:
    'Siti web professionali su misura per ristoranti. Curiamo testi, foto, menu e prenotazioni: tu pensi alla cucina, al sito pensiamo noi.',
  openGraph: {
    title: 'Lumino — Siti web per ristoranti',
    description:
      'Siti web professionali su misura per ristoranti. Tu pensi alla cucina, al sito pensiamo noi.',
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
    <html lang="it">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
