-- ============================================================
-- Lumino Agency — Migration 0003: Outreach
-- Adds: outreach_accounts
-- Alters: emails_sent (turns it into the outreach send pipeline + log)
-- Target: Supabase (PostgreSQL)
-- ============================================================

begin;

-- ------------------------------------------------------------
-- outreach_accounts — the 4 Gmail senders + warm-up state.
-- Seeded inactive; flip active=true and set warmup_started_at
-- once a Gmail account + its Apps Script are actually set up.
-- Today's cap is derived from the warm-up ramp in code, not stored.
-- ------------------------------------------------------------
create table outreach_accounts (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique
                      check (name in ('outlumino1','outlumino2','outlumino3','outlumino4')),
  warmup_started_at date,                 -- null until the account goes live
  daily_cap_target  integer not null default 50,
  active            boolean not null default false,
  created_at        timestamptz not null default now()
);

insert into outreach_accounts (name) values
  ('outlumino1'), ('outlumino2'), ('outlumino3'), ('outlumino4');

-- ------------------------------------------------------------
-- emails_sent — extend the existing table into the outreach
-- send pipeline. It stays the dedup source the scraper checks.
-- ------------------------------------------------------------
alter table emails_sent
  add column account          text references outreach_accounts (name),
  add column step             text not null default 'initial'
                                check (step in ('initial','followup_3','followup_7')),
  add column status           text not null default 'sending'
                                check (status in ('sending','sent','failed','skipped')),
  add column body             text,
  add column token            text unique,        -- open-pixel + unsubscribe link
  add column gmail_message_id text,
  add column gmail_thread_id  text,
  add column claimed_at       timestamptz not null default now(),
  add column opened_at        timestamptz,
  add column replied_at       timestamptz,
  add column unsubscribed_at  timestamptz;

-- A claim row ('sending') isn't sent yet — sent_at is set on /report.
alter table emails_sent
  alter column sent_at drop not null,
  alter column sent_at drop default;

-- At most one active or sent message per (business, step). The claim insert
-- conflicts here if another account already grabbed the same lead/step —
-- this is the atomic no-double-send guard. Failed/skipped rows are excluded
-- so a lead can be re-attempted after a send failure.
create unique index uniq_outreach_active
  on emails_sent (restaurant_id, step)
  where status in ('sending','sent');

create index idx_emails_sent_status  on emails_sent (status);
create index idx_emails_sent_account on emails_sent (account);

commit;
