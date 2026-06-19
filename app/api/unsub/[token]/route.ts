import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { suppressRestaurantByToken } from '@/lib/outreach/unsubGlobal';

/**
 * One-click unsubscribe endpoint. Appended as plain text to every outreach
 * email body. Sets unsubscribed_at on the emails_sent row and the legacy
 * `unsubscribed` boolean (used by the scraper's contact-history guard).
 *
 * Shows a plain Italian confirmation page. On DB error the page is still
 * shown — the token appears in server logs and can be replayed manually.
 *
 * No auth: the token itself is the credential (unique, unguessable UUID).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONFIRMATION_HTML = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cancellazione confermata</title>
  <style>
    body { font-family: sans-serif; max-width: 480px; margin: 80px auto; padding: 0 20px; color: #333; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <p>Sei stato rimosso dalla nostra lista. Non riceverai altri messaggi da parte nostra.</p>
</body>
</html>`;

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;

  try {
    const db = createAdminClient();
    // suppressRestaurantByToken: marca emails_sent.unsubscribed + restaurants.do_not_contact
    // così TUTTI e 4 i sender Zoho rispettano l'unsub globale (preflight.ts blocca).
    await suppressRestaurantByToken(db, token);
  } catch (err) {
    // Log but don't surface to the recipient.
    console.error(`Unsub error [${token}]:`, err instanceof Error ? err.message : err);
  }

  return new NextResponse(CONFIRMATION_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
