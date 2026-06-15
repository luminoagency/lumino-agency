/**
 * Transactional email helper.
 *
 * In production, set RESEND_API_KEY env to send via resend.com (free tier: 100/day).
 * Without RESEND_API_KEY, emails are logged to console (dev) and a Sheets event is fired.
 *
 * Templates are plain text + inline HTML — no Mailchimp/Sendgrid template editor needed.
 */

import { postSheetEvent } from './googleSheets'

interface SendEmailInput {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const fromAddr = from || process.env.EMAIL_FROM || 'Lumino <noreply@bylumino.com>'

  if (!apiKey) {
    console.log('[email] (no provider configured)', { to, subject, fromAddr })
    return { ok: false, error: 'No email provider configured (set RESEND_API_KEY)' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromAddr, to, subject, html }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' }
  }
}

/* ─────────────────────────── TEMPLATES ─────────────────────────── */

interface ReservationTemplateInput {
  restaurantName: string
  guestName: string
  date: string  // ISO date
  time: string  // HH:MM
  persons: number
  address?: string
  phone?: string
  notes?: string
}

const baseShell = (accent: string, content: string) => `
<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>Lumino</title>
</head>
<body style="margin:0; padding:0; background:#f5f1ea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f1ea; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width: 560px; background:#fff; border-radius: 12px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding: 28px 32px 0;">
              <div style="font-family: Georgia, 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; color: #1a1a1a; letter-spacing: -0.01em;">
                Lumino<span style="color: ${accent};">.</span>
              </div>
            </td>
          </tr>
          ${content}
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #ececec; color: #888; font-size: 11px; text-align: center; letter-spacing: 0.05em;">
              Lumino Agency · Made in Italy
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

export async function sendReservationConfirmed(to: string, input: ReservationTemplateInput) {
  const dateNice = new Date(input.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const content = `
    <tr><td style="padding: 24px 32px 8px;">
      <p style="margin:0 0 4px; font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; color: #22c55e; font-weight: 700;">✓ Prenotazione confermata</p>
      <h1 style="margin: 0; font-family: Georgia, 'Cormorant Garamond', serif; font-size: 30px; font-weight: 400; font-style: italic; color: #1a1a1a; letter-spacing: -0.02em; line-height: 1.15;">
        Ti aspettiamo, ${input.guestName}.
      </h1>
    </td></tr>
    <tr><td style="padding: 8px 32px 24px; color: #555; font-size: 15px; line-height: 1.6;">
      <p style="margin: 0 0 18px;">Abbiamo confermato la tua prenotazione da <strong style="color: #1a1a1a;">${input.restaurantName}</strong>.</p>
      <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 14px 0 18px; background: #faf7f0; border-radius: 10px; padding: 18px;">
        <tr><td style="padding: 4px 0; color: #888; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Data</td><td align="right" style="color:#1a1a1a; font-weight: 600;">${dateNice}</td></tr>
        <tr><td style="padding: 4px 0; color: #888; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Ora</td><td align="right" style="color:#1a1a1a; font-weight: 600;">${input.time}</td></tr>
        <tr><td style="padding: 4px 0; color: #888; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Persone</td><td align="right" style="color:#1a1a1a; font-weight: 600;">${input.persons}</td></tr>
        ${input.address ? `<tr><td style="padding: 4px 0; color: #888; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Indirizzo</td><td align="right" style="color:#1a1a1a;">${input.address}</td></tr>` : ''}
      </table>
      <p style="margin: 0 0 4px; font-size: 14px;">Per qualsiasi modifica o cancellazione contatta direttamente il ristorante${input.phone ? ` al <strong style="color:#1a1a1a;">${input.phone}</strong>` : ''}.</p>
    </td></tr>
  `
  return sendEmail({ to, subject: `Prenotazione confermata · ${input.restaurantName}`, html: baseShell('#22c55e', content) })
}

export async function sendReservationCancelled(to: string, input: ReservationTemplateInput) {
  const dateNice = new Date(input.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const content = `
    <tr><td style="padding: 24px 32px 8px;">
      <p style="margin:0 0 4px; font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; color: #e52d1d; font-weight: 700;">— Prenotazione non confermata</p>
      <h1 style="margin: 0; font-family: Georgia, 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; font-style: italic; color: #1a1a1a; letter-spacing: -0.02em; line-height: 1.15;">
        Ci dispiace, ${input.guestName}.
      </h1>
    </td></tr>
    <tr><td style="padding: 8px 32px 24px; color: #555; font-size: 15px; line-height: 1.6;">
      <p style="margin: 0 0 14px;">Purtroppo <strong style="color:#1a1a1a;">${input.restaurantName}</strong> non ha potuto confermare la tua prenotazione per <strong>${dateNice} alle ${input.time}</strong> (${input.persons} ${input.persons === 1 ? 'persona' : 'persone'}).</p>
      <p style="margin: 0 0 14px;">Probabilmente in quella fascia oraria erano già al completo. Riprova con una data diversa o contatta direttamente il ristorante${input.phone ? ` al <strong style="color:#1a1a1a;">${input.phone}</strong>` : ''}.</p>
      <p style="margin: 16px 0 4px; font-size: 14px; color: #777;">Grazie per averci scelti — speriamo di vederti presto.</p>
    </td></tr>
  `
  return sendEmail({ to, subject: `Prenotazione non confermata · ${input.restaurantName}`, html: baseShell('#e52d1d', content) })
}

export async function sendReservationReceived(to: string, input: ReservationTemplateInput) {
  const dateNice = new Date(input.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const content = `
    <tr><td style="padding: 24px 32px 8px;">
      <p style="margin:0 0 4px; font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; font-weight: 700;">… in attesa di conferma</p>
      <h1 style="margin: 0; font-family: Georgia, 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; font-style: italic; color: #1a1a1a; letter-spacing: -0.02em; line-height: 1.15;">
        Abbiamo ricevuto la tua richiesta.
      </h1>
    </td></tr>
    <tr><td style="padding: 8px 32px 24px; color: #555; font-size: 15px; line-height: 1.6;">
      <p style="margin: 0 0 14px;">Ciao ${input.guestName}, abbiamo girato la tua richiesta a <strong style="color:#1a1a1a;">${input.restaurantName}</strong>. Riceverai una mail di conferma entro qualche ora.</p>
      <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 14px 0; background: #faf7f0; border-radius: 10px; padding: 18px;">
        <tr><td style="padding: 4px 0; color:#888; font-size:12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Data</td><td align="right" style="color:#1a1a1a; font-weight: 600;">${dateNice}</td></tr>
        <tr><td style="padding: 4px 0; color:#888; font-size:12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Ora</td><td align="right" style="color:#1a1a1a; font-weight: 600;">${input.time}</td></tr>
        <tr><td style="padding: 4px 0; color:#888; font-size:12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Persone</td><td align="right" style="color:#1a1a1a; font-weight: 600;">${input.persons}</td></tr>
      </table>
    </td></tr>
  `
  return sendEmail({ to, subject: `Richiesta ricevuta · ${input.restaurantName}`, html: baseShell('#1a1a1a', content) })
}

// Owner notification when a new reservation arrives
export async function sendOwnerReservationAlert(to: string, input: ReservationTemplateInput) {
  const dateNice = new Date(input.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const content = `
    <tr><td style="padding: 24px 32px 8px;">
      <p style="margin:0 0 4px; font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; color: #e52d1d; font-weight: 700;">★ nuova prenotazione</p>
      <h1 style="margin: 0; font-family: Georgia, 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; font-style: italic; color: #1a1a1a; letter-spacing: -0.02em; line-height: 1.15;">
        ${input.guestName} ha prenotato.
      </h1>
    </td></tr>
    <tr><td style="padding: 8px 32px 24px; color: #555; font-size: 15px; line-height: 1.6;">
      <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 14px 0 18px; background: #faf7f0; border-radius: 10px; padding: 18px;">
        <tr><td style="padding: 4px 0; color:#888; font-size:12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Quando</td><td align="right" style="color:#1a1a1a; font-weight: 600;">${dateNice} · ${input.time}</td></tr>
        <tr><td style="padding: 4px 0; color:#888; font-size:12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Persone</td><td align="right" style="color:#1a1a1a; font-weight: 600;">${input.persons}</td></tr>
        <tr><td style="padding: 4px 0; color:#888; font-size:12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Cliente</td><td align="right" style="color:#1a1a1a; font-weight: 600;">${input.guestName}</td></tr>
        ${input.notes ? `<tr><td style="padding: 4px 0; color:#888; font-size:12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">Note</td><td align="right" style="color:#1a1a1a;">${input.notes}</td></tr>` : ''}
      </table>
      <p style="margin: 0;">Accetta o rifiuta dal tuo pannello Lumino. Il cliente riceverà la mail di conferma in automatico.</p>
    </td></tr>
  `
  return sendEmail({ to, subject: `Nuova prenotazione · ${input.guestName}, ${input.persons} pers.`, html: baseShell('#e52d1d', content) })
}
