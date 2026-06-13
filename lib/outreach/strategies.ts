import type { SupabaseClient } from '@supabase/supabase-js';
import type { EmailStrategy } from './types';

/** Fetch all currently active strategy versions (one per slot, ordered 1–5). */
export async function getActiveStrategies(
  db: SupabaseClient,
): Promise<EmailStrategy[]> {
  const { data, error } = await db
    .from('email_strategies')
    .select('*')
    .eq('active', true)
    .order('strategy_number');
  if (error) throw error;
  return (data ?? []) as EmailStrategy[];
}

/**
 * Round-robin assignment keyed on the lead's index in the current batch.
 * Distributes evenly across all 5 slots within a run without any extra DB
 * reads. The weekly AI learner uses reply_rate to swap in better strategy
 * versions; this picker just cycles whatever is currently active.
 */
export function pickStrategy(
  strategies: EmailStrategy[],
  index: number,
): EmailStrategy {
  if (!strategies.length) throw new Error('No active email strategies found');
  return strategies[index % strategies.length];
}

/**
 * Render the subject_pattern for a lead, substituting {name} and {city}.
 * City falls back to empty string rather than the literal "null".
 */
export function renderSubject(
  strategy: EmailStrategy,
  vars: { name: string; city: string | null },
): string {
  return strategy.subject_pattern
    .replace('{name}', vars.name)
    .replace('{city}', vars.city ?? '');
}
