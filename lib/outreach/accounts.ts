import type { SupabaseClient } from '@supabase/supabase-js';
import { outreachConfig } from './config';
import type { AccountName, OutreachAccount } from './types';

/**
 * Daily send cap for one account based on days elapsed since warm-up start.
 * Walks warmupRamp tiers in order; falls through to daily_cap_target when
 * the account is fully ramped. Returns 0 for accounts not yet started.
 */
export function dailyCap(account: OutreachAccount): number {
  if (!account.warmup_started_at) return 0;
  const daysSince = Math.floor(
    (Date.now() - new Date(account.warmup_started_at).getTime()) / 86_400_000,
  );
  for (const tier of outreachConfig.warmupRamp) {
    if (daysSince <= tier.upToDay) return tier.dailyCap;
  }
  return account.daily_cap_target;
}

/** Fetch all active Gmail sender accounts ordered by name. */
export async function getActiveAccounts(
  db: SupabaseClient,
): Promise<OutreachAccount[]> {
  const { data, error } = await db
    .from('outreach_accounts')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []) as OutreachAccount[];
}

/** Count emails confirmed sent (status='sent') today for one account (UTC day). */
export async function sentTodayCount(
  db: SupabaseClient,
  account: AccountName,
): Promise<number> {
  const todayUtc = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const { count, error } = await db
    .from('emails_sent')
    .select('id', { count: 'exact', head: true })
    .eq('account', account)
    .eq('status', 'sent')
    .gte('sent_at', `${todayUtc}T00:00:00Z`);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Returns active accounts that still have capacity today, each paired with
 * the number of remaining slots. Accounts not yet started (cap=0) are omitted.
 */
export async function getAvailableAccounts(
  db: SupabaseClient,
): Promise<Array<{ account: OutreachAccount; remaining: number }>> {
  const accounts = await getActiveAccounts(db);
  const result: Array<{ account: OutreachAccount; remaining: number }> = [];

  for (const account of accounts) {
    const cap = dailyCap(account);
    if (cap === 0) continue;
    const sent = await sentTodayCount(db, account.name);
    const remaining = cap - sent;
    if (remaining > 0) result.push({ account, remaining });
  }

  return result;
}
