'use server'

/**
 * Server actions del super-admin (/lumino-admin).
 * Accessibili SOLO se l'utente loggato è nella SUPER_ADMINS allowlist.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { generateSiteContent } from '@/lib/pipeline/generate'
import { canGoLive } from '@/lib/payments/status'

const SUPER_ADMINS = ['bylumino06@gmail.com', 'siwaky.assistance@gmail.com']

async function assertSuperAdmin() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email || '')) {
    throw new Error('Non autorizzato')
  }
  return user
}

/** Forza la pipeline AI su un sito qualsiasi (anche di altri ristoratori). */
export async function adminGenerateSite(siteId: string) {
  try {
    await assertSuperAdmin()
    const r = await generateSiteContent({ siteId })
    if (!r.ok) return { ok: false, error: r.error }
    revalidatePath('/lumino-admin')
    revalidatePath('/sites/[slug]', 'page')
    return { ok: true, template: r.template }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/** Cambia lo status del sito (building → live → error).
 *  Gate: si può andare 'live' solo con il saldo (70%) confermato. */
export async function adminSetSiteStatus(siteId: string, status: 'building' | 'live' | 'error') {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()

    if (status === 'live') {
      const { data: siteRow } = await admin
        .from('sites')
        .select('final_payment_confirmed')
        .eq('id', siteId)
        .maybeSingle()
      if (!siteRow || !canGoLive(siteRow as { final_payment_confirmed: boolean })) {
        return { ok: false, error: 'Saldo finale non confermato, sito non pubblicabile' }
      }
    }

    const { error } = await admin.from('sites').update({ status }).eq('id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-admin')
    revalidatePath('/sites/[slug]', 'page')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/**
 * Conferma l'acconto (30%) di un sito. Sblocca la generazione del sito.
 * Flag manuale del super-admin; in futuro lo setterà il webhook del provider.
 */
export async function confirmFirstPayment(siteId: string) {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('sites')
      .update({
        first_payment_confirmed: true,
        first_payment_confirmed_at: new Date().toISOString(),
      })
      .eq('id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-admin')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/**
 * Conferma il saldo (70%) di un sito. Sblocca la pubblicazione.
 * Scrive anche il vecchio payment_confirmed = true per backward-compat
 * con eventuale codice non ancora migrato.
 */
export async function confirmFinalPayment(siteId: string) {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('sites')
      .update({
        final_payment_confirmed: true,
        final_payment_confirmed_at: new Date().toISOString(),
        payment_confirmed: true,
      })
      .eq('id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-admin')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/**
 * Marca un'email della coda come inviata manualmente (warmup).
 * status 'ready_to_send' → 'sent' + manually_sent_at/by.
 */
export async function markEmailManuallySent(emailId: string) {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('emails_sent')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        manually_sent_at: new Date().toISOString(),
        manually_sent_by: 'admin',
      })
      .eq('id', emailId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-admin/outreach-queue')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/**
 * Marca una risposta (email_replies) come inviata manualmente.
 * reply_status 'ready_to_send' → 'sent'.
 */
export async function markReplyManuallySent(replyId: string) {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('email_replies')
      .update({ reply_status: 'sent' })
      .eq('id', replyId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-admin/outreach-queue')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/** Cambia il tier (piano) di un sito. Usato quando l'utente passa di piano. */
export async function adminSetSiteTier(siteId: string, tier: 'basic' | 'pro' | 'premium') {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { error } = await admin.from('sites').update({ tier }).eq('id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-admin')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/** Approva una recensione in moderazione. */
export async function adminApproveReview(siteId: string, reviewIndex: number) {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { data: content } = await admin.from('site_content').select('reviews').eq('site_id', siteId).maybeSingle()
    const reviews: any[] = Array.isArray((content as any)?.reviews) ? (content as any).reviews : []
    if (!reviews[reviewIndex]) return { ok: false, error: 'Recensione non trovata' }
    reviews[reviewIndex] = { ...reviews[reviewIndex], show: true }
    const { error } = await admin.from('site_content').update({ reviews }).eq('site_id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-admin')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/** Elimina una recensione (anche già pubblicata). */
export async function adminDeleteReview(siteId: string, reviewIndex: number) {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const { data: content } = await admin.from('site_content').select('reviews').eq('site_id', siteId).maybeSingle()
    const reviews: any[] = Array.isArray((content as any)?.reviews) ? (content as any).reviews : []
    if (!reviews[reviewIndex]) return { ok: false, error: 'Recensione non trovata' }
    reviews.splice(reviewIndex, 1)
    const { error } = await admin.from('site_content').update({ reviews }).eq('site_id', siteId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-admin')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/** Pausa/Riprendi manualmente un account outreach (super-admin only). */
export async function adminToggleOutreachAccount(accountId: string, action: 'pause' | 'resume') {
  try {
    await assertSuperAdmin()
    const admin = createAdminClient()
    const update = action === 'pause'
      ? { status: 'paused', last_paused_at: new Date().toISOString() }
      : { status: 'warming', last_paused_at: null }
    const { error } = await admin.from('outreach_accounts').update(update).eq('id', accountId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/lumino-admin')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}

/** Aggrega tutti i dati diagnostici giornalieri + riassunto AI. */
export async function adminGetDiagnostics() {
  try {
    await assertSuperAdmin()

    const [
      { getEmailMetricsToday, getStrategyPerformanceToday, getWhatsAppMetricsToday, getAnomalies, getWinsToday },
      { generateDailySummary },
      { cacheGet, cacheSet, AI_SUMMARY_TTL },
    ] = await Promise.all([
      import('@/lib/diagnostics/daily'),
      import('@/lib/diagnostics/aiSummary'),
      import('@/lib/diagnostics/cache'),
    ])

    const [email, strategies, whatsapp, wins] = await Promise.all([
      getEmailMetricsToday(),
      getStrategyPerformanceToday(),
      getWhatsAppMetricsToday(),
      getWinsToday(),
    ])

    // Pass pre-computed WA response time to avoid double-fetching
    const anomalies = await getAnomalies(whatsapp.avg_response_time)

    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = `ai_summary_${today}`
    let aiSummary = cacheGet<string>(cacheKey)
    if (!aiSummary) {
      aiSummary = await generateDailySummary({ email, strategies, whatsapp, anomalies, wins })
      cacheSet(cacheKey, aiSummary, AI_SUMMARY_TTL)
    }

    return {
      ok: true,
      data: { email, strategies, whatsapp, anomalies, wins, aiSummary, generatedAt: new Date().toISOString() },
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore nel caricamento diagnostica' }
  }
}

/** Calcolo prezzo dinamico interno (usato dal calcolatore in dashboard). */
export async function adminCalculatePrice(input: {
  plan: 'basic' | 'pro' | 'premium'
  zone: 'milano' | 'romaCentro' | 'grandeCitta' | 'cittaMedia' | 'provincia' | 'paeseRurale'
  level: 'cinqueStelle' | 'altaFascia' | 'mediaFascia' | 'trattoria' | 'nuovoApertura'
}) {
  try {
    await assertSuperAdmin()
    const { computeDynamicPrice } = await import('@/lib/plans')
    const price = computeDynamicPrice(input.plan, input.zone, input.level)
    return { ok: true, price }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Errore' }
  }
}
