-- ============================================================
-- Lumino Agency — Migration 0004: Email Strategy Versions
-- Adds: email_strategies (versioned, auto-optimized email content)
-- Written by the weekly email-optimizer; read by the compose system.
-- Separate from search_strategy (which governs scraper targeting).
-- Target: Supabase (PostgreSQL)
-- ============================================================

begin;

-- ------------------------------------------------------------
-- email_strategies — every version of every email "slot" (1-5).
-- Slot identity (strategy_number) is stable so A/B comparison
-- continues across rewrites; only the content of a slot evolves.
-- A version's performance is attributed by the send window:
--   emails_sent.strategy = N AND sent_at >= this version.created_at
-- (only one version per slot is active at a time, so this is clean).
-- ------------------------------------------------------------
create table email_strategies (
  id                uuid primary key default gen_random_uuid(),
  strategy_number   smallint not null check (strategy_number between 1 and 5),
  subject_pattern   text not null,
  angle_description text not null,
  prompt_brief      text not null,        -- per-slot angle; shared guardrails live in code
  version           integer not null,
  active            boolean not null default false,
  reply_rate        numeric(5,4),         -- 0.0000–1.0000; null until measured
  emails_sent_count integer not null default 0,
  reasoning         text,
  created_at        timestamptz not null default now(),
  unique (strategy_number, version)
);

-- Exactly one active version per slot at any time.
create unique index one_active_email_strategy
  on email_strategies (strategy_number)
  where active;

create index idx_email_strategies_slot
  on email_strategies (strategy_number, version);

-- ------------------------------------------------------------
-- Seed v1 — the 5 approved honest, human strategies.
-- Shared guardrails (Italian, 5-6 lines, no marketing words,
-- never impersonate a customer, facts must be true for the lead)
-- are enforced in code on every compose AND every AI rewrite,
-- so they are deliberately NOT duplicated into prompt_brief.
-- ------------------------------------------------------------
insert into email_strategies
  (strategy_number, subject_pattern, angle_description, prompt_brief, version, active, reasoning)
values
  (1, 'Il sito di {name}',
      'Honest "it bugged me" note from someone who builds restaurant sites; gentle loss framing.',
      'Write as a real person who helps a few {city} restaurants with their site. Note honestly that {name} has no website (only a Google page, no menu or hours), and that people searching at night often stop there and go elsewhere. Offer to show something in two minutes, no pressure.',
      1, true, 'Initial seed (honest, human voice).'),

  (2, '{name}, una cosa veloce',
      'Genuine appreciation from the reviews (true), honest about role.',
      'Open by noting their reviews read well (use the real rating signal). Say you work on restaurant sites and that it is a shame they do not have one, because people look and cannot even find the menu. Ask softly to show an idea.',
      1, true, 'Initial seed (honest, human voice).'),

  (3, 'Vi cercano su Google, ma...',
      'The incomplete Google listing (verifiable from data).',
      'Point out plainly that their Google listing is missing menu, prices, and a place to book, and that searchers stop there and pick someone else. Say you help {city} restaurants put those online. Offer an example.',
      1, true, 'Initial seed (honest, human voice).'),

  (4, '{name}: una cosa sul passaparola',
      'Lost word-of-mouth; general truth, no fabricated friend.',
      'Observe that today recommending a place means sending a link to the site or menu, and that without one the word-of-mouth gets lost. Say you work on restaurant sites and offer to show how simply it is fixed.',
      1, true, 'Initial seed (honest, human voice).'),

  (5, 'Due minuti, {name}?',
      'Direct and honest; upfront about who is writing.',
      'Be upfront that you work with restaurants like theirs and noticed they have no site. Acknowledge it is not a priority, but say quietly that it costs them customers who cannot find them. Ask for two minutes.',
      1, true, 'Initial seed (honest, human voice).');

commit;
