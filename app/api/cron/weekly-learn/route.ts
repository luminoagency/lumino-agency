import { NextResponse, type NextRequest } from 'next/server';
import { runWeeklyLearn } from '@/lib/ai/learn';

/**
 * Weekly self-improvement cron entry point.
 *
 * Triggered by a Vercel Cron job (see vercel.json, step 5). Verifies the
 * shared CRON_SECRET, then runs the learner: aggregate conversion data →
 * ask Claude → write a new active search_strategy → log to ai_logs.
 *
 * - runtime 'nodejs': uses the Anthropic + Supabase Node stack, not Edge.
 * - dynamic 'force-dynamic': never cache this handler.
 * - maxDuration 60: Hobby's configurable ceiling; the single Claude call plus
 *   a few small queries finish well within it.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when not configured
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runWeeklyLearn();
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
