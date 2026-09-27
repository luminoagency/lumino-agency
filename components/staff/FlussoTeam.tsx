import Link from 'next/link'
import { MapPin, MessageSquare, Phone, StickyNote } from 'lucide-react'
import type { TipoAttivita } from '@/lib/staff/types'

export interface VoceFlusso {
  id: string
  tipo: TipoAttivita
  testo: string | null
  /** Quando, già ridotto a parole dal server: «2 ore fa», «ieri». */
  quando: string
  cliente: string
  clientId: string
  /** Chi l'ha fatta. Le iniziali finiscono nel pallino. */
  chi: string
}

const ICONE = {
  visita: MapPin,
  chiamata: Phone,
  messaggio: MessageSquare,
  nota: StickyNote,
} as const

/**
 * Cosa sta facendo il team, adesso.
 *
 * Ha preso il posto della sfera cromata che girava dentro la card nera. Quella
 * era un oggetto decorativo: costava un `conic-gradient` in rotazione perpetua e
 * un anello in `rotateX`, e a chi guardava la dashboard non diceva niente. La
 * card nera è l'accento che tiene in piedi una composizione tutta chiara — è il
 * posto **più guardato** della schermata, e sprecarlo con un ornamento era un
 * errore di priorità, non di gusto.
 *
 * Ora dentro c'è il flusso: le ultime cose fatte, da chi, su chi, quando. È
 * l'unica card della home che parla del **presente** — le altre contano soldi
 * già incassati o richiami ancora da fare — e in un'agenzia di due venditori è
 * l'informazione che si cerca entrando: dove è arrivato l'altro.
 *
 * Il movimento che resta è il punto «in linea» che pulsa, cioè un `box-shadow`
 * su sei pixel. È tutto quello che serve per dire che la pagina è viva.
 *
 * Ogni riga è un link alla scheda del cliente: una lista di cose accadute in cui
 * non si può entrare è un rapporto, non uno strumento.
 */
export default function FlussoTeam({ voci }: { voci: VoceFlusso[] }) {
  if (!voci.length) {
    return (
      <p className="lm-empty">
        Nessuna attività registrata. Si riempie da sé: ogni visita, chiamata e
        nota finisce qui.
      </p>
    )
  }

  return (
    <ul className="lm-flusso">
      {voci.map((v) => {
        const Icona = ICONE[v.tipo] ?? StickyNote
        return (
          <li key={v.id}>
            <Link href={`/staff/clienti/${v.clientId}`} className="lm-flusso-riga">
              <span className="lm-flusso-chi" aria-hidden="true">
                {v.chi.trim().charAt(0).toUpperCase() || '·'}
              </span>
              <span className="lm-flusso-testo">
                <b>{v.cliente}</b>
                {/* Il testo dell'attività su una riga sola: le note di campo
                    sono lunghe quanto vogliono, e qui c'è spazio per otto
                    parole. Intera si legge nella scheda. */}
                <span>{v.testo || tipoInChiaro(v.tipo)}</span>
              </span>
              <span className="lm-flusso-quando">
                <Icona aria-hidden="true" />
                {v.quando}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function tipoInChiaro(tipo: TipoAttivita): string {
  return { visita: 'Visita', chiamata: 'Chiamata', messaggio: 'Messaggio', nota: 'Nota' }[tipo]
}
