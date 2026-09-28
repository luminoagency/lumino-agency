import Link from 'next/link'
import { oggiISO } from '@/lib/staff/types'

export interface EventoSettimana {
  id: string
  data: string
  titolo: string
  nota?: string | null
  href: string
}

const DOW = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom']

/**
 * I prossimi sette giorni, con gli impegni in pill nere (ref1, il calendario).
 *
 * È il posto dove i follow-up smettono di essere un elenco e diventano un
 * carico di lavoro: sette colonne, e si vede a colpo d'occhio che giovedì è
 * pieno e venerdì è vuoto. Una lista ordinata per data la stessa cosa non la
 * dice — bisogna contarla.
 *
 * **Parte da oggi, non dal lunedì.** La settimana di calendario sarebbe più
 * riconoscibile, ma di domenica mostrerebbe sei giorni già passati e uno solo
 * utile: qui non interessa *che* settimana è, interessa cosa c'è da fare da
 * adesso in avanti.
 *
 * Lo scaduto si appoggia sulla colonna di oggi (`arretrati`): sparire dal
 * calendario è il modo più rapido di far dimenticare un cliente.
 */
export default function Settimana({
  eventi,
  arretrati = [],
}: {
  eventi: EventoSettimana[]
  /** Gli impegni scaduti: si appoggiano su oggi, in rosso. */
  arretrati?: EventoSettimana[]
}) {
  const oggi = oggiISO()
  const base = new Date(`${oggi}T12:00:00`)

  const giorni = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return {
      iso,
      numero: d.getDate(),
      dow: DOW[(d.getDay() + 6) % 7],
      oggi: iso === oggi,
      eventi: eventi.filter((e) => e.data === iso),
    }
  })

  return (
    <div className="lm-cal">
      {giorni.map((g) => (
        <div key={g.iso} className="lm-cal-day" data-oggi={g.oggi}>
          <span className="lm-cal-dow">{g.dow}</span>
          <span className="lm-cal-n">{g.numero}</span>

          {g.oggi &&
            arretrati.map((e) => (
              <Link
                key={`late-${e.id}`}
                href={e.href}
                className="lm-cal-ev"
                data-late="true"
                title={`In ritardo · ${e.titolo}${e.nota ? ` · ${e.nota}` : ''}`}
              >
                {e.titolo}
              </Link>
            ))}

          {g.eventi.map((e) => (
            <Link
              key={e.id}
              href={e.href}
              className="lm-cal-ev"
              title={e.nota ? `${e.titolo} · ${e.nota}` : e.titolo}
            >
              {e.titolo}
            </Link>
          ))}
        </div>
      ))}
    </div>
  )
}
