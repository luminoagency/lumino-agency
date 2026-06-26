/**
 * Outreach-specific types.
 * snake_case fields match Supabase column names directly.
 */

/** Step in the send sequence — mirrors emails_sent.step constraint. */
export type OutreachStep = 'initial' | 'followup_3' | 'followup_7';

/** Send lifecycle status — mirrors emails_sent.status constraint.
 *  'ready_to_send' = generata in MANUAL_SEND_MODE, in attesa di invio manuale dalla coda. */
export type SendStatus = 'sending' | 'sent' | 'failed' | 'skipped' | 'ready_to_send';

/**
 * Sender identities — 4 mittenti @bylumino.com con prima persona.
 * I legacy outlumino1..4 sono stati rimossi dal DB dalla migration 0020.
 */
export type AccountName =
  | 'matteo' | 'francesca' | 'davide' | 'sara';

/** Voci umane parametriche (vedi lib/outreach/compose.ts). */
export type SenderVoice = 'matteo' | 'francesca' | 'davide' | 'sara';

/** Strategy slot number — mirrors email_strategies.strategy_number constraint. */
export type StrategyNumber = 1 | 2 | 3 | 4 | 5;

// ── DB row shapes ────────────────────────────────────────────

/** Row from outreach_accounts. */
export interface OutreachAccount {
  id: string;
  name: AccountName;
  warmup_started_at: string | null; // ISO date e.g. '2026-06-01'
  daily_cap_target: number;
  active: boolean;
  created_at: string;
}

/** Row from email_strategies. */
export interface EmailStrategy {
  id: string;
  strategy_number: StrategyNumber;
  subject_pattern: string;       // e.g. 'Il sito di {name}'
  angle_description: string;
  prompt_brief: string;
  version: number;
  active: boolean;
  reply_rate: number | null;     // 0.0000–1.0000; null until measured
  emails_sent_count: number;
  reasoning: string | null;
  created_at: string;
}

// ── Compose ─────────────────────────────────────────────────

/** Minimal lead shape the outreach system reads from restaurants. */
export interface OutreachLead {
  id: string;
  name: string;
  city: string | null;
  email: string;            // non-null — only leads with an email are queued
  stars: number | null;
  reviews_count: number | null;
}

/** Input to compose.ts. */
export interface ComposeInput {
  lead: OutreachLead;
  strategy: EmailStrategy;
  step: OutreachStep;
  /** Subject of the original email, required to thread follow-ups. */
  priorSubject?: string;
  /** Nome del mittente (es. 'Luca'). Usato per la firma e per scegliere la voce. */
  senderName?: string;
}

/** A fully rendered email ready to hand to the sender. */
export interface EmailDraft {
  subject: string;
  body: string;             // plain text with unsubscribe footer appended
  strategyNumber: StrategyNumber;
  token: string;            // stored in emails_sent; identifies this send for tracking
}

// ── Send pipeline ────────────────────────────────────────────

/** Row inserted into emails_sent to atomically claim a lead.
 *  status='sending' in invio automatico, 'ready_to_send' in MANUAL_SEND_MODE. */
export interface ClaimInsert {
  restaurant_id: string;
  strategy: StrategyNumber;
  subject: string;
  body: string;
  account: AccountName;
  step: OutreachStep;
  status: 'sending' | 'ready_to_send';
  token: string;
}

/** What the Apps Script webhook returns. */
export interface AppsScriptResponse {
  ok: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

/** Outcome of one send attempt, written back to emails_sent by the reporter. */
export interface SendResult {
  restaurantId: string;
  account: AccountName;
  step: OutreachStep;
  strategyNumber: StrategyNumber;
  status: SendStatus;
  gmailMessageId?: string;
  gmailThreadId?: string;
  error?: string;
}

// ── Run summary ──────────────────────────────────────────────

/** Logged to scrape_runs (or ai_logs) at the end of a nightly outreach run. */
export interface OutreachRunSummary {
  date: string;             // ISO date
  totalSent: number;
  totalFailed: number;
  totalSkipped: number;
  byAccount: Record<AccountName, number>;
  byStrategy: Partial<Record<StrategyNumber, number>>;
}
