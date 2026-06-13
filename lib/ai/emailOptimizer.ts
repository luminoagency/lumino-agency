import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { CLAUDE_MODEL, getClaude } from './claude';

/**
 * Weekly email-strategy optimizer.
 *
 * For each active strategy slot (1–5):
 *   1. Compute the live reply rate from emails_sent (attributed to the current
 *      version via created_at, matching the migration 0004 attribution rule).
 *   2. Update reply_rate and emails_sent_count on the strategy row.
 *   3. If the slot has enough data and is underperforming the cohort average,
 *      ask Claude (Opus + adaptive thinking) to rewrite the angle.
 *   4. Insert the new version as active, deactivate the old one.
 *
 * Called by runWeeklyLearn after the search-strategy update.
 */

/** Minimum sends before a slot is eligible for performance judgement. */
const MIN_SENDS_TO_JUDGE = 20;

/**
 * A slot is rewritten if its reply rate is below this fraction of the cohort
 * average. 0.7 = 30% below average triggers a rewrite.
 */
const UNDERPERFORM_RATIO = 0.7;

// ── Types ────────────────────────────────────────────────────

interface StrategyRow {
  id: string;
  strategy_number: number;
  version: number;
  subject_pattern: string;
  angle_description: string;
  prompt_brief: string;
  created_at: string;
  emails_sent_count: number;
  reply_rate: number | null;
}

export interface EmailOptimizeResult {
  updated: number;
  skipped: number;
  details: string[];
}

// ── Zod schema for Claude's rewrite output ───────────────────

const RewriteOutput = z.object({
  subject_pattern: z.string(),
  angle_description: z.string(),
  prompt_brief: z.string(),
  reasoning: z.string(),
});
type RewriteOutput = z.infer<typeof RewriteOutput>;

// ── Data layer ───────────────────────────────────────────────

/** Compute live reply rates from emails_sent for each active strategy. */
async function computeRates(
  db: SupabaseClient,
  strategies: StrategyRow[],
): Promise<Map<number, { sentCount: number; replyRate: number }>> {
  const rates = new Map<number, { sentCount: number; replyRate: number }>();

  for (const s of strategies) {
    // Attribution window: sends since this version was made active.
    const { data, error } = await db
      .from('emails_sent')
      .select('replied_at')
      .eq('strategy', s.strategy_number)
      .eq('status', 'sent')
      .gte('sent_at', s.created_at);
    if (error) throw error;

    const rows = data ?? [];
    const sentCount = rows.length;
    const replies = rows.filter((r) => r.replied_at !== null).length;
    rates.set(s.strategy_number, {
      sentCount,
      replyRate: sentCount > 0 ? replies / sentCount : 0,
    });
  }

  return rates;
}

/** Flush reply_rate and emails_sent_count back to the strategy row. */
async function updateStats(
  db: SupabaseClient,
  id: string,
  sentCount: number,
  replyRate: number,
): Promise<void> {
  const { error } = await db
    .from('email_strategies')
    .update({ emails_sent_count: sentCount, reply_rate: replyRate })
    .eq('id', id);
  if (error) throw error;
}

/** Deactivate the old version and insert the new one as active. */
async function saveNewVersion(
  db: SupabaseClient,
  strategyNumber: number,
  oldId: string,
  oldVersion: number,
  rewrite: RewriteOutput,
): Promise<void> {
  const { error: deErr } = await db
    .from('email_strategies')
    .update({ active: false })
    .eq('id', oldId);
  if (deErr) throw deErr;

  const { error: insErr } = await db.from('email_strategies').insert({
    strategy_number: strategyNumber,
    subject_pattern: rewrite.subject_pattern,
    angle_description: rewrite.angle_description,
    prompt_brief: rewrite.prompt_brief,
    version: oldVersion + 1,
    active: true,
    reasoning: rewrite.reasoning,
  });
  if (insErr) throw insErr;
}

// ── Claude call ──────────────────────────────────────────────

async function rewriteAngle(
  slot: StrategyRow,
  cohort: Array<{ number: number; replyRate: number; sentCount: number }>,
): Promise<RewriteOutput> {
  const perfLines = cohort
    .map(
      (p) =>
        `  Slot ${p.number}: ${(p.replyRate * 100).toFixed(1)}% reply rate` +
        ` (${p.sentCount} sends)`,
    )
    .join('\n');

  const system = `
You are optimizing cold outreach email angles for a small Italian digital agency that builds restaurant websites.
Each slot is a distinct honest framing for reaching a restaurant owner who has no website.

GUARDRAILS — preserved by code on every compose; your job is only to change the ANGLE:
- Italian language only.
- 5–6 lines of body text (enforced in code, not by the prompt_brief).
- Plain, personal, human tone. No marketing words, no exclamation marks.
- Every factual claim must be verifiable from lead data (name, city, rating, review count).
- Never impersonate a customer, invent a testimonial, or fabricate a referral.
- prompt_brief instructs the compose model — write it as a direct instruction, max 3 sentences.
- subject_pattern may contain {name} and {city} as placeholders.

Return strict JSON only.
`.trim();

  const user = `
Current reply rates across all slots:
${perfLines}

Slot ${slot.strategy_number} is underperforming. Current version (v${slot.version}):
  subject_pattern: "${slot.subject_pattern}"
  angle_description: "${slot.angle_description}"
  prompt_brief: "${slot.prompt_brief}"

Write a new angle for slot ${slot.strategy_number} that tries a different honest hook.
In "reasoning", briefly explain what you changed and why it should outperform the current version.
`.trim();

  const claude = getClaude();
  const response = await claude.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { format: zodOutputFormat(RewriteOutput) },
  });

  const parsed = response.parsed_output as RewriteOutput | null;
  if (!parsed) {
    throw new Error(
      `Claude did not return valid rewrite JSON (stop_reason: ${response.stop_reason})`,
    );
  }
  return parsed;
}

// ── Entry point ──────────────────────────────────────────────

export async function runEmailOptimizer(
  db: SupabaseClient,
): Promise<EmailOptimizeResult> {
  const { data: rows, error } = await db
    .from('email_strategies')
    .select(
      'id, strategy_number, version, subject_pattern, angle_description, prompt_brief, created_at, emails_sent_count, reply_rate',
    )
    .eq('active', true)
    .order('strategy_number');
  if (error) throw error;

  const strategies = (rows ?? []) as StrategyRow[];
  if (!strategies.length) {
    return { updated: 0, skipped: 0, details: ['no active strategies'] };
  }

  // Step 1: compute and persist live stats for every slot.
  const rates = await computeRates(db, strategies);
  for (const s of strategies) {
    const r = rates.get(s.strategy_number);
    if (r) await updateStats(db, s.id, r.sentCount, r.replyRate);
  }

  // Step 2: restrict judgement to slots with sufficient data.
  const judged = strategies.filter((s) => {
    const r = rates.get(s.strategy_number);
    return r && r.sentCount >= MIN_SENDS_TO_JUDGE;
  });

  const result: EmailOptimizeResult = { updated: 0, skipped: 0, details: [] };

  if (judged.length < 2) {
    const have = judged.length;
    result.skipped = strategies.length;
    result.details.push(
      `skipped: only ${have} slot(s) with >= ${MIN_SENDS_TO_JUDGE} sends (need >= 2 to judge)`,
    );
    return result;
  }

  const avgRate =
    judged.reduce((sum, s) => sum + (rates.get(s.strategy_number)?.replyRate ?? 0), 0) /
    judged.length;

  const cohort = strategies.map((s) => ({
    number: s.strategy_number,
    replyRate: rates.get(s.strategy_number)?.replyRate ?? 0,
    sentCount: rates.get(s.strategy_number)?.sentCount ?? 0,
  }));

  // Step 3: rewrite underperformers.
  for (const s of judged) {
    const r = rates.get(s.strategy_number)!;
    const label = `slot ${s.strategy_number} (${(r.replyRate * 100).toFixed(1)}% reply rate)`;

    if (r.replyRate >= avgRate * UNDERPERFORM_RATIO) {
      result.skipped += 1;
      result.details.push(`${label}: ok, no rewrite`);
      continue;
    }

    try {
      const rewrite = await rewriteAngle(s, cohort);
      await saveNewVersion(db, s.strategy_number, s.id, s.version, rewrite);
      result.updated += 1;
      result.details.push(
        `${label}: rewritten v${s.version}→v${s.version + 1} — ${rewrite.reasoning.slice(0, 120)}`,
      );
    } catch (err) {
      result.skipped += 1;
      result.details.push(
        `${label}: rewrite failed — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return result;
}
