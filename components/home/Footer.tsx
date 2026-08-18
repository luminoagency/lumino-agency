import Link from 'next/link'
import { COMPANY } from '@/lib/company'

/**
 * Footer della home.
 *
 * Non è una delle 10 sezioni del brief, ma i link legali (privacy, cookie,
 * termini, GDPR) devono restare raggiungibili da ogni pagina pubblica: sono
 * un obbligo, non una scelta di layout. Tenuto volutamente minimo, senza
 * alcun richiamo commerciale.
 */

const LEGAL = [
  { href: '/privacy-policy', label: 'Privacy' },
  { href: '/cookie-policy', label: 'Cookie' },
  { href: '/termini-condizioni', label: 'Termini' },
  { href: '/gdpr', label: 'GDPR' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="lm-wrap">
      <div className="lm-footer">
        <span>
          © {year} {COMPANY.legalName} — {COMPANY.brand}. Company no. {COMPANY.companyNumber}.
        </span>

        <nav className="lm-footer-links" aria-label="Link legali">
          {LEGAL.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
