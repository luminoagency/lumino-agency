'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toggle } from '@/components/staff/Controls'
import {
  IMPOSTAZIONI_DEFAULT,
  MADHAB,
  METODI,
  leggiImpostazioni,
  leggiPosizione,
  scriviImpostazioni,
  type ImpostazioniSalat,
} from '@/lib/staff/salat'

/**
 * Gli interruttori del promemoria della preghiera.
 *
 * Qui c'è **l'interruttore generale**, che nel widget non può stare: un pannello
 * che contiene il bottone per farlo sparire è un bottone che si preme per errore
 * e poi non si ritrova più. Spento, del widget non resta niente sullo schermo, e
 * si riaccende da questa pagina.
 *
 * Le stesse preferenze si cambiano anche dal pannello del widget, e sono le
 * stesse chiavi di `localStorage`: due copie della stessa impostazione sarebbero
 * due modi di non capire quale vince. Il prezzo è che questa pagina non vede i
 * cambi fatti nel widget mentre è aperta — si rilegge riaprendola, e nessuno
 * tiene aperte le due cose insieme.
 */
export default function PreferenzeSalat() {
  const router = useRouter()
  const [imp, setImp] = useState<ImpostazioniSalat | null>(null)
  const [citta, setCitta] = useState('')

  useEffect(() => {
    setImp(leggiImpostazioni())
    setCitta(leggiPosizione()?.citta ?? '')
  }, [])

  function salva(patch: Partial<ImpostazioniSalat>) {
    const dopo = { ...(imp ?? IMPOSTAZIONI_DEFAULT), ...patch }
    setImp(dopo)
    scriviImpostazioni(dopo)
    /* Il widget sta nella shell, cioè in un altro albero di componenti: un
       refresh è il modo più corto di farglielo sapere senza inventare un canale
       di eventi fra due parti della pagina che non si conoscono. */
    router.refresh()
  }

  /* Finché non si è letto localStorage non si disegna niente: il server non sa
     cosa c'è dentro, e mostrare i default per poi correggerli sarebbe un
     interruttore che si muove da solo sotto gli occhi. */
  if (!imp) return <p className="lm-field-hint">…</p>

  return (
    <div className="lm-salat-prefs">
      <Toggle
        label="Mostra il promemoria della preghiera"
        checked={imp.attivo}
        onChange={(v) => salva({ attivo: v })}
      />
      <Toggle
        label="Mostra le ayat (nel pannello e nella home)"
        checked={imp.ayat}
        onChange={(v) => salva({ ayat: v })}
      />
      <Toggle
        label="Notifica del browser all’entrata dell’orario"
        checked={imp.notifiche}
        onChange={(v) => salva({ notifiche: v })}
      />

      <div className="lm-form">
        <label className="lm-field">
          <span className="lm-label">Metodo di calcolo</span>
          <select
            value={imp.metodo}
            disabled={!imp.attivo}
            onChange={(e) => salva({ metodo: e.target.value as never })}
          >
            {Object.entries(METODI).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="lm-field">
          <span className="lm-label">Madhab (per l’Asr)</span>
          <select
            value={imp.madhab}
            disabled={!imp.attivo}
            onChange={(e) => salva({ madhab: e.target.value as never })}
          >
            {Object.entries(MADHAB).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="lm-field">
          <span className="lm-label">Cambia ayah ogni (minuti)</span>
          <input
            type="number"
            min={5}
            max={240}
            step={5}
            value={imp.intervalloAyah}
            disabled={!imp.ayat}
            onChange={(e) => salva({ intervalloAyah: Number(e.target.value) })}
          />
        </label>

        <div className="lm-field">
          <span className="lm-label">Posizione</span>
          <p className="lm-sub" style={{ marginTop: 0 }}>
            {citta || 'Non impostata — la chiede il widget, dal suo pannello.'}
          </p>
        </div>
      </div>

      <p className="lm-field-hint">
        Gli orari si calcolano sul dispositivo con la libreria <code>adhan</code>: nessun servizio
        esterno, nessuna chiave, funziona anche senza rete. La posizione e queste preferenze restano
        su questo browser e non vanno nel database.
      </p>
    </div>
  )
}
