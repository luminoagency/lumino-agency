'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CalendarClock, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { ChipsOne, opzioni } from '@/components/staff/Chips'
import Modal from '@/components/staff/Modal'
import {
  aggiornaCliente,
  creaAttivita,
  creaFollowup,
  eliminaCliente,
  type NuovoCliente,
} from '@/lib/staff/actions'
import {
  ATTIVITA_LABEL,
  SETTORE_LABEL,
  SETTORI,
  SITI,
  SITO_LABEL,
  TIPI_ATTIVITA,
  oggiISO,
  type ClienteRiga,
} from '@/lib/staff/types'

type Aperta = null | 'modifica' | 'attivita' | 'followup' | 'elimina'

/**
 * Le tre cose che si fanno da una scheda cliente.
 *
 * Modali e non pagine separate: sono correzioni e annotazioni, gesti brevi
 * che nascono *guardando* la scheda. Portare via da quello che si sta leggendo
 * per cambiarne una riga è il modo migliore per non cambiarla.
 *
 * Dopo ogni salvataggio `router.refresh()`: la scheda è un Server Component, e
 * senza quello resterebbe la versione in cache del router — cioè i dati
 * vecchi, subito sotto la modale appena chiusa.
 */
export default function SchedaAzioni({
  cliente,
  venditori,
  isAdmin,
}: {
  cliente: ClienteRiga
  venditori: { id: string; nome: string }[]
  isAdmin: boolean
}) {
  const [aperta, setAperta] = useState<Aperta>(null)

  return (
    <>
      <button type="button" className="lm-pill" onClick={() => setAperta('attivita')}>
        <PlusCircle aria-hidden="true" />
        Attività
      </button>
      <button type="button" className="lm-pill" onClick={() => setAperta('followup')}>
        <CalendarClock aria-hidden="true" />
        Richiamo
      </button>
      <button type="button" className="lm-btn" onClick={() => setAperta('modifica')}>
        <Pencil aria-hidden="true" />
        Modifica
      </button>
      {/* Solo all'admin, come la policy `staff_clients_delete`: un bottone che
          esiste per tutti e funziona per uno è un bottone che insegna a non
          fidarsi dei bottoni. */}
      {isAdmin && (
        <button
          type="button"
          className="lm-pill"
          data-variant="danger"
          onClick={() => setAperta('elimina')}
        >
          <Trash2 aria-hidden="true" />
          Elimina
        </button>
      )}

      {aperta === 'elimina' && (
        <ConfermaElimina cliente={cliente} onChiudi={() => setAperta(null)} />
      )}
      {aperta === 'modifica' && (
        <FormModifica
          cliente={cliente}
          venditori={venditori}
          isAdmin={isAdmin}
          onChiudi={() => setAperta(null)}
        />
      )}
      {aperta === 'attivita' && (
        <FormAttivita clientId={cliente.id} onChiudi={() => setAperta(null)} />
      )}
      {aperta === 'followup' && (
        <FormFollowup clientId={cliente.id} onChiudi={() => setAperta(null)} />
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * La modifica dell'anagrafica.
 *
 * Lo stato non c'è, e non è una dimenticanza: si sposta dal kanban o dalla
 * pipeline, dove il rifiuto chiede il suo motivo. Metterlo anche qui vorrebbe
 * dire un secondo posto da cui si può rifiutare un cliente — e prima o poi uno
 * dei due lo farebbe senza chiedere perché.
 */
function FormModifica({
  cliente,
  venditori,
  isAdmin,
  onChiudi,
}: {
  cliente: ClienteRiga
  venditori: { id: string; nome: string }[]
  isAdmin: boolean
  onChiudi: () => void
}) {
  const router = useRouter()
  const [dati, setDati] = useState<NuovoCliente>({
    nome: cliente.nome,
    settore: cliente.settore,
    citta: cliente.citta ?? '',
    zona: cliente.zona ?? '',
    indirizzo: cliente.indirizzo ?? '',
    referente: cliente.referente ?? '',
    telefono: cliente.telefono ?? '',
    email: cliente.email ?? '',
    instagram: cliente.instagram ?? '',
    sito_attuale: cliente.sito_attuale ?? '',
    note_sito: cliente.note_sito ?? '',
    prezzo_consigliato: cliente.prezzo_consigliato ? String(cliente.prezzo_consigliato) : '',
    assegnato_a: cliente.assegnato_a ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const set =
    (key: keyof NuovoCliente) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setDati((d) => ({ ...d, [key]: event.target.value }))

  async function salva(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setErrore(null)

    const esito = await aggiornaCliente(cliente.id, dati)
    if (!esito.ok) {
      setErrore(esito.error ?? 'Non è stato possibile salvare le modifiche.')
      setBusy(false)
      return
    }

    router.refresh()
    onChiudi()
  }

  return (
    <Modal
      title={`Modifica ${cliente.nome}`}
      onClose={onChiudi}
      head={
        <>
          <span className="lm-label">Anagrafica</span>
          <h2>Correggi i dati</h2>
        </>
      }
    >
      <form onSubmit={salva} className="lm-modal-form">
        <div className="lm-modal-corpo">
          <div className="lm-form" data-cols="2" style={{ marginTop: '1.1rem' }}>
            <div className="lm-field" data-wide="true">
              <label htmlFor="m-nome">Nome del locale</label>
              <input id="m-nome" value={dati.nome} onChange={set('nome')} required autoFocus />
            </div>

            <div className="lm-field">
              <label htmlFor="m-settore">Settore</label>
              <select id="m-settore" value={dati.settore} onChange={set('settore')}>
                {SETTORI.map((s) => (
                  <option key={s} value={s}>
                    {SETTORE_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="lm-field">
              <label htmlFor="m-sito">Sito attuale</label>
              <select id="m-sito" value={dati.sito_attuale ?? ''} onChange={set('sito_attuale')}>
                <option value="">Non so</option>
                {SITI.map((s) => (
                  <option key={s} value={s}>
                    {SITO_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="lm-field">
              <label htmlFor="m-citta">Città</label>
              <input id="m-citta" value={dati.citta ?? ''} onChange={set('citta')} />
            </div>

            <div className="lm-field">
              <label htmlFor="m-zona">Zona</label>
              <input id="m-zona" value={dati.zona ?? ''} onChange={set('zona')} />
            </div>

            <div className="lm-field" data-wide="true">
              <label htmlFor="m-indirizzo">Indirizzo</label>
              <input id="m-indirizzo" value={dati.indirizzo ?? ''} onChange={set('indirizzo')} />
            </div>

            <div className="lm-field">
              <label htmlFor="m-referente">Referente</label>
              <input id="m-referente" value={dati.referente ?? ''} onChange={set('referente')} />
            </div>

            <div className="lm-field">
              <label htmlFor="m-telefono">Telefono</label>
              <input
                id="m-telefono"
                type="tel"
                inputMode="tel"
                value={dati.telefono ?? ''}
                onChange={set('telefono')}
              />
            </div>

            <div className="lm-field">
              <label htmlFor="m-email">Email</label>
              <input id="m-email" type="email" value={dati.email ?? ''} onChange={set('email')} />
            </div>

            <div className="lm-field">
              <label htmlFor="m-instagram">Instagram</label>
              <input
                id="m-instagram"
                value={dati.instagram ?? ''}
                onChange={set('instagram')}
                placeholder="@nomelocale"
              />
            </div>

            <div className="lm-field">
              <label htmlFor="m-prezzo">Prezzo consigliato</label>
              <input
                id="m-prezzo"
                type="number"
                min="0"
                step="50"
                value={dati.prezzo_consigliato ?? ''}
                onChange={set('prezzo_consigliato')}
              />
            </div>

            {isAdmin && (
              <div className="lm-field">
                <label htmlFor="m-assegnato">Assegnato a</label>
                <select
                  id="m-assegnato"
                  value={dati.assegnato_a ?? ''}
                  onChange={set('assegnato_a')}
                >
                  {venditori.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="lm-field" data-wide="true">
              <label htmlFor="m-note">Note sul sito attuale</label>
              <textarea id="m-note" value={dati.note_sito ?? ''} onChange={set('note_sito')} />
            </div>
          </div>

          <p className="lm-field-hint" style={{ marginTop: '0.8rem' }}>
            Lo stato non si cambia da qui: si sposta dalla pipeline, dove il rifiuto chiede anche il
            motivo.
          </p>

          {errore && (
            <p className="lm-error" role="alert" style={{ marginTop: '0.8rem' }}>
              {errore}
            </p>
          )}
        </div>

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={onChiudi}>
            Annulla
          </button>
          <button type="submit" className="lm-btn" disabled={busy || !dati.nome.trim()}>
            {busy ? 'Salvo…' : 'Salva'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Un'attività a mano.
 *
 * Le visite le registra il Campo, con tutto il suo questionario. Qui si
 * annotano le altre tre — una telefonata, un messaggio, un pensiero — che non
 * hanno niente da raccogliere e hanno solo bisogno di finire in timeline
 * prima di essere dimenticate.
 */
function FormAttivita({ clientId, onChiudi }: { clientId: string; onChiudi: () => void }) {
  const router = useRouter()
  const [tipo, setTipo] = useState<string>('chiamata')
  const [corpo, setCorpo] = useState('')
  const [busy, setBusy] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  async function salva(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setErrore(null)

    const esito = await creaAttivita(clientId, tipo, corpo)
    if (!esito.ok) {
      setErrore(esito.error ?? 'Non è stato possibile salvare l’attività.')
      setBusy(false)
      return
    }

    router.refresh()
    onChiudi()
  }

  return (
    <Modal
      title="Nuova attività"
      onClose={onChiudi}
      head={
        <>
          <span className="lm-label">Storico</span>
          <h2>Cos&apos;è successo</h2>
        </>
      }
    >
      <form onSubmit={salva} className="lm-modal-form">
        <div className="lm-modal-corpo">
          <div style={{ marginTop: '1.1rem' }}>
            <ChipsOne
              label="Tipo"
              options={opzioni(
                TIPI_ATTIVITA.filter((t) => t !== 'visita'),
                ATTIVITA_LABEL,
              )}
              value={tipo}
              onChange={(v) => setTipo(v || 'chiamata')}
            />
          </div>

          <div className="lm-field" style={{ marginTop: '0.9rem' }}>
            <label htmlFor="a-testo">Testo</label>
            <textarea
              id="a-testo"
              value={corpo}
              required
              autoFocus
              onChange={(e) => setCorpo(e.target.value)}
              placeholder="Richiamato, non risponde. Riprovo dopo pranzo."
            />
          </div>

          <p className="lm-field-hint">
            Le visite non si scrivono qui: si registrano dal Campo, che raccoglie anche come lavora
            il locale.
          </p>

          {errore && (
            <p className="lm-error" role="alert" style={{ marginTop: '0.8rem' }}>
              {errore}
            </p>
          )}
        </div>

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={onChiudi}>
            Annulla
          </button>
          <button type="submit" className="lm-btn" disabled={busy || !corpo.trim()}>
            {busy ? 'Salvo…' : 'Salva'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/** Un richiamo preso dalla scheda: le scorciatoie, o una data qualsiasi. */
function FormFollowup({ clientId, onChiudi }: { clientId: string; onChiudi: () => void }) {
  const router = useRouter()
  const [data, setData] = useState(oggiISO(3))
  const [nota, setNota] = useState('')
  const [busy, setBusy] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  async function salva(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setErrore(null)

    const esito = await creaFollowup(clientId, data, nota)
    if (!esito.ok) {
      setErrore(esito.error ?? 'Non è stato possibile prendere il richiamo.')
      setBusy(false)
      return
    }

    router.refresh()
    onChiudi()
  }

  return (
    <Modal
      title="Nuovo richiamo"
      onClose={onChiudi}
      head={
        <>
          <span className="lm-label">Follow-up</span>
          <h2>Quando lo richiami</h2>
        </>
      }
    >
      <form onSubmit={salva} className="lm-modal-form">
        <div className="lm-modal-corpo">
          <div style={{ marginTop: '1.1rem' }}>
            <ChipsOne
              label="Scorciatoie"
              options={[
                { value: oggiISO(1), label: 'Domani' },
                { value: oggiISO(3), label: 'Fra 3 giorni' },
                { value: oggiISO(7), label: 'Fra una settimana' },
                { value: oggiISO(30), label: 'Fra un mese' },
              ]}
              value={data}
              onChange={(v) => setData(v || oggiISO(3))}
            />
          </div>

          <div className="lm-field" style={{ marginTop: '0.9rem' }}>
            <label htmlFor="f-data">Data</label>
            <input
              id="f-data"
              type="date"
              min={oggiISO()}
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />
          </div>

          <div className="lm-field">
            <label htmlFor="f-nota">Cosa devo ricordarmi</label>
            <input
              id="f-nota"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Portare il preventivo, chiedere del socio…"
            />
          </div>

          {errore && (
            <p className="lm-error" role="alert" style={{ marginTop: '0.8rem' }}>
              {errore}
            </p>
          )}
        </div>

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={onChiudi}>
            Annulla
          </button>
          <button type="submit" className="lm-btn" disabled={busy || !data}>
            {busy ? 'Salvo…' : 'Prendi il richiamo'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * La conferma prima di cancellare.
 *
 * Non un `confirm()` del browser: quello dice «Sei sicuro?» e non dice cosa se
 * ne va. Qui c'è scritto, perché la cosa che si perde non è il cliente — è la
 * storia che gli sta attaccata, e chi preme deve sapere di star cancellando
 * anche quella.
 *
 * Il nome si riscrive a mano. È una frizione voluta, e solo qui: è l'unico
 * gesto dell'area che non ha un annulla, e tre secondi di fatica sono il prezzo
 * giusto per non farlo per sbaglio scorrendo col pollice.
 */
function ConfermaElimina({ cliente, onChiudi }: { cliente: ClienteRiga; onChiudi: () => void }) {
  const router = useRouter()
  const [scritto, setScritto] = useState('')
  const [busy, setBusy] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const combacia = scritto.trim().toLowerCase() === cliente.nome.trim().toLowerCase()

  async function elimina(event: React.FormEvent) {
    event.preventDefault()
    if (!combacia) return
    setBusy(true)
    setErrore(null)

    const esito = await eliminaCliente(cliente.id)
    if (!esito.ok) {
      /* Il messaggio dell'azione e non una frase generica: distingue «non hai i
         permessi» da «non c'era più», e sono due cose che si risolvono in due
         modi diversi. */
      setErrore(esito.error ?? 'Non è stato possibile eliminare il cliente.')
      setBusy(false)
      return
    }

    /* Via dalla scheda di una cosa che non esiste più, e `refresh()` perché
       l'elenco è un Server Component: senza, si torna sulla versione in cache
       del router, cioè su una riga che non c'è più nel database. */
    router.replace('/staff/clienti')
    router.refresh()
  }

  return (
    <Modal
      title={`Elimina ${cliente.nome}`}
      onClose={onChiudi}
      head={
        <>
          <span className="lm-label">Attenzione</span>
          <h2>Questo non si annulla</h2>
        </>
      }
    >
      <form onSubmit={elimina} className="lm-modal-form">
        <div className="lm-modal-corpo">
          <p className="lm-sub" style={{ marginTop: '0.7rem' }}>
            Se ne vanno con lui la trattativa, l’abbonamento, il progetto, tutte le attività in
            timeline, i richiami presi e i report di campo con le loro foto.
          </p>
          <p className="lm-field-hint" style={{ marginTop: '0.5rem' }}>
            Le voci d’archivio restano: perdono il nome del cliente, non il contenuto.
          </p>

          <div className="lm-field" style={{ marginTop: '1.1rem' }}>
            <label htmlFor="e-nome">
              Riscrivi <b>{cliente.nome}</b> per confermare
            </label>
            <input
              id="e-nome"
              value={scritto}
              onChange={(e) => setScritto(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoFocus
            />
          </div>

          {errore && (
            <p className="lm-error" role="alert" style={{ marginTop: '0.8rem' }}>
              {errore}
            </p>
          )}
        </div>

        <div className="lm-modal-actions">
          <button type="button" className="lm-btn" data-variant="ghost" onClick={onChiudi}>
            Annulla
          </button>
          <button
            type="submit"
            className="lm-btn"
            data-variant="danger"
            disabled={busy || !combacia}
          >
            {busy ? 'Elimino…' : 'Elimina definitivamente'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
