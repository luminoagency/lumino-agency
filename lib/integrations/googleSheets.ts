/**
 * Google Sheets integration.
 * Posts a row to a Google Apps Script web app whenever a relevant event happens.
 * The Apps Script is owned by outlumino@gmail.com and appends rows to a tracking sheet.
 *
 * Setup:
 *   1. In Apps Script (https://script.google.com), create a new project.
 *   2. Paste the contents of `scripts/google-sheets-sync.gs` into Code.gs.
 *   3. Deploy → New Deployment → Web app → "Execute as: Me", "Who has access: Anyone".
 *   4. Copy the deployment URL into env: GOOGLE_SHEETS_WEBHOOK_URL.
 *   5. The Sheet is created automatically on first POST.
 */

type SheetEvent =
  | { kind: 'signup'; email: string; restaurantName: string; plan?: string; ip?: string; userAgent?: string; referrer?: string }
  | { kind: 'login'; email: string; ip?: string }
  | { kind: 'plan_change'; email: string; from: string; to: string }
  | { kind: 'reservation'; email: string; restaurantName: string; guestName: string; date: string; persons: number }
  | { kind: 'site_published'; email: string; restaurantName: string; siteUrl: string }

export async function postSheetEvent(event: SheetEvent): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!url) {
    console.warn('[sheets] GOOGLE_SHEETS_WEBHOOK_URL not configured, skipping')
    return { ok: false, error: 'Sheets webhook not configured' }
  }

  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
    timestamp_it: new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }),
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Apps Script web apps follow redirects; allow them
      redirect: 'follow',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `Sheets HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (err: any) {
    console.warn('[sheets] post failed:', err?.message || err)
    return { ok: false, error: err?.message || 'Network error' }
  }
}
