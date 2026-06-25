type EventKind = 'signup' | 'login' | 'plan_change' | 'reservation' | 'site_published' | 'lead';

export async function trackEvent(kind: EventKind, data: Record<string, any>) {
  const url = process.env.LUMINO_SHEET_WEBHOOK_URL;
  const secret = process.env.LUMINO_SHEET_SECRET;
  if (!url || !secret) {
    console.error('[tracking] variabili env mancanti');
    return;
  }
  const now = new Date();
  const payload = {
    kind,
    secret,
    timestamp: now.toISOString(),
    timestamp_it: now.toLocaleString('it-IT', { timeZone: 'Europe/Rome' }),
    ...data,
  };
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[tracking] invio fallito:', err);
  }
}
