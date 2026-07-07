/**
 * Slot orari a 15 minuti per il form prenotazioni, generati DENTRO le fasce di
 * apertura del ristorante per il giorno della settimana della data scelta.
 *
 * - opening_hours configurato → slot solo nell'orario di apertura di quel giorno;
 *   giorno chiuso → nessuno slot.
 * - opening_hours assente → fallback pranzo 12:00–15:00 + cena 18:00–23:00.
 */

export type OpeningHours = Record<string, { open?: string; close?: string; closed?: boolean }>

// getDay(): 0 = domenica
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const STEP = 15

function toMin(t?: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '')
  if (!m) return null
  const h = +m[1], mm = +m[2]
  if (h > 23 || mm > 59) return null
  return h * 60 + mm
}
function fmt(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}
function genSlots(open: string, close: string): string[] {
  const o = toMin(open), c = toMin(close)
  if (o == null || c == null || c <= o) return []
  const start = Math.ceil(o / STEP) * STEP
  const out: string[] = []
  for (let m = start; m <= c - STEP; m += STEP) out.push(fmt(m))
  return out
}
function hasConfiguredHours(h?: OpeningHours | null): boolean {
  return !!h && Object.values(h).some(d => d && (d.closed || (d.open && d.close)))
}

/** Slot validi (HH:MM) per la data indicata. */
export function slotsForDate(dateStr: string, hours?: OpeningHours | null): string[] {
  if (!dateStr) return []
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return []
  if (!hasConfiguredHours(hours)) {
    return [...genSlots('12:00', '15:00'), ...genSlots('18:00', '23:00')]
  }
  const day = hours![DOW[d.getDay()]]
  if (!day || day.closed || !day.open || !day.close) return []
  return genSlots(day.open, day.close)
}

/** true solo se gli orari sono configurati E il ristorante è chiuso in quella data. */
export function isConfiguredClosed(dateStr: string, hours?: OpeningHours | null): boolean {
  if (!dateStr || !hasConfiguredHours(hours)) return false
  return slotsForDate(dateStr, hours).length === 0
}
