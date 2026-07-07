'use client'

import { useMemo, useRef, useState } from 'react'
import { slotsForDate, isConfiguredClosed, type OpeningHours } from '@/lib/sites/reservationSlots'

/**
 * Logica condivisa dei form prenotazione dei 5 template: stato, slot orari a 15
 * min dagli orari di apertura, e invio reale a POST /api/reservations.
 * Il markup/stile resta specifico di ogni template.
 */
export function useReservationForm(
  slug: string | undefined,
  hours: OpeningHours | undefined | null,
  ownerSlots?: string[],
) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const busy = useRef(false)

  const slots = useMemo(() => {
    if (ownerSlots && ownerSlots.length > 0) return ownerSlots
    return slotsForDate(date, hours)
  }, [ownerSlots, date, hours])

  const closed = isConfiguredClosed(date, hours) && !(ownerSlots && ownerSlots.length > 0)

  function pickDate(v: string) {
    setDate(v)
    setTime('') // gli slot cambiano col giorno: azzera la scelta
    setError(null)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy.current) return // anti doppio-invio
    setError(null)
    const fd = new FormData(e.currentTarget)
    const guestName = [fd.get('name'), fd.get('surname')].map(v => String(v || '').trim()).filter(Boolean).join(' ')
    const payload = {
      slug: slug || '',
      guestName,
      guestPhone: String(fd.get('phone') || '').trim(),
      guestEmail: String(fd.get('email') || '').trim(),
      date,
      time,
      guestsCount: parseInt(String(fd.get('people') || '0'), 10) || 0,
      notes: String(fd.get('notes') || '').trim(),
    }
    if (!payload.guestName || !payload.guestPhone || !payload.date || !payload.time || !payload.guestsCount) {
      setError('Compila nome, telefono, data, orario e numero di persone.')
      return
    }
    busy.current = true
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j.ok) setSubmitted(true)
      else setError(j.error || 'Invio non riuscito. Riprova o chiama il ristorante.')
    } catch {
      setError('Errore di rete. Riprova.')
    } finally {
      setSubmitting(false)
      busy.current = false
    }
  }

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), [])

  return { submitted, submitting, error, date, pickDate, time, setTime, slots, closed, onSubmit, todayISO }
}
