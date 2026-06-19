/**
 * Preflight check — esegui PRIMA di mandare una mail outreach.
 * Salta i lead che rischiano di danneggiare la reputazione del dominio.
 *
 * Check:
 *   1. Suppression globale: restaurants.do_not_contact = true → skip
 *   2. Email su dominio disposable (lista hardcoded di ~50 servizi) → skip
 *   3. Email aperta/replied negli ultimi 90 giorni → skip
 *   4. MX record valido per il dominio destinatario → skip se MX assente
 *
 * Ogni skip viene loggato in emails_sent con status='skipped' + error_message.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { promises as dns } from 'dns'

const DISPOSABLE_DOMAINS = new Set([
  '0-mail.com', '10minutemail.com', '20minutemail.com', 'anonbox.net',
  'discard.email', 'dispostable.com', 'dropmail.me', 'emailondeck.com',
  'fakemail.net', 'getairmail.com', 'getnada.com', 'guerrillamail.com',
  'inboxbear.com', 'mailcatch.com', 'maildrop.cc', 'mailinator.com',
  'mailnesia.com', 'mintemail.com', 'mohmal.com', 'moakt.com',
  'mytemp.email', 'mytrashmail.com', 'rhyta.com', 'sharklasers.com',
  'spambox.us', 'spamgourmet.com', 'tempinbox.com', 'tempmail.com',
  'tempmailo.com', 'temp-mail.org', 'temp-mail.io', 'throwawaymail.com',
  'trashmail.com', 'trashmail.net', 'yopmail.com', 'yopmail.fr',
  '33mail.com', 'guerrillamail.org', 'mailfa.tk', 'mvrht.net',
  'sneakmail.de', 'spambog.com', 'spammotel.com', 'spamspot.com',
  'tagyourself.com', 'tempemail.com', 'tempemail.net', 'tempemail.org',
])

const MX_CACHE = new Map<string, { ok: boolean; checkedAt: number }>()
const MX_CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24h

const RECENTLY_CONTACTED_DAYS = 90

interface LeadLike {
  id: string
  email: string | null
}

export interface PreflightResult {
  ok: boolean
  reason?: 'no_email' | 'disposable' | 'suppression' | 'recently_contacted' | 'no_mx'
}

export async function preflightCheck(db: SupabaseClient, lead: LeadLike): Promise<PreflightResult> {
  if (!lead.email) return { ok: false, reason: 'no_email' }
  const email = lead.email.toLowerCase().trim()
  const at = email.indexOf('@')
  if (at < 0) return { ok: false, reason: 'no_email' }
  const domain = email.slice(at + 1)

  // 1. Disposable
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, reason: 'disposable' }

  // 2. Suppression globale (do_not_contact)
  const { data: r } = await db
    .from('restaurants')
    .select('do_not_contact')
    .eq('id', lead.id)
    .maybeSingle()
  if (r?.do_not_contact === true) return { ok: false, reason: 'suppression' }

  // 3. Aperto/risposto negli ultimi 90 giorni → skip
  const cutoff = new Date(Date.now() - RECENTLY_CONTACTED_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: recent } = await db
    .from('emails_sent')
    .select('id')
    .eq('restaurant_id', lead.id)
    .or(`opened_at.gte.${cutoff},replied_at.gte.${cutoff}`)
    .limit(1)
  if (recent && recent.length > 0) return { ok: false, reason: 'recently_contacted' }

  // 4. MX record valido
  const mxOk = await hasMxRecord(domain)
  if (!mxOk) return { ok: false, reason: 'no_mx' }

  return { ok: true }
}

async function hasMxRecord(domain: string): Promise<boolean> {
  const cached = MX_CACHE.get(domain)
  if (cached && Date.now() - cached.checkedAt < MX_CACHE_TTL_MS) return cached.ok
  try {
    const records = await dns.resolveMx(domain)
    const ok = Array.isArray(records) && records.length > 0
    MX_CACHE.set(domain, { ok, checkedAt: Date.now() })
    return ok
  } catch {
    MX_CACHE.set(domain, { ok: false, checkedAt: Date.now() })
    return false
  }
}
