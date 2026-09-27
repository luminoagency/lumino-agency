import { SETTORE_LABEL, dataBreve, euro, type ClienteRiga } from '@/lib/staff/types'

/**
 * Il contenuto di una card cliente: nome, settore, dove sta, quanto vale.
 *
 * È solo il dentro, non il contenitore. Sul kanban la card è un link
 * trascinabile, nella vista a lista è un bottone che seleziona: darle qui un
 * elemento proprio obbligherebbe a un link dentro un bottone, che è markup non
 * valido e, sulle tastiere, un tab in più per niente.
 */
export default function ClienteCardBody({
  cliente,
  prezzo,
}: {
  cliente: ClienteRiga
  prezzo?: number | null
}) {
  const dove = [cliente.citta, cliente.zona].filter(Boolean).join(' · ')

  return (
    <>
      <span className="lm-ccard-name">{cliente.nome}</span>
      <span className="lm-ccard-meta">
        <span className="lm-dot" data-settore={cliente.settore} aria-hidden="true" />
        {SETTORE_LABEL[cliente.settore]}
        {dove && <>· {dove}</>}
      </span>
      <span className="lm-ccard-foot">
        <span className="lm-muted">{dataBreve(cliente.created_at)}</span>
        {prezzo ? <span className="lm-ccard-price">{euro(prezzo)}</span> : null}
      </span>
    </>
  )
}
