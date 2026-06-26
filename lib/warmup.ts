/**
 * Limiti di invio durante il warmup della casella provvisoria.
 * Usati dalla dashboard /lumino-admin/outreach-queue per scoraggiare invii
 * oltre il limite giornaliero della settimana corrente.
 *
 * La "settimana" si calcola dal primo invio manuale storico (manually_sent_at).
 */
export const WARMUP_DAILY_LIMITS = {
  week1: 5,
  week2: 10,
  week3: 15,
  week4: 20,
  steady: 30, // dopo il warmup
} as const

export type WarmupKey = keyof typeof WARMUP_DAILY_LIMITS

export interface WarmupInfo {
  week: number // 1, 2, 3, 4, 5+ (5+ = steady)
  key: WarmupKey
  dailyLimit: number
}

/**
 * Dato il timestamp del PRIMO invio manuale (o null se nessun invio finora),
 * calcola in quale settimana di warmup siamo e il limite giornaliero.
 */
export function getWarmupInfo(firstSentISO: string | null): WarmupInfo {
  if (!firstSentISO) {
    return { week: 1, key: 'week1', dailyLimit: WARMUP_DAILY_LIMITS.week1 }
  }
  const first = new Date(firstSentISO).getTime()
  if (isNaN(first)) {
    return { week: 1, key: 'week1', dailyLimit: WARMUP_DAILY_LIMITS.week1 }
  }
  const days = Math.floor((Date.now() - first) / (1000 * 60 * 60 * 24))
  const week = Math.floor(days / 7) + 1
  const key: WarmupKey =
    week <= 1 ? 'week1' : week === 2 ? 'week2' : week === 3 ? 'week3' : week === 4 ? 'week4' : 'steady'
  return { week, key, dailyLimit: WARMUP_DAILY_LIMITS[key] }
}
