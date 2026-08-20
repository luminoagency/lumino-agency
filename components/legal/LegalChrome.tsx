import Link from 'next/link'
import type { ReactNode } from 'react'
import './legal.css'
import { COMPANY } from '@/lib/company'

/**
 * Cornice delle pagine legali di Lumino.
 *
 * Esiste come componente a sé — invece di ritoccare SiteChrome — perché quello
 * è condiviso con altre sette pagine e coi template dei clienti: cambiarlo per
 * ridisegnare le legali avrebbe cambiato anche il resto. Qui la vetrina nuova
 * vale solo dove serve.
 *
 * Impaginazione da documento, non da landing: colonna stretta, titoli in serif,
 * indice laterale che resta a vista. Nessuna animazione: sono pagine che si
 * leggono, e il movimento qui sarebbe solo un ostacolo.
 */

export interface LegalSection {
  id: string
  label: string
}

export default function LegalChrome({
  kicker = 'Legale',
  title,
  intro,
  updated,
  sections,
  children,
}: {
  kicker?: string
  title: string
  intro?: string
  updated?: string
  /** Se presenti, compare l'indice laterale. */
  sections?: LegalSection[]
  children: ReactNode
}) {
  const year = new Date().getFullYear()

  return (
    <div className="lg">
      <header className="lg-nav">
        <Link href="/" className="lg-wordmark" aria-label="Lumino — home">
          <span aria-hidden="true">
            L<b>u</b>m<span className="lg-il">ı</span>no
          </span>
        </Link>
        <Link href="/" className="lg-back">
          Torna al sito
        </Link>
      </header>

      <main className="lg-main">
        <div className="lg-head">
          <p className="lg-kicker">{kicker}</p>
          <h1 className="lg-title">{title}</h1>
          {intro ? <p className="lg-intro">{intro}</p> : null}
          {updated ? <p className="lg-updated">Ultimo aggiornamento: {updated}</p> : null}
        </div>

        <div className={`lg-body${sections?.length ? ' has-index' : ''}`}>
          {sections?.length ? (
            <nav className="lg-index" aria-label="Indice del documento">
              <p className="lg-index-title">In questa pagina</p>
              <ol>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.label}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <article className="lg-prose">{children}</article>
        </div>
      </main>

      <footer className="lg-footer">
        <span>
          © {year} {COMPANY.legalName} — {COMPANY.brand}. Company no. {COMPANY.companyNumber}.
        </span>
        <nav className="lg-footer-links" aria-label="Documenti legali">
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/cookie-policy">Cookie</Link>
          <Link href="/termini-condizioni">Termini</Link>
          <Link href="/gdpr">GDPR</Link>
          <Link href="/resi-rimborsi">Resi</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </nav>
      </footer>
    </div>
  )
}
