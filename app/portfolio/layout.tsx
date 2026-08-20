import type { Metadata } from 'next'

/**
 * I metadati stanno qui e non nella pagina perché quella è un client component,
 * e da un client component Next non accetta l'export di `metadata`.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/portfolio' },
  title: 'Lavori',
  description: 'I siti che abbiamo progettato e costruito: ristoranti, hotel, aziende e retail. Guarda i progetti online.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
