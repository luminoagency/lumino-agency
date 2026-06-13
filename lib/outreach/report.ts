import type { SupabaseClient } from '@supabase/supabase-js';
import { outreachConfig } from './config';

/**
 * Mark a claimed row as successfully sent.
 * Called by the Apps Script webhook after GmailApp.sendEmail confirms delivery.
 */
export async function markSent(
  db: SupabaseClient,
  token: string,
  gmailMessageId: string,
  gmailThreadId: string,
): Promise<void> {
  const { error } = await db
    .from('emails_sent')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      gmail_message_id: gmailMessageId,
      gmail_thread_id: gmailThreadId,
    })
    .eq('token', token)
    .eq('status', 'sending'); // guard: only advance a row that we own
  if (error) throw error;
}

/**
 * Mark a claimed row as failed so the lead re-enters the queue on the
 * next run. The error message is logged at the call site (API route) since
 * the schema has no error column on emails_sent.
 */
export async function markFailed(
  db: SupabaseClient,
  token: string,
): Promise<void> {
  const { error } = await db
    .from('emails_sent')
    .update({ status: 'failed' })
    .eq('token', token)
    .eq('status', 'sending');
  if (error) throw error;
}

/**
 * Release stale 'sending' claims that the Apps Script never reported back on.
 * Flips them to 'failed' so their leads re-enter the queue. Called at the
 * start of each nightly run before new claims are issued.
 * Returns the number of rows released.
 */
export async function releaseStaleClaims(db: SupabaseClient): Promise<number> {
  const cutoff = new Date(Date.now() - outreachConfig.claimTtlMs).toISOString();

  const { data, error } = await db
    .from('emails_sent')
    .update({ status: 'failed' })
    .eq('status', 'sending')
    .lt('claimed_at', cutoff)
    .select('id');
  if (error) throw error;
  return (data ?? []).length;
}
