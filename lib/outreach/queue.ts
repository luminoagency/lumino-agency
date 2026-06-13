import type { SupabaseClient } from '@supabase/supabase-js';
import { outreachConfig } from './config';
import type { OutreachLead, OutreachStep } from './types';

export interface QueuedLead {
  lead: OutreachLead;
  step: OutreachStep;
  /** Subject of the original send; required to thread follow-up replies. */
  priorSubject?: string;
}

/**
 * Leads with a found email that have never been contacted.
 *
 * Two-query approach: PostgREST has no NOT EXISTS, so we pull all
 * contacted IDs then exclude them. This is fine at our send rate
 * (~200/night). If the exclusion list grows past ~5 k rows, replace
 * with a DB view (outreach_queue_initial) and select from that instead.
 */
async function initialQueue(
  db: SupabaseClient,
  limit: number,
): Promise<QueuedLead[]> {
  const { data: contacted, error: e1 } = await db
    .from('emails_sent')
    .select('restaurant_id')
    .in('status', ['sending', 'sent']);
  if (e1) throw e1;

  const excludeIds = [
    ...new Set((contacted ?? []).map((r) => r.restaurant_id as string)),
  ];

  const base = db
    .from('restaurants')
    .select('id, name, city, email, stars, reviews_count')
    .not('email', 'is', null)
    .eq('email_status', 'found')
    .order('priority_score', { ascending: false, nullsFirst: false })
    .limit(limit);

  const { data, error: e2 } = await (excludeIds.length > 0
    ? base.not('id', 'in', `(${excludeIds.join(',')})`)
    : base);
  if (e2) throw e2;

  return (data ?? []).map((r) => ({
    lead: r as OutreachLead,
    step: 'initial' as const,
  }));
}

/**
 * Leads eligible for a follow-up: had a 'sent' row at the prior step,
 * enough days have elapsed, and the current step is not yet claimed.
 */
async function followupQueue(
  db: SupabaseClient,
  step: 'followup_3' | 'followup_7',
  limit: number,
): Promise<QueuedLead[]> {
  const priorStep = step === 'followup_3' ? 'initial' : 'followup_3';
  const delayDays = outreachConfig.followupDelayDays[step];
  const cutoff = new Date(Date.now() - delayDays * 86_400_000).toISOString();

  const { data: eligible, error: e1 } = await db
    .from('emails_sent')
    .select('restaurant_id, subject')
    .eq('step', priorStep)
    .eq('status', 'sent')
    .lte('sent_at', cutoff);
  if (e1) throw e1;
  if (!eligible?.length) return [];

  const { data: claimed, error: e2 } = await db
    .from('emails_sent')
    .select('restaurant_id')
    .eq('step', step)
    .in('status', ['sending', 'sent']);
  if (e2) throw e2;

  const claimedIds = new Set(
    (claimed ?? []).map((r) => r.restaurant_id as string),
  );
  const candidates = eligible
    .filter((r) => !claimedIds.has(r.restaurant_id))
    .slice(0, limit);
  if (!candidates.length) return [];

  const { data: leads, error: e3 } = await db
    .from('restaurants')
    .select('id, name, city, email, stars, reviews_count')
    .in('id', candidates.map((r) => r.restaurant_id as string))
    .not('email', 'is', null);
  if (e3) throw e3;

  const subjectById = Object.fromEntries(
    candidates.map((r) => [r.restaurant_id, r.subject as string | undefined]),
  );

  return (leads ?? []).map((r) => ({
    lead: r as OutreachLead,
    step,
    priorSubject: subjectById[r.id],
  }));
}

/**
 * Returns up to `limit` leads ready to send, filling initial outreach first
 * then follow-ups in order (followup_3 → followup_7).
 */
export async function getQueue(
  db: SupabaseClient,
  limit: number,
): Promise<QueuedLead[]> {
  const results: QueuedLead[] = [];

  results.push(...(await initialQueue(db, limit)));
  if (results.length >= limit) return results.slice(0, limit);

  results.push(...(await followupQueue(db, 'followup_3', limit - results.length)));
  if (results.length >= limit) return results.slice(0, limit);

  results.push(...(await followupQueue(db, 'followup_7', limit - results.length)));
  return results.slice(0, limit);
}
