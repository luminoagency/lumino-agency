import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAvailableAccounts } from '@/lib/outreach/accounts';
import { compose } from '@/lib/outreach/compose';
import { getQueue } from '@/lib/outreach/queue';
import { releaseStaleClaims } from '@/lib/outreach/report';
import { getActiveStrategies, pickStrategy } from '@/lib/outreach/strategies';
import type { AccountName, ClaimInsert } from '@/lib/outreach/types';

/**
 * Outreach batch endpoint — called by each Gmail Apps Script at the start of
 * its send run. The script authenticates with OUTREACH_SECRET, identifies
 * itself via ?account=, and receives a batch of composed emails to send.
 *
 * Claim rows (status='sending') are inserted before the response is returned
 * so that two accounts polling simultaneously cannot claim the same lead.
 * Conflicts on the unique index are silently dropped via ignoreDuplicates.
 *
 * The script then sends each email and calls /api/outreach/report for each one.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.OUTREACH_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accountName = req.nextUrl.searchParams.get('account') as AccountName | null;
  if (!accountName) {
    return NextResponse.json({ error: 'Missing account param' }, { status: 400 });
  }

  const db = createAdminClient();

  // Release stale 'sending' claims from any previously crashed run.
  await releaseStaleClaims(db);

  // Check this account's remaining daily capacity.
  const available = await getAvailableAccounts(db);
  const slot = available.find((a) => a.account.name === accountName);
  if (!slot) {
    return NextResponse.json({ ok: true, batch: [], reason: 'no capacity' });
  }

  const limit = Math.min(slot.remaining, 50); // cap per-call batch
  const [queue, strategies] = await Promise.all([
    getQueue(db, limit),
    getActiveStrategies(db),
  ]);

  if (!queue.length || !strategies.length) {
    return NextResponse.json({ ok: true, batch: [] });
  }

  // For follow-up steps, look up the original thread ID (always from
  // step='initial') so the script can reply into the same Gmail thread.
  const followupRestaurantIds = queue
    .filter((q) => q.step !== 'initial')
    .map((q) => q.lead.id);

  const threadIdByRestaurantId = new Map<string, string>();
  if (followupRestaurantIds.length > 0) {
    const { data: threads } = await db
      .from('emails_sent')
      .select('restaurant_id, gmail_thread_id')
      .in('restaurant_id', followupRestaurantIds)
      .eq('step', 'initial')
      .eq('status', 'sent')
      .not('gmail_thread_id', 'is', null);
    for (const t of threads ?? []) {
      if (t.gmail_thread_id) {
        threadIdByRestaurantId.set(
          t.restaurant_id as string,
          t.gmail_thread_id as string,
        );
      }
    }
  }

  // Compose all emails in parallel (Haiku calls; fast enough for batch ≤50).
  const drafts = await Promise.all(
    queue.map((queued, index) =>
      compose({
        lead: queued.lead,
        strategy: pickStrategy(strategies, index),
        step: queued.step,
        priorSubject: queued.priorSubject,
      }),
    ),
  );

  // Insert claim rows. ignoreDuplicates silently drops any race-condition
  // conflicts; we then query back to find which tokens actually landed.
  const claims: ClaimInsert[] = drafts.map((draft, i) => ({
    restaurant_id: queue[i].lead.id,
    strategy: draft.strategyNumber,
    subject: draft.subject,
    body: draft.body,
    account: accountName,
    step: queue[i].step,
    status: 'sending' as const,
    token: draft.token,
  }));

  await db.from('emails_sent').insert(claims, { count: 'exact' });

  // Only return emails whose claim was actually inserted.
  const { data: confirmed } = await db
    .from('emails_sent')
    .select('token')
    .in('token', claims.map((c) => c.token));

  const confirmedTokens = new Set((confirmed ?? []).map((r) => r.token as string));

  const batch = drafts
    .map((draft, i) => ({
      token: draft.token,
      to: queue[i].lead.email,
      subject: draft.subject,
      body: draft.body,
      threadId: threadIdByRestaurantId.get(queue[i].lead.id) ?? null,
    }))
    .filter((item) => confirmedTokens.has(item.token));

  return NextResponse.json({ ok: true, batch });
}
