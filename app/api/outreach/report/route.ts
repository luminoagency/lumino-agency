import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { markFailed, markSent } from '@/lib/outreach/report';

/**
 * Send-result webhook — called by the Apps Script once per email after
 * GmailApp.sendEmail returns. Advances the claim row from 'sending' to
 * 'sent' (with Gmail IDs) or 'failed'.
 *
 * Expected body:
 *   { token: string, ok: boolean, messageId?: string, threadId?: string, error?: string }
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.OUTREACH_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { token, ok, messageId, threadId, error: sendError } = body as {
    token?: unknown;
    ok?: unknown;
    messageId?: unknown;
    threadId?: unknown;
    error?: unknown;
  };

  if (typeof token !== 'string' || typeof ok !== 'boolean') {
    return NextResponse.json({ error: 'token and ok are required' }, { status: 400 });
  }

  const db = createAdminClient();

  try {
    if (ok && typeof messageId === 'string' && typeof threadId === 'string') {
      await markSent(db, token, messageId, threadId);
    } else {
      if (sendError) console.error(`Send failed [${token}]:`, sendError);
      await markFailed(db, token);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
