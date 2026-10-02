'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Eye, EyeOff, UserPlus } from 'lucide-react'
import { creaMembro } from '@/lib/staff/azioni-team'
import { PERMESSI, PERMESSO_LABEL, PERMESSO_SPIEGA } from '@/lib/staff/permessi'
import { Toggle } from './Controls'
import Modal from './Modal'
import Ritaglio from './Ritaglio'

/**
 * «Nuovo membro»: la persona, le sue credenziali e la sua faccia, in un modulo.
 *
 * Il bottone lo vede solo chi ha `puo_creare_membri` — lo decide la pagina, che
 * è un componente server e legge il profilo vero. Nasconderlo non è però il
 * controllo: quello sta in `creaMembro`, che rifà la stessa domanda prima di
 * toccare `auth.users`. Un bottone nascosto è una comodità, non un cancello.
 *
 * **La foto si ritaglia qui e parte già quadrata.** Il blob resta in memoria
 * finché non si salva tutto insieme: un avatar caricato prima dell'account
 * sarebbe un file in una cartella che non esiste ancora.
 */
export default function NuovoMembro() {
  const router = useRouter()
  const [aperto, setAperto] = useState(false)
  const [avviso, setAvviso] = useState<string | null>(null)

  return (
    <>
      <button
        type="button"
        className="lm-btn"
        data-variant="dark"
        onClick={() => {
          setAvviso(null)
          setAperto(true)
        }}
      >
        <UserPlus aria-hidden="true" /> Nuovo membro
      </button>
      {/* «Creato, ma la foto no» non è un errore della modale: la modale a quel
          punto è già chiusa e il membro c'è. Resta scritto qui, accanto al
          bottone, dove chi l'ha premuto sta ancora guardando. */}
      {avviso && <p className="lm-avviso">{avviso}</p>}
      {aperto && (
        <Form
          chiudi={(creato, nota) => {
            setAperto(false)
            setAvviso(nota ?? null)
            if (creato) router.refresh()
          }}
        />
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

function Form({ chiudi }: { chiudi: (creato: boolean, avviso?: string) => void }) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [mostraPwd, setMostraPwd] = useState(false)
  /* Tutti accesi di partenza. Il senso di questa funzione è «il titolare può
     togliere», non «chi entra nasce cieco»: una persona assunta oggi lavora
     come lavorano gli altri, e si spegne quello che non le serve. È la stessa
     scelta del `default true` sulle colonne della 0040. */
  const [permessi, setPermessi] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERMESSI.map((p) => [p, true])),
  )
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()
  const input = useRef<HTMLInputElement>(null)

  /* Un bitmap decodificato e un object URL sono memoria vera: senza queste due
     righe, chi prova cinque foto prima di scegliere le lascia tutte allocate. */
  useEffect(() => () => bitmap?.close(), [bitmap])
  useEffect(() => () => void (foto && URL.revokeObjectURL(foto.url)), [foto])

  async function scegli(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setErrore(null)
    try {
      setBitmap(await createImageBitmap(file))
    } catch {
      setErrore('Questa immagine non si è aperta. Provane un’altra.')
    }
  }

  return (
    <Modal
      title="Nuovo membro"
      onClose={() => chiudi(false)}
      head={
        <>
          <span className="lm-label">la squadra</span>
          <h2>Chi entra</h2>
        </>
      }
    >
      <form
        className="lm-modal-form"
        onSubmit={(e) => {
          e.preventDefault()
          const dati = new FormData(e.currentTarget)
          if (foto) dati.set('foto', foto.blob, 'avatar.jpg')
          avvia(async () => {
            const esito = await creaMembro(dati)
            /* `ok` con un messaggio vuol dire «creato, ma la foto no»: il
               membro c'è, e tenere aperta la modale su un modulo già salvato
               inviterebbe a premere due volte. Si chiude e si dice cos'è
               successo. */
            if (esito.ok) {
              chiudi(true, esito.error)
            } else {
              setErrore(esito.error ?? 'Il membro non è stato creato. Riprova.')
            }
          })
        }}
      >
        <div className="lm-modal-corpo">
          <div className="lm-avatar-edit" data-riga={!bitmap}>
            {bitmap ? (
              <Ritaglio
                bitmap={bitmap}
                etichetta="Usa questa foto"
                onConferma={(blob) => {
                  if (foto) URL.revokeObjectURL(foto.url)
                  setFoto({ blob, url: URL.createObjectURL(blob) })
                  setBitmap(null)
                }}
                onAnnulla={() => setBitmap(null)}
              />
            ) : (
              <>
                <span className="lm-avatar" data-size="lg" data-foto={Boolean(foto)}>
                  {foto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={foto.url} alt="" />
                  ) : (
                    <Camera aria-hidden="true" />
                  )}
                </span>
                <button
                  type="button"
                  className="lm-btn"
                  data-variant="ghost"
                  onClick={() => input.current?.click()}
                >
                  {foto ? 'Cambia foto' : 'Foto profilo'}
                </button>
              </>
            )}
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="lm-sr"
              onChange={scegli}
            />
          </div>

          <div className="lm-form" data-cols="2" style={{ marginTop: '1.1rem' }}>
            <div className="lm-field">
              <label htmlFor="nm-nome">Nome</label>
              <input id="nm-nome" name="nome" maxLength={80} required autoFocus />
            </div>

            <div className="lm-field">
              <label htmlFor="nm-ruolo">Ruolo</label>
              <input
                id="nm-ruolo"
                name="ruolo_titolo"
                maxLength={40}
                placeholder="Co-founder, Head of Sales…"
              />
              <p className="lm-field-hint">È il biglietto da visita. Non cambia i permessi.</p>
            </div>

            <div className="lm-field" data-wide="true">
              <label htmlFor="nm-email">Email</label>
              <input
                id="nm-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                required
              />
              <p className="lm-field-hint">
                È anche il nome utente con cui entrerà. Se esiste già un account, te lo dico.
              </p>
            </div>

            <div className="lm-field" data-wide="true">
              <label htmlFor="nm-pwd">Password iniziale</label>
              <div className="lm-campo-pwd">
                <input
                  id="nm-pwd"
                  name="password"
                  type={mostraPwd ? 'text' : 'password'}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostraPwd((v) => !v)}
                  aria-label={mostraPwd ? 'Nascondi la password' : 'Mostra la password'}
                >
                  {mostraPwd ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
              <p className="lm-field-hint">
                Almeno otto caratteri. Gliela dici a voce: da qui non si rilegge più.
              </p>
            </div>

            <div className="lm-field" data-wide="true">
              <label htmlFor="nm-role">Livello di accesso</label>
              <select id="nm-role" name="role" defaultValue="sales">
                <option value="sales">Venditore — i suoi clienti, il suo campo</option>
                <option value="admin">Amministratore — tutto, soldi compresi</option>
              </select>
              <p className="lm-field-hint">
                Nessuno dei due gestisce la squadra: quello è il titolare, e si assegna a mano.
              </p>
            </div>
          </div>

          <section className="lm-gm-sezione" style={{ marginTop: '1.1rem' }}>
            <h3 className="lm-label">cosa potrà vedere</h3>
            <p className="lm-field-hint">
              Si cambiano anche dopo, dal bottone «Gestisci» sulla sua card. Spento vuol dire che
              il database non gli manda quelle righe, non che l’interfaccia le nasconde.
            </p>
            <ul className="lm-gm-permessi">
              {PERMESSI.map((p) => (
                <li key={p}>
                  <Toggle
                    label={PERMESSO_LABEL[p]}
                    name={p}
                    checked={permessi[p]}
                    onChange={(v) => setPermessi((d) => ({ ...d, [p]: v }))}
                  />
                  <small>{PERMESSO_SPIEGA[p]}</small>
                </li>
              ))}
            </ul>
          </section>

          {errore && (
            <p className="lm-error" role="alert">
              {errore}
            </p>
          )}
        </div>

        <div className="lm-modal-actions">
          <button
            type="button"
            className="lm-btn"
            data-variant="ghost"
            onClick={() => chiudi(false)}
          >
            Annulla
          </button>
          <button type="submit" className="lm-btn" disabled={inCorso}>
            {inCorso ? 'Creo…' : 'Crea il membro'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
