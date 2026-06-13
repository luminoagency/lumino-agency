import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Reply-detected webhook — called by the Apps Script when it finds an inbound
 * reply to one of our Gmail threads (typically on a cron inside Apps Script).
 *
 * Marks the initial send row for that thread as replied. Follow-up sends share
 * the same gmail_thread_id; anchoring to step='initial' avoids double-updates
 * and keeps the replied signal on the row the learner reads for reply_rate.
 *
 * Expected body:
 *   { threadId: string, repliedAt: string }  // repliedAt is an ISO timestamp
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

  const { threadId, repliedAt } = body as { threadId?: unknown; repliedAt?: unknown };

  if (typeof threadId !== 'string' || typeof repliedAt !== 'string') {
    return NextResponse.json(
      { error: 'threadId and repliedAt are required' },
      { status: 400 },
    );
  }

  const db = createAdminClient();

  const { error } = await db
    .from('emails_sent')
    .update({ replied_at: repliedAt, replied: true })
    .eq('gmail_thread_id', threadId)
    .eq('step', 'initial')
    .is('replied_at', null); // idempotent — skip if already recorded

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
