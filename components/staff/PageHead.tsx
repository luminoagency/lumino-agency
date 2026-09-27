import { STATO_LABEL, type Stato } from '@/lib/staff/types'

/**
 * L'intestazione di ogni pagina dell'area: titolo grande, sottotitolo piccolo,
 * azione principale a destra (ref3).
 *
 * Una sola forma per tutte le pagine — è la cosa che fa sembrare un prodotto
 * quello che altrimenti è una raccolta di schermate.
 */
export default function PageHead({
  title,
  sub,
  children,
}: {
  title: React.ReactNode
  sub?: React.ReactNode
  /** L'azione principale, e al massimo una secondaria accanto. */
  children?: React.ReactNode
}) {
  return (
    <header className="lm-head">
      <div>
        <h1 className="lm-h1">{title}</h1>
        {sub && <p className="lm-sub">{sub}</p>}
      </div>
      {children && <div className="lm-head-actions">{children}</div>}
    </header>
  )
}

/** La pill di stato del cliente: stesso disegno ovunque, colore per famiglia. */
export function StatoPill({ stato }: { stato: Stato }) {
  return (
    <span className="lm-state" data-stato={stato}>
      {STATO_LABEL[stato]}
    </span>
  )
}
