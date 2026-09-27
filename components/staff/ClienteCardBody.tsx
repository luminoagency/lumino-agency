import { SETTORE_LABEL, dataBreve, euro, type ClienteRiga } from '@/lib/staff/types'
import { StatoPill } from './PageHead'

/**
 * Il contenuto di una card cliente: chi è, dove sta, quanto vale.
 *
 * È solo il dentro, non il contenitore. Sul kanban la card è un link
 * trascinabile, nella vista a lista è un bottone che seleziona: darle qui un
 * elemento proprio obbligherebbe a un link dentro un bottone, che è markup non
 * valido e, sulle tastiere, un tab in più per niente.
 *
 * Le **iniziali** al posto di un'icona (ref3): in un elenco di trenta righe
 * uguali, due lettere diverse per ogni riga sono l'unica cosa che permette di
 * ritrovare un cliente senza rileggere i nomi. Sono generate dal nome, non
 * caricate: un avatar vero qui vorrebbe trenta richieste per trenta cerchi.
 */
export default function ClienteCardBody({
  cliente,
  prezzo,
  stato = false,
}: {
  cliente: ClienteRiga
  prezzo?: number | null
  /** Mostra anche la pill di stato: serve dove la colonna non lo dice già. */
  stato?: boolean
}) {
  const dove = [cliente.citta, cliente.zona].filter(Boolean).join(' · ')

  return (
    <>
      <span className="lm-ccard-head">
        <span className="lm-avatar-i" aria-hidden="true">
          {iniziali(cliente.nome)}
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="lm-ccard-name">{cliente.nome}</span>
          <span className="lm-ccard-meta">
            <span className="lm-dot" data-settore={cliente.settore} aria-hidden="true" />
            {SETTORE_LABEL[cliente.settore]}
            {dove && <>· {dove}</>}
          </span>
        </span>
      </span>
      <span className="lm-ccard-foot">
        {stato ? (
          <StatoPill stato={cliente.stato} />
        ) : (
          <span className="lm-muted">{dataBreve(cliente.created_at)}</span>
        )}
        {prezzo ? <span className="lm-ccard-price">{euro(prezzo)}</span> : null}
      </span>
    </>
  )
}

/**
 * Due lettere da un nome di locale.
 *
 * Salta gli articoli e le parole di mestiere — «Trattoria da Gigi» darebbe
 * «TD», che non distingue niente in un elenco pieno di trattorie: meglio
 * «TG». Se resta una parola sola si prendono le sue prime due lettere.
 */
export function iniziali(nome: string): string {
  const salta = new Set([
    'da',
    'de',
    'di',
    'del',
    'della',
    'dei',
    'il',
    'la',
    'le',
    'lo',
    'i',
    'gli',
    'ai',
    'al',
    'alla',
    'e',
    "l'",
    'the',
  ])
  const parole = nome
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0 && !salta.has(p.toLowerCase()))

  if (!parole.length) return nome.slice(0, 2).toUpperCase()
  if (parole.length === 1) return parole[0].slice(0, 2).toUpperCase()
  return (parole[0][0] + parole[parole.length - 1][0]).toUpperCase()
}
