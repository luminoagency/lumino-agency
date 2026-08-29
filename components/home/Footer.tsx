import Link from 'next/link'
import { COMPANY } from '@/lib/company'
import type { Messages } from '@/lib/i18n/messages'
import Wordmark from './Wordmark'

/**
 * Footer della home.
 *
 * Non è una delle 10 sezioni del brief, ma i link legali (privacy, cookie,
 * termini, GDPR) devono restare raggiungibili da ogni pagina pubblica: sono
 * un obbligo, non una scelta di layout. Tenuto volutamente minimo, senza
 * alcun richiamo commerciale.
 */

/* Le pagine legali non sono ancora tradotte: restano in italiano, allo stesso
   indirizzo per tutte e tre le lingue. Qui cambia l'etichetta, non la
   destinazione — meglio un'etichetta nella lingua giusta che un link rotto. */
const LEGAL = [
  { href: '/privacy-policy', key: 'privacy' },
  { href: '/cookie-policy', key: 'cookie' },
  { href: '/termini-condizioni', key: 'terms' },
  { href: '/gdpr', key: 'gdpr' },
] as const

export default function Footer({ m }: { m: Messages }) {
  const year = new Date().getFullYear()

  return (
    <footer className="lm-wrap">
      <div className="lm-footer">
        <span className="lm-wordmark is-small" aria-hidden="true">
          <Wordmark />
        </span>

        <span>
          © {year} {COMPANY.legalName} — {COMPANY.brand}. Company no. {COMPANY.companyNumber}.
        </span>

        <nav className="lm-footer-links" aria-label={m.footer.legalNav}>
          {LEGAL.map((item) => (
            <Link href={item.href} key={item.href}>
              {m.footer.links[item.key]}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
