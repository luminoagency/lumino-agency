import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createAdminClient } from '../supabase/admin';
import { categories } from '../scraper/categories';
import { CLAUDE_MODEL, getClaude } from './claude';
import { runEmailOptimizer, type EmailOptimizeResult } from './emailOptimizer';
import { runWhatsAppOptimizer, type WhatsAppOptimizeResult } from './whatsappOptimizer';

/**
 * Weekly self-improvement (#4). Aggregates conversion data from Supabase,
 * asks Claude which city/category/profile shapes convert best, and writes a
 * new active search_strategy row. Every decision is logged to ai_logs.
 *
 * Claude only ranks and weights — it never writes SQL or mutates rows. The
 * nightly scraper picks up the new strategy on its next run (category order +
 * selection weights). City scan order stays governed by scan_state.priority_rank
 * (the user's fixed Milan→…→Naples order); prioritized_cities is recorded as
 * advisory only and does not reorder the scan queue.
 */

const PAID_STATUSES = new Set(['paid', 'building', 'delivered']);

/** One (city × category) conversion bucket. */
interface ConversionSegment {
  city: string;
  category: string;
  contacted: number;
  clients: number;
  paid: number;
  revenue: number;
  conversionPct: number;
}

/** Claude's output contract — validated before anything is persisted. */
const StrategyOutput = z.object({
  prioritized_cities: z.array(z.string()),
  prioritized_categories: z.array(z.string()),
  profile_weights: z.object({
    no_site: z.number(),
    underexposed: z.number(),
    newly_opened: z.number(),
    reviews: z.number(),
  }),
  reasoning: z.string(),
});
type StrategyOutput = z.infer<typeof StrategyOutput>;

/** Result of one weekly run. */
export interface LearnResult {
  status: 'updated' | 'skipped';
  version: number | null;
  segments: number;
  tokensUsed: number;
  note?: string;
  emailOptimizer?: EmailOptimizeResult;
  whatsappOptimizer?: WhatsAppOptimizeResult;
}

// ── Aggregation (plain SQL reads, no AI) ────────────────────

async function aggregateConversion(
  db: SupabaseClient,
): Promise<ConversionSegment[]> {
  const [emailsRes, clientsRes, paymentsRes] = await Promise.all([
    db.from('emails_sent').select('restaurant_id'),
    db.from('clients').select('id, restaurant_id, status, price'),
    db.from('payments').select('client_id, status, amount'),
  ]);
  if (emailsRes.error) throw emailsRes.error;
  if (clientsRes.error) throw clientsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const emails = emailsRes.data ?? [];
  const clients = clientsRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const contacted = new Set<string>();
  for (const e of emails) if (e.restaurant_id) contacted.add(e.restaurant_id);

  const clientByRestaurant = new Map<string, (typeof clients)[number]>();
  for (const c of clients) {
    if (c.restaurant_id && !clientByRestaurant.has(c.restaurant_id)) {
      clientByRestaurant.set(c.restaurant_id, c);
    }
  }

  const receivedByClient = new Map<string, number>();
  for (const p of payments) {
    if (p.status === 'received' && p.client_id) {
      receivedByClient.set(
        p.client_id,
        (receivedByClient.get(p.client_id) ?? 0) + Number(p.amount ?? 0),
      );
    }
  }

  // Resolve city/category for every restaurant that was contacted or entered
  // the pipeline.
  const restaurantIds = new Set<string>(contacted);
  for (const c of clients) if (c.restaurant_id) restaurantIds.add(c.restaurant_id);
  if (restaurantIds.size === 0) return [];

  const { data: rests, error: restErr } = await db
    .from('restaurants')
    .select('id, city, category')
    .in('id', [...restaurantIds]);
  if (restErr) throw restErr;

  const segments = new Map<string, ConversionSegment>();
  const keyFor = (city: string, category: string) => `${city}|${category}`;

  for (const r of rests ?? []) {
    const city = (r.city as string) ?? 'unknown';
    const category = (r.category as string) ?? 'unknown';
    const key = keyFor(city, category);
    let seg = segments.get(key);
    if (!seg) {
      seg = { city, category, contacted: 0, clients: 0, paid: 0, revenue: 0, conversionPct: 0 };
      segments.set(key, seg);
    }

    if (contacted.has(r.id)) seg.contacted += 1;

    const client = clientByRestaurant.get(r.id);
    if (client) {
      seg.clients += 1;
      const received = receivedByClient.get(client.id) ?? 0;
      const isPaid = PAID_STATUSES.has(client.status) || received > 0;
      if (isPaid) {
        seg.paid += 1;
        seg.revenue += received > 0 ? received : Number(client.price ?? 0);
      }
    }
  }

  const result = [...segments.values()];
  for (const s of result) {
    s.conversionPct = s.contacted > 0 ? (s.paid / s.contacted) * 100 : 0;
  }
  result.sort((a, b) => b.paid - a.paid || b.contacted - a.contacted);
  return result;
}

// ── Prompt + Claude call ────────────────────────────────────

function buildStatsDigest(segments: ConversionSegment[]): string {
  if (segments.length === 0) return '(no conversion data yet)';
  const top = segments.slice(0, 50);
  const rows = top.map(
    (s) =>
      `${s.city} / ${s.category}: contacted=${s.contacted}, clients=${s.clients}, ` +
      `paid=${s.paid}, revenue=${s.revenue.toFixed(2)}, conv=${s.conversionPct.toFixed(1)}%`,
  );
  return rows.join('\n');
}

async function askClaude(
  digest: string,
  current: {
    cities: string[];
    categories: string[];
    weights: Record<string, number>;
  },
): Promise<{ parsed: StrategyOutput; tokensUsed: number }> {
  const claude = getClaude();
  const validCategoryKeys = categories.map((c) => c.key);

  const system =
    'You optimize a lead-generation scraper for an agency that builds websites ' +
    'for Italian food & beverage businesses. Given per-segment conversion data ' +
    '(which cities, categories, and profiles turn cold leads into paying clients), ' +
    'you re-rank scan priorities and re-weight the lead-scoring signals to favor ' +
    'what converts. Be decisive but conservative when data is sparse — small ' +
    'samples should nudge weights, not swing them. Output strict JSON only.\n\n' +
    `Valid category keys (use only these in prioritized_categories): ${validCategoryKeys.join(', ')}.\n` +
    'profile_weights keys: no_site, underexposed, newly_opened, reviews. ' +
    'They should be non-negative and sum to roughly 1.0.';

  const user =
    `Current strategy:\n` +
    `- prioritized_cities: ${JSON.stringify(current.cities)}\n` +
    `- prioritized_categories: ${JSON.stringify(current.categories)}\n` +
    `- profile_weights: ${JSON.stringify(current.weights)}\n\n` +
    `Conversion data by segment (city / category):\n${digest}\n\n` +
    `Produce the next strategy. In "reasoning", briefly justify the changes ` +
    `relative to the current strategy and the data above.`;

  const response = await claude.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { format: zodOutputFormat(StrategyOutput) },
  });

  const parsed = response.parsed_output as StrategyOutput | null;
  if (!parsed) {
    throw new Error(
      `Claude did not return valid strategy JSON (stop_reason: ${response.stop_reason})`,
    );
  }

  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
  return { parsed, tokensUsed };
}

// ── Persistence ─────────────────────────────────────────────

async function saveStrategy(
  db: SupabaseClient,
  parsed: StrategyOutput,
): Promise<number> {
  const { data: maxRow, error: maxErr } = await db
    .from('search_strategy')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) throw maxErr;
  const nextVersion = ((maxRow?.version as number) ?? 0) + 1;

  // Deactivate the current active row first — the partial unique index allows
  // only one active strategy at a time.
  const { error: deactivateErr } = await db
    .from('search_strategy')
    .update({ active: false })
    .eq('active', true);
  if (deactivateErr) throw deactivateErr;

  const { error: insertErr } = await db.from('search_strategy').insert({
    version: nextVersion,
    active: true,
    prioritized_cities: parsed.prioritized_cities,
    prioritized_categories: parsed.prioritized_categories,
    profile_weights: parsed.profile_weights,
    reasoning: parsed.reasoning,
  });
  if (insertErr) throw insertErr;

  return nextVersion;
}

async function logDecision(
  db: SupabaseClient,
  fields: {
    inputSummary: string;
    outputSummary: string;
    tokensUsed: number;
  },
): Promise<void> {
  const { error } = await db.from('ai_logs').insert({
    action: 'weekly_learn',
    input_summary: fields.inputSummary.slice(0, 4000),
    output_summary: fields.outputSummary.slice(0, 4000),
    model: CLAUDE_MODEL,
    tokens_used: fields.tokensUsed,
  });
  if (error) throw error;
}

// ── Entry point ─────────────────────────────────────────────

export async function runWeeklyLearn(): Promise<LearnResult> {
  const db = createAdminClient();

  const segments = await aggregateConversion(db);
  const totalContacted = segments.reduce((n, s) => n + s.contacted, 0);

  // Cold start: nothing has been contacted yet, so there's nothing to learn.
  // Log the no-op (no Claude call) and leave the current strategy in place.
  if (totalContacted === 0) {
    await logDecision(db, {
      inputSummary: 'No outreach/conversion data yet.',
      outputSummary: 'Skipped: insufficient data to adjust strategy.',
      tokensUsed: 0,
    });
    return { status: 'skipped', version: null, segments: 0, tokensUsed: 0, note: 'no data' };
  }

  // Read the current active strategy to give Claude a baseline to adjust from.
  const { data: active, error: activeErr } = await db
    .from('search_strategy')
    .select('prioritized_cities, prioritized_categories, profile_weights')
    .eq('active', true)
    .maybeSingle();
  if (activeErr) throw activeErr;

  const digest = buildStatsDigest(segments);
  const { parsed, tokensUsed } = await askClaude(digest, {
    cities: (active?.prioritized_cities as string[]) ?? [],
    categories: (active?.prioritized_categories as string[]) ?? [],
    weights: (active?.profile_weights as Record<string, number>) ?? {},
  });

  const version = await saveStrategy(db, parsed);
  await logDecision(db, {
    inputSummary: `segments=${segments.length}, contacted=${totalContacted}\n${digest}`,
    outputSummary: `v${version}: ${parsed.reasoning}`,
    tokensUsed,
  });

  // Second phase: optimize email strategy angles based on reply rates.
  // Wrapped in try/catch so an optimizer failure never rolls back the
  // search-strategy update that already succeeded above.
  let emailOptimizer: EmailOptimizeResult | undefined;
  try {
    emailOptimizer = await runEmailOptimizer(db);
    await logDecision(db, {
      inputSummary: `email_optimizer: judging ${emailOptimizer.updated + emailOptimizer.skipped} slots`,
      outputSummary: emailOptimizer.details.join(' | '),
      tokensUsed: 0, // token cost is inside runEmailOptimizer; not summed here
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Email optimizer failed:', msg);
    emailOptimizer = { updated: 0, skipped: 0, details: [`error: ${msg}`] };
  }

  let whatsappOptimizer: WhatsAppOptimizeResult | undefined;
  try {
    whatsappOptimizer = await runWhatsAppOptimizer(db);
    await logDecision(db, {
      inputSummary: `whatsapp_optimizer: judging ${whatsappOptimizer.updated + whatsappOptimizer.skipped} approaches`,
      outputSummary: whatsappOptimizer.details.join(' | '),
      tokensUsed: 0,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('WhatsApp optimizer failed:', msg);
    whatsappOptimizer = { updated: 0, skipped: 0, details: [`error: ${msg}`] };
  }

  return { status: 'updated', version, segments: segments.length, tokensUsed, emailOptimizer, whatsappOptimizer };
}
