import { NextResponse, type NextRequest } from 'next/server';
import { runScrapeBatch } from '@/lib/scraper/runScrapeBatch';

/**
 * Nightly scraper cron entry point.
 *
 * Triggered by a Vercel Cron job (see vercel.json, step 5). Vercel sends the
 * request with an `Authorization: Bearer <CRON_SECRET>` header, which we
 * verify before doing any work. Runs the discovery batch for the current city
 * and returns its summary.
 *
 * - runtime 'nodejs': the scraper uses the Node fetch/Supabase stack, not Edge.
 * - dynamic 'force-dynamic': never cache this handler.
 * - maxDuration 60: Hobby's configurable ceiling. The scraper's own 9s time
 *   box (config.batchDeadlineMs) is the real limiter; this just gives headroom
 *   so a slow Places call near the deadline can't get the function killed.
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
    const summary = await runScrapeBatch();
    const ok = summary.status !== 'error';
    return NextResponse.json({ ok, summary }, { status: ok ? 200 : 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
