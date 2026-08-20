import type { Metadata } from 'next'

/**
 * I metadati stanno qui e non nella pagina perché quella è un client component,
 * e da un client component Next non accetta l'export di `metadata`.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/pricing' },
  title: 'Piani e prezzi',
  description: 'Quanto costa un sito su misura firmato Lumino: piani, cosa comprende ciascuno e tempi di consegna.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
