/**
 * Central configuration for the nightly outreach sender.
 * All tunables live here. Email strategy content (subject/body prompts)
 * lives in the email_strategies table and is read at runtime.
 */
export const outreachConfig = {
  // ── Send volume ───────────────────────────────────────────
  /** Total emails to send per nightly run across all accounts. */
  maxSendsPerRun: 200,

  // ── Warm-up ramp ─────────────────────────────────────────
  /**
   * Daily send cap per account as a function of days since warmup_started_at.
   * Evaluated in order; first matching tier wins. Once past all tiers the
   * account's daily_cap_target column (default 50) takes over.
   */
  warmupRamp: [
    { upToDay: 7,  dailyCap: 10 },
    { upToDay: 14, dailyCap: 20 },
    { upToDay: 21, dailyCap: 30 },
    { upToDay: 28, dailyCap: 40 },
  ],

  // ── Follow-up timing ─────────────────────────────────────
  /** Minimum days after the initial send before each follow-up fires. */
  followupDelayDays: {
    followup_3: 3,
    followup_7: 7,
  },

  // ── Claim TTL ────────────────────────────────────────────
  /**
   * A 'sending' row is considered stale after this many ms. If the Apps
   * Script webhook never reports back, the claim is released by a cleanup
   * cron so the lead can be re-attempted.
   */
  claimTtlMs: 5 * 60 * 1_000,

  // ── Compose guardrails (shared across all strategies) ─────
  /** Email must be written in this language (enforced in every compose call). */
  emailLanguage: 'Italian' as const,
  /** Target body length in lines. Passed to Claude as a constraint. */
  targetLines: { min: 5, max: 6 },

  // ── Tracking endpoints ────────────────────────────────────
  /** Path prefix for the 1×1 open-pixel. Full URL built at compose time. */
  trackingPathPrefix: '/api/t',
  /** Path prefix for the one-click unsubscribe endpoint. */
  unsubscribePathPrefix: '/api/unsub',
} as const;
