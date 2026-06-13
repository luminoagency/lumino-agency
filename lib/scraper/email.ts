import type { Budget } from './budget';
import { classifyWebsite } from './selection';
import type { EmailResult, RestaurantRow } from './types';

/**
 * Email discovery cascade (#3), in priority order:
 *   1. Scrape the business website            ← implemented
 *   2. Google search "[name] [city] email"    ← stubbed (no provider yet)
 *   3. Facebook / Instagram page              ← stubbed (no provider yet)
 *   4. Fallback                               ← email_status = 'manual_review'
 *
 * Stages 2–3 live behind EmailSearchProvider so a real web-search provider can
 * be dropped in later without touching callers. With no provider, the cascade
 * uses stage 1 only and otherwise flags the lead for manual review.
 */

/** Pluggable provider for the web-search stages (no implementation yet). */
export interface EmailSearchProvider {
  /** Stage 2: find an email via a general web search. */
  searchGoogle?(name: string, city: string): Promise<string | null>;
  /** Stage 3: find an email via the business's Facebook/Instagram page. */
  searchSocial?(
    name: string,
    city: string,
  ): Promise<{ email: string; source: 'facebook' | 'instagram' } | null>;
}

const UA =
  'Mozilla/5.0 (compatible; LuminoBot/1.0; +https://lumino.agency/bot)';
const FETCH_TIMEOUT_MS = 6_000;
const MAX_HTML_BYTES = 500_000;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const MAILTO_RE = /mailto:([^"'?>\s]+)/gi;
const IMG_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i;

/** Domains that are never a real business contact address. */
const JUNK_DOMAINS = [
  'example.com',
  'example.org',
  'sentry.io',
  'wix.com',
  'wixpress.com',
  'godaddy.com',
  'squarespace.com',
  'schema.org',
  'w3.org',
  'googleapis.com',
  'gstatic.com',
  'domain.com',
  'email.com',
  'yourdomain.com',
];

/** Local-parts that indicate a placeholder rather than a real inbox. */
const JUNK_LOCAL = ['noreply', 'no-reply', 'your', 'name', 'email', 'user', 'example'];

function isPlausibleEmail(email: string): boolean {
  if (IMG_EXT_RE.test(email)) return false;
  const [local, domain] = email.split('@');
  if (!local || !domain) return false;
  if (domain.length < 4 || !domain.includes('.')) return false;
  if (JUNK_LOCAL.includes(local)) return false;
  if (JUNK_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) return false;
  return true;
}

function extractEmails(html: string): string[] {
  const found = new Set<string>();

  for (const m of html.matchAll(MAILTO_RE)) {
    const e = decodeURIComponent(m[1]).trim().toLowerCase();
    if (e.includes('@') && isPlausibleEmail(e)) found.add(e);
  }
  for (const m of html.matchAll(EMAIL_RE)) {
    const e = m[0].trim().toLowerCase();
    if (isPlausibleEmail(e)) found.add(e);
  }

  return [...found];
}

/** Prefer same-domain and role-based (info@/contatti@) addresses. */
function pickBest(emails: string[], siteHost: string | null): string | null {
  if (emails.length === 0) return null;

  const host = siteHost?.replace(/^www\./, '') ?? null;
  const sameDomain = host
    ? emails.filter((e) => e.split('@')[1].includes(host))
    : [];
  const pool = sameDomain.length ? sameDomain : emails;

  const roleBased = pool.find((e) =>
    /^(info|contatti|contact|hello|prenotazioni|booking|ristorante|ciao)/.test(
      e.split('@')[0],
    ),
  );

  return roleBased ?? pool[0];
}

async function fetchText(url: string, budget?: Budget): Promise<string | null> {
  if (budget) {
    if (!budget.canSpendWeb()) return null;
    budget.recordWeb();
  }
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'user-agent': UA, accept: 'text/html' },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('text/html') && !ct.includes('text/plain')) return null;
    const text = await res.text();
    return text.slice(0, MAX_HTML_BYTES);
  } catch {
    return null; // timeout, DNS failure, bad TLS, etc.
  }
}

/** Stage 1: scrape the homepage and common contact pages for an email. */
async function scrapeWebsite(
  website: string,
  budget?: Budget,
): Promise<string | null> {
  let origin: string;
  let host: string;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    origin = url.origin;
    host = url.hostname;
  } catch {
    return null;
  }

  const targets = [
    website.startsWith('http') ? website : `https://${website}`,
    `${origin}/contatti`,
    `${origin}/contact`,
    `${origin}/chi-siamo`,
  ];

  const emails = new Set<string>();
  for (const target of targets) {
    if (budget && !budget.canSpendWeb()) break;
    const html = await fetchText(target, budget);
    if (!html) continue;
    for (const e of extractEmails(html)) emails.add(e);
    // Homepage already yielded something — good enough, stop spending lookups.
    if (emails.size > 0) break;
  }

  return pickBest([...emails], host);
}

export async function findEmail(
  row: RestaurantRow,
  opts: { provider?: EmailSearchProvider; budget?: Budget } = {},
): Promise<EmailResult> {
  const { provider, budget } = opts;

  // Stage 1 — website scrape (only for a real, non-social site).
  if (row.website && classifyWebsite(row.website) === 'real') {
    const email = await scrapeWebsite(row.website, budget);
    if (email) return { email, source: 'website', status: 'found' };
  }

  // Stage 2 — general web search (stubbed until a provider exists).
  if (provider?.searchGoogle && (!budget || budget.canSpendWeb())) {
    budget?.recordWeb();
    const email = await provider.searchGoogle(row.name, row.city ?? '');
    if (email) return { email, source: 'google', status: 'found' };
  }

  // Stage 3 — Facebook / Instagram (stubbed until a provider exists).
  if (provider?.searchSocial && (!budget || budget.canSpendWeb())) {
    budget?.recordWeb();
    const hit = await provider.searchSocial(row.name, row.city ?? '');
    if (hit) return { email: hit.email, source: hit.source, status: 'found' };
  }

  // Stage 4 — nothing found; flag for manual review.
  return { email: null, source: null, status: 'manual_review' };
}
