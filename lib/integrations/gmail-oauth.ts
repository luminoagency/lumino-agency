/**
 * OAuth Gmail (sola lettura) per leggere le risposte ai cold outreach.
 *
 * Scope: gmail.readonly. Implementato con fetch verso le REST API di Google
 * (nessuna dipendenza aggiuntiva). I token vanno cifrati prima di salvarli
 * in gmail_oauth_tokens (vedi lib/outreach/crypto).
 *
 * ⚠️ Richiede credenziali Google Cloud non ancora configurate:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, (opz.) GOOGLE_OAUTH_REDIRECT_URI.
 * Vedi PIANO_B_CHECKLIST.md per la procedura di setup.
 */

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

export interface GmailTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: string // ISO
}

export interface InboxMessage {
  id: string
  from: string
  subject: string
  inReplyTo: string | null
  references: string | null
  receivedAt: string // ISO
  body: string
}

function clientId(): string {
  const v = process.env.GOOGLE_CLIENT_ID
  if (!v) throw new Error('GOOGLE_CLIENT_ID non configurata (vedi PIANO_B_CHECKLIST.md)')
  return v
}
function clientSecret(): string {
  const v = process.env.GOOGLE_CLIENT_SECRET
  if (!v) throw new Error('GOOGLE_CLIENT_SECRET non configurata (vedi PIANO_B_CHECKLIST.md)')
  return v
}
export function redirectUri(): string {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI) return process.env.GOOGLE_OAUTH_REDIRECT_URI
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://bylumino.com'
  return `${origin.replace(/\/$/, '')}/api/auth/gmail/callback`
}

/** URL a cui mandare l'utente per autorizzare la lettura della Gmail. */
export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: GMAIL_SCOPE,
    access_type: 'offline',     // serve per ottenere il refresh_token
    prompt: 'consent',          // forza il rilascio del refresh_token
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

/** Scambia il code OAuth per access_token + refresh_token. */
export async function exchangeCodeForTokens(code: string): Promise<GmailTokens> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Gmail token exchange fallito: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
  }
}

/** Rinnova l'access_token a partire dal refresh_token. */
export async function refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Gmail token refresh fallito: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken, // Google non rimanda il refresh_token nel refresh
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
  }
}

/** Email della casella collegata (per salvare account_email corretto). */
export async function getProfileEmail(accessToken: string): Promise<string> {
  const res = await fetch(`${GMAIL_API}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Gmail profile fallito: ${res.status}`)
  const data = await res.json()
  return data.emailAddress as string
}

/** Fetch dei messaggi inbox più recenti di `since` (ISO). */
export async function fetchInboxMessages(
  accessToken: string,
  since?: string | null,
): Promise<InboxMessage[]> {
  const headers = { Authorization: `Bearer ${accessToken}` }

  // Query: solo inbox, escludi i tuoi stessi invii, dopo `since`.
  const parts = ['in:inbox', '-from:me']
  if (since) {
    const epoch = Math.floor(new Date(since).getTime() / 1000)
    if (!isNaN(epoch)) parts.push(`after:${epoch}`)
  }
  const q = encodeURIComponent(parts.join(' '))

  const listRes = await fetch(`${GMAIL_API}/messages?q=${q}&maxResults=50`, { headers })
  if (!listRes.ok) throw new Error(`Gmail list fallito: ${listRes.status} ${await listRes.text()}`)
  const list = await listRes.json()
  const ids: string[] = (list.messages || []).map((m: any) => m.id)

  const out: InboxMessage[] = []
  for (const id of ids) {
    const msgRes = await fetch(`${GMAIL_API}/messages/${id}?format=full`, { headers })
    if (!msgRes.ok) continue
    const msg = await msgRes.json()
    out.push(parseMessage(msg))
  }
  return out
}

// ── Helpers di parsing ───────────────────────────────────────

function parseMessage(msg: any): InboxMessage {
  const headers: Array<{ name: string; value: string }> = msg.payload?.headers || []
  const h = (name: string) =>
    headers.find((x) => x.name.toLowerCase() === name.toLowerCase())?.value || ''
  const dateHeader = h('Date')
  return {
    id: msg.id,
    from: h('From'),
    subject: h('Subject'),
    inReplyTo: h('In-Reply-To') || null,
    references: h('References') || null,
    receivedAt: dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString(),
    body: extractPlainText(msg.payload),
  }
}

/** Cammina le parti del messaggio e ritorna il primo text/plain decodificato. */
function extractPlainText(payload: any): string {
  if (!payload) return ''
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const text = extractPlainText(part)
      if (text) return text
    }
  }
  // fallback: corpo diretto se presente
  if (payload.body?.data) return decodeBase64Url(payload.body.data)
  return ''
}

function decodeBase64Url(data: string): string {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/')
  try {
    return Buffer.from(b64, 'base64').toString('utf8')
  } catch {
    return ''
  }
}
