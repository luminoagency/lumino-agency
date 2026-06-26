/**
 * Email transazionali Lumino.
 *
 * ⚠️ PIANO B — l'invio reale è gated da FEATURE_FLAGS.PRO_EMAIL_ACTIVE.
 * Finché è `false`, le funzioni NON inviano niente: loggano soltanto il
 * contenuto dell'email che sarebbe partita (così è verificabile in dev).
 * Quando le caselle pro sono attive (PRO_EMAIL_ACTIVE = true) parte l'invio
 * reale via SMTP Zoho, senza altre modifiche al codice chiamante.
 */

import nodemailer from 'nodemailer'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

/** I 4 mittenti ciclati per le email transazionali. */
export const TRANSACTIONAL_SENDERS = [
  { name: 'Matteo', email: 'matteo@bylumino.com', passwordEnv: 'ZOHO_SMTP_MATTEO_PASSWORD' },
  { name: 'Francesca', email: 'francesca@bylumino.com', passwordEnv: 'ZOHO_SMTP_FRANCESCA_PASSWORD' },
  { name: 'Davide', email: 'davide@bylumino.com', passwordEnv: 'ZOHO_SMTP_DAVIDE_PASSWORD' },
  { name: 'Sara', email: 'sara@bylumino.com', passwordEnv: 'ZOHO_SMTP_SARA_PASSWORD' },
] as const

export type TransactionalSender = (typeof TRANSACTIONAL_SENDERS)[number]

/** Sceglie il mittente in round-robin in base a un indice (es. numero di lead). */
export function pickCycledSender(index: number): TransactionalSender {
  const i = ((Math.trunc(index) % TRANSACTIONAL_SENDERS.length) + TRANSACTIONAL_SENDERS.length) %
    TRANSACTIONAL_SENDERS.length
  return TRANSACTIONAL_SENDERS[i]
}

export interface OutgoingEmail {
  to: string
  fromName: string
  fromEmail: string
  subject: string
  body: string // plain text
  replyTo?: string
}

/**
 * Punto unico di invio. Gated da PIANO B:
 *  - PRO_EMAIL_ACTIVE = false → logga soltanto, non invia (ritorna sent:false).
 *  - PRO_EMAIL_ACTIVE = true  → invio reale via SMTP Zoho.
 */
export async function dispatchTransactional(
  email: OutgoingEmail,
): Promise<{ sent: boolean; logged: boolean; error?: string }> {
  if (!FEATURE_FLAGS.PRO_EMAIL_ACTIVE) {
    console.log(
      '[transactional] PIANO B non attivo — email NON inviata (solo log):\n' +
        `From: "${email.fromName}" <${email.fromEmail}>\n` +
        `To: ${email.to}\n` +
        `Subject: ${email.subject}\n\n` +
        `${email.body}\n` +
        '─────────────────────────────',
    )
    return { sent: false, logged: true }
  }

  try {
    await sendViaSmtp(email)
    return { sent: true, logged: false }
  } catch (err: any) {
    console.error('[transactional] invio SMTP fallito:', err?.message || err)
    return { sent: false, logged: false, error: err?.message || 'Errore SMTP' }
  }
}

async function sendViaSmtp(email: OutgoingEmail): Promise<void> {
  const sender = TRANSACTIONAL_SENDERS.find((s) => s.email === email.fromEmail)
  const password = sender ? process.env[sender.passwordEnv] : undefined
  if (!password || password === 'PIANO_B_PENDING') {
    throw new Error(`Password SMTP mancante per ${email.fromEmail}`)
  }

  const transport = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.eu',
    port: Number(process.env.ZOHO_SMTP_PORT || 465),
    secure: true,
    auth: { user: email.fromEmail, pass: password },
  })

  await transport.sendMail({
    from: `"${email.fromName}" <${email.fromEmail}>`,
    to: email.to,
    subject: email.subject,
    text: email.body,
    replyTo: email.replyTo || email.fromEmail,
  })
}

// ── Builder: conferma al cliente (H.4) ───────────────────────

export function buildClientConfirmation(opts: {
  name: string
  restaurantName: string
  sender: { name: string }
}): { subject: string; body: string } {
  const subject = `Ciao ${opts.name}, abbiamo visto la tua richiesta`
  const body = `Ciao ${opts.name},

grazie per averci scritto. Ho dato un'occhiata a ${opts.restaurantName}
e ho qualche idea su come potremmo lavorarci.

Ti scrivo a breve con qualche dettaglio in più — non serve che
fai niente nel frattempo.

A presto,
${opts.sender.name}
Lumino`
  return { subject, body }
}

// ── Builder: notifica al team (H.5) ──────────────────────────

export function buildTeamNotification(opts: {
  leadId: string
  name: string
  restaurantName: string
  email: string
  phone: string
  wantsContact: boolean
  city?: string | null
  /** Blocco PROFILO già formattato (vedi route /api/inizia). */
  profileBlock: string
}): { subject: string; body: string } {
  const cityPart = opts.city ? ` — ${opts.city}` : ''
  const subject = `🍽️ Nuovo lead: ${opts.restaurantName}${cityPart}`
  const body = `Nuovo lead dal form /inizia:

CLIENTE
Nome: ${opts.name}
Locale: ${opts.restaurantName}
Email: ${opts.email}
Telefono: ${opts.phone}
Vuole essere ricontattato: ${opts.wantsContact ? 'Sì' : 'No'}

${opts.profileBlock}

→ Apri in dashboard: bylumino.com/lumino-admin/leads/${opts.leadId}`
  return { subject, body }
}
