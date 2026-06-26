import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { ApproachRow, WhatsAppApproach } from '../whatsapp/types';
import { CLAUDE_MODEL, getClaude } from './claude';

const MIN_CONVERSATIONS_TO_JUDGE = 10;
const UNDERPERFORM_RATIO = 0.7;

export interface WhatsAppOptimizeResult {
  updated: number;
  skipped: number;
  details: string[];
}

const RewriteOutput = z.object({
  prompt_brief: z.string(),
  angle_name: z.string(),
  reasoning: z.string(),
});
type RewriteOutput = z.infer<typeof RewriteOutput>;

// ── Data layer ───────────────────────────────────────────────

async function computeApproachRates(
  db: SupabaseClient,
  approaches: ApproachRow[],
): Promise<Map<number, { count: number; replyRate: number }>> {
  const rates = new Map<number, { count: number; replyRate: number }>();

  for (const a of approaches) {
    const { data, error } = await db
      .from('whatsapp_conversations')
      .select('stage')
      .eq('approach', a.approach_number)
      .gte('created_at', a.created_at);
    if (error) throw error;

    const rows = data ?? [];
    const total = rows.length;
    // Any stage past cold means the owner replied.
    const replied = rows.filter((r) => r.stage !== 'cold').length;
    rates.set(a.approach_number, {
      count: total,
      replyRate: total > 0 ? replied / total : 0,
    });
  }

  return rates;
}

async function updateApproachStats(
  db: SupabaseClient,
  id: string,
  count: number,
  replyRate: number,
): Promise<void> {
  const { error } = await db
    .from('whatsapp_approaches')
    .update({ conversations_count: count, reply_rate: replyRate })
    .eq('id', id);
  if (error) throw error;
}

async function saveNewVersion(
  db: SupabaseClient,
  approachNumber: WhatsAppApproach,
  oldId: string,
  oldVersion: number,
  triggerLogic: string,
  rewrite: RewriteOutput,
): Promise<void> {
  const { error: deErr } = await db
    .from('whatsapp_approaches')
    .update({ active: false })
    .eq('id', oldId);
  if (deErr) throw deErr;

  const { error: insErr } = await db.from('whatsapp_approaches').insert({
    approach_number: approachNumber,
    version: oldVersion + 1,
    active: true,
    angle_name: rewrite.angle_name,
    trigger_logic: triggerLogic,
    prompt_brief: rewrite.prompt_brief,
    reasoning: rewrite.reasoning,
  });
  if (insErr) throw insErr;
}

// ── Claude call ──────────────────────────────────────────────

async function rewriteApproach(
  slot: ApproachRow,
  cohort: Array<{ number: number; replyRate: number; count: number }>,
): Promise<RewriteOutput> {
  const perfLines = cohort
    .map(
      (p) =>
        `  Approach ${p.number}: ${(p.replyRate * 100).toFixed(1)}% reply rate` +
        ` (${p.count} conversations)`,
    )
    .join('\n');

  const system = `
You are optimizing WhatsApp cold-opening messages for a small Italian digital agency that builds websites for restaurants.

Each approach is a disguised opener — the Lumino team member does NOT reveal they work for an agency in the first message. They pose as a customer or interested person to start a natural conversation that leads to a reveal later.

RULES the new prompt_brief must follow:
- Italian restaurant owners receive these on WhatsApp. Extremely short (2-4 lines).
- Never mention websites, agencies, digital services, or any commercial intent.
- Must end with a question that forces a reply.
- Must sound like a real Italian person, not a template.
- The trigger audience for this slot is fixed — only the angle and wording change.

Return strict JSON only.
`.trim();

  const user = `
Current reply rates across all approaches:
${perfLines}

Approach ${slot.approach_number} ("${slot.angle_name}") is underperforming. Current version (v${slot.version}):
  prompt_brief: "${slot.prompt_brief}"

Trigger audience: ${slot.trigger_logic}

Write a new prompt_brief for approach ${slot.approach_number} that tries a different angle within the same trigger audience.
In "reasoning", briefly explain what you changed and why it should outperform.
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
      `WhatsApp optimizer did not return valid JSON (stop_reason: ${response.stop_reason})`,
    );
  }
  return parsed;
}

// ── Entry point ──────────────────────────────────────────────

export async function runWhatsAppOptimizer(
  db: SupabaseClient,
): Promise<WhatsAppOptimizeResult> {
  const { data: rows, error } = await db
    .from('whatsapp_approaches')
    .select(
      'id, approach_number, version, angle_name, trigger_logic, prompt_brief, reply_rate, conversations_count, created_at',
    )
    .eq('active', true)
    .order('approach_number');
  if (error) throw error;

  const approaches = (rows ?? []) as ApproachRow[];
  if (!approaches.length) {
    return { updated: 0, skipped: 0, details: ['no active approaches'] };
  }

  const rates = await computeApproachRates(db, approaches);
  for (const a of approaches) {
    const r = rates.get(a.approach_number);
    if (r) await updateApproachStats(db, a.id, r.count, r.replyRate);
  }

  const judged = approaches.filter((a) => {
    const r = rates.get(a.approach_number);
    return r && r.count >= MIN_CONVERSATIONS_TO_JUDGE;
  });

  const result: WhatsAppOptimizeResult = { updated: 0, skipped: 0, details: [] };

  if (judged.length < 2) {
    result.skipped = approaches.length;
    result.details.push(
      `skipped: only ${judged.length} approach(es) with >= ${MIN_CONVERSATIONS_TO_JUDGE} conversations (need >= 2 to judge)`,
    );
    return result;
  }

  const avgRate =
    judged.reduce((sum, a) => sum + (rates.get(a.approach_number)?.replyRate ?? 0), 0) /
    judged.length;

  const cohort = approaches.map((a) => ({
    number: a.approach_number,
    replyRate: rates.get(a.approach_number)?.replyRate ?? 0,
    count: rates.get(a.approach_number)?.count ?? 0,
  }));

  for (const a of judged) {
    const r = rates.get(a.approach_number)!;
    const label = `approach ${a.approach_number} "${a.angle_name}" (${(r.replyRate * 100).toFixed(1)}%)`;

    if (r.replyRate >= avgRate * UNDERPERFORM_RATIO) {
      result.skipped += 1;
      result.details.push(`${label}: ok, no rewrite`);
      continue;
    }

    try {
      const rewrite = await rewriteApproach(a, cohort);
      await saveNewVersion(
        db,
        a.approach_number,
        a.id,
        a.version,
        a.trigger_logic,
        rewrite,
      );
      result.updated += 1;
      result.details.push(
        `${label}: rewritten v${a.version}→v${a.version + 1} — ${rewrite.reasoning.slice(0, 120)}`,
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
