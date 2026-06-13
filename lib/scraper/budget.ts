import { scraperConfig } from './config';
import type { SpendKind } from './types';

/**
 * Tracks and enforces per-run API spend.
 *
 * Every Google Places call must pass through canSpendGoogle() / recordGoogle()
 * so a nightly run never exceeds the hard cap (default 200). Web lookups
 * (email stages 2-3, opening web-confirm) are counted separately and do NOT
 * consume the Google budget. A wall-clock deadline guards the Vercel Hobby
 * function timeout; the orchestrator stops and persists the cursor when
 * either limit is reached.
 *
 * Retries inside googlePlaces.ts are NOT counted separately — one logical
 * call (one method invocation) records one unit of spend, so the cap stays
 * predictable regardless of transient backoff.
 */
export class Budget {
  private googleCalls = 0;
  private webLookups = 0;
  private readonly breakdown: Record<SpendKind, number> = { search: 0, details: 0 };
  private readonly googleCap: number;
  private readonly webCap: number;
  private readonly deadlineMs: number;

  constructor(opts: { googleCap?: number; webCap?: number; startMs?: number } = {}) {
    this.googleCap = opts.googleCap ?? scraperConfig.maxGoogleCallsPerNight;
    this.webCap = opts.webCap ?? scraperConfig.maxWebLookupsPerNight;
    this.deadlineMs = (opts.startMs ?? Date.now()) + scraperConfig.batchDeadlineMs;
  }

  /** True if another Google Places call is within budget. */
  canSpendGoogle(): boolean {
    return this.googleCalls < this.googleCap;
  }

  /** Record one Google Places call of the given kind. Returns the new total. */
  recordGoogle(kind: SpendKind): number {
    this.breakdown[kind] += 1;
    this.googleCalls += 1;
    return this.googleCalls;
  }

  /** True if another web lookup is within budget. */
  canSpendWeb(): boolean {
    return this.webLookups < this.webCap;
  }

  /** Record one web lookup. Returns the new total. */
  recordWeb(): number {
    this.webLookups += 1;
    return this.webLookups;
  }

  /** True once the wall-clock time box for this run is exhausted. */
  pastDeadline(nowMs: number = Date.now()): boolean {
    return nowMs >= this.deadlineMs;
  }

  /** True when scanning should stop: Google budget or time exhausted. */
  shouldStop(nowMs: number = Date.now()): boolean {
    return !this.canSpendGoogle() || this.pastDeadline(nowMs);
  }

  get googleSpent(): number {
    return this.googleCalls;
  }

  get webSpent(): number {
    return this.webLookups;
  }

  get searchSpent(): number {
    return this.breakdown.search;
  }

  get detailsSpent(): number {
    return this.breakdown.details;
  }
}
